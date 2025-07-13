import { jest, describe, expect, test, beforeEach } from '@jest/globals';
import { wrap, handleSocketResponse } from '../../src/socket/socketUtils';
import { SocketResponse } from '../../src/interfaces/sockets/responses';
import { Request, Response, NextFunction } from 'express';
import { Middleware } from '../../src/types/middleware';

describe('socketUtils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('wrap function', () => {
    test('should wrap middleware for socket use', () => {
      // Arrange
      const mockMiddleware: Middleware = jest.fn(
        (req: Request, res: Response, next: NextFunction) => next()
      );
      const mockSocket = {
        request: { user: { id: 'user123' } },
      };
      const mockNext = jest.fn();

      // Act
      const wrappedMiddleware = wrap(mockMiddleware);
      wrappedMiddleware(mockSocket, mockNext);

      // Assert
      expect(mockMiddleware).toHaveBeenCalledWith(
        mockSocket.request as Request,
        {} as Response,
        mockNext
      );
    });

    test('should handle middleware errors', () => {
      // Arrange
      const error = new Error('Middleware error');
      const mockMiddleware: Middleware = jest.fn(
        (req: Request, res: Response, next: NextFunction) => next(error)
      );
      const mockSocket = {
        request: { user: { id: 'user123' } },
      };
      const mockNext = jest.fn();

      // Act
      const wrappedMiddleware = wrap(mockMiddleware);
      wrappedMiddleware(mockSocket, mockNext);

      // Assert
      expect(mockMiddleware).toHaveBeenCalledWith(
        mockSocket.request as Request,
        {} as Response,
        mockNext
      );
      expect(mockNext).toHaveBeenCalledWith(error);
    });
  });

  describe('handleSocketResponse function', () => {
    test('should call callback with complete response object', () => {
      // Arrange
      const mockCallback = jest.fn();
      const response: SocketResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Operation successful',
        data: { id: '123', name: 'Test' },
      };

      // Act
      handleSocketResponse(mockCallback, response);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        status: 'success',
        statusCode: 200,
        message: 'Operation successful',
        data: { id: '123', name: 'Test' },
      });
    });

    test('should call callback with error response', () => {
      // Arrange
      const mockCallback = jest.fn();
      const response: SocketResponse = {
        status: 'error',
        statusCode: 404,
        message: 'Not found',
      };

      // Act
      handleSocketResponse(mockCallback, response);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        status: 'error',
        statusCode: 404,
        message: 'Not found',
      });
    });

    test('should handle callback being null/undefined', () => {
      // Arrange
      const response: SocketResponse = {
        status: 'success',
        statusCode: 200,
        message: 'Operation successful',
      };

      // Act & Assert - should not throw
      expect(() => handleSocketResponse(null as any, response)).not.toThrow();
      expect(() => handleSocketResponse(undefined as any, response)).not.toThrow();
    });

    test('should extract only required fields from response', () => {
      // Arrange
      const mockCallback = jest.fn();
      const response: SocketResponse & { extraField: string } = {
        status: 'success',
        statusCode: 200,
        message: 'Operation successful',
        data: { test: 'data' },
        extraField: 'should not be included',
      };

      // Act
      handleSocketResponse(mockCallback, response);

      // Assert
      expect(mockCallback).toHaveBeenCalledWith({
        status: 'success',
        statusCode: 200,
        message: 'Operation successful',
        data: { test: 'data' },
      });
    });
  });
});
