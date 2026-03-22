import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { del } from '@vercel/blob';
import { verifyTokenFull } from '@/lib/auth';

const prisma = new PrismaClient();

function getToken(request: NextRequest): string | null {
  const token = request.cookies.get('auth_token')?.value;
  if (token) return token;
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return null;
}

function requireSuperAdmin(request: NextRequest) {
  const token = getToken(request);
  if (!token) return null;
  const payload = verifyTokenFull(token);
  if (!payload || payload.role !== 'SUPERADMIN') return null;
  return payload;
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireSuperAdmin(_request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const docs = await prisma.idDocument.findMany({
    where: { userId: params.id },
    select: { id: true, label: true, url: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  return NextResponse.json(docs);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireSuperAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { label, url } = await request.json();
  if (!label || !url) return NextResponse.json({ error: 'label and url are required' }, { status: 400 });

  const doc = await prisma.idDocument.create({
    data: { userId: params.id, label, url },
    select: { id: true, label: true, url: true, createdAt: true },
  });

  return NextResponse.json(doc);
}

export async function DELETE(request: NextRequest, { params: _ }: { params: { id: string } }) {
  if (!requireSuperAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const docId = searchParams.get('docId');
  if (!docId) return NextResponse.json({ error: 'docId is required' }, { status: 400 });

  const doc = await prisma.idDocument.findUnique({ where: { id: docId } });
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await del(doc.url);
  await prisma.idDocument.delete({ where: { id: docId } });

  return NextResponse.json({ message: 'Deleted' });
}
