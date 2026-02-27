# Task Module

## Introduction

Module **Task** quản lý quy trình công việc, từ việc tạo nhiệm vụ (Task) đến việc gán người thực hiện (Task Assignee).

## Entities

### 1. Task (`tasks`)

Entity chính lưu trữ thông tin về nhiệm vụ.

| Field         | Type      | Description                                             |
|:--------------|:----------|:--------------------------------------------------------|
| `id`          | BigInt    | Primary Key                                             |
| `name`        | Text      | Tên nhiệm vụ                                            |
| `description` | Text      | Mô tả chi tiết                                          |
| `deadline`    | Timestamp | Hạn chót hoàn thành                                     |
| `priority`    | Enum      | Mức độ ưu tiên (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)      |
| `status`      | Enum      | Trạng thái (`TODO`, `IN_PROGRESS`, `DONE`, `CANCELLED`) |
| `assigners`   | String[]  | Danh sách người giao việc (tên phòng ban hoặc user)     |
| `messageId`   | Varchar   | ID của email liên kết (nếu có)                          |

### 2. TaskAssignee (`task_assignees`)

Entity lưu trữ danh sách người được giao nhiệm vụ.

| Field        | Type      | Description                                            |
|:-------------|:----------|:-------------------------------------------------------|
| `id`         | Number    | Primary Key                                            |
| `name`       | Varchar   | Tên người được giao (có thể nhập tay hoặc lấy từ User) |
| `assigneeId` | Number    | ID của User trong hệ thống (nếu đã có tài khoản)       |
| `assignedAt` | Timestamp | Thời điểm được giao việc                               |
| `taskId`     | BigInt    | Foreign Key trỏ về Task                                |

## Enums

### TaskPriority

`src/task/enums/task-priority.enum.ts`

| Value    | Description |
|:---------|:------------|
| `LOW`    | Thấp        |
| `MEDIUM` | Trung bình  |
| `HIGH`   | Cao         |
| `URGENT` | Khẩn cấp    |

### TaskStatus

`src/task/enums/task-status.enum.ts`

| Value         | Description    |
|:--------------|:---------------|
| `TODO`        | Cần làm        |
| `IN_PROGRESS` | Đang thực hiện |
| `DONE`        | Đã xong        |
| `CANCELLED`   | Đã hủy         |

## Service Logic (`TasksService`)

Class `TasksService` mở rộng từ `ResourceService` và có các logic:

### 1. Create Task

* **Propagation**: Nếu DTO có trường `assignedAt` ở root, service sẽ tự động copy giá trị này cho tất cả `TaskAssignee`
  con (nếu con chưa có ngày gán).
* **Auto-Link User**: Nếu payload gửi lên có `assigneeId`, hệ thống sẽ:
    * Tìm User tương ứng trong bảng `users`.
    * Tự động điền `name` của User vào `TaskAssignee` (nếu payload không gửi name).

### 2. Update Task

* Quan hệ OneToMany, khi update danh sách assignees, hệ thống sẽ:
    * So sánh danh sách cũ và danh sách mới.
    * **Xóa** các assignee không còn tồn tại trong danh sách mới (để tránh lỗi `NOT NULL constraint` của `task_id`).
* **Auto-Link & Propagation**: Tương tự như Create, logic tự động điền tên và ngày gán cũng được áp dụng khi
  update/insert assignee mới.

## API Endpoints (`TasksController`)

Base Path: `/task-module/task` (Extends `ResourceController`)

| Method   | Endpoint | Description                                                 |
|:---------|:---------|:------------------------------------------------------------|
| `POST`   | `/`      | Tạo mới Task (kèm Assignees)                                |
| `GET`    | `/`      | Lấy danh sách Task (có phân trang)                          |
| `GET`    | `/:id`   | Lấy chi tiết Task                                           |
| `PUT`    | `/:id`   | Cập nhật Task (thay đổi trạng thái, danh sách người làm...) |
| `DELETE` | `/:id`   | Xóa Task                                                    |
