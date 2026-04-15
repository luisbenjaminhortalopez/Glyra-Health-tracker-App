import { Request, Response } from 'express';
import { getUser, createOrUpdateUser } from '../db/userRepository';

/**
 * GET /api/user
 * Obtiene la configuración del usuario actual.
 */
export function getUserHandler(_req: Request, res: Response): void {
  try {
    const user = getUser();
    if (user) {
      res.json(user);
    } else {
      res.json({ name: null });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener usuario';
    res.status(500).json({ error: message });
  }
}

/**
 * POST /api/user
 * Crea o actualiza el nombre del usuario.
 * Body: { name: string } — debe tener entre 1 y 50 caracteres.
 */
export function createOrUpdateUserHandler(req: Request, res: Response): void {
  try {
    const { name } = req.body;

    if (typeof name !== 'string') {
      res.status(400).json({ error: 'El nombre es obligatorio' });
      return;
    }

    const trimmedName = name.trim();

    createOrUpdateUser(trimmedName);
    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al guardar usuario';
    res.status(400).json({ error: message });
  }
}
