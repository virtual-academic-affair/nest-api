export enum EmailLabel {
  ClassRegistration = 'classRegistration',
  Training = 'training',
  Graduation = 'graduation',
  Pending = 'pending',
}

export type LabelKey = EmailLabel | 'parent';

export const LabelLang: Record<LabelKey, { vi: string; en: string; color: string }> = {
  [EmailLabel.ClassRegistration]: { vi: 'Đăng ký lớp', en: 'Class Registration', color: 'purple' },
  [EmailLabel.Training]: { vi: 'Đào tạo', en: 'Training', color: 'blue' },
  [EmailLabel.Graduation]: { vi: 'Tốt nghiệp', en: 'Graduation', color: 'green' },
  [EmailLabel.Pending]: { vi: 'Chờ', en: 'Pending', color: 'grey' },
  parent: { vi: 'VAA', en: 'VAA', color: 'grey' },
};

export function getLangLabel(label: LabelKey, field: 'vi' | 'en' | 'color' = 'vi'): string {
  return LabelLang[label]?.[field] ?? label;
}

// Backward compatible exports (older names used across the codebase)
export const EmailLabelLang = LabelLang;
export const getEmailLabelLang = (label: string, field: 'vi' | 'en' | 'color' = 'vi'): string =>
  (LabelLang as Record<string, any>)[label]?.[field] ?? label;

export const SystemLabelNesting = {
  parent: ['parent'],
  ...Object.fromEntries((Object.values(EmailLabel) as string[]).map((k) => [k, ['parent', k]])),
} as const;
