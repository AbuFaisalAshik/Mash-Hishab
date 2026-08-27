import React from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';

/**
 * Trigger dynamic celebratory confetti particles
 */
export const triggerConfetti = () => {
  try {
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#10B981', '#14B8A6', '#F59E0B', '#EF4444', '#6366F1'],
    });
  } catch (e) {
    // Graceful fallback
  }
};

/**
 * Minimalist, sleek & high-craft Currency Badge
 * Minimalist geometric circular emblem supporting any world currency symbol (৳, $, €, £, ﷼, etc.)
 */
export const MinimalCurrencyBadge: React.FC<{
  symbol?: string;
  code?: string;
  size?: number;
  className?: string;
}> = ({ symbol = '৳', code, size = 44, className = '' }) => {
  return (
    <div
      className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600/90 to-teal-500/90 border border-emerald-400/40 shadow-sm shadow-emerald-950/20 text-white select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0.5 rounded-full bg-slate-950/20 backdrop-blur-xs flex flex-col items-center justify-center">
        <span
          className="font-extrabold leading-none tracking-tight"
          style={{ fontSize: size * 0.44 }}
        >
          {symbol}
        </span>
        {code && size >= 48 && (
          <span className="text-[9px] font-mono tracking-widest text-emerald-300 uppercase opacity-90 -mt-0.5">
            {code}
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Currency Coin Badge with minimal modern aesthetic
 */
export const TakaCoinBadge: React.FC<{
  symbol?: string;
  size?: number;
  className?: string;
}> = ({ symbol = '৳', size = 52, className = '' }) => {
  return <MinimalCurrencyBadge symbol={symbol} size={size} className={className} />;
};

export const CurrencyCoinBadge = TakaCoinBadge;

/**
 * Animated Circular Budget Gauge / Progress Ring
 */
export const AnimatedBudgetRing: React.FC<{
  percent: number;
  size?: number;
  strokeWidth?: number;
  children?: React.ReactNode;
}> = ({ percent, size = 120, strokeWidth = 10, children }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  // Determine health color gradient
  const isDanger = percent >= 85;
  const isWarning = percent >= 65 && percent < 85;

  const strokeColor = isDanger
    ? '#EF4444' // Red
    : isWarning
    ? '#F59E0B' // Amber
    : '#10B981'; // Emerald

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-200 dark:text-slate-800"
          fill="transparent"
        />
        {/* Animated Progress Stroke */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
};

/**
 * Authentic Bangladeshi Mess & Tea Life Illustration (চা, নাস্তা ও হিসাব খাতা)
 */
export const MessLifeIllustration: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6 }}
      className={`relative flex items-center justify-center ${className}`}
    >
      <svg
        width="140"
        height="120"
        viewBox="0 0 140 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Desk / Mat Shadow */}
        <ellipse cx="70" cy="108" rx="55" ry="8" fill="currentColor" className="text-slate-300 dark:text-slate-900" opacity="0.6" />

        {/* Open Ledger / Notebook (হিসাব খাতা) */}
        <rect x="22" y="58" width="54" height="42" rx="4" transform="rotate(-6 22 58)" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
        <line x1="28" y1="68" x2="66" y2="64" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="29" y1="76" x2="64" y2="72" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" />
        <line x1="30" y1="84" x2="55" y2="81" stroke="#10B981" strokeWidth="2" strokeLinecap="round" />

        {/* Pencil with angle */}
        <rect x="52" y="44" width="6" height="34" rx="2" transform="rotate(32 52 44)" fill="#F59E0B" />
        <polygon points="69,72 73,79 66,77" fill="#475569" />

        {/* Hot Bengali Chai Glass / Cup (টং-এর চা) */}
        <path
          d="M80 60 L85 96 C85 99 88 101 92 101 L108 101 C112 101 115 99 115 96 L120 60 Z"
          fill="#D97706"
          stroke="#B45309"
          strokeWidth="2"
        />
        {/* Tea Level */}
        <path
          d="M83 70 L86 94 C86 96 88 98 92 98 L108 98 C112 98 114 96 114 94 L117 70 Z"
          fill="#B45309"
        />
        {/* Glass transparency highlights */}
        <line x1="88" y1="64" x2="90" y2="92" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.5" />

        {/* Biscuit on Saucer */}
        <ellipse cx="60" cy="100" rx="14" ry="4" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.5" />
        <circle cx="58" cy="98" r="7" fill="#D97706" stroke="#92400E" strokeWidth="1.5" />
        <circle cx="56" cy="97" r="0.8" fill="#78350F" />
        <circle cx="60" cy="97" r="0.8" fill="#78350F" />
        <circle cx="58" cy="99" r="0.8" fill="#78350F" />

        {/* Animated Hot Steam Curves (ধোঁয়া) */}
        <motion.path
          d="M95 52 Q92 42 97 34 T94 22"
          stroke="#10B981"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            y: [-2, -8, -2],
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.path
          d="M104 50 Q108 40 102 32 T106 20"
          stroke="#14B8A6"
          strokeWidth="2"
          strokeLinecap="round"
          fill="none"
          animate={{
            y: [-1, -7, -1],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: 2.6,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 0.5,
          }}
        />
      </svg>
    </motion.div>
  );
};

/**
 * Animated Safe & Encrypted Vault Shield Graphic
 */
export const VaultSecurityGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <motion.div
        animate={{
          scale: [1, 1.05, 1],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative"
      >
        <svg width="68" height="68" viewBox="0 0 100 100" fill="none">
          {/* Shield Base */}
          <path
            d="M50 12 L82 24 C82 58 50 86 50 86 C50 86 18 58 18 24 L50 12 Z"
            fill="url(#shieldGrad)"
            stroke="#10B981"
            strokeWidth="3"
          />
          <defs>
            <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#064E3B" />
              <stop offset="100%" stopColor="#022C22" />
            </linearGradient>
          </defs>

          {/* Keyhole and lock */}
          <circle cx="50" cy="46" r="8" fill="#F59E0B" />
          <path d="M46 50 L44 64 L56 64 L54 50 Z" fill="#F59E0B" />

          {/* Sparkles */}
          <motion.circle
            cx="72"
            cy="32"
            r="3"
            fill="#34D399"
            animate={{ scale: [0.5, 1.3, 0.5], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
          <motion.circle
            cx="28"
            cy="52"
            r="2.5"
            fill="#FBBF24"
            animate={{ scale: [0.5, 1.2, 0.5], opacity: [0.3, 0.9, 0.3] }}
            transition={{ duration: 2.1, repeat: Infinity, delay: 0.4 }}
          />
        </svg>
      </motion.div>
    </div>
  );
};

/**
 * Animated Empty State Graphic
 */
export const EmptyListGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <motion.div
      animate={{ y: [-4, 4, -4] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`flex items-center justify-center ${className}`}
    >
      <svg width="100" height="90" viewBox="0 0 120 100" fill="none">
        {/* Soft background aura */}
        <circle cx="60" cy="50" r="40" fill="currentColor" className="text-emerald-500/10 dark:text-emerald-500/20" />

        {/* Receipt / Note Sheet */}
        <rect x="36" y="20" width="48" height="60" rx="6" fill="#F8FAFC" stroke="#64748B" strokeWidth="2" />
        <line x1="44" y1="32" x2="76" y2="32" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="44" y1="42" x2="68" y2="42" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="44" y1="52" x2="72" y2="52" stroke="#CBD5E1" strokeWidth="2.5" strokeLinecap="round" />

        {/* Green Checkmark Badge */}
        <circle cx="82" cy="68" r="14" fill="#10B981" />
        <path d="M76 68 L80 72 L88 64" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Small floating sparkles */}
        <motion.circle
          cx="28"
          cy="36"
          r="2.5"
          fill="#10B981"
          animate={{ opacity: [0.2, 0.9, 0.2] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <motion.circle
          cx="92"
          cy="28"
          r="3"
          fill="#F59E0B"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 2.4, repeat: Infinity, delay: 0.3 }}
        />
      </svg>
    </motion.div>
  );
};

/**
 * 3D Isometric Glowing Future Financial Loop Illustration (as in Reference Design)
 */
export const CryptoIsometricGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Radiant Glow Behind Loop */}
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-400/30 via-lime-300/40 to-teal-400/30 rounded-full blur-xl animate-pulse" />

      <motion.svg
        viewBox="0 0 200 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full relative z-10 drop-shadow-[0_10px_20px_rgba(0,223,130,0.35)]"
        animate={{ y: [-3, 3, -3] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <defs>
          <linearGradient id="neonGreenRing1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A3E635" />
            <stop offset="45%" stopColor="#22C55E" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="neonGreenRing2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#D9F99D" />
            <stop offset="50%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="cubeGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6EE7B7" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* 3D Isometric Möbius-like Loop */}
        {/* Back segment */}
        <path
          d="M70 45 L130 30 L165 75 L125 110 L90 85 Z"
          fill="url(#neonGreenRing1)"
          opacity="0.8"
        />

        {/* Inner glow hole */}
        <path
          d="M95 55 L130 45 L145 75 L120 95 L95 80 Z"
          fill="#064E3B"
          opacity="0.9"
        />

        {/* Front segment ribbon */}
        <path
          d="M40 70 L95 40 L140 65 L105 125 L45 95 Z"
          fill="url(#neonGreenRing2)"
          stroke="#D9F99D"
          strokeWidth="1.5"
          opacity="0.95"
        />

        {/* Center Cutout */}
        <path
          d="M65 75 L100 55 L120 75 L95 105 L65 88 Z"
          fill="#042F2E"
          stroke="#34D399"
          strokeWidth="1"
        />

        {/* Floating Mini Glowing Cubes / Tokens */}
        <motion.g
          animate={{ y: [-2, 2, -2], rotate: [0, 5, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        >
          {/* Top floating mini gem */}
          <polygon points="150,30 162,37 150,44 138,37" fill="#D9F99D" />
          <polygon points="138,37 150,44 150,55 138,48" fill="#10B981" />
          <polygon points="162,37 150,44 150,55 162,48" fill="#047857" />
        </motion.g>

        <motion.g
          animate={{ y: [3, -3, 3] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          {/* Bottom Left floating gem */}
          <polygon points="35,100 45,106 35,112 25,106" fill="#86EFAC" />
          <polygon points="25,106 35,112 35,120 25,114" fill="#059669" />
          <polygon points="45,106 35,112 35,120 45,114" fill="#064E3B" />
        </motion.g>

        {/* Sparkling particle lights */}
        <circle cx="170" cy="80" r="2.5" fill="#D9F99D" className="animate-ping" />
        <circle cx="50" cy="50" r="2" fill="#FDE047" />
        <circle cx="110" cy="135" r="2.5" fill="#6EE7B7" />
      </motion.svg>
    </div>
  );
};

