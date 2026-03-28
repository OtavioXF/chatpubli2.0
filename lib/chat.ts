import { MessageType } from '@prisma/client';
import { prisma } from './db';

export async function getPublicRoom() {
  let room = await prisma.room.findUnique({ where: { slug: 'chatpublico' } });
  if (!room) {
    const systemSession = await prisma.session.create({
      data: {
        displayName: 'system',
        rememberName: false,
        isHiddenAdmin: false,
        sessionToken: `system-${Date.now()}`
      }
    });

    room = await prisma.room.create({
      data: {
        type: 'PUBLIC',
        name: 'Chatpublico',
        slug: 'chatpublico',
        createdBySessionId: systemSession.id
      }
    });
  }
  return room;
}

export async function isRoomLocked(roomId: string) {
  const lock = await prisma.chatLock.findFirst({
    where: {
      roomId,
      isActive: true,
      endsAt: { gt: new Date() }
    },
    orderBy: { endsAt: 'desc' }
  });

  return lock;
}

export function detectMessageType(hasAttachments: boolean, mimeType?: string | null) {
  if (!hasAttachments) return MessageType.TEXT;
  if (!mimeType) return MessageType.FILE;
  if (mimeType.startsWith('image/')) return MessageType.IMAGE;
  if (mimeType.startsWith('video/')) return MessageType.VIDEO;
  return MessageType.FILE;
}
