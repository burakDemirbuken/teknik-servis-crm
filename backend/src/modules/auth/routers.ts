import { Router } from 'express';
import { register, login } from './controllers/auth.js';

const router = Router();

// POST /api/auth/register - Yeni kullanıcı kaydı
router.post('/register', register);

// POST /api/auth/login - Giriş yap
router.post('/login', login);

export default router;