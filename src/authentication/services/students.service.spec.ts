import { TestingModule } from '@nestjs/testing';
import { Student } from '@authentication/entities/student.entity';
import { compileTypeOrmTestingModule } from '@app/test/typeorm-integration-testing.module';
import { hasDbUrl } from '@app/test/load-env';
import { StudentsService } from './students.service';

(hasDbUrl() ? describe : describe.skip)('StudentsService.findByEmail', () => {
  let moduleRef: TestingModule;
  let studentsService: StudentsService;

  beforeAll(async () => {
    moduleRef = await compileTypeOrmTestingModule({
      entities: [Student],
      providers: [StudentsService],
    });
    studentsService = moduleRef.get(StudentsService);
  });

  afterAll(async () => {
    await moduleRef?.close();
  });

  it.each([
    ['ndan22@clc.fitus.edu.vn', '22127006'],
    ['tmthu222@clc.fitus.edu.vn', '22127405'],
    ['tmthu221@clc.fitus.edu.vn', '22127404'],
  ])('maps %s to studentCode %s', async (email, expectedStudentCode) => {
    const student = await studentsService.findByEmail(email);
    expect(student).not.toBeNull();
    expect(student.studentCode).toBe(expectedStudentCode);
  });
});
