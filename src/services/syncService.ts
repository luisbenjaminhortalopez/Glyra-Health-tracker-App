import NetInfo from '@react-native-community/netinfo';
import { auth } from '../config/firebase';
import * as fs from './firestore';
import { getDatabase } from '../db/database';

export async function syncToCloud(): Promise<boolean> {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return false;

    const user = auth.currentUser;
    if (!user) return false;

    const db = getDatabase();
    const userId = user.uid;

    // Sync user profile
    const userRow = db.getFirstSync<any>('SELECT * FROM user_config LIMIT 1');
    if (userRow) {
      await fs.saveUserProfile(userId, {
        name: userRow.name,
        weightKg: userRow.weight_kg,
        heightCm: userRow.height_cm,
        birthdate: userRow.birthdate,
        sex: userRow.sex,
      });
    }

    // Sync glucose records
    await syncCollection(userId, 'glucose_records', 'glucose_records', (r: any) => ({
      date: r.date, time: r.time, hadMeal: !!r.had_meal,
      hoursSinceMeal: r.hours_since_meal, valueMmol: r.value_mmol,
      valueMgdl: r.value_mgdl, classification: r.classification,
    }));

    // Sync blood pressure
    await syncCollection(userId, 'blood_pressure_records', 'blood_pressure_records', (r: any) => ({
      date: r.date, time: r.time, systolic: r.systolic,
      diastolic: r.diastolic, pulse: r.pulse,
    }));

    // Sync weight
    await syncCollection(userId, 'weight_records', 'weight_records', (r: any) => ({
      date: r.date, weightKg: r.weight_kg, comments: r.comments,
    }));

    // Sync exercise
    await syncCollection(userId, 'exercise_records', 'exercise_records', (r: any) => ({
      date: r.date, exerciseType: r.exercise_type, durationMinutes: r.duration_minutes,
    }));

    // Sync medications
    const meds = db.getAllSync('SELECT * FROM medications');
    for (const m of meds as any[]) {
      await fs.addRecord(userId, 'medications', {
        name: m.name, type: m.type, frequency: m.frequency,
        frequencyHours: m.frequency_hours, startTime: m.start_time,
        endDate: m.end_date, active: !!m.active,
        days: {
          monday: !!m.monday, tuesday: !!m.tuesday, wednesday: !!m.wednesday,
          thursday: !!m.thursday, friday: !!m.friday, saturday: !!m.saturday, sunday: !!m.sunday,
        },
      });
    }

    return true;
  } catch {
    return false;
  }
}

async function syncCollection(
  userId: string, sqlTable: string, firestoreCol: string,
  mapper: (row: any) => Record<string, any>
) {
  const db = getDatabase();
  const rows = db.getAllSync(`SELECT * FROM ${sqlTable}`);
  for (const row of rows as any[]) {
    await fs.addRecord(userId, firestoreCol, mapper(row));
  }
}

export async function syncFromCloud(): Promise<boolean> {
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected) return false;

    const user = auth.currentUser;
    if (!user) return false;

    const db = getDatabase();
    const userId = user.uid;

    // Clear local data before pulling to avoid duplicates
    db.execSync(`
      DELETE FROM glucose_records;
      DELETE FROM blood_pressure_records;
      DELETE FROM weight_records;
      DELETE FROM exercise_records;
      DELETE FROM medications;
      DELETE FROM user_config;
    `);

    // Pull user profile
    const profile = await fs.getUserProfile(userId);
    if (profile) {
      const existing = db.getFirstSync<{ id: number }>('SELECT id FROM user_config LIMIT 1');
      if (existing) {
        db.runSync(
          'UPDATE user_config SET name=COALESCE(?,name), weight_kg=COALESCE(?,weight_kg), height_cm=COALESCE(?,height_cm), birthdate=COALESCE(?,birthdate), sex=COALESCE(?,sex) WHERE id=?',
          [profile.name, profile.weightKg, profile.heightCm, profile.birthdate, profile.sex, existing.id]
        );
      } else {
        db.runSync(
          'INSERT INTO user_config (name, weight_kg, height_cm, birthdate, sex) VALUES (?, ?, ?, ?, ?)',
          [profile.name, profile.weightKg ?? null, profile.heightCm ?? null, profile.birthdate ?? null, profile.sex ?? null]
        );
      }
    }

    // Pull glucose records
    await pullCollection(userId, 'glucose_records', (r: any) => {
      db.runSync(
        `INSERT INTO glucose_records (date, time, had_meal, hours_since_meal, value_mmol, value_mgdl, classification) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [r.date, r.time, r.hadMeal ? 1 : 0, r.hoursSinceMeal ?? null, r.valueMmol, r.valueMgdl, r.classification]
      );
    });

    // Pull blood pressure records
    await pullCollection(userId, 'blood_pressure_records', (r: any) => {
      db.runSync(
        `INSERT INTO blood_pressure_records (date, time, systolic, diastolic, pulse) VALUES (?, ?, ?, ?, ?)`,
        [r.date, r.time, r.systolic, r.diastolic, r.pulse]
      );
    });

    // Pull weight records
    await pullCollection(userId, 'weight_records', (r: any) => {
      db.runSync(
        `INSERT INTO weight_records (date, weight_kg, comments) VALUES (?, ?, ?)`,
        [r.date, r.weightKg, r.comments ?? null]
      );
    });

    // Pull exercise records
    await pullCollection(userId, 'exercise_records', (r: any) => {
      db.runSync(
        `INSERT INTO exercise_records (date, exercise_type, duration_minutes) VALUES (?, ?, ?)`,
        [r.date, r.exerciseType, r.durationMinutes]
      );
    });

    // Pull medications
    await pullCollection(userId, 'medications', (r: any) => {
      const days = r.days ?? {};
      db.runSync(
        `INSERT INTO medications (name, type, frequency, frequency_hours, start_time, end_date, active, monday, tuesday, wednesday, thursday, friday, saturday, sunday) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [r.name, r.type, r.frequency, r.frequencyHours, r.startTime, r.endDate ?? null, r.active ? 1 : 0,
         days.monday ? 1 : 0, days.tuesday ? 1 : 0, days.wednesday ? 1 : 0, days.thursday ? 1 : 0,
         days.friday ? 1 : 0, days.saturday ? 1 : 0, days.sunday ? 1 : 0]
      );
    });

    return true;
  } catch {
    return false;
  }
}

async function pullCollection(userId: string, colName: string, inserter: (record: any) => void) {
  try {
    const records = await fs.getAllRecords(userId, colName, 'createdAt', 'asc');
    for (const record of records) {
      try { inserter(record); } catch {}
    }
  } catch {}
}
