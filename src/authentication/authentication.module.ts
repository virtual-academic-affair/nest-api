import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthenticationController } from '@authentication/controllers/auth.controller';
import { GoogleController } from '@authentication/controllers/google.controller';
import { UsersController } from '@authentication/controllers/users.controller';
import { User } from '@authentication/entities/user.entity';
import { AccessTokenGuard } from '@authentication/guards/access-token.guard';
import { AuthenticationGuard } from '@authentication/guards/authentication.guard';
import { GoogleOAuthGuard } from '@authentication/guards/google-oauth.guard';
import { RolesGuard } from '@authentication/guards/roles.guard';
import { AuthService } from '@authentication/services/auth.service';
import { GoogleService } from '@authentication/services/google.service';
import { AccessTokenStrategy } from '@authentication/strategies/access-token.strategy';
import { GoogleStrategy } from '@authentication/strategies/google.strategy';
import { UsersService } from '@authentication/services/users.service';
import googleConfig from '@shared/config/google.config';
import jwtConfig from '@shared/config/jwt.config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    ConfigModule.forFeature(googleConfig),
    PassportModule.register({ session: false }),
    JwtModule.registerAsync(jwtConfig.asProvider()),
    TypeOrmModule.forFeature([User]),
  ],
  controllers: [UsersController, AuthenticationController, GoogleController],
  providers: [
    { provide: APP_GUARD, useClass: AuthenticationGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    AccessTokenGuard,
    GoogleOAuthGuard,
    AccessTokenStrategy,
    GoogleStrategy,
    UsersService,
    GoogleService,
    AuthService,
  ],
  exports: [TypeOrmModule],
})
export class AuthenticationModule {}
