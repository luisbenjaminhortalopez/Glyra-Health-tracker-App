import { Request, Response } from 'express';
import * as weightRepo from '../db/weightRepository';

/**
 * GET /api/weight
 */
export function getAllWeight(_req: Request, res: Response): void {
  try {
    const records = weightRepo.getAll();
    res.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener registros de peso';
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/weight/:id
 */
export function getWeightById(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    const record = weightRepo.getById(id);
    if (!record) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener registro de peso';
    res.status(500).json({ error: message });
  }
}

/**
 * POST /api/weight
 * Body: WeightInput { date, weightKg, comments? }
 */
export function createWeight(req: Request, res: Response): void {
  try {
    const { date, weightKg, comments } = req.body;

    if (!date || weightKg == null) {
      res.status(400).json({ error: 'Los campos date y weightKg son obligatorios' });
      return;
    }

    if (typeof weightKg !== 'number' || weightKg <= 0) {
      res.status(400).json({ error: 'El peso debe ser un número positivo' });
      return;
    }

    const record = weightRepo.create({ date, weightKg, comments });
    res.status(201).json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear registro de peso';
    res.status(500).json({ error: message });
  }
}

/**
 * PUT /api/weight/:id
 * Body: WeightInput { date, weightKg, comments? }
 */
export function updateWeight(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const { date, weightKg, comments } = req.body;

    if (!date || weightKg == null) {
      res.status(400).json({ error: 'Los campos date y weightKg son obligatorios' });
      return;
    }

    if (typeof weightKg !== 'number' || weightKg <= 0) {
      res.status(400).json({ error: 'El peso debe ser un número positivo' });
      return;
    }

    const record = weightRepo.update(id, { date, weightKg, comments });
    if (!record) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }

    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar registro de peso';
    res.status(500).json({ error: message });
  }
}

/**
 * DELETE /api/weight/:id
 */
export function deleteWeight(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const deleted = weightRepo.deleteById(id);
    if (!deleted) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar registro de peso';
    res.status(500).json({ error: message });
  }
}
