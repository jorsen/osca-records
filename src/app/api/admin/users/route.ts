import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyTokenFull } from '@/lib/auth';

const prisma = new PrismaClient();

function getToken(request: NextRequest): string | null {
  const token = request.cookies.get('auth_token')?.value;
  if (token) return token;
  const auth = request.headers.get('authorization');
  if (auth?.startsWith('Bearer ')) return auth.substring(7);
  return null;
}

export async function GET(request: NextRequest) {
  const token = getToken(request);
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyTokenFull(token);
  if (!payload || payload.role !== 'SUPERADMIN') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const order = searchParams.get('order') === 'asc' ? 'asc' : 'desc';

  const allowedSorts = ['fullName', 'username', 'age', 'gender', 'pensioner', 'createdAt'];
  const resolvedSort = allowedSorts.includes(sortBy) ? sortBy : 'createdAt';

  const users = await prisma.user.findMany({
    where: { role: 'USER' },
    orderBy: { [resolvedSort]: order },
    select: {
      id: true,
      username: true,
      fullName: true,
      address: true,
      birthday: true,
      age: true,
      gender: true,
      relationshipStatus: true,
      seniorIdNumber: true,
      nationalIdNumber: true,
      pensioner: true,
      createdAt: true,
    },
  });

  return NextResponse.json(users);
}
