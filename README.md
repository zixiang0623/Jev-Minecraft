# Jev-Minecraft

「INFINITE VOXELS」(単一HTMLの探索専用ボクセルワールド)に、Jev(型付き判定AI)による
オートパイロットを追加したもの。目標は **水のある場所(海)に到達すること**。

- `J` キーでJevオートパイロットを切替。ONにすると飛行モードに固定され、Jevが
  8方向の地形(標高・バイオーム)を見て毎回どちらへ進むかを選び、それに向かって飛行する。
- 標高が海面(32)以下の地点に到達すると「🌊 目標達成」のバナーが表示され、自動的に停止する。
- 画面下に、Jevへの送信内容と返答(選んだ方向・確信度)のログを表示する。

## 構成

- `index.html` — フロントエンド(単一HTMLファイル)。ゲーム本体 + Jevオートパイロット。`POST /api/run` を叩く
- `functions/api/run.js` — Cloudflare Pages Function。OpenRouterの `https://openrouter.ai/api/alpha/decisions` を代わりに呼ぶ
  (zixiang0623/Jev-Openrouter の `api/run.js` と同じ契約を Pages Functions 形式に移植したもの)
- `wrangler.toml` — Cloudflare Pages / Wrangler 用の設定

APIキーをブラウザに置かず、サーバー側(Cloudflare Pages Functions)にだけ持たせるための構成。

## デプロイ手順(Cloudflare Pages)

1. Cloudflareダッシュボード → Workers & Pages → Create → Pages → **Connect to Git** で、このリポジトリを選択
2. ビルド設定: Framework preset は `None`、Build command は空、Build output directory は `/`(ルート)のまま
3. Settings → Environment variables に `OPENROUTER_API_KEY` を追加(値は自分のOpenRouter APIキー。Secretとして暗号化推奨)。Production と Preview 両方に設定
4. Deploy(以後は `main` へのpushで自動デプロイ)

### Wrangler CLIでデプロイする場合

```bash
npm i -g wrangler
wrangler pages deploy . --project-name=jev-minecraft
wrangler pages secret put OPENROUTER_API_KEY --project-name=jev-minecraft
```

## ローカルで動かす場合

```bash
npm i -g wrangler
wrangler pages dev .
```

`OPENROUTER_API_KEY` はローカルでは `.dev.vars` ファイル(`.gitignore`済み、コミットしないこと)に
`OPENROUTER_API_KEY=sk-or-...` の形式で書いておくと `wrangler pages dev` が読み込む。
