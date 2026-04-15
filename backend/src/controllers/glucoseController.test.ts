import { Request, Response } from 'express';
import { initializeDatabase, closeDatabase } from '../db/database';
import {
  getAllGlucose,
  getGlucoseById,
  createGlucose,
  updateGlucose,
  deleteGlucose,
  getGlucoseMetrics,
  getGlucoseAlerts,
} from './glucoseController';

function mockReq(body: any = {}, params: any = {}): Partial<Request> {
  return { body, params };
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
  date: '2024-01-15',
  time: '08:00',
  hadMeal: false,
  valueMmol: 5.5,
};

const postMealInput = {
  date: '2024-01-15',
  time: '10:00',
  hadMeal: true,
  hoursSinceMeal: 1.5,
  valueMmol: 8.0,
};

describe('glucoseController', () => {
  beforeEach(async () => {
    await initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('getAllGlucose', () => {
    it('should return empty array when no records exist', () => {
      const res = mockRes();
      getAllGlucose(mockReq() as Request, res as Response);
      expect(res._json).toEqual([]);
    });

    it('should return all records after creating some', () => {
      const res1 = mockRes();
      createGlucose(mockReq(validInput) as Request, res1 as Response);

      const res2 = mockRes();
      getAllGlucose(mockReq() as Request, res2 as Response);
      expect(res2._json).toHaveLength(1);
      expect(res2._json[0].valueMmol).toBe(5.5);
    });
  });

  describe('createGlucose', () => {
    it('should create a fasting record with correct conversion and classification', () => {
      const res = mockRes();
      createGlucose(mockReq(validInput) as Request, res as Response);
      expect(res._status).toBe(201);
      expect(res._json.valueMmol).toBe(5.5);
      expect(res._json.valueMgdl).toBe(5.5 * 18);
      expect(res._json.classification).toBe('Normal');
      expect(res._json.hadMeal).toBe(false);
      expect(res._json.hoursSinceMeal).toBeNull();
    });

    it('should create a post-meal record with correct context', () => {
      const res = mockRes();
      createGlucose(mockReq(postMealInput) as Request, res as Response);
      expect(res._status).toBe(201);
      expect(res._json.valueMgdl).toBe(8.0 * 18);
      // 144 mg/dL post-meal → Elevado
      expect(res._json.classification).toBe('Elevado');
      expect(res._json.hadMeal).toBe(true);
      expect(res._json.hoursSinceMeal).toBe(1.5);
    });

    it('should treat hadMeal with hoursSinceMeal outside 1-2 range as fasting', () => {
      const input = { ...postMealInput, hoursSinceMeal: 3 };
      const res = mockRes();
      createGlucose(mockReq(input) as Request, res as Response);
      expect(res._status).toBe(201);
      // 144 mg/dL fasting → Diabetes
      expect(res._json.classification).toBe('Diabetes');
    });

    it('should return 400 when valueMmol is missing', () => {
      const res = mockRes();
      createGlucose(mockReq({ date: '2024-01-15', time: '08:00' }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('obligatorios');
    });

    it('should return 400 when valueMmol is negative', () => {
      const res = mockRes();
      createGlucose(mockReq({ ...validInput, valueMmol: -1 }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('positivo');
    });

    it('should return 400 when valueMmol is zero', () => {
      const res = mockRes();
      createGlucose(mockReq({ ...validInput, valueMmol: 0 }) as Request, res as Response);
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('positivo');
    });
  });

  describe('getGlucoseById', () => {
    it('should return a record by ID', () => {
      const createRes = mockRes();
      createGlucose(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      getGlucoseById(mockReq({}, { id: String(id) }) as Request, res as Response);
      expect(res._json.id).toBe(id);
      expect(res._json.valueMmol).toBe(5.5);
    });

    it('should return 404 for non-existent ID', () => {
      const res = mockRes();
      getGlucoseById(mockReq({}, { id: '999' }) as Request, res as Response);
      expect(res._status).toBe(404);
    });

    it('should return 400 for invalid ID', () => {
      const res = mockRes();
      getGlucoseById(mockReq({}, { id: 'abc' }) as Request, res as Response);
      expect(res._status).toBe(400);
    });
  });

  describe('updateGlucose', () => {
    it('should update a record and recompute classification', () => {
      const createRes = mockRes();
      createGlucose(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const updatedInput = { ...validInput, valueMmol: 7.0 };
      const res = mockRes();
      updateGlucose(mockReq(updatedInput, { id: String(id) }) as Request, res as Response);
      expect(res._json.valueMmol).toBe(7.0);
      expect(res._json.valueMgdl).toBe(7.0 * 18);
      // 126 mg/dL fasting → Diabetes
      expect(res._json.classification).toBe('Diabetes');
    });

    it('should return 404 for non-existent ID', () => {
      const res = mockRes();
      updateGlucose(mockReq(validInput, { id: '999' }) as Request, res as Response);
      expect(res._status).toBe(404);
    });

    it('should return 400 for missing fields', () => {
      const createRes = mockRes();
      createGlucose(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      updateGlucose(mockReq({ date: '2024-01-15' }, { id: String(id) }) as Request, res as Response);
      expect(res._status).toBe(400);
    });
  });

  describe('deleteGlucose', () => {
    it('should delete a record', () => {
      const createRes = mockRes();
      createGlucose(mockReq(validInput) as Request, createRes as Response);
      const id = createRes._json.id;

      const res = mockRes();
      deleteGlucose(mockReq({}, { id: String(id) }) as Request, res as Response);
      expect(res._json).toEqual({ success: true });

      // Verify it's gone
      const getRes = mockRes();
      getGlucoseById(mockReq({}, { id: String(id) }) as Request, getRes as Response);
      expect(getRes._status).toBe(404);
    });

    it('should return 404 for non-existent ID', () => {
      const res = mockRes();
      deleteGlucose(mockReq({}, { id: '999' }) as Request, res as Response);
      expect(res._status).toBe(404);
    });
  });

  describe('getGlucoseMetrics', () => {
    it('should return zeroed metrics when no records exist', () => {
      const res = mockRes();
      getGlucoseMetrics(mockReq() as Request, res as Response);
      expect(res._json.weeklyAverage).toBe(0);
      expect(res._json.weeklyMax).toBe(0);
      expect(res._json.trend).toBe('stable');
    });

    it('should return metrics for current week records', () => {
      // Create a record with today's date
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const input = { ...validInput, date: dateStr };

      const createRes = mockRes();
      createGlucose(mockReq(input) as Request, createRes as Response);

      const res = mockRes();
      getGlucoseMetrics(mockReq() as Request, res as Response);
      expect(res._json.weeklyAverage).toBeGreaterThan(0);
      expect(res._json.weeklyMax).toBeGreaterThan(0);
    });
  });

  describe('getGlucoseAlerts', () => {
    it('should return empty alerts when no records exist', () => {
      const res = mockRes();
      getGlucoseAlerts(mockReq() as Request, res as Response);
      expect(res._json).toEqual([]);
    });

    it('should return hypoglycemia alert for low glucose', () => {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const lowInput = { date: dateStr, time: '08:00', hadMeal: false, valueMmol: 3.0 };

      const createRes = mockRes();
      createGlucose(mockReq(lowInput) as Request, createRes as Response);

      const res = mockRes();
      getGlucoseAlerts(mockReq() as Request, res as Response);
      expect(res._json.length).toBeGreaterThanOrEqual(1);
      expect(res._json.some((a: any) => a.type === 'hypoglycemia')).toBe(true);
    });

    it('should return unique alerts (no duplicates by type)', () => {
      const today = new Date();
      const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      // Create multiple low glucose records
      for (let i = 0; i < 3; i++) {
        const createRes = mockRes();
        createGlucose(
          mockReq({ date: dateStr, time: `0${8 + i}:00`, hadMeal: false, valueMmol: 3.0 }) as Request,
          createRes as Response
        );
      }

      const res = mockRes();
      getGlucoseAlerts(mockReq() as Request, res as Response);
      const hypoAlerts = res._json.filter((a: any) => a.type === 'hypoglycemia');
      expect(hypoAlerts).toHaveLength(1);
    });
  });
});
