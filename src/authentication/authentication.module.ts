import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import jwtConfig from '@shared/config/jwt.config';
import { AuthenticationGuard } from '@authentication/guards/authentication.guard';
import { AccessTokenGuard } from '@authentication/guards/access-token.guard';
import { RolesGuard } from '@authentication/guards/roles.guard';
import { UsersController } from '@authentication/controllers/users.controller';
import { AuthenticationController } from '@authentication/controllers/auth.controller';
import { GoogleController } from '@authentication/controllers/google.controller';
import { User } from '@authentication/entities/user.entity';
import { UsersService } from '@authentication/services/users.service';
import { GoogleService } from '@authentication/services/google.service';
import { AuthService } from '@authentication/services/auth.service';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController, AuthenticationController, GoogleController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    AccessTokenGuard,
    UsersService,
    GoogleService,
    AuthService,
  ],
  exports: [AuthService, TypeOrmModule, JwtModule],
})
export class AuthenticationModule {}
