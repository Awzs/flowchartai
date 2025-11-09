import { getDb } from '@/db';
import {
  boards,
  displays,
  flowcharts,
} from '@/db/schema';
import { isBoardsDualWrite, isBoardsV2Enabled } from '@/lib/boards/feature-flags';
import type { BoardDTO, DisplayDTO, DisplayKind } from '@/lib/boards/types';
import type { MindElixirData } from '@/lib/displays/mindmap-converter';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import {
  DISPLAY_ID_SUFFIX,
  buildBoardFromFlowchart,
  buildDisplayFromFlowchart,
  safeParseJSON,
  type FlowchartRow,
} from './transformers';

export type { FlowchartRow } from './transformers';

function normalizeDisplay(row: typeof displays.$inferSelect): DisplayDTO {
  return {
    id: row.id,
    boardId: row.boardId,
    displayType: (row.displayType as DisplayKind) ?? 'flowchart',
    displayName: row.displayName,
    excalidrawData: row.excalidrawData as Record<string, unknown> | null,
    structuredPayload: row.structuredPayload as MindElixirData | null,
    aiSnapshot: row.aiSnapshot as Record<string, unknown> | null,
    aiModel: row.aiModel ?? undefined,
    promptVersion: row.promptVersion ?? undefined,
    tokensUsed: row.tokensUsed ?? undefined,
    position: {
      x: row.positionX ?? 0,
      y: row.positionY ?? 0,
      width: row.width ?? 800,
      height: row.height ?? 600,
      scale: Number(row.scale ?? 1),
      zIndex: row.zIndex ?? 1,
    },
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
  };
}

function normalizeBoard(
  row: typeof boards.$inferSelect,
  boardDisplays: DisplayDTO[]
): BoardDTO {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    displayType: (row.displayType as DisplayKind) ?? 'flowchart',
    coverImageUrl: row.coverImageUrl ?? undefined,
    metadata: row.metadata as Record<string, unknown> | null,
    createdAt: row.createdAt?.toISOString() ?? new Date().toISOString(),
    updatedAt: row.updatedAt?.toISOString() ?? new Date().toISOString(),
    displays: boardDisplays,
  };
}

export async function listBoardsForUser(userId: string): Promise<BoardDTO[]> {
  const db = await getDb();

  if (!isBoardsV2Enabled) {
    const legacy = await db
      .select()
      .from(flowcharts)
      .where(eq(flowcharts.userId, userId))
      .orderBy(desc(flowcharts.updatedAt));
    return legacy.map((row) => buildBoardFromFlowchart(row as FlowchartRow));
  }

  const boardRows = await db
    .select()
    .from(boards)
    .where(eq(boards.userId, userId))
    .orderBy(desc(boards.updatedAt));

  if (!boardRows.length) {
    return [];
  }

  const boardIds = boardRows.map((row) => row.id);
  if (boardIds.length === 0) {
    return [];
  }

  const displayRows = await db
    .select()
    .from(displays)
    .where(inArray(displays.boardId, boardIds));

  const boardDisplaysMap = new Map<string, DisplayDTO[]>();
  for (const row of displayRows) {
    const list = boardDisplaysMap.get(row.boardId) ?? [];
    list.push(normalizeDisplay(row));
    boardDisplaysMap.set(row.boardId, list);
  }

  return boardRows.map((row) =>
    normalizeBoard(row, boardDisplaysMap.get(row.id) ?? [])
  );
}

export async function getBoardById(
  boardId: string,
  userId: string
): Promise<BoardDTO | null> {
  const db = await getDb();

  if (!isBoardsV2Enabled) {
    const [legacy] = await db
      .select()
      .from(flowcharts)
      .where(and(eq(flowcharts.id, boardId), eq(flowcharts.userId, userId)));
    return legacy ? buildBoardFromFlowchart(legacy as FlowchartRow) : null;
  }

  const [boardRow] = await db
    .select()
    .from(boards)
    .where(and(eq(boards.id, boardId), eq(boards.userId, userId)));

  if (!boardRow) {
    return null;
  }

  const displayRows = await db
    .select()
    .from(displays)
    .where(eq(displays.boardId, boardRow.id));

  return normalizeBoard(boardRow, displayRows.map(normalizeDisplay));
}

export async function syncLegacyFlowchartToBoard(
  flowchart: FlowchartRow
): Promise<void> {
  if (!isBoardsV2Enabled && !isBoardsDualWrite) {
    return;
  }

  const db = await getDb();
  const boardId = flowchart.id;
  const displayId = `${flowchart.id}${DISPLAY_ID_SUFFIX}`;
  const parsedContent = safeParseJSON(flowchart.content);

  await db
    .insert(boards)
    .values({
      id: boardId,
      userId: flowchart.userId,
      title: flowchart.title,
      description: null,
      displayType: 'flowchart',
      coverImageUrl: null,
      metadata: flowchart.thumbnail
        ? { thumbnail: flowchart.thumbnail }
        : {},
    })
    .onConflictDoUpdate({
      target: boards.id,
      set: {
        title: flowchart.title,
        metadata: flowchart.thumbnail
          ? { thumbnail: flowchart.thumbnail }
          : {},
        updatedAt: new Date(),
      },
    });

  await db
    .insert(displays)
    .values({
      id: displayId,
      boardId,
      displayType: 'flowchart',
      displayName: flowchart.title || '流程图',
      excalidrawData: parsedContent,
      structuredPayload: null,
      aiSnapshot: null,
      aiModel: null,
      promptVersion: null,
      tokensUsed: 0,
      positionX: 0,
      positionY: 0,
      width: 1200,
      height: 800,
      scale: '1',
      zIndex: 1,
      metadata: flowchart.thumbnail
        ? { thumbnail: flowchart.thumbnail }
        : {},
    })
    .onConflictDoUpdate({
      target: displays.id,
      set: {
        displayName: flowchart.title || '流程图',
        excalidrawData: parsedContent,
        metadata: flowchart.thumbnail
          ? { thumbnail: flowchart.thumbnail }
          : {},
        updatedAt: new Date(),
      },
    });
}

export async function deleteBoardForFlowchart(flowchartId: string) {
  if (!isBoardsV2Enabled && !isBoardsDualWrite) {
    return;
  }
  const db = await getDb();
  await db.delete(boards).where(eq(boards.id, flowchartId));
}

export async function persistMindmapAsDisplay(options: {
  boardId: string;
  mindmapId?: string;
  data: MindElixirData;
  title: string;
  mode: 'replace' | 'extend';
  userId: string;
  metadata?: Record<string, unknown>;
}) {
  if (!isBoardsV2Enabled) {
    return;
  }
  const db = await getDb();
  const displayId = options.mindmapId ?? randomUUID();
  const upsertData = {
    id: displayId,
    boardId: options.boardId,
    displayType: 'mindmap' as DisplayKind,
    displayName: options.title || '思维导图',
    structuredPayload: options.data,
    metadata: {
      ...(options.metadata ?? {}),
      mode: options.mode,
    },
  } as typeof displays.$inferInsert;

  await db
    .insert(displays)
    .values(upsertData)
    .onConflictDoUpdate({
      target: displays.id,
      set: {
        structuredPayload: options.data,
        displayName: options.title || '思维导图',
        metadata: {
          ...(options.metadata ?? {}),
          mode: options.mode,
        },
        updatedAt: new Date(),
      },
    });
}
