# Snip CLI

Zero-dependency Node CLI for the Snip URL shortener. Node 18 or later is
required for the built-in `fetch`.

```bash
node cli.js add https://example.com
node cli.js ls
node cli.js open <code>
```

Set `SNIP_API` to use a backend other than `http://localhost:3000`.
