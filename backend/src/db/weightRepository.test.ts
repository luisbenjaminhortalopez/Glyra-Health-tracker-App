import { initializeDatabase, closeDatabase } from './database';
import {
  getAll,
  getById,
  create,
  update,
  deleteById,
  WeightInput,
} from './weightRepository';

const sampleInput: WeightInput = {
  date: '2024-06-15',
  weightKg: 75.5,
  comments: 'Morning measurement',
};

describe('WeightRepository', () => {
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
      expect(found!.weightKg).toBe(75.5);
      expect(found!.comments).toBe('Morning measurement');
      expect(found!.createdAt).toBeDefined();
      expect(found!.updatedAt).toBeDefined();
    });
  });

  describe('create', () => {
    it('should create a record and return it with an id', () => {
      const record = create(sampleInput);

      expect(record.id).toBeGreaterThan(0);
      expect(record.date).toBe(sampleInput.date);
      expect(record.weightKg).toBe(sampleInput.weightKg);
      expect(record.comments).toBe(sampleInput.comments);
    });

    it('should handle null comments', () => {
      const record = create({ date: '2024-06-15', weightKg: 80.0 });

      expect(record.comments).toBeNull();
    });
  });

  describe('update', () => {
    it('should return null when updating non-existent record', () => {
      expect(update(999, sampleInput)).toBeNull();
    });

    it('should update fields and refresh updatedAt', () => {
      const created = create(sampleInput);

      const updated = update(created.id, {
        date: '2024-06-16',
        weightKg: 74.0,
        comments: 'After exercise',
      });

      expect(updated).not.toBeNull();
      expect(updated!.date).toBe('2024-06-16');
      expect(updated!.weightKg).toBe(74.0);
      expect(updated!.comments).toBe('After exercise');
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
});
