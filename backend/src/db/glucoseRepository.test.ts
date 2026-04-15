import { initializeDatabase, closeDatabase } from './database';
import {
  getAll,
  getById,
  create,
  update,
  deleteById,
  getRecordsByDateRange,
  GlucoseCreateParams,
} from './glucoseRepository';

const sampleParams: GlucoseCreateParams = {
  date: '2024-06-15',
  time: '08:30',
  hadMeal: false,
  hoursSinceMeal: null,
  valueMmol: 5.5,
  valueMgdl: 99,
  classification: 'Normal',
};

describe('GlucoseRepository', () => {
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
      create({ ...sampleParams, date: '2024-06-14' });
      create({ ...sampleParams, date: '2024-06-16' });
      create({ ...sampleParams, date: '2024-06-15' });

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

    it('should return the correct record', () => {
      const created = create(sampleParams);
      const found = getById(created.id);

      expect(found).not.toBeNull();
      expect(found!.id).toBe(created.id);
      expect(found!.date).toBe('2024-06-15');
      expect(found!.time).toBe('08:30');
      expect(found!.hadMeal).toBe(false);
      expect(found!.hoursSinceMeal).toBeNull();
      expect(found!.valueMmol).toBe(5.5);
      expect(found!.valueMgdl).toBe(99);
      expect(found!.classification).toBe('Normal');
      expect(found!.createdAt).toBeDefined();
      expect(found!.updatedAt).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a record and return it with an id', () => {
      const record = create(sampleParams);

      expect(record.id).toBeGreaterThan(0);
      expect(record.date).toBe(sampleParams.date);
      expect(record.valueMmol).toBe(sampleParams.valueMmol);
      expect(record.classification).toBe('Normal');
    });

    it('should store hadMeal=true and hoursSinceMeal correctly', () => {
      const record = create({
        ...sampleParams,
        hadMeal: true,
        hoursSinceMeal: 1.5,
        valueMgdl: 150,
        classification: 'Elevado',
      });

      expect(record.hadMeal).toBe(true);
      expect(record.hoursSinceMeal).toBe(1.5);
      expect(record.classification).toBe('Elevado');
    });
  });

  describe('update', () => {
    it('should return null when updating non-existent record', () => {
      expect(update(999, sampleParams)).toBeNull();
    });

    it('should update fields and refresh updatedAt', () => {
      const created = create(sampleParams);

      const updated = update(created.id, {
        ...sampleParams,
        valueMmol: 7.0,
        valueMgdl: 126,
        classification: 'Diabetes',
      });

      expect(updated).not.toBeNull();
      expect(updated!.valueMmol).toBe(7.0);
      expect(updated!.valueMgdl).toBe(126);
      expect(updated!.classification).toBe('Diabetes');
    });
  });

  describe('deleteById', () => {
    it('should return false for non-existent record', () => {
      expect(deleteById(999)).toBe(false);
    });

    it('should delete the record and make it unretrievable', () => {
      const created = create(sampleParams);
      expect(deleteById(created.id)).toBe(true);
      expect(getById(created.id)).toBeNull();
    });
  });

  describe('getRecordsByDateRange', () => {
    it('should return only records within the date range', () => {
      create({ ...sampleParams, date: '2024-06-10' });
      create({ ...sampleParams, date: '2024-06-15' });
      create({ ...sampleParams, date: '2024-06-20' });
      create({ ...sampleParams, date: '2024-06-25' });

      const records = getRecordsByDateRange('2024-06-14', '2024-06-21');
      expect(records).toHaveLength(2);
      expect(records.map(r => r.date).sort()).toEqual(['2024-06-15', '2024-06-20']);
    });

    it('should return empty array when no records match', () => {
      create({ ...sampleParams, date: '2024-06-15' });
      const records = getRecordsByDateRange('2024-07-01', '2024-07-31');
      expect(records).toEqual([]);
    });

    it('should include boundary dates (inclusive)', () => {
      create({ ...sampleParams, date: '2024-06-15' });
      create({ ...sampleParams, date: '2024-06-20' });

      const records = getRecordsByDateRange('2024-06-15', '2024-06-20');
      expect(records).toHaveLength(2);
    });
  });
});
