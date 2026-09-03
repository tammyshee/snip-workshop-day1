# Snip Backend

Tiny zero-dependency Bun URL-shortener API. Links are stored in memory and are
lost when the server restarts.

## Run

```bash
bun start
```

The server listens on port 3000 by default. Set `PORT`, `BASE_URL`, or
`RAILWAY_PUBLIC_DOMAIN` to configure deployment. Set `PUBLIC_DIR` to also serve
a static frontend (`/` serves `index.html`).

## API

- `POST /api/links` with `{ "url": "https://example.com" }`
- `GET /api/links`
- `GET /:code` redirects to the original URL and increments its hit count
