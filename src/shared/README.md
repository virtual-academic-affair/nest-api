# Shared Module

## Introduction

Module **Shared** chứa các cấu hình, service và utilities dùng chung cho toàn bộ ứng dụng. Module này đảm bảo
logic thống nhất về hashing, caching, message queue và resource pattern.

## Config

Module cung cấp các configuration được tải từ environment variables:

- **JWT Config** (`jwt.config.ts`): Cấu hình token cho authentication (access token, refresh token)
- **Redis Config** (`redis.config.ts`): Cấu hình Redis cho caching
- **RabbitMQ Config** (`rabbitmq.config.ts`): Cấu hình message queue để giao tiếp giữa các service
- **Google OAuth Config** (`google.config.ts`): Cấu hình Google OAuth cho đăng nhập

## Guards

- **RestrictMethodsGuard**: Giới hạn các method CRUD được phép trên từng resource

## Decorators

- **@RestrictMethods()**: Giới hạn các action CRUD (only/except)

## Services

- **HashingService** (BcryptService): Mã hóa password và so sánh hash
- **SettingService**: Quản lý các cấu hình động lưu trong database
- **RedisService**: Tương tác với Redis cache
- **RabbitMQService**: Publish/subscribe message qua RabbitMQ

## Resource Pattern

Module cung cấp **base classes** cho CRUD chuẩn:

- **ResourceController**: Base controller với các endpoint CRUD sẵn có (GET, POST, PUT, DELETE)
- **ResourceService**: Base service với các phương thức findAll, findOne, create, update, remove
- **BaseEntity**: Entity base với các field: id, createdAt, updatedAt, deletedAt

Các controller khác có thể extend `ResourceController` để tự động có đầy đủ CRUD endpoints.

## Enums

### SystemLabel (Email Classification)

Các nhãn phân loại email tự động:

| Giá trị             | Mô tả           |
|---------------------|-----------------|
| `classRegistration` | Đăng ký lớp học |
| `task`              | Công tác khoa   |
| `inquiry`           | Tư vấn          | 
| `other`             | Khác            |

### ResourceAction (CRUD Operations)

Các action cơ bản trong CRUD:

| Giá trị   | Mô tả                 |
|-----------|-----------------------|
| `FindAll` | Lấy danh sách         |
| `FindOne` | Lấy chi tiết một item |
| `Create`  | Tạo mới               |
| `Update`  | Cập nhật              |
| `Delete`  | Xóa                   |

### EmailRoutingKey (RabbitMQ)

Routing keys cho message queue xử lý email:

| Giá trị               | Mô tả                           |
|-----------------------|---------------------------------|
| `email.ingested`      | Email mới được đồng bộ từ Gmail |
| `email.nlp.labeled`   | Email đã được NLP phân loại     |
| `email.nlp.processed` | Email đã xử lý xong             |

### SettingKey (Dynamic Configuration)

Các key cấu hình động trong database:

| Key                           | Mô tả                                      |
|-------------------------------|--------------------------------------------|
| `email/labels`                | Mapping giữa SystemLabel và Gmail label ID |
| `email/lang-labels`           | Nhãn đa ngôn ngữ                           |
| `email/super-email`           | Email chính để sync Gmail                  |
| `email/last-pull-at`          | Thời điểm sync email lần cuối              |
| `email/allowed-domains`       | Danh sách domain email được phép           |
| `authentication/admin-emails` | Danh sách email admin                      |
