import { Label } from '@email/enums/label.enum';

export const InquiryType = {
  Training: Label.Training,
  Graduation: Label.Graduation,
} as const;

export type InquiryType = (typeof InquiryType)[keyof typeof InquiryType];
