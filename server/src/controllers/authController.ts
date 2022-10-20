import bcrypt from 'bcrypt';
import { Request, Response } from 'express';

import { User } from '../models';
import { ApiError } from '../utils/ApiError';
import { logger } from '../utils/logger';
import { signToken } from '../utils/token';

export const BCRYPT_ROUNDS = 10;

export async function register(req: Request, res: Response) {
  const { firstName, lastName, email, password } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw ApiError.badRequest('Validation failed', { email: 'This email is already registered' });
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
    role: 'STAFF',
    isActive: false,
  });

  res.status(201).json({
    success: true,
    message: 'Account created. An administrator needs to activate it before you can sign in.',
    data: user,
  });
}

export async function login(req: Request, res: Response) {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;

  if (!user || !passwordMatches) {
    logger.warn(`Failed login attempt from ${req.ip}`);
    throw ApiError.unauthorized('Invalid email or password');
  }

  if (!user.isActive) {
    logger.warn(`Login attempt for inactive user ${user.id}`);
    throw ApiError.forbidden('Your account is not active. Please contact an administrator.');
  }

  await user.update({ lastLoginAt: new Date() });

  res.json({
    success: true,
    data: {
      token: signToken({ sub: user.id, role: user.role }),
      user,
    },
  });
}

export async function me(req: Request, res: Response) {
  res.json({ success: true, data: req.user });
}

export async function logout(_req: Request, res: Response) {
  res.json({ success: true, data: null });
}
