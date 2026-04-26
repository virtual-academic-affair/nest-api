export enum Label {
  ClassRegistration = 'classRegistration',
  Training = 'training',
  Graduation = 'graduation',
}

export type LabelKey = Label | 'parent';

export const LabelLang: Record<LabelKey, { name: string; color: string }> = {
  [Label.ClassRegistration]: { name: 'VAA/Đăng ký lớp', color: '#dbadff' },
  [Label.Training]: { name: 'VAA/Đào tạo', color: '#71e2ac' },
  [Label.Graduation]: { name: 'VAA/Tốt nghiệp', color: '#c2dbff' },
  parent: { name: 'VAA', color: '#cccccc' },
};
