// Cloudflare Pages Function
// フロントエンド(index.html)から POST /api/run で呼ばれる。
// OpenRouterへ直接ではなく、Cloudflare AI Gateway 経由で呼び出す
// (キャッシュ・レート制限・ログ/分析をGateway側で持たせるため)。
//
// 必要な環境変数(Cloudflare Pages → Settings → Environment variables、
// できればSecretとして暗号化):
//   OPENROUTER_API_KEY      - OpenRouterのAPIキー(Gatewayを通しても
//                              プロバイダ側の認証としてこれが必要)
//   CF_AI_GATEWAY_ACCOUNT_ID - CloudflareアカウントID
//   CF_AI_GATEWAY_ID         - AI Gatewayのゲートウェイ名(dashboardで作成)
//   CF_AI_GATEWAY_TOKEN      - (任意)GatewayでAuthenticated Gatewayを
//                              有効にしている場合のみ。cf-aig-authorizationに使う
//
// エンドポイントの組み立て方は Cloudflare公式の OpenRouterプロキシ規則
// (https://openrouter.ai/api/... を https://gateway.ai.cloudflare.com/v1/
// {account_id}/{gateway_id}/openrouter/... に置き換える)に従い、
// 元のAPIパス /api/alpha/decisions を /openrouter/alpha/decisions に対応させている。
// zixiang0623/Jev-Openrouter の api/run.js (Vercel版、OpenRouter直叩き) と
// 同じリクエスト/レスポンス契約を保ったまま、呼び出し先だけをGatewayに変更したもの。

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json(500, {
      error: "OPENROUTER_API_KEY is not set. Add it in Cloudflare Pages → Project → Settings → Environment variables, then redeploy."
    });
  }

  const accountId = env.CF_AI_GATEWAY_ACCOUNT_ID;
  const gatewayId = env.CF_AI_GATEWAY_ID;
  if (!accountId || !gatewayId) {
    return json(500, {
      error: "CF_AI_GATEWAY_ACCOUNT_ID / CF_AI_GATEWAY_ID is not set. Create an AI Gateway in the Cloudflare dashboard (AI → AI Gateway), then add its Account ID and Gateway name as environment variables in Cloudflare Pages → Project → Settings → Environment variables, then redeploy."
    });
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json(400, { error: "Request body must be JSON" });
  }

  const { state, questions, model } = body || {};
  if (!questions || Object.keys(questions).length === 0) {
    return json(400, { error: "questions is required" });
  }

  const upstreamUrl =
    `https://gateway.ai.cloudflare.com/v1/${accountId}/${gatewayId}/openrouter/alpha/decisions`;

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
  if (env.CF_AI_GATEWAY_TOKEN) {
    headers["cf-aig-authorization"] = `Bearer ${env.CF_AI_GATEWAY_TOKEN}`;
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: model || "~typesafe/jev-latest",
        state: state ?? "",
        questions
      })
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      data = { error: "AI Gateway / OpenRouter returned a non-JSON response", raw: text.slice(0, 800) };
    }
    return json(upstream.status, data);
  } catch (err) {
    return json(502, { error: String(err && err.message ? err.message : err) });
  }
}

export async function onRequestGet() {
  return json(405, { error: "Method Not Allowed" }, { Allow: "POST" });
}

function json(status, data, extraHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: Object.assign({ "Content-Type": "application/json" }, extraHeaders || {})
  });
}
