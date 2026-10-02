import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', AuthController.login);
router.post('/register', AuthController.registerRecluta);
router.post('/reclutas', AuthController.registerRecluta); // Alias para compatibilidad
router.post('/administradores', AuthController.registerAdmin);

export default router;
