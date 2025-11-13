import { prisma } from '../database/client';
import { hashPassword, comparePassword } from '../utils/bcrypt';
import { generateToken } from '../utils/jwt';
import { ConflictError, UnauthorizedError, BadRequestError } from '../utils/errors';
import { logger } from '../utils/logger';

export interface RegisterDTO {
  username: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

class AuthService {
  async register(data: RegisterDTO) {
    const { username, email, password } = data;

    // Validate input
    if (!username || !email || !password) {
      throw new BadRequestError('Username, email, and password are required');
    }

    if (password.length < 6) {
      throw new BadRequestError('Password must be at least 6 characters');
    }

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email.toLowerCase() },
          { username: username.toLowerCase() },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email.toLowerCase() === email.toLowerCase()) {
        throw new ConflictError('Email already registered');
      }
      throw new ConflictError('Username already taken');
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
      },
    });

    logger.info(`New user registered: ${user.email}`);

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      user,
      token,
    };
  }

  async login(data: LoginDTO) {
    const { email, password } = data;

    if (!email || !password) {
      throw new BadRequestError('Email and password are required');
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info(`User logged in: ${user.email}`);

    // Generate token
    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async getProfile(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        createdAt: true,
        _count: {
          select: {
            transactions: true,
            searches: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    return user;
  }
}

export const authService = new AuthService();
