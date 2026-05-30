const SETS = [
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  '0123456789',
  '!@#$%^&*()_+-=[]{}',
];

export function generateSecurePassword(length = 16) {
  const all = SETS.join('');
  const chars = SETS.map(s => s[cryptoRandomInt(s.length)]);
  const extra = Math.max(length - chars.length, 0);
  for (let i = 0; i < extra; i++) {
    chars.push(all[cryptoRandomInt(all.length)]);
  }
  shuffle(chars);
  return chars.join('');
}

function cryptoRandomInt(max) {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = cryptoRandomInt(i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export async function checkPasswordBreached(password) {
  if (!password) return false;
  const enc = new TextEncoder();
  const hash = await crypto.subtle.digest('SHA-1', enc.encode(password));
  const hex = Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
  const prefix = hex.slice(0, 5);
  const suffix = hex.slice(5);
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
    if (!res.ok) return false;
    const text = await res.text();
    return text.split('\n').some(line => line.startsWith(suffix + ':'));
  } catch {
    return false;
  }
}
