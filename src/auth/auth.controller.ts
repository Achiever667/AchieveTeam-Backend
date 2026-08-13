import { Body, Controller, Get, Post, Req, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse as ApiSwaggerResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { Public } from '../common/decorators/public.decorator';
import { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import { AuthService } from './auth.service';
import { LoginDto, RefreshDto } from './dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'User login' })
  @ApiSwaggerResponse({
    status: 200,
    description: 'Login successful',
    schema: {
      properties: {
        status: { type: 'boolean' },
        code: { type: 'number' },
        message: { type: 'string' },
        data: {
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            user: { type: 'object' },
          },
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiSwaggerResponse({ status: 200, description: 'Token refreshed successfully' })
  async refresh(@Body() refreshDto: RefreshDto) {
    // Extract user ID from token (we need to decode without verification)
    try {
      const decoded: any = JSON.parse(
        Buffer.from(refreshDto.refreshToken.split('.')[1], 'base64').toString(),
      );
      return this.authService.refresh(decoded.sub, refreshDto.refreshToken);
    } catch {
      throw new BadRequestException('Invalid refresh token format');
    }
  }

  @ApiBearerAuth('access-token')
  @Post('logout')
  @ApiOperation({ summary: 'Logout from current device' })
  @ApiSwaggerResponse({ status: 200, description: 'Logout successful' })
  async logout(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.authService.logout(request.user.id);
  }

  @ApiBearerAuth('access-token')
  @Post('logout-all')
  @ApiOperation({ summary: 'Logout from all devices' })
  @ApiSwaggerResponse({ status: 200, description: 'Logged out from all devices' })
  async logoutAll(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.authService.logoutAll(request.user.id);
  }

  @ApiBearerAuth('access-token')
  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiSwaggerResponse({ status: 200, description: 'Profile retrieved successfully' })
  async getCurrentProfile(@Req() request: Request & { user: AuthenticatedUser }) {
    return this.authService.getProfile(request.user.id);
  }
}
