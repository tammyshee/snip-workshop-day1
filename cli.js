#!/usr/bin/env node
const { execFile } = require("node:child_process");

const API = (process.env.SNIP_API || "http://localhost:3000").replace(/\/+$/, "");

function usage() {
  console.log(`Usage:
  snip add <url>    Create a short link
  snip ls           List all links
  snip open <code>  Open a short link in the browser`);
}

async function request(path, options) {
  let response;
  try {
    response = await fetch(`${API}${path}`, options);
  } catch {
    throw new Error(`Unable to reach backend at ${API}`);
  }
  let body;
  try {
    body = await response.json();
  } catch {
    body = {};
  }
  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return { response, body };
}

function openBrowser(target) {
  const command = process.platform === "win32"
    ? "start"
    : process.platform === "darwin"
      ? "open"
      : "xdg-open";
  const args = process.platform === "win32" ? ["", target] : [target];
  execFile(command, args, (error) => {
    if (error) console.error(`Could not open browser: ${error.message}`);
  });
}

async function main() {
  const [command, value] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help" || command === "-h") {
    usage();
    return;
  }

  if (command === "add") {
    if (!value) throw new Error("Usage: snip add <url>");
    try {
      const parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
    } catch {
      throw new Error("URL must use http or https");
    }
    const { body } = await request("/api/links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: value }),
    });
    console.log(body.shortUrl);
    return;
  }

  if (command === "ls") {
    const { body: links } = await request("/api/links");
    if (!links.length) {
      console.log("No links yet.");
      return;
    }
    const codeWidth = Math.max(4, ...links.map((link) => link.code.length));
    const hitsWidth = Math.max(4, ...links.map((link) => String(link.hits).length));
    console.log(`${"CODE".padEnd(codeWidth)}  ${"HITS".padStart(hitsWidth)}  URL`);
    for (const link of links) {
      console.log(`${link.code.padEnd(codeWidth)}  ${String(link.hits).padStart(hitsWidth)}  ${link.url}`);
    }
    return;
  }

  if (command === "open") {
    if (!value) throw new Error("Usage: snip open <code>");
    const { response } = await request(`/${encodeURIComponent(value)}`, { redirect: "manual" });
    const target = response.headers.get("location");
    if (response.status !== 302 || !target) throw new Error("Short link did not redirect");
    console.log(`Opening ${target}`);
    openBrowser(target);
    return;
  }

  throw new Error(`Unknown command: ${command}`);
}

main().catch((error) => {
  console.error(`Error: ${error.message}`);
  process.exitCode = 1;
});
