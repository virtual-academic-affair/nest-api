# Authentication Module

## Introduction

Module **Authentication** xử lý xác thực người dùng thông qua Google OAuth 2.0 và quản lý phân quyền. Module cung cấp
JWT tokens (access & refresh) để bảo mật các API endpoints.

## Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                          1. LOGIN (First Time)                   │
└──────────────────────────────────────────────────────────────────┘

Frontend → Google OAuth URL → Google Login → OAuth Code 
    ↓
GoogleService → Get User Info → UsersService (Create/Update User)
    ↓
AuthService → Generate Tokens → Frontend (Save tokens)


┌──────────────────────────────────────────────────────────────────┐
│                     2. AUTHENTICATED REQUEST                     │
└──────────────────────────────────────────────────────────────────┘

Frontend (Header: Bearer <accessToken>)
    ↓
AuthenticationGuard (Verify Token) → RolesGuard (Check Role)
    ↓
Controller/Service (Process Request)


┌──────────────────────────────────────────────────────────────────┐
│                    3. TOKEN EXPIRED (Refresh)                    │
└──────────────────────────────────────────────────────────────────┘

Frontend (401 Error) → POST /auth/refresh {refreshToken}
    ↓
AuthService (Verify & Generate New Tokens) → Frontend (Save & Retry)
```

## Features

### 1. Google OAuth Login

- Người dùng đăng nhập bằng tài khoản Google
- Tự động tạo user mới nếu chưa tồn tại
- Mặc định role là `student`

### 2. JWT Token Management

- **Access Token**: Thời gian sống ngắn (vài phút đến vài giờ), dùng để xác thực request
- **Refresh Token**: Thời gian sống dài (vài ngày đến vài tuần), dùng để gia hạn access token
- Tokens được sign và verify bằng JWT secret

### 3. Role-Based Access Control (RBAC)

- Mỗi user có một role: `student`, `admin`, hoặc `lecture`
- Guard `RolesGuard` kiểm tra quyền truy cập theo role
- Admin có thể gán role cho user khác

### 4. User Management

- Admin xem danh sách users
- Admin cập nhật thông tin user
- Admin gán/thay đổi role
- Admin có thể active/deactive user (`isActive`)

## Services

| Service           | Chức năng                                        |
|-------------------|--------------------------------------------------|
| **GoogleService** | Xử lý Google OAuth flow, lấy user info từ Google |
| **AuthService**   | Generate và verify JWT tokens (access & refresh) |
| **UsersService**  | CRUD users, assign roles, quản lý user data      |

## API Endpoints

### Google OAuth (Public)

| Endpoint                 | Method | Role   | Chức năng                             |
|--------------------------|--------|--------|---------------------------------------|
| `/authentication/google` | GET    | Public | Lấy Google OAuth URL để redirect user |
| `/authentication/google` | POST   | Public | Login bằng OAuth code, trả về tokens  |

### Auth Management (Public/Authenticated)

| Endpoint                       | Method | Role          | Chức năng                               |
|--------------------------------|--------|---------------|-----------------------------------------|
| `/authentication/auth/refresh` | POST   | Public        | Refresh access token bằng refresh token |
| `/authentication/auth/me`      | GET    | Authenticated | Lấy thông tin user hiện tại             |

### User Management (Admin Only)

| Endpoint                           | Method | Role  | Chức năng                                   |
|------------------------------------|--------|-------|---------------------------------------------|
| `/authentication/users`            | GET    | Admin | Lấy danh sách users (có pagination, filter) |
| `/authentication/users/:id`        | GET    | Admin | Lấy chi tiết một user                       |
| `/authentication/users/:id`        | PUT    | Admin | Cập nhật thông tin user                     |
| `/authentication/users/assignRole` | POST   | Admin | Gán role cho user                           |

> **Lưu ý**: Users controller kế thừa `ResourceController` nhưng bị giới hạn không cho phép `Create` và `Delete` (chỉ
> tạo user qua OAuth).
