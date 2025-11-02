export type AiAssistantMode =
  | 'text_to_flowchart'
  | 'image_to_flowchart'
  | 'text_to_mindmap';

export const AI_ASSISTANT_MODES: Record<
  AiAssistantMode,
  { label: string; description: string }
> = {
  text_to_flowchart: {
    label: 'Text to Flowchart',
    description: 'Generate flowcharts from text',
  },
  image_to_flowchart: {
    label: 'Image to Flowchart',
    description: 'Generate flowcharts from images',
  },
  text_to_mindmap: {
    label: 'Text to Mindmap',
    description: 'Generate mind maps from text',
  },
};

export const DEFAULT_AI_ASSISTANT_MODE: AiAssistantMode = 'text_to_flowchart';
