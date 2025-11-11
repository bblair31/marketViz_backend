import request from 'supertest';
import { createApp } from '../../app';
import { authService } from '../../services/auth.service';

// Mock the auth service
jest.mock('../../services/auth.service');

// Mock database client
jest.mock('../../database/client', () => ({
  prisma: {
    user: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

describe('Auth Routes', () => {
  const app = createApp();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockResponse = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date(),
        },
        token: 'mock_jwt_token',
      };

      (authService.register as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(201);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 422 for invalid email', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(422);

      expect(response.body.status).toBe('error');
    });

    it('should return 422 for short password', async () => {
      const response = await request(app)
        .post('/api/v1/auth/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: '123',
        })
        .expect(422);

      expect(response.body.status).toBe('error');
    });
  });

  describe('POST /api/v1/auth/login', () => {
    it('should login user successfully', async () => {
      const mockResponse = {
        user: {
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          createdAt: new Date(),
        },
        token: 'mock_jwt_token',
      };

      (authService.login as jest.Mock).mockResolvedValue(mockResponse);

      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.status).toBe('success');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });

    it('should return 422 for missing credentials', async () => {
      const response = await request(app)
        .post('/api/v1/auth/login')
        .send({
          email: 'test@example.com',
        })
        .expect(422);

      expect(response.body.status).toBe('error');
    });
  });

  describe('GET /api/v1/auth/profile', () => {
    it('should return 401 without token', async () => {
      const response = await request(app).get('/api/v1/auth/profile').expect(401);

      expect(response.body.status).toBe('error');
    });
  });
});
