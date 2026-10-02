import { Router } from 'express';
import { UserController } from '../controllers/user.controller.js';

const router = Router();

router.get('/usuarios/activos', UserController.getActiveUsers);
router.get('/intendentes/activos', UserController.getActiveIntendentes);
router.get('/perfil/:idUsuario', UserController.getProfile);
router.delete('/usuarios/:idUsuario', UserController.deleteUser);
router.delete('/administradores/:idUsuario', UserController.deleteUser);
router.get('/configuracion/:idUsuario', UserController.getConfig);
router.put('/configuracion/:idUsuario', UserController.updateConfig);
router.post('/usuarios/:idUsuario/regenerar-vidas', UserController.regenerateLives);

export default router;
