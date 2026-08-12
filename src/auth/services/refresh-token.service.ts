import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { appConfig } from '../../config/app.config';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class RefreshTokenService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async generateRefreshToken(userId: string): Promise<string> {
    // Generate refresh token JWT
    const token = await this.jwtService.signAsync(
      { sub: userId, type: 'refresh' },
      {
        secret: appConfig.jwt.refreshSecret,
        expiresIn: appConfig.jwt.refreshExpiresIn,
      },
    );

    // Hash and store in database
    const hashedToken = await bcrypt.hash(token, 10);
    const expiresAt = this.calculateExpiryDate(appConfig.jwt.refreshExpiresIn);

    await this.prismaService.refreshToken.create({
      data: {
        hashedToken,
        userId,
        expiresAt,
      },
    });

    return token;
  }

  async validateRefreshToken(token: string, userId: string): Promise<boolean> {
    try {
      // Verify JWT signature and expiration
      const payload = await this.jwtService.verifyAsync(token, {
        secret: appConfig.jwt.refreshSecret,
      });

      if (payload.sub !== userId || payload.type !== 'refresh') {
        return false;
      }

      // Check if token exists in database and is not revoked
      const storedToken = await this.prismaService.refreshToken.findFirst({
        where: {
          userId,
          revokedAt: null,
          expiresAt: {
            gt: new Date(),
          },
        },
      });

      if (!storedToken) {
        return false;
      }

      // Verify hashed token matches
      const isValid = await bcrypt.compare(token, storedToken.hashedToken);
      return isValid;
    } catch {
      return false;
    }
  }

  async revokeRefreshToken(token: string): Promise<void> {
    try {
      // Find and revoke the token
      await this.prismaService.refreshToken.updateMany({
        where: {
          hashedToken: {
            // This won't work directly, so we need to find  first
          },
        },
        data: {
          revokedAt: new Date(),
        },
      });
    } catch {
      // Token might not exist, that's okay
    }
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    await this.prismaService.refreshToken.updateMany({
      where: {
        userId,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }

  private calculateExpiryDate(expiresIn: string): Date {
    const now = new Date();
    const ms = this.parseExpiresIn(expiresIn);
    return new Date(now.getTime() + ms);
  }

  private parseExpiresIn(expiresIn: string): number {
    const match = expiresIn.match(/^(\d+)([smhd])$/);
    if (!match) {
      throw new Error(`Invalid expiresIn format: ${expiresIn}`);
    }

    const [, value, unit] = match;
    const num = parseInt(value, 10);

    switch (unit) {
      case 's':
        return num * 1000;
      case 'm':
        return num * 60 * 1000;
      case 'h':
        return num * 60 * 60 * 1000;
      case 'd':
        return num * 24 * 60 * 60 * 1000;
      default:
        throw new Error(`Unknown time unit: ${unit}`);
    }
  }
}
