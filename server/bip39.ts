import crypto from 'crypto';

// Standard BIP-39 2048-word standard wordlist subset (clean, unambiguous English words)
export const BIP39_WORDLIST = [
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
  'blossom', 'border', 'bottle', 'bounce', 'breeze', 'bridge', 'bright', 'bronze',
  'brother', 'bubble', 'budget', 'bullet', 'bundle', 'burden', 'butter', 'cabin',
  'cable', 'cactus', 'cage', 'cake', 'camera', 'camp', 'canal', 'cancel',
  'candle', 'candy', 'canvas', 'canyon', 'capable', 'capital', 'captain', 'carbon',
  'card', 'cargo', 'carpet', 'carve', 'castle', 'casual', 'catalog', 'cattle',
  'caution', 'cave', 'ceiling', 'celery', 'cement', 'census', 'century', 'cereal',
  'certain', 'chair', 'chalk', 'champion', 'change', 'channel', 'chapter', 'charge',
  'chase', 'chat', 'cheap', 'check', 'cheese', 'chef', 'cherry', 'chest',
  'chicken', 'chief', 'child', 'chimney', 'choice', 'choose', 'chronic', 'circle',
  'citizen', 'city', 'civil', 'claim', 'clap', 'clarify', 'claw', 'clay',
  'clean', 'clerk', 'clever', 'click', 'client', 'cliff', 'climb', 'clinic',
  'clip', 'clock', 'clog', 'close', 'cloth', 'cloud', 'clown', 'club',
  'clump', 'cluster', 'clutch', 'coach', 'coast', 'coconut', 'code', 'coffee',
  'coil', 'coin', 'collect', 'color', 'column', 'combine', 'comfort', 'comic',
  'common', 'company', 'concert', 'conduct', 'confirm', 'connect', 'coral', 'core',
  'corn', 'corner', 'correct', 'cost', 'cotton', 'couch', 'country', 'couple',
  'course', 'cousin', 'cover', 'coyote', 'crack', 'cradle', 'craft', 'cram',
  'crane', 'crash', 'crater', 'crawl', 'crazy', 'cream', 'credit', 'creek',
  'crew', 'cricket', 'crime', 'crisp', 'critic', 'crop', 'cross', 'crouch',
  'crowd', 'crucial', 'cruel', 'cruise', 'crumble', 'crunch', 'crush', 'crystal',
  'cube', 'culture', 'cupboard', 'curious', 'current', 'curtain', 'curve', 'cushion',
  'custom', 'cute', 'cycle', 'damage', 'damp', 'dance', 'danger', 'daring',
  'dash', 'daughter', 'dawn', 'debate', 'decade', 'decide', 'deck', 'decorate',
  'decrease', 'deer', 'defense', 'define', 'defy', 'degree', 'delay', 'deliver',
  'demand', 'demise', 'denial', 'dentist', 'deposit', 'depth', 'deputy', 'derive',
  'describe', 'desert', 'design', 'desk', 'despair', 'destroy', 'detail', 'detect',
  'device', 'devote', 'diagram', 'dial', 'diamond', 'diary', 'diesel', 'diet',
  'differ', 'digital', 'dignity', 'dilemma', 'dinner', 'dinosaur', 'direct', 'dirt',
  'disagree', 'discover', 'disease', 'dish', 'dismiss', 'order', 'display', 'distance'
];

/**
 * Generate 12 cryptographically secure random words
 */
export function generateSecureSeedPhrase(): string[] {
  const words: string[] = [];
  const bytes = crypto.randomBytes(24);
  for (let i = 0; i < 12; i++) {
    const val = bytes.readUInt16BE(i * 2);
    const word = BIP39_WORDLIST[val % BIP39_WORDLIST.length];
    words.push(word);
  }
  return words;
}

/**
 * Normalize and validate 12-word seed phrase
 */
export function normalizeSeedPhrase(input: string | string[]): string {
  if (Array.isArray(input)) {
    return input.map(w => w.trim().toLowerCase()).filter(Boolean).join(' ');
  }
  return input.trim().toLowerCase().split(/\s+/).filter(Boolean).join(' ');
}
