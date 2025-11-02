## 2025-02-28 Google 登录回调问题修复
- 根因：用户在裸域 vilearning.pro 登录时，`window.location.origin` 生成的 redirect_uri 与 Google 控制台登记的 www 域名不一致，触发 `redirect_uri_mismatch`。
- 代码调整：`src/lib/urls/urls.ts` 现在优先使用环境变量 `NEXT_PUBLIC_BASE_URL`/`NEXT_PUBLIC_SITE_URL` 作为统一主域，确保 OAuth 回调始终与控制台配置匹配。
- 部署要点：生产环境必须将 `NEXT_PUBLIC_BASE_URL` 设置为与 Google 控制台完全一致的域名（如 `https://www.vilearning.pro`），否则问题会复现。