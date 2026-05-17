# 団地管理組合電子化システム v1

Astro + GitHub Pages + Supabase の静的フロントエンドです。Supabase は基本機能だけを使います。

## 機能

- メール/パスワードログイン
- 会議室予約申請、理事/管理者による承認
- 通知・課題の発行と既読管理
- 年間行事の登録とカレンダー表示
- 管理者による会議室登録とユーザー権限変更

## セットアップ

1. Supabase プロジェクトを作成します。
2. `supabase/schema.sql` を Supabase SQL Editor で実行します。
3. Supabase Dashboard の Auth でユーザーを作成します。作成時に `profiles` へ居民レコードが自動作成されます。
4. `.env.example` を参考に `.env` を作成します。
5. 初回管理者はユーザー作成後、SQL Editor で role を変更します。

```sql
update public.profiles
set role = 'admin'
where id = 'AUTH_USER_UUID';
```

## 開発

```sh
npm install
npm run dev
```

## ビルド

```sh
npm run build
```

## GitHub Pages デプロイ

`.github/workflows/deploy.yml` が `main` への push、pull request、手動実行でビルドを走らせます。pull request ではビルド確認のみ、`main` への push と手動実行では GitHub Pages を有効化して `dist/` を公開します。

GitHub リポジトリ側で Pages の Source を `GitHub Actions` に設定し、以下の repository secrets を登録してください。

- `ASTRO_BASE_PATH`
- `PUBLIC_SITE_URL`
- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`

`ASTRO_BASE_PATH` は Project Pages なら `/リポジトリ名`、User/Org Pages や独自ドメイン直下なら空にします。未設定の場合は `astro.config.mjs` が Actions 上で GitHub Pages のリポジトリサブパスを自動推定します。

## Supabase 方針

- 使用する機能は Auth、Postgres Tables、RLS のみです。
- Edge Functions、Realtime、Storage、複雑な RPC は v1 では使いません。
- `service_role` key はブラウザへ絶対に置かないでください。
