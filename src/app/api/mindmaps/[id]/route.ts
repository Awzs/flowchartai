import { getDb } from '@/db';
import { mindmaps } from '@/db/schema';
import { auth } from '@/lib/auth';
import { and, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const mindmapUpdateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  mode: z.enum(['replace', 'extend']).optional(),
  data: z.record(z.any()).optional(),
  raw: z.string().optional(),
  metadata: z.record(z.any()).optional(),
});

export async function GET(
  request: NextRequest,
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
    const [mindmap] = await db
      .select({
        id: mindmaps.id,
        title: mindmaps.title,
        description: mindmaps.description,
        mode: mindmaps.mode,
        data: mindmaps.data,
        raw: mindmaps.raw,
        metadata: mindmaps.metadata,
        createdAt: mindmaps.createdAt,
        updatedAt: mindmaps.updatedAt,
      })
      .from(mindmaps)
      .where(and(eq(mindmaps.id, id), eq(mindmaps.userId, session.user.id)));

    if (!mindmap) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ mindmap });
  } catch (error) {
    console.error('Error fetching mindmap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const payload = mindmapUpdateSchema.parse(body);

    const { id } = await params;

    const db = await getDb();

    const [existing] = await db
      .select({ id: mindmaps.id })
      .from(mindmaps)
      .where(and(eq(mindmaps.id, id), eq(mindmaps.userId, session.user.id)));

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db
      .update(mindmaps)
      .set({
        ...(payload.title ? { title: payload.title } : {}),
        ...(payload.description !== undefined
          ? { description: payload.description }
          : {}),
        ...(payload.mode ? { mode: payload.mode } : {}),
        ...(payload.data ? { data: payload.data } : {}),
        ...(payload.raw ? { raw: payload.raw } : {}),
        ...(payload.metadata ? { metadata: payload.metadata } : {}),
        updatedAt: new Date(),
      })
      .where(eq(mindmaps.id, id));

    return NextResponse.json({ id });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating mindmap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
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
      .select({ id: mindmaps.id })
      .from(mindmaps)
      .where(and(eq(mindmaps.id, id), eq(mindmaps.userId, session.user.id)));

    if (!existing) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    await db.delete(mindmaps).where(eq(mindmaps.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting mindmap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
