# Email Module

## Muc tieu

Module `email` quan ly grant Gmail, dong bo labels, ingest email tu webhook, va phat su kien cho NLP.

## Luong nghiep vu

1. Admin grant Gmail qua `/email/grants`.
2. He thong luu `email.superEmail` + `email.gmailHistoryId`.
3. Gmail push webhook vao `POST /email/gmail/webhook`.
4. `GmailWebhookService` setup/renew Gmail watch va chi resolve history delta (nhan thay doi tu webhook).
5. `GmailChangeSyncService` xu ly thay doi he thong (ingest email moi + dong bo labels vao DB).
6. `GmailRabbitPublisherService` phat su kien `ingested` len RabbitMQ.
7. NLP/worker cap nhat labels qua gRPC `MessageService.UpdateLabels` va dong bo nguoc len Gmail.

## Doi tuong chinh

- `GmailApiService`: OAuth client + Gmail client.
- `GmailWebhookService`: chi nhan webhook va dieu phoi luong thay doi.
- `GmailChangeSyncService`: xu ly thay doi tren he thong.
- `GmailRabbitPublisherService`: publish event len RabbitMQ.
- `LabelsService` + `MessageLabelsService`: dong bo label DB/Gmail.
- `MessagesService`: query/remove message resource.

## Labels he thong

Chi giu 4 labels:

- `classRegistration`
- `training`
- `graduation`
- `pending`
