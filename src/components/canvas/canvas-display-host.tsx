'use client';

import { updateDisplayPosition, useCanvasDisplays } from '@/hooks/use-canvas-displays';
import { displayRegistry } from '@/lib/displays/registry';
import { Rnd } from 'react-rnd';
import { useMemo } from 'react';

export const CanvasDisplayHost = () => {
  const displays = useCanvasDisplays((state) => state.displays);

  const renderables = useMemo(() => {
    return displays.map((display) => {
      const definition = displayRegistry.get(display.type);
      if (!definition?.renderer) {
        return null;
      }
      return { ...display, Renderer: definition.renderer };
    });
  }, [displays]);

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {renderables.map((display) => {
        if (!display) return null;
        const { Renderer } = display;
        return (
          <Rnd
            key={display.id}
            size={{
              width: display.position?.width ?? 480,
              height: display.position?.height ?? 360,
            }}
            position={{
              x: display.position?.x ?? 80,
              y: display.position?.y ?? 80,
            }}
            bounds="parent"
            dragHandleClassName="canvas-display-host__title"
            enableResizing
            className="pointer-events-auto"
            onDragStop={(_, data) =>
              updateDisplayPosition(display.id, {
                x: data.x,
                y: data.y,
                width: display.position?.width ?? data.node.offsetWidth,
                height: display.position?.height ?? data.node.offsetHeight,
              })
            }
            onResizeStop={(_, __, ref, ___, position) =>
              updateDisplayPosition(display.id, {
                x: position.x,
                y: position.y,
                width: ref.offsetWidth,
                height: ref.offsetHeight,
              })
            }
          >
            <div className="rounded-xl border border-gray-200 bg-white/90 shadow-lg backdrop-blur-sm h-full w-full overflow-hidden">
              <div className="canvas-display-host__title flex items-center justify-between border-b border-gray-100 px-3 py-2 text-sm font-medium text-gray-700 cursor-move">
                <span>{display.title}</span>
              </div>
              <div className="h-full w-full">
                <Renderer data={display.data} className="h-full w-full" />
              </div>
            </div>
          </Rnd>
        );
      })}
    </div>
  );
};
