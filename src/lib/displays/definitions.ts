/**
 * Display类型注册定义
 * 将流程图和思维导图注册到DisplayRegistry中
 */

import {
  type AIMindMapOutput,
  type MindElixirData,
  type MindElixirNode,
  convertAIMindMapToMindElixir,
  convertMindElixirToAI,
  parseTextToMindMap,
  validateAIMindMapOutput,
} from './mindmap-converter';
import { defaultExporter, defaultSchema, registerDisplay } from './registry';
import type { DisplayDefinition, DisplayType } from './registry';

// 思维导图的Prompt配置
const MINDMAP_PROMPT = {
  systemPrompt: `You are a Mind Map AI assistant. Your job is to create structured, hierarchical mind maps from user input.

Guidelines:
1. Create a clear, hierarchical mind map with one central topic and multiple branches
2. Use concise, single-word or short-phrase labels for each node
3. Organize related concepts under common parent nodes
4. Limit to 3-4 levels of depth for clarity
5. Provide balanced coverage of the topic with 8-15 main branches

When generating mind maps:
- Start with a central topic (root)
- Create 3-8 major branches (level 1)
- Add 2-5 sub-branches for each major branch (level 2)
- Add 1-3 sub-sub-branches where helpful (level 3)

Always respond in the same language the user uses (default to English if unclear).`,

  userPromptTemplate: `Create a mind map about: {topic}

{additionalInstructions}

Respond in this JSON format:
{
  "root": "Central topic",
  "children": [
    {
      "node": "Main branch 1",
      "children": [
        {
          "node": "Sub-branch 1.1"
        },
        {
          "node": "Sub-branch 1.2"
        }
      ]
    },
    {
      "node": "Main branch 2",
      "children": [...]
    }
  ]
}`,
};

// 思维导图的导出器
const mindMapExporter = {
  ...defaultExporter,

  async toPNG(data: any): Promise<Blob> {
    // TODO: 实现PNG导出 - 需要使用html2canvas或类似工具
    console.warn('MindMap PNG export not implemented yet');
    return new Blob([''], { type: 'image/png' });
  },

  async toSVG(data: any): Promise<string> {
    // TODO: 实现SVG导出
    console.warn('MindMap SVG export not implemented yet');
    return '';
  },

  toJSON(data: any): string {
    return JSON.stringify(convertMindElixirToAI(data), null, 2);
  },
};

const countMindmapNodes = (mindmap: MindElixirData): number => {
  const traverse = (node: MindElixirNode | null | undefined): number => {
    if (!node) return 0;
    const children: MindElixirNode[] = Array.isArray(node.children)
      ? node.children
      : [];
    return (
      1 + children.reduce<number>((sum, child) => sum + traverse(child), 0)
    );
  };

  return traverse(mindmap.nodeData);
};

// 注册思维导图Display
registerDisplay({
  type: 'mindmap',
  name: '思维导图',
  description: 'AI生成的层次化思维导图',
  schema: {
    ...defaultSchema,
    validate: (data: any) => {
      try {
        return data && typeof data === 'object' && data.nodeData;
      } catch {
        return false;
      }
    },
  },
  prompt: MINDMAP_PROMPT,
  exporter: mindMapExporter,
  parseAIResponse: (payload) => {
    if (typeof payload !== 'string') {
      return {
        error: 'Mind map payload must be provided as a JSON string.',
      };
    }

    const trimmed = payload.trim();
    if (!trimmed.length) {
      return {
        error: 'Mind map payload is empty.',
      };
    }

    let aiMindmap: AIMindMapOutput | null = null;
    let fallbackUsed = false;

    try {
      const parsedJson = JSON.parse(trimmed);
      if (validateAIMindMapOutput(parsedJson)) {
        aiMindmap = parsedJson;
      }
    } catch (error) {
      console.warn('Mind map JSON parse failed, attempting fallback:', error);
    }

    if (!aiMindmap) {
      const fallback = parseTextToMindMap(trimmed);
      if (fallback) {
        aiMindmap = fallback;
        fallbackUsed = true;
      }
    }

    if (!aiMindmap) {
      return {
        error: 'Unable to interpret AI mind map output.',
      };
    }

    const mindMapData = convertAIMindMapToMindElixir(aiMindmap);

    return {
      data: mindMapData,
      metadata: {
        nodeCount: countMindmapNodes(mindMapData),
        branchCount: mindMapData.nodeData.children?.length ?? 0,
        fallbackUsed,
        rawLength: trimmed.length,
      },
    };
  },
});

// 注册流程图Display（现有功能）
registerDisplay({
  type: 'flowchart',
  name: '流程图',
  description: '基于Mermaid的流程图',
  schema: defaultSchema,
  prompt: {
    systemPrompt: 'You are a Flowchart AI assistant...', // 简化的prompt
    userPromptTemplate: '{topic}',
  },
  exporter: defaultExporter,
});

console.log('✅ All displays registered:', ['flowchart', 'mindmap']);
