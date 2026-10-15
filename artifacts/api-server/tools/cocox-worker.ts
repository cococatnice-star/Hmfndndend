// Preserve the user's original Lua, manifests, and wsp.cocox.wtf proxy.
import legacy from "./legacy-cloudflare-worker.js";
import { blockedHomePage } from "./cocox-blocked-page";

const WEBSITE_ORIGIN = "https://coco-x-meow-cheatz--cococatnice.replit.app";

export default {
  async fetch(request: Request) {
    const url = new URL(request.url);
    if (
      url.hostname === "cocox.wtf" && url.pathname === "/" && request.method === "GET" &&
      (request.headers.get("sec-fetch-dest") === "document" ||
        (request.headers.get("accept") || "").includes("text/html"))
    ) {
      return new Response(blockedHomePage, {
        status: 403,
        headers: {
          "Content-Type": "text/html; charset=UTF-8",
          "Cache-Control": "no-store",
          "X-Content-Type-Options": "nosniff",
        },
      });
    }
    const slug = url.pathname.slice(1);
    const namedLoader = request.method === "GET" &&
      /^[a-z0-9]{8}$/.test(slug) && /[a-z]/.test(slug) && /[0-9]/.test(slug);
    const execution = url.pathname === "/api/script-executions" && request.method === "POST";
    if (url.hostname !== "wsp.cocox.wtf" && (namedLoader || execution)) {
      const target = new URL(namedLoader ? `/api/script-loaders/${slug}` : "/api/script-executions", WEBSITE_ORIGIN);
      try {
        const upstream = await fetch(new Request(target.toString(), request));
        const headers = new Headers(upstream.headers);
        headers.set("Cache-Control", "no-store");
        headers.set("Cloudflare-CDN-Cache-Control", "no-store");
        headers.set("X-Content-Type-Options", "nosniff");
        return new Response(upstream.body, { status: upstream.status, headers });
      } catch {
        return new Response(JSON.stringify({ error: "CocoX script service is temporarily unavailable." }), {
          status: 503,
          headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
        });
      }
    }
    return legacy.fetch(request);
  },
};
