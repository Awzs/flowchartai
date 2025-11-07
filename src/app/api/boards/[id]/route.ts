import { getDb } from '@/db';
import { boards } from '@/db/schema';
import { auth } from '@/lib/auth';
import { deleteBoardForFlowchart, getBoardById } from '@/lib/boards/repository';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { eq } from 'drizzle-orm';

const updateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const board = await getBoardById(id, session.user.id);
    if (!board) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    return NextResponse.json({ board });
  } catch (error) {
    console.error('Error fetching board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const payload = updateSchema.parse(await request.json());
    const db = await getDb();

    const [existing] = await db
      .select({ id: boards.id })
      .from(boards)
      .where(eq(boards.id, id));

    if (!existing) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    await db
      .update(boards)
      .set({
        ...(payload.title ? { title: payload.title } : {}),
        ...(payload.description ? { description: payload.description } : {}),
        updatedAt: new Date(),
      })
      .where(eq(boards.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error updating board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const db = await getDb();
    const [existing] = await db
      .select({ id: boards.id, userId: boards.userId })
      .from(boards)
      .where(eq(boards.id, id));

    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: 'Board not found' }, { status: 404 });
    }

    await deleteBoardForFlowchart(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting board:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
