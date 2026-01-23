import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD } from '@nestjs/core';
import jwtConfig from '@shared/config/jwt.config';
import { AuthenticationGuard } from './guards/authentication.guard';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RolesGuard } from './guards/roles.guard';
import { UsersController } from './controllers/users.controller';
import { AuthenticationController } from './controllers/auth.controller';
import { GoogleController } from './controllers/google.controller';
import { User } from './entities/user.entity';
import { UsersService } from './services/users.service';
import { GoogleService } from './services/google.service';
import { AuthService } from './services/auth.service';

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
