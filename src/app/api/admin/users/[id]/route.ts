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

function requireSuperAdmin(request: NextRequest) {
  const token = getToken(request);
  if (!token) return null;
  const payload = verifyTokenFull(token);
  if (!payload || payload.role !== 'SUPERADMIN') return null;
  return payload;
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireSuperAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await request.json();
  const {
    fullName, address, birthday, age, gender,
    relationshipStatus, seniorIdNumber, nationalIdNumber, pensioner,
  } = body;

  if (seniorIdNumber && !/^\d{16}$/.test(seniorIdNumber)) {
    return NextResponse.json({ error: 'Senior ID must be exactly 16 digits' }, { status: 400 });
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: {
      fullName: fullName || undefined,
      address: address || undefined,
      birthday: birthday ? new Date(birthday) : undefined,
      age: age ? parseInt(age) : undefined,
      gender: gender || undefined,
      relationshipStatus: relationshipStatus || undefined,
      seniorIdNumber: seniorIdNumber || undefined,
      nationalIdNumber: nationalIdNumber || undefined,
      pensioner: pensioner !== undefined ? pensioner === 'yes' : undefined,
    },
    select: {
      id: true, username: true, fullName: true, address: true,
      birthday: true, age: true, gender: true,
      relationshipStatus: true, seniorIdNumber: true,
      nationalIdNumber: true, pensioner: true, createdAt: true,
    },
  });

  return NextResponse.json(user);
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  if (!requireSuperAdmin(request)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ message: 'User deleted successfully' });
}
