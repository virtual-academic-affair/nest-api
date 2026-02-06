import { IsDefined, IsOptional, IsString } from 'class-validator';

/**
 * DTO for sending reply email
 * - Auto mode: chỉ cần greeting, hệ thống tự tạo full content
 * - Manual mode: gửi fullBody đã được user chỉnh sửa
 */
export class ReplyDto {
  @IsOptional()
  @IsString()
  greeting?: string; // Greeting message (cho auto mode)

  @IsOptional()
  @IsString()
  fullBody?: string; // Complete email body (cho manual mode - đã được user sửa)
}

/**
 * Response từ preview endpoint
 */
export interface ReplyPreviewResponse {
  to: string;
  subject: string;
  greeting: string;     // Phần greeting mặc định
  summary: string;      // Phần summary tự động tạo
  fullBody: string;     // Nội dung email hoàn chỉnh
}
