export enum EmailLabel {
  ClassRegistration = 'classRegistration',
  Training = 'training',
  Graduation = 'graduation',
}

export type LabelKey = EmailLabel | 'parent';

export const LabelLang: Record<LabelKey, { name: string; color: string }> = {
  [EmailLabel.ClassRegistration]: { name: 'VAA/Đăng ký lớp', color: '#8E44AD' },
  [EmailLabel.Training]: { name: 'VAA/Đào tạo', color: '#27AE60' },
  [EmailLabel.Graduation]: { name: 'VAA/Tốt nghiệp', color: '#2980B9' },
  parent: { name: 'VAA', color: '#7F8C8D' },
};
