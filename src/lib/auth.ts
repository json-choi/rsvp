import 'server-only';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { getEnv } from './cf';

const COOKIE_NAME = 'rsvp_admin';
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 7; // 7일

async function getSecrets() {
  const env = await getEnv();
  const password = env.ADMIN_PASSWORD ?? '';
  const secret = env.SESSION_SECRET ?? '';
  if (!password || secret.length < 16) {
    throw new Error('ADMIN_PASSWORD 또는 SESSION_SECRET(16자 이상)이 설정되지 않았습니다.');
  }
  return { password, secret };
}

function sign(secret: string, payload: string) {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && timingSafeEqual(ba, bb);
}

export async function verifyPassword(input: string): Promise<boolean> {
  const { password, secret } = await getSecrets();
  // 길이 노출을 막기 위해 HMAC 값끼리 비교한다.
  return safeEqual(sign(secret, `pw:${input}`), sign(secret, `pw:${password}`));
}

export async function createSession() {
  const { secret } = await getSecrets();
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `v1.${exp}`;
  const jar = await cookies();
  jar.set(COOKIE_NAME, `${payload}.${sign(secret, payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function destroySession() {
  const jar = await cookies();
  jar.delete(COOKIE_NAME);
}

export async function isAuthenticated(): Promise<boolean> {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  const lastDot = token.lastIndexOf('.');
  if (lastDot < 0) return false;
  const payload = token.slice(0, lastDot);
  const signature = token.slice(lastDot + 1);
  const [version, expRaw] = payload.split('.');
  if (version !== 'v1') return false;
  const exp = Number(expRaw);
  if (!Number.isFinite(exp) || exp < Date.now() / 1000) return false;
  try {
    const { secret } = await getSecrets();
    return safeEqual(signature, sign(secret, payload));
  } catch {
    return false;
  }
}

export async function requireAdmin() {
  if (!(await isAuthenticated())) {
    throw new Error('Unauthorized');
  }
}
