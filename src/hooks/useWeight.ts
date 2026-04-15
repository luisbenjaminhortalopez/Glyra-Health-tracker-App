import { useState, useCallback } from 'react';
import { getDatabase } from '../db/database';
import { syncRecord } from '../services/cloudSync';
import type { WeightRecord, WeightInput } from '../types';

function mapRow(r: any): WeightRecord {
  return {
    id: r.id, date: r.date, weightKg: r.weight_kg,
    comments: r.comments, createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export function useWeight() {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    try {
      const db = getDatabase();
      const rows = db.getAllSync('SELECT * FROM weight_records ORDER BY date DESC');
      setRecords(rows.map(mapRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  }, []);

  const fetchById = useCallback((id: number): WeightRecord | null => {
    try {
      const db = getDatabase();
      const row = db.getFirstSync('SELECT * FROM weight_records WHERE id = ?', [id]);
      return row ? mapRow(row) : null;
    } catch { return null; }
  }, []);

  const createRecord = useCallback((input: WeightInput) => {
    try {
      const db = getDatabase();
      db.runSync(
        'INSERT INTO weight_records (date, weight_kg, comments) VALUES (?, ?, ?)',
        [input.date, input.weightKg, input.comments ?? null]
      );
      syncRecord('weight_records', 'add', input);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    }
  }, []);

  const updateRecord = useCallback((id: number, input: WeightInput) => {
    try {
      const db = getDatabase();
      db.runSync(
        `UPDATE weight_records SET date=?, weight_kg=?, comments=?, updated_at=datetime('now') WHERE id=?`,
        [input.date, input.weightKg, input.comments ?? null, id]
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
      db.runSync('DELETE FROM weight_records WHERE id = ?', [id]);
      return true;
    } catch { return false; }
  }, []);

  return { records, loading, error, fetchRecords, fetchById, createRecord, updateRecord, deleteRecord };
}
