# Snip

Snip is a tiny URL shortener demonstrating a Git submodule architecture:
one Bun backend serves both an Angular web client and a Node CLI.

## Layout

| Folder | Branch | Purpose |
| --- | --- | --- |
| `backend/` | `backend` | Bun API and redirects |
| `frontend/` | `frontend` | Angular 19 web application |
| `cli/` | `cli` | Zero-dependency Node CLI |

The folders are submodules pointing to exact commits on branches in this
repository. Storage is an in-memory map, so restarting the backend clears links.

The `bundle/` submodule is generated from these three source layers by
`node scripts/build-bundle.mjs`. It contains one Bun process serving the API,
redirects, and built web UI, plus the CLI. Do not hand-edit generated bundle
files.

## API

| Method | Path | Response |
| --- | --- | --- |
| `POST` | `/api/links` with `{ "url": "https://..." }` | `201` link object, or `400` |
| `GET` | `/api/links` | `200` array of link objects |
| `GET` | `/:code` | `302` redirect and hit increment, or `404` |

## Clone and run

Use `--recurse-submodules` so the folders are populated:

```bash
git clone --recurse-submodules https://github.com/tammyshee/snip-workshop-day1.git
cd snip-demo
cd backend && bun start
cd ../frontend && npm install && npx ng serve
cd ../cli && node cli.js ls
```

## Updating a layer

Commit and push changes inside the submodule first. Then update its pinned
commit from the superproject:

```bash
git submodule update --remote backend
git add backend
git commit -m "Bump backend submodule"
git push
```

To regenerate and publish the bundle release:

```bash
node scripts/build-bundle.mjs --push
```
