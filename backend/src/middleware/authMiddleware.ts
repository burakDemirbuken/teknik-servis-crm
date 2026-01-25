import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import prisma from '../prisma.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

declare global {
	namespace Express {
		interface Request {
			user?: {
				id: number;
				email: string;
				name: string;
				role: string;
			};
		}
	}
}

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
	try {
		const authHeader = req.headers.authorization;

		if (!authHeader || !authHeader.startsWith('Bearer '))
			return res.status(401).json({ message: 'Authorization header missing or malformed' });
		
		const token = authHeader.split(' ')[1];

		if (!token)
			return res.status(401).json({ message: 'Token not provided' });

		// Enhanced token format validation
		if (token.split('.').length !== 3) {
			return res.status(401).json({ message: 'Invalid token format' });
		}

		// Check for obvious malformed tokens
		if (token.length < 50) {
			return res.status(401).json({ message: 'Token too short' });
		}

		// Check for valid JWT base64 format
		if (!/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token)) {
			return res.status(401).json({ message: 'Malformed token format' });
		}

		// Check for suspicious characters that might cause JSON parse errors
		if (/[\u0000-\u001F\u007F-\u009F\uFFFD\uFFFE\uFFFF]/.test(token)) {
			return res.status(401).json({ message: 'Token contains invalid characters' });
		}

		const decoded = jwt.verify(token, JWT_SECRET) as { userId: number };
	
		const user = await prisma.user.findUnique({
			where: { id: decoded.userId },
			select: {
				id: true,
				email: true,
				name: true,
				role: true,
			},
		});

		if (!user)
			return res.status(401).json({ message: 'User not found' });

		req.user = user;
		next();
	}
	catch (error: any)
	{
		console.error('Authentication error:', {
			name: error.name,
			message: error.message,
			authHeader: req.headers.authorization?.substring(0, 50) + '...'
		});

		if (error instanceof jwt.JsonWebTokenError)
			return res.status(401).json({ message: 'Invalid token' });
		if (error instanceof jwt.TokenExpiredError)
			return res.status(401).json({ message: 'Token has expired' });
		if (error instanceof SyntaxError && error.message.includes('JSON'))
			return res.status(401).json({ message: 'Corrupted token' });
		
		return res.status(401).json({ message: 'Invalid or expired token' });
	}
}