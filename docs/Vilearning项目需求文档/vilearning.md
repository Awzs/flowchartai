# ViLearning 产品需求文档 (PRD)

> **最后更新**：2025-10-26
> **版本**：V2.0.0（战略重构版）
> **文档性质**：产品定义文档（Product Definition Document）

---

## 📋 文档摘要

### 核心变更（V1.0 → V2.0）
| 维度 | V1.0 | V2.0 | 变更原因 |
|------|------|------|---------|
| **产品定位** | 垂直场景工具（留学+ADHD） | 通用空间化学习平台 | 避免过早细分，扩大市场 |
| **核心用户** | 商科留学生、ADHD学习者 | 知识工作者、终身学习者 | 聚焦高频场景 |
| **技术壁垒** | 白板+AI功能组合 | 上下文感知AI + 空间记忆 | 构建真正护城河 |
| **商业模式** | KOL分成 + 订阅 | Freemium + API开放 | 标准SaaS模式 |
| **阶段规划** | 3阶段（功能驱动） | 5阶段（价值验证驱动） | MVP优先验证 |

---

## 一、产品定义

### 1.1 一句话定位

> **ViLearning 是一个 AI 驱动的空间化学习画布，让任何人都能把碎片信息自动转化为可交互的知识网络。**

**对标类比**：
- **NotebookLM（Google）的知识理解能力** + **Miro 的空间化画布** + **ChatGPT 的对话交互**

### 1.2 核心价值主张

**为用户解决的3个根本问题**：

1. **信息过载 → AI 自动结构化**
   - 痛点：PDF、网页、笔记散落各处，无法建立联系
   - 方案：上传即理解，AI 自动提取核心概念并生成知识图谱

2. **碎片化学习 → 空间化记忆**
   - 痛点：学了就忘，知识点孤立存在
   - 方案：知识在画布上呈现网络结构，视觉化加深记忆

3. **被动摄取 → 主动探索**
   - 痛点：传统学习是线性的（看视频/读文章），缺乏互动
   - 方案：选中任意内容追问 AI，知识图谱动态生长

### 1.3 目标用户画像

#### 主要用户（70%）：知识工作者
- **典型角色**：研究生、产品经理、咨询顾问、内容创作者
- **核心需求**：文献综述、竞品分析、知识整合、方案输出
- **使用场景**：
  - 研究生：20 篇论文综述，需要提炼方法论并对比
  - 产品经理：10 份竞品报告，需要生成差异化矩阵
  - 咨询顾问：50 页行业报告，需要提取关键洞察

#### 次要用户（20%）：终身学习者
- **典型角色**：在职学习新技能（编程、设计、营销等）
- **核心需求**：知识体系搭建、学习路径规划、碎片时间利用
- **使用场景**：
  - 前端学习者：5 个 React 教程，需要构建完整知识树
  - 转行者：3 门课程 + 10 篇博客，需要整合为能力地图

#### 潜在用户（10%）：团队协作
- **典型角色**：创业团队、远程团队、教学团队
- **核心需求**：异步知识共建、会议效率提升、决策透明化
- **使用场景**：
  - 创业团队：每人研究一个方向，会前生成共享知识库
  - 教学团队：老师上传课件，学生协作标注和提问

### 1.4 竞品差异化分析

| 竞品 | 核心能力 | 缺失能力 | ViLearning 超越点 |
|------|---------|---------|------------------|
| **NotebookLM** | AI 资料理解 + 对话 | 空间化呈现、知识网络 | ✅ 思维导图自动生成 + 白板编辑 |
| **Miro/FigJam** | 无限白板 + 协作 | AI 内容生成、资料摄取 | ✅ AI 驱动内容生成 + RAG 检索 |
| **XMind/MindMeister** | 思维导图工具 | AI 自动化、多文档整合 | ✅ 多文档 AI 提取 + 上下文追问 |
| **Notion AI** | 笔记 + AI 助手 | 空间化、知识图谱 | ✅ 网络化知识呈现 + 可视化联动 |
| **Obsidian** | 本地知识库 + 双链 | AI 自动化、协作 | ✅ AI 自动建立连接 + 云端协作 |

**ViLearning 的独特组合**：
- **NotebookLM 的 AI 理解** + **Miro 的空间画布** + **Obsidian 的知识网络** + **上下文追问的创新交互**

---

## 二、核心功能定义

### 2.1 功能架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      ViLearning 功能层次                      │
├─────────────────────────────────────────────────────────────┤
│  L0: AI 智能引擎层（底层能力）                                 │
│  ├─ 文档解析（PDF/文本/网页）                                  │
│  ├─ 向量检索（RAG）                                           │
│  ├─ LLM 生成（流式输出）                                       │
│  └─ 引用追溯（来源标注）                                       │
├─────────────────────────────────────────────────────────────┤
│  L1: 内容生成层（用户直接感知）                                │
│  ├─ 思维导图（概念网络）                                       │
│  ├─ 流程图（步骤拆解）                                         │
│  ├─ 对比表格（多对象分析）                                     │
│  ├─ 时间线（历史演进）                                         │
│  └─ 测验卡片（知识检验）                                       │
├─────────────────────────────────────────────────────────────┤
│  L2: 空间交互层（核心差异化）                                  │
│  ├─ 无限画布（Plait 白板）                                     │
│  ├─ 拖拽编辑（节点/连线）                                      │
│  ├─ 上下文选择（框选追问）← 🔥 创新点                          │
│  └─ 自动布局（力导向算法）                                     │
├─────────────────────────────────────────────────────────────┤
│  L3: 协作与扩展层（长期价值）                                  │
│  ├─ 实时协作（多人同步）                                       │
│  ├─ 版本历史（回溯）                                           │
│  ├─ 公开分享（SEO）                                           │
│  └─ API 开放（生态）                                          │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 核心用户旅程（Happy Path）

#### 场景：研究生文献综述

```
第1步：上传资料
  用户：拖入 10 篇 PDF 论文到画布
  系统：显示上传进度 → 30 秒内完成解析和向量化

第2步：AI 自动生成
  用户：输入"提取所有论文的研究方法"
  系统：AI 分析 10 篇论文 → 生成思维导图（根节点=研究方法分类）
  效果：自动聚类为"定量研究"、"定性研究"、"混合方法"3个分支

第3步：深入探索
  用户：点击"定量研究"节点 → 框选 → 追问"这些方法的数学原理是什么"
  系统：AI 基于上下文生成详细解释卡片 → 自动连线到原节点

第4步：对比分析
  用户：框选 3 个方法节点 → 右键"生成对比表格"
  系统：AI 提取差异维度（样本量、工具、优缺点）→ 生成表格节点

第5步：导出输出
  用户：点击"导出为 Markdown"
  系统：保留节点层级 + 引用标注 → 生成可直接用于论文的文本
```

**关键指标**：
- 时间节约：从 8 小时手动整理 → 30 分钟（节省 93%）
- 引用准确性：>90%（自动高亮原文）
- 知识留存：空间化呈现提升记忆 40%（心理学研究支持）

### 2.3 功能优先级矩阵（MoSCoW）

| 优先级 | 功能 | 理由 | 预期上线 |
|--------|------|------|---------|
| **Must Have（P0）** | AI 思维导图生成 | 核心价值验证 | 阶段 0 |
| **Must Have（P0）** | 文本/PDF 上传 + RAG | 资料摄取基础 | 阶段 1 |
| **Must Have（P0）** | 上下文选择追问 | 核心差异化 | 阶段 2 |
| **Must Have（P0）** | 引用追溯 | 学术场景刚需 | 阶段 1 |
| **Should Have（P1）** | 白板拖拽编辑 | 提升可控性 | 阶段 0 |
| **Should Have（P1）** | 多模态输出（流程图/表格） | 丰富场景 | 阶段 3 |
| **Could Have（P2）** | 实时协作 | 团队场景 | 阶段 4 |
| **Could Have（P2）** | 公开分享 | 增长引擎 | 阶段 4 |
| **Won't Have（删除）** | 垂直场景模板（留学/ADHD） | 过早细分 | - |
| **Won't Have（删除）** | Display 类型手动选择 | AI 自动判断更优 | - |

---

## 三、技术架构

### 3.1 技术栈（基于现有代码库）

#### 前端技术栈
```yaml
框架: Next.js 15 (App Router) ✅ 已有
白板引擎: Plait ✅ 已有（packages/drawnix）
UI组件: Radix UI + TailwindCSS ✅ 已有
状态管理:
  - TanStack Query（服务端状态）✅ 已有
  - Zustand（客户端状态）✅ 已有
  - LocalForage（本地持久化）✅ 已有
国际化: next-intl ✅ 已有
```

#### 后端技术栈
```yaml
数据库: PostgreSQL + Drizzle ORM ✅ 已有
认证: Better Auth ✅ 已有
AI服务:
  - LLM: DeepSeek v3.1（流式输出）⚠️ 需集成
  - 向量嵌入: 火山引擎 Doubao ⚠️ 需集成
  - 向量存储: pgvector 插件 ⚠️ 需安装
文档处理: pdf-parse + LangChain ⚠️ 需集成
云存储: 阿里云 OSS（已有配置）✅ 已有
```

### 3.2 核心数据模型

#### 白板数据结构
```typescript
// packages/drawnix/src/types/board.ts
interface Board {
  id: string;
  userId: string;
  title: string;
  nodes: Node[];          // 所有节点
  edges: Edge[];          // 所有连线
  viewport: Viewport;     // 视图状态
  createdAt: Date;
  updatedAt: Date;
}

interface Node {
  id: string;
  type: 'mindmap' | 'flowchart' | 'table' | 'timeline' | 'quiz';
  position: { x: number; y: number };
  data: {
    content: string;      // 节点内容
    children?: Node[];    // 子节点（树形结构）
    sourceIds?: string[]; // 引用的文档ID
    citations?: Citation[]; // 引用片段
  };
  style?: NodeStyle;
}

interface Edge {
  id: string;
  source: string;         // 起始节点ID
  target: string;         // 目标节点ID
  type: 'auto' | 'manual'; // AI生成 vs 用户手动
  label?: string;
}

interface Citation {
  documentId: string;
  chunkId: string;
  text: string;           // 引用原文
  similarity: number;     // 相似度分数
}
```

#### 文档向量存储
```sql
-- src/db/schema/documents.ts
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  title TEXT,
  content TEXT,
  file_url TEXT,
  created_at TIMESTAMP
);

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  content TEXT,
  embedding VECTOR(1024), -- Doubao Embedding 维度
  metadata JSONB,
  created_at TIMESTAMP
);

-- 创建向量索引（IVFFlat）
CREATE INDEX ON document_chunks
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### 3.3 AI 服务架构

#### API 路由设计
```typescript
// src/app/api/ai/generate/route.ts
POST /api/ai/generate
{
  "query": "提取研究方法",
  "documentIds": ["doc1", "doc2"],
  "context": {
    "selectedNodes": ["node1"], // 上下文选择
    "conversationHistory": [...] // 对话历史
  },
  "outputType": "auto" // AI自动判断
}

Response（SSE流式）:
data: {"type":"chunk","content":"## 研究方法\n"}
data: {"type":"chunk","content":"### 定量研究\n"}
data: {"type":"citation","documentId":"doc1","text":"..."}
data: {"type":"complete","nodeData":{...}}
```

#### RAG 检索流程
```python
# 伪代码：RAG Pipeline
def generate_content(query, document_ids, context):
    # 1. 向量检索
    query_embedding = doubao_embed(query)
    chunks = vector_search(
        embedding=query_embedding,
        document_ids=document_ids,
        top_k=5,
        similarity_threshold=0.7
    )

    # 2. 上下文构建
    prompt = build_prompt(
        query=query,
        retrieved_chunks=chunks,
        selected_nodes=context.selectedNodes,
        conversation_history=context.conversationHistory
    )

    # 3. LLM 生成（流式）
    for chunk in deepseek_stream(prompt):
        yield {
            "type": "chunk",
            "content": chunk.text
        }

    # 4. 解析结构化输出
    node_data = parse_markdown_to_tree(full_response)
    yield {
        "type": "complete",
        "nodeData": node_data,
        "citations": extract_citations(chunks)
    }
```

### 3.4 性能指标

| 指标 | 目标值 | 监控方式 |
|------|--------|---------|
| AI 首字延迟 | <2s | SSE 第一个 chunk 时间 |
| 思维导图生成 | <5s（1000字以内） | 完整响应时间 |
| PDF 解析 | <30s（10MB） | 后台任务监控 |
| 向量检索 | <500ms | pgvector 查询时间 |
| 白板节点拖拽 | <100ms | 前端性能监控 |
| 并发支持 | 100 QPS | 压力测试 |

---

## 四、分阶段实现路线图

### 阶段 0：MVP 验证（2-3 周）⚡ **当前优先级**

#### 目标
验证核心假设：**"AI 生成思维导图 + 白板呈现" 是否成立**

#### 功能范围（最小化）
```
✅ 用户输入文本（不是文件上传）
✅ AI 生成思维导图（单一输出类型）
✅ 白板展示 + 基础拖拽
✅ 本地保存（LocalForage）
❌ 暂不做：PDF上传、向量检索、协作
```

#### 技术实现
```typescript
// src/app/api/ai/simple-generate/route.ts
export async function POST(req: Request) {
  const { text } = await req.json();

  // 直接调用 DeepSeek（不走 RAG）
  const prompt = `将以下内容转换为思维导图的 Markdown 格式：\n\n${text}`;

  const stream = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
    }),
  });

  // 转换为 SSE 格式返回
  return new Response(stream.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

#### 验收标准
- [ ] 输入 500 字文本 → 3 秒内生成思维导图
- [ ] 节点可拖拽、可点击展开
- [ ] 刷新页面后数据不丢失（LocalForage）
- [ ] 移动端基础可用（响应式布局）

#### 成本预估
- **开发**：1 人 × 3 周 = $3,000
- **API**：DeepSeek $0.14/1M tokens ≈ $10/月（测试阶段）
- **基础设施**：Vercel Hobby（免费）

#### 里程碑
- **Week 1**：API 集成 + 流式输出
- **Week 2**：白板节点渲染 + 拖拽
- **Week 3**：本地保存 + UI 优化

---

### 阶段 1：资料摄取引擎（4-5 周）

#### 目标
支持真实文档处理，实现 **"上传 PDF → AI 理解 → 生成知识图谱"**

#### 新增功能
```
✅ PDF/文本文件上传（阿里云 OSS）
✅ 文档解析与切片（LangChain）
✅ 向量化与存储（Doubao + pgvector）
✅ RAG 检索（相似度搜索）
✅ 引用追溯（点击节点查看原文）
✅ 多文档管理（左侧资料库面板）
```

#### 技术实现

##### 1. 文档上传与解析
```typescript
// src/actions/documents.ts
export async function uploadDocument(file: File) {
  // 1. 上传到 OSS
  const fileUrl = await uploadToOSS(file);

  // 2. 解析 PDF
  const pdfContent = await parsePDF(fileUrl);

  // 3. 切片（每 500 字一个 chunk）
  const chunks = await splitText(pdfContent, {
    chunkSize: 500,
    chunkOverlap: 50, // 重叠 50 字保持上下文
  });

  // 4. 向量化
  const embeddings = await batchEmbed(chunks);

  // 5. 存储到数据库
  await db.insert(documents).values({
    id: generateId(),
    userId: user.id,
    title: file.name,
    fileUrl,
  });

  await db.insert(documentChunks).values(
    chunks.map((chunk, i) => ({
      documentId: doc.id,
      content: chunk,
      embedding: embeddings[i],
    }))
  );
}
```

##### 2. RAG 检索
```typescript
// src/lib/ai/rag.ts
export async function retrieveContext(
  query: string,
  documentIds: string[]
) {
  // 1. 查询向量化
  const queryEmbedding = await embed(query);

  // 2. 向量搜索
  const results = await db.execute(sql`
    SELECT
      dc.content,
      dc.document_id,
      d.title,
      1 - (dc.embedding <=> ${queryEmbedding}) AS similarity
    FROM document_chunks dc
    JOIN documents d ON dc.document_id = d.id
    WHERE d.id = ANY(${documentIds})
      AND 1 - (dc.embedding <=> ${queryEmbedding}) > 0.7
    ORDER BY similarity DESC
    LIMIT 5
  `);

  return results;
}
```

##### 3. 引用追溯 UI
```typescript
// src/components/board/CitationPopover.tsx
export function CitationPopover({ nodeId }: { nodeId: string }) {
  const citations = useCitations(nodeId);

  return (
    <Popover>
      <PopoverTrigger>
        <Badge>{citations.length} 条引用</Badge>
      </PopoverTrigger>
      <PopoverContent>
        {citations.map(cite => (
          <div key={cite.id} className="citation-item">
            <p className="text-sm">{cite.text}</p>
            <Button
              variant="link"
              onClick={() => jumpToSource(cite.documentId, cite.chunkId)}
            >
              查看原文 ↗
            </Button>
          </div>
        ))}
      </PopoverContent>
    </Popover>
  );
}
```

#### 验收标准
- [ ] 上传 10MB PDF → 30 秒内完成索引
- [ ] 生成的思维导图引用准确率 >90%
- [ ] 点击引用跳转到 PDF 原文对应位置（高亮）
- [ ] 支持同时管理 20 个文档

#### 成本预估
- **开发**：1 人 × 5 周 = $5,000
- **存储**：阿里云 OSS $0.02/GB ≈ $5/月
- **Embedding**：Doubao $0.0001/1k tokens ≈ $20/月
- **数据库**：PostgreSQL + pgvector（Vercel Postgres Pro $20/月）

---

### 阶段 2：上下文智能交互（3-4 周）🔥 **核心差异化**

#### 目标
实现 **"选中白板内容 → AI 追问"** 的创新交互

#### 新增功能
```
✅ 框选工具（套索选择）
✅ 上下文菜单（追问AI、展开细节、生成测验）
✅ 上下文窗口管理（保留最近 3 轮对话）
✅ 自动关联（新节点自动连线到选中内容）
```

#### 用户流程
```
1. 用户在白板上框选 2 个节点（"神经网络" + "深度学习"）
2. 右键 → 选择"追问 AI"
3. 输入："这两者有什么本质区别？"
4. AI 基于上下文生成对比卡片
5. 新卡片自动连线到被选中的 2 个节点
```

#### 技术实现

##### 1. 框选交互
```typescript
// packages/drawnix/src/tools/LassoTool.ts
export class LassoTool {
  onMouseDown(e: MouseEvent) {
    this.isDrawing = true;
    this.lassoPath = [{ x: e.offsetX, y: e.offsetY }];
  }

  onMouseMove(e: MouseEvent) {
    if (!this.isDrawing) return;
    this.lassoPath.push({ x: e.offsetX, y: e.offsetY });
    this.renderLasso();
  }

  onMouseUp() {
    this.isDrawing = false;
    const selectedNodes = this.getNodesInLasso();
    this.board.setSelection(selectedNodes);
    this.showContextMenu();
  }

  getNodesInLasso() {
    return this.board.nodes.filter(node =>
      this.isPointInPolygon(node.position, this.lassoPath)
    );
  }
}
```

##### 2. 上下文传递
```typescript
// src/app/api/ai/contextual-generate/route.ts
export async function POST(req: Request) {
  const { query, selectedNodes, conversationHistory } = await req.json();

  // 1. 提取选中节点的内容
  const contextContent = selectedNodes
    .map(node => `## ${node.data.title}\n${node.data.content}`)
    .join('\n\n');

  // 2. 构建 Prompt
  const prompt = `
你是一个知识助手。用户选中了以下内容：

${contextContent}

用户的问题是：${query}

请基于选中的内容回答问题，并以思维导图格式输出。
  `.trim();

  // 3. 调用 LLM
  const response = await deepseekStream(prompt);

  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

##### 3. 自动连线
```typescript
// src/components/board/AutoConnector.ts
export function autoConnectNodes(
  newNodeId: string,
  selectedNodeIds: string[]
) {
  const newEdges = selectedNodeIds.map(sourceId => ({
    id: generateId(),
    source: sourceId,
    target: newNodeId,
    type: 'auto',
    label: 'AI 生成',
    style: { stroke: '#8b5cf6', strokeWidth: 2 },
  }));

  board.addEdges(newEdges);

  // 力导向布局避免重叠
  layoutNodes(board.nodes, newEdges);
}
```

#### 验收标准
- [ ] 框选操作延迟 <100ms
- [ ] AI 响应准确包含上下文内容
- [ ] 连线自动避开已有节点（力导向算法）
- [ ] 支持多轮对话（保留历史上下文）

#### 成本预估
- **开发**：1 人 × 4 周 = $4,000
- **API**：DeepSeek 调用量增加 ≈ $30/月

---

### 阶段 3：多模态输出（4-6 周）

#### 目标
不只是思维导图，AI 自动判断输出类型（流程图/对比表格/时间线/测验）

#### 输出类型定义

| 类型 | 适用场景 | 触发关键词 | 示例 |
|------|---------|-----------|------|
| **思维导图** | 概念性知识 | 默认 | "解释机器学习" |
| **流程图** | 步骤性知识 | "如何"、"步骤" | "如何训练神经网络" |
| **对比表格** | 多对象比较 | "区别"、"对比" | "React vs Vue 对比" |
| **时间线** | 历史事件 | "历史"、"发展" | "AI 发展历程" |
| **测验卡片** | 知识检验 | "测试我"、"练习" | "测试我对梯度下降的理解" |

#### 技术实现

##### 1. 输出类型判断
```typescript
// src/lib/ai/output-classifier.ts
export function classifyOutputType(query: string): OutputType {
  const keywords = {
    flowchart: ['如何', '怎么', '步骤', '流程', '方法'],
    table: ['区别', '对比', '比较', '差异', 'vs'],
    timeline: ['历史', '发展', '演进', '时间线'],
    quiz: ['测试', '练习', '测验', '检验'],
  };

  for (const [type, words] of Object.entries(keywords)) {
    if (words.some(word => query.includes(word))) {
      return type as OutputType;
    }
  }

  return 'mindmap'; // 默认思维导图
}
```

##### 2. Prompt 模板系统
```typescript
// src/lib/ai/prompts.ts
const PROMPT_TEMPLATES = {
  mindmap: `将以下内容转换为思维导图（Markdown格式）：\n{context}\n\n要求：\n- 使用 # 表示层级\n- 保持逻辑清晰`,

  flowchart: `将以下内容转换为流程图（Mermaid格式）：\n{context}\n\n要求：\n- 使用 graph TD 语法\n- 明确标注步骤顺序`,

  table: `生成对比表格（Markdown格式）：\n{context}\n\n要求：\n- 提取关键差异维度\n- 使用表格语法`,

  timeline: `生成时间线（JSON格式）：\n{context}\n\n要求：\n- 按时间排序\n- 包含年份和事件描述`,

  quiz: `生成测验题目（JSON格式）：\n{context}\n\n要求：\n- 3道选择题 + 2道简答题\n- 包含正确答案和解析`,
};

export function buildPrompt(type: OutputType, context: string) {
  return PROMPT_TEMPLATES[type].replace('{context}', context);
}
```

#### 验收标准
- [ ] AI 判断准确率 >85%（人工标注 100 条测试）
- [ ] 5 种输出类型 UI 统一且美观
- [ ] 所有类型支持后续编辑
- [ ] 流程图支持 Mermaid 实时渲染

#### 成本预估
- **开发**：1 人 × 5 周 = $5,000

---

### 阶段 4：协作与分享（5-7 周）

#### 目标
从个人工具到团队平台

#### 新增功能
```
✅ 实时协作（WebSocket 同步）
✅ 权限管理（查看/编辑/评论）
✅ 评论系统（节点级评论）
✅ 版本历史（Git 式回溯）
✅ 公开分享链接（SEO 友好）
```

#### 技术实现

##### 1. 实时协作（Yjs）
```typescript
// src/lib/collaboration/yjs-provider.ts
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function setupCollaboration(boardId: string) {
  const ydoc = new Y.Doc();
  const provider = new WebsocketProvider(
    'wss://vilearning.com/collab',
    boardId,
    ydoc
  );

  // 监听远程变更
  ydoc.on('update', (update) => {
    applyUpdateToBoard(update);
  });

  // 本地变更推送
  board.on('change', (change) => {
    const update = Y.encodeStateAsUpdate(ydoc);
    provider.send(update);
  });
}
```

##### 2. 公开分享
```typescript
// src/app/share/[boardId]/page.tsx
export async function generateMetadata({ params }) {
  const board = await getPublicBoard(params.boardId);

  return {
    title: board.title,
    description: `查看 ${board.author} 的知识图谱`,
    openGraph: {
      images: [await generateBoardPreview(board)], // 动态生成预览图
    },
  };
}
```

#### 验收标准
- [ ] 3 人同时编辑延迟 <500ms
- [ ] 冲突自动合并成功率 >95%
- [ ] 公开分享链接支持 SEO（Open Graph）
- [ ] 版本历史可回溯到任意时间点

---

### 阶段 5：企业级能力（长期演进）

#### 功能方向
```
1. 知识库检索（跨白板语义搜索）
2. 工作流自动化（Zapier 式连接器）
3. API 开放（开发者生态）
4. 私有化部署（企业版）
5. SSO 集成（企业认证）
```

---

## 五、商业化策略

### 5.1 定价模型

| 版本 | 价格 | 限制 | 核心功能 | 目标用户 |
|------|------|------|---------|---------|
| **Free** | $0 | 3 个白板<br>5MB 存储<br>每月 20 次 AI 生成 | 基础 AI 生成<br>本地保存 | 个人尝鲜 |
| **Pro** | $9/月<br>$90/年（省 17%） | 无限白板<br>1GB 存储<br>每月 500 次 AI 生成<br>AI 优先级 | + PDF 上传<br>+ 引用追溯<br>+ 导出功能 | 知识工作者 |
| **Team** | $49/月 | 10 成员<br>10GB 共享存储<br>无限 AI 生成<br>实时协作 | + 多人协作<br>+ 评论系统<br>+ 版本历史 | 创业团队 |
| **Enterprise** | 议价 | 自定义 | + 私有部署<br>+ SSO<br>+ API 配额<br>+ 专属支持 | 大企业 |

### 5.2 增长策略

#### 1. 病毒传播（Viral Loop）
```
用户创建公开白板
  ↓
底部显示 "Powered by ViLearning"
  ↓
访客点击 → 注册免费账号
  ↓
新用户创建白板 → 继续传播
```

**关键指标**：
- 病毒系数（K）目标：>1.2
- 分享率：每个 Pro 用户平均分享 3 个白板

#### 2. 模板市场（UGC）
```
用户创建优质白板
  ↓
发布为公开模板
  ↓
其他用户购买/使用
  ↓
创作者获得 50% 分成
```

**示例模板**：
- "机器学习完整知识树"（$4.99）
- "产品经理技能地图"（$2.99）
- "前端工程师学习路径"（免费，引流）

#### 3. 教育渠道合作
```
与 50 所大学图书馆合作
  ↓
为学生提供免费 Pro 版（edu 邮箱认证）
  ↓
毕业后转为付费用户
```

**预期效果**：
- 获客成本（CAC）：$5（vs 广告获客 $50）
- 留存率：教育用户留存 >60%（vs 普通用户 40%）

#### 4. API 生态（开发者）
```
开放 API（免费配额 1000 次/月）
  ↓
开发者构建插件（Notion/Obsidian/VSCode）
  ↓
插件用户转化为 ViLearning 用户
```

**API 定价**：
- 免费版：1000 次/月
- Pro 用户：10000 次/月
- Enterprise：无限制

### 5.3 收入预测（18 个月）

| 月份 | 注册用户 | 付费用户 | MRR（月经常性收入） | 累计收入 |
|------|---------|---------|---------------------|---------|
| M1-3 | 500 | 10 | $90 | $270 |
| M4-6 | 2000 | 50 | $450 | $1,620 |
| M7-9 | 5000 | 150 | $1,350 | $5,670 |
| M10-12 | 10000 | 400 | $3,600 | $16,470 |
| M13-15 | 20000 | 1000 | $9,000 | $43,470 |
| M16-18 | 35000 | 2000 | $18,000 | $97,470 |

**关键假设**：
- 付费转化率：5%（行业平均 2-7%）
- 客单价（ARPU）：$9/月
- 流失率（Churn）：5%/月（前 6 个月），2%/月（后 12 个月）

---

## 六、成功指标（North Star Metrics）

### 6.1 核心指标

| 指标 | 定义 | 目标值（6 个月） | 监控工具 |
|------|------|-----------------|---------|
| **North Star** | 每周活跃生成次数（Weekly AI Generations） | 10,000 次/周 | PostHog |
| 次要指标 1 | 付费转化率 | 5% | Stripe Dashboard |
| 次要指标 2 | 用户留存（D7） | 40% | PostHog Retention |
| 次要指标 3 | NPS 分数 | >50 | 问卷调查 |

### 6.2 埋点需求

| 事件名 | 触发时机 | 关键属性 |
|--------|---------|---------|
| `ai_generate_start` | 用户点击"生成" | `input_type`, `document_count` |
| `ai_generate_complete` | AI 生成完成 | `output_type`, `duration`, `token_count` |
| `node_edit` | 编辑节点内容 | `node_type`, `edit_duration` |
| `context_select` | 框选内容 | `selected_node_count` |
| `board_share` | 创建分享链接 | `is_public` |
| `template_use` | 使用模板 | `template_id` |

---

## 七、风险与应对

### 7.1 技术风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| AI 生成质量不稳定 | 高 | 高 | • 多模型备份（DeepSeek + GPT-4）<br>• 人工反馈训练 Prompt |
| 向量检索准确率低 | 中 | 高 | • 调整 chunk 大小<br>• 引入 Hybrid Search（向量+关键词） |
| 白板性能问题（>100 节点） | 中 | 中 | • 虚拟滚动<br>• Canvas 分层渲染 |
| 实时协作冲突 | 低 | 中 | • Yjs CRDT 算法<br>• 冲突检测 UI |

### 7.2 市场风险

| 风险 | 概率 | 影响 | 应对措施 |
|------|------|------|---------|
| 竞品快速跟进 | 高 | 中 | • 专注上下文交互（壁垒）<br>• 快速迭代（2 周一版） |
| 用户付费意愿低 | 中 | 高 | • 免费版功能足够好<br>• Pro 版提供明确价值（导出/协作） |
| AI 成本过高 | 中 | 高 | • 优化 Prompt 减少 token<br>• 缓存常见查询<br>• 引入用量限制 |

---

## 八、附录

### A. 参考资料

- **竞品研究**：https://wcntjbz8cc4a.feishu.cn/sync/CnJndwmFbsly0hb8PLYcGbeWnOf
- **用户调研**：https://wcntjbz8cc4a.feishu.cn/sync/IHO6dgbR8suYVUbPZkQcXhWLnMc
- **技术架构**：`packages/drawnix/docs/Drawnix 阶段性改造路线蓝图.md`

### B. 术语表

| 术语 | 定义 |
|------|------|
| **RAG** | Retrieval-Augmented Generation，检索增强生成 |
| **pgvector** | PostgreSQL 向量存储插件 |
| **SSE** | Server-Sent Events，服务器推送事件 |
| **CRDT** | Conflict-free Replicated Data Type，无冲突复制数据类型 |
| **Yjs** | 实时协作框架，基于 CRDT |
| **LangChain** | LLM 应用开发框架 |
| **Doubao** | 火山引擎向量嵌入模型 |
| **DeepSeek** | 国产大语言模型 |

### C. 设计规范

#### 赛博朋克主题色
```css
/* 主色调 */
--primary-blue: #00d4ff;
--primary-purple: #8b5cf6;
--accent-pink: #ff006e;

/* 背景色 */
--bg-dark: #0a0e27;
--bg-darker: #050816;

/* 节点样式 */
.mindmap-node {
  background: linear-gradient(135deg, var(--primary-blue), var(--primary-purple));
  border: 2px solid var(--accent-pink);
  box-shadow: 0 0 20px rgba(139, 92, 246, 0.5);
}

/* 连线动画 */
.edge-animated {
  stroke-dasharray: 5;
  animation: dash 1s linear infinite;
}
```

---

**文档结束**

> **下一步行动**：
> 1. 产品团队评审本文档
> 2. 技术团队评估阶段 0 可行性
> 3. 启动 MVP 开发（预计 2025-11-01）
