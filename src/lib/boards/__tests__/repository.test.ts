import { describe, expect, it } from 'vitest';
import { buildBoardFromFlowchart } from '../transformers';
import type { FlowchartRow } from '../transformers';

describe('boards/repository helpers', () => {
  const baseFlowchart: FlowchartRow = {
    id: 'flowchart_test',
    title: '测试流程图',
    content: '{"type":"excalidraw","elements":[]}',
    thumbnail: null,
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
    userId: 'user_1',
  };

  it('可以将旧流程图记录转换为 BoardDTO 和 DisplayDTO', () => {
    const board = buildBoardFromFlowchart(baseFlowchart);
    expect(board.id).toBe('flowchart_test');
    expect(board.displays).toHaveLength(1);
    expect(board.displays[0].displayType).toBe('flowchart');
    expect(board.displays[0].boardId).toBe('flowchart_test');
  });
});
