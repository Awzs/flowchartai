/**
 * DisplayRegistry - 统一管理多Display类型
 * 每个Display类型注册后，可以动态渲染、导出、生成AI内容
 */

export type DisplayType = 'flowchart' | 'mindmap';

export interface DisplayPrompt {
  systemPrompt: string;
  userPromptTemplate: string;
  toolName?: string;
}

export interface DisplaySchema {
  // Display数据的结构定义，用于校验
  validate: (data: any) => boolean;
  toJSON: (data: any) => any;
  fromJSON: (data: any) => any;
}

export interface DisplayExporter {
  toPNG: (data: any) => Promise<Blob>;
  toSVG: (data: any) => Promise<string>;
  toJSON: (data: any) => string;
}

export interface DisplayDefinition {
  type: DisplayType;
  name: string;
  description: string;
  schema: DisplaySchema;
  prompt: DisplayPrompt;
  exporter: DisplayExporter;
  renderer?: React.ComponentType<any>;
  contextExtractor?: (data: any) => any;
  parseAIResponse?: (payload: unknown) => {
    data?: any;
    error?: string;
    metadata?: Record<string, any>;
  };
}

class DisplayRegistry {
  private displays = new Map<DisplayType, DisplayDefinition>();

  register(display: DisplayDefinition): void {
    if (this.displays.has(display.type)) {
      console.warn(
        `Display type "${display.type}" already registered, overwriting...`
      );
    }
    this.displays.set(display.type, display);
    console.log(`✅ Registered display: ${display.type}`);
  }

  get(type: DisplayType): DisplayDefinition | undefined {
    return this.displays.get(type);
  }

  getAll(): DisplayDefinition[] {
    return Array.from(this.displays.values());
  }

  has(type: DisplayType): boolean {
    return this.displays.has(type);
  }

  listTypes(): DisplayType[] {
    return Array.from(this.displays.keys());
  }
}

// 单例实例
export const displayRegistry = new DisplayRegistry();

// 注册时的辅助函数
export function registerDisplay(display: DisplayDefinition) {
  displayRegistry.register(display);
}

// 默认校验函数
export const defaultSchema = {
  validate: (data: any) => {
    return data !== null && data !== undefined;
  },
  toJSON: (data: any) => data,
  fromJSON: (data: any) => data,
};

// 默认导出器
export const defaultExporter = {
  async toPNG(data: any): Promise<Blob> {
    // TODO: 实现PNG导出
    return new Blob([''], { type: 'image/png' });
  },
  async toSVG(data: any): Promise<string> {
    // TODO: 实现SVG导出
    return '';
  },
  toJSON(data: any): string {
    return JSON.stringify(data, null, 2);
  },
};
