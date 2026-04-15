import { Request, Response } from 'express';
import { initializeDatabase, closeDatabase } from '../db/database';
import {
  getAllBloodPressure,
  getBloodPressureById,
  createBloodPressure,
  updateBloodPressure,
  deleteBloodPressure,
  getBloodPressureMetrics,
} from './bloodPressureController';

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
  date: '2024-03-15',
  time: '09:00',
  systolic: 120,
  diastolic: 80,
  pulse: 72,
};

describe('bloodPressureController', () => {
  beforeEach(async () => {
    await initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('getAllBloodPressure', () => {
    it('should return empty array when no records exist', () => {
      const res = mockRes();
      getAllBloodPressure(mockReq() as Request, res as Response);
      expect(res._json).toEqual([]);
    });

    it('should return all records after creating some', () => {
      const createRes = mockRes();
      createBloodPressure(mockReq(validInput) as Request, createRes as Response);

      const res = mockRes();
      getAllBloodPressure(mockReq() as Request, res as Response);
      expect(res._json).toHaveLength(1);
      expect(res._json[0].systolic).toBe(120);
    });
  });

  describe('createBloodPressure', () => {
    it('should create a record with all fields', () => {
      const res = mockRes();
      createBloodPressure(mockReq(validInput) as Request, res as Response);
      expect(res._status).toBe(201);
      expect(res._json.systolic).toBe(120);
      expect(res._json.diastolic).toBe(80);
      expect(res._json.pulse).toBe(72);
      expect(res._json.date).toBe('2024-03-15');
      expect(res._json.id).toBeDefined();
    });

    it('should return 400 when required fields are missing', () => {
      const res = mockRes();
      createBloodPressure(mockReq({ date: '2024-03-15', time: '09:00' }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('obligatorios');
    });

    it('should return 400 when systolic is not positive', () => {
      const res = mockRes();
      createBloodPressure(mockReq({ ...validInput, systolic: -10 }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('sistólica');
    });

    it('should return 400 when systolic is zero', () => {
      const res = mockRes();
      createBloodPressure(mockReq({ ...validInput, systolic: 0 }) as Request, res as Response);
      expect(res._status).toBe(400);
    });

    it('should return 400 when diastolic is not positive', () => {
      const res = mockRes();
      createBloodPressure(mockReq({ ...validInput, diastolic: 0 }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('diastólica');
    });

    it('should return 400 when pulse is not positive', () => {
      const res = mockRes();
      createBloodPressure(mockReq({ ...validInput, pulse: -5 }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('pulso');
    });

    it('should return 400 when systolic <= diastolic', () => {
      const res = mockRes();
      createBloodPressure(mockReq({ ...validInput, systolic: 80, diastolic: 80 }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('sistólica debe ser mayor');
    });

    it('should return 400 when systolic < diastolic', () => {
      const res = mockRes();
      createBloodPressure(mockReq({ ...validInput, systolic: 70, diastolic: 80 }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('sistólica debe ser mayor');
    });
  });

  describe('getBloodPressureById', () => {
    it('should return a record by ID', () => {
      const createRes = mockRes();
      createBloodPressure(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      getBloodPressureById(mockReq({}, { id: String(id) }) as Request, res as Response);
      expect(res._json.id).toBe(id);
      expect(res._json.systolic).toBe(120);
    });

    it('should return 404 for non-existent ID', () => {
      const res = mockRes();
      getBloodPressureById(mockReq({}, { id: '999' }) as Request, res as Response);
      expect(res._status).toBe(404);
    });

    it('should return 400 for invalid ID', () => {
      const res = mockRes();
      getBloodPressureById(mockReq({}, { id: 'abc' }) as Request, res as Response);
      expect(res._status).toBe(400);
    });
  });

  describe('updateBloodPressure', () => {
    it('should update a record', () => {
      const createRes = mockRes();
      createBloodPressure(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const updatedInput = { ...validInput, systolic: 130, diastolic: 85, pulse: 68 };
      const res = mockRes();
      updateBloodPressure(mockReq(updatedInput, { id: String(id) }) as Request, res as Response);
      expect(res._json.systolic).toBe(130);
      expect(res._json.diastolic).toBe(85);
      expect(res._json.pulse).toBe(68);
    });

    it('should return 404 for non-existent ID', () => {
      const res = mockRes();
      updateBloodPressure(mockReq(validInput, { id: '999' }) as Request, res as Response);
      expect(res._status).toBe(404);
    });

    it('should return 400 for missing fields', () => {
      const createRes = mockRes();
      createBloodPressure(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      updateBloodPressure(mockReq({ date: '2024-03-15' }, { id: String(id) }) as Request, res as Response);
      expect(res._status).toBe(400);
    });

    it('should return 400 when systolic <= diastolic on update', () => {
      const createRes = mockRes();
      createBloodPressure(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      updateBloodPressure(
        mockReq({ ...validInput, systolic: 80, diastolic: 80 }, { id: String(id) }) as Request,
        res as Response
      );
      expect(res._status).toBe(400);
    });
  });

  describe('deleteBloodPressure', () => {
    it('should delete a record', () => {
      const createRes = mockRes();
      createBloodPressure(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      deleteBloodPressure(mockReq({}, { id: String(id) }) as Request, res as Response);
      expect(res._json).toEqual({ success: true });

      const getRes = mockRes();
      getBloodPressureById(mockReq({}, { id: String(id) }) as Request, getRes as Response);
      expect(getRes._status).toBe(404);
    });

    it('should return 404 for non-existent ID', () => {
      const res = mockRes();
      deleteBloodPressure(mockReq({}, { id: '999' }) as Request, res as Response);
      expect(res._status).toBe(404);
    });

    it('should return 400 for invalid ID', () => {
      const res = mockRes();
      deleteBloodPressure(mockReq({}, { id: 'abc' }) as Request, res as Response);
      expect(res._status).toBe(400);
    });
  });

  describe('getBloodPressureMetrics', () => {
    it('should return zeroed metrics when no records exist', () => {
      const res = mockRes();
      getBloodPressureMetrics(mockReq({}, {}, {}) as Request, res as Response);
      expect(res._json.avgSystolic).toBe(0);
      expect(res._json.avgDiastolic).toBe(0);
      expect(res._json.avgPulse).toBe(0);
    });

    it('should default to current month when no month param provided', () => {
      const now = new Date();
      const expectedMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

      const res = mockRes();
      getBloodPressureMetrics(mockReq({}, {}, {}) as Request, res as Response);
      expect(res._json.month).toBe(expectedMonth);
    });

    it('should return metrics for a specific month', () => {
      const createRes = mockRes();
      createBloodPressure(mockReq(validInput) as Request, createRes as Response);

      const res = mockRes();
      getBloodPressureMetrics(mockReq({}, {}, { month: '2024-03' }) as Request, res as Response);
      expect(res._json.avgSystolic).toBe(120);
      expect(res._json.avgDiastolic).toBe(80);
      expect(res._json.avgPulse).toBe(72);
      expect(res._json.month).toBe('2024-03');
    });

    it('should return zeroed metrics for a month with no records', () => {
      const createRes = mockRes();
      createBloodPressure(mockReq(validInput) as Request, createRes as Response);

      const res = mockRes();
      getBloodPressureMetrics(mockReq({}, {}, { month: '2025-01' }) as Request, res as Response);
      expect(res._json.avgSystolic).toBe(0);
      expect(res._json.avgDiastolic).toBe(0);
      expect(res._json.avgPulse).toBe(0);
    });

    it('should compute correct averages for multiple records', () => {
      const input1 = { ...validInput, systolic: 120, diastolic: 80, pulse: 70 };
      const input2 = { ...validInput, date: '2024-03-16', systolic: 130, diastolic: 90, pulse: 80 };

      createBloodPressure(mockReq(input1) as Request, mockRes() as Response);
      createBloodPressure(mockReq(input2) as Request, mockRes() as Response);

      const res = mockRes();
      getBloodPressureMetrics(mockReq({}, {}, { month: '2024-03' }) as Request, res as Response);
      expect(res._json.avgSystolic).toBe(125);
      expect(res._json.avgDiastolic).toBe(85);
      expect(res._json.avgPulse).toBe(75);
    });
  });
});
