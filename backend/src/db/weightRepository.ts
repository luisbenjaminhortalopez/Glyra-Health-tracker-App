import { getDatabase, saveDatabase } from './database';

export interface WeightRecord {
  id: number;
  date: string;
  weightKg: number;
  comments: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface WeightInput {
  date: string;
  weightKg: number;
  comments?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToRecord(row: Record<string, unknown>): WeightRecord {
  return {
    id: row.id as number,
    date: row.date as string,
    weightKg: row.weight_kg as number,
    comments: (row.comments as string) ?? null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

// ---------------------------------------------------------------------------
// CRUD Operations
// ---------------------------------------------------------------------------

/**
 * Returns all weight records ordered by date descending.
 */
export function getAll(): WeightRecord[] {
  const db = getDatabase();
  const records: WeightRecord[] = [];
  const stmt = db.prepare('SELECT * FROM weight_records ORDER BY date DESC');

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
 * Returns a single weight record by ID, or null if not found.
 */
export function getById(id: number): WeightRecord | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM weight_records WHERE id = ?');

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
 * Creates a new weight record and returns the created record.
 */
export function create(input: WeightInput): WeightRecord {
  const db = getDatabase();

  db.run(
    `INSERT INTO weight_records (date, weight_kg, comments)
     VALUES (?, ?, ?)`,
    [input.date, input.weightKg, input.comments ?? null]
  );

  const idResult = db.exec('SELECT last_insert_rowid()');
  const newId = idResult[0].values[0][0] as number;

  saveDatabase();

  return getById(newId)!;
}

/**
 * Updates an existing weight record. Returns the updated record or null if not found.
 */
export function update(id: number, input: WeightInput): WeightRecord | null {
  const existing = getById(id);
  if (!existing) return null;

  const db = getDatabase();

  db.run(
    `UPDATE weight_records
     SET date = ?, weight_kg = ?, comments = ?,
         updated_at = datetime('now')
     WHERE id = ?`,
    [input.date, input.weightKg, input.comments ?? null, id]
  );

  saveDatabase();

  return getById(id);
}

/**
 * Deletes a weight record by ID. Returns true if a record was deleted, false otherwise.
 */
export function deleteById(id: number): boolean {
  const existing = getById(id);
  if (!existing) return false;

  const db = getDatabase();
  db.run('DELETE FROM weight_records WHERE id = ?', [id]);

  saveDatabase();

  return true;
}
