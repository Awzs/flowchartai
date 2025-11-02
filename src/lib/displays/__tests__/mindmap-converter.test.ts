import { describe, expect, it } from 'vitest';
import {
  type AIMindMapOutput,
  convertAIMindMapToMindElixir,
  convertMindElixirToAI,
  parseTextToMindMap,
  validateAIMindMapOutput,
} from '../mindmap-converter';

const sampleMindmap: AIMindMapOutput = {
  root: '学习计划',
  children: [
    {
      node: '前端',
      children: [{ node: 'React' }, { node: 'TypeScript' }],
    },
    {
      node: '后端',
      children: [{ node: 'Node.js' }],
    },
  ],
};

describe('mindmap-converter', () => {
  it('converts AI output to MindElixir data and back', () => {
    const mindElixirData = convertAIMindMapToMindElixir(sampleMindmap);
    expect(mindElixirData.nodeData.topic).toBe('学习计划');
    expect(mindElixirData.nodeData.children?.length).toBe(2);

    const backToAI = convertMindElixirToAI(mindElixirData);
    expect(backToAI.root).toBe(sampleMindmap.root);
    expect(backToAI.children?.length).toBe(2);
    expect(backToAI.children?.[0]?.children?.[1]?.node).toBe('TypeScript');
  });

  it('validates correct AIMindMapOutput structures', () => {
    expect(validateAIMindMapOutput(sampleMindmap)).toBe(true);
    expect(
      validateAIMindMapOutput({
        root: 'Invalid',
        children: [{ node: 123 }],
      })
    ).toBe(false);
  });

  it('parses simple text into fallback mindmap', () => {
    const parsed = parseTextToMindMap(`
      学习计划
      前端
      后端
    `);

    expect(parsed).not.toBeNull();
    expect(parsed?.root).toBe('学习计划');
    expect(parsed?.children?.[1]?.node).toBe('后端');
  });
});
