import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';
import { db } from '../config/db.js';
import { users } from '../db/schema.js';
import { AppError } from '../utils/AppError.js';

export const getAllUsers = async () => {
  const result = await db.select({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    status: users.status,
    createdAt: users.createdAt,
    updatedAt: users.updatedAt
  }).from(users);

  return result;
};

export const createUser = async (userData) => {
  const existingUser = await db.select().from(users).where(eq(users.email, userData.email)).limit(1);

  if (existingUser.length > 0) {
    throw new AppError('Email is already registered', 409, 'CONFLICT');
  }

  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(userData.password, salt);

  const [newUser] = await db.insert(users).values({
    name: userData.name,
    email: userData.email,
    password: hashedPassword,
    role: userData.role || 'viewer',
    status: userData.status || 'active'
  }).returning({
    id: users.id,
    name: users.name,
    email: users.email,
    role: users.role,
    status: users.status
  });

  return newUser;
};

export const updateUserRole = async (id, role) => {
  const [updatedUser] = await db.update(users)
    .set({ role, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status
    });

  if (!updatedUser) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return updatedUser;
};

export const updateUserStatus = async (id, status) => {
  const [updatedUser] = await db.update(users)
    .set({ status, updatedAt: new Date() })
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      status: users.status
    });

  if (!updatedUser) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return updatedUser;
};

export const deleteUser = async (id) => {
  const [deletedUser] = await db.delete(users).where(eq(users.id, id)).returning({ id: users.id });
  
  if (!deletedUser) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  return deletedUser;
};
