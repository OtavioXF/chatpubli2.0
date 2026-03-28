import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getPublicRoom } from '@/lib/chat';
import { getSessionFromRequest } from '@/lib/auth';
import { getIO } from '@/lib/socket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getSessionFromRequest(req);
  if (!session?.isHiddenAdmin) return res.status(403).json({ error: 'Acesso negado.' });
  const { roomId } = req.body as { roomId?: string };
  const room = roomId ? await prisma.room.findUnique({ where: { id: roomId } }) : await getPublicRoom();
  if (!room) return res.status(404).json({ error: 'Sala não encontrada.' });

  await prisma.message.updateMany({
    where: { roomId: room.id },
    data: { isDeleted: true, deletedAt: new Date(), content: null }
  });

  await prisma.adminLog.create({
    data: {
      adminSessionId: session.id,
      actionType: 'clear_room',
      targetRoomId: room.id
    }
  });

  getIO()?.emit(`room:${room.id}:cleared`, { roomId: room.id });
  return res.status(200).json({ ok: true });
}
