import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { hashPassword } from '@/lib/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      username, password, fullName, address, birthday, age, gender,
      relationshipStatus, seniorIdNumber, nationalIdNumber, pensioner,
      birthplace, philsysId, hasNoId,
      idDocuments,
    } = body;

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }

    if (seniorIdNumber && !/^\d{16}$/.test(seniorIdNumber)) {
      return NextResponse.json({ error: 'Senior ID must be exactly 16 digits' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({ where: { username } });
    if (existingUser) {
      return NextResponse.json({ error: 'Username already exists' }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        fullName: fullName || null,
        address: address || null,
        birthday: birthday ? new Date(birthday) : null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        relationshipStatus: relationshipStatus || null,
        seniorIdNumber: seniorIdNumber || null,
        nationalIdNumber: nationalIdNumber || null,
        pensioner: pensioner === 'yes',
        birthplace: birthplace || null,
        philsysId: philsysId || null,
        hasNoId: hasNoId === true,
        ...(Array.isArray(idDocuments) && idDocuments.length > 0
          ? { idDocuments: { create: idDocuments.map((d: { label: string; url: string }) => ({ label: d.label, url: d.url })) } }
          : {}),
      },
    });

    return NextResponse.json({ message: 'User created successfully', userId: user.id }, { status: 201 });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
