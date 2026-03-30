export enum InquiryType {
  Graduation = 'graduation',
  Training = 'training',
  Procedure = 'procedure',
}

export const InquiryTypeLang: Record<InquiryType, Record<string, string>> = {
  [InquiryType.Graduation]: { vi: 'Tốt nghiệp', en: 'Graduation', color: '#a479e2' },
  [InquiryType.Training]: { vi: 'Đào tạo', en: 'Training', color: '#2da2bb' },
  [InquiryType.Procedure]: { vi: 'Thủ tục', en: 'Procedure', color: '#fad165' },
};

export const InquiryTypeNesting = InquiryTypeLang;

export function getLangInquiryTypeLabel(type: InquiryType, lang = 'vi'): string {
  return InquiryTypeLang[type]?.[lang] || type;
}
