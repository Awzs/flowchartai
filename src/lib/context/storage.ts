import { getDb } from '@/db';
import { contexts } from '@/db/schema';
import type { ContextSnapshot } from '@/lib/context/types';
import { and, desc, eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export async function saveContextSnapshot(snapshot: ContextSnapshot & {
  boardId: string;
  tokenCount?: number;
  expiresAt?: Date | null;
}) {
  const db = await getDb();
  await db.insert(contexts).values({
    id: randomUUID(),
    boardId: snapshot.boardId,
    contextType: snapshot.type,
    contextKey: 'timestamp' in snapshot ? String(snapshot.timestamp) : null,
    contextValue: snapshot,
    tokenCount: snapshot.tokenCount ?? 0,
    expiresAt: snapshot.expiresAt ?? null,
  });
}

export async function getContexts(
  boardId: string,
  type?: string,
  limit = 20
) {
  const db = await getDb();
  const whereClause = type
    ? and(eq(contexts.boardId, boardId), eq(contexts.contextType, type))
    : eq(contexts.boardId, boardId);

  const list = await db
    .select()
    .from(contexts)
    .where(whereClause)
    .orderBy(desc(contexts.updatedAt))
    .limit(limit);

  return list.map((row) => row.contextValue as ContextSnapshot);
}
