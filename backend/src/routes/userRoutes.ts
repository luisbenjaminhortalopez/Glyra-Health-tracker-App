import { Router } from 'express';
import { getUserHandler, createOrUpdateUserHandler } from '../controllers/userController';

const router = Router();

router.get('/', getUserHandler);
router.post('/', createOrUpdateUserHandler);

export default router;
