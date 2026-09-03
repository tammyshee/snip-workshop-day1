# Snip repository rules

Keep this file and `.github/copilot-instructions.md` identical and in sync.

Snip is a Git superproject: `main` pins one submodule per application layer.
Each layer has its own orphan branch and files at that branch's root.

| Path | Branch | Stack / role |
| --- | --- | --- |
| `backend/` | `backend` | Bun API, zero dependencies |
| `frontend/` | `frontend` | Angular 19 standalone web UI |
| `cli/` | `cli` | Node CommonJS CLI, zero dependencies |
| `bundle/` | `bundle` | Generated Bun release and built UI |

## API contract

Keep this contract synchronized across backend, frontend, CLI, and docs; change
it everywhere or nowhere:

- `POST /api/links` with `{ "url": "https://..." }` returns `201` and
  `{ code, url, shortUrl, hits, createdAt }`, or `400`.
- `GET /api/links` returns the link array.
- `GET /:code` redirects with `302` and increments hits, or returns `404`.

## Commands and workflow

```bash
git submodule update --init --recursive
cd backend && bun start
cd frontend && npm install && npx ng serve
cd cli && node cli.js add|ls|open ...
node scripts/build-bundle.mjs [--push]
```

Edit inside a layer, then commit and push its branch. From `main`, run
`git submodule update --remote <path>`, commit the gitlink pointer bump, and
push. Regenerate the release with `node scripts/build-bundle.mjs --push`.

## Do / Don't

- Do keep backend and CLI dependency-free; storage is an in-memory map by design.
- Do preserve `dist/snip-frontend/browser/index.html`; the Angular output path
  is load-bearing.
- Don't hand-edit generated files in `bundle/`; edit sources and regenerate.
- Don't add `"type": "module"` near `cli.js`; it must remain CommonJS.
- Don't add a push trigger to bundle CI; its schedule-only behavior is deliberate.
- Don't change Docker CI's `paths: [bundle, ...]`: it watches the bundle
  **gitlink**, not files inside the submodule.
