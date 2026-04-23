import { BadRequestException, Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Auth, AuthType } from '@authentication/decorators/auth.decorator';
import { Roles } from '@authentication/decorators/roles.decorator';
import { ImportStudentsDto } from '@authentication/dtos/students/import-students.dto';
import { ResourceDto } from '@authentication/dtos/students/resource.dto';
import { Role } from '@authentication/enums/role.enum';
import { Student } from '@authentication/entities/student.entity';
import { StudentsService } from '@authentication/services/students.service';
import { ResourceController } from '@shared/resource/controllers/resource.controller';
import { readTabularFileRows } from '@shared/utils/tabular-file.util';

type StudentRow = { studentCode: string; studentName: string };

@Controller('authentication/students')
@Auth(AuthType.Jwt)
@Roles(Role.Admin)
export class StudentsController extends ResourceController<Student> {
  constructor(protected readonly service: StudentsService) {
    super(service);
  }

  protected getDtoClasses() {
    return ResourceDto;
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async importFile(@UploadedFile() file: Express.Multer.File | undefined, @Body() dto: ImportStudentsDto) {
    if (!file) {
      throw new BadRequestException('Missing file');
    }
    throwUnless(dto.studentCodeCol && dto.studentNameCol, new BadRequestException('Missing column config'));

    const it = readTabularFileRows<StudentRow>(file, {
      startRow: dto.startRow,
      columns: {
        studentCode: dto.studentCodeCol,
        studentName: dto.studentNameCol,
      },
    });

    const batchSize = 500;
    let batch: StudentRow[] = [];
    let total = 0;

    for await (const row of it) {
      if (!row.studentCode || !row.studentName) continue;
      batch.push(row);
      if (batch.length >= batchSize) {
        const { insertedOrUpdated } = await this.service.upsertMany(batch);
        total += insertedOrUpdated;
        batch = [];
      }
    }

    if (batch.length > 0) {
      const { insertedOrUpdated } = await this.service.upsertMany(batch);
      total += insertedOrUpdated;
    }

    return { insertedOrUpdated: total };
  }
}
