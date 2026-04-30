export enum Label {
  ClassRegistration = 'classRegistration',
  Training = 'training',
  Graduation = 'graduation',
}

export type LabelKey = Label | 'parent';

export const LabelLang: Record<LabelKey, { name: string; color: string }> = {
  [Label.ClassRegistration]: { name: 'VAA/Đăng ký lớp', color: '#8e63ce' },
  [Label.Training]: { name: 'VAA/Đào tạo', color: '#4a86e8' },
  [Label.Graduation]: { name: 'VAA/Tốt nghiệp', color: '#42d692' },
  parent: { name: 'VAA', color: '#cccccc' },
};
