import { createAIClient } from '@/lib/ai-clients';
import {
  buildUnlimitedUsageResult,
  canUserUseAI,
  getAIUsageBypassInfo,
} from '@/lib/ai-usage';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';

// 思维导图生成工具定义
const mindmapTool = {
  type: 'function' as const,
  function: {
    name: 'generate_mindmap',
    description: 'Generate a structured mind map from text',
    parameters: {
      type: 'object',
      properties: {
        mindmap_data: {
          type: 'string',
          description:
            'JSON string containing the mind map structure with root and children',
        },
        mode: {
          type: 'string',
          enum: ['replace', 'extend'],
          description:
            'Whether to replace existing mind map or extend/modify it',
        },
        description: {
          type: 'string',
          description: 'Brief description of the mind map',
        },
      },
      required: ['mindmap_data', 'mode', 'description'],
    },
  },
};

function generateSystemPrompt() {
  return `You are a Mind Map AI assistant. Your job is to create structured, hierarchical mind maps from user input.

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

Always respond in the same language the user uses (default to English if unclear).

IMPORTANT: When you need to generate a mind map, call the generate_mindmap tool with a JSON string in this format:
{
  "root": "Central Topic",
  "children": [
    {
      "node": "Main Branch 1",
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
      "node": "Main Branch 2"
    }
  ]
}

Always wrap the JSON in the mindmap_data parameter. Do not include any other text in the mindmap_data field - only the JSON string.

AVAILABLE TOOL:
- **generate_mindmap** - Generate a structured mind map from text input`;
}

export async function POST(req: Request) {
  let userId: string | null = null;

  try {
    // 1. 身份验证
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (session?.user?.id) {
      userId = session.user.id;
    } else {
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          message: 'Please sign in to use AI-powered mind map generation.',
          isGuest: true,
          redirectTo: '/auth/login',
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. 检查AI使用量限制
    const bypassInfo = await getAIUsageBypassInfo(userId!);
    let usageCheck = buildUnlimitedUsageResult(bypassInfo.reason);

    if (!bypassInfo.bypassed) {
      usageCheck = await canUserUseAI(userId!);

      if (!usageCheck.canUse) {
        return new Response(
          JSON.stringify({
            error: 'Usage limit exceeded',
            message:
              usageCheck.reason ||
              `You have reached your AI usage limit. ${usageCheck.remainingUsage} of ${usageCheck.limit} requests remaining.`,
            usageInfo: usageCheck,
          }),
          {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
    }

    // 3. 验证请求数据
    const body = await req.json();
    const { messages, model: requestedModelKey } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: 'Invalid messages format' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. 创建AI客户端
    const normalizedModelKey =
      typeof requestedModelKey === 'string' && requestedModelKey.trim().length
        ? requestedModelKey.trim()
        : undefined;

    let openai: ReturnType<typeof createAIClient>['client'];
    let resolvedModelId: string;
    let activeModelConfig:
      | ReturnType<typeof createAIClient>['config']
      | undefined;

    try {
      const clientResult = createAIClient(normalizedModelKey);
      openai = clientResult.client;
      resolvedModelId = clientResult.modelId;
      activeModelConfig = clientResult.config;
    } catch (createClientError: any) {
      console.error('Failed to prepare AI client:', createClientError);
      return new Response(
        JSON.stringify({
          error: 'AI configuration error',
          message:
            createClientError?.message ||
            'Unable to initialise AI provider configuration.',
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const systemMessage = {
      role: 'system' as const,
      content: generateSystemPrompt(),
    };

    const fullMessages = [systemMessage, ...messages];

    console.log(
      `🚀 Starting AI conversation with ${fullMessages.length} messages (User) using model ${activeModelConfig?.key ?? resolvedModelId}`
    );

    const completion = await openai.chat.completions.create({
      model: resolvedModelId,
      messages: fullMessages,
      tools: [mindmapTool],
      tool_choice: 'auto',
      temperature: 0.7,
      stream: true,
    });

    console.log(
      `✅ AI provider call successful (${activeModelConfig?.provider}), starting stream`
    );

    // 5. 创建流式响应
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const toolCalls: any[] = [];
          let accumulatedContent = '';

          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta;

            if (delta?.content) {
              accumulatedContent += delta.content;
              const data = JSON.stringify({
                type: 'text',
                content: delta.content,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }

            if (delta?.tool_calls) {
              for (const toolCall of delta.tool_calls) {
                if (!toolCalls[toolCall.index]) {
                  toolCalls[toolCall.index] = {
                    id: toolCall.id,
                    type: toolCall.type,
                    function: { name: '', arguments: '' },
                  };
                }

                if (toolCall.function?.name) {
                  toolCalls[toolCall.index].function.name =
                    toolCall.function.name;
                }

                if (toolCall.function?.arguments) {
                  toolCalls[toolCall.index].function.arguments +=
                    toolCall.function.arguments;
                }
              }
            }

            if (chunk.choices[0]?.finish_reason === 'tool_calls') {
              // 处理工具调用
              for (const toolCall of toolCalls) {
                if (toolCall.function.name === 'generate_mindmap') {
                  try {
                    const args = JSON.parse(toolCall.function.arguments);
                    const data = JSON.stringify({
                      type: 'tool-call',
                      toolCallId: toolCall.id,
                      toolName: 'generate_mindmap',
                      args: args,
                    });
                    controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                  } catch (error) {
                    console.error('Error parsing mindmap args:', error);
                  }
                }
              }

              const finishData = JSON.stringify({
                type: 'finish',
                content:
                  accumulatedContent || 'Mind map generated successfully.',
                toolCallsCompleted: true,
              });
              controller.enqueue(encoder.encode(`data: ${finishData}\n\n`));
            } else if (chunk.choices[0]?.finish_reason === 'stop') {
              const finishData = JSON.stringify({
                type: 'finish',
                content: accumulatedContent || 'Conversation completed.',
              });
              controller.enqueue(encoder.encode(`data: ${finishData}\n\n`));
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'));
        } catch (error: any) {
          console.error('MindMap API Error:', error);

          const errorData = JSON.stringify({
            type: 'error',
            error:
              error.message ||
              'An error occurred while processing your request.',
          });
          controller.enqueue(encoder.encode(`data: ${errorData}\n\n`));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('MindMap API Error:', error);

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        message: error.message || 'An unexpected error occurred.',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
