import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import {
  buildSessionCookie,
  createAnonymousSession,
  getSessionFromRequest,
  isHiddenAdminName,
  makeMaskedName
} from '@/lib/auth';
import { prisma } from '@/lib/db';

const bodySchema = z.object({
  displayName: z.string().min(1).max(30),
  rememberName: z.boolean().default(false)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const parsed = bodySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: 'Dados inválidos.' });
  }

  const { displayName, rememberName } = parsed.data;
  const existing = await getSessionFromRequest(req);

  if (existing) {
    const isHiddenAdmin = isHiddenAdminName(displayName);

    const updated = await prisma.session.update({
      where: { id: existing.id },
      data: {
        displayName,
        rememberName,
        isHiddenAdmin,
        maskedName: isHiddenAdmin ? makeMaskedName() : null
      }
    });

    res.setHeader('Set-Cookie', buildSessionCookie(existing.sessionToken, rememberName));
    return res.status(200).json({ ok: true, session: updated });
  }

  const { session, sessionToken } = await createAnonymousSession(displayName, rememberName);
  res.setHeader('Set-Cookie', buildSessionCookie(sessionToken, rememberName));
  return res.status(200).json({ ok: true, session });
}
