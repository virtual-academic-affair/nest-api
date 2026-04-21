export enum EmailLabel {
  ClassRegistration = 'classRegistration',
  Training = 'training',
  Graduation = 'graduation',
  Pending = 'pending',
}

export const EmailLabelLang: Record<string, Record<string, string>> = {
  [EmailLabel.ClassRegistration]: { vi: 'Đăng ký lớp', en: 'Class Registration', color: 'purple' },
  [EmailLabel.Training]: { vi: 'Đào tạo', en: 'Training', color: 'blue' },
  [EmailLabel.Graduation]: { vi: 'Tốt nghiệp', en: 'Graduation', color: 'green' },
  [EmailLabel.Pending]: { vi: 'Chờ', en: 'Pending', color: 'grey' },
  parent: { vi: 'VAA', en: 'VAA', color: 'grey' },
};

export type EmailLabelKey = keyof typeof EmailLabelLang;

export function getEmailLabelLang(label: string, lang = 'vi'): string {
  return EmailLabelLang[label]?.[lang] || label;
}
