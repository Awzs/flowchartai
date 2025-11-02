import 'dotenv/config';

import { getDb } from '@/db';
import { user } from '@/db/schema';
import { eq } from 'drizzle-orm';

async function grantUnlimitedUsage(email: string) {
  const db = await getDb();

  const existingUser = await db
    .select({
      id: user.id,
      metadata: user.metadata,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1);

  const record = existingUser[0];

  if (!record) {
    console.error(`❌ 未找到邮箱为 ${email} 的用户`);
    process.exit(1);
  }

  const metadata = (record.metadata as Record<string, any>) ?? {};

  if (metadata.aiUnlimited) {
    console.log(`ℹ️ 用户 ${email} 已经具备无限制的 AI 使用权限`);
    return;
  }

  metadata.aiUnlimited = true;

  await db.update(user).set({ metadata }).where(eq(user.id, record.id));

  console.log(`✅ 已为用户 ${email} 写入 metadata.aiUnlimited = true`);
}

async function main() {
  const email = process.argv[2];

  if (!email) {
    console.error(
      '请传入需要授权的用户邮箱，例如：pnpm tsx scripts/grant-ai-unlimited.ts user@example.com'
    );
    process.exit(1);
  }

  await grantUnlimitedUsage(email);
}

main().catch((error) => {
  console.error('授予无限制权限失败:', error);
  process.exit(1);
});
