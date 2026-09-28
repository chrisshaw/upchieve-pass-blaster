# Builds the Squarespace code-block snippet and a standalone preview page from src/.
from pathlib import Path

src = Path(__file__).parent / 'src'
fonts = '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Work+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;1,700;1,800&display=swap">'
css = (src / 'pb.css').read_text()
html = (src / 'pb.html').read_text()
js = '\n'.join((src / f).read_text() for f in ['pb-core.js', 'pb-world.js', 'pb-draw.js', 'pb-ui.js'])
import base64, json
# Art from the UPchieve Illustrations library in Figma, inlined so the snippet has no outside files.
art = {p.stem: 'data:image/webp;base64,' + base64.b64encode(p.read_bytes()).decode() for p in sorted((src / 'assets').glob('*.webp'))}
meta = json.loads((src / 'assets' / 'meta.json').read_text())
js = 'var ART = ' + json.dumps(art) + ';\nvar ART_META = ' + json.dumps(meta) + ';\n' + js
js = '(function () {\n"use strict";\n' + js + '\n})();\n'
# Escape non-ASCII so the snippet works whatever encoding the host page declares.
def esc(ch):
    o = ord(ch)
    if o < 128:
        return ch
    if o > 0xFFFF:
        o -= 0x10000
        return '\\u%04x\\u%04x' % (0xD800 + (o >> 10), 0xDC00 + (o & 0x3FF))
    return '\\u%04x' % o
js = ''.join(esc(ch) for ch in js)

embed = f'<!-- Pass Blaster: UPchieve pricing game. Paste this whole block into a Squarespace Code block. -->\n{fonts}\n<style>\n{css}</style>\n{html}<script>\n{js}</script>\n'
(Path(__file__).parent / 'pass-blaster-embed.html').write_text(embed)
(src.parent / 'build' ).mkdir(exist_ok=True)
(src.parent / 'build' / 'pb.js').write_text(js)

page = f'''<meta charset="utf-8">
<title>Pass Blaster</title>
<meta name="description" content="Pass Blaster, an arcade-style pricing calculator for UPchieve school partnerships.">
<style>
  :root {{ color-scheme: light; }}
  body {{ background: #DEF4F0; color: #1C222B; padding-block: 32px 40px; padding-inline: 16px; font-family: \"Work Sans\", system-ui, sans-serif; }}
  .preview-note {{ max-width: 1180px; margin: 20px auto 0; font-size: 14px; color: #4A5261; }}
</style>
{embed}
<p class="preview-note">Preview of the embed for upchieve.org/schools. Prices use the same per-building tiers as the current calculator.</p>
'''
(Path(__file__).parent / 'pass-blaster.html').write_text(page)

# A full HTML document for GitHub Pages, which serves docs/ as the site root.
site = f'''<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pass Blaster</title>
<meta name="description" content="Pass Blaster, an arcade-style pricing calculator for UPchieve school partnerships.">
<style>
  body {{ margin: 0; background: #DEF4F0; color: #1C222B; padding: 32px 16px 40px; font-family: "Work Sans", system-ui, sans-serif; }}
</style>
</head>
<body>
{embed}
</body>
</html>
'''
(Path(__file__).parent / 'docs').mkdir(exist_ok=True)
(Path(__file__).parent / 'docs' / 'index.html').write_text(site)

# A loader for the Squarespace Code block: the snippet there stays two lines and this file,
# served by GitHub Pages, carries the fonts, styles, markup, and game.
loader = (
    "(function () {\n"
    "var host = document.getElementById('pass-blaster');\n"
    "if (!host || host.getAttribute('data-pb-mounted')) return;\n"
    "host.setAttribute('data-pb-mounted', '1');\n"
    "if (!document.querySelector('link[data-pb-fonts]')) {\n"
    "  var l = document.createElement('link'); l.rel = 'stylesheet'; l.setAttribute('data-pb-fonts', '');\n"
    "  l.href = " + json.dumps(fonts.split('href="')[1].split('"')[0]) + "; document.head.appendChild(l);\n"
    "}\n"
    "var st = document.createElement('style'); st.textContent = " + json.dumps(css) + "; document.head.appendChild(st);\n"
    "host.innerHTML = " + json.dumps(html) + ";\n"
    + js +
    "})();\n"
)
loader = ''.join(esc(ch) for ch in loader)
(Path(__file__).parent / 'docs' / 'embed.js').write_text(loader)
print(len(embed), 'bytes embed')
