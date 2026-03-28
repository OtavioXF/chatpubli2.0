import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';
import { isRoomLocked } from '@/lib/chat';
import { getSessionFromRequest } from '@/lib/auth';
import { getIO } from '@/lib/socket';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const id = String(req.query.id);
  const room = await prisma.room.findUnique({ where: { id } });
  if (!room || room.type !== 'GROUP') return res.status(404).json({ error: 'Grupo não encontrado.' });

  if (req.method === 'GET') {
    const messages = await prisma.message.findMany({ where: { roomId: room.id }, include: { attachments: true }, orderBy: { createdAt: 'asc' } });
    const lock = await isRoomLocked(room.id);
    return res.status(200).json({ room, messages, lock });
  }

  if (req.method === 'POST') {
    const session = await getSessionFromRequest(req);
    if (!session) return res.status(401).json({ error: 'Sessão não encontrada.' });

    const { password, content } = req.body as { password?: string; content?: string };

    if (password) {
      const ok = await bcrypt.compare(password, room.passwordHash || '');
      return res.status(200).json({ ok });
    }

    const lock = await isRoomLocked(room.id);
    if (lock && !session.isHiddenAdmin) return res.status(403).json({ error: 'Grupo bloqueado.' });

    const message = await prisma.message.create({
      data: {
        roomId: room.id,
        sessionId: session.id,
        visibleName: session.isHiddenAdmin ? session.maskedName || '••••••' : session.displayName,
        content: String(content || '').trim(),
        messageType: 'TEXT'
      },
      include: { attachments: true }
    });

    getIO()?.emit(`room:${room.id}:message:new`, message);
    return res.status(200).json({ message });
  }

  return res.status(405).end();
}
