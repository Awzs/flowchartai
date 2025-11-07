import { getDb } from '@/db';
import { boards } from '@/db/schema';
import { auth } from '@/lib/auth';
import { isBoardsV2Enabled } from '@/lib/boards/feature-flags';
import { listBoardsForUser } from '@/lib/boards/repository';
import type { DisplayKind } from '@/lib/boards/types';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';

const createBoardSchema = z.object({
  title: z.string().min(1).optional().default('Untitled Board'),
  description: z.string().optional(),
  displayType: z
    .enum(['flowchart', 'mindmap', 'quiz', 'mixed'])
    .optional()
    .default('flowchart'),
});

export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await listBoardsForUser(session.user.id);
    return NextResponse.json({ boards: result });
  } catch (error) {
    console.error('Error fetching boards:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    if (!isBoardsV2Enabled) {
      return NextResponse.json(
        {
          error: 'Boards v2 is disabled',
          message: 'Set BOARDS_V2_MODE to dual-write or v2-only to enable.',
        },
        { status: 412 }
      );
    }

    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = createBoardSchema.parse(await request.json());
    const db = await getDb();
    const boardId = randomUUID();

    await db.insert(boards).values({
      id: boardId,
      userId: session.user.id,
      title: payload.title,
      description: payload.description,
      displayType: payload.displayType as DisplayKind,
    });

    return NextResponse.json({ id: boardId }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
