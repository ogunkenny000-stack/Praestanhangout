import { createHmac } from 'node:crypto';

export function normalizeName(input) {
  if (typeof input !== 'string') return null;
  const name = input.normalize('NFC').trim().replace(/\s+/gu, ' ');
  if (name.length < 3 || name.length > 100 || /[\u0000-\u001F\u007F<>]/u.test(name)) return null;
  if (!/^[\p{L}\p{M}][\p{L}\p{M}\p{Zs}.'’\-]+$/u.test(name)) return null;
  return name;
}

export function normalizeEmail(input) {
  if (typeof input !== 'string') return null;
  const email = input.trim().toLowerCase();
  if (email.length < 5 || email.length > 254 || /\s/.test(email)) return null;
  if (!/^[a-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(email)) return null;
  return email;
}

export function normalizeNigerianPhone(input) {
  if (typeof input !== 'string') return null;
  const raw = input.trim().replace(/[\s()-]/g, '');
  let national;
  if (/^0[789][01]\d{8}$/.test(raw)) national = raw.slice(1);
  else if (/^\+234[789][01]\d{8}$/.test(raw)) national = raw.slice(4);
  else if (/^234[789][01]\d{8}$/.test(raw)) national = raw.slice(3);
  else if (/^[789][01]\d{8}$/.test(raw)) national = raw;
  else return null;
  return '+234' + national;
}

export function validateRegistration(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { error: 'Invalid registration details.' };
  // An invisible field makes basic automated form submissions fail without disclosing why.
  if (body.website) return { error: 'Registration could not be completed.' };
  const name = normalizeName(body.name);
  const email = normalizeEmail(body.email);
  const phone = normalizeNigerianPhone(body.phone);
  if (!name) return { error: 'Enter your full name (3–100 characters).' };
  if (!email) return { error: 'Enter a valid email address.' };
  if (!phone) return { error: 'Enter a valid Nigerian phone number.' };
  if (body.consent !== true) return { error: 'Please agree to the registration privacy notice.' };
  return { value: { name, email, phone, consent: true } };
}

export function fingerprintIp(ip, secret) {
  return createHmac('sha256', secret).update(ip).digest('hex');
}

export function originMatches(origin, host) {
  if (typeof origin !== 'string' || typeof host !== 'string') return false;
  try {
    const url = new URL(origin);
    return url.protocol === 'https:' && url.host === host && url.username === '' && url.password === '';
  } catch { return false; }
}
