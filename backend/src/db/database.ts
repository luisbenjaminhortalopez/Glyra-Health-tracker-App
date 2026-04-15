import initSqlJs, { Database as SqlJsDatabase } from 'sql.js';
import fs from 'fs';
import path from 'path';

let db: SqlJsDatabase | null = null;

const DB_DIR = path.join(__dirname, '..', '..', 'data');
const DB_PATH = path.join(DB_DIR, 'health-tracker.db');

/**
 * Returns the active database instance.
 * Throws if the database has not been initialized yet.
 */
export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error(
      'La base de datos no ha sido inicializada. Llama a initializeDatabase() primero.'
    );
  }
  return db;
}

/**
 * Initializes the SQLite database and creates all tables if they don't exist.
 * Uses sql.js (pure JS SQLite). Pass `':memory:'` for an in-memory database (useful for tests).
 */
export async function initializeDatabase(customPath?: string): Promise<SqlJsDatabase> {
  try {
    const SQL = await initSqlJs();

    const dbPath = customPath ?? DB_PATH;

    if (dbPath === ':memory:') {
      db = new SQL.Database();
    } else {
      // Ensure data directory exists
      const dir = path.dirname(dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(dbPath)) {
        const fileBuffer = fs.readFileSync(dbPath);
        db = new SQL.Database(fileBuffer);
      } else {
        db = new SQL.Database();
      }
    }

    createTables(db);

    return db;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error al inicializar la base de datos: ${message}`);
  }
}

function createTables(database: SqlJsDatabase): void {
  try {
    database.run(`
      CREATE TABLE IF NOT EXISTS user_config (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 50),
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS glucose_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        had_meal INTEGER NOT NULL DEFAULT 0,
        hours_since_meal REAL,
        value_mmol REAL NOT NULL,
        value_mgdl REAL NOT NULL,
        classification TEXT NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS blood_pressure_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        time TEXT NOT NULL,
        systolic INTEGER NOT NULL,
        diastolic INTEGER NOT NULL,
        pulse INTEGER NOT NULL,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS weight_records (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT NOT NULL,
        weight_kg REAL NOT NULL,
        comments TEXT,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now'))
      )
    `);

    database.run(`
      CREATE TABLE IF NOT EXISTS exercise_weekly (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        week_start TEXT NOT NULL,
        monday INTEGER DEFAULT 0,
        tuesday INTEGER DEFAULT 0,
        wednesday INTEGER DEFAULT 0,
        thursday INTEGER DEFAULT 0,
        friday INTEGER DEFAULT 0,
        saturday INTEGER DEFAULT 0,
        sunday INTEGER DEFAULT 0,
        avg_minutes_per_day REAL,
        created_at TEXT DEFAULT (datetime('now'))
      )
    `);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Error al crear las tablas de la base de datos: ${message}`);
  }
}

/**
 * Persists the current in-memory database to disk.
 * Call this after write operations when using a file-based database.
 */
export function saveDatabase(customPath?: string): void {
  if (!db) return;
  const dbPath = customPath ?? DB_PATH;
  if (dbPath === ':memory:') return;

  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const data = db.export();
  fs.writeFileSync(dbPath, Buffer.from(data));
}

/**
 * Closes the database connection. Useful for cleanup in tests.
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
