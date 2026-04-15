import { useState, useCallback } from 'react';
import { getDatabase } from '../db/database';
import { syncUserProfile } from '../services/cloudSync';

export interface UserConfig {
  name: string | null;
  weightKg: number | null;
  heightCm: number | null;
  birthdate: string | null;
  sex: 'male' | 'female' | null;
}

export function useUser() {
  const [user, setUser] = useState<UserConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUser = useCallback((): UserConfig | null => {
    setLoading(true);
    setError(null);
    try {
      const db = getDatabase();
      const row = db.getFirstSync<any>('SELECT name, weight_kg, height_cm, birthdate, sex FROM user_config LIMIT 1');
      const result: UserConfig = {
        name: row?.name ?? null,
        weightKg: row?.weight_kg ?? null,
        heightCm: row?.height_cm ?? null,
        birthdate: row?.birthdate ?? null,
        sex: row?.sex ?? null,
      };
      setUser(result);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al obtener usuario');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const saveUser = useCallback((
    name: string,
    weightKg?: number,
    heightCm?: number,
    birthdate?: string,
    sex?: 'male' | 'female',
  ): boolean => {
    setLoading(true);
    setError(null);
    try {
      const trimmed = name.trim();
      if (trimmed.length < 1 || trimmed.length > 50) {
        throw new Error('El nombre debe tener entre 1 y 50 caracteres');
      }
      const db = getDatabase();
      const existing = db.getFirstSync<{ id: number }>('SELECT id FROM user_config LIMIT 1');
      if (existing) {
        db.runSync(
          'UPDATE user_config SET name=?, weight_kg=COALESCE(?, weight_kg), height_cm=COALESCE(?, height_cm), birthdate=COALESCE(?, birthdate), sex=COALESCE(?, sex) WHERE id=?',
          [trimmed, weightKg ?? null, heightCm ?? null, birthdate ?? null, sex ?? null, existing.id]
        );
      } else {
        db.runSync(
          'INSERT INTO user_config (name, weight_kg, height_cm, birthdate, sex) VALUES (?, ?, ?, ?, ?)',
          [trimmed, weightKg ?? null, heightCm ?? null, birthdate ?? null, sex ?? null]
        );
      }
      const result: UserConfig = {
        name: trimmed,
        weightKg: weightKg ?? null,
        heightCm: heightCm ?? null,
        birthdate: birthdate ?? null,
        sex: sex ?? null,
      };
      setUser(result);
      syncUserProfile({ name: trimmed, weightKg: weightKg ?? null, heightCm: heightCm ?? null, birthdate: birthdate ?? null, sex: sex ?? null });
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar usuario');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { user, loading, error, getUser, saveUser };
}
