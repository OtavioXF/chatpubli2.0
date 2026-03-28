import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/db';
import { getPublicRoom } from '@/lib/chat';
import { getSessionFromRequest } from '@/lib/auth';
import { getIO } from '@/lib/socket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  const session = await getSessionFromRequest(req);
  if (!session?.isHiddenAdmin) return res.status(403).json({ error: 'Acesso negado.' });

  const { roomId, minutes = 15, action = 'lock' } = req.body as { roomId?: string; minutes?: number; action?: 'lock' | 'unlock' };
  const room = roomId ? await prisma.room.findUnique({ where: { id: roomId } }) : await getPublicRoom();
  if (!room) return res.status(404).json({ error: 'Sala não encontrada.' });

  if (action === 'unlock') {
    await prisma.chatLock.updateMany({ where: { roomId: room.id, isActive: true }, data: { isActive: false, endsAt: new Date() } });
    getIO()?.emit(`room:${room.id}:unlocked`, { roomId: room.id });
    return res.status(200).json({ ok: true });
  }

  const endsAt = new Date(Date.now() + minutes * 60 * 1000);
  await prisma.chatLock.create({
    data: {
      roomId: room.id,
      lockedBySessionId: session.id,
      endsAt,
      isActive: true
    }
  });

  await prisma.adminLog.create({
    data: {
      adminSessionId: session.id,
      actionType: 'lock_room',
      targetRoomId: room.id,
      metadataJson: JSON.stringify({ minutes })
    }
  });

  getIO()?.emit(`room:${room.id}:locked`, { roomId: room.id, endsAt: endsAt.toISOString() });
  return res.status(200).json({ ok: true, endsAt });
}
