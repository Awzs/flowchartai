# 2025-02-19 画布错误修复
- `mind-elixir-react` 会自带 React 副本，导致运行时 `ReactCurrentDispatcher` 报错；在 `next.config.ts` 中通过 webpack alias 强制指向根目录 React/ReactDOM/JSX runtime。
- 新增 `CanvasPageClient` 客户端组件，`/canvas` 与 `/canvas/[id]` 页面改为服务端壳组件，避免 SSR 期间直接加载 `@excalidraw/excalidraw` 触发 `window is not defined`。
- 验证 `pnpm build` 通过，确保白板入口不再触发全局错误页。