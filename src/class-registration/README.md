# Class Registration Module

Module quản lý đăng ký môn học của sinh viên.

## Entities

| Entity | Mô tả |
|--------|-------|
| `ClassRegistration` | Đơn đăng ký (liên kết với Message) |
| `RegistrationItemDetail` | Chi tiết từng môn trong đơn |
| `CancelReasonMaster` | Danh sách lý do từ chối |

## API Endpoints

### Class Registrations (`/class-registrations`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/` | Danh sách đơn đăng ký |
| GET | `/:id` | Chi tiết một đơn |
| POST | `/` | Tạo đơn mới |
| GET | `/stats/:type?` | Thống kê (overview/register/cancel/request-open) |
| GET | `/:id/reply/preview` | Xem trước email reply |
| POST | `/:id/reply` | Gửi email reply |

### Registration Items (`/registration-items`)

| Method | Endpoint | Mô tả |
|--------|----------|-------|
| GET | `/:id` | Chi tiết một item |
| GET | `/by-registration/:id` | Items theo đơn đăng ký |
| PUT | `/:id/process` | Duyệt/từ chối item |
| POST | `/process-bulk` | Duyệt/từ chối hàng loạt |

### Cancel Reasons (`/cancel-reasons`)

CRUD chuẩn cho danh sách lý do từ chối.

## Query Filters

```
GET /class-registrations?page=1&limit=10&keyword=B21&studentCode=xxx&academicYear=2021&status=PENDING&action=REGISTER&orderBy=priority
```

| Param | Mô tả |
|-------|-------|
| `keyword` | Tìm theo studentCode, studentName |
| `studentCode` | Lọc theo MSSV |
| `academicYear` | Lọc theo khóa học |
| `status` | PENDING / APPROVED / REJECTED |
| `action` | REGISTER / CANCEL / REQUEST_OPEN |
| `orderBy` | `priority` - sắp xếp theo độ ưu tiên |

## Priority Ordering

Khi `orderBy=priority`:
1. **academicYear ASC** - SV năm cuối/khóa cũ trước
2. **isInCurriculum DESC** - Môn trong CTDT trước
3. **message.sentAt ASC** - Email gửi trước

## Reply Modes

### Auto Mode
```json
POST /class-registrations/:id/reply
{ "greeting": "Chào bạn,..." }
```
Hệ thống tự tạo nội dung email từ greeting + summary.

### Manual Mode
```json
GET /class-registrations/:id/reply/preview  // Lấy nội dung mẫu
POST /class-registrations/:id/reply
{ "fullBody": "Nội dung đã chỉnh sửa..." }
```
User xem preview, chỉnh sửa, rồi gửi.

## Class Transfer Detection

Tự động nhận diện chuyển lớp khi:
- Cùng `subjectName`
- Khác `className`
- Có cả CANCEL và REGISTER

Email reply sẽ hiển thị: `🔀 Toán cao cấp: E11 → E12`

## Auth

Tất cả endpoints yêu cầu:
- `@Auth(AuthType.Bearer)` - JWT token
- `@Roles(Role.Admin)` - Chỉ Admin
