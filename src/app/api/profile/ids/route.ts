import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { del } from '@vercel/blob';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

function getToken(request: NextRequest): string | null {
  const token = request.cookies.get('auth_token')?.value;
  if (token) return token;
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return null;
}

export async function POST(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = verifyToken(token);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { label, url } = await request.json();
  if (!label || !url) return NextResponse.json({ error: 'label and url are required' }, { status: 400 });

  const doc = await prisma.idDocument.create({
    data: { userId, label, url },
    select: { id: true, label: true, url: true, createdAt: true },
  });

  return NextResponse.json(doc);
}

export async function DELETE(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = verifyToken(token);
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const doc = await prisma.idDocument.findFirst({ where: { id, userId } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await del(doc.url);
  await prisma.idDocument.delete({ where: { id } });

  return NextResponse.json({ message: 'Deleted' });
}
