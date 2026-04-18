import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { StaffService } from '../staff/staff.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TokenBlacklistService } from './token-blacklist.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly staffService: StaffService,
    private readonly jwtService: JwtService,
    private readonly tokenBlacklistService: TokenBlacklistService,
  ) {}

  async login(loginDto: LoginDto) {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    const staff = await this.staffService.findByEmail(normalizedEmail);

    if (!staff) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isPasswordHash = /^\$2[aby]\$/.test(staff.password);
    const isPasswordValid = isPasswordHash
      ? await bcrypt.compare(loginDto.password, staff.password)
      : loginDto.password === staff.password;

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload: JwtPayload = {
      sub: staff.id,
      email: staff.email,
      role: staff.role,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
      user: this.staffService.sanitizeStaff(staff),
    };
  }

  logout(token: string) {
    this.tokenBlacklistService.blacklist(token);

    return {
      message: 'Logout successful',
    };
  }
}
