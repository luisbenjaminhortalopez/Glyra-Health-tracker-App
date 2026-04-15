import type { MealContext, GlucoseClassification } from '../types';

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

export function determineMealContext(hadMeal: boolean, hoursSinceMeal?: number | null): MealContext {
  if (hadMeal && hoursSinceMeal != null && hoursSinceMeal >= 1 && hoursSinceMeal <= 2) {
    return 'post-meal';
  }
  return 'fasting';
}
