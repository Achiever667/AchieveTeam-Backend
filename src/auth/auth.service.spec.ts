import { UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { StaffService } from '../staff/staff.service';
import { AuthService } from './auth.service';
import { TokenBlacklistService } from './token-blacklist.service';

describe('AuthService', () => {
  let service: AuthService;
  let staffService: {
    findByEmail: jest.Mock;
    findById: jest.Mock;
    sanitizeStaff: jest.Mock;
  };
  let jwtService: {
    signAsync: jest.Mock;
  };
  let tokenBlacklistService: {
    blacklist: jest.Mock;
  };

  beforeEach(async () => {
    staffService = {
      findByEmail: jest.fn(),
      findById: jest.fn(),
      sanitizeStaff: jest.fn((staff) => ({
        id: staff.id,
        email: staff.email,
        role: staff.role,
        name: staff.name,
      })),
    };
    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-token'),
    };
    tokenBlacklistService = {
      blacklist: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: StaffService,
          useValue: staffService,
        },
        {
          provide: JwtService,
          useValue: jwtService,
        },
        {
          provide: TokenBlacklistService,
          useValue: tokenBlacklistService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('logs in with a plain-text password from staff data', async () => {
    const staff = {
      id: 1,
      name: 'Edwin John',
      email: 'edwinjohn@example.com',
      role: 'superAdmin',
      password: '12345Pass',
    };

    staffService.findByEmail.mockReturnValue(staff);

    const result = await service.login({
      email: '  EDWINJOHN@example.com  ',
      password: '12345Pass',
    });

    expect(staffService.findByEmail).toHaveBeenCalledWith(
      'edwinjohn@example.com',
    );
    expect(jwtService.signAsync).toHaveBeenCalledWith({
      sub: 1,
      email: 'edwinjohn@example.com',
      role: 'superAdmin',
    });
    expect(result).toEqual({
      accessToken: 'signed-token',
      user: {
        id: 1,
        email: 'edwinjohn@example.com',
        role: 'superAdmin',
        name: 'Edwin John',
      },
    });
  });

  it('logs in with a bcrypt-hashed password', async () => {
    const passwordHash = await bcrypt.hash('1234567Pass', 4);
    const staff = {
      id: 2,
      name: 'Jackson Page',
      email: 'jp@example.com',
      role: 'admin',
      password: passwordHash,
    };

    staffService.findByEmail.mockReturnValue(staff);

    const result = await service.login({
      email: 'jp@example.com',
      password: '1234567Pass',
    });

    expect(result.accessToken).toBe('signed-token');
    expect(result.user.email).toBe('jp@example.com');
  });

  it('throws when the password is invalid', async () => {
    staffService.findByEmail.mockReturnValue({
      id: 3,
      name: 'Larry Adam',
      email: 'ladam@example.com',
      role: 'staff',
      password: '123456789Pass',
    });

    await expect(
      service.login({
        email: 'ladam@example.com',
        password: 'wrong-password',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns the authenticated user profile without the password', () => {
    staffService.findById.mockReturnValue({
      id: 7,
      name: 'Mary Joe',
      email: 'mary@example.com',
      role: 'admin',
      password: 'secret',
    });

    const result = service.getProfile(7);

    expect(staffService.findById).toHaveBeenCalledWith(7);
    expect(result).toEqual({
      id: 7,
      name: 'Mary Joe',
      email: 'mary@example.com',
      role: 'admin',
    });
  });
});
