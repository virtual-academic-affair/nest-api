export enum SystemLabel {
  ClassRegistration = 'classRegistration',
  Task = 'task',
  Inquiry = 'inquiry',
  Other = 'other',
}

export const SystemLabelLang: Record<SystemLabel | 'parent', Record<string, string>> = {
  [SystemLabel.ClassRegistration]: { vi: 'Đăng ký lớp', en: 'Class Registration', color: '#4986e7' },
  [SystemLabel.Task]: { vi: 'Công tác', en: 'Task', color: '#ffad46' },
  [SystemLabel.Inquiry]: { vi: 'Thắc mắc', en: 'Inquiry', color: '#16a765' },
  [SystemLabel.Other]: { vi: 'Khác', en: 'Other', color: '#f691b2' },

  parent: { vi: 'VAA', en: 'VAA', color: '#fb4c2f' },
};

export function getLangLabel(label: SystemLabel | 'parent', lang = 'vi'): string {
  return SystemLabelLang[label]?.[lang] || label;
}
