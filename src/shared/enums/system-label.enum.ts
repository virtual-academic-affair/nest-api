import { InquiryTypeLang } from '@inquiry/enums/inquiry-type.enum';

export enum SystemLabel {
  ClassRegistration = 'classRegistration',
  Task = 'task',
  Inquiry = 'inquiry',
  Other = 'other',
}

export type LabelKey = keyof typeof LabelLang;
export const LabelLang: Record<string, Record<string, string>> = {
  [SystemLabel.ClassRegistration]: { vi: 'Đăng ký lớp', en: 'Class Registration', color: '#4986e7' },
  [SystemLabel.Task]: { vi: 'Công tác', en: 'Task', color: '#ffad46' },
  [SystemLabel.Inquiry]: { vi: 'Thắc mắc', en: 'Inquiry', color: '#16a765' },
  [SystemLabel.Other]: { vi: 'Khác', en: 'Other', color: '#f691b2' },

  ...InquiryTypeLang,
  parent: { vi: 'VAA', en: 'VAA', color: '#fb4c2f' },
};

export const SystemLabelNesting = Object.fromEntries(
  Object.values(SystemLabel).map((key) => [key, LabelLang[key]]),
) as Record<SystemLabel, Record<string, string>>;

export function getLangLabel(label: string, lang = 'vi'): string {
  return LabelLang[label]?.[lang] || label;
}
