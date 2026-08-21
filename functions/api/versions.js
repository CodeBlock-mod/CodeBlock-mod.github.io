// CodeBlock Mod — 版本清单读写后台（Pages Functions）
// 数据真身存于 Gitee 发布仓库的 versions.json；本函数服务端代理读写，
// 前端只与本函数同源通信，规避 CORS，Gitee 令牌也不暴露到浏览器。
export async function onRequest(context) {
  const { request, env } = context;
  const GITEE_TOKEN = env.GITEE_TOKEN;
  const REPO = "immediate-success-upon-arrival/CodeBlock-mod-release";
  const PATH = "versions.json";
  const BRANCH = "master";
  const API = "https://gitee.com/api/v5/repos/" + REPO + "/contents/" + PATH;

  function b64ToUtf8(b64) {
    const bin = atob(b64.replace(/\s/g, ""));
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }
  function utf8ToB64(str) {
    const bytes = new TextEncoder().encode(str);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }

  if (request.method === "GET") {
    try {
      const r = await fetch(API + "?access_token=" + GITEE_TOKEN + "&branch=" + BRANCH, {
        headers: { "user-agent": "codeblock-admin" }
      });
      if (!r.ok) throw new Error("gitee " + r.status);
      const data = await r.json();
      if (!data || !data.content) throw new Error("no content");
      const text = b64ToUtf8(data.content);
      return new Response(text, {
        headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
      });
    } catch (e) {
      // Gitee 不可达时回退到本次部署自带的静态版本清单
      try {
        const r2 = await fetch(new URL("/versions.json", request.url));
        if (r2.ok) {
          return new Response(await r2.text(), {
            headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }
          });
        }
      } catch (_) {}
      return new Response(
        JSON.stringify({ current: "v1", versions: [], gitee: "https://gitee.com/immediate-success-upon-arrival/CodeBlock-mod-release" }),
        { status: 200, headers: { "content-type": "application/json; charset=utf-8" } }
      );
    }
  }

  if (request.method === "POST") {
    try {
      const auth = request.headers.get("authorization") || "";
      const provided = auth.startsWith("Bearer ") ? auth.slice(7) : "";
      if (!provided || provided !== env.ADMIN_TOKEN) {
        return new Response(JSON.stringify({ error: "unauthorized" }), {
          status: 401, headers: { "content-type": "application/json; charset=utf-8" }
        });
      }
      let body;
      try {
        body = await request.json();
      } catch (_) {
        return new Response(JSON.stringify({ error: "bad json" }), {
          status: 400, headers: { "content-type": "application/json; charset=utf-8" }
        });
      }
      if (!body || typeof body !== "object" || !Array.isArray(body.versions)) {
        return new Response(JSON.stringify({ error: "invalid payload" }), {
          status: 400, headers: { "content-type": "application/json; charset=utf-8" }
        });
      }

      const content = JSON.stringify(body, null, 2);
      const b64 = utf8ToB64(content);

      let sha = null;
      try {
        const r = await fetch(API + "?access_token=" + GITEE_TOKEN + "&branch=" + BRANCH, {
          headers: { "user-agent": "codeblock-admin" }
        });
        if (r.ok) {
          const d = await r.json();
          if (d && d.sha) sha = d.sha;
        }
      } catch (e) {
        return new Response(JSON.stringify({ error: "sha fetch failed", detail: String(e) }), {
          status: 502, headers: { "content-type": "application/json; charset=utf-8" }
        });
      }

      const payload = {
        content: b64,
        message: "update versions.json via admin backend",
        branch: BRANCH
      };
      if (sha) payload.sha = sha;

      let r;
      try {
        r = await fetch(API + "?access_token=" + GITEE_TOKEN, {
          method: sha ? "PUT" : "POST",
          headers: { "content-type": "application/json", "user-agent": "codeblock-admin" },
          body: JSON.stringify(payload)
        });
      } catch (e) {
        return new Response(JSON.stringify({ error: "gitee request failed", detail: String(e) }), {
          status: 502, headers: { "content-type": "application/json; charset=utf-8" }
        });
      }
      if (!r.ok) {
        const txt = await r.text();
        return new Response(JSON.stringify({ error: "gitee write failed", status: r.status, detail: txt }), {
          status: 502, headers: { "content-type": "application/json; charset=utf-8" }
        });
      }
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "content-type": "application/json; charset=utf-8" }
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: "unexpected", detail: String(e), stack: e && e.stack ? String(e.stack) : "" }), {
        status: 500, headers: { "content-type": "application/json; charset=utf-8" }
      });
    }
  }

  return new Response("method not allowed", { status: 405 });
}
