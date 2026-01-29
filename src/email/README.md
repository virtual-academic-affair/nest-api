# Email Module

## Introduction

Module **Email** xử lý đồng bộ email từ Gmail, phân loại tự động bằng NLP và quản lý labels. Module này giúp tự động hóa
việc xử lý và phân loại email học vụ.

## Flow

```
┌─────────────┐
│  Gmail API  │
└──────┬──────┘
       │
       ↓
┌──────────────────┐
│ EmailSyncService │ Lọc theo policy (domain)
└──────┬───────────┘
       │ Lưu DB + Publish message
       ↓
┌──────────────────┐
│ RabbitMQ         │ Routing key: ingested
│ (Ingested)       │
└──────┬───────────┘
       │
       ↓
┌──────────────────┐
│  NLP Service     │ (External - Python service)
│  Phân loại email │
└──────┬───────────┘
       │ gRPC: LabelService.UpdateLabel
       ↓
┌──────────────────────┐
│ MessageLabelsService │ Cập nhật SystemLabels
└──────┬───────────────┘
       │ Modify labels
       ↓
┌──────────────────────┐
│ Gmail API            │ Gắn label vào email
│ (Modify Labels)      │
└──────────────────────┘
```

## Features

### 1. Đồng Bộ Email (Email Sync)

- **Scheduler**: Tự động chạy mỗi 10 giây (`EmailSyncScheduler`)
- **Sync thủ công**: Có thể trigger qua API endpoint `/email/messages/sync`
- **Policy**: Chỉ sync email từ:
    - Các domain được phép trong setting `email/allowedDomains`

### 2. OAuth & Permissions

- Cần grant quyền Gmail API qua OAuth 2.0
- Admin tạo auth URL và xác thực để lấy refresh token
- Refresh token được lưu trong setting `email/superEmail` và dùng để truy cập Gmail API

### 3. Quản Lý Labels

- **Gmail Labels**: Labels có sẵn hoặc tự tạo trên Gmail
- **System Labels**: Labels hệ thống cho phân loại (enum `SystemLabel`)
- **Mapping**: Liên kết giữa System Labels và Gmail Label IDs
- **Auto Create**: Tự động tạo labels trên Gmail nếu chưa có

### 4. Phân Loại Tự Động (NLP)

- Email sau khi sync được gửi qua RabbitMQ cho NLP service
- NLP service phân tích nội dung và gọi gRPC `LabelService.UpdateLabel` để cập nhật `SystemLabel`
- Hệ thống tự động gắn Gmail labels tương ứng

## Services

| Service                  | Chức năng                                         |
|--------------------------|---------------------------------------------------|
| **GoogleapisService**    | Kết nối Gmail API, tạo OAuth client               |
| **EmailSyncService**     | Đồng bộ email mới từ Gmail về database            |
| **GrantsService**        | Xác thực OAuth cho Gmail API                      |
| **LabelsService**        | Quản lý Gmail labels và mapping với system labels |
| **MessagesService**      | CRUD các email đã đồng bộ                         |
| **MessageLabelsService** | Thêm/xóa labels cho email, đồng bộ Gmail + DB     |

## API Endpoints

### Grants (OAuth)

| Endpoint        | Method | Role  | Chức năng                                |
|-----------------|--------|-------|------------------------------------------|
| `/email/grants` | GET    | Admin | Lấy Google OAuth URL để grant quyền      |
| `/email/grants` | POST   | Admin | Xác thực OAuth code và lưu refresh token |

### Labels

| Endpoint                    | Method | Role  | Chức năng                                           |
|-----------------------------|--------|-------|-----------------------------------------------------|
| `/email/labels`             | GET    | Admin | Lấy danh sách system labels và mapping              |
| `/email/labels/gmailLabels` | GET    | Admin | Lấy tất cả Gmail labels từ tài khoản                |
| `/email/labels`             | PUT    | Admin | Cập nhật mapping giữa SystemLabel và Gmail label ID |
| `/email/labels/autoCreate`  | POST   | Admin | Tự động tạo labels trên Gmail theo SystemLabel      |

### Messages (Emails)

| Endpoint               | Method | Role  | Chức năng                                    |
|------------------------|--------|-------|----------------------------------------------|
| `/email/messages`      | GET    | Admin | Lấy danh sách emails (có pagination, filter) |
| `/email/messages/:id`  | GET    | Admin | Lấy chi tiết một email                       |
| `/email/messages/sync` | POST   | Admin | Trigger đồng bộ email thủ công               |
| `/email/messageLabels` | PUT    | Admin | Thêm/xóa label vào email                     |
