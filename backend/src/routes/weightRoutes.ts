import { Router } from 'express';
import {
  getAllWeight,
  getWeightById,
  createWeight,
  updateWeight,
  deleteWeight,
} from '../controllers/weightController';

const router = Router();

router.get('/', getAllWeight);
router.post('/', createWeight);
router.get('/:id', getWeightById);
router.put('/:id', updateWeight);
router.delete('/:id', deleteWeight);

export default router;
