import type { MindElixirData } from '@/lib/displays/mindmap-converter';

export type DisplayKind = 'flowchart' | 'mindmap' | 'quiz' | 'mixed';

export interface DisplayDTO {
  id: string;
  boardId: string;
  displayType: DisplayKind;
  displayName: string;
  excalidrawData?: Record<string, unknown> | null;
  structuredPayload?: MindElixirData | Record<string, unknown> | null;
  aiSnapshot?: Record<string, unknown> | null;
  aiModel?: string | null;
  promptVersion?: string | null;
  tokensUsed?: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
    scale: number;
    zIndex: number;
  };
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

export interface BoardDTO {
  id: string;
  title: string;
  description?: string | null;
  displayType: DisplayKind;
  coverImageUrl?: string | null;
  metadata?: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
  displays: DisplayDTO[];
}
