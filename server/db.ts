import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

export interface DbUser {
  id: string;
  email: string; // Lowercase normalized Gmail/email
  name: string;
  nameBn: string;
  nameEn: string;
  phone?: string;
  passwordHash: string; // bcrypt hash
  seedPhraseHash?: string; // bcrypt hash of 12 words (NEVER raw phrase!)
  seedBackupEnabled: boolean;
  monthlyBudget: number;
  institutionOrJob?: string;
  bioBn?: string;
  bioEn?: string;
  preferredLanguage: 'bn' | 'en';
  themeMode?: 'dark' | 'light' | 'system';
  currency: string;
  currencySymbol: string;
  tokenVersion: number; // Increment on password reset / seed recovery / logout to invalidate old sessions
  createdAt: number;
  lastLoginAt: number;
  securityAuditLogs: Array<{
    id: string;
    type: 'login' | 'register' | 'password_reset' | 'seed_recovery' | 'seed_regenerated' | 'logout';
    timestamp: number;
    detail: string;
    ip?: string;
  }>;
  resetTokens?: Array<{
    codeHash: string;
    expiresAt: number;
    used: boolean;
  }>;
  seedRecoveryTokens?: Array<{
    codeHash: string;
    expiresAt: number;
    used: boolean;
  }>;
}

export interface UserDataPayload {
  userId: string;
  user: any;
  accounts: any[];
  transactions: any[];
  categories: any[];
  customCategories: any[];
  activeMonthId: string;
  updatedAt: number;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const USERDATA_DIR = path.join(DATA_DIR, 'user_states');

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(USERDATA_DIR)) {
    fs.mkdirSync(USERDATA_DIR, { recursive: true });
  }
}

// In-memory caches backed by disk for high speed and durability
let usersMap = new Map<string, DbUser>();
let userDataMap = new Map<string, UserDataPayload>();

export function initDb() {
  ensureDirectories();

  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const list: DbUser[] = JSON.parse(raw);
      list.forEach((u) => usersMap.set(u.id, u));
    }
  } catch (err) {
    console.error('Error loading users from disk:', err);
  }

  try {
    const files = fs.readdirSync(USERDATA_DIR);
    for (const f of files) {
      if (f.endsWith('.json')) {
        const raw = fs.readFileSync(path.join(USERDATA_DIR, f), 'utf-8');
        const data: UserDataPayload = JSON.parse(raw);
        userDataMap.set(data.userId, data);
      }
    }
  } catch (err) {
    console.error('Error loading user data files:', err);
  }
}

function flushUsersToDisk() {
  ensureDirectories();
  const list = Array.from(usersMap.values());
  fs.writeFileSync(USERS_FILE, JSON.stringify(list, null, 2), 'utf-8');
}

function flushUserDataToDisk(userId: string) {
  ensureDirectories();
  const data = userDataMap.get(userId);
  if (data) {
    const filePath = path.join(USERDATA_DIR, `${userId}.json`);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }
}

export function findUserByEmail(email: string): DbUser | undefined {
  const norm = email.trim().toLowerCase();
  for (const u of usersMap.values()) {
    if (u.email === norm) {
      return u;
    }
  }
  return undefined;
}

export function findUserById(userId: string): DbUser | undefined {
  return usersMap.get(userId);
}

export function saveUser(user: DbUser): void {
  usersMap.set(user.id, user);
  flushUsersToDisk();
}

export function getUserStateData(userId: string): UserDataPayload | undefined {
  return userDataMap.get(userId);
}

export function saveUserStateData(data: UserDataPayload): void {
  userDataMap.set(data.userId, data);
  flushUserDataToDisk(data.userId);
}

export function generateDefaultStateForUser(user: DbUser): UserDataPayload {
  const now = new Date();
  const year = now.getFullYear();
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const curMonthId = `${year}-${monthStr}`;

  const defaultAccount = {
    id: curMonthId,
    year,
    month: now.getMonth() + 1,
    startingBalance: user.monthlyBudget || 15000,
    additionalIncome: 0,
    carryForwardAmount: 0,
    carryForward: 0,
    targetBudget: user.monthlyBudget || 14000,
    notes: user.preferredLanguage === 'bn' ? 'চলতি মাসের হিসাব' : 'Monthly Account',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const defaultState: UserDataPayload = {
    userId: user.id,
    user: {
      id: user.id,
      name: user.preferredLanguage === 'bn' ? user.nameBn || user.name : user.nameEn || user.name,
      nameBn: user.nameBn,
      nameEn: user.nameEn,
      phone: user.phone || '',
      email: user.email,
      monthlyBudget: user.monthlyBudget,
      institutionOrJob: user.institutionOrJob || '',
      bioBn: user.bioBn || '',
      bioEn: user.bioEn || '',
      themeMode: user.themeMode || 'dark',
      preferredLanguage: user.preferredLanguage || 'bn',
      currency: 'BDT',
      currencySymbol: '৳',
      onboardingCompleted: true,
      hasCompletedOnboarding: true,
      seedBackupEnabled: user.seedBackupEnabled,
      seedPhraseEnabled: user.seedBackupEnabled,
      googleConnected: false,
      createdAt: user.createdAt,
    },
    accounts: [defaultAccount],
    transactions: [],
    categories: [],
    customCategories: [],
    activeMonthId: curMonthId,
    updatedAt: Date.now(),
  };

  saveUserStateData(defaultState);
  return defaultState;
}
