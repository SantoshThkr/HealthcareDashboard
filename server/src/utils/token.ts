import jwt from 'jsonwebtoken';

import { config } from '../config';
import { Role } from '../models/user';

export interface TokenPayload {
  sub: number;
  role: Role;
}

export function signToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as unknown as TokenPayload;
}
