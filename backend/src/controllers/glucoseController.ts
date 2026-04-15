import { Request, Response } from 'express';
import * as glucoseRepo from '../db/glucoseRepository';
import { mmolToMgdl } from '../services/glucoseConverter';
import { classify } from '../services/glucoseClassifier';
import { evaluateAlerts } from '../services/glucoseAlerts';
import { getWeeklyGlucoseMetrics } from '../services/metricsService';
import { MealContext } from '../../../src/types/index';

/**
 * Determines the MealContext from the input fields.
 * If hadMeal && hoursSinceMeal >= 1 && hoursSinceMeal <= 2 → 'post-meal', else → 'fasting'
 */
function determineMealContext(hadMeal: boolean, hoursSinceMeal?: number): MealContext {
  if (hadMeal && hoursSinceMeal != null && hoursSinceMeal >= 1 && hoursSinceMeal <= 2) {
    return 'post-meal';
  }
  return 'fasting';
}

/**
 * Formats a Date as 'YYYY-MM-DD'.
 */
function formatDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * GET /api/glucose
 */
export function getAllGlucose(_req: Request, res: Response): void {
  try {
    const records = glucoseRepo.getAll();
    res.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener registros de glucosa';
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/glucose/:id
 */
export function getGlucoseById(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    const record = glucoseRepo.getById(id);
    if (!record) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener registro de glucosa';
    res.status(500).json({ error: message });
  }
}

/**
 * POST /api/glucose
 * Body: GlucoseInput { date, time, hadMeal, hoursSinceMeal?, valueMmol }
 */
export function createGlucose(req: Request, res: Response): void {
  try {
    const { date, time, hadMeal, hoursSinceMeal, valueMmol } = req.body;

    // Validation
    if (!date || !time || valueMmol == null) {
      res.status(400).json({ error: 'Los campos date, time y valueMmol son obligatorios' });
      return;
    }

    if (typeof valueMmol !== 'number' || valueMmol <= 0) {
      res.status(400).json({ error: 'El valor de glucosa debe ser un número positivo' });
      return;
    }

    const mealFlag = !!hadMeal;
    const context = determineMealContext(mealFlag, hoursSinceMeal);
    const valueMgdl = mmolToMgdl(valueMmol);
    const classification = classify(valueMgdl, context);

    const record = glucoseRepo.create({
      date,
      time,
      hadMeal: mealFlag,
      hoursSinceMeal: mealFlag ? (hoursSinceMeal ?? null) : null,
      valueMmol,
      valueMgdl,
      classification,
    });

    res.status(201).json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear registro de glucosa';
    res.status(500).json({ error: message });
  }
}

/**
 * PUT /api/glucose/:id
 * Body: GlucoseInput { date, time, hadMeal, hoursSinceMeal?, valueMmol }
 */
export function updateGlucose(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const { date, time, hadMeal, hoursSinceMeal, valueMmol } = req.body;

    if (!date || !time || valueMmol == null) {
      res.status(400).json({ error: 'Los campos date, time y valueMmol son obligatorios' });
      return;
    }

    if (typeof valueMmol !== 'number' || valueMmol <= 0) {
      res.status(400).json({ error: 'El valor de glucosa debe ser un número positivo' });
      return;
    }

    const mealFlag = !!hadMeal;
    const context = determineMealContext(mealFlag, hoursSinceMeal);
    const valueMgdl = mmolToMgdl(valueMmol);
    const classification = classify(valueMgdl, context);

    const record = glucoseRepo.update(id, {
      date,
      time,
      hadMeal: mealFlag,
      hoursSinceMeal: mealFlag ? (hoursSinceMeal ?? null) : null,
      valueMmol,
      valueMgdl,
      classification,
    });

    if (!record) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }

    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar registro de glucosa';
    res.status(500).json({ error: message });
  }
}

/**
 * DELETE /api/glucose/:id
 */
export function deleteGlucose(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const deleted = glucoseRepo.deleteById(id);
    if (!deleted) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar registro de glucosa';
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/glucose/metrics
 * Returns weekly glucose metrics comparing current week vs previous week.
 */
export function getGlucoseMetrics(_req: Request, res: Response): void {
  try {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon, ...
    // Calculate start of current week (Monday)
    const diffToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - diffToMonday);

    const currentWeekEnd = new Date(today);

    const previousWeekEnd = new Date(currentWeekStart);
    previousWeekEnd.setDate(previousWeekEnd.getDate() - 1);
    const previousWeekStart = new Date(previousWeekEnd);
    previousWeekStart.setDate(previousWeekStart.getDate() - 6);

    const currentWeekRecords = glucoseRepo.getRecordsByDateRange(
      formatDate(currentWeekStart),
      formatDate(currentWeekEnd)
    );
    const previousWeekRecords = glucoseRepo.getRecordsByDateRange(
      formatDate(previousWeekStart),
      formatDate(previousWeekEnd)
    );

    const metrics = getWeeklyGlucoseMetrics(currentWeekRecords, previousWeekRecords);
    res.json(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener métricas de glucosa';
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/glucose/alerts
 * Returns unique alerts from the last 7 days of glucose records.
 */
export function getGlucoseAlerts(_req: Request, res: Response): void {
  try {
    const today = new Date();
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    const recentRecords = glucoseRepo.getRecordsByDateRange(
      formatDate(sevenDaysAgo),
      formatDate(today)
    );

    const allAlerts: Array<{ type: string; severity: string; message: string }> = [];
    const seenTypes = new Set<string>();

    for (const record of recentRecords) {
      const alerts = evaluateAlerts(record, recentRecords);
      for (const alert of alerts) {
        if (!seenTypes.has(alert.type)) {
          seenTypes.add(alert.type);
          allAlerts.push(alert);
        }
      }
    }

    res.json(allAlerts);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener alertas de glucosa';
    res.status(500).json({ error: message });
  }
}
