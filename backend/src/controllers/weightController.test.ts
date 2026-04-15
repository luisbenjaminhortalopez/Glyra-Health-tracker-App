import { Request, Response } from 'express';
import { initializeDatabase, closeDatabase } from '../db/database';
import {
  getAllWeight,
  getWeightById,
  createWeight,
  updateWeight,
  deleteWeight,
} from './weightController';

function mockReq(body: any = {}, params: any = {}, query: any = {}): Partial<Request> {
  return { body, params, query };
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

const validInput = {
  date: '2024-06-10',
  weightKg: 75.5,
  comments: 'Morning weight',
};

describe('weightController', () => {
  beforeEach(async () => {
    await initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('getAllWeight', () => {
    it('should return empty array when no records exist', () => {
      const res = mockRes();
      getAllWeight(mockReq() as Request, res as Response);
      expect(res._json).toEqual([]);
    });

    it('should return all records after creating some', () => {
      const createRes = mockRes();
      createWeight(mockReq(validInput) as Request, createRes as Response);

      const res = mockRes();
      getAllWeight(mockReq() as Request, res as Response);
      expect(res._json).toHaveLength(1);
      expect(res._json[0].weightKg).toBe(75.5);
    });
  });

  describe('createWeight', () => {
    it('should create a record with all fields', () => {
      const res = mockRes();
      createWeight(mockReq(validInput) as Request, res as Response);
      expect(res._status).toBe(201);
      expect(res._json.weightKg).toBe(75.5);
      expect(res._json.date).toBe('2024-06-10');
      expect(res._json.comments).toBe('Morning weight');
      expect(res._json.id).toBeDefined();
    });

    it('should create a record without comments', () => {
      const res = mockRes();
      createWeight(mockReq({ date: '2024-06-10', weightKg: 80 }) as Request, res as Response);
      expect(res._status).toBe(201);
      expect(res._json.comments).toBeNull();
    });

    it('should return 400 when required fields are missing', () => {
      const res = mockRes();
      createWeight(mockReq({ date: '2024-06-10' }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('obligatorios');
    });

    it('should return 400 when weightKg is not positive', () => {
      const res = mockRes();
      createWeight(mockReq({ date: '2024-06-10', weightKg: -5 }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('peso');
    });

    it('should return 400 when weightKg is zero', () => {
      const res = mockRes();
      createWeight(mockReq({ date: '2024-06-10', weightKg: 0 }) as Request, res as Response);
      expect(res._status).toBe(400);
    });

    it('should return 400 when weightKg is not a number', () => {
      const res = mockRes();
      createWeight(mockReq({ date: '2024-06-10', weightKg: 'abc' }) as Request, res as Response);
      expect(res._status).toBe(400);
    });
  });

  describe('getWeightById', () => {
    it('should return a record by ID', () => {
      const createRes = mockRes();
      createWeight(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      getWeightById(mockReq({}, { id: String(id) }) as Request, res as Response);
      expect(res._json.id).toBe(id);
      expect(res._json.weightKg).toBe(75.5);
    });

    it('should return 404 for non-existent ID', () => {
      const res = mockRes();
      getWeightById(mockReq({}, { id: '999' }) as Request, res as Response);
      expect(res._status).toBe(404);
    });

    it('should return 400 for invalid ID', () => {
      const res = mockRes();
      getWeightById(mockReq({}, { id: 'abc' }) as Request, res as Response);
      expect(res._status).toBe(400);
    });
  });

  describe('updateWeight', () => {
    it('should update a record', () => {
      const createRes = mockRes();
      createWeight(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const updatedInput = { date: '2024-06-11', weightKg: 74.0, comments: 'After exercise' };
      const res = mockRes();
      updateWeight(mockReq(updatedInput, { id: String(id) }) as Request, res as Response);
      expect(res._json.weightKg).toBe(74.0);
      expect(res._json.comments).toBe('After exercise');
      expect(res._json.date).toBe('2024-06-11');
    });

    it('should return 404 for non-existent ID', () => {
      const res = mockRes();
      updateWeight(mockReq(validInput, { id: '999' }) as Request, res as Response);
      expect(res._status).toBe(404);
    });

    it('should return 400 for missing fields', () => {
      const createRes = mockRes();
      createWeight(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      updateWeight(mockReq({ date: '2024-06-11' }, { id: String(id) }) as Request, res as Response);
      expect(res._status).toBe(400);
    });

    it('should return 400 when weightKg is not positive on update', () => {
      const createRes = mockRes();
      createWeight(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      updateWeight(mockReq({ date: '2024-06-11', weightKg: -1 }, { id: String(id) }) as Request, res as Response);
      expect(res._status).toBe(400);
    });
  });

  describe('deleteWeight', () => {
    it('should delete a record', () => {
      const createRes = mockRes();
      createWeight(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      deleteWeight(mockReq({}, { id: String(id) }) as Request, res as Response);
      expect(res._json).toEqual({ success: true });

      const getRes = mockRes();
      getWeightById(mockReq({}, { id: String(id) }) as Request, getRes as Response);
      expect(getRes._status).toBe(404);
    });

    it('should return 404 for non-existent ID', () => {
      const res = mockRes();
      deleteWeight(mockReq({}, { id: '999' }) as Request, res as Response);
      expect(res._status).toBe(404);
    });

    it('should return 400 for invalid ID', () => {
      const res = mockRes();
      deleteWeight(mockReq({}, { id: 'abc' }) as Request, res as Response);
      expect(res._status).toBe(400);
    });
  });
});
