import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { unstable_startWorker } from "wrangler";

const developmentPreviewMeta =
  /<meta(?=[^>]*\bname=["']codex-preview["'])(?=[^>]*\bcontent=["']development["'])[^>]*>/i;

test("built worker redirects home and renders career preview metadata", { timeout: 60_000 }, async (t) => {
  // Request.cf geography is irrelevant to these routes; keep bootstrap offline.
  const previousCfFetch = process.env.CLOUDFLARE_CF_FETCH_ENABLED;
  process.env.CLOUDFLARE_CF_FETCH_ENABLED = "false";
  t.after(() => {
    if (previousCfFetch === undefined) delete process.env.CLOUDFLARE_CF_FETCH_ENABLED;
    else process.env.CLOUDFLARE_CF_FETCH_ENABLED = previousCfFetch;
  });
  // Execute the actual production bundle in workerd. Node cannot provide the
  // cloudflare:workers import or the platform bindings used by this bundle.
  const worker = await unstable_startWorker({
    config: fileURLToPath(new URL("../dist/server/wrangler.json", import.meta.url)),
    envFiles: [],
    sendMetrics: false,
    dev: {
      remote: false,
      persist: false,
      watch: false,
      inspector: false,
      logLevel: "error",
      server: { hostname: "127.0.0.1", port: 0 },
      // Rendering the career entry must work without external services.
      outboundService: () => new Response("No external service in worker tests", { status: 503 }),
    },
  });
  t.after(() => worker.dispose());
  await worker.ready;

  const home = await worker.fetch("http://localhost/", { redirect: "manual" });
  assert.equal(home.status, 307);
  assert.equal(new URL(home.headers.get("location"), "http://localhost").pathname, "/play");
  await home.body?.cancel();

  const response = await worker.fetch("http://localhost/play", {
    headers: { accept: "text/html" },
  });
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, developmentPreviewMeta);
  assert.match(html, /Loading your rugby world/);

  const entryScript = html.match(/<script[^>]+\bsrc="([^"]+\.js(?:\?[^"]*)?)"/i)?.[1]
    ?? html.match(/<script[^>]*>\s*import\(["']([^"']+\.js(?:\?[^"']*)?)["']\)/i)?.[1];
  assert.ok(entryScript, "Rendered entry includes a client script");
  const scriptUrl = new URL(entryScript, "http://localhost");
  assert.equal(scriptUrl.origin, "http://localhost");
  const script = await worker.fetch(scriptUrl.href);
  assert.equal(script.status, 200);
  assert.match(script.headers.get("content-type") ?? "", /(?:java|ecma)script/i);
  assert.ok((await script.text()).length > 100, "Built client asset is available");

  const career = await worker.fetch("http://localhost/api/career");
  assert.equal(career.status, 401, "Account saves still require authentication");
  await career.body?.cancel();
});
