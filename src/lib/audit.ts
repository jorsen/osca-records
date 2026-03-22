import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function logAudit(
  action: string,
  actorName?: string | null,
  targetName?: string | null,
  details?: string | null,
) {
  try {
    await prisma.auditLog.create({
      data: {
        action,
        actorName: actorName || null,
        targetName: targetName || null,
        details: details || null,
      },
    });
  } catch (e) {
    console.error('Audit log error:', e);
  }
}
