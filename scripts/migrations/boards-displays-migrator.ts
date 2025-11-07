#!/usr/bin/env ts-node
import 'dotenv/config';
import { getDb } from '@/db';
import {
  boards,
  displays,
  flowcharts,
  mindmaps,
} from '@/db/schema';
import { FlowchartRow, syncLegacyFlowchartToBoard } from '@/lib/boards/repository';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

const mode = process.argv.includes('--execute') ? 'execute' : 'dry-run';

const createTableStatements = [
  `CREATE TABLE boards (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    display_type VARCHAR(50) DEFAULT 'flowchart',
    cover_image_url TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE INDEX boards_user_updated_idx ON boards(user_id, updated_at);`,
  `CREATE TABLE displays (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    display_type VARCHAR(50) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
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
    scale NUMERIC(10,4) DEFAULT 1,
    z_index INTEGER DEFAULT 1,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE INDEX displays_board_idx ON displays(board_id);`,
  `CREATE TABLE contexts (
    id TEXT PRIMARY KEY,
    board_id TEXT NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
    context_type VARCHAR(50) NOT NULL,
    context_key TEXT,
    context_value JSONB NOT NULL,
    token_count INTEGER DEFAULT 0,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );`,
  `CREATE INDEX contexts_board_idx ON contexts(board_id);`
];

async function dryRun() {
  console.log('boards/displays/contexts 迁移脚本 (dry-run)');
  console.log('-----------------------------------------\n');
  createTableStatements.forEach((statement, index) => {
    console.log(`-- Statement #${index + 1}`);
    console.log(`${statement}\n`);
  });
  console.log('-- 下一步: 运行 pnpm db:generate 生成正式迁移文件');
}

async function migrate() {
  const db = await getDb();
  console.log('⚙️  正在迁移 flowcharts → boards/displays ...');
  const legacyFlowcharts = await db.select().from(flowcharts);
  let migrated = 0;
  for (const row of legacyFlowcharts) {
    await syncLegacyFlowchartToBoard(row as FlowchartRow);
    migrated += 1;
  }
  console.log(`✅  已处理 ${migrated} 条流程图记录`);

  console.log('⚙️  正在迁移 mindmaps → displays ...');
  const legacyMindmaps = await db.select().from(mindmaps);
  for (const mindmap of legacyMindmaps) {
    const boardId =
      (mindmap.metadata as { boardId?: string } | null)?.boardId ||
      mindmap.id;

    await db
      .insert(boards)
      .values({
        id: boardId,
        userId: mindmap.userId,
        title: mindmap.title || '思维导图',
        description: mindmap.description,
        displayType: 'mindmap',
      })
      .onConflictDoNothing();

    await db
      .insert(displays)
      .values({
        id: mindmap.id,
        boardId,
        displayType: 'mindmap',
        displayName: mindmap.title || '思维导图',
        structuredPayload: mindmap.data,
        aiSnapshot: { raw: mindmap.raw },
        metadata: mindmap.metadata ?? {},
      })
      .onConflictDoUpdate({
        target: displays.id,
        set: {
          structuredPayload: mindmap.data,
          displayName: mindmap.title || '思维导图',
          metadata: mindmap.metadata ?? {},
          updatedAt: new Date(),
        },
      });
  }
  console.log(`✅  已迁移 ${legacyMindmaps.length} 条思维导图记录`);

  console.log('🎉  boards/displays/contexts 迁移完成');
}

async function main() {
  if (mode === 'dry-run') {
    await dryRun();
  } else {
    await migrate();
  }
}

main().catch((error) => {
  console.error('迁移脚本执行失败:', error);
  process.exitCode = 1;
});
