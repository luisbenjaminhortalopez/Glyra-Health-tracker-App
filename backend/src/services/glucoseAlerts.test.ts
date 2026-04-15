import { evaluateAlerts } from './glucoseAlerts';
import { GlucoseRecord } from '../db/glucoseRepository';

/** Helper to create a GlucoseRecord with sensible defaults. */
function makeRecord(overrides: Partial<GlucoseRecord> = {}): GlucoseRecord {
  return {
    id: 1,
    date: '2024-01-15',
    time: '08:00',
    hadMeal: false,
    hoursSinceMeal: null,
    valueMmol: 5.5,
    valueMgdl: 99,
    classification: 'Normal',
    createdAt: '2024-01-15T08:00:00',
    updatedAt: '2024-01-15T08:00:00',
    ...overrides,
  };
}

describe('GlucoseAlertService – evaluateAlerts', () => {
  // ---------------------------------------------------------------
  // Red alert: Hypoglycemia (< 70 mg/dL)
  // ---------------------------------------------------------------
  describe('Hypoglycemia alert (Req 7.1)', () => {
    it('should generate a red hypoglycemia alert when value < 70', () => {
      const record = makeRecord({ valueMgdl: 69 });
      const alerts = evaluateAlerts(record, []);
      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'hypoglycemia', severity: 'red' }),
        ])
      );
    });

    it('should generate a red hypoglycemia alert at boundary value 0', () => {
      const record = makeRecord({ valueMgdl: 0 });
      const alerts = evaluateAlerts(record, []);
      expect(alerts.some((a) => a.type === 'hypoglycemia')).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // Red alert: Critical level (>= 200 mg/dL)
  // ---------------------------------------------------------------
  describe('Critical alert (Req 7.4)', () => {
    it('should generate a red critical alert when value >= 200', () => {
      const record = makeRecord({ valueMgdl: 200 });
      const alerts = evaluateAlerts(record, []);
      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'critical', severity: 'red' }),
        ])
      );
    });

    it('should generate a red critical alert for very high values', () => {
      const record = makeRecord({ valueMgdl: 500 });
      const alerts = evaluateAlerts(record, []);
      expect(alerts.some((a) => a.type === 'critical')).toBe(true);
    });
  });

  // ---------------------------------------------------------------
  // No individual alert for values 70-199
  // ---------------------------------------------------------------
  describe('No individual alert for values 70-199', () => {
    it('should not generate hypoglycemia or critical alert at 70', () => {
      const record = makeRecord({ valueMgdl: 70 });
      const alerts = evaluateAlerts(record, []);
      const individualAlerts = alerts.filter(
        (a) => a.type === 'hypoglycemia' || a.type === 'critical'
      );
      expect(individualAlerts).toHaveLength(0);
    });

    it('should not generate hypoglycemia or critical alert at 199', () => {
      const record = makeRecord({ valueMgdl: 199 });
      const alerts = evaluateAlerts(record, []);
      const individualAlerts = alerts.filter(
        (a) => a.type === 'hypoglycemia' || a.type === 'critical'
      );
      expect(individualAlerts).toHaveLength(0);
    });

    it('should not generate hypoglycemia or critical alert at 120', () => {
      const record = makeRecord({ valueMgdl: 120 });
      const alerts = evaluateAlerts(record, []);
      const individualAlerts = alerts.filter(
        (a) => a.type === 'hypoglycemia' || a.type === 'critical'
      );
      expect(individualAlerts).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------
  // Yellow alert: Frequent post-meal high (Req 7.2)
  // ---------------------------------------------------------------
  describe('Frequent post-meal high alert (Req 7.2)', () => {
    const postMealHighRecord = (id: number): GlucoseRecord =>
      makeRecord({ id, valueMgdl: 150, hadMeal: true, hoursSinceMeal: 1.5 });

    it('should NOT generate alert with exactly 2 post-meal high records', () => {
      const recent = [postMealHighRecord(1), postMealHighRecord(2)];
      const current = makeRecord({ valueMgdl: 100 });
      const alerts = evaluateAlerts(current, recent);
      expect(alerts.some((a) => a.type === 'frequent_post_meal_high')).toBe(false);
    });

    it('should generate yellow alert with exactly 3 post-meal high records', () => {
      const recent = [postMealHighRecord(1), postMealHighRecord(2), postMealHighRecord(3)];
      const current = makeRecord({ valueMgdl: 100 });
      const alerts = evaluateAlerts(current, recent);
      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'frequent_post_meal_high', severity: 'yellow' }),
        ])
      );
    });

    it('should NOT count records with hoursSinceMeal outside 1-2 range', () => {
      const recent = [
        makeRecord({ id: 1, valueMgdl: 150, hadMeal: true, hoursSinceMeal: 0.5 }),
        makeRecord({ id: 2, valueMgdl: 150, hadMeal: true, hoursSinceMeal: 3 }),
        makeRecord({ id: 3, valueMgdl: 150, hadMeal: true, hoursSinceMeal: 1.5 }),
      ];
      const current = makeRecord({ valueMgdl: 100 });
      const alerts = evaluateAlerts(current, recent);
      expect(alerts.some((a) => a.type === 'frequent_post_meal_high')).toBe(false);
    });

    it('should NOT count records with hoursSinceMeal null', () => {
      const recent = [
        makeRecord({ id: 1, valueMgdl: 150, hadMeal: false, hoursSinceMeal: null }),
        makeRecord({ id: 2, valueMgdl: 150, hadMeal: false, hoursSinceMeal: null }),
        makeRecord({ id: 3, valueMgdl: 150, hadMeal: false, hoursSinceMeal: null }),
      ];
      const current = makeRecord({ valueMgdl: 100 });
      const alerts = evaluateAlerts(current, recent);
      expect(alerts.some((a) => a.type === 'frequent_post_meal_high')).toBe(false);
    });
  });

  // ---------------------------------------------------------------
  // Yellow alert: Frequent high levels (Req 7.3)
  // ---------------------------------------------------------------
  describe('Frequent high alert (Req 7.3)', () => {
    const highRecord = (id: number): GlucoseRecord =>
      makeRecord({ id, valueMgdl: 185 });

    it('should NOT generate alert with exactly 2 high records', () => {
      const recent = [highRecord(1), highRecord(2)];
      const current = makeRecord({ valueMgdl: 100 });
      const alerts = evaluateAlerts(current, recent);
      expect(alerts.some((a) => a.type === 'frequent_high')).toBe(false);
    });

    it('should generate yellow alert with exactly 3 high records (> 180)', () => {
      const recent = [highRecord(1), highRecord(2), highRecord(3)];
      const current = makeRecord({ valueMgdl: 100 });
      const alerts = evaluateAlerts(current, recent);
      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'frequent_high', severity: 'yellow' }),
        ])
      );
    });

    it('should NOT count records at exactly 180 (must be > 180)', () => {
      const recent = [
        makeRecord({ id: 1, valueMgdl: 180 }),
        makeRecord({ id: 2, valueMgdl: 180 }),
        makeRecord({ id: 3, valueMgdl: 180 }),
      ];
      const current = makeRecord({ valueMgdl: 100 });
      const alerts = evaluateAlerts(current, recent);
      expect(alerts.some((a) => a.type === 'frequent_high')).toBe(false);
    });
  });
});
