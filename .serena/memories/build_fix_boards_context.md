# recent build fix (2024-xx)
- 修复 `@/lib/boards/repository` 未导出 `FlowchartRow` 导致脚本、API 构建失败的问题：现通过 `transformers.ts` 统一导出 `FlowchartRow`、`DISPLAY_ID_SUFFIX`、`safeParseJSON` 并在 `repository.ts` 里 re-export 类型。
- `src/app/api/context/selection/route.ts` 现在会标准化节点 position，只在同时提供 x/y 时写入，避免 SelectionNode 类型报错。
- `use-canvas-displays` 的 `updatePosition` 为缺失 position 的 display 注入默认坐标和 zIndex，保证 Zustand 状态满足 `CanvasDisplayPayload` 类型。
- 当前 `pnpm build` 可在 ~145s 内通过。