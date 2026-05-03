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
    [RegistrationAction.RequestOpen]: { label: 'Mở lớp', color: '#D97706' },
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
    const replyItems = this.classRegistration.items.filter((item) => item.action !== RegistrationAction.RequestOpen);
    const hasItems = replyItems.length > 0;
    const msg = this.classRegistration.message;
    const studentCode = msg?.studentCode;
    const studentName = msg?.student?.studentName ?? msg?.senderName;
    const items = hasItems
      ? replyItems.map((item) => {
          const action = this.actionConfig[item.action];
          const status = this.statusConfig[item.status];
          const code = (item.subjectCode ?? '').trim();
          const name = (item.subjectName ?? '').trim();
          const subjectLine = code && name ? `${code} - ${name}` : code || name || '—';

          return {
            subjectLine,
            className: (item.className ?? '').trim() || '—',
            actionLabel: action.label,
            statusLabel: status.label,
            statusColor: status.color,
            statusBg: status.color + '1A',
          };
        })
      : [];

    return {
      studentName: studentName ?? '—',
      studentCode: studentCode ?? '—',
      note: this.classRegistration.note,
      hasItems,
      items: items.map((item, index) => ({ ...item, displayIndex: index + 1 })),
    };
  }
}
