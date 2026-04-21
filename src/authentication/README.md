# Authentication Module

## Muc tieu

Module `authentication` xu ly dang nhap Google OAuth theo Passport, phat hanh JWT, va phan quyen theo role.

## Luong nghiep vu

1. User goi `GET /authentication/google` -> Passport redirect sang Google.
2. Google callback vao `GET /authentication/google/redirect`.
3. `GoogleStrategy` tra profile, `GoogleService` upsert user theo email/domain mapping (`setting key: auth.emailDomains`).
4. `AuthService` phat hanh access/refresh token, refresh token duoc luu cookie.
5. Cac API private dung `AuthenticationGuard` + `AccessTokenGuard` (Passport JWT), khong verify JWT thu cong.

## Role theo email domain

- Cau hinh: setting `auth.emailDomains` trong bang `setting` voi format `{ role: string[] }`.
- `resolveEmail()` map domain -> role.
- Neu role la `student`, cohort duoc suy ra tu 2 chu so dau local-part email.

## Thanh phan chinh

- `AccessTokenStrategy`: validate JWT va user active.
- `GoogleStrategy`: OAuth profile provider.
- `GoogleOAuthGuard`: guard cho flow login Google.
- `GoogleService`: business login/upsert/token.
- `AuthService`: token lifecycle (issue/refresh/super-token).
