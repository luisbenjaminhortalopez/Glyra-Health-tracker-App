import { getDatabase, saveDatabase } from './database';

export interface ExerciseWeek {
  id: number;
  weekStart: string;
  days: Record<string, boolean>;
  avgMinutesPerDay: number | null;
}

export interface ExerciseWeekInput {
  weekStart: string;
  days: Record<string, boolean>;
  avgMinutesPerDay?: number | null;
}

const DAY_COLUMNS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function rowToRecord(row: Record<string, unknown>): ExerciseWeek {
  const days: Record<string, boolean> = {};
  for (const day of DAY_COLUMNS) {
    days[day] = (row[day] as number) === 1;
  }

  return {
    id: row.id as number,
    weekStart: row.week_start as string,
    days,
    avgMinutesPerDay: (row.avg_minutes_per_day as number) ?? null,
  };
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

/**
 * Returns the exercise data for a given week, or null if no record exists.
 * @param weekStart Monday date in 'YYYY-MM-DD' format
 */
export function getWeek(weekStart: string): ExerciseWeek | null {
  const db = getDatabase();
  const stmt = db.prepare(
    'SELECT * FROM exercise_weekly WHERE week_start = ?'
  );

  try {
    stmt.bind([weekStart]);
    if (stmt.step()) {
      return rowToRecord(stmt.getAsObject());
    }
    return null;
  } finally {
    stmt.free();
  }
}

/**
 * Creates or updates the exercise data for a week (upsert by week_start).
 * Returns the saved record.
 */
export function updateWeek(input: ExerciseWeekInput): ExerciseWeek {
  const db = getDatabase();
  const existing = getWeek(input.weekStart);

  const dayValues = DAY_COLUMNS.map((day) => (input.days[day] ? 1 : 0));
  const avgMinutes = input.avgMinutesPerDay ?? null;

  if (existing) {
    db.run(
      `UPDATE exercise_weekly
       SET monday = ?, tuesday = ?, wednesday = ?, thursday = ?, friday = ?,
           saturday = ?, sunday = ?, avg_minutes_per_day = ?
       WHERE week_start = ?`,
      [...dayValues, avgMinutes, input.weekStart]
    );
  } else {
    db.run(
      `INSERT INTO exercise_weekly
       (week_start, monday, tuesday, wednesday, thursday, friday, saturday, sunday, avg_minutes_per_day)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [input.weekStart, ...dayValues, avgMinutes]
    );
  }

  saveDatabase();

  return getWeek(input.weekStart)!;
}
