import { ConfigService } from '@nestjs/config';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { RegistrationAction } from '@class-registration/enums/registration-action.enum';
import { RegistrationStatus } from '@class-registration/enums/registration-status.enum';
import { EmailTemplate } from '@email/services/email-template.service';

export class ClassRegistrationTemplate extends EmailTemplate {
  private readonly classRegistration: ClassRegistration;

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

  protected getContent(): string {
    const itemsHtml = this.classRegistration.items
      .map((item, index) => {
        const action = this.actionConfig[item.action];
        const status = this.statusConfig[item.status];

        const detailsHtml =
          [
            `<span>- Nguyện vọng: ${action.label}</span>`,
            item.slotInfo && `<span>- Lớp HP: ${item.slotInfo}</span>`,
            item.isInCurriculum === false && `<span style="color: #EF4444;">- Ngoài CTDT</span>`,
          ]
            .filter(Boolean)
            .join('<br/>') || '';

        const rejectReasonsHtml = item.rejectReasons?.length
          ? item.rejectReasons.map((r) => `<div>- ${r}</div>`).join('')
          : '';

        return `
          <tr style="border-bottom: 1px solid #F3F4F6; color: #000000;">
            <td style="padding: 12px; text-align: center; color: #9CA3AF; width: 40px;">${index + 1}</td>
            <td style="padding: 12px;">
              <div>${item.subjectCode}</div>
              <div style="font-weight: bold; color: #000000;">${item.subjectName}</div>
            </td>
            <td style="padding: 12px; width: 80px; text-align: center;">${item.className || '-'}</td>
            <td style="padding: 12px; width: 200px;">
                ${detailsHtml}
              </span>
            </td>
            <td style="padding: 12px; white-space: nowrap; width: 112px; text-align: center;">
              <span style="width: 80px; font-size: 11px; display: inline-block; padding: 2px; border-radius: 9999px; font-weight: 500; background-color: ${
                status.color
              }1A; color: ${status.color};">
                ${status.label}
              </span>
            </td>
            <td style="padding: 12px; width: 200px;">${rejectReasonsHtml}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <div style="color: #374151; margin-bottom: 24px;">
        <p style="margin: 4px 0;"><strong>MSSV:</strong> ${this.classRegistration.studentCode}</p>
        <p style="margin: 4px 0;"><strong>Họ tên:</strong> ${this.classRegistration.studentName ?? '--'}</p>
        <p style="margin: 4px 0;"><strong>Niên khóa:</strong> ${this.classRegistration.academicYear ?? '--'}</p>
      </div>

      <h3 style="color: #1F2937; font-weight: bold; margin-bottom: 16px; letter-spacing: 0.025em; font-size: 21px">Danh sách đăng ký học phần</h3>
      <div style="overflow-x: auto;">
        <table style="width: 100%; border-collapse: collapse; table-layout: fixed;">
          <thead>
            <tr style="border-bottom: 1px solid #000000;">
              <th style="text-align: center; width: 40px; padding-bottom: 4px;">#</th>
              <th style="text-align: center; width: 128px; padding-bottom: 4px;">Học phần</th>
              <th style="text-align: center; width: 80px; padding-bottom: 4px;">Lớp HP</th>
              <th style="text-align: center; width: 200px; padding-bottom: 4px;">Thông tin lớp</th>
              <th style="text-align: center; width: 112px; padding-bottom: 4px;">Kết quả</th>
              <th style="text-align: center; width: 200px; padding-bottom: 4px;">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      
      <div style="margin-top: 16px;"> 
        Sinh viên vui lòng truy cập portal để kiểm tra lại thông tin kết quả đăng ký học phần 
        <a href="https://portal.ctdb.hcmus.edu.vn/sinh-vien/ket-qua-dkhp" style="font-style: normal; font-weight: bold; color: #4B5563; text-decoration: none;"> 
          tại đây
        </a>
      </div>
    `;
  }
}
