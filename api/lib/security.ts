// Security middleware for Vercel serverless functions
// Patterns: rate limiting (in-memory), input sanitisation, CORS, request logging

import type { VercelRequest, VercelResponse } from '@vercel/node';

// ── Rate limiting ─────────────────────────────────────────────────────────────
// 30 requests per minute per IP — stored in-memory (resets on cold start)
const rateMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
const RATE_WINDOW_MS = 60_000;

function getClientIp(req: VercelRequest): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') return forwarded.split(',')[0].trim();
  return (req.socket?.remoteAddress) ?? 'unknown';
}

export function checkRateLimit(req: VercelRequest, res: VercelResponse): boolean {
  const ip = getClientIp(req);
  const now = Date.now();
  const entry = rateMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    res.setHeader('Retry-After', retryAfter);
    res.status(429).json({ error: 'TOO_MANY_REQUESTS', retryAfter });
    return false;
  }
  entry.count++;
  return true;
}

// ── CORS headers ──────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'https://synchroniai.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

export function setCorsHeaders(req: VercelRequest, res: VercelResponse): boolean {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');

  if (req.method === 'OPTIONS') {
    res.status(204).end();
    return false; // caller must stop
  }
  return true;
}

// ── Input sanitisation ────────────────────────────────────────────────────────
const SUSPICIOUS_PATTERNS = [
  /ignore\s+(previous|above|all)\s+instructions/i,
  /system\s*:\s*you\s+are/i,
  /<\/?script/i,
  /javascript:/i,
];

export function sanitizeText(value: unknown, maxLen = 10_000): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, maxLen);
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(trimmed)) return null; // prompt injection attempt
  }
  return trimmed;
}

// ── Combined guard ────────────────────────────────────────────────────────────
// Returns true if request should proceed, false if already responded.
export function guard(req: VercelRequest, res: VercelResponse, method: 'POST' | 'GET' = 'POST'): boolean {
  if (!setCorsHeaders(req, res)) return false;
  if (req.method !== method) {
    res.status(405).json({ error: 'Method not allowed' });
    return false;
  }
  if (!checkRateLimit(req, res)) return false;
  return true;
}
