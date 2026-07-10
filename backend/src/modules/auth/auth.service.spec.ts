import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import { GamificationService } from '../gamification/gamification.service';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedPassword',
    name: 'Test User',
    role: 'ALUNO',
    avatar: null as string | null,
    refreshToken: null as string | null,
    resetToken: null as string | null,
    resetTokenExpires: null as Date | null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPublicUser = {
    id: mockUser.id,
    email: mockUser.email,
    name: mockUser.name,
    role: mockUser.role,
    avatar: mockUser.avatar,
    currentStreak: 0,
    longestStreak: 0,
    streakLastDate: null as Date | null,
    createdAt: mockUser.createdAt,
    updatedAt: mockUser.updatedAt,
  };

  const mockUsersService = {
    findByEmail: jest.fn(),
    create: jest.fn(),
    findOne: jest.fn(),
    findByIdWithTokens: jest.fn(),
    updateRefreshToken: jest.fn(),
    clearRefreshToken: jest.fn(),
    updateResetToken: jest.fn(),
    clearResetToken: jest.fn(),
    findByResetToken: jest.fn(),
    updatePassword: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfig = {
    JWT_SECRET: 'test-secret',
    JWT_REFRESH_SECRET: 'test-refresh-secret',
    JWT_EXPIRES_IN: '15m',
    FRONTEND_URL: 'https://auri.test',
  } as const;

  const mockConfigService = {
    get: jest.fn((key: string, defaultValue?: string) => {
      if (key in mockConfig) {
        return mockConfig[key as keyof typeof mockConfig];
      }
      return defaultValue;
    }),
  };

  const mockGamificationService = {
    checkLoginAchievements: jest.fn(),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: GamificationService, useValue: mockGamificationService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('should return user without password if credentials are valid', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeDefined();
      expect(result.password).toBeUndefined();
      expect(result.email).toBe('test@example.com');
    });

    it('should return null if user not found', async () => {
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.validateUser('test@example.com', 'password');

      expect(result).toBeNull();
    });

    it('should return null if password is incorrect', async () => {
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.validateUser('test@example.com', 'wrongpassword');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return tokens and user on successful login', async () => {
      const loginDto = { email: 'test@example.com', password: 'password' };
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockUsersService.findByEmail.mockResolvedValue(mockUser);
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.login(loginDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(mockUsersService.updateRefreshToken).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if credentials are invalid', async () => {
      const loginDto = { email: 'test@example.com', password: 'wrongpassword' };
      mockUsersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    it('should create user and return tokens', async () => {
      const registerDto = {
        email: 'newuser@example.com',
        password: 'password',
        name: 'New User',
        role: 'ALUNO',
      };
      mockUsersService.create.mockResolvedValue(mockPublicUser);
      mockJwtService.signAsync.mockResolvedValue('token');

      const result = await service.register(registerDto as any);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
      expect(result).toHaveProperty('user');
      expect(result.user).not.toHaveProperty('password');
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens if refresh token is valid', async () => {
      const refreshTokenDto = { refreshToken: 'valid-refresh-token' };
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwtService.verify.mockReturnValue({ sub: '1', email: 'test@example.com' });
      mockUsersService.findByIdWithTokens.mockResolvedValue({
        ...mockUser,
        refreshToken: 'hashed-token',
      });
      mockJwtService.signAsync.mockResolvedValue('new-token');

      const result = await service.refreshToken(refreshTokenDto);

      expect(result).toHaveProperty('access_token');
      expect(result).toHaveProperty('refresh_token');
    });

    it('should throw UnauthorizedException if refresh token is invalid', async () => {
      const refreshTokenDto = { refreshToken: 'invalid-token' };
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(service.refreshToken(refreshTokenDto)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('forgotPassword', () => {
    it('should return success message', async () => {
      const forgotPasswordDto = { email: 'test@example.com' };
      mockUsersService.findByEmail.mockResolvedValue(mockUser);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty('message');
      expect(mockUsersService.updateResetToken).toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.email,
          name: mockUser.name,
        }),
      );

      const resetUrl = mockMailService.sendPasswordResetEmail.mock.calls[0][0].resetUrl;
      const sentToken = new URL(resetUrl).searchParams.get('token');
      const storedToken = mockUsersService.updateResetToken.mock.calls[0][1];

      if (!sentToken) {
        throw new Error('Reset token was not included in the email URL');
      }

      expect(storedToken).toBe(
        crypto.createHash('sha256').update(sentToken).digest('hex'),
      );
    });

    it('should return success message even if email does not exist', async () => {
      const forgotPasswordDto = { email: 'nonexistent@example.com' };
      mockUsersService.findByEmail.mockResolvedValue(null);

      const result = await service.forgotPassword(forgotPasswordDto);

      expect(result).toHaveProperty('message');
      expect(mockUsersService.updateResetToken).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetPasswordDto = { token: 'valid-token', newPassword: 'newPassword123' };
      const userWithResetToken = {
        ...mockUser,
        resetToken: 'hashed-token',
        resetTokenExpires: new Date(Date.now() + 3600000),
      };
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockUsersService.findByResetToken.mockResolvedValue(userWithResetToken);

      const result = await service.resetPassword(resetPasswordDto);

      expect(result).toHaveProperty('message');
      expect(mockUsersService.updatePassword).toHaveBeenCalled();
      expect(mockUsersService.clearResetToken).toHaveBeenCalled();
      expect(mockUsersService.findByResetToken).toHaveBeenCalledWith(
        crypto.createHash('sha256').update(resetPasswordDto.token).digest('hex'),
      );
    });

    it('should throw BadRequestException if token is invalid', async () => {
      const resetPasswordDto = { token: 'invalid-token', newPassword: 'newPassword123' };
      mockUsersService.findByResetToken.mockResolvedValue(null);

      await expect(service.resetPassword(resetPasswordDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('logout', () => {
    it('should clear refresh token', async () => {
      await service.logout('1');

      expect(mockUsersService.clearRefreshToken).toHaveBeenCalledWith('1');
    });
  });
});
