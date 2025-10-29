import OpenAI from 'openai';

/**
 * AI 模型配置描述，用于统一管理可用模型及其调用参数。
 */
type ModelConfig = {
  /** 用于在配置映射中定位模型的键值 */
  key: string;
  /** 友好名称，便于后台展示 */
  label: string;
  /** 服务提供方，后续可扩展不同的调用方式 */
  provider: 'volcengine-ark' | 'openrouter';
  /** 远端真实的模型 ID */
  modelId: string;
  /** API 请求地址 */
  baseURL: string;
  /** 对应的 API Key，按需从环境变量读取 */
  apiKey?: string;
  /** 额外的请求头配置，可选 */
  extraHeaders?: Record<string, string>;
  /** 是否支持图像输入等扩展能力，后续可用于前端过滤 */
  capabilities?: {
    image?: boolean;
    toolCall?: boolean;
  };
};

/**
 * 支持的模型注册表。若未来需要扩展更多模型，只需在此对象中新增配置。
 */
const MODEL_REGISTRY: Record<string, Omit<ModelConfig, 'key'>> = {
  'deepseek-v3-1': {
    label: 'DeepSeek V3.1（火山引擎）',
    provider: 'volcengine-ark',
    modelId:
      process.env.ARK_DEEPSEEK_MODEL_ID?.trim() || 'deepseek-v3-1-250821',
    baseURL:
      process.env.ARK_API_BASE_URL?.trim() ||
      'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: process.env.ARK_API_KEY,
    capabilities: {
      image: false,
      toolCall: true,
    },
  },
  // 如需保留 OpenRouter 备选模型，可在部署环境配置 OPENROUTER_API_KEY。
  'openrouter/gemini-2.5-flash': {
    label: 'Gemini 2.5 Flash（OpenRouter）',
    provider: 'openrouter',
    modelId: 'google/gemini-2.5-flash',
    baseURL:
      process.env.OPENROUTER_BASE_URL?.trim() || 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENROUTER_API_KEY,
    extraHeaders: {
      'HTTP-Referer':
        process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
      'X-Title': 'FlowChart AI',
    },
    capabilities: {
      image: true,
      toolCall: true,
    },
  },
};

const DEFAULT_MODEL_KEY =
  process.env.AI_DEFAULT_MODEL_KEY?.trim() || 'deepseek-v3-1';

function isConfigUsable(
  config: Omit<ModelConfig, 'key'> | undefined
): config is Omit<ModelConfig, 'key'> {
  return Boolean(config?.apiKey?.trim());
}

/**
 * 根据请求的模型键值解析最终的模型配置。
 * 若请求未提供或不可用，自动回退到默认模型。
 */
function resolveModelConfig(requestedKey?: string): ModelConfig {
  const sanitizedKey = requestedKey?.trim();

  if (sanitizedKey && isConfigUsable(MODEL_REGISTRY[sanitizedKey])) {
    return { key: sanitizedKey, ...MODEL_REGISTRY[sanitizedKey] };
  }

  if (isConfigUsable(MODEL_REGISTRY[DEFAULT_MODEL_KEY])) {
    return { key: DEFAULT_MODEL_KEY, ...MODEL_REGISTRY[DEFAULT_MODEL_KEY] };
  }

  const fallbackEntry = Object.entries(MODEL_REGISTRY).find(([, config]) =>
    isConfigUsable(config)
  );

  if (fallbackEntry) {
    const [key, config] = fallbackEntry;
    return { key, ...config };
  }

  throw new Error('未找到可用的 AI 模型配置，请检查 API Key 设置。');
}

/**
 * 创建 OpenAI 兼容的客户端，同时返回最终使用的模型信息。
 */
export function createAIClient(requestedKey?: string) {
  const config = resolveModelConfig(requestedKey);

  if (!config.apiKey) {
    throw new Error('AI 模型缺少 API Key 配置');
  }

  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    defaultHeaders: config.extraHeaders,
  });

  return {
    client,
    modelId: config.modelId,
    config,
  };
}

/**
 * 返回当前环境下可用的模型列表，可用于后台展示或前端切换。
 */
export function listAvailableModels(): Array<
  Pick<ModelConfig, 'key' | 'label' | 'provider' | 'capabilities'>
> {
  return Object.entries(MODEL_REGISTRY)
    .filter(([, config]) => isConfigUsable(config))
    .map(([key, config]) => ({
      key,
      label: config.label,
      provider: config.provider,
      capabilities: config.capabilities,
    }));
}
