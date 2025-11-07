import { describe, expect, it } from 'vitest';
import { ContextEngine } from '../engine';
import type { SelectionContextSnapshot } from '../types';

describe('ContextEngine', () => {
  it('构建上下文时会尊重 token 限制并返回包含的快照', () => {
    const engine = new ContextEngine({ tokenLimit: 10 });
    const snapshots: SelectionContextSnapshot[] = [
      {
        type: 'selection',
        nodes: [
          { id: '1', text: '节点A' },
          { id: '2', text: '节点B' },
        ],
        timestamp: Date.now(),
      },
      {
        type: 'selection',
        nodes: [{ id: '3', text: 'Very long content that will be trimmed' }],
        timestamp: Date.now() - 1000,
      },
    ];

    const { prompt, included } = engine.buildPrompt('测试输入', snapshots);
    expect(prompt).toContain('测试输入');
    expect(included.length).toBeGreaterThan(0);
  });
});
