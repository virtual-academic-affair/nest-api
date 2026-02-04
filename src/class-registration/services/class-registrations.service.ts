import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { ResourceService } from '@shared/resource/services/resource.service';
import { ResourceQueryDto } from '@shared/resource/dtos/resource-query.dto';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { RegistrationItemDetail } from '@class-registration/entities/registration-item-detail.entity';
import { RegistrationQueryDto } from '@class-registration/dtos/registrations/query.dto';
import { CreateClassRegistrationDto, CreateRegistrationItemDto } from '@class-registration/dtos/registrations/create.dto';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';

@Injectable()
export class ClassRegistrationsService extends ResourceService<ClassRegistration> {
  protected searchableColumns = ['studentCode', 'studentName', 'emailId'];
  
  protected orderableColumns = ['id', 'academicYear', 'messageId', 'createdAt', 'updatedAt'];

  constructor(
    @InjectRepository(ClassRegistration)
    repository: Repository<ClassRegistration>,
    @InjectRepository(RegistrationItemDetail)
    private readonly itemDetailRepository: Repository<RegistrationItemDetail>
  ) {
    super(repository);
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<ClassRegistration>,
    queryDto: ResourceQueryDto
  ): void {
    const { studentCode, academicYear, status, action, orderBy } =
      queryDto as RegistrationQueryDto;

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

    if (status || action) {
      queryBuilder.innerJoin(`${this.entityName}.items`, 'items');

      if (status) {
        queryBuilder.andWhere('items.status = :status', { status });
      }

      if (action) {
        queryBuilder.andWhere('items.action = :action', { action });
      }
    }

    if (orderBy === 'priority') {
      queryBuilder
        .orderBy(`${this.entityName}.academicYear`, 'ASC')
        .addOrderBy(`${this.entityName}.createdAt`, 'ASC');
    }
  }

  async createRegistration(dto: CreateClassRegistrationDto): Promise<ClassRegistration> {
    const existing = await this.repository.findOne({
      where: { emailId: dto.emailId },
    });

    if (existing) {
      throw new ConflictException('Registration for this email already exists');
    }

    const registration = this.repository.create({
      emailId: dto.emailId,
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

  async findOneWithItems(id: number): Promise<ClassRegistration> {
    const registration = await this.repository.findOne({
      where: { id },
      relations: ['items'],
    });

    if (!registration) {
      throw new NotFoundException('Registration not found');
    }
    return registration;
  }

  async findAllWithPriority(queryDto: RegistrationQueryDto) {
    const queryBuilder = this.repository
      .createQueryBuilder(this.entityName)
      .leftJoinAndSelect(`${this.entityName}.items`, 'items');

    const { studentCode, academicYear, status, action } = queryDto;

    if (studentCode) {
      queryBuilder.andWhere(`${this.entityName}.studentCode = :studentCode`, { studentCode });
    }

    if (academicYear) {
      queryBuilder.andWhere(`${this.entityName}.academicYear = :academicYear`, { academicYear });
    }

    if (status) {
      queryBuilder.andWhere('items.status = :status', { status });
    }

    if (action) {
      queryBuilder.andWhere('items.action = :action', { action });
    }

    queryBuilder
      .orderBy(`${this.entityName}.academicYear`, 'ASC')
      .addOrderBy('items.isInCurriculum', 'DESC')
      .addOrderBy(`${this.entityName}.createdAt`, 'ASC');

    const page = Math.max(queryDto.page || 1);
    const limit = Math.min(Math.max(1, queryDto.limit || 10), 20);
    const skip = (page - 1) * limit;

    const [items, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      pagination: {
        total,
        currentPage: page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOpenRequestStats() {
    return await this.itemDetailRepository
      .createQueryBuilder('item')
      .select('item.subjectName', 'subjectName')
      .addSelect('COUNT(*)', 'requestCount')
      .where('item.action = :action', { action: RegistrationAction.REQUEST_OPEN })
      .groupBy('item.subjectName')
      .orderBy('COUNT(*)', 'DESC')
      .getRawMany();
  }

  async getOverviewStats() {
    const [totalRegistrations, pendingCount, approvedCount, rejectedCount] =
      await Promise.all([
        this.repository.count(),
        this.itemDetailRepository.count({ where: { status: RegistrationStatus.PENDING } }),
        this.itemDetailRepository.count({ where: { status: RegistrationStatus.APPROVED } }),
        this.itemDetailRepository.count({ where: { status: RegistrationStatus.REJECTED } }),
      ]);

    return {
      totalRegistrations,
      items: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        total: pendingCount + approvedCount + rejectedCount,
      },
    };
  }
}