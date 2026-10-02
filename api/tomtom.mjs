const LIVE_ORIGIN = 'https://baiez82-stack.github.io';
const TOMTOM_ENDPOINT = 'https://api.tomtom.com/routing/1/calculateRoute';

function cors(origin) {
  return origin === LIVE_ORIGIN ? {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    'Vary': 'Origin'
  } : {};
}

function point(value) {
  if (typeof value !== 'string' || !/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(value)) return null;
  const [lat, lon] = value.split(',').map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return `${lat},${lon}`;
}

export function buildTomTomUrl(query, key) {
  const from = point(query.from);
  const to = point(query.to);
  if (!from || !to) throw new Error('INVALID_POINTS');
  const maxAlternatives = query.maxAlternatives === '0' ? '0' : '2';
  const params = new URLSearchParams({
    key,
    traffic: 'true',
    departAt: 'now',
    travelMode: 'car',
    routeType: 'fastest',
    computeTravelTimeFor: 'all',
    maxAlternatives,
    routeRepresentation: 'polyline',
    instructionsType: 'text',
    language: 'it-IT'
  });
  for (const type of ['tollRoad', 'tollVignette', 'ferry', 'carTrain', 'traffic', 'country']) params.append('sectionType', type);
  if (query.avoid === 'tollRoads') params.set('avoid', 'tollRoads');
  return `${TOMTOM_ENDPOINT}/${from}:${to}/json?${params}`;
}

export default async function handler(req, res) {
  const origin = req.headers.origin || '';
  for (const [name, value] of Object.entries(cors(origin))) res.setHeader(name, value);
  if (req.method === 'OPTIONS') return res.status(origin === LIVE_ORIGIN ? 204 : 403).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (origin !== LIVE_ORIGIN) return res.status(403).json({ error: 'Origin not allowed' });
  if (!process.env.TOMTOM_API_KEY) return res.status(503).json({ error: 'Routing service not configured' });

  let url;
  try { url = buildTomTomUrl(req.query || {}, process.env.TOMTOM_API_KEY); }
  catch { return res.status(400).json({ error: 'Invalid coordinates' }); }

  try {
    const upstream = await fetch(url, {
      headers: { 'Accept': 'application/json', 'Origin': LIVE_ORIGIN, 'Referer': `${LIVE_ORIGIN}/routesaver/` },
      signal: AbortSignal.timeout(9000)
    });
    const body = await upstream.text();
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(upstream.ok ? 200 : 502).send(body);
  } catch {
    return res.status(504).json({ error: 'Routing provider timeout' });
  }
}
