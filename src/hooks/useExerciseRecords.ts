import { useState, useCallback } from 'react';
import { getDatabase } from '../db/database';
import { syncRecord } from '../services/cloudSync';
import type { ExerciseRecord, ExerciseInput } from '../types';

function mapRow(r: any): ExerciseRecord {
  return {
    id: r.id,
    date: r.date,
    exerciseType: r.exercise_type,
    durationMinutes: r.duration_minutes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useExerciseRecords() {
  const [records, setRecords] = useState<ExerciseRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    try {
      const db = getDatabase();
      const rows = db.getAllSync('SELECT * FROM exercise_records ORDER BY date DESC, created_at DESC');
      setRecords(rows.map(mapRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  }, []);

  const fetchById = useCallback((id: number): ExerciseRecord | null => {
    try {
      const db = getDatabase();
      const row = db.getFirstSync('SELECT * FROM exercise_records WHERE id = ?', [id]);
      return row ? mapRow(row) : null;
    } catch { return null; }
  }, []);

  const createRecord = useCallback((input: ExerciseInput) => {
    try {
      const db = getDatabase();
      db.runSync(
        'INSERT INTO exercise_records (date, exercise_type, duration_minutes) VALUES (?, ?, ?)',
        [input.date, input.exerciseType, input.durationMinutes]
      );
      syncRecord('exercise_records', 'add', input);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    }
  }, []);

  const updateRecord = useCallback((id: number, input: ExerciseInput) => {
    try {
      const db = getDatabase();
      db.runSync(
        `UPDATE exercise_records SET date=?, exercise_type=?, duration_minutes=?, updated_at=datetime('now') WHERE id=?`,
        [input.date, input.exerciseType, input.durationMinutes, id]
      );
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    }
  }, []);

  const deleteRecord = useCallback((id: number) => {
    try {
      const db = getDatabase();
      db.runSync('DELETE FROM exercise_records WHERE id = ?', [id]);
      return true;
    } catch { return false; }
  }, []);

  // Returns daily totals for the last N days (0 if no records that day)
  const getDailyTotals = useCallback((days: number = 30): { date: string; total: number }[] => {
    try {
      const db = getDatabase();
      const today = new Date();
      const start = new Date(today);
      start.setDate(today.getDate() - (days - 1));
      const rows = db.getAllSync<{ date: string; total: number }>(
        `SELECT date, SUM(duration_minutes) as total FROM exercise_records
         WHERE date >= ? GROUP BY date ORDER BY date ASC`,
        [formatDate(start)]
      );
      // Fill missing days with 0
      const map: Record<string, number> = {};
      rows.forEach((r) => { map[r.date] = r.total; });
      const result: { date: string; total: number }[] = [];
      for (let i = 0; i < days; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const key = formatDate(d);
        result.push({ date: key, total: map[key] ?? 0 });
      }
      return result;
    } catch { return []; }
  }, []);

  return { records, loading, error, fetchRecords, fetchById, createRecord, updateRecord, deleteRecord, getDailyTotals };
}
