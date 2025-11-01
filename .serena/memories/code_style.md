# 代码风格与规范
- 语言：全局使用 TypeScript，导出函数需显式返回类型。
- 格式：Biome（`biome.json`）约定 2 空格缩进、单引号、尾随逗号；提交前需通过 `pnpm lint`。
- 组件命名：React 组件、hooks 使用 PascalCase（如 `FlowEditor`、`useFlowchartStore`）；函数使用 camelCase；`src/app` 路由文件夹保持 kebab-case。
- 样式：Tailwind CSS 工具类为主，可复用设计 Token 放在 `src/styles`。
- 文档/注释：公共函数建议加 JSDoc；中文需求文档需保持项目术语一致。
- Git：遵循 Conventional Commits（如 `feat(app): ...`），提交前同步 lint、测试结果及部署考量。