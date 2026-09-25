var cv = $('pb-canvas'), g = cv.getContext('2d');
var PIXEL = '"Press Start 2P", monospace';
var STARS = [], TUFTS = [], CLOUDS = [];
(function seed() {
  for (var i = 0; i < 80; i++) STARS.push({ x: Math.random(), y: Math.random() * 0.33, tw: Math.random() * 6 });
  for (var j = 0; j < 110; j++) TUFTS.push({ x: Math.random(), y: Math.random() });
  for (var k = 0; k < 4; k++) CLOUDS.push({ x: Math.random(), y: rand(0.1, 0.24), s: rand(0.8, 1.4), v: rand(0.004, 0.01) });
})();

function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(a, b, t) {
  var A = rgb(a), B = rgb(b);
  return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
}
var dkCache = {};
function dk(hex, n) {
  var key = hex + (n * 20 | 0);
  return dkCache[key] || (dkCache[key] = mix(hex, '#0B1030', (n * 20 | 0) / 20 * 0.55));
}
var SKY = [[0, '#0B1030', '#1B2350'], [5, '#141A45', '#2E2A63'], [6.5, '#FF9E7A', '#FFD6A0'], [8, '#5FA8FF', '#BFE3FF'],
  [17, '#5FA8FF', '#BFE3FF'], [18.5, '#FF7EB3', '#FFC38A'], [20, '#141A45', '#2E2A63'], [24, '#0B1030', '#1B2350']];
function skyAt(m) {
  var h = (m % 1440) / 60;
  for (var i = 0; i < SKY.length - 1; i++) {
    var a = SKY[i], b = SKY[i + 1];
    if (h >= a[0] && h <= b[0]) {
      var t = (h - a[0]) / (b[0] - a[0]);
      return [mix(a[1], b[1], t), mix(a[2], b[2], t)];
    }
  }
  return ['#0B1030', '#1B2350'];
}

function px(x, y, w, h, c) { g.fillStyle = c; g.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h)); }

function drawSky(nt) {
  var G = S.G, W = S.W, P = S.P;
  var gloomy = S.phase === 'crisis' || S.phase === 'shop';
  var c = gloomy ? ['#6E7891', '#AEB5C7'] : skyAt(S.clock);
  var grad = g.createLinearGradient(0, 0, 0, G.horizon);
  grad.addColorStop(0, c[0]); grad.addColorStop(1, c[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, G.horizon + 2);

  if (nt > 0 && !gloomy) {
    STARS.forEach(function (s) {
      var a = nt * (0.5 + 0.5 * Math.sin(S.t * 2 + s.tw));
      g.globalAlpha = a;
      px(s.x * W, s.y * S.H, P * 0.7, P * 0.7, '#FFFFFF');
    });
    g.globalAlpha = 1;
  }

  var h = (S.clock % 1440) / 60;
  if (!gloomy) {
    var t, x, y;
    if (h >= 6 && h <= 19) {
      t = (h - 6) / 13; x = W * (0.08 + 0.84 * t); y = G.horizon - Math.sin(Math.PI * t) * G.horizon * 0.72;
      px(x - 4 * P, y - 3 * P, 8 * P, 6 * P, '#FFE066');
      px(x - 3 * P, y - 4 * P, 6 * P, 8 * P, '#FFE066');
      px(x - 2 * P, y - 2 * P, 3 * P, 2 * P, '#FFF6C9');
    } else {
      var hn = h < 6 ? h + 24 : h;
      t = (hn - 19) / 11; x = W * (0.08 + 0.84 * t); y = G.horizon - Math.sin(Math.PI * t) * G.horizon * 0.72;
      px(x - 3 * P, y - 3 * P, 6 * P, 6 * P, '#F4F1FF');
      px(x - 1 * P, y - 3 * P, 4 * P, 4 * P, c[0]);
    }
  }

  // A little rocket crosses the night sky, for the Math Blaster fans.
  if ((nt > 0.7 && S.phase === 'unlimited') || S.phase === 'title' || S.phase === 'select') {
    var span = W + 300, rx = (S.t * 70) % span - 150, ry = G.horizon * 0.3 + Math.sin(S.t * 0.8) * 10;
    px(rx, ry, 8 * P, 3 * P, '#E8E8F0');
    px(rx + 8 * P, ry + P, 2 * P, P, '#FF5EA8');
    px(rx + 2 * P, ry - P, 3 * P, P, '#5FA8FF');
    px(rx + 2 * P, ry + 3 * P, 3 * P, P, '#5FA8FF');
    px(rx - (2 + (S.t * 12 | 0) % 2) * P, ry + P, 2 * P, P, '#FFD23F');
  }

  if (nt < 1) {
    g.globalAlpha = gloomy ? 1 : 1 - nt;
    CLOUDS.forEach(function (cl) {
      var cx = ((cl.x + S.t * cl.v) % 1.3 - 0.15) * W, cy = cl.y * S.H, s = cl.s * P, col = gloomy ? '#8A90A3' : '#FFFFFF';
      px(cx, cy, 16 * s, 4 * s, col);
      px(cx + 3 * s, cy - 3 * s, 8 * s, 3 * s, col);
      px(cx + 9 * s, cy - 2 * s, 5 * s, 2 * s, col);
    });
    g.globalAlpha = 1;
  }
}

function drawGround(nt) {
  var G = S.G, W = S.W, H = S.H, P = S.P, step = P * 4;
  for (var x = 0; x < W; x += step) {
    var hh = (Math.sin(x * 0.012) + Math.sin(x * 0.027 + 1.3) + 2) * P * 3.2;
    px(x, G.horizon - hh, step, hh + 2, dk('#4E9A5B', nt));
  }
  px(0, G.horizon, W, G.roadTop - G.horizon, dk('#79C267', nt));
  var tuft = dk('#5FA653', nt);
  TUFTS.forEach(function (t) { px(t.x * W, G.horizon + t.y * (G.roadTop - G.horizon), P * 2, P, tuft); });
  px(0, G.roadTop, W, P * 2, dk('#C9C3B5', nt));
  px(0, G.roadTop + P * 2, W, H - G.roadTop, dk('#3D3F4A', nt));
  for (var d = 0; d < W; d += P * 12) px(d, G.roadMid, P * 6, P, dk('#FFD23F', nt));
}

function windowColor(i) {
  if (S.phase === 'crisis' || S.phase === 'shop') return '#6B7280';
  if (isParty()) return 'hsl(' + ((S.t * 140 + i * 47) % 360 | 0) + ',95%,62%)';
  if (S.phase === 'unlimited') return nightness(S.clock) > 0.3 ? '#FFE58A' : '#FFF3B0';
  return '#BFE3FF';
}

function drawSchool(s, nt) {
  var d = dims(s), u = s.u, W = d.w, H = d.h;
  var x0 = s.x - W / 2 * u, top = s.y + s.drop - H * u;
  function R(x, y, w, h, c) { px(x0 + x * u, top + y * u, w * u, h * u, c); }
  var party = isParty(), crisis = S.phase === 'crisis' || S.phase === 'shop';
  var brick = dk('#C0533A', nt), mortar = dk('#A8452F', nt), trim = dk('#7A2E1E', nt), cream = dk('#F2E6D0', nt);

  if (s.landed) R(-1, H, W + 2, 1, 'rgba(0,0,0,.18)');

  if (s.size >= 100000) {
    R(0, 0, W, H, dk('#5C6B8A', nt));
    R(W / 2, -10, 1, 10, '#DDD');
    R(W / 2 - 1, -11, 3, 1, S.t % 1 < 0.5 ? '#FF4D4D' : '#661111');
    for (var my = 3; my < H - 10; my += 4) for (var mx = 3; mx < W - 3; mx += 5) R(mx, my, 3, 2, windowColor(mx + my));
    R(W / 2 - 3, H - 7, 6, 7, dk('#2B2D42', nt));
    R(W / 2 - 8, H - 10, 16, 2, cream);
  } else {
    R(0, 2, W, H - 2, brick);
    g.fillStyle = mortar;
    for (var yy = 5; yy < H; yy += 3) g.fillRect(Math.round(x0), Math.round(top + yy * u), Math.ceil(W * u), Math.max(1, Math.round(u * 0.35)));
    R(-1, 0, W + 2, 2, trim);
    var pw = Math.min(W, 16);
    for (var i = 0; i < 4; i++) R(W / 2 - pw / 2 + i * 2, -1 - i, pw - i * 4, 1, trim);
    if (tierOf(s.size) === 0) {
      R(W / 2 - 3, -10, 6, 6, cream);
      R(W / 2 - 4, -11, 8, 1, trim);
      R(W / 2 - 1, -9, 2, 2, '#FFD23F');
    }
    R(3, -10, 1, 10, '#E5E5E5');
    for (var f = 0; f < 5; f++) R(4 + f, -10 + (Math.sin(S.t * 6 + f) > 0 ? 0 : 1), 1, 3, crisis ? '#8A8F99' : '#FF5EA8');

    var dx = W / 2, ws = tierOf(s.size) === 0 ? 3 : 4, pitch = ws + 2, wi = 0;
    [[2, dx - 7], [dx + 7, W - 2]].forEach(function (wing) {
      var ww = wing[1] - wing[0], cols = Math.max(1, Math.floor((ww + 2) / pitch));
      var start = wing[0] + (ww - (cols * pitch - 2)) / 2;
      for (var wy = 4; wy + ws <= H - 3; wy += pitch) {
        for (var c = 0; c < cols; c++) {
          var wx = start + c * pitch;
          R(wx, wy, ws, ws, windowColor(wi));
          if (party) {
            var bob = Math.sin(S.t * 12 + wi * 1.7) > 0 ? 0 : 1;
            R(wx + 1, wy + 1 + bob, ws - 2, ws - 1 - bob, '#1B1033');
          } else if (!crisis && S.phase !== 'unlimited') {
            R(wx, wy, 1, 1, '#FFFFFF');
          }
          wi++;
        }
      }
    });
    if (tierOf(s.size) >= 2) { R(dx - 6, H - 9, 1, 9, cream); R(dx + 5, H - 9, 1, 9, cream); }
    R(dx - 7, H - 12, 14, 3, cream);
    R(dx - 5, H - 11, 10, 1, dk('#7A7266', nt));
    R(dx - 3, H - 7, 6, 7, dk('#5B3A1E', nt));
    R(dx - 2, H - 6, 4, 2, windowColor(99));
    R(dx - 5, H - 1, 10, 1, dk('#BDB6A6', nt));
  }

  if (s.hit > 0) {
    g.globalAlpha = Math.min(0.7, s.hit / 0.16 * 0.7);
    R(-1, -2, W + 2, H + 2, '#FFFFFF');
    g.globalAlpha = 1;
  }

  if (crisis && s.landed) {
    var cy = -18, cw = Math.min(W, 24), cx = W / 2 - cw / 2;
    R(cx, cy, cw, 4, '#6B7080');
    R(cx + 3, cy - 3, cw - 8, 3, '#6B7080');
    for (var r = 0; r < 6; r++) {
      var ry = ((S.t * 26 + r * 5) % 12);
      R(cx + 2 + r * (cw - 4) / 6, cy + 5 + ry, 0.6, 2, '#9BB8E8');
    }
  }
}

function drawCar(x, y, col, nt) {
  var c = S.P * 0.8, ox = x - 6 * c, oy = y - 6 * c;
  function R(a, b, w, h, k) { px(ox + a * c, oy + b * c, w * c, h * c, k); }
  var body = dk(col, nt);
  R(3, 0, 6, 2, body);
  R(4, 1, 4, 1, dk('#BFE3FF', nt));
  R(0, 2, 12, 3, body);
  R(2, 5, 2, 1, '#111'); R(8, 5, 2, 1, '#111');
  R(11, 3, 1, 1, nt > 0.4 ? '#FFF3B0' : '#EEE');
  if (nt > 0.4) { g.globalAlpha = 0.25; R(12, 2.5, 8, 2, '#FFF3B0'); g.globalAlpha = 1; }
}

function drawPlayer() {
  var role = S.role || ROLES[2], P = S.P, x = S.W * 0.05 + 4 * P, y = S.G.roadTop + 2 * P;
  var pal = { h: role.hair, s: role.skin, e: '#1B1B1B', c: role.suit, k: '#FFD23F', p: '#2B2D42', f: '#111' };
  if (S.unlimited) {
    var hue = (S.t * 400) % 360 | 0;
    pal.c = 'hsl(' + hue + ',90%,55%)';
    pal.h = S.t % 0.2 < 0.1 ? '#FFD23F' : '#FFF6C9';
    for (var i = 0; i < 10; i++) {
      var a = S.t * 5 + i * 0.63, r = 9 * P + Math.sin(S.t * 9 + i) * 2 * P;
      px(x + Math.cos(a) * r, y - 6 * P + Math.sin(a) * r, P, P, i % 2 ? '#FFD23F' : '#FFFFFF');
    }
  }
  drawSprite(g, ADULT[0], x, y, P * 0.75, pal);
  g.font = Math.max(7, P * 2.4) + 'px ' + PIXEL;
  g.textAlign = 'center';
  g.fillStyle = '#FFD23F';
  g.fillText('P1', x, y - 11 * P);
}

function drawFloats() {
  g.textAlign = 'center';
  g.lineJoin = 'round';
  S.floats.forEach(function (f) {
    g.globalAlpha = Math.min(1, f.life / f.max * 1.5);
    if (f.note) { drawSprite(g, NOTE, f.x, f.y, S.P * 0.8, { '#': f.c }); return; }
    var size = Math.round(f.size * S.P / 3);
    g.font = size + 'px ' + PIXEL;
    g.lineWidth = Math.max(2, size / 3);
    g.strokeStyle = '#000';
    g.strokeText(f.text, f.x, f.y);
    g.fillStyle = f.c;
    g.fillText(f.text, f.x, f.y);
  });
  g.globalAlpha = 1;
}

function render() {
  var nt = S.phase === 'crisis' || S.phase === 'shop' ? 0 : nightness(S.clock);
  g.save();
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (S.shake > 0) g.translate(rand(-1, 1) * S.shake * 14, rand(-1, 1) * S.shake * 14);
  g.imageSmoothingEnabled = false;
  drawSky(nt);
  drawGround(nt);

  var list = [];
  S.schools.forEach(function (s) { list.push({ y: s.y, k: 0, o: s }); });
  S.kids.forEach(function (k) { list.push({ y: k.y, k: 1, o: k }); });
  S.teachers.forEach(function (tc) {
    if (tc.state !== 'away') list.push({ y: tc.cy, k: 2, o: tc });
    if (tc.state === 'walkout' || tc.state === 'walkin') list.push({ y: tc.py, k: 3, o: tc });
  });
  list.sort(function (a, b) { return a.y - b.y; });
  var ku = S.P * 0.75;
  list.forEach(function (e) {
    var o = e.o;
    if (e.k === 0) drawSchool(o, nt);
    else if (e.k === 1) {
      var moving = o.pause <= 0 || o.mode === 'go';
      drawSprite(g, KID[moving ? (o.ph | 0) % 2 : 0], o.x, o.y - (moving && (o.ph | 0) % 2 ? ku : 0), ku, o.pal);
    }
    else if (e.k === 2) drawCar(o.cx, o.cy, o.car, nt);
    else drawSprite(g, ADULT[(o.ph | 0) % 2], o.px, o.py, S.P * 0.7, o.pal);
  });

  if (S.phase !== 'title' && S.phase !== 'select') drawPlayer();

  S.parts.forEach(function (p) {
    g.globalAlpha = Math.min(1, p.life * 2);
    px(p.x, p.y, p.s, p.s, p.c);
  });
  g.globalAlpha = 1;
  drawFloats();

  if (S.flash > 0) {
    g.globalAlpha = Math.min(1, S.flash * 2);
    px(-20, -20, S.W + 40, S.H + 40, '#FFFFFF');
    g.globalAlpha = 1;
  }
  g.restore();
}
