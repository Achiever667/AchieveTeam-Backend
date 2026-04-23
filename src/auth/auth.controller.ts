import {
  Body,
  Controller,
  Get,
  Headers,
  Req,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post(['login', 'api/login'])
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('logout')
  logout(@Headers('authorization') authorization?: string) {
    const token = authorization?.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      throw new UnauthorizedException('Bearer token is required');
    }

    return this.authService.logout(token);
  }

  @Get(['profile', 'api/profile'])
  profile(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.authService.getProfile(request.user.id);
  }
}
