import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { Student } from '@authentication/entities/student.entity';
import {
  cohort2EnrollmentYear,
  email2Parts,
  studentCode2EnrollmentYear,
  email2StudentCode,
} from '@authentication/utils/student.util';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class StudentsService extends ResourceService<Student> {
  protected searchableColumns = ['studentCode', 'studentName'];

  constructor(@InjectRepository(Student) repository: Repository<Student>) {
    super(repository);
  }

  async upsertMany(rows: Array<Pick<Student, 'studentCode' | 'studentName' | 'major'>>) {
    const studentMap = rows.reduce((acc, row) => {
      const code = String(row.studentCode).trim();
      const name = String(row.studentName).trim();

      if (code && name) {
        acc.set(code, {
          studentCode: code,
          studentName: name,
          enrollmentYear: studentCode2EnrollmentYear(code) ?? undefined,
          major: row.major?.trim() || undefined,
        });
      }
      return acc;
    }, new Map<string, any>());

    const items = [...studentMap.values()];

    if (items.length === 0) {
      return { insertedOrUpdated: 0 };
    }

    await this.repository.upsert(items, ['studentCode']);
    return { insertedOrUpdated: items.length };
  }

  async findByEmail(email: string): Promise<Student | null> {
    const studentCode = email2StudentCode(email);
    if (studentCode) {
      return this.repository.findOneBy({ studentCode });
    }

    const { nameSlug, cohort, sequence } = email2Parts(email);
    const students = await this.repository.find({
      where: {
        studentName: Raw((alias) => `unaccent(${alias}) ILIKE unaccent('${nameSlug.split('').join('%')}')`),
        enrollmentYear: cohort2EnrollmentYear(Number(cohort)),
      },
      order: { studentCode: 'ASC' },
      skip: sequence - 1,
      take: 1,
    });

    return students.length > 0 ? students[0] : null;
  }
}
