import { Auth } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { Role } from '@authentication/enums/role.enum';
import { AuthType } from '@authentication/enums/auth-type.enum';
import { Controller, Post } from '@nestjs/common';
import { RestrictMethods } from '@shared/resource/decorators/restrict-methods.decorator';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { ResourceAction } from '@shared/resource/enums/resource-action.enum';
import { Email } from '@email/entities/email.entity';
import { MessagesService } from '@email/services/messages.service';
import { QueryDto } from '@email/dtos/messages/query.dto';
import { EmailIngestedProducer } from '@email/messaging/producers/email-ingested.producer';

@Auth(AuthType.Bearer)
@Roles(Role.Admin)
@Controller('email/messages')
@RestrictMethods({
  only: [ResourceAction.FindAll, ResourceAction.FindOne],
})
export class MessagesController extends ResourceController<Email> {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly emailIngestedProducer: EmailIngestedProducer
  ) {
    super(messagesService);
  }

  protected getDtoClasses() {
    return { query: QueryDto };
  }

  @Post('sync')
  protected async sync() {
    return await this.emailIngestedProducer.sync();
  }
}
