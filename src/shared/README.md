# Shared Module

## Muc tieu

Module `shared` cung cap config, service dung chung, va base resource abstraction.

## Thanh phan con lai

- Config: `app`, `auth`, `jwt`, `google`, `grpc`, `redis`, `rabbitmq`.
- Services: `SettingService`, `DynamicDataService`, `RedisService` (`ioredis` qua `@shared/redis/redis.service`).
- Security/utilities: hashing/encryption abstractions, restrict-method guard.
- Resource base: `ResourceService`, `ResourceController`, `BaseEntity`.

## Thay doi quan trong

- Da bo hoan toan dashboard summary (controller/service/dto).
- Da bo moi wiring lien quan `task`.
- System labels trong `shared/enums/system-label.enum.ts` chi con 3 label nghiep vu.
