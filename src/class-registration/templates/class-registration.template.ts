import { ConfigService } from '@nestjs/config';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { EmailTemplateService } from '@email/services/email-send/email-template.service';

export class ClassRegistrationTemplate extends EmailTemplateService {
  private readonly classRegistration: ClassRegistration;
  protected templatePath = 'class-registration.hbs';

  constructor(configService: ConfigService, classRegistration: ClassRegistration) {
    super(configService);
    this.classRegistration = classRegistration;
  }

  private readonly actionConfig: Record<string, { label: string; color: string }> = {
    [RegistrationAction.Register]: { label: 'Đăng ký', color: '#2563EB' },
    [RegistrationAction.Cancel]: { label: 'Hủy', color: '#DC2626' },
    [RegistrationAction.RequestOpen]: { label: 'YC mở lớp', color: '#D97706' },
  };

  private readonly statusConfig: Record<string, { label: string; color: string }> = {
    [RegistrationStatus.Pending]: { label: 'Chờ', color: '#D97706' },
    [RegistrationStatus.Approved]: { label: 'Đã duyệt', color: '#059669' },
    [RegistrationStatus.Rejected]: { label: 'Từ chối', color: '#DC2626' },
  };

  protected getTitle(): string {
    return 'Thông báo kết quả đăng ký học phần';
  }

  protected getTemplateData(): Record<string, unknown> {
    const hasItems = this.classRegistration.items && this.classRegistration.items.length > 0;

    const items = hasItems
      ? this.classRegistration.items.map((item, index) => {
          const action = this.actionConfig[item.action];
          const status = this.statusConfig[item.status];

          const details: string[] = [];
          details.push(`Nguyện vọng: ${action.label}`);
          if (item.slotInfo) {
            details.push(`Lớp HP: ${item.slotInfo}`);
          }
          const isOutOfCurriculum = item.isInCurriculum === false;

          return {
            index: index + 1,
            subjectCode: item.subjectCode,
            subjectName: item.subjectName,
            className: item.className || '-',
            details,
            isOutOfCurriculum,
            statusLabel: status.label,
            statusColor: status.color,
            statusBg: status.color + '1A',
            rejectReasons: item.rejectReasons || [],
          };
        })
      : [];

    return {
      studentCode: this.classRegistration.studentCode ?? '--',
      studentName: this.classRegistration.studentName ?? '--',
      academicYear: this.classRegistration.academicYear ?? '--',
      note: this.classRegistration.note,
      hasItems,
      items: items.map((item, index) => ({
        ...item,
        displayIndex: ++index,
      })),
    };
  }
}
