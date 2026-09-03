import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const bundle = resolve(root, "bundle");
const frontend = resolve(root, "frontend");
const output = resolve(frontend, "dist/snip-frontend/browser");
const shouldPush = process.argv.includes("--push");

function run(command, args, cwd = root) {
  const result = spawnSync(command, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32" && ["npm", "npx"].includes(command),
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} failed with exit code ${result.status}`);
  }
}

function stagedChanges(cwd) {
  const result = spawnSync("git", ["diff", "--cached", "--quiet"], {
    cwd,
    stdio: "ignore",
    shell: false,
  });
  return result.status !== 0;
}

async function writeGeneratedFiles() {
  await cp(resolve(root, "backend/server.js"), resolve(bundle, "server.js"));
  await cp(resolve(root, "cli/cli.js"), resolve(bundle, "cli.js"));
  await rm(resolve(bundle, "public"), { recursive: true, force: true });
  await cp(output, resolve(bundle, "public"), { recursive: true });
  await writeFile(resolve(bundle, ".env"), "PUBLIC_DIR=./public\n");
  await writeFile(resolve(bundle, "package.json"), JSON.stringify({
    name: "snip-bundle",
    scripts: { start: "bun server.js" },
  }, null, 2) + "\n");
  await writeFile(resolve(bundle, "Dockerfile"), [
    "FROM oven/bun:1-alpine",
    "WORKDIR /app",
    "COPY . .",
    "ENV PORT=3000",
    "EXPOSE 3000",
    "CMD [\"bun\", \"server.js\"]",
    "",
  ].join("\n"));
  await writeFile(resolve(bundle, ".dockerignore"), [
    ".git",
    "README.md",
    "node_modules",
    "",
  ].join("\n"));
  await writeFile(resolve(bundle, "railway.json"), JSON.stringify({
    "$schema": "https://railway.app/railway.schema.json",
    build: { builder: "DOCKERFILE" },
  }, null, 2) + "\n");
}

async function main() {
  run("git", ["submodule", "update", "--init", "--remote", "backend", "frontend", "cli"]);
  run("npm", ["install"], frontend);
  run("npx", ["ng", "build"], frontend);
  if (!existsSync(resolve(output, "index.html"))) {
    throw new Error(`Angular build output missing: ${resolve(output, "index.html")}`);
  }

  await mkdir(bundle, { recursive: true });
  await writeGeneratedFiles();

  run("git", ["add", "-A"], bundle);
  if (stagedChanges(bundle)) {
    run("git", ["commit", "-m", "Build generated bundle"], bundle);
  } else {
    console.log("bundle: unchanged");
  }

  run("git", ["add", "backend", "frontend", "cli", "bundle"], root);
  if (stagedChanges(root)) {
    run("git", ["commit", "-m", "Update generated bundle"], root);
  } else {
    console.log("main: unchanged");
  }

  if (shouldPush) {
    run("git", ["push", "origin", "HEAD:bundle"], bundle);
    run("git", ["push", "origin", "main"], root);
  }
}

main().catch((error) => {
  console.error(`build-bundle: ${error.message}`);
  process.exitCode = 1;
});
