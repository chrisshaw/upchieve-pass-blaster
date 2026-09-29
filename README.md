# Pass Blaster

A game that replaces the price calculator on upchieve.org/schools. You stamp your schools, pick each one's size, hand the admin the power-up, and click forever.

It opens on a chooser: the same town painted two ways, split by a slanted divider. Hover a side and it grows to about three quarters of the frame; click or tap it to play that version. The knob on the divider works like a before/after slider's: drag it to see more of either side, drag it most of the way across (or flick it) to play that side, or tap it to swing over and peek at the other side, which is the phone's stand-in for hover.

- **Party mode** is the original: disco lights, fireworks, a fast chiptune loop.
- **Cozy mode** is the same game and the same prices at a slower pace, in a meadow of old-fashioned schoolhouses. There's no countdown, no streaks, and nothing bounces to the beat. The crisis is a gray, rainy spell, UPdog floats down under a hot-air balloon, and the power-up is a quiet moment: the admin floats up with eyes closed while UPdog's star, turned into a will-o'-wisp, winds around the Tutoring bar and fills it. Then a ring of warm light spreads out and wakes each school, and the admin and UPdog clink mugs. After that every school has a wisp and a few leaves circling it, and the wisp now and then visits a window to help a kid inside, day and night. Fireflies come out at dusk, and a few gather around each powered school. Clicking a school sends its wisp spiraling and brings its kids out to clink mugs and raise them to you.

"Play again" goes back to the chooser.

Play it: https://chrisshaw.github.io/upchieve-pass-blaster/

## Put it on upchieve.org/schools

1. In the Squarespace editor, add a Code block where the game should go.
2. Paste this into it:

   ```html
   <div id="pass-blaster"></div>
   <script src="https://chrisshaw.github.io/upchieve-pass-blaster/embed.js"></script>
   ```

3. Remove the old calculator. In the Code block that holds the "Affordable pricing" section, delete the `<div class="fs-card fs-card--calc">…</div>` card. That block's script already handles the card being gone.

The snippet loads the game from this repo's GitHub Pages site, so pushing a new build updates the live page (Pages caches for about 10 minutes). That also means the page depends on this repo staying public with Pages turned on. If that's a problem, paste the whole of `pass-blaster-embed.html` into the Code block instead: it's the same game with nothing loaded from outside, about 255KB.

## Build

```bash
python3 build.py
```

This writes four files from `src/`:

- `docs/embed.js`: what the Squarespace snippet loads.
- `docs/index.html`: the GitHub Pages site.
- `pass-blaster-embed.html`: the self-contained snippet.
- `pass-blaster.html`: the standalone preview page.

Commit `docs/` after building so the live page and the Squarespace embed update.

## Gotchas

- The price tiers in `src/pb-core.js` (`TIERS`) are a copy of the old calculator's. Change both if pricing changes.
- The embed expects one game per page: it mounts into the element with `id="pass-blaster"`.
- Its styles are scoped under `.pb` and reset buttons and headings, since Squarespace themes style those globally.
- `build.py` escapes every non-ASCII character in the JS, so the embed works no matter what encoding the host page declares.
- The art in `src/assets/` comes from the UPchieve Illustrations library in Figma. `build.py` inlines it, so the game loads no image files.
- Cozy mode's headlines use Fraunces, loaded from Google Fonts next to Work Sans.
- In cozy mode UPdog sits up, so he's built from the power-up art (`star.webp`) instead of `dog.webp`: when the game first draws him, a copy has the star turned to fur, the logo taken out and a fresh white border drawn, and his front paws are drawn each frame so he can hold a mug, sip, and reach over to clink. The recoloring thresholds and the shoulder, paw and mug positions are in `src/pb-cozy.js` (`makeUpright` and `UP_*`), in the art's own pixels, so they need updating if `star.webp` changes.
- In cozy mode a second canvas (`#pb-over`) sits above the page's meters, so the power-up wisp can pass in front of the Tutoring bar as well as behind it.
- Party mode's drawing lives in `src/pb-draw.js` and cozy mode's in `src/pb-cozy.js`. Each check of `MODE` picks one or the other, so changing one mode doesn't touch the other. Wording that differs between the modes is in the `TEXT` table in `src/pb-ui.js`.
- The chooser (`src/pb-choose.js`) draws the whole scene twice per frame, once for each half. Particles tagged with `PART_TAG` show on one half only.

`archive/` holds v1 and v2 for comparison.
