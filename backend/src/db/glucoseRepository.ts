import { getDatabase, saveDatabase } from './database';
import { GlucoseClassification } from '../../../src/types/index';

export interface GlucoseRecord {
  id: number;
  date: string;
  time: string;
  hadMeal: boolean;
  hoursSinceMeal: number | null;
  valueMmol: number;
  valueMgdl: number;
  classification: GlucoseClassification;
  createdAt: string;
  updatedAt: string;
}

/** Parameters for creating/updating a glucose record (includes computed fields). */
export interface GlucoseCreateParams {
  date: string;
  time: string;
  hadMeal: boolean;
  hoursSinceMeal?: number | null;
  valueMmol: number;
  valueMgdl: number;
  classification: GlucoseClassification;
}

export type GlucoseUpdateParams = GlucoseCreateParams;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToRecord(row: Record<string, unknown>): GlucoseRecord {
  return {
    id: row.id as number,
    date: row.date as string,
    time: row.time as string,
    hadMeal: (row.had_meal as number) === 1,
    hoursSinceMeal: row.hours_since_meal != null ? (row.hours_since_meal as number) : null,
    valueMmol: row.value_mmol as number,
    valueMgdl: row.value_mgdl as number,
    classification: row.classification as GlucoseClassification,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Returns all glucose records ordered by date descending, then time descending.
 */
export function getAll(): GlucoseRecord[] {
  const db = getDatabase();
  const records: GlucoseRecord[] = [];
  const stmt = db.prepare(
    'SELECT * FROM glucose_records ORDER BY date DESC, time DESC'
  );

  try {
    while (stmt.step()) {
      records.push(rowToRecord(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }

  return records;
}

/**
 * Returns a single glucose record by ID, or null if not found.
 */
export function getById(id: number): GlucoseRecord | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM glucose_records WHERE id = ?');

  try {
    stmt.bind([id]);
    if (stmt.step()) {
      return rowToRecord(stmt.getAsObject());
    }
    return null;
  } finally {
    stmt.free();
  }
}

/**
 * Creates a new glucose record and returns the created record.
 */
export function create(params: GlucoseCreateParams): GlucoseRecord {
  const db = getDatabase();

  db.run(
    `INSERT INTO glucose_records (date, time, had_meal, hours_since_meal, value_mmol, value_mgdl, classification)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      params.date,
      params.time,
      params.hadMeal ? 1 : 0,
      params.hoursSinceMeal ?? null,
      params.valueMmol,
      params.valueMgdl,
      params.classification,
    ]
  );

  const idResult = db.exec('SELECT last_insert_rowid()');
  const newId = idResult[0].values[0][0] as number;

  saveDatabase();

  return getById(newId)!;
}

/**
 * Updates an existing glucose record. Returns the updated record or null if not found.
 */
export function update(id: number, params: GlucoseUpdateParams): GlucoseRecord | null {
  const existing = getById(id);
  if (!existing) return null;

  const db = getDatabase();

  db.run(
    `UPDATE glucose_records
     SET date = ?, time = ?, had_meal = ?, hours_since_meal = ?,
         value_mmol = ?, value_mgdl = ?, classification = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [
      params.date,
      params.time,
      params.hadMeal ? 1 : 0,
      params.hoursSinceMeal ?? null,
      params.valueMmol,
      params.valueMgdl,
      params.classification,
      id,
    ]
  );

  saveDatabase();

  return getById(id);
}

/**
 * Deletes a glucose record by ID. Returns true if a record was deleted, false otherwise.
 */
export function deleteById(id: number): boolean {
  const existing = getById(id);
  if (!existing) return false;

  const db = getDatabase();
  db.run('DELETE FROM glucose_records WHERE id = ?', [id]);

  saveDatabase();

  return true;
}

/**
 * Returns glucose records within a date range (inclusive).
 * Dates should be in 'YYYY-MM-DD' format.
 */
export function getRecordsByDateRange(startDate: string, endDate: string): GlucoseRecord[] {
  const db = getDatabase();
  const records: GlucoseRecord[] = [];
  const stmt = db.prepare(
    'SELECT * FROM glucose_records WHERE date >= ? AND date <= ? ORDER BY date DESC, time DESC'
  );

  try {
    stmt.bind([startDate, endDate]);
    while (stmt.step()) {
      records.push(rowToRecord(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }

  return records;
}
