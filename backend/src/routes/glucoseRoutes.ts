import { Router } from 'express';
import {
  getAllGlucose,
  getGlucoseById,
  createGlucose,
  updateGlucose,
  deleteGlucose,
  getGlucoseMetrics,
  getGlucoseAlerts,
} from '../controllers/glucoseController';

const router = Router();

// Mount /metrics and /alerts BEFORE /:id to avoid Express treating them as id params
router.get('/metrics', getGlucoseMetrics);
router.get('/alerts', getGlucoseAlerts);

router.get('/', getAllGlucose);
router.post('/', createGlucose);
router.get('/:id', getGlucoseById);
router.put('/:id', updateGlucose);
router.delete('/:id', deleteGlucose);

export default router;
