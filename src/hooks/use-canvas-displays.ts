'use client';

import type { DisplayType } from '@/lib/displays/registry';
import type { MindElixirData } from '@/lib/displays/mindmap-converter';
import { create } from 'zustand';

export interface CanvasDisplayPayload {
  id: string;
  type: DisplayType;
  title: string;
  data: MindElixirData | Record<string, unknown>;
  position?: {
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
  };
  metadata?: Record<string, unknown>;
}

interface CanvasDisplayState {
  displays: CanvasDisplayPayload[];
  addOrUpdate: (display: CanvasDisplayPayload) => void;
  remove: (id: string) => void;
  clear: () => void;
  updatePosition: (
    id: string,
    position: { x: number; y: number; width: number; height: number }
  ) => void;
}

export const useCanvasDisplays = create<CanvasDisplayState>((set, get) => ({
  displays: [],
  addOrUpdate: (display) => {
    set((state) => {
      const existingIndex = state.displays.findIndex(
        (item) => item.id === display.id
      );
      const next = [...state.displays];
      if (existingIndex >= 0) {
        next[existingIndex] = { ...next[existingIndex], ...display };
      } else {
        next.push({
          ...display,
          position:
            display.position ?? {
              x: 80,
              y: 80,
              width: 480,
              height: 360,
              zIndex: 1,
            },
        });
      }
      return { displays: next };
    });
  },
  remove: (id) =>
    set((state) => ({
      displays: state.displays.filter((display) => display.id !== id),
    })),
  clear: () => set({ displays: [] }),
  updatePosition: (id, position) =>
    set((state) => ({
      displays: state.displays.map((display) =>
        display.id === id
          ? {
              ...display,
              position: {
                ...display.position,
                ...position,
              },
            }
          : display
      ),
    })),
}));

export function upsertMindmapDisplay(display: CanvasDisplayPayload) {
  useCanvasDisplays.getState().addOrUpdate(display);
}

export function updateDisplayPosition(
  id: string,
  position: { x: number; y: number; width: number; height: number }
) {
  useCanvasDisplays.getState().updatePosition(id, position);
}
