import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, extractTokenFromHeader } from '../../utils/jwt';
import { UnauthorizedError } from '../../utils/errors';

// Mock config
jest.mock('../../config/env', () => ({
  config: {
    jwt: {
      secret: 'test_secret_key_must_be_32_characters_long',
      expiresIn: '7d',
    },
  },
}));

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 1,
    username: 'testuser',
    email: 'test@example.com',
  };

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken(mockPayload);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });
  });

  describe('verifyToken', () => {
    it('should verify and decode a valid token', () => {
      const token = generateToken(mockPayload);
      const decoded = verifyToken(token);

      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.username).toBe(mockPayload.username);
      expect(decoded.email).toBe(mockPayload.email);
    });

    it('should throw UnauthorizedError for invalid token', () => {
      expect(() => verifyToken('invalid_token')).toThrow(UnauthorizedError);
    });

    it('should throw UnauthorizedError for expired token', () => {
      const expiredToken = jwt.sign(mockPayload, 'test_secret_key_must_be_32_characters_long', {
        expiresIn: '-1s',
      });

      expect(() => verifyToken(expiredToken)).toThrow(UnauthorizedError);
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Bearer header', () => {
      const token = 'some_jwt_token';
      const header = `Bearer ${token}`;

      const extracted = extractTokenFromHeader(header);
      expect(extracted).toBe(token);
    });

    it('should return null for missing header', () => {
      const extracted = extractTokenFromHeader(undefined);
      expect(extracted).toBeNull();
    });

    it('should return null for invalid format', () => {
      const extracted = extractTokenFromHeader('InvalidFormat token');
      expect(extracted).toBeNull();
    });

    it('should return null for missing Bearer prefix', () => {
      const extracted = extractTokenFromHeader('some_jwt_token');
      expect(extracted).toBeNull();
    });
  });
});
