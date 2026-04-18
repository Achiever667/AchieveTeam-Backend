import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { appConfig } from '../config/app.config';
import { StaffModule } from '../staff/staff.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { TokenBlacklistService } from './token-blacklist.service';

@Module({
  imports: [
    StaffModule,
    PassportModule,
    JwtModule.register({
      secret: appConfig.jwtSecret,
      signOptions: {
        expiresIn: appConfig.jwtExpiresIn,
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, TokenBlacklistService],
  exports: [AuthService, TokenBlacklistService],
})
export class AuthModule {}
