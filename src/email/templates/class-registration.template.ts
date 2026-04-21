import { ConfigService } from '@nestjs/config';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { EmailTemplateService } from './email-template.service';

export class ClassRegistrationTemplate extends EmailTemplateService {
  protected templatePath = 'class-registration.hbs';

  constructor(
    configService: ConfigService,
    private readonly classRegistration: ClassRegistration,
  ) {
    super(configService);
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
    const studentInfo = this.classRegistration.message?.studentInfo;
    const items = hasItems
      ? this.classRegistration.items.map((item) => {
          const action = this.actionConfig[item.action];
          const status = this.statusConfig[item.status];
          const details: string[] = [`Nguyện vọng: ${action.label}`];

          return {
            subjectCode: item.subjectCode,
            subjectName: item.subjectName,
            className: item.className || '-',
            details,
            isOutOfCurriculum: item.isInCurriculum === false,
            statusLabel: status.label,
            statusColor: status.color,
            statusBg: status.color + '1A',
            note: item.note ?? '',
          };
        })
      : [];

    return {
      studentCode: studentInfo?.studentCode ?? '—',
      cohort: studentInfo?.cohort ?? '—',
      note: this.classRegistration.note,
      hasItems,
      items: items.map((item, index) => ({ ...item, displayIndex: index + 1 })),
    };
  }
}
