const ITERATIONS = 150000;
const CONFIG_KEY = 'paisapilot_app_lock';

const toHex = (bytes) => Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
const fromHex = (value) => Uint8Array.from(value.match(/.{2}/g) || [], (byte) => parseInt(byte, 16));

const derivePinHash = async (pin, salt) => {
  if (!globalThis.crypto?.subtle) throw new Error('Secure PIN storage is unavailable in this browser.');
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(pin), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({
    name: 'PBKDF2',
    salt: fromHex(salt),
    iterations: ITERATIONS,
    hash: 'SHA-256',
  }, key, 256);
  return toHex(new Uint8Array(bits));
};

export const isValidAppPin = (pin) => /^\d{6}$/.test(String(pin || ''));

export const createAppLockConfig = async (pin, idleMinutes = 1) => {
  if (!isValidAppPin(pin)) throw new Error('Your PIN must contain exactly 6 digits.');
  const salt = toHex(crypto.getRandomValues(new Uint8Array(16)));
  return {
    version: 1,
    salt,
    verifier: await derivePinHash(pin, salt),
    idleMinutes: [1, 5, 15].includes(Number(idleMinutes)) ? Number(idleMinutes) : 1,
    updatedAt: new Date().toISOString(),
  };
};

export const verifyAppPin = async (pin, config) => {
  if (!config?.salt || !config?.verifier || !isValidAppPin(pin)) return false;
  try {
    const candidate = fromHex(await derivePinHash(pin, config.salt));
    const expected = fromHex(config.verifier);
    if (candidate.length !== expected.length) return false;
    let diff = 0;
    for (let i = 0; i < candidate.length; i += 1) diff |= candidate[i] ^ expected[i];
    return diff === 0;
  } catch {
    return false;
  }
};

export const readAppLockConfig = () => {
  try {
    const config = JSON.parse(localStorage.getItem(CONFIG_KEY) || 'null');
    if (config?.version === 1 && /^[0-9a-f]{32}$/.test(config.salt || '') && /^[0-9a-f]{64}$/.test(config.verifier || '')) {
      return { ...config, idleMinutes: [1, 5, 15].includes(Number(config.idleMinutes)) ? Number(config.idleMinutes) : 1 };
    }
  } catch {
    // Ignore damaged local settings and leave the app unlocked.
  }
  return null;
};

export const saveAppLockConfig = (config) => localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
export const removeAppLockConfig = () => localStorage.removeItem(CONFIG_KEY);

export const shouldAutoLock = (lastActivity, now, idleMinutes, visibilityState = 'visible') =>
  visibilityState === 'hidden' || (Number(now) - Number(lastActivity)) >= Number(idleMinutes) * 60_000;
