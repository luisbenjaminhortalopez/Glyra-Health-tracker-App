import { GlucoseRecord } from '../db/glucoseRepository';
import { BloodPressureRecord } from '../db/bloodPressureRepository';
import { GlucoseMetrics, BPMetrics } from '../../../src/types/index';

/**
 * Calculates weekly glucose metrics from current and previous week records.
 *
 * - weeklyAverage: arithmetic mean of current week values (mg/dL)
 * - weeklyMax: highest value in current week (mg/dL)
 * - trend: comparison of current vs previous week average
 * - previousWeekAverage: arithmetic mean of previous week values (mg/dL)
 *
 * If currentWeekRecords is empty, returns zeroed metrics with 'stable' trend.
 */
export function getWeeklyGlucoseMetrics(
  currentWeekRecords: GlucoseRecord[],
  previousWeekRecords: GlucoseRecord[]
): GlucoseMetrics {
  if (currentWeekRecords.length === 0) {
    const prevAvg = calculateAverage(previousWeekRecords.map((r) => r.valueMgdl));
    return {
      weeklyAverage: 0,
      weeklyMax: 0,
      trend: 'stable',
      previousWeekAverage: prevAvg,
    };
  }

  const currentValues = currentWeekRecords.map((r) => r.valueMgdl);
  const weeklyAverage = calculateAverage(currentValues);
  const weeklyMax = Math.max(...currentValues);

  const previousWeekAverage = calculateAverage(
    previousWeekRecords.map((r) => r.valueMgdl)
  );

  const trend = determineTrend(weeklyAverage, previousWeekAverage);

  return { weeklyAverage, weeklyMax, trend, previousWeekAverage };
}

/**
 * Calculates monthly blood pressure metrics for a given month.
 *
 * - avgSystolic: arithmetic mean of systolic values
 * - avgDiastolic: arithmetic mean of diastolic values
 * - avgPulse: arithmetic mean of pulse values
 * - month: the month string passed in
 *
 * If records is empty, returns zeroed averages.
 */
export function getMonthlyBPMetrics(
  records: BloodPressureRecord[],
  month: string
): BPMetrics {
  if (records.length === 0) {
    return { avgSystolic: 0, avgDiastolic: 0, avgPulse: 0, month };
  }

  const avgSystolic = calculateAverage(records.map((r) => r.systolic));
  const avgDiastolic = calculateAverage(records.map((r) => r.diastolic));
  const avgPulse = calculateAverage(records.map((r) => r.pulse));

  return { avgSystolic, avgDiastolic, avgPulse, month };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return sum / values.length;
}

function determineTrend(
  current: number,
  previous: number
): 'ascending' | 'descending' | 'stable' {
  if (current > previous) return 'ascending';
  if (current < previous) return 'descending';
  return 'stable';
}
