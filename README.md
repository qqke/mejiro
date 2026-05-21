# 团地管理组合电子化系统 v21

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
- 共用设备、备品、防灾用品等资产台账
- 供应商资料和合同期限管理
- 住户名册和紧急联系方式维护
- 总会、修缮、活动等议题的问卷和表决
- 防灾训练、安否确认和要支援记录
- 理事会待办任务、担当、期限和状态跟踪
- 停车场、駐轮场、摩托车位的区画和使用申请
- 住户咨询、投诉、处理状态和回复记录
- 回覧板、配布物、规约案和活动资料的确认管理
- 集会室钥匙、清扫用具、防灾备品等貸出和返却管理
- 清扫当番、共用部巡回、植栽确认和会議準備的担当管理
- 垃圾、资源、粗大垃圾收集规则和申报管理
- 管理员维护会议室和用户权限
- 会议治理：会议登记、议案管理、出席/委任、投票和结果汇总
- 长期点检：设备点检计划、点检记录、异常转修缮和资产状态联动

## 版本范围

v1 提供基础业务闭环：登录、会议室预约、通知、年度活动和后台权限维护。

v2 增加管理文档模块：文档类型、版本号、摘要、参照 URL、审查状态和审批历史。

v3 增加电子印影和归档能力：已承认文档可以记录理事印或管理员印，并保留印影履历。

v4 增加修缮工单模块：居民可提交共用部、设备、安全、清扫等修缮依赖，理事或管理员推进状态。

v5 增加收支台账模块：理事或管理员记录收入和支出，居民登录后可查看公开台账和汇总金额。

v6 增加资产台账模块：管理共用设备、备品、防灾用品、书类等资产状态和点检计划。

v7 增加供应商和合同管理：维护业者联系信息、契约期间、契约金额和更新提醒。

v8 增加住户名册模块：住户维护自己的联系方式，理事和管理员可查看联络体制。

v9 增加意见收集模块：理事和管理员创建问卷或简易表决，住户在线回答。

v10 增加防灾安否模块：登记防灾训练或安否确认，住户可反馈无事或要支援。

v11 增加理事任务模块：管理会议后的待办事项、担当者、期限、优先度和处理状态。

v12 增加停车/駐轮模块：管理车位、自行车位、摩托车位以及使用申请、承认、结束。

v13 增加咨询/投诉模块：住户提交生活规则、噪音、近邻、共用部等事项，理事和管理员处理并记录回复。

v14 增加回覧/配布物模块：理事和管理员发布面向全员或指定角色的回覧，住户在线确认。

v15 增加钥匙/备品貸出模块：登记可貸出物品，住户申请使用，理事和管理员承认、返却或记录紛失。

v16 增加当番/巡回模块：登记清扫、巡回、植栽、会議準備等担当，住户可完成自己的当番。

v17 增加垃圾/资源模块：维护收集日、集积场所、出し方规则，并支持粗大垃圾申报和处理状态。

v18/v19 增加会议治理模块：会议登记、议案管理、出席/委任、投票和结果汇总。

v20/v21 增加长期点检模块：设备点检计划、点检记录、异常转修缮，并联动资产状态更新。

v24/v25 增加管理文書 Markdown CRDT 协作编辑：多人字符级合并、版履历、差分查看和浏览器端 PDF/打印视图。

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

版本迁移对应关系：

| 现有版本 | 需要补跑的迁移 |
| --- | --- |
| v1 | `v2_v3` -> `v4_v5` -> `v6_v7` -> `v8_v9` -> `v10_v11` -> `v12_v13` -> `v14_v15` -> `v16_v17` -> `v18_v19` -> `v20_v21` -> `v22_v23` -> `v24_v25` |
| v3 | `v4_v5` -> `v6_v7` -> `v8_v9` -> `v10_v11` -> `v12_v13` -> `v14_v15` -> `v16_v17` -> `v18_v19` -> `v20_v21` -> `v22_v23` -> `v24_v25` |
| v5 | `v6_v7` -> `v8_v9` -> `v10_v11` -> `v12_v13` -> `v14_v15` -> `v16_v17` -> `v18_v19` -> `v20_v21` -> `v22_v23` -> `v24_v25` |
| v7 | `v8_v9` -> `v10_v11` -> `v12_v13` -> `v14_v15` -> `v16_v17` -> `v18_v19` -> `v20_v21` -> `v22_v23` -> `v24_v25` |
| v9 | `v10_v11` -> `v12_v13` -> `v14_v15` -> `v16_v17` -> `v18_v19` -> `v20_v21` -> `v22_v23` -> `v24_v25` |
| v11 | `v12_v13` -> `v14_v15` -> `v16_v17` -> `v18_v19` -> `v20_v21` -> `v22_v23` -> `v24_v25` |
| v13 | `v14_v15` -> `v16_v17` -> `v18_v19` -> `v20_v21` -> `v22_v23` -> `v24_v25` |
| v15 | `v16_v17` -> `v18_v19` -> `v20_v21` -> `v22_v23` -> `v24_v25` |
| v17 | `v18_v19` -> `v20_v21` -> `v22_v23` -> `v24_v25` |
| v19 | `v20_v21` -> `v22_v23` -> `v24_v25` |
| v21 | `v22_v23` -> `v24_v25` |
| v23 | `v24_v25` |

1. 创建 Supabase 项目。
2. 新项目在 Supabase SQL Editor 中执行 `supabase/schema.sql`。
3. 已经部署过 v1 的项目，依次执行 `supabase/v2_v3_migration.sql`、`supabase/v4_v5_migration.sql`、`supabase/v6_v7_migration.sql`、`supabase/v8_v9_migration.sql`、`supabase/v10_v11_migration.sql`、`supabase/v12_v13_migration.sql`、`supabase/v14_v15_migration.sql`、`supabase/v16_v17_migration.sql`、`supabase/v18_v19_migration.sql`、`supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
4. 已经部署到 v3 的项目，依次执行 `supabase/v4_v5_migration.sql`、`supabase/v6_v7_migration.sql`、`supabase/v8_v9_migration.sql`、`supabase/v10_v11_migration.sql`、`supabase/v12_v13_migration.sql`、`supabase/v14_v15_migration.sql`、`supabase/v16_v17_migration.sql`、`supabase/v18_v19_migration.sql`、`supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
5. 已经部署到 v5 的项目，依次执行 `supabase/v6_v7_migration.sql`、`supabase/v8_v9_migration.sql`、`supabase/v10_v11_migration.sql`、`supabase/v12_v13_migration.sql`、`supabase/v14_v15_migration.sql`、`supabase/v16_v17_migration.sql`、`supabase/v18_v19_migration.sql`、`supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
6. 已经部署到 v7 的项目，依次执行 `supabase/v8_v9_migration.sql`、`supabase/v10_v11_migration.sql`、`supabase/v12_v13_migration.sql`、`supabase/v14_v15_migration.sql`、`supabase/v16_v17_migration.sql`、`supabase/v18_v19_migration.sql`、`supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
7. 已经部署到 v9 的项目，依次执行 `supabase/v10_v11_migration.sql`、`supabase/v12_v13_migration.sql`、`supabase/v14_v15_migration.sql`、`supabase/v16_v17_migration.sql`、`supabase/v18_v19_migration.sql`、`supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
8. 已经部署到 v11 的项目，依次执行 `supabase/v12_v13_migration.sql`、`supabase/v14_v15_migration.sql`、`supabase/v16_v17_migration.sql`、`supabase/v18_v19_migration.sql`、`supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
9. 已经部署到 v13 的项目，依次执行 `supabase/v14_v15_migration.sql`、`supabase/v16_v17_migration.sql`、`supabase/v18_v19_migration.sql`、`supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
10. 已经部署到 v15 的项目，只需要执行 `supabase/v16_v17_migration.sql`、`supabase/v18_v19_migration.sql`、`supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
11. 已经部署到 v17 的项目，只需要执行 `supabase/v18_v19_migration.sql`、`supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
12. 已经部署到 v19 的项目，只需要执行 `supabase/v20_v21_migration.sql`、`supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
13. 已经部署到 v21 的项目，只需要执行 `supabase/v22_v23_migration.sql`、`supabase/v24_v25_migration.sql`。
14. 参考 `.env.example` 创建本地 `.env`。
15. 在 Supabase Dashboard 的 Authentication / Users 中创建用户。不要手动插入 `auth.users`，缺少 Auth identity 或必填字段会导致登录返回 `Database error querying schema`。
16. 按需在 `public.profiles` 中调整用户角色，管理员需要 `role = 'admin'`。
17. 如果登录页显示 Supabase Auth 数据库设置错误，请在 Supabase SQL Editor 中执行 `supabase/auth_login_diagnostics.sql`，并同时查看 Dashboard 的 Auth Logs 和 Postgres Logs。

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

## 浏览器烟测

```sh
npm run smoke:schema
npm run smoke:db
npm run smoke:auth-permissions
npm run smoke:validation
npm run smoke:responsive
npm run smoke:status-branches
npm run smoke:empty-states
npm run smoke
npm run smoke:functionality
npm run smoke:meetings
npm run smoke:inspections
```

默认会检查未登录时的路由跳转和登录页；如果要跑登录态分支，可以额外设置 `SMOKE_EMAIL` 和 `SMOKE_PASSWORD`。
`npm run smoke:db` 会在本机 PostgreSQL 工具可用时起一个临时数据库，跑 schema、migration、RLS 和 trigger 验证；如果找不到 PostgreSQL 二进制，它会直接跳过。
浏览器烟测会在 `dist/` 不存在时自动先执行一次 `npm run build`，再启动 preview。
烟测进程会自动注入一组本地兜底的 Supabase / site 环境变量，不依赖仓库里的 `.env`。

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
