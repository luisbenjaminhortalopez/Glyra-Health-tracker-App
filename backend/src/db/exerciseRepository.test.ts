import { initializeDatabase, closeDatabase } from './database';
import {
  getWeek,
  updateWeek,
  ExerciseWeekInput,
} from './exerciseRepository';

const sampleInput: ExerciseWeekInput = {
  weekStart: '2024-06-10',
  days: {
    monday: true,
    tuesday: false,
    wednesday: true,
    thursday: false,
    friday: true,
    saturday: false,
    sunday: false,
  },
  avgMinutesPerDay: 30,
};

describe('ExerciseRepository', () => {
  beforeEach(async () => {
    await initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('getWeek', () => {
    it('should return null when no record exists for the week', () => {
      expect(getWeek('2024-06-10')).toBeNull();
    });

    it('should return the correct record with all fields', () => {
      updateWeek(sampleInput);
      const found = getWeek('2024-06-10');

      expect(found).not.toBeNull();
      expect(found!.weekStart).toBe('2024-06-10');
      expect(found!.days.monday).toBe(true);
      expect(found!.days.tuesday).toBe(false);
      expect(found!.days.wednesday).toBe(true);
      expect(found!.days.thursday).toBe(false);
      expect(found!.days.friday).toBe(true);
      expect(found!.days.saturday).toBe(false);
      expect(found!.days.sunday).toBe(false);
      expect(found!.avgMinutesPerDay).toBe(30);
    });
  });

  describe('updateWeek', () => {
    it('should create a new record when none exists', () => {
      const result = updateWeek(sampleInput);

      expect(result.id).toBeGreaterThan(0);
      expect(result.weekStart).toBe('2024-06-10');
      expect(result.days.monday).toBe(true);
      expect(result.avgMinutesPerDay).toBe(30);
    });

    it('should update an existing record for the same week', () => {
      updateWeek(sampleInput);

      const updated = updateWeek({
        weekStart: '2024-06-10',
        days: {
          monday: false,
          tuesday: true,
          wednesday: false,
          thursday: true,
          friday: false,
          saturday: true,
          sunday: true,
        },
        avgMinutesPerDay: 45,
      });

      expect(updated.weekStart).toBe('2024-06-10');
      expect(updated.days.monday).toBe(false);
      expect(updated.days.tuesday).toBe(true);
      expect(updated.days.saturday).toBe(true);
      expect(updated.days.sunday).toBe(true);
      expect(updated.avgMinutesPerDay).toBe(45);
    });

    it('should handle null avgMinutesPerDay when no days selected', () => {
      const result = updateWeek({
        weekStart: '2024-06-10',
        days: {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        },
      });

      expect(result.avgMinutesPerDay).toBeNull();
    });

    it('should store different weeks independently', () => {
      updateWeek(sampleInput);
      updateWeek({
        weekStart: '2024-06-17',
        days: {
          monday: true,
          tuesday: true,
          wednesday: false,
          thursday: false,
          friday: false,
          saturday: false,
          sunday: false,
        },
        avgMinutesPerDay: 20,
      });

      const week1 = getWeek('2024-06-10');
      const week2 = getWeek('2024-06-17');

      expect(week1).not.toBeNull();
      expect(week2).not.toBeNull();
      expect(week1!.avgMinutesPerDay).toBe(30);
      expect(week2!.avgMinutesPerDay).toBe(20);
    });
  });
});
