import { getDb } from '@/db';
import { contexts } from '@/db/schema';
import { auth } from '@/lib/auth';
import { ContextEngine } from '@/lib/context/engine';
import type { ContextSnapshot } from '@/lib/context/types';
import { and, eq, inArray } from 'drizzle-orm';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const buildSchema = z.object({
  boardId: z.string().min(1),
  userPrompt: z.string().min(1),
  contextTypes: z.array(z.string()).optional(),
  limit: z.number().min(1).max(50).optional().default(10),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = buildSchema.parse(await request.json());
    const db = await getDb();

    const baseWhere = eq(contexts.boardId, payload.boardId);
    const whereClause = payload.contextTypes?.length
      ? and(baseWhere, inArray(contexts.contextType, payload.contextTypes))
      : baseWhere;

    const rows = await db
      .select()
      .from(contexts)
      .where(whereClause)
      .orderBy(contexts.updatedAt)
      .limit(payload.limit);

    const snapshots = rows.map((row) => row.contextValue as ContextSnapshot);
    const engine = new ContextEngine();
    const { prompt, included } = engine.buildPrompt(
      payload.userPrompt,
      snapshots
    );

    return NextResponse.json({
      contextualPrompt: prompt,
      includedContexts: included,
      tokenLimit: 1500,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error building context prompt:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
