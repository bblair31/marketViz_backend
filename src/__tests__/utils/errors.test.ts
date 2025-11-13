import {
  AppError,
  BadRequestError,
  UnauthorizedError,
  NotFoundError,
  ConflictError,
  ValidationError,
  InternalServerError,
} from '../../utils/errors';

describe('Custom Errors', () => {
  describe('AppError', () => {
    it('should create an error with message and status code', () => {
      const error = new AppError('Test error', 500);

      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('AppError');
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('BadRequestError', () => {
    it('should create a 400 error', () => {
      const error = new BadRequestError('Bad request');

      expect(error.message).toBe('Bad request');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('BadRequestError');
    });
  });

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError('Unauthorized');

      expect(error.message).toBe('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });
  });

  describe('NotFoundError', () => {
    it('should create a 404 error', () => {
      const error = new NotFoundError('Not found');

      expect(error.message).toBe('Not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });
  });

  describe('ConflictError', () => {
    it('should create a 409 error', () => {
      const error = new ConflictError('Conflict');

      expect(error.message).toBe('Conflict');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });
  });

  describe('ValidationError', () => {
    it('should create a 422 error', () => {
      const error = new ValidationError('Validation failed');

      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(422);
      expect(error.name).toBe('ValidationError');
    });
  });

  describe('InternalServerError', () => {
    it('should create a 500 error', () => {
      const error = new InternalServerError('Server error');

      expect(error.message).toBe('Server error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('InternalServerError');
    });
  });
});
