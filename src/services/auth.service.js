import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users } from '../db/schema.js';
import { AppError } from '../utils/AppError.js';

export const login = async (email, password) => {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);

  if (!user) {
    throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
  }

  if (user.status !== 'active') {
    throw new AppError('Account is not active', 403, 'FORBIDDEN');
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401, 'UNAUTHORIZED');
  }

  const token = jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  const { password: _, ...userWithoutPassword } = user;

  return {
    user: userWithoutPassword,
    token
  };
};

export const getMe = async (userId) => {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
};
