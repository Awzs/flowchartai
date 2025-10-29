

#### 调用AI能力相关代码参考
===
> **统一接入约定**：Drawnix 在 MkSaaS 工作区内调用 DeepSeek/火山模型时，必须通过 Next.js 路由 `src/app/api/analyze-content/route.ts` 转发，禁止在客户端或 Nx 应用中直接携带 API Key。以下示例用于后台服务实现，落地时请由该路由封装。

```node.js
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env['ARK_API_KEY'],
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

async function main() {
  // Non-streaming:
  console.log('----- standard request -----')
  const completion = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: '你是人工智能助手' },
      { role: 'user', content: '你好' },
    ],
    model: '{TEMPLATE_ENDPOINT_ID}',
  });
  console.log(completion.choices[0]?.message?.content);

  // Streaming:
  console.log('----- streaming request -----')
  const stream = await openai.chat.completions.create({
    messages: [
      { role: 'system', content: '你是人工智能助手' },
      { role: 'user', content: '你好' },
    ],
    model: '{TEMPLATE_ENDPOINT_ID}',
    stream: true,
  });
  for await (const part of stream) {
    process.stdout.write(part.choices[0]?.delta?.content || '');
  }
  process.stdout.write('\n');
}

main();
```


```curl示例
curl https://ark.cn-beijing.volces.com/api/v3/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer d29e1ca0-fae3-4464-8f60-920da1fc1eee" \
  -d '{
    "model": "deepseek-v3-1-terminus",
    "messages": [
      {"role": "system","content": "你是人工智能助手."},
      {"role": "user","content": "你好"}
    ]
  }'
```
===

### 思考开关使用说明
===
import os
# 升级方舟 SDK 到最新版本 pip install -U 'volcengine-python-sdk[ark]'
from volcenginesdkarkruntime import Ark

client = Ark(
    # 从环境变量中读取您的方舟API Key
    api_key=os.environ.get("ARK_API_KEY"), 
    # 深度思考模型耗费时间会较长，请您设置较大的超时时间，避免超时，推荐30分钟以上
    timeout=1800,
    )
response = client.chat.completions.create(
    # 替换 <Model> 为您的Model ID
    model="deepseek-v3-1-250821",
    messages=[
        {"role": "user", "content": "我要研究深度思考模型与非深度思考模型区别的课题，体现出我的专业性"}
    ],
     thinking={
         "type": "disabled" # 默认行为，不使用深度思考能力,
         # "type": "enabled" # 使用深度思考能力
     },
)

print(response)
===

### MkSaaS 路由转发示例
===
```bash
curl -X POST https://{your-domain}/api/analyze-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <session token>" \
  -d '{
    "model": "deepseek-v3-1-terminus",
    "messages": [
      {"role": "system","content": "你是人工智能助手."},
      {"role": "user","content": "你好"}
    ],
    "provider": "volcano"
  }'
```
> `route.ts` 内部根据 `provider/model` 选择 DeepSeek/火山引擎，封装密钥、重试与配额策略。Drawnix 仅需按业务字段调用该路由，遵循 MkSaaS 统一鉴权与审计。
===
