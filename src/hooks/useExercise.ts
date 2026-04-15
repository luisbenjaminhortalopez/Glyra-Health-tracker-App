import { useState, useCallback } from 'react';
import { getDatabase } from '../db/database';
import type { ExerciseWeek } from '../types';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

interface ExerciseWeekInput {
  weekStart: string;
  days: Record<string, boolean>;
  avgMinutesPerDay?: number | null;
}

function mapRow(r: any): ExerciseWeek {
  const days: Record<string, boolean> = {};
  for (const k of DAY_KEYS) days[k] = !!r[k];
  return { id: r.id, weekStart: r.week_start, days, avgMinutesPerDay: r.avg_minutes_per_day };
}

function emptyWeek(weekStart: string): ExerciseWeek {
  const days: Record<string, boolean> = {};
  for (const k of DAY_KEYS) days[k] = false;
  return { id: 0, weekStart, days, avgMinutesPerDay: null };
}

export function useExercise() {
  const [exerciseWeek, setExerciseWeek] = useState<ExerciseWeek | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeek = useCallback((weekStart?: string) => {
    setLoading(true);
    try {
      const db = getDatabase();
      const ws = weekStart ?? getCurrentWeekMonday();
      const row = db.getFirstSync('SELECT * FROM exercise_weekly WHERE week_start = ?', [ws]);
      const result = row ? mapRow(row) : emptyWeek(ws);
      setExerciseWeek(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return null;
    } finally { setLoading(false); }
  }, []);

  const updateWeek = useCallback((input: ExerciseWeekInput) => {
    setLoading(true);
    try {
      const db = getDatabase();
      const anyDay = DAY_KEYS.some((k) => input.days[k]);
      const avg = anyDay ? (input.avgMinutesPerDay ?? null) : null;
      const existing = db.getFirstSync<{ id: number }>('SELECT id FROM exercise_weekly WHERE week_start = ?', [input.weekStart]);
      if (existing) {
        db.runSync(
          `UPDATE exercise_weekly SET monday=?, tuesday=?, wednesday=?, thursday=?, friday=?, saturday=?, sunday=?, avg_minutes_per_day=? WHERE id=?`,
          [...DAY_KEYS.map((k) => input.days[k] ? 1 : 0), avg, existing.id]
        );
      } else {
        db.runSync(
          `INSERT INTO exercise_weekly (week_start, monday, tuesday, wednesday, thursday, friday, saturday, sunday, avg_minutes_per_day)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [input.weekStart, ...DAY_KEYS.map((k) => input.days[k] ? 1 : 0), avg]
        );
      }
      return fetchWeek(input.weekStart);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return null;
    } finally { setLoading(false); }
  }, [fetchWeek]);

  return { exerciseWeek, loading, error, fetchWeek, updateWeek };
}

function getCurrentWeekMonday(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, '0')}-${String(monday.getDate()).padStart(2, '0')}`;
}
