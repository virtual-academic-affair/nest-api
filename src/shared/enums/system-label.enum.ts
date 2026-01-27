export enum SystemLabel {
  ClassRegistration = 'classRegistration',
  Task = 'task',
  Inquiry = 'inquiry',
  Other = 'other',
}

export const SystemLabelLang: Record<SystemLabel, Record<string, string>> = {
  [SystemLabel.ClassRegistration]: {
    vi: 'Đăng ký lớp',
    en: 'Class Registration',
  },
  [SystemLabel.Task]: { vi: 'Công tác', en: 'Task' },
  [SystemLabel.Inquiry]: { vi: 'Thắc mắc', en: 'Inquiry' },
  [SystemLabel.Other]: { vi: 'Khác', en: 'Other' },
};

export function getLangLabel(label: SystemLabel, lang = 'vi'): string {
  return SystemLabelLang[label]?.[lang] || label;
}
