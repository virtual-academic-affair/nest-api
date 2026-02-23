# Class Registration Module

## Introduction

Module quản lý đăng ký môn học của sinh viên qua email. Sinh viên gửi email yêu cầu đăng ký/hủy môn học, hệ thống tự
động parse và tạo đơn đăng ký.

## Entities

| Entity                  | Mô tả                                            |
|-------------------------|--------------------------------------------------|
| `ClassRegistration`     | Đơn đăng ký (liên kết với Message qua messageId) |
| `ClassRegistrationItem` | Chi tiết từng môn trong đơn (đăng ký/hủy)        |
| `CancelReason`          | Danh sách lý do từ chối                          |

## API Endpoints

### Class Registrations

| Endpoint                                | Method | Role  | Chức năng                       |
|-----------------------------------------|--------|-------|---------------------------------|
| `/classRegistrations`                   | GET    | Admin | Danh sách đơn (phân trang, lọc) |
| `/classRegistrations/:id`               | GET    | Admin | Chi tiết đơn                    |
| `/classRegistrations`                   | POST   | Admin | Tạo đơn mới                     |
| `/classRegistrations/stats/:type`       | GET    | Admin | Thống kê                        |
| `/classRegistrations/:id/reply/preview` | GET    | Admin | Xem trước email                 |
| `/classRegistrations/:id/reply`         | POST   | Admin | Gửi email reply                 |

### Registration Items

| Endpoint                                        | Method | Role  | Chức năng       |
|-------------------------------------------------|--------|-------|-----------------|
| `/classRegistrations/:registrationId/items`     | GET    | Admin | Danh sách items |
| `/classRegistrations/:registrationId/items/:id` | GET    | Admin | Chi tiết item   |
| `/classRegistrations/:registrationId/items`     | POST   | Admin | Tạo item mới    |
| `/classRegistrations/:registrationId/items/:id` | PUT    | Admin | Cập nhật item   |
| `/classRegistrations/:registrationId/items/:id` | DELETE | Admin | Xóa item        |

### Cancel Reasons

| Endpoint                                | Method | Role  | Chức năng       |
|-----------------------------------------|--------|-------|-----------------|
| `/classRegistrations/cancelReasons`     | GET    | Admin | Danh sách lý do |
| `/classRegistrations/cancelReasons/:id` | GET    | Admin | Chi tiết lý do  |
| `/classRegistrations/cancelReasons`     | POST   | Admin | Tạo lý do mới   |
| `/classRegistrations/cancelReasons/:id` | PUT    | Admin | Cập nhật lý do  |
| `/classRegistrations/cancelReasons/:id` | DELETE | Admin | Xóa lý do       |

## Services

| Service                         | Chức năng                           |
|---------------------------------|-------------------------------------|
| `ClassRegistrationsService`     | CRUD đơn, gửi email reply, thống kê |
| `ClassRegistrationItemsService` | CRUD items                          |
| `CancelReasonsService`          | CRUD lý do                          |

## Query Parameters

| Param     | Mô tả                             |
|-----------|-----------------------------------|
| `page`    | Số trang                          |
| `limit`   | Số item/trang                     |
| `keyword` | Tìm theo studentCode, studentName |
| `status`  | PENDING, APPROVED, REJECTED       |
| `action`  | REGISTER, CANCEL, REQUEST_OPEN    |
| `orderBy` | Sắp xếp (vd: `priority`)          |

## Priority Ordering

Khi `orderBy=priority`:

1. academicYear ASC - SV năm cuối trước
2. isInCurriculum DESC - Môn trong CTDT trước
3. message.sentAt ASC - Email gửi trước
