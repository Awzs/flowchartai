#!/usr/bin/env ts-node
/**
 * boards/displays/contexts 数据结构迁移脚本雏形
 * 默认以 dry-run 方式输出 SQL，后续可根据需要补充真实执行逻辑。
 *
 * 用法：
 *   pnpm tsx scripts/migrations/draft-boards-displays.ts --dry-run   # 默认
 *   pnpm tsx scripts/migrations/draft-boards-displays.ts --execute   # 预留
 */

type Mode = 'dry-run' | 'execute';

const mode: Mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';

const createTableStatements = [
  `CREATE TABLE boards (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    title VARCHAR(255),
    description TEXT,
    display_type VARCHAR(50) DEFAULT 'flowchart',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  `CREATE TABLE displays (
    id UUID PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    display_type VARCHAR(50) NOT NULL,
    title VARCHAR(255),
    excalidraw_data JSONB,
    structured_payload JSONB,
    ai_snapshot JSONB,
    ai_model TEXT,
    prompt_version TEXT,
    tokens_used INTEGER,
    position_x INTEGER DEFAULT 0,
    position_y INTEGER DEFAULT 0,
    width INTEGER DEFAULT 800,
    height INTEGER DEFAULT 600,
    scale NUMERIC(8,4) DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
  `CREATE TABLE contexts (
    id UUID PRIMARY KEY,
    board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    context_value JSONB NOT NULL,
    token_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );`,
];

const migrationStatement = `INSERT INTO displays (
  id,
  board_id,
  display_type,
  title,
  excalidraw_data,
  structured_payload,
  ai_snapshot,
  ai_model,
  prompt_version,
  tokens_used,
  position_x,
  position_y,
  width,
  height,
  scale,
  created_at,
  updated_at
)
SELECT
  id AS display_id,
  id AS board_id,
  'flowchart',
  name AS title,
  data,
  NULL,
  ai_generated_data,
  ai_model,
  prompt_version,
  tokens_used,
  0,
  0,
  800,
  600,
  1,
  created_at,
  updated_at
FROM flowcharts;`;

function printHeader(title: string) {
  console.log('\n===========================================');
  console.log(title);
  console.log('===========================================\n');
}

async function main() {
  printHeader(`boards/displays/contexts 迁移脚本 (${mode})`);

  if (mode === 'dry-run') {
    console.log('➤ Dry-run 模式：仅输出 SQL 语句，不执行任何写操作。\n');
  } else {
    console.log('⚠️ Execute 模式当前仅预留占位，未连接数据库。\n');
  }

  printHeader('建表语句');
  createTableStatements.forEach((statement, index) => {
    console.log(`-- Statement #${index + 1}`);
    console.log(`${statement}\n`);
  });

  printHeader('迁移语句');
  console.log(`${migrationStatement}\n`);

  printHeader('执行计划摘要');
  console.log(
    JSON.stringify(
      {
        mode,
        steps: [
          '创建新表并设置默认值/外键约束',
          'flowcharts -> displays 数据迁移',
          '后续添加双写与灰度发布逻辑（未在本脚本中执行）',
        ],
        nextActions:
          mode === 'dry-run'
            ? '请在评审通过后补充数据库连接配置与事务控制，再运行 --execute'
            : 'TODO: 实现数据库连接与事务执行',
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error('迁移脚本执行失败:', error);
  process.exitCode = 1;
});
