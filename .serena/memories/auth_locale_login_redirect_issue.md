## 登录/注册与语言后缀排查
- middleware 在保护路由未登录时会立即重定向到 `/auth/login`，未提前写入语言 cookie，导致首次直接访问 `/zh/...` 这类受保护地址时会回退到默认 `/en` 登录页。
- 登录/注册表单默认回调地址调用 `getUrlWithLocaleInCallbackUrl('/dashboard', locale)`，由于传入的是相对路径会触发函数内部的异常捕获，返回 `/dashboard` 并打印告警；但在持有 locale cookie 时中间件会再次补上 `/zh` 前缀。
- 若希望在生产中固定语言，需要在部署环境（如 Vercel）填充 `NEXT_PUBLIC_BASE_URL=https://vilearning.pro`，以保证 Better Auth 生成的绝对链接正确带域名。
- 后续修复建议：在未登录保护路由分支写入 locale cookie 或直接重定向到 `/${currentLocale}/auth/login`；为 `getUrlWithLocaleInCallbackUrl` 增加对相对路径的处理。