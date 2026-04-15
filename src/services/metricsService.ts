import type { GlucoseRecord, GlucoseMetrics, BloodPressureRecord, BPMetrics } from '../types';

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((acc, v) => acc + v, 0) / values.length;
}

function determineTrend(current: number, previous: number): 'ascending' | 'descending' | 'stable' {
  if (current > previous) return 'ascending';
  if (current < previous) return 'descending';
  return 'stable';
}

export function getWeeklyGlucoseMetrics(
  currentWeekRecords: GlucoseRecord[],
  previousWeekRecords: GlucoseRecord[]
): GlucoseMetrics {
  if (currentWeekRecords.length === 0) {
    return {
      weeklyAverage: 0,
      weeklyMax: 0,
      trend: 'stable',
      previousWeekAverage: calculateAverage(previousWeekRecords.map((r) => r.valueMgdl)),
    };
  }
  const currentValues = currentWeekRecords.map((r) => r.valueMgdl);
  const weeklyAverage = calculateAverage(currentValues);
  const weeklyMax = Math.max(...currentValues);
  const previousWeekAverage = calculateAverage(previousWeekRecords.map((r) => r.valueMgdl));
  return { weeklyAverage, weeklyMax, trend: determineTrend(weeklyAverage, previousWeekAverage), previousWeekAverage };
}

export function getMonthlyBPMetrics(records: BloodPressureRecord[], month: string): BPMetrics {
  if (records.length === 0) return { avgSystolic: 0, avgDiastolic: 0, avgPulse: 0, month };
  return {
    avgSystolic: calculateAverage(records.map((r) => r.systolic)),
    avgDiastolic: calculateAverage(records.map((r) => r.diastolic)),
    avgPulse: calculateAverage(records.map((r) => r.pulse)),
    month,
  };
}
