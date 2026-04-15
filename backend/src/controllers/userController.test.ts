import { Request, Response } from 'express';
import { initializeDatabase, closeDatabase } from '../db/database';
import { getUserHandler, createOrUpdateUserHandler } from './userController';
import { createOrUpdateUser } from '../db/userRepository';

function mockReq(body: any = {}): Partial<Request> {
  return { body };
}

function mockRes(): Partial<Response> & { _status: number; _json: any } {
  const res: any = {
    _status: 200,
    _json: null,
    status(code: number) {
      res._status = code;
      return res;
    },
    json(data: any) {
      res._json = data;
      return res;
    },
  };
  return res;
}

describe('userController', () => {
  beforeEach(async () => {
    await initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('getUserHandler', () => {
    it('should return { name: null } when no user exists', () => {
      const req = mockReq();
      const res = mockRes();
      getUserHandler(req as Request, res as Response);
      expect(res._json).toEqual({ name: null });
    });

    it('should return the user when one exists', () => {
      createOrUpdateUser('Ana');
      const req = mockReq();
      const res = mockRes();
      getUserHandler(req as Request, res as Response);
      expect(res._json).toBeDefined();
      expect(res._json.name).toBe('Ana');
      expect(res._json.id).toBe(1);
      expect(res._json.createdAt).toBeDefined();
    });
  });

  describe('createOrUpdateUserHandler', () => {
    it('should create a user with a valid name', () => {
      const req = mockReq({ name: 'Carlos' });
      const res = mockRes();
      createOrUpdateUserHandler(req as Request, res as Response);
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true });
    });

    it('should return 400 when name is missing from body', () => {
      const req = mockReq({});
      const res = mockRes();
      createOrUpdateUserHandler(req as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toBe('El nombre es obligatorio');
    });

    it('should return 400 when name is not a string', () => {
      const req = mockReq({ name: 123 });
      const res = mockRes();
      createOrUpdateUserHandler(req as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toBe('El nombre es obligatorio');
    });

    it('should return 400 for an empty name (after trim)', () => {
      const req = mockReq({ name: '   ' });
      const res = mockRes();
      createOrUpdateUserHandler(req as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('obligatorio');
    });

    it('should return 400 for a name longer than 50 characters', () => {
      const req = mockReq({ name: 'a'.repeat(51) });
      const res = mockRes();
      createOrUpdateUserHandler(req as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('50');
    });

    it('should accept a name with exactly 1 character', () => {
      const req = mockReq({ name: 'X' });
      const res = mockRes();
      createOrUpdateUserHandler(req as Request, res as Response);
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true });
    });

    it('should accept a name with exactly 50 characters', () => {
      const req = mockReq({ name: 'b'.repeat(50) });
      const res = mockRes();
      createOrUpdateUserHandler(req as Request, res as Response);
      expect(res._status).toBe(200);
      expect(res._json).toEqual({ success: true });
    });

    it('should update an existing user name', () => {
      createOrUpdateUser('Primero');
      const req = mockReq({ name: 'Segundo' });
      const res = mockRes();
      createOrUpdateUserHandler(req as Request, res as Response);
      expect(res._status).toBe(200);

      const getRes = mockRes();
      getUserHandler(mockReq() as Request, getRes as Response);
      expect(getRes._json.name).toBe('Segundo');
    });
  });
});
