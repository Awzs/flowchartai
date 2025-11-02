/**
 * 思维导图转换工具
 * 负责AI输出与mind-elixir格式之间的转换
 */

// AI输出的思维导图数据格式
export interface AIMindMapOutput {
  root: string;
  children: Array<{
    node: string;
    children?: Array<{ node: string; children?: any[] }>;
  }>;
}

// mind-elixir的数据格式
export interface MindElixirNode {
  id: string;
  topic: string;
  children?: MindElixirNode[];
}

export interface MindElixirData {
  nodeData: MindElixirNode;
  linkData?: Record<string, unknown>;
}

const generateNodeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `mm-${Math.random().toString(36).slice(2, 11)}`;
};

// 将AI输出转换为mind-elixir格式
export function convertAIMindMapToMindElixir(
  aiOutput: AIMindMapOutput
): MindElixirData {
  const convertChildren = (children: any[]): MindElixirNode[] => {
    return children.map((child) => ({
      id: generateNodeId(),
      topic: child.node,
      children: child.children ? convertChildren(child.children) : [],
    }));
  };

  return {
    nodeData: {
      id: generateNodeId(),
      topic: aiOutput.root,
      children: convertChildren(aiOutput.children),
    },
    linkData: {},
  };
}

// 从mind-elixir格式转换为AI可理解的格式
export function convertMindElixirToAI(data: MindElixirData): AIMindMapOutput {
  const convertTopicToNode = (topicNode: MindElixirNode): any => {
    const converted: any = {
      node: topicNode.topic,
    };

    if (topicNode.children && topicNode.children.length > 0) {
      converted.children = topicNode.children.map(convertTopicToNode);
    }

    return converted;
  };

  return {
    root: data.nodeData.topic,
    children: data.nodeData.children
      ? data.nodeData.children.map(convertTopicToNode)
      : [],
  };
}

// 验证AI输出是否有效
export function validateAIMindMapOutput(
  output: any
): output is AIMindMapOutput {
  if (!output || typeof output !== 'object') {
    return false;
  }

  if (typeof output.root !== 'string') {
    return false;
  }

  if (!Array.isArray(output.children)) {
    return false;
  }

  // 验证每个子节点
  for (const child of output.children) {
    if (typeof child.node !== 'string') {
      return false;
    }

    if (child.children && !Array.isArray(child.children)) {
      return false;
    }
  }

  return true;
}

// 从文本中提取思维导图结构（简单解析）
export function parseTextToMindMap(text: string): AIMindMapOutput | null {
  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length === 0) {
    return null;
  }

  const root = lines[0].replace(/^[#\-\*\d\.\s]+/, '').trim();
  const children: AIMindMapOutput['children'] = [];

  lines.slice(1).forEach((line, index) => {
    const cleaned = line.replace(/^[#\-\*\d\.\s]+/, '').trim();
    if (cleaned) {
      children.push({
        node: cleaned,
      });
    }
  });

  return {
    root,
    children,
  };
}
