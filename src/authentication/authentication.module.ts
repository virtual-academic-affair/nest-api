import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationController } from '@authentication/controllers/auth.controller';
import { GoogleController } from '@authentication/controllers/google.controller';
import { StudentsController } from '@authentication/controllers/students.controller';
import { UsersController } from '@authentication/controllers/users.controller';
import { Student } from '@authentication/entities/student.entity';
import { User } from '@authentication/entities/user.entity';
import { AuthsGuard } from '@authentication/guards/auths.guard';
import { GoogleGmailGuard } from '@authentication/guards/google-gmail.guard';
import { GrpcGuard } from '@authentication/guards/grpc.guard';
import { JwtGuard } from '@authentication/guards/jwt.guard';
import { RolesGuard } from '@authentication/guards/roles.guard';
import { AuthService } from '@authentication/services/auth.service';
import { DomainsService } from '@authentication/services/domains.service';
import { GoogleService } from '@authentication/services/google.service';
import { StudentsService } from '@authentication/services/students.service';
import { UsersService } from '@authentication/services/users.service';
import { AccessTokenStrategy } from '@authentication/strategies/access-token.strategy';
import { GoogleGmailStrategy } from '@authentication/strategies/google-gmail.strategy';
import { GoogleStrategy } from '@authentication/strategies/google.strategy';
import { EmailModule } from '@email/email.module';
import googleConfig from '@shared/config/google.config';
import jwtConfig from '@shared/config/jwt.config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(googleConfig),
    PassportModule.register({ session: false }),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    TypeOrmModule.forFeature([User, Student]),
    forwardRef(() => EmailModule),
  ],
  controllers: [UsersController, AuthenticationController, GoogleController, StudentsController],
  providers: [
    { provide: APP_GUARD, useClass: AuthsGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    GrpcGuard,
    JwtGuard,
    GoogleGmailGuard,
    AccessTokenStrategy,
    GoogleStrategy,
    GoogleGmailStrategy,
    UsersService,
    GoogleService,
    AuthService,
    DomainsService,
    StudentsService,
  ],
  exports: [TypeOrmModule, DomainsService],
})
export class AuthenticationModule {}
