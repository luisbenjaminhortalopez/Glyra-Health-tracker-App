import { GlucoseRecord } from '../db/glucoseRepository';
import { GlucoseAlert, AlertType, AlertSeverity } from '../../../src/types/index';

/**
 * GlucoseAlertService
 * Evaluates glucose alerts based on the current record and recent records (last 7 days).
 *
 * Red alerts (immediate danger):
 * - Hypoglycemia: value < 70 mg/dL
 * - Critical level: value >= 200 mg/dL
 *
 * Yellow alerts (frequent patterns over 7 days):
 * - Frequent post-meal high: > 140 mg/dL with hoursSinceMeal 1-2, 3+ times in 7 days
 * - Frequent high levels: > 180 mg/dL, 3+ times in 7 days
 */
export function evaluateAlerts(
  currentRecord: GlucoseRecord,
  last7DaysRecords: GlucoseRecord[]
): GlucoseAlert[] {
  const alerts: GlucoseAlert[] = [];

  // Red alert: Hypoglycemia (< 70 mg/dL)
  if (currentRecord.valueMgdl < 70) {
    alerts.push({
      type: 'hypoglycemia',
      severity: 'red',
      message: 'Alerta de hipoglucemia: su nivel de glucosa es inferior a 70 mg/dL.',
    });
  }

  // Red alert: Critical level (>= 200 mg/dL)
  if (currentRecord.valueMgdl >= 200) {
    alerts.push({
      type: 'critical',
      severity: 'red',
      message: 'Nivel crítico: su nivel de glucosa es igual o superior a 200 mg/dL.',
    });
  }

  // Yellow alert: Frequent post-meal high (> 140 mg/dL, post-meal 1-2h, 3+ times in 7 days)
  const postMealHighCount = last7DaysRecords.filter(
    (r) =>
      r.valueMgdl > 140 &&
      r.hoursSinceMeal !== null &&
      r.hoursSinceMeal >= 1 &&
      r.hoursSinceMeal <= 2
  ).length;
  if (postMealHighCount >= 3) {
    alerts.push({
      type: 'frequent_post_meal_high',
      severity: 'yellow',
      message:
        'Elevación frecuente post-comida: se han registrado 3 o más valores superiores a 140 mg/dL después de comer en los últimos 7 días.',
    });
  }

  // Yellow alert: Frequent high levels (> 180 mg/dL, 3+ times in 7 days)
  const highCount = last7DaysRecords.filter((r) => r.valueMgdl > 180).length;
  if (highCount >= 3) {
    alerts.push({
      type: 'frequent_high',
      severity: 'yellow',
      message:
        'Niveles altos frecuentes: se han registrado 3 o más valores superiores a 180 mg/dL en los últimos 7 días.',
    });
  }

  return alerts;
}
