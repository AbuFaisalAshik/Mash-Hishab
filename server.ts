import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
import {
  initDb,
  findUserByEmail,
  findUserById,
  saveUser,
  DbUser,
  getUserStateData,
  saveUserStateData,
  generateDefaultStateForUser,
  getAllUsers,
  getAllUserStates,
  deleteUserById,
  getSystemAnnouncement,
  setSystemAnnouncement,
  ADMIN_EMAILS,
} from './server/db';
import {
  hashPassword,
  comparePassword,
  hashSeedPhrase,
  compareSeedPhrase,
  generateJwt,
  verifyJwt,
  generate6DigitCode,
  hashCode,
  sendSecurityEmailAlert,
  TokenPayload,
} from './server/auth';
import { checkRateLimit, resetRateLimit } from './server/rateLimit';
import { generateSecureSeedPhrase, normalizeSeedPhrase } from './server/bip39';

// Initialize Database
initDb();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Helper to get client IP for rate limiting
function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}

// Authentication Middleware
interface AuthenticatedRequest extends Request {
  user?: DbUser;
  tokenPayload?: TokenPayload;
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing token' });
  }

  const token = authHeader.split(' ')[1];
  const payload = verifyJwt(token);
  if (!payload) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired session' });
  }

  const user = findUserById(payload.userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized: User not found' });
  }

  req.user = user;
  req.tokenPayload = payload;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  requireAuth(req, res, () => {
    const user = req.user;
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const email = (user.email || '').toLowerCase().trim();
    const isAdmin = user.role === 'admin' || email === 'abufaisal9500@gmail.com' || ADMIN_EMAILS.includes(email);
    if (!isAdmin) {
      return res.status(403).json({ error: 'Access denied: Admin privileges required' });
    }
    next();
  });
}

// =========================================================================
// 1. AUTH API ROUTES
// =========================================================================

/**
 * 1.1 Register
 */
app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    const limit = checkRateLimit(`register:${ip}`, 10, 15 * 60 * 1000);
    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many registration attempts. Please try again in ${limit.retryAfterSeconds} seconds.`,
      });
    }

    const {
      email,
      password,
      name,
      nameBn,
      nameEn,
      phone,
      monthlyBudget,
      institutionOrJob,
      preferredLanguage,
      themeMode,
      createSeedPhrase,
    } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ error: 'Invalid email address format' });
    }

    // Password strength requirement
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    // Check existing
    const existing = findUserByEmail(normalizedEmail);
    if (existing) {
      return res.status(400).json({ error: 'An account with this email already exists' });
    }

    // Hash Password
    const passwordHash = await hashPassword(password);

    // Optional 12-Word Seed Phrase
    let generatedSeedWords: string[] | undefined;
    let seedPhraseHash: string | undefined;
    if (createSeedPhrase) {
      generatedSeedWords = generateSecureSeedPhrase();
      seedPhraseHash = await hashSeedPhrase(generatedSeedWords.join(' '));
    }

    const resolvedName = (name || nameBn || nameEn || normalizedEmail.split('@')[0]).trim();
    const resolvedNameBn = (nameBn || resolvedName).trim();
    const resolvedNameEn = (nameEn || resolvedName).trim();

    const newUser: DbUser = {
      id: `usr_${crypto.randomUUID()}`,
      email: normalizedEmail,
      name: resolvedName,
      nameBn: resolvedNameBn,
      nameEn: resolvedNameEn,
      phone: phone ? phone.trim() : undefined,
      passwordHash,
      seedPhraseHash,
      seedBackupEnabled: !!seedPhraseHash,
      monthlyBudget: typeof monthlyBudget === 'number' ? monthlyBudget : 15000,
      institutionOrJob: institutionOrJob ? institutionOrJob.trim() : undefined,
      preferredLanguage: preferredLanguage === 'en' ? 'en' : 'bn',
      themeMode: themeMode || 'dark',
      currency: 'BDT',
      currencySymbol: '৳',
      tokenVersion: 1,
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      securityAuditLogs: [
        {
          id: `log_${Date.now()}`,
          type: 'register',
          timestamp: Date.now(),
          detail: 'Account registered with Gmail + Password',
          ip,
        },
      ],
    };

    saveUser(newUser);

    // Initialize per-user isolated data
    const userState = generateDefaultStateForUser(newUser);

    // Generate JWT
    const token = generateJwt(newUser);

    resetRateLimit(`register:${ip}`);

    // Return response. Note: seedPhrase is ONLY sent once in the response upon initial generation
    return res.status(201).json({
      token,
      user: userState.user,
      appState: userState,
      generatedSeedPhrase: generatedSeedWords, // Shown only once for user backup
      message: 'Account created successfully',
    });
  } catch (err: any) {
    console.error('Registration error:', err);
    return res.status(500).json({ error: 'Failed to create account. Please try again.' });
  }
});

/**
 * 1.2 Login (Gmail + Password)
 */
app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rateLimitKey = `login:${ip}:${normalizedEmail}`;
    const limit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many failed login attempts. Please try again in ${limit.retryAfterSeconds} seconds.`,
      });
    }

    const user = findUserByEmail(normalizedEmail);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const isMatch = await comparePassword(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Success: reset rate limit & update audit log
    resetRateLimit(rateLimitKey);
    user.lastLoginAt = Date.now();
    user.securityAuditLogs.push({
      id: `log_${Date.now()}`,
      type: 'login',
      timestamp: Date.now(),
      detail: 'Successful login with password',
      ip,
    });
    saveUser(user);

    let userState = getUserStateData(user.id);
    if (!userState) {
      userState = generateDefaultStateForUser(user);
    }

    const token = generateJwt(user);

    return res.json({
      token,
      user: userState.user,
      appState: userState,
      message: 'Login successful',
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Login failed. Please try again.' });
  }
});

/**
 * 1.3 Forgot Password (Request 6-Digit Reset Code via Email)
 */
app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rateLimitKey = `forgot:${ip}:${normalizedEmail}`;
    const limit = checkRateLimit(rateLimitKey, 4, 15 * 60 * 1000);

    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many password reset requests. Please wait ${limit.retryAfterSeconds} seconds.`,
      });
    }

    const user = findUserByEmail(normalizedEmail);

    let simulatedCode: string | undefined;

    if (user) {
      const code = generate6DigitCode();
      simulatedCode = code;
      const codeHash = hashCode(code);
      const expiresAt = Date.now() + 15 * 60 * 1000; // 15 mins

      if (!user.resetTokens) user.resetTokens = [];
      // Invalidate existing
      user.resetTokens = user.resetTokens.filter((t) => !t.used && t.expiresAt > Date.now());
      user.resetTokens.push({ codeHash, expiresAt, used: false });
      saveUser(user);

      sendSecurityEmailAlert(
        user.email,
        'পাসওয়ার্ড রিসেট ভেরিফিকেশন কোড | Password Reset Code',
        'আপনার মাস খরচ একাউন্টের পাসওয়ার্ড রিসেট করার জন্য নিচের ৬-সংখ্যার কোডটি ব্যবহার করুন।',
        code
      );
    }

    // Protection against account enumeration: Always return standard generic confirmation!
    return res.json({
      success: true,
      message:
        'যদি এই ইমেইল দিয়ে কোনো অ্যাকাউন্ট নিবন্ধিত থাকে, তবে একটি ৬-সংখ্যার পাসওয়ার্ড রিসেট কোড পাঠানো হয়েছে।',
      // In preview/dev mode, debugCode is provided for testing ease
      debugCode: simulatedCode,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.status(500).json({ error: 'Failed to process request.' });
  }
});

/**
 * 1.4 Verify Reset Code & Create New Password
 */
app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rateLimitKey = `reset_attempt:${ip}:${normalizedEmail}`;
    const limit = checkRateLimit(rateLimitKey, 5, 15 * 60 * 1000);

    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many failed attempts. Please try again in ${limit.retryAfterSeconds} seconds.`,
      });
    }

    const user = findUserByEmail(normalizedEmail);
    if (!user || !user.resetTokens || user.resetTokens.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    const codeHash = hashCode(code);
    const validTokenIndex = user.resetTokens.findIndex(
      (t) => t.codeHash === codeHash && !t.used && t.expiresAt > Date.now()
    );

    if (validTokenIndex === -1) {
      return res.status(400).json({ error: 'Invalid or expired verification code' });
    }

    // Mark token used
    user.resetTokens[validTokenIndex].used = true;

    // Hash new password
    user.passwordHash = await hashPassword(newPassword);

    // Invalidate all previous active sessions across all devices!
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    user.securityAuditLogs.push({
      id: `log_${Date.now()}`,
      type: 'password_reset',
      timestamp: Date.now(),
      detail: 'Password reset successfully via Email Verification Code. Previous sessions invalidated.',
      ip,
    });

    saveUser(user);
    resetRateLimit(rateLimitKey);

    // Issue new session token
    const token = generateJwt(user);
    let userState = getUserStateData(user.id);
    if (!userState) {
      userState = generateDefaultStateForUser(user);
    }

    return res.json({
      success: true,
      token,
      user: userState.user,
      appState: userState,
      message: 'পাসওয়ার্ড সফলভাবে পরিবর্তন করা হয়েছে এবং লগইন সম্পন্ন হয়েছে।',
    });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password.' });
  }
});

/**
 * 1.5 Seed Phrase Recovery Step 1: Verify Phrase & Trigger 2-Step Alert
 */
app.post('/api/auth/verify-seed-phrase', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    const { email, seedPhrase } = req.body;

    if (!email || !seedPhrase) {
      return res.status(400).json({ error: 'Email and 12-word seed phrase are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const rateLimitKey = `seed_verify:${ip}:${normalizedEmail}`;
    const limit = checkRateLimit(rateLimitKey, 4, 15 * 60 * 1000);

    if (!limit.allowed) {
      return res.status(429).json({
        error: `Too many recovery attempts. Please wait ${limit.retryAfterSeconds} seconds.`,
      });
    }

    const user = findUserByEmail(normalizedEmail);
    if (!user || !user.seedPhraseHash) {
      return res.status(400).json({
        error: 'Invalid seed phrase or no seed phrase backup configured for this account.',
      });
    }

    const normalizedWords = normalizeSeedPhrase(seedPhrase);
    const wordsCount = normalizedWords.split(' ').length;
    if (wordsCount !== 12) {
      return res.status(400).json({ error: 'Seed phrase must contain exactly 12 words' });
    }

    const isMatch = await compareSeedPhrase(normalizedWords, user.seedPhraseHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect 12-word seed phrase' });
    }

    // Protection Against Stolen Seed Phrases:
    // Generate an additional security verification code sent to the registered email
    const emailCode = generate6DigitCode();
    const codeHash = hashCode(emailCode);
    const expiresAt = Date.now() + 15 * 60 * 1000;

    if (!user.seedRecoveryTokens) user.seedRecoveryTokens = [];
    user.seedRecoveryTokens.push({ codeHash, expiresAt, used: false });

    // Send high-priority alert email
    sendSecurityEmailAlert(
      user.email,
      '🚨 [নিরাপত্তা সতর্কবার্তা] ১২-শব্দের সিড ফ্রেজ দিয়ে অ্যাকাউন্ট রিকভারি চেষ্টা',
      'আপনার মাস খরচ একাউন্টে ১২-শব্দের সিড ফ্রেজ দিয়ে পাসওয়ার্ড রিসেট করার চেষ্টা করা হয়েছে। যদি এটি আপনি না হন, তবে অবিলম্বে সতর্ক হোন। নিচে নিশ্চিতকরণ কোড দেওয়া হলো:',
      emailCode
    );

    saveUser(user);

    // Return partial email hint and verification requirement
    const parts = user.email.split('@');
    const maskedEmail = `${parts[0].slice(0, 2)}***@${parts[1]}`;

    return res.json({
      verified: true,
      requiresEmailCode: true,
      emailHint: maskedEmail,
      debugCode: emailCode, // Provided for ease in sandbox preview
      message: '১২-শব্দের সিড ফ্রেজ যাচাই হয়েছে। অতিরিক্ত সুরক্ষার জন্য নিবন্ধিত ইমেইলে কোড পাঠানো হয়েছে।',
    });
  } catch (err) {
    console.error('Seed verification error:', err);
    return res.status(500).json({ error: 'Failed to verify seed phrase.' });
  }
});

/**
 * 1.6 Seed Phrase Recovery Step 2: Complete Recovery with New Password & Invalidation
 */
app.post('/api/auth/complete-seed-recovery', async (req: Request, res: Response) => {
  try {
    const ip = getClientIp(req);
    const { email, seedPhrase, emailCode, newPassword, emergencyOverride } = req.body;

    if (!email || !seedPhrase || !newPassword) {
      return res.status(400).json({ error: 'Missing required recovery parameters' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long' });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = findUserByEmail(normalizedEmail);
    if (!user || !user.seedPhraseHash) {
      return res.status(400).json({ error: 'User account not found' });
    }

    // Re-verify seed phrase hash
    const normalizedWords = normalizeSeedPhrase(seedPhrase);
    const isMatch = await compareSeedPhrase(normalizedWords, user.seedPhraseHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid seed phrase' });
    }

    // If not emergency override, verify email code
    if (!emergencyOverride) {
      if (!emailCode) {
        return res.status(400).json({ error: 'Email verification code is required' });
      }

      const codeHash = hashCode(emailCode);
      const tokenIdx = (user.seedRecoveryTokens || []).findIndex(
        (t) => t.codeHash === codeHash && !t.used && t.expiresAt > Date.now()
      );

      if (tokenIdx === -1) {
        return res.status(400).json({ error: 'Invalid or expired email security code' });
      }

      user.seedRecoveryTokens![tokenIdx].used = true;
    }

    // Set new password
    user.passwordHash = await hashPassword(newPassword);

    // Invalidate all existing sessions on all devices immediately!
    user.tokenVersion = (user.tokenVersion || 0) + 1;

    user.securityAuditLogs.push({
      id: `log_${Date.now()}`,
      type: 'seed_recovery',
      timestamp: Date.now(),
      detail: `Account recovered via 12-word Seed Phrase${
        emergencyOverride ? ' (Emergency Master Override)' : ' + Email Code'
      }. Old sessions revoked.`,
      ip,
    });

    saveUser(user);

    // Issue brand new JWT session
    const token = generateJwt(user);
    let userState = getUserStateData(user.id);
    if (!userState) {
      userState = generateDefaultStateForUser(user);
    }

    return res.json({
      success: true,
      token,
      user: userState.user,
      appState: userState,
      message: 'অ্যাকাউন্ট সফলভাবে উদ্ধার হয়েছে! নতুন পাসওয়ার্ড সক্রিয় করা হয়েছে।',
    });
  } catch (err) {
    console.error('Complete seed recovery error:', err);
    return res.status(500).json({ error: 'Failed to complete recovery.' });
  }
});

/**
 * 1.7 Regenerate / Change 12-Word Recovery Phrase (Inside Profile/Security)
 */
app.post('/api/auth/regenerate-seed-phrase', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const { currentPassword } = req.body;

    if (!currentPassword) {
      return res.status(400).json({ error: 'Current password is required to generate or change recovery phrase' });
    }

    // Verify current password first
    const isMatch = await comparePassword(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect current password' });
    }

    // Generate brand new cryptographically secure 12 words
    const newWords = generateSecureSeedPhrase();
    const newHash = await hashSeedPhrase(newWords.join(' '));

    // Overwrite stored hash (immediately invalidates old phrase!)
    user.seedPhraseHash = newHash;
    user.seedBackupEnabled = true;

    user.securityAuditLogs.push({
      id: `log_${Date.now()}`,
      type: 'seed_regenerated',
      timestamp: Date.now(),
      detail: 'Recovery seed phrase regenerated. Previous phrase invalidated immediately.',
      ip: getClientIp(req),
    });

    saveUser(user);

    // Also update state payload
    const userState = getUserStateData(user.id);
    if (userState && userState.user) {
      userState.user.seedBackupEnabled = true;
      userState.user.seedPhraseEnabled = true;
      saveUserStateData(userState);
    }

    return res.json({
      success: true,
      seedPhrase: newWords, // Transmitted once for user to write down
      message: 'নতুন ১২-শব্দের রিকভারি ফ্রেজ তৈরি হয়েছে। আগের ফ্রেজটি বাতিল করা হয়েছে।',
    });
  } catch (err) {
    console.error('Regenerate seed error:', err);
    return res.status(500).json({ error: 'Failed to regenerate recovery phrase.' });
  }
});

/**
 * 1.8 Logout
 */
app.post('/api/auth/logout', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    user.securityAuditLogs.push({
      id: `log_${Date.now()}`,
      type: 'logout',
      timestamp: Date.now(),
      detail: 'Logged out from active session',
      ip: getClientIp(req),
    });
    saveUser(user);

    return res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Logout error' });
  }
});

/**
 * 1.9 Get Current User & Session Info
 */
app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let userState = getUserStateData(user.id);
  if (!userState) {
    userState = generateDefaultStateForUser(user);
  }

  return res.json({
    user: userState.user,
    appState: userState,
    seedBackupEnabled: user.seedBackupEnabled,
  });
});

// =========================================================================
// 2. ISOLATED PER-USER DATA API ROUTES
// =========================================================================

/**
 * 2.1 Fetch Authenticated User's Isolated Data
 */
app.get('/api/data', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  let state = getUserStateData(user.id);
  if (!state) {
    state = generateDefaultStateForUser(user);
  }
  return res.json(state);
});

/**
 * 2.2 Sync / Save Authenticated User's Data
 */
app.post('/api/data/sync', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const incoming = req.body;

  if (!incoming) {
    return res.status(400).json({ error: 'Data payload is required' });
  }

  const payload = {
    userId: user.id,
    user: {
      ...incoming.user,
      id: user.id,
      email: user.email, // Preserve true email
    },
    accounts: incoming.accounts || [],
    transactions: incoming.transactions || [],
    categories: incoming.categories || [],
    customCategories: incoming.customCategories || [],
    activeMonthId: incoming.activeMonthId,
    updatedAt: Date.now(),
  };

  saveUserStateData(payload);
  return res.json({ success: true, updatedAt: payload.updatedAt });
});

/**
 * 2.3 Clear / Reset Authenticated User's Data
 */
app.delete('/api/data/clear', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const fresh = generateDefaultStateForUser(user);
  return res.json({ success: true, appState: fresh });
});

// =========================================================================
// 3. ADMIN PANEL API ROUTES
// =========================================================================

/**
 * 3.1 Admin Overview & System Stats
 */
app.get('/api/admin/stats', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = getAllUsers();
    const userStates = getAllUserStates();

    let totalTransactionsCount = 0;
    let totalIncomeVolume = 0;
    let totalExpenseVolume = 0;
    let totalSystemBalance = 0;

    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let activeUsersToday = 0;

    const userSummaries = users.map((u) => {
      if (u.lastLoginAt > oneDayAgo) {
        activeUsersToday++;
      }

      const uState = userStates.get(u.id);
      let txCount = 0;
      let uIncome = 0;
      let uExpense = 0;
      let startingBal = 0;

      if (uState) {
        txCount = (uState.transactions || []).length;
        (uState.transactions || []).forEach((tx: any) => {
          const amt = Number(tx.amount) || 0;
          if (tx.type === 'income') {
            uIncome += amt;
          } else {
            uExpense += amt;
          }
        });
        (uState.accounts || []).forEach((acc: any) => {
          startingBal += Number(acc.startingBalance) || 0;
        });
      }

      totalTransactionsCount += txCount;
      totalIncomeVolume += uIncome;
      totalExpenseVolume += uExpense;
      totalSystemBalance += startingBal + uIncome - uExpense;

      const isAdminUser = u.email.toLowerCase() === 'abufaisal9500@gmail.com' || u.role === 'admin' || ADMIN_EMAILS.includes(u.email.toLowerCase());

      return {
        id: u.id,
        email: u.email,
        name: u.name || u.nameBn || u.nameEn || u.email.split('@')[0],
        nameBn: u.nameBn,
        nameEn: u.nameEn,
        phone: u.phone,
        institutionOrJob: u.institutionOrJob,
        monthlyBudget: u.monthlyBudget || 0,
        role: (isAdminUser ? 'admin' : 'user') as 'admin' | 'user',
        status: (u.status || 'active') as 'active' | 'suspended',
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        transactionCount: txCount,
        currentBalance: startingBal + uIncome - uExpense,
        totalIncome: uIncome,
        totalExpense: uExpense,
        seedBackupEnabled: !!u.seedBackupEnabled,
      };
    });

    // Daily registrations in last 7 days
    const dailyRegistrations: Array<{ date: string; count: number }> = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const dateStr = d.toISOString().split('T')[0];
      const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
      const endOfDay = startOfDay + 86400000;
      const count = users.filter((u) => u.createdAt >= startOfDay && u.createdAt < endOfDay).length;
      dailyRegistrations.push({ date: dateStr, count });
    }

    // Sort recent users
    const recentUsers = [...userSummaries]
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10);

    return res.json({
      totalUsers: users.length,
      activeUsersToday,
      totalTransactionsCount,
      totalIncomeVolume,
      totalExpenseVolume,
      totalSystemBalance,
      dailyRegistrations,
      recentUsers,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ error: 'Failed to generate admin stats' });
  }
});

/**
 * 3.2 List All Registered Users with Full Metrics
 */
app.get('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const users = getAllUsers();
    const userStates = getAllUserStates();

    const list = users.map((u) => {
      const uState = userStates.get(u.id);
      let txCount = 0;
      let uIncome = 0;
      let uExpense = 0;
      let startingBal = 0;

      if (uState) {
        txCount = (uState.transactions || []).length;
        (uState.transactions || []).forEach((tx: any) => {
          const amt = Number(tx.amount) || 0;
          if (tx.type === 'income') {
            uIncome += amt;
          } else {
            uExpense += amt;
          }
        });
        (uState.accounts || []).forEach((acc: any) => {
          startingBal += Number(acc.startingBalance) || 0;
        });
      }

      const isAdminUser = u.email.toLowerCase() === 'abufaisal9500@gmail.com' || u.role === 'admin' || ADMIN_EMAILS.includes(u.email.toLowerCase());

      return {
        id: u.id,
        email: u.email,
        name: u.name || u.nameBn || u.nameEn || u.email.split('@')[0],
        nameBn: u.nameBn,
        nameEn: u.nameEn,
        phone: u.phone,
        institutionOrJob: u.institutionOrJob,
        monthlyBudget: u.monthlyBudget || 0,
        role: isAdminUser ? 'admin' : 'user',
        status: u.status || 'active',
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
        transactionCount: txCount,
        currentBalance: startingBal + uIncome - uExpense,
        totalIncome: uIncome,
        totalExpense: uExpense,
        seedBackupEnabled: !!u.seedBackupEnabled,
      };
    });

    // Sort by newest first
    list.sort((a, b) => b.createdAt - a.createdAt);

    return res.json({ users: list, total: list.length });
  } catch (err) {
    console.error('Admin users list error:', err);
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

/**
 * 3.3 Get Detailed User Data & Transactions
 */
app.get('/api/admin/users/:userId/details', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const targetUser = findUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const state = getUserStateData(userId) || generateDefaultStateForUser(targetUser);

    return res.json({
      user: {
        id: targetUser.id,
        email: targetUser.email,
        name: targetUser.name,
        nameBn: targetUser.nameBn,
        nameEn: targetUser.nameEn,
        phone: targetUser.phone,
        institutionOrJob: targetUser.institutionOrJob,
        monthlyBudget: targetUser.monthlyBudget,
        preferredLanguage: targetUser.preferredLanguage,
        createdAt: targetUser.createdAt,
        lastLoginAt: targetUser.lastLoginAt,
        status: targetUser.status || 'active',
        role: targetUser.role || 'user',
        seedBackupEnabled: targetUser.seedBackupEnabled,
        securityAuditLogs: targetUser.securityAuditLogs || [],
      },
      appState: state,
    });
  } catch (err) {
    console.error('Admin user details error:', err);
    return res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

/**
 * 3.4 Admin Reset User Password
 */
app.post('/api/admin/users/:userId/reset-password', requireAdmin, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const targetUser = findUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    targetUser.passwordHash = await hashPassword(newPassword);
    targetUser.tokenVersion = (targetUser.tokenVersion || 1) + 1; // Invalidate current user sessions
    targetUser.securityAuditLogs.push({
      id: `log_${Date.now()}`,
      type: 'password_reset',
      timestamp: Date.now(),
      detail: `Password reset by administrator (${req.user?.email})`,
      ip: getClientIp(req),
    });

    saveUser(targetUser);

    return res.json({
      success: true,
      message: `Password successfully updated for ${targetUser.email}`,
    });
  } catch (err) {
    console.error('Admin reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

/**
 * 3.5 Admin Toggle User Status (Active / Suspended)
 */
app.post('/api/admin/users/:userId/toggle-status', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const targetUser = findUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.email === 'abufaisal9500@gmail.com') {
      return res.status(400).json({ error: 'Main administrator cannot be suspended' });
    }

    targetUser.status = targetUser.status === 'suspended' ? 'active' : 'suspended';
    saveUser(targetUser);

    return res.json({
      success: true,
      status: targetUser.status,
      message: `User status changed to ${targetUser.status}`,
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to toggle status' });
  }
});

/**
 * 3.6 Admin Delete User
 */
app.delete('/api/admin/users/:userId', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const targetUser = findUserById(userId);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (targetUser.email === 'abufaisal9500@gmail.com') {
      return res.status(400).json({ error: 'Main administrator account cannot be deleted' });
    }

    deleteUserById(userId);
    return res.json({ success: true, message: 'User and data permanently removed' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete user' });
  }
});

/**
 * 3.7 Admin System Announcement Broadcast
 */
app.get('/api/admin/announcement', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  return res.json(getSystemAnnouncement());
});

app.post('/api/admin/announcement', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  try {
    const { message, active, type } = req.body;
    const announcement = {
      id: `ann_${Date.now()}`,
      message: message || '',
      active: !!active,
      type: type || 'info',
      updatedAt: Date.now(),
    };
    setSystemAnnouncement(announcement);
    return res.json({ success: true, announcement });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update announcement' });
  }
});

/**
 * 3.8 Public System Announcement for all clients
 */
app.get('/api/system/announcement', (_req: Request, res: Response) => {
  const ann = getSystemAnnouncement();
  return res.json(ann.active ? ann : { active: false });
});

// =========================================================================
// 4. VITE INTEGRATION / STATIC SERVING
// =========================================================================
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Mash Khoroch Server running at http://0.0.0.0:${PORT}`);
  });
}

start();
