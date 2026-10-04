import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
const SYNC_SECRET = process.env.SYNC_SECRET || '';

// Server-side Supabase client (prefers service-role key for backend writes)
const supabase =
  SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    : null;

const DIST_DIR = path.resolve(__dirname, 'dist');
const PUBLIC_DIR = fs.existsSync(path.join(DIST_DIR, 'index.html'))
  ? DIST_DIR
  : path.resolve(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy':
    "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https: http:; connect-src 'self' https://*.supabase.co wss://*.supabase.co; frame-ancestors 'none';",
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    ...SECURITY_HEADERS,
  });
  res.end(JSON.stringify(data));
}

async function readJsonBody(req) {
  let body = '';
  for await (const chunk of req) {
    body += chunk;
    if (body.length > 2 * 1024 * 1024) {
      throw Object.assign(new Error('Request payload exceeds 2MB limit.'), { statusCode: 413 });
    }
  }
  return JSON.parse(body || '{}');
}

// Validation helpers
function isHttpUrl(str) {
  if (!str || typeof str !== 'string') return false;
  try {
    const u = new URL(str);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

function sanitizeString(val, maxLen = 500) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

function toListingRow(listing) {
  if (!listing || typeof listing !== 'object') return null;
  const format = sanitizeString(listing.format, 30);
  // Never write buyer requests to the listings table
  if (format === 'request_good' || format === 'request_service' || listing.isRequest) {
    return null;
  }

  const id = sanitizeString(listing.id, 64);
  const title = sanitizeString(listing.title, 200);
  if (!id || !title) return null;

  return {
    id,
    title,
    category: sanitizeString(listing.category, 50) || 'electronics',
    format: ['auction', 'buy_now', 'service', 'free_barter'].includes(format) ? format : 'buy_now',
    starting_price: Number(listing.startingPrice) || 0,
    current_price: Number(listing.currentPrice) || 0,
    buy_it_now_price: listing.buyItNowPrice ? Number(listing.buyItNowPrice) : null,
    reserve_price: listing.reservePrice ? Number(listing.reservePrice) : null,
    bids_count: Number(listing.bidsCount) || 0,
    end_time: Number(listing.endTime) || null,
    city: sanitizeString(listing.city, 100) || 'Lagos, Nigeria',
    neighborhood: sanitizeString(listing.neighborhood, 100) || null,
    fulfillment: ['pickup', 'shipping', 'both'].includes(listing.fulfillment)
      ? listing.fulfillment
      : 'both',
    shipping_fee: Number(listing.shippingFee) || 0,
    image_url: isHttpUrl(listing.imageUrl) ? listing.imageUrl : null,
    description: sanitizeString(listing.description, 2000),
    seller_name: sanitizeString(listing.seller?.name, 100) || 'Servilist Merchant',
    seller_avatar: sanitizeString(listing.seller?.avatar, 10) || 'SM',
    seller_rating: Number(listing.seller?.rating) || 5.0,
    seller_verified: Boolean(listing.seller?.verified),
    is_sold: Boolean(listing.isSold),
  };
}

function toRequestRow(request) {
  if (!request || typeof request !== 'object') return null;
  const id = sanitizeString(request.id, 64);
  const title = sanitizeString(request.title, 200);
  if (!id || !title) return null;

  const reqType = request.requestType === 'service' ? 'service' : 'good';

  return {
    id,
    title,
    category: sanitizeString(request.category, 50) || 'services',
    request_type: reqType,
    budget: Number(request.budget || request.currentPrice) || 0,
    urgency: sanitizeString(request.urgency, 50) || 'Within 2-3 Days',
    condition: sanitizeString(request.condition, 100) || null,
    city: sanitizeString(request.city, 100) || 'Lagos, Nigeria',
    neighborhood: sanitizeString(request.neighborhood, 100) || null,
    fulfillment: ['pickup', 'shipping', 'both'].includes(request.fulfillment)
      ? request.fulfillment
      : 'both',
    image_url: isHttpUrl(request.imageUrl) ? request.imageUrl : null,
    description: sanitizeString(request.description, 2000),
    requester_name: sanitizeString(request.seller?.name, 100) || 'Servilist Buyer',
    status: ['active', 'fulfilled', 'cancelled'].includes(request.status)
      ? request.status
      : 'active',
  };
}

function toEscrowRow(order) {
  if (!order || typeof order !== 'object') return null;
  const id = sanitizeString(order.id, 64);
  const title = sanitizeString(order.title, 200);
  if (!id || !title) return null;

  return {
    id,
    listing_or_request_id: sanitizeString(order.itemId, 64) || null,
    title,
    buyer_name: sanitizeString(order.buyerName, 100) || 'Buyer',
    seller_name: sanitizeString(order.sellerName, 100) || 'Seller',
    amount_usd: Number(order.amountUsd) || 0,
    target_currency: sanitizeString(order.targetCurrency, 10) || 'NGN',
    status: ['funded', 'inspection', 'verified', 'released', 'disputed'].includes(order.status)
      ? order.status
      : 'funded',
    otp_code: sanitizeString(order.otpCode, 20),
    safe_zone: sanitizeString(order.safeZone, 200) || 'Safe Public Exchange Hub',
  };
}

const sseClients = new Set();
const serverEventsLog = [];

async function handleApiRequest(req, res, pathname) {
  if (req.method === 'GET' && pathname === '/api/events') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      ...SECURITY_HEADERS,
    });
    res.write(`data: {"type":"CONNECTED","timestamp":${Date.now()}}\n\n`);
    sseClients.add(res);
    req.on('close', () => {
      sseClients.delete(res);
    });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/events') {
    try {
      const payload = await readJsonBody(req);
      serverEventsLog.push(payload);
      if (serverEventsLog.length > 100) serverEventsLog.shift();

      const messageStr = `data: ${JSON.stringify(payload)}\n\n`;
      for (const client of sseClients) {
        try {
          client.write(messageStr);
        } catch {
          sseClients.delete(client);
        }
      }
      sendJson(res, 200, { success: true, clientCount: sseClients.size });
      return;
    } catch (err) {
      sendJson(res, 400, { success: false, error: err.message });
      return;
    }
  }

  if (req.method === 'GET' && pathname === '/api/events/history') {
    sendJson(res, 200, { success: true, events: serverEventsLog });
    return;
  }

  if (!supabase) {
    sendJson(res, 503, {
      success: false,
      reason: 'missing_configuration',
      error:
        'Supabase server configuration is missing. Configure SUPABASE_URL and credentials in .env.',
    });
    return;
  }

  if (req.method === 'GET' && pathname === '/api/supabase/test') {
    const { data, error } = await supabase.from('listings').select('id').limit(1);
    if (error) {
      sendJson(res, 502, { success: false, error: error.message });
      return;
    }
    sendJson(res, 200, { success: true, count: data ? data.length : 0 });
    return;
  }

  if (req.method === 'POST' && pathname === '/api/supabase/sync') {
    // Enforce secret header when configured
    if (SYNC_SECRET) {
      const authHeader = req.headers['authorization'] || '';
      const syncHeader = req.headers['x-sync-secret'] || '';
      const bearerMatch = authHeader.startsWith('Bearer ') && authHeader.slice(7) === SYNC_SECRET;
      if (syncHeader !== SYNC_SECRET && !bearerMatch) {
        sendJson(res, 401, {
          success: false,
          error: 'Unauthorized: invalid or missing sync secret.',
        });
        return;
      }
    }

    if (!req.headers['content-type']?.includes('application/json')) {
      sendJson(res, 415, { success: false, error: 'Content-Type must be application/json.' });
      return;
    }

    let payload;
    try {
      payload = await readJsonBody(req);
    } catch (err) {
      sendJson(res, err.statusCode || 400, { success: false, error: err.message });
      return;
    }

    const collections = [
      ['listings', payload.listings, toListingRow],
      ['buyer_requests', payload.requests, toRequestRow],
      ['escrow_orders', payload.escrow, toEscrowRow],
    ];

    if (collections.some(([, rows]) => rows !== undefined && !Array.isArray(rows))) {
      sendJson(res, 400, { success: false, error: 'Sync collections must be arrays.' });
      return;
    }

    if (collections.some(([, rows]) => rows?.length > 500)) {
      sendJson(res, 413, {
        success: false,
        error: 'Sync payload exceeds limit of 500 items per collection.',
      });
      return;
    }

    const errors = [];
    for (const [table, rows, mapRow] of collections) {
      if (!rows?.length) continue;
      const validRows = rows.map(mapRow).filter(Boolean);
      if (!validRows.length) continue;

      const { error } = await supabase.from(table).upsert(validRows, { onConflict: 'id' });
      if (error) {
        errors.push(`${table}: ${error.message}`);
      }
    }

    sendJson(res, errors.length ? 502 : 200, {
      success: errors.length === 0,
      errors: errors.length ? errors : undefined,
    });
    return;
  }

  sendJson(res, 404, { success: false, error: 'API endpoint not found.' });
}

const server = http.createServer((req, res) => {
  const requestUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);

  // API Router
  if (requestUrl.pathname.startsWith('/api/')) {
    handleApiRequest(req, res, requestUrl.pathname).catch((error) => {
      sendJson(res, error.statusCode || 500, {
        success: false,
        error: error.statusCode ? error.message : 'Internal Server Error',
      });
    });
    return;
  }

  // Static Files: SERVE STRICTLY FROM public/ FOLDER ONLY
  let relativePath;
  try {
    relativePath = decodeURIComponent(requestUrl.pathname).replace(/^[/\\]+/, '') || 'index.html';
    if (relativePath.endsWith('/')) {
      relativePath += 'index.html';
    }
  } catch {
    res.writeHead(400, SECURITY_HEADERS);
    res.end('Bad Request');
    return;
  }

  const safePath = path.normalize(relativePath).replace(/^(\.\.[/\\])+/, '');
  const filePath = path.resolve(PUBLIC_DIR, safePath);

  // Enforce that resolved path is strictly within PUBLIC_DIR
  if (
    !filePath.startsWith(PUBLIC_DIR + path.sep) &&
    filePath !== path.join(PUBLIC_DIR, 'index.html')
  ) {
    res.writeHead(404, SECURITY_HEADERS);
    res.end('Not Found');
    return;
  }

  const extname = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8', ...SECURITY_HEADERS });
        res.end('<h1>404 Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain', ...SECURITY_HEADERS });
        res.end(`Server Error: ${err.code}`);
      }
    } else {
      res.writeHead(200, {
        'Content-Type': contentType,
        ...SECURITY_HEADERS,
      });
      res.end(content);
    }
  });
});

server.listen(PORT, () => {
  console.log(`Servilist preview server running at http://localhost:${PORT}`);
  console.log(`Serving static files strictly from ${PUBLIC_DIR}`);
  if (!supabase) {
    console.warn(
      'Supabase integration in local-fallback mode. Configure SUPABASE_URL and SUPABASE_ANON_KEY in .env to enable cloud features.'
    );
  }
});

export default server;
