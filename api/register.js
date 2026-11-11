import { validateRegistration, originMatches } from '../lib/registration-validation.js';
import { gateway, getClientIp } from '../lib/gateway.js';
const message = {
  DUPLICATE: 'This phone number is already registered. Contact the organisers if you lost your private reference.',
  CLOSED: 'Registration is temporarily closed.',
  FULL: 'Registration is at capacity.',
  RATE_LIMIT: 'Too many attempts. Please wait an hour and try again.',
  INVALID: 'Please check your full name and Nigerian phone number.',
};
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (process.env.REGISTRATION_OPEN !== 'true') return res.status(503).json({ error: 'Registration is not open yet.' });
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (!originMatches(req.headers.origin, host)) return res.status(403).json({ error: 'Request origin not allowed.' });
  if (req.headers['sec-fetch-site'] && req.headers['sec-fetch-site'] !== 'same-origin') return res.status(403).json({ error: 'Request origin not allowed.' });
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return res.status(415).json({ error: 'Expected JSON.' });
  if (Number(req.headers['content-length'] || 0) > 4096) return res.status(413).json({ error: 'Request too large.' });
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (Buffer.byteLength(JSON.stringify(body)) > 4096) throw new Error('large');
  } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  const checked = validateRegistration(body);
  if (checked.error) return res.status(400).json({ error: checked.error });
  const ip = getClientIp(req);
  if (!ip) return res.status(503).json({ error: 'Security verification unavailable.' });
  const upstream = await gateway('register', { ...checked.value, website: '' }, ip);
  if (upstream.status === 201 && upstream.data.success && upstream.data.reference && upstream.data.accessToken) {
    return res.status(201).json({ reference: upstream.data.reference, accessToken: upstream.data.accessToken, status: 'pending_payment' });
  }
  return res.status([400,409,429,503].includes(upstream.status) ? upstream.status : 503)
    .json({ error: message[upstream.data.code] || upstream.data.error || 'Registration could not be completed.' });
}
