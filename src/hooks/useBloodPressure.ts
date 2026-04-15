import { useState, useCallback } from 'react';
import { getDatabase } from '../db/database';
import { getMonthlyBPMetrics } from '../services/metricsService';
import { syncRecord } from '../services/cloudSync';
import type { BloodPressureRecord, BloodPressureInput, BPMetrics } from '../types';

function mapRow(r: any): BloodPressureRecord {
  return {
    id: r.id, date: r.date, time: r.time,
    systolic: r.systolic, diastolic: r.diastolic, pulse: r.pulse,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

export function useBloodPressure() {
  const [records, setRecords] = useState<BloodPressureRecord[]>([]);
  const [metrics, setMetrics] = useState<BPMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    try {
      const db = getDatabase();
      const rows = db.getAllSync('SELECT * FROM blood_pressure_records ORDER BY date DESC, time DESC');
      setRecords(rows.map(mapRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  }, []);

  const fetchById = useCallback((id: number): BloodPressureRecord | null => {
    try {
      const db = getDatabase();
      const row = db.getFirstSync('SELECT * FROM blood_pressure_records WHERE id = ?', [id]);
      return row ? mapRow(row) : null;
    } catch { return null; }
  }, []);

  const createRecord = useCallback((input: BloodPressureInput) => {
    try {
      const db = getDatabase();
      db.runSync(
        'INSERT INTO blood_pressure_records (date, time, systolic, diastolic, pulse) VALUES (?, ?, ?, ?, ?)',
        [input.date, input.time, input.systolic, input.diastolic, input.pulse]
      );
      syncRecord('blood_pressure_records', 'add', input);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    }
  }, []);

  const updateRecord = useCallback((id: number, input: BloodPressureInput) => {
    try {
      const db = getDatabase();
      db.runSync(
        `UPDATE blood_pressure_records SET date=?, time=?, systolic=?, diastolic=?, pulse=?, updated_at=datetime('now') WHERE id=?`,
        [input.date, input.time, input.systolic, input.diastolic, input.pulse, id]
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
      db.runSync('DELETE FROM blood_pressure_records WHERE id = ?', [id]);
      return true;
    } catch { return false; }
  }, []);

  const fetchMetrics = useCallback((month?: string) => {
    try {
      const db = getDatabase();
      const m = month ?? `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
      const rows = db.getAllSync(
        "SELECT * FROM blood_pressure_records WHERE date LIKE ?", [`${m}%`]
      ).map(mapRow);
      const result = getMonthlyBPMetrics(rows, m);
      setMetrics(result);
      return result;
    } catch { return null; }
  }, []);

  return { records, metrics, loading, error, fetchRecords, fetchById, createRecord, updateRecord, deleteRecord, fetchMetrics };
}
