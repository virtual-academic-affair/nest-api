import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Role, Roles } from '@authentication/decorators/roles.decorator';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { readTabularFileRows } from '@shared/utils/tabular-file.util';
import { Form } from '../entities/form.entity';
import { FormsService } from '../services/forms.service';
import { ResourceDto } from '../dtos/forms/resource.dto';
import { ImportFormsDto } from '../dtos/forms/import-forms.dto';

@Controller('form/forms')
export class FormsController extends ResourceController<Form> {
  constructor(protected readonly service: FormsService) {
    super(service);
  }

  protected getDtoClasses() {
    return ResourceDto;
  }

  @Post()
  @Auth(AuthType.Jwt)
  @Roles(Role.Admin)
  override async create(@Body() dto: unknown) {
    return super.create(dto);
  }

  @Put(':id')
  @Auth(AuthType.Jwt)
  @Roles(Role.Admin)
  override async update(@Param('id') id: string, @Body() dto: unknown) {
    return super.update(id, dto);
  }

  @Delete(':id')
  @Auth(AuthType.Jwt)
  @Roles(Role.Admin)
  override async remove(@Param('id') id: string) {
    return super.remove(id);
  }

  /**
   * Preview Excel/CSV import data with Rich Text support for notes.
   */
  @Post('import-preview')
  @Auth(AuthType.Jwt)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024, files: 1 } }))
  async previewImport(@UploadedFile() file: Express.Multer.File, @Body() body: ImportFormsDto) {
    if (!file) throw new BadRequestException('No file provided');

    try {
      const it = readTabularFileRows(file, {
        startRow: Number(body.startRow || 2),
        columns: {
          documentType: Number(body.documentTypeCol || 1),
          contentLink: Number(body.contentLinkCol || 2),
          linkDisplayName: Number(body.linkDisplayNameCol || 3),
          notes: Number(body.notesCol || 4),
        },
        richTextColumns: ['notes'], // Treat notes as Rich Text
      });

      const rows: any[] = [];
      let limit = 10; // Preview first 10 rows
      for await (const row of it) {
        rows.push(row);
        if (rows.length >= limit) break;
      }

      return { rows, totalPreviewed: rows.length };
    } catch (error) {
      throw new BadRequestException(`Preview failed: ${error.message}`);
    }
  }

  @Post('import')
  @Auth(AuthType.Jwt)
  @Roles(Role.Admin)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 10 * 1024 * 1024, files: 1 } }))
  async importFile(@UploadedFile() file: Express.Multer.File, @Body() body: ImportFormsDto) {
    if (!file) throw new BadRequestException('No file provided');

    try {
      const it = readTabularFileRows(file, {
        startRow: Number(body.startRow || 2),
        columns: {
          documentType: Number(body.documentTypeCol || 1),
          contentLink: Number(body.contentLinkCol || 2),
          ...(body.linkDisplayNameCol && { linkDisplayName: Number(body.linkDisplayNameCol) }),
          ...(body.notesCol && { notes: Number(body.notesCol) }),
        },
        richTextColumns: ['notes'],
      });

      let count = 0;
      const batchSize = 100;
      let batch: Partial<Form>[] = [];

      for await (const row of it) {
        batch.push(row as Partial<Form>);
        if (batch.length >= batchSize) {
          const { insertedOrUpdated } = await this.service.upsertMany(batch);
          count += insertedOrUpdated;
          batch = [];
        }
      }

      if (batch.length > 0) {
        const { insertedOrUpdated } = await this.service.upsertMany(batch);
        count += insertedOrUpdated;
      }

      return { message: `Imported/updated ${count} form templates successfully.`, count };
    } catch (error) {
      throw new BadRequestException(`Import failed: ${error.message}`);
    }
  }
}
