import { EncryptedBackupData, AppStateData } from '../types';

// Curated 128 easy-to-remember distinct BIP39 mnemonic words
const BIP39_WORDLIST = [
  'ability', 'absent', 'absorb', 'abstract', 'access', 'accident', 'account', 'action',
  'active', 'adapt', 'admit', 'advance', 'advice', 'afford', 'agree', 'ahead',
  'airport', 'album', 'alert', 'alien', 'allied', 'almost', 'alpha', 'always',
  'amateur', 'amazing', 'anchor', 'ancient', 'angle', 'animal', 'annual', 'answer',
  'antenna', 'antique', 'anxiety', 'apart', 'apology', 'appear', 'apple', 'approve',
  'arcade', 'arctic', 'arena', 'argue', 'armour', 'army', 'around', 'arrange',
  'arrest', 'arrive', 'arrow', 'artist', 'artwork', 'aspect', 'assault', 'asset',
  'assist', 'assume', 'athlete', 'atlas', 'atom', 'attack', 'attend', 'attitude',
  'attract', 'auction', 'audit', 'august', 'aunt', 'author', 'auto', 'autumn',
  'average', 'avocado', 'avoid', 'awake', 'aware', 'awesome', 'axis', 'bacon',
  'badge', 'balance', 'bamboo', 'banana', 'banner', 'bargain', 'barrel', 'basic',
  'basket', 'battery', 'battle', 'beach', 'beacon', 'beauty', 'because', 'become',
  'beef', 'before', 'begin', 'behave', 'behind', 'believe', 'bench', 'benefit',
  'berry', 'better', 'between', 'beyond', 'bicycle', 'binary', 'biology', 'bird',
  'birth', 'bitter', 'blade', 'blanket', 'blast', 'bless', 'blind', 'blood',
  'blossom', 'border', 'bottle', 'bounce', 'breeze', 'bridge', 'bright', 'bronze'
];

/**
 * Generates a 12-word cryptographic seed phrase
 */
export function generateSeedPhrase(): string[] {
  const words: string[] = [];
  const randomBuffer = new Uint32Array(12);
  crypto.getRandomValues(randomBuffer);

  for (let i = 0; i < 12; i++) {
    const index = randomBuffer[i] % BIP39_WORDLIST.length;
    words.push(BIP39_WORDLIST[index]);
  }

  return words;
}

/**
 * Computes a SHA-256 hash of the seed phrase for confirmation without storing the raw phrase
 */
export async function hashSeedPhrase(phrase: string): Promise<string> {
  const normalized = phrase.trim().toLowerCase();
  const encoder = new TextEncoder();
  const data = encoder.encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Derives an AES-GCM 256-bit key from a seed phrase or password using PBKDF2
 */
async function deriveKey(phraseOrPassword: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(phraseOrPassword.trim().toLowerCase()),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Encrypts app state into a portable AES-256-GCM package
 */
export async function encryptAppData(
  data: AppStateData,
  secretPhrase: string
): Promise<EncryptedBackupData> {
  const salt = new Uint8Array(16);
  const iv = new Uint8Array(12);
  crypto.getRandomValues(salt);
  crypto.getRandomValues(iv);

  const key = await deriveKey(secretPhrase, salt);
  const plaintext = JSON.stringify(data);
  const encoder = new TextEncoder();
  const encodedData = encoder.encode(plaintext);

  const ciphertextBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    encodedData
  );

  const ciphertext = btoa(String.fromCharCode(...new Uint8Array(ciphertextBuffer)));
  const saltBase64 = btoa(String.fromCharCode(...salt));
  const ivBase64 = btoa(String.fromCharCode(...iv));

  // Compute checksum
  const checksum = await hashSeedPhrase(plaintext);

  return {
    version: 1,
    appName: 'Amar Hishab',
    createdAt: Date.now(),
    salt: saltBase64,
    iv: ivBase64,
    ciphertext,
    checksum,
  };
}

/**
 * Decrypts an encrypted backup package using the provided seed phrase or password
 */
export async function decryptAppData(
  backup: EncryptedBackupData,
  secretPhrase: string
): Promise<AppStateData> {
  const saltStr = atob(backup.salt);
  const salt = new Uint8Array(saltStr.length);
  for (let i = 0; i < saltStr.length; i++) {
    salt[i] = saltStr.charCodeAt(i);
  }

  const ivStr = atob(backup.iv);
  const iv = new Uint8Array(ivStr.length);
  for (let i = 0; i < ivStr.length; i++) {
    iv[i] = ivStr.charCodeAt(i);
  }

  const ciphertextStr = atob(backup.ciphertext);
  const ciphertext = new Uint8Array(ciphertextStr.length);
  for (let i = 0; i < ciphertextStr.length; i++) {
    ciphertext[i] = ciphertextStr.charCodeAt(i);
  }

  const key = await deriveKey(secretPhrase, salt);

  const decryptedBuffer = await crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    ciphertext
  );

  const decoder = new TextDecoder();
  const decryptedText = decoder.decode(decryptedBuffer);

  const parsed = JSON.parse(decryptedText) as AppStateData;
  return parsed;
}
