import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthRequest extends Request {
  user?: User;
}

// Generate JWT token
export function generateToken(user: User): string {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email || user.username 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

// Verify JWT token
export function verifyToken(token: string): { userId: string; email: string } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return { userId: decoded.userId, email: decoded.email };
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

// Hash password
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Compare password
export async function comparePassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Authentication middleware
export async function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    // In a real app, you'd fetch the user from database here
    // For now, we'll use the decoded info
    req.user = { 
      id: decoded.userId, 
      username: decoded.email.split('@')[0],
      email: decoded.email 
    } as User;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
}

// Optional authentication middleware (doesn't fail if no token)
export async function optionalAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = verifyToken(token);
      req.user = { 
        id: decoded.userId, 
        username: decoded.email.split('@')[0],
        email: decoded.email 
      } as User;
    } catch (error) {
      // Ignore invalid tokens in optional auth
    }
  }
  
  next();
}