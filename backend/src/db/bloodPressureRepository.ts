import { getDatabase, saveDatabase } from './database';

export interface BloodPressureRecord {
  id: number;
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number;
  createdAt: string;
  updatedAt: string;
}

export interface BloodPressureInput {
  date: string;
  time: string;
  systolic: number;
  diastolic: number;
  pulse: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToRecord(row: Record<string, unknown>): BloodPressureRecord {
  return {
    id: row.id as number,
    date: row.date as string,
    time: row.time as string,
    systolic: row.systolic as number,
    diastolic: row.diastolic as number,
    pulse: row.pulse as number,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Returns all blood pressure records ordered by date descending, then time descending.
 */
export function getAll(): BloodPressureRecord[] {
  const db = getDatabase();
  const records: BloodPressureRecord[] = [];
  const stmt = db.prepare(
    'SELECT * FROM blood_pressure_records ORDER BY date DESC, time DESC'
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
 * Returns a single blood pressure record by ID, or null if not found.
 */
export function getById(id: number): BloodPressureRecord | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM blood_pressure_records WHERE id = ?');

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
 * Creates a new blood pressure record and returns the created record.
 */
export function create(input: BloodPressureInput): BloodPressureRecord {
  const db = getDatabase();

  db.run(
    `INSERT INTO blood_pressure_records (date, time, systolic, diastolic, pulse)
     VALUES (?, ?, ?, ?, ?)`,
    [input.date, input.time, input.systolic, input.diastolic, input.pulse]
  );

  const idResult = db.exec('SELECT last_insert_rowid()');
  const newId = idResult[0].values[0][0] as number;

  saveDatabase();

  return getById(newId)!;
}

/**
 * Updates an existing blood pressure record. Returns the updated record or null if not found.
 */
export function update(id: number, input: BloodPressureInput): BloodPressureRecord | null {
  const existing = getById(id);
  if (!existing) return null;

  const db = getDatabase();

  db.run(
    `UPDATE blood_pressure_records
     SET date = ?, time = ?, systolic = ?, diastolic = ?, pulse = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [input.date, input.time, input.systolic, input.diastolic, input.pulse, id]
  );

  saveDatabase();

  return getById(id);
}

/**
 * Deletes a blood pressure record by ID. Returns true if a record was deleted, false otherwise.
 */
export function deleteById(id: number): boolean {
  const existing = getById(id);
  if (!existing) return false;

  const db = getDatabase();
  db.run('DELETE FROM blood_pressure_records WHERE id = ?', [id]);

  saveDatabase();

  return true;
}

/**
 * Returns blood pressure records for a given month.
 * Month should be in 'YYYY-MM' format. Matches records whose date starts with the month prefix.
 */
export function getByMonth(month: string): BloodPressureRecord[] {
  const db = getDatabase();
  const records: BloodPressureRecord[] = [];
  const stmt = db.prepare(
    "SELECT * FROM blood_pressure_records WHERE date LIKE ? ORDER BY date DESC, time DESC"
  );

  try {
    stmt.bind([`${month}%`]);
    while (stmt.step()) {
      records.push(rowToRecord(stmt.getAsObject()));
    }
  } finally {
    stmt.free();
  }

  return records;
}
