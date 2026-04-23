import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '@authentication/entities/student.entity';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class StudentsService extends ResourceService<Student> {
  protected searchableColumns = ['studentCode', 'studentName'];

  constructor(@InjectRepository(Student) repository: Repository<Student>) {
    super(repository);
  }

  async upsertMany(rows: Array<Pick<Student, 'studentCode' | 'studentName'>>) {
    const normalized = rows
      .map((r) => ({ studentCode: String(r.studentCode).trim(), studentName: String(r.studentName).trim() }))
      .filter((r) => r.studentCode && r.studentName);

    if (normalized.length === 0) {
      return { insertedOrUpdated: 0 };
    }

    const result = await this.repository.upsert(normalized as any, ['studentCode']);
    return { insertedOrUpdated: result.identifiers.length + result.generatedMaps.length || normalized.length };
  }
}
