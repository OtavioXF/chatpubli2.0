import type { NextApiRequest, NextApiResponse } from 'next';
import formidable from 'formidable';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/db';
import { detectMessageType, getPublicRoom, isRoomLocked } from '@/lib/chat';
import { getSessionFromRequest } from '@/lib/auth';
import { getIO } from '@/lib/socket';

export const config = {
  api: {
    bodyParser: false
  }
};

async function parseForm(req: NextApiRequest) {
  const form = formidable({ multiples: false, maxFileSize: 1024 * 1024 * 250 });
  return new Promise<{ fields: formidable.Fields; files: formidable.Files }>((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const room = await getPublicRoom();

  if (req.method === 'GET') {
    const order = req.query.order === 'desc' ? 'desc' : 'asc';
    const messages = await prisma.message.findMany({
      where: { roomId: room.id },
      include: { attachments: true },
      orderBy: { createdAt: order }
    });
    const lock = await isRoomLocked(room.id);
    return res.status(200).json({ messages, lock });
  }

  if (req.method === 'POST') {
    const session = await getSessionFromRequest(req);
    if (!session) return res.status(401).json({ error: 'Sessão não encontrada.' });

    const lock = await isRoomLocked(room.id);
    if (lock && !session.isHiddenAdmin) return res.status(403).json({ error: 'Chat bloqueado.' });

    const { fields, files } = await parseForm(req);
    const content = String(fields.content || '').trim();
    const uploaded = files.file;

    if (!content && !uploaded) return res.status(400).json({ error: 'Mensagem vazia.' });

    const file = Array.isArray(uploaded) ? uploaded[0] : uploaded;
    const attachmentsData = [] as Array<{ fileName: string; mimeType: string; fileSize: number; url: string }>;

    if (file) {
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
      fs.mkdirSync(uploadsDir, { recursive: true });
      const fileName = `${Date.now()}-${file.originalFilename || 'arquivo'}`;
      const target = path.join(uploadsDir, fileName);
      fs.copyFileSync(file.filepath, target);
      attachmentsData.push({
        fileName: file.originalFilename || fileName,
        mimeType: file.mimetype || 'application/octet-stream',
        fileSize: Number(file.size || 0),
        url: `/uploads/${fileName}`
      });
    }

    const message = await prisma.message.create({
      data: {
        roomId: room.id,
        sessionId: session.id,
        visibleName: session.isHiddenAdmin ? session.maskedName || '••••••' : session.displayName,
        content: content || null,
        messageType: detectMessageType(attachmentsData.length > 0, attachmentsData[0]?.mimeType),
        attachments: {
          create: attachmentsData
        }
      },
      include: { attachments: true }
    });

    getIO()?.emit(`room:${room.id}:message:new`, message);
    return res.status(200).json({ message });
  }

  return res.status(405).end();
}
