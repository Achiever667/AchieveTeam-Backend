import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { appConfig } from '../config/app.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshTokenService } from './services/refresh-token.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: appConfig.jwt.secret,
      signOptions: {
        expiresIn: appConfig.jwt.expiresIn,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, RefreshTokenService],
  exports: [AuthService, RefreshTokenService],
})
export class AuthModule {}

