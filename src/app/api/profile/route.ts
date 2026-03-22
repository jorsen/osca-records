import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { verifyToken } from '@/lib/auth';

const prisma = new PrismaClient();

function getTokenFromRequest(request: NextRequest): string | null {
  const token = request.cookies.get('auth_token')?.value;
  if (token) return token;

  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  return null;
}

export async function GET(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = verifyToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        address: true,
        birthday: true,
        age: true,
        gender: true,
        location: true,
        relationshipStatus: true,
        seniorIdNumber: true,
        nationalIdNumber: true,
        pensioner: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const userId = verifyToken(token);

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      fullName,
      address,
      birthday,
      age,
      gender,
      location,
      relationshipStatus,
      seniorIdNumber,
      nationalIdNumber,
      pensioner,
    } = body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        fullName: fullName || undefined,
        address: address || undefined,
        birthday: birthday ? new Date(birthday) : undefined,
        age: age ? parseInt(age) : undefined,
        gender: gender || undefined,
        location: location || undefined,
        relationshipStatus: relationshipStatus || undefined,
        seniorIdNumber: seniorIdNumber || undefined,
        nationalIdNumber: nationalIdNumber || undefined,
        pensioner: pensioner ? pensioner === 'yes' : undefined,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        address: true,
        birthday: true,
        age: true,
        gender: true,
        location: true,
        relationshipStatus: true,
        seniorIdNumber: true,
        nationalIdNumber: true,
        pensioner: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
