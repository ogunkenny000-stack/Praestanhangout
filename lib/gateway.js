export async function gateway(action, data = {}, ip = '') {
  const url = process.env.SUPABASE_URL;
  const anon = process.env.SUPABASE_ANON_KEY;
  if (!url || !anon) return { status: 503, data: { error: 'Ticket service is not configured.' } };
  try {
    const response = await fetch(`${url.replace(/\/$/, '')}/functions/v1/praestans-public`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: anon,
        Authorization: `Bearer ${anon}`,
        ...(ip ? { 'X-Visitor-IP': ip } : {}),
      },
      body: JSON.stringify({ action, ...data }),
      signal: AbortSignal.timeout(8000),
    });
    const json = await response.json().catch(() => null);
    if (!json || typeof json !== 'object') return { status: 503, data: { error: 'Ticket service temporarily unavailable.' } };
    return { status: response.status, data: json };
  } catch {
    return { status: 503, data: { error: 'Ticket service temporarily unavailable.' } };
  }
}

export function getClientIp(req) {
  const raw = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
  const value = Array.isArray(raw) ? raw[0] : String(raw).split(',').at(-1)?.trim();
  return value && value.length <= 128 ? value : null;
}
