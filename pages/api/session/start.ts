import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { buildSessionCookie, createAnonymousSession, getSessionFromRequest } from '@/lib/auth';

const bodySchema = z.object({
  displayName: z.string().min(1).max(30),
  rememberName: z.boolean().default(false)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const existing = await getSessionFromRequest(req);
  if (existing) {
    return res.status(200).json({ ok: true, session: existing });
  }

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos.' });

  const { session, sessionToken } = await createAnonymousSession(parsed.data.displayName, parsed.data.rememberName);
  res.setHeader('Set-Cookie', buildSessionCookie(sessionToken, parsed.data.rememberName));
  return res.status(200).json({ ok: true, session });
}
