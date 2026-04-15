import { getDatabase, saveDatabase } from './database';

export interface UserConfig {
  id: number;
  name: string;
  createdAt: string;
}

/**
 * Obtiene la configuración del usuario actual.
 * Retorna null si no existe ningún usuario configurado.
 */
export function getUser(): UserConfig | null {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id, name, created_at FROM user_config ORDER BY id DESC LIMIT 1');

  try {
    if (stmt.step()) {
      const row = stmt.getAsObject() as { id: number; name: string; created_at: string };
      return {
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
      };
    }
    return null;
  } finally {
    stmt.free();
  }
}

/**
 * Crea o actualiza el nombre del usuario.
 * Valida que el nombre tenga entre 1 y 50 caracteres.
 * Si ya existe un usuario, actualiza su nombre; si no, lo crea.
 */
export function createOrUpdateUser(name: string): void {
  if (!name || name.length === 0) {
    throw new Error('El nombre es obligatorio');
  }
  if (name.length > 50) {
    throw new Error('El nombre no puede exceder 50 caracteres');
  }

  const db = getDatabase();
  const existing = getUser();

  if (existing) {
    db.run('UPDATE user_config SET name = ? WHERE id = ?', [name, existing.id]);
  } else {
    db.run('INSERT INTO user_config (name) VALUES (?)', [name]);
  }

  saveDatabase();
}
