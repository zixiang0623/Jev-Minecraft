// Cloudflare Pages Function
// フロントエンド(index.html)から POST /api/run で呼ばれる。
// OPENROUTER_API_KEY はここには書かず、Cloudflare Pages の
// Settings → Environment variables (Production / Preview) に登録した
// 環境変数(できればSecretとして暗号化)から読む。
//
// zixiang0623/Jev-Openrouter の api/run.js (Vercel Serverless Function) と
// 同じリクエスト/レスポンス契約を、Cloudflare Pages Functions の
// onRequestPost 形式に移植したもの。

export async function onRequestPost(context) {
  const { request, env } = context;

  const apiKey = env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return json(500, {
      error: "OPENROUTER_API_KEY is not set. Add it in Cloudflare Pages → Project → Settings → Environment variables, then redeploy."
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

  try {
    const upstream = await fetch("https://openrouter.ai/api/alpha/decisions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
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
      data = { error: "OpenRouter returned a non-JSON response", raw: text.slice(0, 800) };
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
