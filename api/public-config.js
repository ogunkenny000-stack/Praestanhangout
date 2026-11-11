import { gateway } from '../lib/gateway.js';
export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed.' });
  const response = await gateway('config');
  const open = process.env.REGISTRATION_OPEN === 'true' && response.status === 200 && response.data.registrationOpen === true;
  return res.status(200).json({ registrationOpen: open, registrationStatus: open ? 'open' : 'unavailable', priceNaira: 1000 });
}
