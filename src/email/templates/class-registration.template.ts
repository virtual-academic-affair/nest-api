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
    [RegistrationAction.Register]: { label: 'Đăng ký', color: 'blue' },
    [RegistrationAction.Cancel]: { label: 'Hủy', color: 'red' },
    [RegistrationAction.RequestOpen]: { label: 'YC mở lớp', color: 'amber' },
  };

  private readonly statusConfig: Record<string, { icon: string; label: string; color: string }> = {
    [RegistrationStatus.Pending]: { icon: 'hourglass_empty', label: 'Chờ', color: 'amber' },
    [RegistrationStatus.Approved]: { icon: 'check_circle', label: 'Đã duyệt', color: 'emerald' },
    [RegistrationStatus.Rejected]: { icon: 'cancel', label: 'Từ chối', color: 'red' },
  };

  protected getTitle(): string {
    return 'Thông báo kết quả đăng ký lớp';
  }

  protected getContent(): string {
    const itemsHtml = this.classRegistration.items
      .map((item, index) => {
        const action = this.actionConfig[item.action];
        const status = this.statusConfig[item.status];

        const detailsHtml =
          [
            item.slotInfo && `<span>- Lớp HP: ${item.slotInfo}</span>`,
            item.isInCurriculum === false && `<span class="text-red-500">- Ngoài CTDT</span>`,
          ]
            .filter(Boolean)
            .join('<br/>') || '';

        const rejectReasonsHtml = item.rejectReasons?.length
          ? item.rejectReasons.map((r) => `<div>- ${r}</div>`).join('')
          : '';

        return `
          <tr class="border-b border-gray-100 text-black">
            <td class="p-3 text-center text-gray-400 w-10">${index + 1}</td>
            <td class="p-3 whitespace-nowrap w-24">${item.subjectCode || '-'}</td>
            <td class="p-3 w-64"><strong>${item.subjectName}</strong></td>
            <td class="p-3 w-20 text-center">${item.className || '-'}</td>
            <td class="p-3 w-40">${detailsHtml}</td>
            <td class="p-3 whitespace-nowrap w-28 text-center">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium 
              bg-${action.color}-100 text-${action.color}-800"> ${action.label} </span>
            </td>
            <td class="p-3 whitespace-nowrap w-28 text-center">
              <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[12px] font-medium bg-${
                status.color
              }-100 text-${status.color}-800">
                <span class="mr-1">${this.getIcon(status.icon)}</span>
                ${status.label}
              </span>
            </td>
            <td class="p-3 w-64">${rejectReasonsHtml}</td>
          </tr>
        `;
      })
      .join('');

    return `
      <div class="space-y-1 text-gray-700 mb-6">
        <p><strong>MSSV:</strong> ${this.classRegistration.studentCode}</p>
        <p><strong>Họ tên:</strong> ${this.classRegistration.studentName ?? '--'}</p>
        <p><strong>Niên khóa:</strong> ${this.classRegistration.academicYear ?? '--'}</p>
      </div>

      <h3 class="text-gray-800 font-bold mb-4 tracking-wide">Danh sách lớp tín chỉ</h3>
      <div class="overflow-x-auto">
        <table class="w-full border-collapse table-fixed">
          <thead>
            <tr class="border-b-2 border-black">
              <th class="text-center w-10">#</th>
              <th class="w-24">Mã MH</th>
              <th class="w-32">Tên MH</th>
              <th class="w-20">Lớp HP</th>
              <th class="w-40">Thông tin lớp</th>
              <th class="text-center w-28">Yêu cầu</th>
              <th class="text-center w-28">Kết quả</th>
              <th class="w-64">Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>
      </div>
      
      <div class="mt-4"> 
        Sinh viên vui lòng truy cập portal để kiểm tra lại thông tin kết quả đăng ký học phần 
        <a href="https://portal.ctdb.hcmus.edu.vn/sinh-vien/ket-qua-dkhp" class="not-italic font-bold text-gray-600 hover:text-blue-600"> 
          tại đây
        </a>.
      </div>
    `;
  }
}
