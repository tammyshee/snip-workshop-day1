import { join, normalize, resolve, sep } from "node:path";

const links = new Map();
const PORT = Number.parseInt(process.env.PORT || "3000", 10);
const baseUrl = (process.env.BASE_URL ||
  (process.env.RAILWAY_PUBLIC_DOMAIN
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : `http://localhost:${PORT}`)).replace(/\/+$/, "");
const publicDir = process.env.PUBLIC_DIR
  ? resolve(process.env.PUBLIC_DIR)
  : null;

const alphabet = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

function createCode() {
  let code;
  do {
    code = Array.from({ length: 6 }, () =>
      alphabet[Math.floor(Math.random() * alphabet.length)]
    ).join("");
  } while (links.has(code));
  return code;
}

function json(body, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Access-Control-Allow-Origin": "*" },
  });
}

function isSafePublicPath(pathname) {
  if (!publicDir) return false;
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  if (relativePath.includes("\0")) return false;
  const resolved = normalize(resolve(publicDir, relativePath));
  return resolved === publicDir || resolved.startsWith(`${publicDir}${sep}`);
}

async function servePublic(pathname) {
  if (!isSafePublicPath(pathname)) return null;
  const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
  const file = Bun.file(join(publicDir, relativePath));
  return (await file.exists()) ? new Response(file) : null;
}

const server = Bun.serve({
  port: PORT,
  async fetch(request) {
    const headers = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };
    const url = new URL(request.url);

    if (request.method === "OPTIONS") return new Response(null, { headers });

    if (request.method === "POST" && url.pathname === "/api/links") {
      let body;
      try {
        body = await request.json();
      } catch {
        return new Response(JSON.stringify({ error: "Invalid JSON" }), {
          status: 400,
          headers: { ...headers, "Content-Type": "application/json" },
        });
      }

      let originalUrl;
      try {
        originalUrl = new URL(body?.url);
      } catch {
        return json({ error: "URL must use http or https" }, 400);
      }
      if (!["http:", "https:"].includes(originalUrl.protocol)) {
        return json({ error: "URL must use http or https" }, 400);
      }

      const code = createCode();
      const link = {
        code,
        url: originalUrl.toString(),
        shortUrl: `${baseUrl}/${code}`,
        hits: 0,
        createdAt: new Date().toISOString(),
      };
      links.set(code, link);
      return json(link, 201);
    }

    if (request.method === "GET" && url.pathname === "/api/links") {
      return json([...links.values()]);
    }

    if (request.method === "GET") {
      const publicResponse = await servePublic(url.pathname);
      if (publicResponse) {
        for (const [key, value] of Object.entries(headers)) {
          publicResponse.headers.set(key, value);
        }
        return publicResponse;
      }

      const code = decodeURIComponent(url.pathname.slice(1));
      const link = links.get(code);
      if (link && url.pathname !== "/") {
        link.hits += 1;
        return new Response(null, {
          status: 302,
          headers: { ...headers, Location: link.url },
        });
      }
    }

    return json({ error: "Not found" }, 404);
  },
});

console.log(`Snip backend listening on ${server.url}`);
