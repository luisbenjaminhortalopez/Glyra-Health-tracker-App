import { Request, Response } from 'express';
import * as exerciseRepo from '../db/exerciseRepository';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

/**
 * Returns the Monday of the current week in 'YYYY-MM-DD' format.
 */
function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun, 1=Mon, ...
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  const year = monday.getFullYear();
  const month = String(monday.getMonth() + 1).padStart(2, '0');
  const date = String(monday.getDate()).padStart(2, '0');
  return `${year}-${month}-${date}`;
}

/**
 * Returns a default empty exercise week for a given weekStart.
 */
function defaultExerciseWeek(weekStart: string) {
  const days: Record<string, boolean> = {};
  for (const day of DAY_KEYS) {
    days[day] = false;
  }
  return {
    id: 0,
    weekStart,
    days,
    avgMinutesPerDay: null,
  };
}

/**
 * GET /api/exercise
 * Query params: weekStart (optional, format 'YYYY-MM-DD', should be a Monday)
 */
export function getExercise(req: Request, res: Response): void {
  try {
    let weekStart = req.query.weekStart as string | undefined;

    if (!weekStart) {
      weekStart = getCurrentWeekMonday();
    }

    const record = exerciseRepo.getWeek(weekStart);
    if (!record) {
      res.json(defaultExerciseWeek(weekStart));
      return;
    }
    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener ejercicio semanal';
    res.status(500).json({ error: message });
  }
}

/**
 * PUT /api/exercise
 * Body: { weekStart, days: { monday: bool, ... }, avgMinutesPerDay?: number }
 */
export function updateExercise(req: Request, res: Response): void {
  try {
    const { weekStart, days, avgMinutesPerDay } = req.body;

    if (!weekStart) {
      res.status(400).json({ error: 'El campo weekStart es obligatorio' });
      return;
    }

    if (!days || typeof days !== 'object') {
      res.status(400).json({ error: 'El campo days es obligatorio y debe ser un objeto' });
      return;
    }

    // Check if any day is selected
    const anyDaySelected = DAY_KEYS.some((day) => days[day] === true);

    // If no days selected, avgMinutesPerDay should be null
    const effectiveAvgMinutes = anyDaySelected ? (avgMinutesPerDay ?? null) : null;

    const record = exerciseRepo.updateWeek({
      weekStart,
      days,
      avgMinutesPerDay: effectiveAvgMinutes,
    });

    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar ejercicio semanal';
    res.status(500).json({ error: message });
  }
}
