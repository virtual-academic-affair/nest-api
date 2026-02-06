import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { RegistrationItemDetail } from '@class-registration/entities/registration-item-detail.entity';
import { QueryDto } from '@class-registration/dtos/class-registrations/query.dto';
import { ReplyDto, ReplyPreviewResponse } from '@class-registration/dtos/class-registrations/reply.dto';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { GoogleapisService } from '@email/services/googleapis.service';
import { MessagesService } from '@email/services/messages.service';
import { CreateClassRegistrationDto, CreateRegistrationItemDto } from '@class-registration/dtos/registrations/create.dto';

@Injectable()
export class ClassRegistrationsService extends ResourceService<ClassRegistration> {
  protected searchableColumns = ['studentCode', 'studentName'];

  protected orderableColumns = ['id', 'academicYear', 'messageId', 'createdAt', 'updatedAt'];

  constructor(
    @InjectRepository(ClassRegistration)
    repository: Repository<ClassRegistration>,
    @InjectRepository(RegistrationItemDetail)
    private readonly itemDetailRepository: Repository<RegistrationItemDetail>,
    private readonly googleapisService: GoogleapisService,
    private readonly messagesService: MessagesService
  ) {
    super(repository);
  }

  // Join items khi findAll
  protected withAll(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder.leftJoinAndSelect(`${this.entityName}.items`, 'items');
  }

  // Join items khi findOne
  protected withOne(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder.leftJoinAndSelect(`${this.entityName}.items`, 'items');
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<ClassRegistration>,
    queryDto: ResourceQueryDto
  ): void {
    const { studentCode, academicYear, status, action, orderBy } =
      queryDto as QueryDto;

    if (studentCode) {
      queryBuilder.andWhere(`${this.entityName}.studentCode = :studentCode`, {
        studentCode,
      });
    }

    if (academicYear) {
      queryBuilder.andWhere(`${this.entityName}.academicYear = :academicYear`, {
        academicYear,
      });
    }

    if (status) {
      queryBuilder.andWhere('items.status = :status', { status });
    }

    if (action) {
      queryBuilder.andWhere('items.action = :action', { action });
    }

    // Sắp xếp theo thứ tự ưu tiên
    // 1. Khóa học: Ưu tiên SV năm cuối/khóa cũ (academicYear ASC)
    // 2. Tính hợp lệ CTDT: Ưu tiên môn trong CTDT (isInCurriculum DESC)
    // 3. Thời gian: Ưu tiên email gửi trước (message.sentAt ASC, fallback createdAt)
    if (orderBy === 'priority') {
      queryBuilder
        .leftJoin(`${this.entityName}.message`, 'message')
        .orderBy(`${this.entityName}.academicYear`, 'ASC')
        .addOrderBy('items.isInCurriculum', 'DESC')
        .addOrderBy('COALESCE(message.sentAt, ' + this.entityName + '.createdAt)', 'ASC');
    }
  }

  private readonly DEFAULT_GREETING = 
    'Chào bạn,\n\nBộ phận quản lý đào tạo đã xem xét yêu cầu đăng ký môn học của bạn.\n\nVui lòng xem chi tiết bên dưới:';

  /**
   * Preview nội dung email reply (cho chế độ manual)
   * Trả về: to, subject, greeting, summary, fullBody để user xem/sửa
   */
  async previewReply(id: number): Promise<ReplyPreviewResponse> {
    const registration = await this.findOne(id);
    const message = await this.messagesService.findOne(registration.messageId!);
    const { greeting, summary, fullBody } = this.buildEmailContent(registration, this.DEFAULT_GREETING);

    return {
      to: message.senderEmail!,
      subject: message.subject || 'Re: Đăng ký môn học',
      greeting,
      summary,
      fullBody,
    };
  }

  /**
   * Gửi email reply
   * - Auto mode: chỉ cần greeting, hệ thống tự tạo full content
   * - Manual mode: gửi fullBody đã được user chỉnh sửa
   */
  async sendReply(id: number, dto: ReplyDto): Promise<{ success: boolean }> {
    const registration = await this.findOne(id);
    const message = await this.messagesService.findOne(registration.messageId!);

    let emailBody: string;

    if (dto.fullBody) {
      // Manual mode: sử dụng nội dung đã được user chỉnh sửa
      emailBody = dto.fullBody;
    } else {
      // Auto mode: tự tạo nội dung từ greeting
      const greeting = dto.greeting || this.DEFAULT_GREETING;
      const { fullBody } = this.buildEmailContent(registration, greeting);
      emailBody = fullBody;
    }

    await this.googleapisService.sendReply(
      message.senderEmail!,
      message.subject || 'Re: Đăng ký môn học',
      emailBody,
      message.headerMessageId
    );

    return { success: true };
  }

  /**
   * Build email content từ registration và greeting
   */
  private buildEmailContent(registration: ClassRegistration, greeting: string) {
    const groupedItems = this.groupItemsByAction(registration.items);
    const summary = this.formatItemsSummary(groupedItems);

    const fullBody = [
      greeting,
      '',
      '═══════════════════════════════════════',
      '📋 KẾT QUẢ XỬ LÝ ĐĂNG KÝ MÔN HỌC',
      '═══════════════════════════════════════',
      '',
      `👤 Sinh viên: ${registration.studentName || 'N/A'}`,
      `🆔 MSSV: ${registration.studentCode}`,
      '',
      summary,
      '',
      '═══════════════════════════════════════',
      'Nếu có thắc mắc, vui lòng phản hồi email này.',
    ].join('\n');

    return { greeting, summary, fullBody };
  }

  /**
   * Group registration items by action type
   * Detects class transfers (same subject, different class, REGISTER + CANCEL)
   */
  private groupItemsByAction(items: RegistrationItemDetail[]) {
    const transfers: Array<{
      cancelItem: RegistrationItemDetail;
      registerItem: RegistrationItemDetail;
    }> = [];
    const usedIds = new Set<number>();

    // Detect transfers: same subjectName, different className, REGISTER + CANCEL
    const cancelItems = items.filter((i) => i.action === RegistrationAction.CANCEL);
    const registerItems = items.filter((i) => i.action === RegistrationAction.REGISTER);

    for (const cancelItem of cancelItems) {
      const matchingRegister = registerItems.find(
        (r) =>
          r.subjectName === cancelItem.subjectName &&
          r.className !== cancelItem.className &&
          !usedIds.has(r.id)
      );

      if (matchingRegister) {
        transfers.push({ cancelItem, registerItem: matchingRegister });
        usedIds.add(cancelItem.id);
        usedIds.add(matchingRegister.id);
      }
    }

    return {
      transfers,
      register: registerItems.filter((i) => !usedIds.has(i.id)),
      cancel: cancelItems.filter((i) => !usedIds.has(i.id)),
      requestOpen: items.filter((i) => i.action === RegistrationAction.REQUEST_OPEN),
    };
  }

  /**
   * Format items summary grouped by action
   */
  private formatItemsSummary(grouped: {
    transfers: Array<{
      cancelItem: RegistrationItemDetail;
      registerItem: RegistrationItemDetail;
    }>;
    register: RegistrationItemDetail[];
    cancel: RegistrationItemDetail[];
    requestOpen: RegistrationItemDetail[];
  }): string {
    const sections: string[] = [];

    // Chuyển lớp (Transfer)
    if (grouped.transfers.length > 0) {
      sections.push(
        '🔀 CHUYỂN LỚP:',
        ...grouped.transfers.map((t) => this.formatTransferLine(t)),
        ''
      );
    }

    // Đăng ký lớp
    if (grouped.register.length > 0) {
      sections.push(
        '📚 ĐĂNG KÝ LỚP:',
        ...grouped.register.map((item) => this.formatItemLine(item)),
        ''
      );
    }

    // Hủy lớp
    if (grouped.cancel.length > 0) {
      sections.push(
        '🔄 HỦY LỚP:',
        ...grouped.cancel.map((item) => this.formatItemLine(item)),
        ''
      );
    }

    // Yêu cầu mở môn
    if (grouped.requestOpen.length > 0) {
      sections.push(
        '📝 YÊU CẦU MỞ MÔN:',
        ...grouped.requestOpen.map((item) => this.formatItemLine(item)),
        ''
      );
    }

    return sections.join('\n');
  }

  /**
   * Format a transfer line (combined CANCEL + REGISTER for same subject)
   */
  private formatTransferLine(transfer: {
    cancelItem: RegistrationItemDetail;
    registerItem: RegistrationItemDetail;
  }): string {
    const { cancelItem, registerItem } = transfer;

    // Determine combined status
    const bothApproved =
      cancelItem.status === RegistrationStatus.APPROVED &&
      registerItem.status === RegistrationStatus.APPROVED;
    const anyRejected =
      cancelItem.status === RegistrationStatus.REJECTED ||
      registerItem.status === RegistrationStatus.REJECTED;
    const anyPending =
      cancelItem.status === RegistrationStatus.PENDING ||
      registerItem.status === RegistrationStatus.PENDING;

    let statusIcon: string;
    let statusText: string;

    if (bothApproved) {
      statusIcon = '✅';
      statusText = 'Đã duyệt';
    } else if (anyRejected) {
      statusIcon = '❌';
      statusText = 'Từ chối';
    } else if (anyPending) {
      statusIcon = '⏳';
      statusText = 'Đang chờ xử lý';
    } else {
      statusIcon = '⏳';
      statusText = 'Đang chờ xử lý';
    }

    // Format: ✅ Toán cao cấp: Lớp A1 → Lớp A2 - Đã duyệt
    let line = `   ${statusIcon} ${cancelItem.subjectName}: ${cancelItem.className} → ${registerItem.className} → ${statusText}`;

    // Combine reject reasons if rejected
    if (anyRejected) {
      const reasons: string[] = [];
      if (cancelItem.status === RegistrationStatus.REJECTED && cancelItem.rejectReason) {
        reasons.push(`Hủy lớp cũ: ${cancelItem.rejectReason}`);
      }
      if (registerItem.status === RegistrationStatus.REJECTED && registerItem.rejectReason) {
        reasons.push(`Đăng ký lớp mới: ${registerItem.rejectReason}`);
      }
      if (reasons.length > 0) {
        line += `\n      💬 Lý do: ${reasons.join(' | ')}`;
      }
    }

    return line;
  }

  /**
   * Format a single item line with status
   */
  private formatItemLine(item: RegistrationItemDetail): string {
    const statusIcon =
      item.status === RegistrationStatus.APPROVED
        ? '✅'
        : item.status === RegistrationStatus.REJECTED
          ? '❌'
          : '⏳';

    const statusText =
      item.status === RegistrationStatus.APPROVED
        ? 'Đã duyệt'
        : item.status === RegistrationStatus.REJECTED
          ? 'Từ chối'
          : 'Đang chờ xử lý';

    // Format: ✅ Toán cao cấp (Lớp A1) - Đã duyệt
    let line = `   ${statusIcon} ${item.subjectName}`;

    if (item.className) {
      line += ` (${item.className})`;
    }

    if (item.slotInfo) {
      line += ` - ${item.slotInfo}`;
    }

    line += ` → ${statusText}`;

    // Add reject reason if rejected
    if (item.status === RegistrationStatus.REJECTED && item.rejectReason) {
      line += `\n      💬 Lý do: ${item.rejectReason}`;
    }

    return line;
  }

  /**
   * Tạo class registration
   * - HTTP: Admin tạo tay với full data
   * - gRPC: Service khác gọi với messageId (sau khi parse email)
   */
  async createRegistration(dto: CreateClassRegistrationDto): Promise<ClassRegistration> {
    const existing = await this.repository.findOne({
      where: { messageId: dto.messageId },
    });

    throwIf(existing, new ConflictException('Registration for this message already exists'));

    const registration = this.repository.create({
      messageId: dto.messageId,
      studentCode: dto.studentCode,
      academicYear: dto.academicYear,
      studentName: dto.studentName,
      items: dto.items.map((item) => this.createItemDetail(item)),
    });

    return await this.repository.save(registration);
  }

  private createItemDetail(item: CreateRegistrationItemDto): RegistrationItemDetail {
    const detail = new RegistrationItemDetail();
    detail.action = item.action;
    detail.subjectName = item.subjectName;
    detail.className = item.className;
    detail.subjectCode = item.subjectCode;
    detail.slotInfo = item.slotInfo;
    detail.isInCurriculum = item.isInCurriculum ?? false;
    detail.status = RegistrationStatus.PENDING;
    return detail;
  }

  /**
   * Thống kê
   * @param type 'overview' | 'register' | 'cancel' | 'request-open'
   */
  async getStats(type: 'overview' | 'register' | 'cancel' | 'request-open') {
    if (type === 'overview') {
      // Overview: tổng registrations + breakdown all items
      const totalRegistrations = await this.repository.count();
      const itemStats = await this.getItemStatsByAction();

      return {
        type: 'overview',
        totalRegistrations,
        ...itemStats,
      };
    }

    // Stats for specific action
    const actionMap = {
      register: RegistrationAction.REGISTER,
      cancel: RegistrationAction.CANCEL,
      'request-open': RegistrationAction.REQUEST_OPEN,
    };

    const stats = await this.getItemStatsByAction(actionMap[type]);

    return {
      type,
      ...stats,
    };
  }

  /**
   * Get item statistics by action (or all if no action specified)
   */
  private async getItemStatsByAction(action?: RegistrationAction) {
    const where = action ? { action } : {};

    const [total, pending, approved, rejected] = await Promise.all([
      this.itemDetailRepository.count({ where }),
      this.itemDetailRepository.count({ where: { ...where, status: RegistrationStatus.PENDING } }),
      this.itemDetailRepository.count({ where: { ...where, status: RegistrationStatus.APPROVED } }),
      this.itemDetailRepository.count({ where: { ...where, status: RegistrationStatus.REJECTED } }),
    ]);

    return {
      total,
      pending,
      approved,
      rejected,
    };
  }
}