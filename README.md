# Jev-Minecraft

「INFINITE VOXELS」(単一HTMLの探索専用ボクセルワールド)に、Jev(型付き判定AI)による
オートパイロットを追加したもの。目標は **水のある場所(海)に到達すること**。

- `J` キーでJevオートパイロットを切替。ONにすると飛行モードに固定され、Jevが
  8方向の地形(標高・バイオーム)を見て毎回どちらへ進むかを選び、それに向かって飛行する。
- 標高が海面(32)以下の地点に到達すると「🌊 目標達成」のバナーが表示され、自動的に停止する。
- 画面下に、Jevへの送信内容と返答(選んだ方向・確信度)のログを表示する。

## 構成

- `index.html` — フロントエンド(単一HTMLファイル)。ゲーム本体 + Jevオートパイロット。`POST /api/run` を叩く
- `functions/api/run.js` — Cloudflare Pages Function。**Cloudflare AI Gateway** を経由してOpenRouter(`~typesafe/jev-latest`)を呼ぶ
  (zixiang0623/Jev-Openrouter の `api/run.js` と同じリクエスト/レスポンス契約を保ったまま、呼び出し先だけをAI Gatewayに変更したもの)
- `wrangler.toml` — Cloudflare Pages / Wrangler 用の設定

APIキーをブラウザに置かず、サーバー側(Cloudflare Pages Functions)にだけ持たせるための構成。

## デプロイ手順(Cloudflare Pages)

1. Cloudflareダッシュボード → Workers & Pages → Create → Pages → **Connect to Git** で、このリポジトリを選択
2. ビルド設定: Framework preset は `None`、Build command は空、Build output directory は `/`(ルート)のまま
3. Cloudflareダッシュボード → AI → **AI Gateway** で新しいゲートウェイを作成し、Account ID とゲートウェイ名を控える
4. Pages プロジェクトの Settings → Environment variables に以下を追加(Production / Preview 両方、Secretとして暗号化推奨)
   - `OPENROUTER_API_KEY` — 自分のOpenRouter APIキー
   - `CF_AI_GATEWAY_ACCOUNT_ID` — 上記のAccount ID
   - `CF_AI_GATEWAY_ID` — 上記のゲートウェイ名
   - `CF_AI_GATEWAY_TOKEN` — (任意)ゲートウェイでAuthenticated Gatewayを有効にしている場合のみ
5. Deploy(以後は `main` へのpushで自動デプロイ)

呼び出し先は `https://gateway.ai.cloudflare.com/v1/{account_id}/{gateway_id}/openrouter/alpha/decisions` になる
(Cloudflareの OpenRouterプロキシ規則 `https://openrouter.ai/api/... → .../openrouter/...` に、OpenRouterの
alphaエンドポイント `/api/alpha/decisions` を当てはめたもの)。ゲートウェイ作成後、ダッシュボードの
「AI Gateway → 該当ゲートウェイ → Logs」で実際にリクエストが届いているか確認できる。

### Wrangler CLIでデプロイする場合

```bash
npm i -g wrangler
wrangler pages deploy . --project-name=jev-minecraft
wrangler pages secret put OPENROUTER_API_KEY --project-name=jev-minecraft
wrangler pages secret put CF_AI_GATEWAY_ACCOUNT_ID --project-name=jev-minecraft
wrangler pages secret put CF_AI_GATEWAY_ID --project-name=jev-minecraft
```

## ローカルで動かす場合

```bash
npm i -g wrangler
wrangler pages dev .
```

`OPENROUTER_API_KEY` はローカルでは `.dev.vars` ファイル(`.gitignore`済み、コミットしないこと)に
`OPENROUTER_API_KEY=sk-or-...` の形式で書いておくと `wrangler pages dev` が読み込む。
