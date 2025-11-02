import { getDb } from '@/db';
import { mindmaps } from '@/db/schema';
import { auth } from '@/lib/auth';
import { desc, eq } from 'drizzle-orm';
import { headers } from 'next/headers';
import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const mindmapPayloadSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  mode: z.enum(['replace', 'extend']).optional().default('replace'),
  data: z.record(z.any()),
  raw: z.string().min(1, 'Mind map raw payload is required'),
  metadata: z.record(z.any()).optional().default({}),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const db = await getDb();
    const list = await db
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
      .where(eq(mindmaps.userId, session.user.id))
      .orderBy(desc(mindmaps.updatedAt));

    return NextResponse.json({ mindmaps: list });
  } catch (error) {
    console.error('Error fetching mindmaps:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const payload = mindmapPayloadSchema.parse(body);

    const mindmapId = `mindmap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;

    const db = await getDb();
    const [inserted] = await db
      .insert(mindmaps)
      .values({
        id: mindmapId,
        title: payload.title ?? '思维导图',
        description: payload.description,
        mode: payload.mode,
        data: payload.data,
        raw: payload.raw,
        metadata: payload.metadata,
        userId: session.user.id,
      })
      .returning({ id: mindmaps.id });

    return NextResponse.json({ id: inserted.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating mindmap:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
