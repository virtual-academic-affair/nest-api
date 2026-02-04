import { AuthenticationController } from '@authentication/controllers/auth.controller';
import { GoogleController } from '@authentication/controllers/google.controller';
import { UsersController } from '@authentication/controllers/users.controller';
import { User } from '@authentication/entities/user.entity';
import { AccessTokenGuard } from '@authentication/guards/access-token.guard';
import { AuthenticationGuard } from '@authentication/guards/authentication.guard';
import { RolesGuard } from '@authentication/guards/roles.guard';
import { AuthService } from '@authentication/services/auth.service';
import { GoogleService } from '@authentication/services/google.service';
import { UsersService } from '@authentication/services/users.service';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import googleConfig from '@shared/config/google.config';
import jwtConfig from '@shared/config/jwt.config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(googleConfig),
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
  exports: [TypeOrmModule],
})
export class AuthenticationModule {}
