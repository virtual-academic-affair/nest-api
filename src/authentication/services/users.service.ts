import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, SelectQueryBuilder } from 'typeorm';
import { AssignRoleDto } from '@authentication/dtos/auth/assign-role.dto';
import { QueryDto } from '@authentication/dtos/users/query.dto';
import { User } from '@authentication/entities/user.entity';
import { ResourceService } from '@shared/resource/services/resource.service';

@Injectable()
export class UsersService extends ResourceService<User> {
  protected searchableColumns = ['email', 'name'];

  constructor(@InjectRepository(User) repository: Repository<User>) {
    super(repository);
  }

  protected applyCustomFilters(queryBuilder: SelectQueryBuilder<User>, { roles, isActive }: QueryDto): void {
    roles?.length && queryBuilder.andWhere({ role: In(roles) });
    isActive !== undefined && queryBuilder.andWhere({ isActive });
  }

  async assignRole({ email, role }: AssignRoleDto) {
    let user = await this.repository.findOneBy({ email });
    if (user) {
      user.role = role;
      return await this.repository.save(user);
    }

    user = this.repository.create({ email, role });
    return await this.repository.save(user);
  }
}
