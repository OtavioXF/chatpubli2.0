import { PrismaClient, RoomType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const room = await prisma.room.findFirst({ where: { slug: 'chatpublico' } });
  if (!room) {
    const session = await prisma.session.create({
      data: {
        displayName: 'system',
        rememberName: false,
        isHiddenAdmin: false,
        sessionToken: 'system-seed-token'
      }
    });

    await prisma.room.create({
      data: {
        type: RoomType.PUBLIC,
        name: 'Chatpublico',
        slug: 'chatpublico',
        createdBySessionId: session.id
      }
    });
  }
}

main().finally(async () => {
  await prisma.$disconnect();
});
