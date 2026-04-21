export enum InquiryType {
  Graduation = 'graduation',
  Training = 'training',
}

export const InquiryTypeLang: Record<InquiryType, Record<string, string>> = {
  [InquiryType.Graduation]: { vi: 'Thắc mắc/Tốt nghiệp', en: 'Graduation', color: '#a479e2' },
  [InquiryType.Training]: { vi: 'Thắc mắc/Đào tạo', en: 'Training', color: '#2da2bb' },
};
