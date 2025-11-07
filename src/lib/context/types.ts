export type ContextSnapshotType = 'selection' | 'project' | 'conversation';

export interface SelectionNode {
  id: string;
  text?: string | null;
  type?: string | null;
  position?: { x: number; y: number };
}

export interface SelectionContextSnapshot {
  type: 'selection';
  nodes: SelectionNode[];
  timestamp: number;
}

export interface ProjectContextSnapshot {
  type: 'project';
  title: string;
  summary?: string;
  tags?: string[];
}

export interface ConversationContextSnapshot {
  type: 'conversation';
  messages: { role: string; content: string }[];
}

export type ContextSnapshot =
  | SelectionContextSnapshot
  | ProjectContextSnapshot
  | ConversationContextSnapshot;
