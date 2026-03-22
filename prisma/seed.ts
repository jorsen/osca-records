import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.user.findUnique({ where: { username: 'superadmin' } });
  if (existing) {
    console.log('Superadmin already exists, skipping.');
    return;
  }

  const hashed = await bcrypt.hash('Admin@1234', 10);
  await prisma.user.create({
    data: {
      username: 'superadmin',
      password: hashed,
      fullName: 'Super Admin',
      role: 'SUPERADMIN',
    },
  });
  console.log('Superadmin created. Username: superadmin | Password: Admin@1234');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
