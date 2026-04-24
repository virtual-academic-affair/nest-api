export enum EmailLabel {
  ClassRegistration = 'classRegistration',
  Training = 'training',
  Graduation = 'graduation',
}

export type LabelKey = EmailLabel | 'parent';

export const LabelLang: Record<LabelKey, { vi: string; en: string; color: string }> = {
  [EmailLabel.ClassRegistration]: { vi: 'Đăng ký lớp', en: 'Class Registration', color: 'purple' },
  [EmailLabel.Training]: { vi: 'Đào tạo', en: 'Training', color: 'blue' },
  [EmailLabel.Graduation]: { vi: 'Tốt nghiệp', en: 'Graduation', color: 'green' },
  parent: { vi: 'VAA', en: 'VAA', color: 'grey' },
};

export function getLangLabel(label: LabelKey, field: 'vi' | 'en' | 'color' = 'vi'): string {
  return LabelLang[label]?.[field] ?? label;
}
