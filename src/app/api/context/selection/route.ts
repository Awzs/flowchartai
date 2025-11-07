import { getDb } from '@/db';
import { contexts } from '@/db/schema';
import { auth } from '@/lib/auth';
import { ContextEngine } from '@/lib/context/engine';
import type { SelectionContextSnapshot } from '@/lib/context/types';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const selectionSchema = z.object({
  boardId: z.string().min(1),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        text: z.string().optional().nullable(),
        type: z.string().optional().nullable(),
        position: z
          .object({ x: z.number().optional(), y: z.number().optional() })
          .optional(),
      })
    )
    .default([]),
});

export async function POST(request: Request) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const payload = selectionSchema.parse(body);

    const snapshot: SelectionContextSnapshot & { boardId: string } = {
      type: 'selection',
      boardId: payload.boardId,
      nodes: payload.nodes.map((node) => ({
        id: node.id,
        text: node.text,
        type: node.type,
        position: node.position,
      })),
      timestamp: Date.now(),
    };

    const engine = new ContextEngine();
    const tokenCount = engine.estimateTokens(
      snapshot.nodes.map((node) => node.text ?? '').join(', ')
    );

    const db = await getDb();
    await db.insert(contexts).values({
      id: randomUUID(),
      boardId: snapshot.boardId,
      contextType: snapshot.type,
      contextKey: String(snapshot.timestamp),
      contextValue: snapshot,
      tokenCount,
    });

    return NextResponse.json({ snapshot, tokenCount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid payload', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error saving selection context:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
