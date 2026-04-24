import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '@authentication/entities/user.entity';
import { DomainsService } from '@authentication/services/domains.service';
import { GoogleProfile } from '@authentication/strategies/google.strategy';
import { AuthService } from './auth.service';

@Injectable()
export class GoogleService {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    private readonly domainsService: DomainsService,
  ) {}

  async login(profile: GoogleProfile) {
    const email = profile.email.toLowerCase();
    let user: Partial<User> = await this.userRepository.findOneBy({ email });

    if (!user) {
      user = await this.domainsService.resolveIdentity(email);
    }

    user = await this.userRepository.save({ email, ...profile, ...user });
    return this.authService.generateTokens(user as User);
  }
}
