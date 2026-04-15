import { MealContext, GlucoseClassification } from '../../../src/types/index';

/**
 * GlucoseClassifierService
 * Classifies glucose values based on mg/dL value and meal context.
 *
 * Rules:
 * - Hypoglycemia (< 70 mg/dL) takes priority regardless of context
 * - Fasting: [70-99] Normal, [100-125] Prediabetes, [≥126] Diabetes
 * - Post-meal: [70-139] Normal, [140-199] Elevado, [≥200] Diabetes
 */
export function classify(valueMgdl: number, context: MealContext): GlucoseClassification {
  if (valueMgdl < 70) return 'Hipoglucemia';

  if (context === 'fasting') {
    if (valueMgdl >= 70 && valueMgdl <= 99) return 'Normal';
    if (valueMgdl >= 100 && valueMgdl <= 125) return 'Prediabetes';
    if (valueMgdl >= 126) return 'Diabetes';
  }

  if (context === 'post-meal') {
    if (valueMgdl < 140) return 'Normal';
    if (valueMgdl >= 140 && valueMgdl <= 199) return 'Elevado';
    if (valueMgdl >= 200) return 'Diabetes';
  }

  return 'Normal';
}
