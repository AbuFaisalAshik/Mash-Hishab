import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { DbUser, findUserById } from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'amar_hishab_super_secret_jwt_key_bangladesh_2026';
const SALT_ROUNDS = 10;

export interface TokenPayload {
  userId: string;
  email: string;
  tokenVersion: number;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function hashSeedPhrase(phrase: string): Promise<string> {
  const normalized = phrase.trim().toLowerCase().split(/\s+/).join(' ');
  return bcrypt.hash(normalized, SALT_ROUNDS);
}

export async function compareSeedPhrase(phrase: string, hash: string): Promise<boolean> {
  const normalized = phrase.trim().toLowerCase().split(/\s+/).join(' ');
  return bcrypt.compare(normalized, hash);
}

export function generateJwt(user: DbUser): string {
  const payload: TokenPayload = {
    userId: user.id,
    email: user.email,
    tokenVersion: user.tokenVersion || 0,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyJwt(token: string): TokenPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = findUserById(decoded.userId);
    if (!user) return null;
    // Check if tokenVersion matches (invalidates tokens when password or recovery occurs)
    if (user.tokenVersion !== decoded.tokenVersion) {
      return null;
    }
    return decoded;
  } catch (err) {
    return null;
  }
}

export function generate6DigitCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashCode(code: string): string {
  return crypto.createHash('sha256').update(code.trim()).digest('hex');
}

/**
 * Sends a simulated security verification email (logs to server and returns metadata for preview)
 */
export function sendSecurityEmailAlert(
  email: string,
  subject: string,
  message: string,
  code?: string
) {
  console.log('---------------------------------------------------------');
  console.log(`📧 [EMAIL NOTIFICATION] To: ${email}`);
  console.log(`📌 Subject: ${subject}`);
  console.log(`📝 Message: ${message}`);
  if (code) {
    console.log(`🔑 Verification Code: ${code} (Expires in 15 minutes)`);
  }
  console.log('---------------------------------------------------------');
}
