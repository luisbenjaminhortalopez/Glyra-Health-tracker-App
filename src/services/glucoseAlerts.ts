import type { GlucoseRecord, GlucoseAlert } from '../types';

export function evaluateAlerts(
  currentRecord: GlucoseRecord,
  last7DaysRecords: GlucoseRecord[]
): GlucoseAlert[] {
  const alerts: GlucoseAlert[] = [];

  if (currentRecord.valueMgdl < 70) {
    alerts.push({
      type: 'hypoglycemia',
      severity: 'red',
      message: 'Alerta de hipoglucemia: su nivel de glucosa es inferior a 70 mg/dL.',
    });
  }

  if (currentRecord.valueMgdl >= 200) {
    alerts.push({
      type: 'critical',
      severity: 'red',
      message: 'Nivel crítico: su nivel de glucosa es igual o superior a 200 mg/dL.',
    });
  }

  const postMealHighCount = last7DaysRecords.filter(
    (r) => r.valueMgdl > 140 && r.hoursSinceMeal != null && r.hoursSinceMeal >= 1 && r.hoursSinceMeal <= 2
  ).length;
  if (postMealHighCount >= 3) {
    alerts.push({
      type: 'frequent_post_meal_high',
      severity: 'yellow',
      message: 'Elevación frecuente post-comida: 3+ valores >140 mg/dL después de comer en 7 días.',
    });
  }

  const highCount = last7DaysRecords.filter((r) => r.valueMgdl > 180).length;
  if (highCount >= 3) {
    alerts.push({
      type: 'frequent_high',
      severity: 'yellow',
      message: 'Niveles altos frecuentes: 3+ valores >180 mg/dL en 7 días.',
    });
  }

  return alerts;
}
