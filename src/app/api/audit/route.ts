import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyTokenFull } from '@/lib/auth';

const prisma = new PrismaClient();

function getToken(req: NextRequest) {
  const t = req.cookies.get('auth_token')?.value;
  if (t) return t;
  const auth = req.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return null;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const payload = verifyTokenFull(token);
  if (!payload || payload.role !== 'SUPERADMIN') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: 100,
  });

  return NextResponse.json(logs);
}
