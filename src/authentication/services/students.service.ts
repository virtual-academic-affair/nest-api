import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { Student } from '@authentication/entities/student.entity';
import { cohort2EnrollmentYear, email2Parts, studentCode2EnrollmentYear } from '@authentication/utils/student.util';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class StudentsService extends ResourceService<Student> {
  protected searchableColumns = ['studentCode', 'studentName'];

  constructor(@InjectRepository(Student) repository: Repository<Student>) {
    super(repository);
  }

  async upsertMany(rows: Array<Pick<Student, 'studentCode' | 'studentName' | 'major'>>) {
    const normalized = rows
      .map((r) => {
        const studentCode = String(r.studentCode).trim();
        const studentName = String(r.studentName).trim();
        const enrollmentYear = studentCode2EnrollmentYear(studentCode) ?? undefined;
        const major = r.major?.trim() || undefined;
        return { studentCode, studentName, enrollmentYear, major };
      })
      .filter((r) => r.studentCode && r.studentName);

    if (normalized.length === 0) {
      return { insertedOrUpdated: 0 };
    }

    const result = await this.repository.upsert(normalized as any, ['studentCode']);
    return { insertedOrUpdated: result.identifiers.length + result.generatedMaps.length || normalized.length };
  }

  async findByEmail(email: string): Promise<Student | null> {
    const { cohort, sequence, namePattern } = email2Parts(email);

    const students = await this.repository.find({
      where: {
        studentName: Raw((alias) => `unaccent(${alias}) ILIKE unaccent('${namePattern}')`),
        enrollmentYear: cohort2EnrollmentYear(Number(cohort)),
      },
      order: { studentCode: 'ASC' },
      skip: sequence - 1,
      take: 1,
    });

    return students.length > 0 ? students[0] : null;
  }
}
