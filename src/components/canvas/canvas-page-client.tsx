'use client';

import type { ExcalidrawWrapperProps } from '@/components/canvas/excalidraw-wrapper';
import dynamic from 'next/dynamic';

const ExcalidrawWrapper = dynamic<ExcalidrawWrapperProps>(
  () => import('@/components/canvas/excalidraw-wrapper'),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-screen w-screen bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          <div className="text-lg text-gray-600">
            正在加载 ViLearning 空间化画布...
          </div>
        </div>
      </div>
    ),
  }
);

interface CanvasPageClientProps {
  flowchartId?: string;
}

export function CanvasPageClient({ flowchartId }: CanvasPageClientProps) {
  return (
    <div className="h-screen w-screen">
      <ExcalidrawWrapper flowchartId={flowchartId} />
    </div>
  );
}
