'use client';

import MindElixir from 'mind-elixir';
import MindElixirReact from 'mind-elixir-react';
import { useCallback, useMemo, useRef } from 'react';
import 'mind-elixir/style.css';
import type { MindElixirData } from '@/lib/displays/mindmap-converter';
import { cn } from '@/lib/utils';

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
  const mindRef = useRef<any>(null);

  const options = useMemo(
    () => ({
      direction: MindElixir.SIDE,
      draggable: true,
      editable,
      contextMenu: editable,
      toolBar: false,
      keypress: false,
      mouseSelectionButton: 0,
      allowUndo: false,
    }),
    [editable]
  );

  const handleOperate = useCallback(
    (_operation: unknown) => {
      if (!onChange) return;
      const instance = mindRef.current?.instance;
      if (instance && typeof instance.getData === 'function') {
        try {
          const nextData = instance.getData();
          onChange(nextData);
        } catch (error) {
          console.error('Failed to read mind map data after operation:', error);
        }
      }
    },
    [onChange]
  );

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

  return (
    <div className={cn('w-full h-full', className)}>
      <MindElixirReact
        ref={mindRef}
        data={data}
        options={options}
        plugins={[]}
        style={{ width: '100%', height: '100%' }}
        onOperate={handleOperate}
        onSelectNode={() => {}}
        onExpandNode={() => {}}
      />
    </div>
  );
};

export default MindMapDisplay;
