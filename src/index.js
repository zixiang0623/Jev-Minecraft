// zixiang0623/Jev の src/index.js と同じ方式。
// wrangler.jsonc で [assets] directory="./public" run_worker_first=true を
// 設定しているので、すべてのリクエストがまずこのfetchに来る。
// POSTだけここでenv.AI(Workers AI binding)経由でJevを呼び、
// それ以外(GET/HEADなど静的ファイル配信)はASSETSにそのまま渡す。
// OPENROUTER_API_KEYやAI Gatewayのアカウント情報などの環境変数は一切不要。

export default {
  async fetch(request, env) {
    if (request.method === "POST") {
      let body;
      try {
        body = await request.json();
      } catch (err) {
        return new Response(JSON.stringify({ error: "invalid JSON body" }), {
          status: 400,
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      }

      try {
        const result = await env.AI.run("typesafe/jev", body);
        return new Response(JSON.stringify(result), {
          headers: { "content-type": "application/json; charset=utf-8" }
        });
      } catch (err) {
        return new Response(
          JSON.stringify({ error: String(err && err.message ? err.message : err) }),
          { status: 500, headers: { "content-type": "application/json; charset=utf-8" } }
        );
      }
    }

    // 念のためのフォールバック(通常はASSETSバインディングが直接GETを処理する)
    return env.ASSETS.fetch(request);
  }
};
