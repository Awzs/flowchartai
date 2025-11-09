import type { BoardDTO, DisplayDTO } from '@/lib/boards/types';

export interface FlowchartRow {
  id: string;
  title: string;
  content: string;
  thumbnail: string | null;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
}

export const DISPLAY_ID_SUFFIX = '::flowchart-primary';

export function safeParseJSON(
  content: string
): Record<string, unknown> | null {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.warn('Failed to parse flowchart content as JSON, storing raw text');
    return null;
  }
}

export function buildDisplayFromFlowchart(
  flowchart: FlowchartRow
): DisplayDTO {
  const parsed = safeParseJSON(flowchart.content);
  return {
    id: `${flowchart.id}${DISPLAY_ID_SUFFIX}`,
    boardId: flowchart.id,
    displayType: 'flowchart',
    displayName: flowchart.title || '流程图',
    excalidrawData: parsed,
    structuredPayload: null,
    aiSnapshot: null,
    aiModel: null,
    promptVersion: null,
    tokensUsed: 0,
    position: {
      x: 0,
      y: 0,
      width: 1200,
      height: 800,
      scale: 1,
      zIndex: 1,
    },
    metadata: flowchart.thumbnail
      ? { thumbnail: flowchart.thumbnail }
      : undefined,
    createdAt: flowchart.createdAt.toISOString(),
    updatedAt: flowchart.updatedAt.toISOString(),
  };
}

export function buildBoardFromFlowchart(
  flowchart: FlowchartRow
): BoardDTO {
  return {
    id: flowchart.id,
    title: flowchart.title,
    description: null,
    displayType: 'flowchart' as const,
    coverImageUrl: null,
    metadata: flowchart.thumbnail
      ? { thumbnail: flowchart.thumbnail }
      : undefined,
    createdAt: flowchart.createdAt.toISOString(),
    updatedAt: flowchart.updatedAt.toISOString(),
    displays: [buildDisplayFromFlowchart(flowchart)],
  };
}
