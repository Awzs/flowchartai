# Vercel 部署要点
- 项目使用 `pnpm build`（先运行 content-collections build 再 next build），部署到 Vercel 时保持相同命令，安装阶段无需额外脚本。
- 最少需要配置 `DATABASE_URL`、`BETTER_AUTH_SECRET`、`AUTH_SECRET`、`ARK_API_KEY`、`ARK_DEEPSEEK_MODEL_ID`、`AI_DEFAULT_MODEL_KEY`、`NEXT_PUBLIC_BASE_URL` 及 OAuth 客户端 ID/Secret，其余 Stripe、存储、分析变量按需启用。
- `vercel.json` 将 `/app/api/**/*` 函数超时提升至 60s，如需更长需升级付费方案。
- 生产环境建议在 Vercel 设置 `NEXT_PUBLIC_BASE_URL=https://<自有域名>` 并通过 System Env 提供 R2/S3、Stripe 等凭据。
- 数据库迁移需在外部执行 `pnpm db:migrate`，Vercel 构建阶段不会自动跑迁移。
- 2025-11-01日，下午13点45分，vercel部署成功。
