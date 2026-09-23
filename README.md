# Jev-Minecraft

「INFINITE VOXELS」(単一HTMLの探索専用ボクセルワールド)に、Jev(型付き判定AI)による
オートパイロットを追加したもの。目標は **水のある場所(海)に到達すること**。

- `J` キーでJevオートパイロットを切替。ONにすると飛行モードに固定され、Jevが
  8方向の地形(標高・バイオーム)を見て毎回どちらへ進むかを選び、それに向かって飛行する。
- 標高が海面(32)以下の地点に到達すると「🌊 目標達成」のバナーが表示され、自動的に停止する。
- 画面下に、Jevへの送信内容と返答(選んだ方向・確信度)のログを表示する。

## 構成

zixiang0623/Jev と全く同じ方式(Cloudflare Workers + 静的アセット + Workers AI binding)を採用。
OpenRouterのAPIキーもCloudflare AI Gatewayのアカウント情報も**一切不要**——
Workers AI bindingがアカウントに紐づいた形でJevモデルを直接呼び出す。

- `public/index.html` — フロントエンド(単一HTMLファイル)。ゲーム本体 + Jevオートパイロット。`POST /api/run` を叩く
- `src/index.js` — Cloudflare Worker本体。POSTを受けたら `env.AI.run("typesafe/jev", body)` でJevを呼ぶ。
  GET/HEADなど静的配信は `env.ASSETS` にそのまま渡す(zixiang0623/Jev の `src/index.js` と同一方式)
- `wrangler.jsonc` — `assets.directory` で `public/` を配信し、`ai.binding = "AI"` でWorkers AIを有効化

## デプロイ手順(Cloudflare Workers)

環境変数・シークレットの設定は不要。

```bash
npm i -g wrangler
wrangler login
wrangler deploy
```

GitHub連携で自動デプロイしたい場合は、Cloudflareダッシュボード → Workers & Pages → Create →
**Import a repository** でこのリポジトリを接続する(Build commandは不要、`wrangler.jsonc` がそのまま使われる)。

## ローカルで動かす場合

```bash
wrangler dev
```

Workers AI bindingはローカルでもCloudflareアカウントの認証(`wrangler login`)があればそのまま動く。
