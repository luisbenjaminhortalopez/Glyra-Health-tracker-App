import { Request, Response } from 'express';
import { initializeDatabase, closeDatabase } from '../db/database';
import { getExercise, updateExercise } from './exerciseController';

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

const allDaysFalse = {
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: false,
};

const someDaysTrue = {
  monday: true,
  tuesday: false,
  wednesday: true,
  thursday: false,
  friday: true,
  saturday: false,
  sunday: false,
};

describe('exerciseController', () => {
  beforeEach(async () => {
    await initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('getExercise', () => {
    it('should return default empty week when no record exists', () => {
      const res = mockRes();
      getExercise(mockReq({}, {}, { weekStart: '2024-06-10' }) as Request, res as Response);
      expect(res._json.weekStart).toBe('2024-06-10');
      expect(res._json.avgMinutesPerDay).toBeNull();
      expect(res._json.days.monday).toBe(false);
      expect(res._json.days.sunday).toBe(false);
    });

    it('should default to current week Monday when no weekStart provided', () => {
      const res = mockRes();
      getExercise(mockReq({}, {}, {}) as Request, res as Response);
      // Should return a valid weekStart in YYYY-MM-DD format
      expect(res._json.weekStart).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('should return saved exercise data after update', () => {
      const updateRes = mockRes();
      updateExercise(
        mockReq({ weekStart: '2024-06-10', days: someDaysTrue, avgMinutesPerDay: 30 }) as Request,
        updateRes as Response
      );

      const res = mockRes();
      getExercise(mockReq({}, {}, { weekStart: '2024-06-10' }) as Request, res as Response);
      expect(res._json.weekStart).toBe('2024-06-10');
      expect(res._json.days.monday).toBe(true);
      expect(res._json.days.tuesday).toBe(false);
      expect(res._json.days.wednesday).toBe(true);
      expect(res._json.avgMinutesPerDay).toBe(30);
    });
  });

  describe('updateExercise', () => {
    it('should create exercise data for a new week', () => {
      const res = mockRes();
      updateExercise(
        mockReq({ weekStart: '2024-06-10', days: someDaysTrue, avgMinutesPerDay: 45 }) as Request,
        res as Response
      );
      expect(res._json.weekStart).toBe('2024-06-10');
      expect(res._json.days.monday).toBe(true);
      expect(res._json.days.friday).toBe(true);
      expect(res._json.avgMinutesPerDay).toBe(45);
    });

    it('should update existing exercise data', () => {
      const createRes = mockRes();
      updateExercise(
        mockReq({ weekStart: '2024-06-10', days: someDaysTrue, avgMinutesPerDay: 30 }) as Request,
        createRes as Response
      );

      const res = mockRes();
      updateExercise(
        mockReq({ weekStart: '2024-06-10', days: allDaysFalse }) as Request,
        res as Response
      );
      expect(res._json.days.monday).toBe(false);
      expect(res._json.avgMinutesPerDay).toBeNull();
    });

    it('should set avgMinutesPerDay to null when no days selected', () => {
      const res = mockRes();
      updateExercise(
        mockReq({ weekStart: '2024-06-10', days: allDaysFalse, avgMinutesPerDay: 60 }) as Request,
        res as Response
      );
      expect(res._json.avgMinutesPerDay).toBeNull();
    });

    it('should return 400 when weekStart is missing', () => {
      const res = mockRes();
      updateExercise(
        mockReq({ days: someDaysTrue }) as Request,
        res as Response
      );
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('weekStart');
    });

    it('should return 400 when days is missing', () => {
      const res = mockRes();
      updateExercise(
        mockReq({ weekStart: '2024-06-10' }) as Request,
        res as Response
      );
      expect(res._status).toBe(400);
      expect(res._json.error).toContain('days');
    });

    it('should preserve avgMinutesPerDay when days are selected', () => {
      const res = mockRes();
      updateExercise(
        mockReq({ weekStart: '2024-06-10', days: someDaysTrue, avgMinutesPerDay: 25 }) as Request,
        res as Response
      );
      expect(res._json.avgMinutesPerDay).toBe(25);
    });
  });
});
