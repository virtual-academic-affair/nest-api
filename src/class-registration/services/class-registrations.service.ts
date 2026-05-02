import { Body, ConflictException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { CreateDto, QueryDto } from '@class-registration/dtos/class-registrations/resource.dto';
import { ClassRegistration } from '@class-registration/entities/class-registration.entity';
import { ClassRegistrationItemsService } from '@class-registration/services/class-registration-items.service';
import { applyMessageFilters } from '@email/dtos/messages/belongs-to-message.dto';
import { Message } from '@email/entities/message.entity';
import { MessageStatus } from '@email/enums/belongs-to-message-status.enum';
import { GmailReplyService } from '@email/services/gmail/sending/reply.service';
import { ClassRegistrationTemplate } from '@email/templates/class-registration.template';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class ClassRegistrationsService extends ResourceService<ClassRegistration> {
  protected searchableColumns: string[] = [];

  protected orderableColumns: string[] = [];

  constructor(
    @InjectRepository(ClassRegistration) repository: Repository<ClassRegistration>,
    private readonly classRegistrationItemsService: ClassRegistrationItemsService,
    private readonly configService: ConfigService,
    private readonly gmailReplyService: GmailReplyService,
  ) {
    super(repository);
  }

  protected withAll(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder.loadRelationCountAndMap(this.p('itemsCount'), this.p('items'));
  }

  protected withOne(queryBuilder: SelectQueryBuilder<ClassRegistration>): void {
    queryBuilder
      .leftJoinAndSelect(this.p('items'), 'items')
      .leftJoinAndSelect(this.p('message'), 'message')
      .leftJoinAndSelect('message.student', 'student');
  }

  protected applyCustomFilters(queryBuilder: SelectQueryBuilder<ClassRegistration>, dto: QueryDto): void {
    applyMessageFilters(queryBuilder, dto);
  }

  async create(@Body() dto: CreateDto) {
    throwIf(
      await this.repository.exists({ where: { messageId: dto.messageId } }),
      new ConflictException('Class registration already exists'),
    );
    return await super.create(dto);
  }

  async stats(startDate: Date, endDate: Date) {
    return this.classRegistrationItemsService.stats(startDate, endDate);
  }

  async previewReply(id: number) {
    const classRegistration = await this.findOne(id);
    return { content: new ClassRegistrationTemplate(this.configService, classRegistration).generate() };
  }

  async sendReply(id: number): Promise<Message> {
    const registration = await this.findOne(id);
    const message = registration.message;
    throwUnless(message, new ConflictException('Registration has no message'));

    await Promise.all([
      this.gmailReplyService.reply(message, await this.previewReply(id).then((res) => res.content)),
      this.repository.update(id, { messageStatus: MessageStatus.Replied }),
    ]);
    return message;
  }
}
