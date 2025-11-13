import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth';
import { verifyToken } from '../../utils/jwt';
import { UnauthorizedError } from '../../utils/errors';

jest.mock('../../utils/jwt');

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      headers: {},
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call next() with valid token', async () => {
    const mockPayload = { userId: 1, username: 'testuser', email: 'test@example.com' };
    (verifyToken as jest.Mock).mockReturnValue(mockPayload);

    mockRequest.headers = {
      authorization: 'Bearer valid-token',
    };

    await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);

    expect(verifyToken).toHaveBeenCalledWith('valid-token');
    expect(mockRequest.user).toEqual(mockPayload);
    expect(nextFunction).toHaveBeenCalled();
  });

  it('should throw UnauthorizedError when no auth header', async () => {
    mockRequest.headers = {};

    try {
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedError);
      expect((error as UnauthorizedError).message).toBe('Authentication required');
    }
  });

  it('should throw UnauthorizedError with invalid token format', async () => {
    mockRequest.headers = {
      authorization: 'InvalidFormat token',
    };

    try {
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedError);
    }
  });

  it('should throw UnauthorizedError when token verification fails', async () => {
    (verifyToken as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    mockRequest.headers = {
      authorization: 'Bearer invalid-token',
    };

    try {
      await authenticate(mockRequest as Request, mockResponse as Response, nextFunction);
    } catch (error) {
      expect(error).toBeInstanceOf(UnauthorizedError);
    }
  });
});
