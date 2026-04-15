import { useState, useCallback } from 'react';
import { getDatabase } from '../db/database';
import { mgdlToMmol } from '../services/glucoseConverter';
import { classify, determineMealContext } from '../services/glucoseClassifier';
import { evaluateAlerts } from '../services/glucoseAlerts';
import { syncRecord } from '../services/cloudSync';
import { getWeeklyGlucoseMetrics } from '../services/metricsService';
import type { GlucoseRecord, GlucoseInput, GlucoseMetrics, GlucoseAlert } from '../types';

function mapRow(r: any): GlucoseRecord {
  return {
    id: r.id, date: r.date, time: r.time,
    hadMeal: !!r.had_meal,
    hoursSinceMeal: r.hours_since_meal,
    valueMmol: r.value_mmol, valueMgdl: r.value_mgdl,
    classification: r.classification,
    createdAt: r.created_at, updatedAt: r.updated_at,
  };
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function useGlucose() {
  const [records, setRecords] = useState<GlucoseRecord[]>([]);
  const [metrics, setMetrics] = useState<GlucoseMetrics | null>(null);
  const [alerts, setAlerts] = useState<GlucoseAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecords = useCallback(() => {
    setLoading(true);
    try {
      const db = getDatabase();
      const rows = db.getAllSync('SELECT * FROM glucose_records ORDER BY date DESC, time DESC');
      setRecords(rows.map(mapRow));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally { setLoading(false); }
  }, []);

  const fetchById = useCallback((id: number): GlucoseRecord | null => {
    try {
      const db = getDatabase();
      const row = db.getFirstSync('SELECT * FROM glucose_records WHERE id = ?', [id]);
      return row ? mapRow(row) : null;
    } catch { return null; }
  }, []);

  const createRecord = useCallback((input: GlucoseInput) => {
    try {
      const db = getDatabase();
      const context = determineMealContext(input.hadMeal, input.hoursSinceMeal);
      const valueMmol = mgdlToMmol(input.valueMgdl);
      const classification = classify(input.valueMgdl, context);
      db.runSync(
        `INSERT INTO glucose_records (date, time, had_meal, hours_since_meal, value_mmol, value_mgdl, classification)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [input.date, input.time, input.hadMeal ? 1 : 0,
         input.hadMeal ? (input.hoursSinceMeal ?? null) : null,
         valueMmol, input.valueMgdl, classification]
      );
      syncRecord('glucose_records', 'add', { ...input, valueMmol, classification });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
      return false;
    }
  }, []);

  const updateRecord = useCallback((id: number, input: GlucoseInput) => {
    try {
      const db = getDatabase();
      const context = determineMealContext(input.hadMeal, input.hoursSinceMeal);
      const valueMmol = mgdlToMmol(input.valueMgdl);
      const classification = classify(input.valueMgdl, context);
      db.runSync(
        `UPDATE glucose_records SET date=?, time=?, had_meal=?, hours_since_meal=?,
         value_mmol=?, value_mgdl=?, classification=?, updated_at=datetime('now') WHERE id=?`,
        [input.date, input.time, input.hadMeal ? 1 : 0,
         input.hadMeal ? (input.hoursSinceMeal ?? null) : null,
         valueMmol, input.valueMgdl, classification, id]
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
      db.runSync('DELETE FROM glucose_records WHERE id = ?', [id]);
      return true;
    } catch { return false; }
  }, []);

  const fetchMetrics = useCallback(() => {
    try {
      const db = getDatabase();
      const today = new Date();
      const dow = today.getDay();
      const diffToMon = dow === 0 ? 6 : dow - 1;
      const weekStart = new Date(today); weekStart.setDate(today.getDate() - diffToMon);
      const prevEnd = new Date(weekStart); prevEnd.setDate(prevEnd.getDate() - 1);
      const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 6);

      const cur = db.getAllSync('SELECT * FROM glucose_records WHERE date BETWEEN ? AND ?',
        [formatDate(weekStart), formatDate(today)]).map(mapRow);
      const prev = db.getAllSync('SELECT * FROM glucose_records WHERE date BETWEEN ? AND ?',
        [formatDate(prevStart), formatDate(prevEnd)]).map(mapRow);
      const m = getWeeklyGlucoseMetrics(cur, prev);
      setMetrics(m);
      return m;
    } catch { return null; }
  }, []);

  const fetchAlerts = useCallback(() => {
    try {
      const db = getDatabase();
      const today = new Date();
      const ago = new Date(today); ago.setDate(today.getDate() - 7);
      const recent = db.getAllSync('SELECT * FROM glucose_records WHERE date BETWEEN ? AND ?',
        [formatDate(ago), formatDate(today)]).map(mapRow);
      const seen = new Set<string>();
      const all: GlucoseAlert[] = [];
      for (const r of recent) {
        for (const a of evaluateAlerts(r, recent)) {
          if (!seen.has(a.type)) { seen.add(a.type); all.push(a); }
        }
      }
      setAlerts(all);
      return all;
    } catch { return []; }
  }, []);

  return { records, metrics, alerts, loading, error, fetchRecords, fetchById, createRecord, updateRecord, deleteRecord, fetchMetrics, fetchAlerts };
}
