import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { User } from '../entities/user.entity';
import { AssignRoleDto } from '@authentication/dtos/auth/assign-role.dto';
import { ResourceService } from '@shared/resource/services/resource.service';
import { QueryDto } from '@authentication/dtos/users/query.dto';

@Injectable()
export class UsersService extends ResourceService<User> {
  protected searchableColumns = ['email', 'name'];

  protected orderableColumns = ['id', 'email', 'name', 'role', 'isActive'];

  constructor(@InjectRepository(User) repository: Repository<User>) {
    super(repository);
  }

  protected applyCustomFilters(
    queryBuilder: SelectQueryBuilder<User>,
    { role }: QueryDto
  ): void {
    role && queryBuilder.andWhere({ role });
  }

  async assignRole(dto: AssignRoleDto) {
    const { email, role } = dto;
    let user = await this.repository.findOneBy({ email });
    if (user) {
      user.role = role;
      return await this.repository.save(user);
    }

    user = this.repository.create(dto);
    return await this.repository.save(user);
  }
}
