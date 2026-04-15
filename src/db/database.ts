import * as SQLite from 'expo-sqlite';

let db: SQLite.SQLiteDatabase | null = null;

export function getDatabase(): SQLite.SQLiteDatabase {
  if (!db) {
    db = SQLite.openDatabaseSync('health-tracker.db');
    initTables(db);
  }
  return db;
}

function initTables(database: SQLite.SQLiteDatabase): void {
  database.execSync(`
    CREATE TABLE IF NOT EXISTS user_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 50),
      weight_kg REAL,
      height_cm REAL,
      birthdate TEXT,
      sex TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
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
    );
    CREATE TABLE IF NOT EXISTS blood_pressure_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      systolic INTEGER NOT NULL,
      diastolic INTEGER NOT NULL,
      pulse INTEGER NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS weight_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      weight_kg REAL NOT NULL,
      comments TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
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
    );
    CREATE TABLE IF NOT EXISTS exercise_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      exercise_type TEXT NOT NULL,
      duration_minutes REAL NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS medications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      frequency TEXT NOT NULL,
      frequency_hours REAL NOT NULL,
      start_time TEXT NOT NULL,
      monday INTEGER DEFAULT 0,
      tuesday INTEGER DEFAULT 0,
      wednesday INTEGER DEFAULT 0,
      thursday INTEGER DEFAULT 0,
      friday INTEGER DEFAULT 0,
      saturday INTEGER DEFAULT 0,
      sunday INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1,
      end_date TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);

  // Migration: add weight_kg and height_cm to user_config if missing
  try {
    const cols = database.getAllSync<{ name: string }>("PRAGMA table_info(user_config)");
    const colNames = cols.map((c) => c.name);
    if (!colNames.includes('weight_kg')) {
      database.execSync('ALTER TABLE user_config ADD COLUMN weight_kg REAL');
    }
    if (!colNames.includes('height_cm')) {
      database.execSync('ALTER TABLE user_config ADD COLUMN height_cm REAL');
    }
    if (!colNames.includes('birthdate')) {
      database.execSync("ALTER TABLE user_config ADD COLUMN birthdate TEXT");
    }
    if (!colNames.includes('sex')) {
      database.execSync("ALTER TABLE user_config ADD COLUMN sex TEXT");
    }
  } catch {}

  // Migration: add end_date to medications if missing
  try {
    const medCols = database.getAllSync<{ name: string }>("PRAGMA table_info(medications)");
    const medColNames = medCols.map((c) => c.name);
    if (!medColNames.includes('end_date')) {
      database.execSync("ALTER TABLE medications ADD COLUMN end_date TEXT");
    }
  } catch {}
}
