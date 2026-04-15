import { initializeDatabase, closeDatabase } from './database';
import {
  getAll,
  getById,
  create,
  update,
  deleteById,
  getByMonth,
  BloodPressureInput,
} from './bloodPressureRepository';

const sampleInput: BloodPressureInput = {
  date: '2024-06-15',
  time: '09:00',
  systolic: 120,
  diastolic: 80,
  pulse: 72,
};

describe('BloodPressureRepository', () => {
  beforeEach(async () => {
    await initializeDatabase(':memory:');
  });

  afterEach(() => {
    closeDatabase();
  });

  describe('getAll', () => {
    it('should return empty array when no records exist', () => {
      expect(getAll()).toEqual([]);
    });

    it('should return all records ordered by date desc', () => {
      create({ ...sampleInput, date: '2024-06-14' });
      create({ ...sampleInput, date: '2024-06-16' });
      create({ ...sampleInput, date: '2024-06-15' });

      const records = getAll();
      expect(records).toHaveLength(3);
      expect(records[0].date).toBe('2024-06-16');
      expect(records[1].date).toBe('2024-06-15');
      expect(records[2].date).toBe('2024-06-14');
    });
  });

  describe('getById', () => {
    it('should return null for non-existent id', () => {
      expect(getById(999)).toBeNull();
    });

    it('should return the correct record with all fields', () => {
      const created = create(sampleInput);
      const found = getById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.date).toBe('2024-06-15');
      expect(found!.time).toBe('09:00');
      expect(found!.systolic).toBe(120);
      expect(found!.diastolic).toBe(80);
      expect(found!.pulse).toBe(72);
      expect(found!.createdAt).toBeDefined();
      expect(found!.updatedAt).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a record and return it with an id', () => {
      const record = create(sampleInput);

      expect(record.id).toBeGreaterThan(0);
      expect(record.date).toBe(sampleInput.date);
      expect(record.systolic).toBe(sampleInput.systolic);
      expect(record.diastolic).toBe(sampleInput.diastolic);
      expect(record.pulse).toBe(sampleInput.pulse);
    });
  });

  describe('update', () => {
    it('should return null when updating non-existent record', () => {
      expect(update(999, sampleInput)).toBeNull();
    });

    it('should update fields and refresh updatedAt', () => {
      const created = create(sampleInput);

      const updated = update(created.id, {
        ...sampleInput,
        systolic: 140,
        diastolic: 90,
        pulse: 85,
      });

      expect(updated).not.toBeNull();
      expect(updated!.systolic).toBe(140);
      expect(updated!.diastolic).toBe(90);
      expect(updated!.pulse).toBe(85);
    });
  });

  describe('deleteById', () => {
    it('should return false for non-existent record', () => {
      expect(deleteById(999)).toBe(false);
    });

    it('should delete the record and make it unretrievable', () => {
      const created = create(sampleInput);
      expect(deleteById(created.id)).toBe(true);
      expect(getById(created.id)).toBeNull();
    });
  });

  describe('getByMonth', () => {
    it('should return only records for the specified month', () => {
      create({ ...sampleInput, date: '2024-05-20' });
      create({ ...sampleInput, date: '2024-06-10' });
      create({ ...sampleInput, date: '2024-06-25' });
      create({ ...sampleInput, date: '2024-07-05' });

      const records = getByMonth('2024-06');
      expect(records).toHaveLength(2);
      expect(records.every(r => r.date.startsWith('2024-06'))).toBe(true);
    });

    it('should return empty array when no records match the month', () => {
      create({ ...sampleInput, date: '2024-06-15' });
      const records = getByMonth('2024-08');
      expect(records).toEqual([]);
    });

    it('should return records ordered by date desc within the month', () => {
      create({ ...sampleInput, date: '2024-06-05' });
      create({ ...sampleInput, date: '2024-06-25' });
      create({ ...sampleInput, date: '2024-06-15' });

      const records = getByMonth('2024-06');
      expect(records).toHaveLength(3);
      expect(records[0].date).toBe('2024-06-25');
      expect(records[1].date).toBe('2024-06-15');
      expect(records[2].date).toBe('2024-06-05');
    });
  });
});
