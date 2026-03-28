import { randomUUID, createHash, timingSafeEqual } from 'crypto';
import type { NextApiRequest } from 'next';
import { serialize, parse } from 'cookie';
import { prisma } from './db';

const SESSION_COOKIE = 'chatpublico_session';
const ADMIN_SECRET_NAME_HASH = createHash('sha256')
  .update(process.env.HIDDEN_ADMIN_NAME || 'troque-isso-agora')
  .digest();

export function hashName(name: string) {
  return createHash('sha256').update(name.trim()).digest();
}

export function isHiddenAdminName(name: string) {
  const received = hashName(name);
  return received.length === ADMIN_SECRET_NAME_HASH.length && timingSafeEqual(received, ADMIN_SECRET_NAME_HASH);
}

export function makeMaskedName() {
  return ['••••••', '@#%!*', '***###', '%%%%%%'][Math.floor(Math.random() * 4)];
}

export async function getSessionFromRequest(req: NextApiRequest) {
  const cookies = parse(req.headers.cookie || '');
  const token = cookies[SESSION_COOKIE];
  if (!token) return null;
  return prisma.session.findUnique({ where: { sessionToken: token } });
}

export function buildSessionCookie(token: string, remember: boolean) {
  return serialize(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: remember ? 60 * 60 * 24 * 30 : 60 * 60 * 12
  });
}

export async function createAnonymousSession(displayName: string, rememberName: boolean) {
  const sessionToken = randomUUID();
  const isHiddenAdmin = isHiddenAdminName(displayName);
  const session = await prisma.session.create({
    data: {
      displayName,
      rememberName,
      isHiddenAdmin,
      maskedName: isHiddenAdmin ? makeMaskedName() : null,
      sessionToken
    }
  });

  return { session, sessionToken };
}
