import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyTokenFull, hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

function getToken(request: NextRequest): string | null {
  const token = request.cookies.get('auth_token')?.value;
  if (token) return token;
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return null;
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyTokenFull(token);
  if (!payload || payload.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { password } = await request.json();
  if (!password || password.length < 6) {
    return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
  }

  const hashed = await hashPassword(password);
  await prisma.user.update({ where: { id: params.id }, data: { password: hashed } });

  return NextResponse.json({ message: 'Password updated successfully' });
}
