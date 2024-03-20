import { Router } from 'express';
const router = Router();
import { updatePassword } from '../controllers/userController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

router.put('/password', verifyToken, updatePassword);

export default router;
