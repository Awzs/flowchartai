import { CanvasPageClient } from '@/components/canvas/canvas-page-client';

interface EditFlowchartPageProps {
  params: Promise<{
    id: string;
    locale: string;
  }>;
}

export default async function EditFlowchartPage({
  params,
}: EditFlowchartPageProps) {
  const { id } = await params;

  return <CanvasPageClient flowchartId={id} />;
}

export async function generateMetadata({ params }: EditFlowchartPageProps) {
  const { id } = await params;

  return {
    title: '编辑空间画布 - ViLearning',
    description: '在 ViLearning 中继续编辑你的空间化学习画布',
    robots: {
      index: false,
      follow: false,
    },
  };
}
