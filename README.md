# Pass Blaster

A game that replaces the price calculator on upchieve.org/schools. You stamp your schools, pick each one's size, hand the admin the power-up, and click forever.

Play it: https://chrisshaw.github.io/upchieve-pass-blaster/

## Build

```bash
python3 build.py
```

This writes three files from `src/`:

- `pass-blaster-embed.html`: paste the whole thing into a Squarespace Code block.
- `pass-blaster.html`: the standalone preview page.
- `docs/index.html`: the GitHub Pages site. Commit it after building so the live page updates.

## Gotchas

- The price tiers in `src/pb-core.js` (`TIERS`) are a copy of the old calculator's. Change both if pricing changes.
- `build.py` escapes every non-ASCII character in the JS, so the snippet works no matter what encoding the host page declares.
- The art in `src/assets/` comes from the UPchieve Illustrations library in Figma. `build.py` inlines it, so the snippet has no outside files.

`archive/` holds v1 and v2 for comparison.
