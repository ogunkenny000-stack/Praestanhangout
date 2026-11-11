import { originMatches } from '../lib/registration-validation.js';
import { gateway, getClientIp } from '../lib/gateway.js';
const messages = {
  NOT_FOUND: 'We could not verify your private registration details. Try the original registration on this device.',
  INVALID: 'Please enter a valid bank transaction reference.',
  RATE_LIMIT: 'Too many attempts. Please try again later.',
  TRANSFER_REFERENCE_USED: 'That transaction reference has already been submitted. Contact the organisers if this is an error.',
  CLOSED: 'This registration is no longer active.',
};
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  if (!originMatches(req.headers.origin, req.headers['x-forwarded-host'] || req.headers.host)) return res.status(403).json({ error: 'Request origin not allowed.' });
  if (!(req.headers['content-type'] || '').toLowerCase().startsWith('application/json')) return res.status(415).json({ error: 'Expected JSON.' });
  if (Number(req.headers['content-length'] || 0) > 4096) return res.status(413).json({ error: 'Request too large.' });
  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (Buffer.byteLength(JSON.stringify(body)) > 4096) throw Error();
  } catch { return res.status(400).json({ error: 'Invalid request.' }); }
  if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Invalid request.' });
  const ip = getClientIp(req);
  if (!ip) return res.status(503).json({ error: 'Security verification unavailable.' });
  const result = await gateway('report', { reference: body.reference, accessToken: body.accessToken, transactionReference: body.transactionReference, senderName: body.senderName }, ip);
  if (result.status === 200 && result.data.success) return res.status(200).json({ status: result.data.status, code: result.data.code, message: 'Transfer details recorded for organiser verification. This is not a paid ticket.' });
  return res.status([400,409,429,503].includes(result.status) ? result.status : 503).json({ error: messages[result.data.code] || result.data.error || 'We could not submit the transfer details.' });
}
