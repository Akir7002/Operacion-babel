import { Router } from 'express';
import { GameController } from '../controllers/game.controller.js';

const router = Router();

router.post('/sesiones', GameController.startSession);
router.put('/sesiones/:idSesion/finalizar', GameController.finishSession);
router.post('/game-over', GameController.gameOver);
router.post('/flashcards/progreso', GameController.saveCardProgress);
router.post('/puntos', GameController.addPoints);
router.get('/estadisticas/:idUsuario', GameController.getStats);
router.get('/perfil/:idUsuario/historial', GameController.getHistory);
router.get('/logros/:idUsuario', GameController.getAchievements);
router.post('/logros/evaluar', GameController.evaluateAchievements);

export default router;
