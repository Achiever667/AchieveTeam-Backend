import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { appConfig } from '../config/app.config';
import { PrismaService } from '../database/prisma.service';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { RefreshTokenService } from './services/refresh-token.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async login(loginDto: LoginDto) {
    const normalizedEmail = loginDto.email.trim().toLowerCase();
    
    // Find user by email
    const user = await this.prismaService.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Validate password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Check if user is active
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User account is not active');
    }

    // Generate access token
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      secret: appConfig.jwt.secret,
      expiresIn: appConfig.jwt.expiresIn,
    });

    // Generate refresh token
    const refreshToken = await this.refreshTokenService.generateRefreshToken(user.id);

    // Update last login
    await this.prismaService.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      data: {
        accessToken,
        refreshToken,
        user: this.sanitizeUser(user),
      },
      message: 'Login successful',
    };
  }

  async refresh(userId: string, refreshToken: string) {
    // Validate refresh token
    const isValid = await this.refreshTokenService.validateRefreshToken(refreshToken, userId);
    
    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    // Load user
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Generate new access token
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(jwtPayload, {
      secret: appConfig.jwt.secret,
      expiresIn: appConfig.jwt.expiresIn,
    });

    return {
      data: {
        accessToken,
      },
      message: 'Token refreshed successfully',
    };
  }

  async logout(userId: string) {
    // Revoke single refresh token would require token, but we'll revoke all for simplicity
    await this.refreshTokenService.revokeAllUserRefreshTokens(userId);

    return {
      message: 'Logout successful',
    };
  }

  async logoutAll(userId: string) {
    // Revoke all refresh tokens
    await this.refreshTokenService.revokeAllUserRefreshTokens(userId);

    return {
      message: 'Logged out from all devices',
    };
  }

  async getProfile(userId: string) {
    const user = await this.prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      data: this.sanitizeUser(user),
      message: 'Profile retrieved successfully',
    };
  }

  private sanitizeUser(user: any) {
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }
}
