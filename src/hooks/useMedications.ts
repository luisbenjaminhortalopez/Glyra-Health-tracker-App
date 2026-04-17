import { useState, useCallback } from 'react';
import { getDatabase } from '../db/database';
import { scheduleMedicationNotifications, cancelMedicationNotifications } from '../services/notifications';
import { syncRecord } from '../services/cloudSync';
import type { MedicationRecord, MedicationInput } from '../types';

const DAY_KEYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

function mapRow(r: any): MedicationRecord {
  const days: Record<string, boolean> = {};
  for (const k of DAY_KEYS) days[k] = !!r[k];
  return {
    id: r.id, name: r.name, type: r.type,
    frequency: r.frequency, frequencyHours: r.frequency_hours,
    startTime: r.start_time, endDate: r.end_date ?? null,
    days, active: !!r.active, createdAt: r.created_at,
  };
}

export function useMedications() {
  const [records, setRecords] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    try {
      const db = getDatabase();
      const rows = db.getAllSync('SELECT * FROM medications ORDER BY created_at DESC');
      setRecords(rows.map(mapRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  }, []);

  const fetchById = useCallback((id: number): MedicationRecord | null => {
    try {
      const db = getDatabase();
      const row = db.getFirstSync('SELECT * FROM medications WHERE id = ?', [id]);
      return row ? mapRow(row) : null;
    } catch { return null; }
  }, []);

  const createRecord = useCallback(async (input: MedicationInput) => {
    try {
      const db = getDatabase();
      const result = db.runSync(
        `INSERT INTO medications (name, type, frequency, frequency_hours, start_time, end_date,
         monday, tuesday, wednesday, thursday, friday, saturday, sunday)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [input.name, input.type, input.frequency, input.frequencyHours, input.startTime,
         input.endDate ?? null, ...DAY_KEYS.map(k => input.days[k] ? 1 : 0)]
      );
      const med = fetchById(result.lastInsertRowId);
      if (med) {
        await scheduleMedicationNotifications(med);
        syncRecord('medications', 'add', {
          name: input.name, type: input.type, frequency: input.frequency,
          frequencyHours: input.frequencyHours, startTime: input.startTime,
          endDate: input.endDate ?? null, active: true, days: input.days,
        });
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    }
  }, [fetchById]);

  const updateRecord = useCallback(async (id: number, input: MedicationInput) => {
    try {
      const db = getDatabase();
      db.runSync(
        `UPDATE medications SET name=?, type=?, frequency=?, frequency_hours=?, start_time=?, end_date=?,
         monday=?, tuesday=?, wednesday=?, thursday=?, friday=?, saturday=?, sunday=? WHERE id=?`,
        [input.name, input.type, input.frequency, input.frequencyHours, input.startTime,
         input.endDate ?? null, ...DAY_KEYS.map(k => input.days[k] ? 1 : 0), id]
      );
      const med = fetchById(id);
      if (med) await scheduleMedicationNotifications(med);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    }
  }, [fetchById]);

  const deleteRecord = useCallback(async (id: number) => {
    try {
      await cancelMedicationNotifications(id);
      const db = getDatabase();
      db.runSync('DELETE FROM medications WHERE id = ?', [id]);
      return true;
    } catch { return false; }
  }, []);

  const toggleActive = useCallback(async (id: number) => {
    try {
      const db = getDatabase();
      db.runSync('UPDATE medications SET active = CASE WHEN active = 1 THEN 0 ELSE 1 END WHERE id = ?', [id]);
      const med = fetchById(id);
      if (med) await scheduleMedicationNotifications(med);
      return true;
    } catch { return false; }
  }, [fetchById]);

  return { records, loading, error, fetchRecords, fetchById, createRecord, updateRecord, deleteRecord, toggleActive };
}
