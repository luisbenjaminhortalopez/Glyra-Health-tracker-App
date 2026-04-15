import { Router } from 'express';
import {
  getAllBloodPressure,
  getBloodPressureById,
  createBloodPressure,
  updateBloodPressure,
  deleteBloodPressure,
  getBloodPressureMetrics,
} from '../controllers/bloodPressureController';

const router = Router();

// Mount /metrics BEFORE /:id to avoid Express treating "metrics" as an id param
router.get('/metrics', getBloodPressureMetrics);

router.get('/', getAllBloodPressure);
router.post('/', createBloodPressure);
router.get('/:id', getBloodPressureById);
router.put('/:id', updateBloodPressure);
router.delete('/:id', deleteBloodPressure);

export default router;
