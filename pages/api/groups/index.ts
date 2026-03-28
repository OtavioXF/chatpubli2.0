import type { NextApiRequest, NextApiResponse } from 'next';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { getSessionFromRequest } from '@/lib/auth';

const createSchema = z.object({
  name: z.string().min(2).max(40),
  password: z.string().min(3).max(100)
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    const groups = await prisma.room.findMany({ where: { type: 'GROUP', isActive: true }, orderBy: { createdAt: 'desc' } });
    return res.status(200).json({ groups });
  }

  if (req.method === 'POST') {
    const session = await getSessionFromRequest(req);
    if (!session) return res.status(401).json({ error: 'Sessão não encontrada.' });

    const parsed = createSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Dados inválidos.' });

    const slugBase = slugify(parsed.data.name);
    const slug = `${slugBase}-${Date.now().toString().slice(-5)}`;
    const passwordHash = await bcrypt.hash(parsed.data.password, 10);

    const group = await prisma.room.create({
      data: {
        type: 'GROUP',
        name: parsed.data.name,
        slug,
        passwordHash,
        createdBySessionId: session.id
      }
    });

    return res.status(200).json({ group });
  }

  return res.status(405).end();
}
