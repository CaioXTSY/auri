import { createHash } from 'crypto';
import { Prisma } from '@prisma/client';

// Every XP writer takes the same row lock; no lock is held during external calls.
export async function lockRewardUser(tx: Prisma.TransactionClient, userId: string) {
  await tx.$queryRaw`SELECT id FROM users WHERE id = ${userId} FOR UPDATE`;
}

export async function awardOnce(
  tx: Prisma.TransactionClient,
  data: {
    userId: string;
    points: number;
    source: string;
    description: string;
    referenceId: string;
  },
) {
  const idempotencyKey = createHash('sha256')
    .update(JSON.stringify([data.userId, data.source, data.referenceId]))
    .digest('hex');
  // Include historical records without a key, without rewriting their balances.
  const existing = await tx.userPoint.findFirst({
    where: { userId: data.userId, source: data.source, referenceId: data.referenceId },
  });
  if (existing) return existing;
  return tx.userPoint.create({ data: { ...data, idempotencyKey } });
}

export async function awardScoreDelta(
  tx: Prisma.TransactionClient,
  data: {
    userId: string;
    points: number;
    source: string;
    description: string;
    referenceId: string;
  },
) {
  const credited = await tx.userPoint.aggregate({
    where: { userId: data.userId, source: data.source, referenceId: data.referenceId },
    _sum: { points: true },
  });
  const delta = Math.max(0, data.points - (credited._sum.points ?? 0));
  if (delta > 0) await tx.userPoint.create({ data: { ...data, points: delta } });
  return delta;
}
