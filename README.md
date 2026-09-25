# Pass Blaster

A game that replaces the price calculator on upchieve.org/schools. You stamp your schools, pick each one's size, hand the admin the power-up, and click forever.

Preview: https://claude.ai/artifact/Cex3Eh7LRpZUjNY7BNCJMh

## Build

```bash
python3 build.py
```

This writes two files from `src/`:

- `pass-blaster-embed.html`: paste the whole thing into a Squarespace Code block.
- `pass-blaster.html`: the standalone preview page.

## Gotchas

- The price tiers in `src/pb-core.js` (`TIERS`) are a copy of the old calculator's. Change both if pricing changes.
- `build.py` escapes every non-ASCII character in the JS, so the snippet works no matter what encoding the host page declares.
- Drop an image at `src/updog.png` and the build inlines it as `UPDOG`. It isn't wired into v3 yet.

`archive/` holds v1 and v2 for comparison.
