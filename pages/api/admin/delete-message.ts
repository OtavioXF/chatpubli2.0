import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';
import { getIO } from '@/lib/socket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getSessionFromRequest(req);
  if (!session?.isHiddenAdmin) return res.status(403).json({ error: 'Acesso negado.' });

  const { id } = req.body as { id: string };
  const message = await prisma.message.update({
    where: { id },
    data: { isDeleted: true, deletedAt: new Date(), content: null }
  });

  await prisma.adminLog.create({
    data: {
      adminSessionId: session.id,
      actionType: 'delete_message',
      targetMessageId: id,
      targetRoomId: message.roomId
    }
  });

  getIO()?.emit(`room:${message.roomId}:message:deleted`, { id });
  return res.status(200).json({ ok: true });
}
