# Snip Design Language

## Visual tokens

- **Background:** `#121010`; **surface:** `#1b1818`; elevated input: `#211d1d`
- **Text:** warm white `#fff8f4`; **muted:** `#aa9d9a` / `#817673`
- **Accent:** warm coral `#f5a28a`, with a soft coral/orange radial glow
- **Font:** DM Sans, then Arial/sans-serif
- **Type scale:** hero `clamp(2.8rem, 7vw, 5.5rem)`, section heading `1.7rem`, body `1rem`
- **Spacing:** 8px rhythm; generous hero padding; 24–30px card padding
- **Radii:** 14px controls, 20px hero input, 24px content cards
- **Borders and shadows:** subtle `#302a29` borders; no heavy shadows; use restrained glow

## Snip mapping

- The page header is the hero: centered eyebrow, bold headline, and muted subline.
- The URL form is a chat-style pill input with the primary action attached.
- Success and error notices are compact, rounded status surfaces.
- The links table is contained in a generously rounded dark card with a clear heading.
- The glow is a fixed, pointer-events-none band spanning the full viewport width.
