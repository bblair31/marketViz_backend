import { authService } from '../../services/auth.service';
import { prisma } from '../../database/client';
import { ConflictError, UnauthorizedError } from '../../utils/errors';

// Mock Prisma
jest.mock('../../database/client', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

// Mock bcrypt
jest.mock('../../utils/bcrypt', () => ({
  hashPassword: jest.fn().mockResolvedValue('hashed_password'),
  comparePassword: jest.fn(),
}));

// Mock JWT
jest.mock('../../utils/jwt', () => ({
  generateToken: jest.fn().mockReturnValue('mock_jwt_token'),
}));

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
      };

      (prisma.user.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);

      const result = await authService.register({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock_jwt_token');
      expect(prisma.user.create).toHaveBeenCalled();
    });

    it('should throw ConflictError if email already exists', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        username: 'existinguser',
      });

      await expect(
        authService.register({
          username: 'newuser',
          email: 'test@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictError);
    });

    it('should throw ConflictError if username already exists', async () => {
      (prisma.user.findFirst as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'other@example.com',
        username: 'testuser',
      });

      await expect(
        authService.register({
          username: 'testuser',
          email: 'new@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(ConflictError);
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const bcrypt = require('../../utils/bcrypt');
      bcrypt.comparePassword.mockResolvedValue(true);

      const result = await authService.login({
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('token');
      expect(result.token).toBe('mock_jwt_token');
    });

    it('should throw UnauthorizedError if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login({
          email: 'nonexistent@example.com',
          password: 'password123',
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError if password is invalid', async () => {
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        passwordHash: 'hashed_password',
        createdAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);

      const bcrypt = require('../../utils/bcrypt');
      bcrypt.comparePassword.mockResolvedValue(false);

      await expect(
        authService.login({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
      ).rejects.toThrow(UnauthorizedError);
    });
  });

  describe('getProfile', () => {
    it('should return user profile', async () => {
      const mockProfile = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        createdAt: new Date(),
        _count: {
          transactions: 5,
          searches: 10,
        },
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockProfile);

      const result = await authService.getProfile(1);

      expect(result).toEqual(mockProfile);
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        select: expect.any(Object),
      });
    });

    it('should throw UnauthorizedError if user not found', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(authService.getProfile(999)).rejects.toThrow(UnauthorizedError);
    });
  });
});
