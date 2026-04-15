import { getWeeklyGlucoseMetrics, getMonthlyBPMetrics } from './metricsService';
import { GlucoseRecord } from '../db/glucoseRepository';
import { BloodPressureRecord } from '../db/bloodPressureRepository';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeGlucoseRecord(overrides: Partial<GlucoseRecord> = {}): GlucoseRecord {
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

function makeBPRecord(overrides: Partial<BloodPressureRecord> = {}): BloodPressureRecord {
  return {
    id: 1,
    date: '2024-01-15',
    time: '08:00',
    systolic: 120,
    diastolic: 80,
    pulse: 72,
    createdAt: '2024-01-15T08:00:00',
    updatedAt: '2024-01-15T08:00:00',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// getWeeklyGlucoseMetrics
// ---------------------------------------------------------------------------

describe('getWeeklyGlucoseMetrics', () => {
  it('should calculate correct average and max for current week (Req 6.1, 6.2)', () => {
    const current = [
      makeGlucoseRecord({ id: 1, valueMgdl: 100 }),
      makeGlucoseRecord({ id: 2, valueMgdl: 120 }),
      makeGlucoseRecord({ id: 3, valueMgdl: 140 }),
    ];
    const previous: GlucoseRecord[] = [];

    const metrics = getWeeklyGlucoseMetrics(current, previous);

    expect(metrics.weeklyAverage).toBe(120); // (100+120+140)/3
    expect(metrics.weeklyMax).toBe(140);
  });

  it('should return ascending trend when current > previous (Req 6.3)', () => {
    const current = [makeGlucoseRecord({ valueMgdl: 150 })];
    const previous = [makeGlucoseRecord({ valueMgdl: 100 })];

    const metrics = getWeeklyGlucoseMetrics(current, previous);

    expect(metrics.trend).toBe('ascending');
    expect(metrics.previousWeekAverage).toBe(100);
  });

  it('should return descending trend when current < previous (Req 6.3)', () => {
    const current = [makeGlucoseRecord({ valueMgdl: 80 })];
    const previous = [makeGlucoseRecord({ valueMgdl: 120 })];

    const metrics = getWeeklyGlucoseMetrics(current, previous);

    expect(metrics.trend).toBe('descending');
  });

  it('should return stable trend when current == previous (Req 6.3)', () => {
    const current = [makeGlucoseRecord({ valueMgdl: 100 })];
    const previous = [makeGlucoseRecord({ valueMgdl: 100 })];

    const metrics = getWeeklyGlucoseMetrics(current, previous);

    expect(metrics.trend).toBe('stable');
  });

  it('should handle empty current week records', () => {
    const metrics = getWeeklyGlucoseMetrics([], [makeGlucoseRecord({ valueMgdl: 110 })]);

    expect(metrics.weeklyAverage).toBe(0);
    expect(metrics.weeklyMax).toBe(0);
    expect(metrics.trend).toBe('stable');
    expect(metrics.previousWeekAverage).toBe(110);
  });

  it('should handle empty previous week records', () => {
    const current = [makeGlucoseRecord({ valueMgdl: 100 })];

    const metrics = getWeeklyGlucoseMetrics(current, []);

    expect(metrics.weeklyAverage).toBe(100);
    expect(metrics.previousWeekAverage).toBe(0);
    expect(metrics.trend).toBe('ascending');
  });

  it('should handle single record in current week', () => {
    const current = [makeGlucoseRecord({ valueMgdl: 95 })];

    const metrics = getWeeklyGlucoseMetrics(current, []);

    expect(metrics.weeklyAverage).toBe(95);
    expect(metrics.weeklyMax).toBe(95);
  });
});

// ---------------------------------------------------------------------------
// getMonthlyBPMetrics
// ---------------------------------------------------------------------------

describe('getMonthlyBPMetrics', () => {
  it('should calculate correct averages for systolic, diastolic and pulse (Req 8.8)', () => {
    const records = [
      makeBPRecord({ id: 1, systolic: 120, diastolic: 80, pulse: 70 }),
      makeBPRecord({ id: 2, systolic: 130, diastolic: 85, pulse: 75 }),
      makeBPRecord({ id: 3, systolic: 140, diastolic: 90, pulse: 80 }),
    ];

    const metrics = getMonthlyBPMetrics(records, '2024-01');

    expect(metrics.avgSystolic).toBeCloseTo(130);    // (120+130+140)/3
    expect(metrics.avgDiastolic).toBeCloseTo(85);     // (80+85+90)/3
    expect(metrics.avgPulse).toBe(75);                // (70+75+80)/3
    expect(metrics.month).toBe('2024-01');
  });

  it('should return zeroed averages for empty records', () => {
    const metrics = getMonthlyBPMetrics([], '2024-02');

    expect(metrics.avgSystolic).toBe(0);
    expect(metrics.avgDiastolic).toBe(0);
    expect(metrics.avgPulse).toBe(0);
    expect(metrics.month).toBe('2024-02');
  });

  it('should handle single record', () => {
    const records = [makeBPRecord({ systolic: 115, diastolic: 75, pulse: 68 })];

    const metrics = getMonthlyBPMetrics(records, '2024-03');

    expect(metrics.avgSystolic).toBe(115);
    expect(metrics.avgDiastolic).toBe(75);
    expect(metrics.avgPulse).toBe(68);
  });

  it('should pass through the month string', () => {
    const metrics = getMonthlyBPMetrics([makeBPRecord()], '2024-12');
    expect(metrics.month).toBe('2024-12');
  });
});
