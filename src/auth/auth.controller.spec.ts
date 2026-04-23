import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: {
    getProfile: jest.Mock;
    login: jest.Mock;
    logout: jest.Mock;
  };

  beforeEach(async () => {
    authService = {
      getProfile: jest.fn(),
      login: jest.fn(),
      logout: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('returns the authenticated user profile', () => {
    authService.getProfile.mockReturnValue({
      id: 1,
      email: 'edwinjohn@example.com',
      role: 'superAdmin',
      name: 'Edwin John',
    });

    const result = controller.profile({
      user: {
        id: 1,
        email: 'edwinjohn@example.com',
        role: 'superAdmin',
      },
    } as any);

    expect(authService.getProfile).toHaveBeenCalledWith(1);
    expect(result).toEqual({
      id: 1,
      email: 'edwinjohn@example.com',
      role: 'superAdmin',
      name: 'Edwin John',
    });
  });
});
