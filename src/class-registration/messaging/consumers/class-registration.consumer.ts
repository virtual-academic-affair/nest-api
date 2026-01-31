import { Injectable } from '@nestjs/common';
import { BaseConsumer } from '@shared/messaging/consumers/base.consumer';
import { RabbitMQService } from '@shared/services/rabbitmq.service';
import { RoutingKey, QueueName } from '@shared/enums/rabbitmq.enum';
import { ClassRegistrationDto } from '@class-registration/dtos/messaging/class-registration.dto';
import { ClassRegistrationsService } from '@class-registration/services/class-registrations.service';
import { ConflictException } from '@nestjs/common';

@Injectable()
export class ClassRegistrationConsumer extends BaseConsumer<ClassRegistrationDto> {
  protected readonly queueName = QueueName.ClassRegistration;

  protected readonly routingKey = RoutingKey.ClassRegistration;

  protected readonly payloadDtoClass = ClassRegistrationDto;

  constructor(
    rabbitmqService: RabbitMQService,
    private readonly classRegistrationsService: ClassRegistrationsService
  ) {
    super(rabbitmqService);
  }

  protected async handleMessage(payload: ClassRegistrationDto): Promise<void> {
    this.logger.log('Received class registration email', {
      emailId: payload.internal.id,
      gmailMessageId: payload.internal.gmailMessageId,
    });

    try {
      // Tạo class registration từ payload
      const registration =
        await this.classRegistrationsService.createRegistration({
          emailId: payload.internal.gmailMessageId,
          studentCode: payload.data.studentCode,
          academicYear: payload.data.academicYear,
          studentName: payload.data.studentName,
          items: payload.data.items,
        });

      this.logger.log('Created class registration', {
        registrationId: registration.id,
        studentCode: registration.studentCode,
        itemsCount: payload.data.items.length,
      });
    } catch (error) {
      // Bỏ qua nếu đã tồn tại (idempotent)
      if (error instanceof ConflictException) {
        this.logger.log('Registration already exists, skipping', {
          emailId: payload.internal.gmailMessageId,
        });
        return;
      }
      this.logger.error('Failed to create class registration', error);
      throw error;
    }
  }
}
