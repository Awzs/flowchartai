'use client';

import MindElixir from 'mind-elixir';
import type { MindElixirInstance } from 'mind-elixir';
import 'mind-elixir/style.css';
import type { MindElixirData } from '@/lib/displays/mindmap-converter';
import { cn } from '@/lib/utils';
import { useEffect, useMemo, useRef } from 'react';

interface MindMapDisplayProps {
  data: MindElixirData | null;
  editable?: boolean;
  onChange?: (data: MindElixirData) => void;
  className?: string;
}

export const MindMapDisplay: React.FC<MindMapDisplayProps> = ({
  data,
  editable = false,
  onChange,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const instanceRef = useRef<MindElixirInstance | null>(null);
  const operationHandlerRef = useRef<((operation: unknown) => void) | null>(
    null
  );

  const baseOptions = useMemo(
    () => ({
      direction: MindElixir.SIDE,
      draggable: true,
      editable,
      contextMenu: editable,
      toolBar: false,
      keypress: false,
      mouseSelectionButton: 0 as const,
      allowUndo: false,
    }),
    [editable]
  );

  useEffect(() => {
    if (!containerRef.current || !data) {
      return;
    }

    // 销毁旧实例，避免多次挂载导致的内存泄漏
    if (instanceRef.current) {
      if (operationHandlerRef.current) {
        instanceRef.current.bus.removeListener(
          'operation',
          operationHandlerRef.current
        );
      }
      instanceRef.current.destroy();
      instanceRef.current = null;
    }

    const instance = new MindElixir({
      ...baseOptions,
      el: containerRef.current,
    });

    const initResult = instance.init(data);
    if (initResult instanceof Error) {
      console.error('初始化思维导图失败:', initResult);
      return () => {
        instance.destroy();
      };
    }

    if (editable) {
      instance.enableEdit();
    } else {
      instance.disableEdit();
    }

    instanceRef.current = instance;

    if (onChange) {
      const handleOperation = () => {
        if (!instanceRef.current) return;
        try {
          const nextData = instanceRef.current.getData();
          onChange(nextData as MindElixirData);
        } catch (error) {
          console.error('Failed to read mind map data after operation:', error);
        }
      };
      operationHandlerRef.current = handleOperation;
      instance.bus.addListener('operation', handleOperation);
    }

    return () => {
      if (operationHandlerRef.current) {
        instance.bus.removeListener('operation', operationHandlerRef.current);
      }
      instance.destroy();
      instanceRef.current = null;
    };
  }, [baseOptions, data, editable, onChange]);

  if (!data) {
    return (
      <div
        className={cn(
          'flex items-center justify-center w-full h-full bg-gray-50',
          className
        )}
      >
        <div className="text-center text-gray-500">
          <p className="text-sm">No mind map data</p>
          <p className="text-xs mt-1 opacity-75">
            Generate a mind map to see it here
          </p>
        </div>
      </div>
    );
  }

  return <div ref={containerRef} className={cn('w-full h-full', className)} />;
};

export default MindMapDisplay;
