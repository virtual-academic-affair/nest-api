export enum EmailLabel {
  ClassRegistration = 'classRegistration',
  Training = 'training',
  Graduation = 'graduation',
  Pending = 'pending',
}

export const EmailLabelLang: Record<string, Record<string, string>> = {
  [EmailLabel.ClassRegistration]: { vi: 'Đăng ký lớp', en: 'Class Registration', color: '#4986e7' },
  [EmailLabel.Training]: { vi: 'Đào tạo', en: 'Training', color: '#2da2bb' },
  [EmailLabel.Graduation]: { vi: 'Tốt nghiệp', en: 'Graduation', color: '#a479e2' },
  [EmailLabel.Pending]: { vi: 'Chờ', en: 'Pending', color: '#f6bf26' },
  parent: { vi: 'VAA', en: 'VAA', color: '#fb4c2f' },
};

export type EmailLabelKey = keyof typeof EmailLabelLang;

export const EmailLabelNesting = Object.fromEntries(
  Object.values(EmailLabel).map((key) => [key, EmailLabelLang[key]]),
) as Record<EmailLabel, Record<string, string>>;

export function getEmailLabelLang(label: string, lang = 'vi'): string {
  return EmailLabelLang[label]?.[lang] || label;
}

// Backward-compatible aliases for existing call sites.
export { EmailLabelLang as LabelLang };
export { EmailLabelNesting as SystemLabelNesting };
export { getEmailLabelLang as getLangLabel };
export type LabelKey = EmailLabelKey;
