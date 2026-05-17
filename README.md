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

GitHub Pages に置く場合、リポジトリ名のサブパスで公開するなら `astro.config.mjs` の `base` を設定してください。

## Supabase 方針

- 使用する機能は Auth、Postgres Tables、RLS のみです。
- Edge Functions、Realtime、Storage、複雑な RPC は v1 では使いません。
- `service_role` key はブラウザへ絶対に置かないでください。
