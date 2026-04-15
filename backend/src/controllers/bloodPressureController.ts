import { Request, Response } from 'express';
import * as bpRepo from '../db/bloodPressureRepository';
import { getMonthlyBPMetrics } from '../services/metricsService';

/**
 * GET /api/blood-pressure
 */
export function getAllBloodPressure(_req: Request, res: Response): void {
  try {
    const records = bpRepo.getAll();
    res.json(records);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener registros de presión arterial';
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/blood-pressure/:id
 */
export function getBloodPressureById(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }
    const record = bpRepo.getById(id);
    if (!record) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener registro de presión arterial';
    res.status(500).json({ error: message });
  }
}

/**
 * POST /api/blood-pressure
 * Body: BloodPressureInput { date, time, systolic, diastolic, pulse }
 */
export function createBloodPressure(req: Request, res: Response): void {
  try {
    const { date, time, systolic, diastolic, pulse } = req.body;

    if (!date || !time || systolic == null || diastolic == null || pulse == null) {
      res.status(400).json({ error: 'Los campos date, time, systolic, diastolic y pulse son obligatorios' });
      return;
    }

    if (typeof systolic !== 'number' || systolic <= 0) {
      res.status(400).json({ error: 'La presión sistólica debe ser un número positivo' });
      return;
    }

    if (typeof diastolic !== 'number' || diastolic <= 0) {
      res.status(400).json({ error: 'La presión diastólica debe ser un número positivo' });
      return;
    }

    if (typeof pulse !== 'number' || pulse <= 0) {
      res.status(400).json({ error: 'El pulso debe ser un número positivo' });
      return;
    }

    if (systolic <= diastolic) {
      res.status(400).json({ error: 'La presión sistólica debe ser mayor que la diastólica' });
      return;
    }

    const record = bpRepo.create({ date, time, systolic, diastolic, pulse });
    res.status(201).json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al crear registro de presión arterial';
    res.status(500).json({ error: message });
  }
}

/**
 * PUT /api/blood-pressure/:id
 * Body: BloodPressureInput { date, time, systolic, diastolic, pulse }
 */
export function updateBloodPressure(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const { date, time, systolic, diastolic, pulse } = req.body;

    if (!date || !time || systolic == null || diastolic == null || pulse == null) {
      res.status(400).json({ error: 'Los campos date, time, systolic, diastolic y pulse son obligatorios' });
      return;
    }

    if (typeof systolic !== 'number' || systolic <= 0) {
      res.status(400).json({ error: 'La presión sistólica debe ser un número positivo' });
      return;
    }

    if (typeof diastolic !== 'number' || diastolic <= 0) {
      res.status(400).json({ error: 'La presión diastólica debe ser un número positivo' });
      return;
    }

    if (typeof pulse !== 'number' || pulse <= 0) {
      res.status(400).json({ error: 'El pulso debe ser un número positivo' });
      return;
    }

    if (systolic <= diastolic) {
      res.status(400).json({ error: 'La presión sistólica debe ser mayor que la diastólica' });
      return;
    }

    const record = bpRepo.update(id, { date, time, systolic, diastolic, pulse });
    if (!record) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }

    res.json(record);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al actualizar registro de presión arterial';
    res.status(500).json({ error: message });
  }
}

/**
 * DELETE /api/blood-pressure/:id
 */
export function deleteBloodPressure(req: Request, res: Response): void {
  try {
    const id = parseInt(req.params.id as string, 10);
    if (isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' });
      return;
    }

    const deleted = bpRepo.deleteById(id);
    if (!deleted) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al eliminar registro de presión arterial';
    res.status(500).json({ error: message });
  }
}

/**
 * GET /api/blood-pressure/metrics
 * Query params: month (optional, format 'YYYY-MM', defaults to current month)
 */
export function getBloodPressureMetrics(req: Request, res: Response): void {
  try {
    let month = req.query.month as string | undefined;

    if (!month) {
      const now = new Date();
      const year = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      month = `${year}-${m}`;
    }

    const records = bpRepo.getByMonth(month);
    const metrics = getMonthlyBPMetrics(records, month);
    res.json(metrics);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Error al obtener métricas de presión arterial';
    res.status(500).json({ error: message });
  }
}
