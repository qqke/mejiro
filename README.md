# 团地管理组合电子化系统 v5

这是一个基于 Astro、GitHub Pages 和 Supabase 的静态前端项目。Supabase 只使用 Auth、Postgres Tables 和 RLS 等基础能力。

## 功能

- 邮箱/密码登录
- 会议室预约申请，理事或管理员审批
- 通知、会议议题发布和已读管理
- 年度活动登记和日历展示
- 管理文档登记、版本管理和审批
- 承认后的电子印影记录
- 共用部修缮依赖、处理状态和完了记录
- 管理费、修缮积立金和支出项目的收支台账
- 管理员维护会议室和用户权限

## 版本范围

v1 提供基础业务闭环：登录、会议室预约、通知、年度活动和后台权限维护。

v2 增加管理文档模块：文档类型、版本号、摘要、参照 URL、审查状态和审批历史。

v3 增加电子印影和归档能力：已承认文档可以记录理事印或管理员印，并保留印影履历。

v4 增加修缮工单模块：居民可提交共用部、设备、安全、清扫等修缮依赖，理事或管理员推进状态。

v5 增加收支台账模块：理事或管理员记录收入和支出，居民登录后可查看公开台账和汇总金额。

## 用户来源

本项目没有前台自助注册入口。用户账号由管理员在 Supabase Dashboard 的 Authentication / Users 中创建。

创建 Supabase Auth 用户后，`supabase/schema.sql` 中的 `on_auth_user_created` trigger 会自动在 `public.profiles` 表中创建一条用户资料，默认角色为 `resident`。

第一个管理员需要在用户创建后，通过 Supabase SQL Editor 手动修改角色：

```sql
update public.profiles
set role = 'admin'
where id = 'AUTH_USER_UUID';
```

## 初始化

1. 创建 Supabase 项目。
2. 新项目在 Supabase SQL Editor 中执行 `supabase/schema.sql`。
3. 已经部署过 v1 的项目，先执行 `supabase/v2_v3_migration.sql`，再执行 `supabase/v4_v5_migration.sql`。
4. 已经部署到 v3 的项目，只需要执行 `supabase/v4_v5_migration.sql`。
5. 参考 `.env.example` 创建本地 `.env`。
6. 在 Supabase Dashboard 的 Authentication / Users 中创建用户。
7. 按需在 `public.profiles` 中调整用户角色。

## 环境变量

```env
ASTRO_BASE_PATH=/mejiro
PUBLIC_SITE_URL=https://your-github-user.github.io
PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-or-anon-key
```

`ASTRO_BASE_PATH` 用于 GitHub Project Pages 的仓库子路径，例如 `/mejiro`。如果部署到 User/Org Pages 或独立域名根路径，可以留空。

## 本地开发

```sh
npm install
npm run dev
```

## 构建

```sh
npm run build
```

## GitHub Pages 部署

`.github/workflows/deploy.yml` 会在以下场景运行：

- push 到 `main`
- 针对 `main` 的 pull request
- 手动触发 workflow

pull request 只执行构建检查。push 到 `main` 或手动执行时，会启用 GitHub Pages，并把 `dist/` 发布到 Pages。

部署前需要在 GitHub 仓库中完成以下设置：

1. Settings / Pages 中将 Source 设置为 `GitHub Actions`。
2. Settings / Secrets and variables / Actions 中添加 repository secrets：

- `ASTRO_BASE_PATH`
- `PUBLIC_SITE_URL`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`

如果没有设置 `ASTRO_BASE_PATH`，`astro.config.mjs` 会在 GitHub Actions 中根据仓库名自动推断 GitHub Pages 的子路径。

## Supabase 使用原则

- 当前版本只使用 Auth、Postgres Tables 和 RLS。
- 不使用 Edge Functions、Realtime、Storage 或复杂 RPC。
- 绝对不要把 `service_role` key 放到浏览器端或前端环境变量中。
