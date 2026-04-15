import { Router } from 'express';
import {
  getExercise,
  updateExercise,
} from '../controllers/exerciseController';

const router = Router();

router.get('/', getExercise);
router.put('/', updateExercise);

export default router;
