// Cozy mode: the same game on a slow autumn afternoon. Schools become old-fashioned schoolhouses in
// a meadow, the crisis is a gray, rainy spell, and the power-up is a quiet moment: the admin floats up,
// breathes, and a soft ring of light spreads over the town. After that, each school has a little
// caretaker spirit that drifts over the roof and now and then visits a window to help a kid inside.
var LEAVES = ['#E07A3F', '#E8A33D', '#C2452D', '#F2CC60', '#B5562E'];
var COZY_WALLS = ['#C8553D', '#D9A441', '#B5452E', '#8FA36B', '#C8553D', '#E3CFA0'];
var COZY_ROOF = '#5B3B33', COZY_TRIM = '#FFF7E8', COZY_DOOR = '#2F5D50';
var SCARVES = ['#C8553D', '#E8A33D', '#6FA8C8', '#8FA36B', '#9C89B8', '#E07A5F'];
var SERIF = '"Fraunces", Georgia, "Times New Roman", serif';
var COZY_SKY = [[0, '#1E1A3A', '#3A2F57'], [5, '#2A2450', '#4D3F6B'], [6.5, '#F6B9A0', '#FCE2C4'], [8, '#A9CFE0', '#F6E9D0'],
  [17, '#A9CFE0', '#F6E9D0'], [18.5, '#EE9A78', '#FBD3A1'], [19.3, '#5B4A8B', '#E8A08A'], [20, '#2A2450', '#4D3F6B'], [24, '#1E1A3A', '#3A2F57']];
var GLOOM_SKY = ['#8C95A4', '#BCC2CB'];
var COZY_CLOUDS = [], TREES = [], FLOWERS = [], TOADSTOOLS = [], PEBBLES = [];
(function seedCozy() {
  for (var i = 0; i < 9; i++) COZY_CLOUDS.push({ x: Math.random() * 1.3, y: rand(0.1, 0.62), s: rand(0.8, 1.4), v: rand(0.002, 0.004), storm: i >= 5 });
  for (var j = 0; j < 16; j++) TREES.push({ x: (j + rand(-0.3, 0.3)) / 15, s: rand(0.75, 1.3), c: pick(['#D9622B', '#E8A33D', '#C2452D', '#E07A3F', '#B8A13A']), ph: rand(0, 6) });
  for (var f = 0; f < 80; f++) FLOWERS.push({ x: Math.random(), y: Math.random(), t: (Math.random() * 4) | 0, r: rand(0.8, 1.2) });
  for (var m = 0; m < 7; m++) TOADSTOOLS.push({ x: rand(0.04, 0.96), y: rand(0.05, 0.95), s: rand(0.8, 1.2) });
  for (var p = 0; p < 50; p++) PEBBLES.push({ x: Math.random(), y: Math.random(), s: rand(0.8, 1.6), c: Math.random() < 0.5 ? '#B08E67' : '#DCC19B' });
})();

// Colors darken toward a plum night and gray out in the rain.
var czCache = {};
function cz(hex, nt) {
  var q = (nt * 20) | 0, gq = (S.gloom * 20) | 0, key = hex + q + ',' + gq;
  if (czCache[key]) return czCache[key];
  var c = rgb(hex), n = rgb('#1D1636'), gr = rgb('#8A93A3'), t = q / 20 * 0.45, u = gq / 20 * 0.35, o = [];
  for (var i = 0; i < 3; i++) o.push(Math.round(lerp(lerp(c[i], n[i], t), gr[i], u)));
  return (czCache[key] = 'rgb(' + o.join(',') + ')');
}
function mixArr(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }
function css(a) { return 'rgb(' + Math.round(a[0]) + ',' + Math.round(a[1]) + ',' + Math.round(a[2]) + ')'; }
function smooth(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
function cozySky() {
  var h = (S.clock % 1440) / 60, top = rgb('#1E1A3A'), bot = rgb('#3A2F57');
  for (var i = 0; i < COZY_SKY.length - 1; i++) {
    var a = COZY_SKY[i], b = COZY_SKY[i + 1];
    if (h >= a[0] && h <= b[0]) {
      var t = (h - a[0]) / (b[0] - a[0]);
      top = mixArr(rgb(a[1]), rgb(b[1]), t); bot = mixArr(rgb(a[2]), rgb(b[2]), t);
      break;
    }
  }
  return [css(mixArr(top, rgb(GLOOM_SKY[0]), S.gloom)), css(mixArr(bot, rgb(GLOOM_SKY[1]), S.gloom))];
}

function drawCozySky(nt) {
  var G = S.G, W = S.W, k = S.k, gl = S.gloom, c = cozySky();
  var grad = g.createLinearGradient(0, 0, 0, G.horizon);
  grad.addColorStop(0, c[0]); grad.addColorStop(1, c[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, G.horizon + 4);

  if (nt > 0 && gl < 1) {
    g.fillStyle = '#FFFFFF';
    STARS.forEach(function (s) {
      g.globalAlpha = nt * (1 - gl) * (0.55 + 0.45 * Math.sin(S.t * 0.7 + s.tw));
      circle(s.x * W, s.y * G.horizon * 0.95, 1.2 * k);
      g.fill();
    });
    g.globalAlpha = 1;
  }

  var h = (S.clock % 1440) / 60, t, x, y;
  g.globalAlpha = 1 - gl;
  if (h >= 6 && h <= 19) {
    t = (h - 6) / 13; x = W * (0.08 + 0.84 * t); y = G.horizon - Math.sin(Math.PI * t) * G.horizon * 0.7;
    var glow = g.createRadialGradient(x, y, 0, x, y, 80 * k);
    glow.addColorStop(0, 'rgba(255,214,140,.6)'); glow.addColorStop(1, 'rgba(255,214,140,0)');
    g.fillStyle = glow; g.fillRect(x - 80 * k, y - 80 * k, 160 * k, 160 * k);
    circle(x, y, 26 * k); paint('#FFD27A', '#F2A93B', 3 * k);
  } else {
    var hn = h < 6 ? h + 24 : h;
    t = (hn - 19) / 11; x = W * (0.08 + 0.84 * t); y = G.horizon - Math.sin(Math.PI * t) * G.horizon * 0.7;
    var mg = g.createRadialGradient(x, y, 0, x, y, 60 * k);
    mg.addColorStop(0, 'rgba(255,240,210,.28)'); mg.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = mg; g.fillRect(x - 60 * k, y - 60 * k, 120 * k, 120 * k);
    circle(x, y, 20 * k); paint('#FFF3D6');
    circle(x + 9 * k, y - 5 * k, 17 * k); paint(c[0]);
  }
  g.globalAlpha = 1;

  // Gray clouds roll in with the rain and drift off once the light comes back.
  COZY_CLOUDS.forEach(function (cl) {
    var a = cl.storm ? gl : Math.max(1 - nt, gl) * 0.95;
    if (a <= 0.01) return;
    var cx = ((cl.x + S.t * cl.v + S.cloudShift) % 1.3 - 0.15) * W, cy = cl.y * G.horizon, s = cl.s * k * (cl.storm ? 1.25 : 1);
    g.globalAlpha = a;
    g.fillStyle = mix('#FFFFFF', '#8E96A4', gl);
    circle(cx, cy, 18 * s); g.fill();
    circle(cx + 20 * s, cy - 9 * s, 23 * s); g.fill();
    circle(cx + 43 * s, cy, 17 * s); g.fill();
    rr(cx - 10 * s, cy, 66 * s, 14 * s, 7 * s); g.fill();
  });
  g.globalAlpha = 1;
}

function drawTrees(nt) {
  var G = S.G, k = S.k;
  TREES.forEach(function (tr) {
    var x = tr.x * S.W, y = G.horizon + 2 * k, s = tr.s * k, sway = Math.sin(S.t * 0.8 + tr.ph) * 0.8 * s;
    g.fillStyle = cz('#6B4A35', nt);
    g.fillRect(x - 2 * s, y - 14 * s, 4 * s, 14 * s);
    g.fillStyle = cz(tr.c, nt);
    circle(x + sway, y - 24 * s, 11 * s); g.fill();
    circle(x - 7 * s + sway * 0.7, y - 17 * s, 8 * s); g.fill();
    circle(x + 7 * s + sway * 0.7, y - 17 * s, 8 * s); g.fill();
  });
}
// Far hills as a patchwork of fields.
function patchworkHill(nt) {
  var G = S.G, W = S.W, k = S.k, cols = ['#E6C28C', '#D9BD7E', '#CFC68E', '#E2B784'];
  hillPath(G.horizon, 11 * k, 0.006, 0.013, 0.5); paint(cz(cols[0], nt));
  g.save();
  hillPath(G.horizon, 11 * k, 0.006, 0.013, 0.5); g.clip();
  for (var i = 0, x = -60 * k; x < W + 60 * k; i++, x += 70 * k) {
    g.beginPath(); g.moveTo(x, G.horizon + 6); g.lineTo(x + 40 * k, G.horizon - 50 * k); g.lineTo(x + 110 * k, G.horizon - 50 * k); g.lineTo(x + 70 * k, G.horizon + 6); g.closePath();
    g.fillStyle = cz(cols[1 + i % 3], nt); g.fill();
  }
  g.restore();
}
function batchDots(list, color, nt) {
  if (!list.length) return;
  g.beginPath();
  list.forEach(function (d) { g.moveTo(d[0] + d[2], d[1]); g.arc(d[0], d[1], d[2], 0, Math.PI * 2); });
  g.fillStyle = cz(color, nt); g.fill();
}
function drawMeadow(nt) {
  var G = S.G, W = S.W, k = S.k, top = G.horizon + 12 * k, span = G.roadTop - G.horizon - 22 * k;
  var white = [], yellow = [], pink = [], lilac = [], centers = [];
  FLOWERS.forEach(function (f) {
    var x = f.x * W, y = top + f.y * span, r = 1.7 * k * depth(y) * f.r;
    if (f.t === 0) { white.push([x, y, r * 1.3]); centers.push([x, y, r * 0.5]); }
    else if (f.t === 1) yellow.push([x, y, r]);
    else if (f.t === 2) pink.push([x, y, r]);
    else { lilac.push([x, y - r, r * 0.7]); lilac.push([x, y, r * 0.7]); }
  });
  batchDots(white, '#FFFDF4', nt); batchDots(centers, '#F2B33D', nt); batchDots(yellow, '#F6CF4A', nt);
  batchDots(pink, '#E9A0B8', nt); batchDots(lilac, '#A992D0', nt);
  TOADSTOOLS.forEach(function (m) {
    var y = top + m.y * span, x = m.x * W, s = k * depth(y) * m.s;
    rr(x - 1.6 * s, y - 5 * s, 3.2 * s, 5 * s, 1 * s); paint(cz('#F4E9D6', nt));
    g.beginPath(); g.arc(x, y - 4.6 * s, 4.6 * s, Math.PI, 0); g.closePath(); paint(cz('#C8553D', nt));
    g.fillStyle = cz('#FFF7E8', nt);
    circle(x - 2 * s, y - 6.6 * s, 0.9 * s); g.fill(); circle(x + 1.6 * s, y - 7.4 * s, 0.8 * s); g.fill(); circle(x + 2.4 * s, y - 5.4 * s, 0.6 * s); g.fill();
  });
}
function drawFence(nt) {
  var y = S.G.roadTop, k = S.k, pitch = 11 * k, w = 5 * k;
  g.fillStyle = cz('#E9DCC4', nt);
  g.fillRect(0, y - 11 * k, S.W, 2.2 * k);
  g.fillRect(0, y - 5.5 * k, S.W, 2.2 * k);
  g.beginPath();
  for (var x = 2 * k; x < S.W; x += pitch) {
    g.moveTo(x, y); g.lineTo(x, y - 13 * k); g.lineTo(x + w / 2, y - 16 * k); g.lineTo(x + w, y - 13 * k); g.lineTo(x + w, y); g.closePath();
  }
  g.fillStyle = cz('#FFF7E8', nt); g.fill();
  g.lineWidth = 1; g.strokeStyle = cz('#B8A48A', nt); g.stroke();
}
function drawCozyGround(nt) {
  var G = S.G, W = S.W, H = S.H, k = S.k;
  patchworkHill(nt);
  drawTrees(nt);
  hillPath(G.horizon, 6 * k, 0.011, 0.021, 2.1); paint(cz('#D4A56A', nt));
  var grass = g.createLinearGradient(0, G.horizon, 0, G.roadTop);
  grass.addColorStop(0, cz('#D9D49A', nt)); grass.addColorStop(1, cz('#BDBB78', nt));
  g.fillStyle = grass;
  g.fillRect(0, G.horizon, W, G.roadTop - G.horizon);
  var tuft = cz('#A9A865', nt);
  TUFTS.forEach(function (t, i) {
    var x = t.x * W, y = G.horizon + 10 * k + t.y * (G.roadTop - G.horizon - 14 * k);
    if (t.f) { ellipse(x, y, 3.4 * k, 1.6 * k); paint(cz(LEAVES[i % LEAVES.length], nt)); }
    else { ellipse(x, y, 6 * k, 2 * k); paint(tuft); }
  });
  drawMeadow(nt);
  // A dirt lane instead of a road, with a picket fence along the meadow.
  g.fillStyle = cz('#B9B577', nt);
  g.fillRect(0, G.roadTop, W, 8 * k);
  g.fillStyle = cz('#C9A77F', nt);
  g.fillRect(0, G.roadTop + 8 * k, W, H - G.roadTop);
  g.fillStyle = cz('#B08E67', nt);
  PEBBLES.forEach(function (p) { ellipse(p.x * W, G.roadTop + 12 * k + p.y * (H - G.roadTop - 14 * k), 2.2 * k * p.s, 1.2 * k * p.s); g.fillStyle = cz(p.c, nt); g.fill(); });
  drawFence(nt);
}

function drawCozyRainbow(nt) {
  var a = S.rainbow * (1 - smooth(nt * 1.4)) * (1 - S.gloom);
  if (a <= 0.02) return;
  var cols = ['#D9624A', '#EE9A4D', '#F2CC60', '#9CC47E', '#6FA8C8', '#9C89B8'];
  var bw = 10 * S.k, cx = S.W * 0.52, cy = S.G.horizon + 10 * S.k, R = Math.min(S.W * 0.4, S.G.horizon * 1.05);
  var inner = R - (cols.length - 1) * bw;
  g.save();
  g.globalAlpha = a * 0.6;
  g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy, (R + inner) / 2, Math.PI, 0); g.lineWidth = cols.length * bw + 10 * S.k; g.strokeStyle = '#FFFFFF'; g.stroke();
  cols.forEach(function (c, i) {
    g.beginPath(); g.arc(cx, cy, R - i * bw, Math.PI, 0); g.lineWidth = bw + 0.5; g.strokeStyle = c; g.stroke();
  });
  g.restore();
}

// The schoolhouse: a front gable, a belfry with a bell and a pennant, a SCHOOL sign over the door,
// tall trimmed windows with flower boxes, pumpkins on the steps, and a chimney (two on big schools).
// A school's windows light up once the light reaches it.
var CUR = null;
function gableH(W) { return Math.min(W * 0.3, 30); }
function roofRise(s) { var d = dims(s); return d.mega ? 36 : gableH(d.w) + 34; }
function schoolWall(s) { return COZY_WALLS[(s.id != null ? s.id : S.nextId) % COZY_WALLS.length]; }
function isLit(s) { return S.phase === 'unlimited' && !!s && !!s.blessed; }
function cozyWindow(i, nt) {
  if (S.gloom > 0.5 && !(CUR && CUR.blessed)) return cz('#7D8796', 0);
  if (isLit(CUR)) {
    var c = nt > 0.3 ? '#FFC861' : '#FFE3A3';
    return CUR.flare > 0 && i === CUR.flareWin ? mix(c, '#FFFBE6', Math.min(1, CUR.flare * 1.4)) : c;
  }
  return cz('#CFE3EE', nt);
}
function belfry(x, y, s, nt) {
  var roof = cz(COZY_ROOF, nt), trim = cz(COZY_TRIM, nt);
  rr(x - 8, y - 13, 16, 15, 2); paint(trim, OUTLINE, 1.8);
  rr(x - 5, y - 10, 10, 9, 4); paint(cz('#3A2A2A', nt));
  g.save();
  g.translate(x, y - 9.5);
  g.rotate(Math.sin(S.t * 5) * 0.45 * (s.ring || 0));
  g.beginPath(); g.moveTo(-3.4, 6); g.quadraticCurveTo(-3.6, 0.5, 0, 0); g.quadraticCurveTo(3.6, 0.5, 3.4, 6); g.lineTo(4.4, 7.2); g.lineTo(-4.4, 7.2); g.closePath();
  paint('#E8B04A', OUTLINE, 1.1);
  g.restore();
  g.beginPath(); g.moveTo(x - 11, y - 12); g.lineTo(x, y - 26); g.lineTo(x + 11, y - 12); g.closePath(); paint(roof, OUTLINE, 1.8);
  g.strokeStyle = '#E5E5E5'; g.lineWidth = 1.8; line(x, y - 26, x, y - 40);
  g.beginPath(); g.moveTo(x, y - 40);
  for (var f = 0; f <= 4; f++) g.lineTo(x + f * 3.6, y - 40 + Math.sin(S.t * 2.4 + f) * 1.2 + f * 0.9);
  g.lineTo(x, y - 32);
  g.closePath(); paint(S.gloom > 0.5 ? '#9AA0AE' : cz('#C8553D', nt), OUTLINE, 1.2);
}
// Chimney smoke curls up lazily, and there's more of it in the evening when the hearths are lit.
function smoke(x, y, nt, seed) {
  if (STK) return;
  var on = (0.3 + 0.5 * nt + (isLit(CUR) ? 0.15 : 0)) * (1 - S.gloom * 0.6);
  for (var i = 0; i < 4; i++) {
    var ph = (S.t * 0.16 + i / 4 + seed) % 1;
    g.globalAlpha = (1 - ph) * on;
    circle(x + Math.sin(ph * 5 + seed * 6) * 3 + ph * 8, y - ph * 42, 2.6 + ph * 7);
    g.fillStyle = nt > 0.4 ? '#E6DDEE' : '#FFFFFF'; g.fill();
  }
  g.globalAlpha = 1;
}
function signBoard(y, w, nt) {
  rr(-w / 2, y, w, 10, 2); paint(cz('#F4E6C8', nt), OUTLINE, 1.4);
  if (STK) return;
  g.fillStyle = cz('#5B3B33', nt);
  g.font = '700 7.6px ' + SERIF;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('SCHOOL', 0, y + 5.4);
}
function pumpkin(x, y, r, nt) {
  ellipse(x, y - r * 0.8, r * 1.25, r * 0.85); paint(cz('#E8883A', nt), OUTLINE, 1);
  g.strokeStyle = 'rgba(28,34,43,.25)'; g.lineWidth = 0.8;
  g.beginPath(); g.ellipse(x, y - r * 0.8, r * 0.45, r * 0.8, 0, 0, Math.PI * 2); g.stroke();
  rr(x - 0.7, y - r * 1.9, 1.4, r * 0.5, 0.5); paint(cz('#5E7A3A', nt));
}
function paneWindow(wx, wy, ww, wh, i, nt, box) {
  var trim = cz(COZY_TRIM, nt), glass = cozyWindow(i, nt);
  rr(wx - 1.6, wy - 1.6, ww + 3.2, wh + 3.2, 1.6); paint(trim, OUTLINE, 1.4);
  rr(wx, wy, ww, wh, 1); paint(glass);
  if (CUR && CUR.wins) CUR.wins.push({ x: wx + ww / 2, y: wy + wh / 2 });
  if (isLit(CUR) && nt > 0.3) {
    g.fillStyle = 'rgba(92,52,36,.5)';
    if (i % 2) {
      var bob = Math.sin(S.t * 0.8 + i) * 0.5;
      circle(wx + ww / 2, wy + wh - 5.5 + bob, 2.4); g.fill();
      rr(wx + ww / 2 - 3.2, wy + wh - 3 + bob, 6.4, 3, 1.4); g.fill();
    } else {
      g.beginPath(); g.moveTo(wx + ww * 0.3, wy + wh * 0.5); g.lineTo(wx + ww * 0.7, wy + wh * 0.5); g.lineTo(wx + ww * 0.6, wy + wh * 0.3); g.lineTo(wx + ww * 0.4, wy + wh * 0.3); g.closePath(); g.fill();
      g.fillRect(wx + ww / 2 - 0.5, wy + wh * 0.5, 1, wh * 0.3);
    }
  } else if (S.phase === 'build') {
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 1.6; line(wx + 2, wy + 6, wx + 6, wy + 2);
  }
  g.strokeStyle = trim; g.lineWidth = 1.3;
  line(wx + ww / 2, wy, wx + ww / 2, wy + wh);
  line(wx, wy + wh / 2, wx + ww, wy + wh / 2);
  if (!box) return;
  rr(wx - 2.4, wy + wh + 1.6, ww + 4.8, 4, 1); paint(cz('#8B5A3C', nt), OUTLINE, 1);
  ['#E07A3F', '#C2452D', '#F2CC60'].forEach(function (c, j) { circle(wx + 1 + j * (ww - 2) / 2, wy + wh + 1.4, 1.7); paint(cz(c, nt)); });
}
function chimney(x, H, R, W, nt, seed) {
  var y = -H - R * (1 - Math.abs(x) / (W / 2));
  rr(x - 4, y - 15, 8, 17, 1); paint(cz('#9C4A35', nt), OUTLINE, 1.6);
  smoke(x, y - 18, nt, seed);
}
function drawSchoolhouse(s, W, H, tier, nt) {
  var wall = cz(schoolWall(s), nt), trim = cz(COZY_TRIM, nt), roof = cz(COZY_ROOF, nt), R = gableH(W);
  CUR = s;
  var front = function () { g.beginPath(); g.moveTo(-W / 2, 0); g.lineTo(-W / 2, -H); g.lineTo(0, -H - R); g.lineTo(W / 2, -H); g.lineTo(W / 2, 0); g.closePath(); };
  front(); paint(wall);
  if (!STK) {
    g.save(); front(); g.clip();
    g.strokeStyle = 'rgba(28,34,43,.10)'; g.lineWidth = 1.2;
    for (var by = -H - R + 7; by < -4; by += 7) line(-W / 2, by, W / 2, by);
    g.fillStyle = 'rgba(28,34,43,.10)'; g.fillRect(-W / 2, -7, W, 7);
    g.restore();
  }
  front(); paint(null, OUTLINE, 2.2);

  chimney(W * 0.26, H, R, W, nt, 0);
  if (tier >= 2) chimney(-W * 0.3, H, R, W, nt, 0.5);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-W / 2 - 6, -H + 4); g.lineTo(0, -H - R - 2); g.lineTo(W / 2 + 6, -H + 4);
  if (STK) paint(null, OUTLINE, 9);
  else { g.lineWidth = 10; g.strokeStyle = OUTLINE; g.stroke(); g.lineWidth = 7.4; g.strokeStyle = roof; g.stroke(); }
  belfry(0, -H - R - 1, s, nt);
  // Everything below sits inside the walls, so the sticker-outline passes can skip it.
  if (STK) return;
  s.wins = [];

  var gw = Math.min(6, R * 0.22);
  if (gw > 3.5) { circle(0, -H - R * 0.38, gw + 1.6); paint(trim, OUTLINE, 1.4); circle(0, -H - R * 0.38, gw); paint(cozyWindow(98, nt)); }

  var dw = tier >= 2 ? 22 : 18, dh = tier === 0 ? 22 : 26, floors = tier >= 2 ? 2 : 1;
  var ww = 10, wh = floors === 2 ? 14 : 18, pitch = ww + 7, wi = 0;
  var rows = floors === 2 ? [-12 - wh, -H + 9] : [-16 - wh];
  if (floors === 2) { g.strokeStyle = trim; g.lineWidth = 2; line(-W / 2 + 1, (rows[0] + rows[1] + wh) / 2 - 1, W / 2 - 1, (rows[0] + rows[1] + wh) / 2 - 1); }
  [[-W / 2 + 8, -dw / 2 - 7], [dw / 2 + 7, W / 2 - 8]].forEach(function (wing) {
    var span = wing[1] - wing[0], cols = Math.max(1, Math.floor((span + 7) / pitch)), start = wing[0] + (span - (cols * pitch - 7)) / 2;
    rows.forEach(function (wy, r) {
      for (var c = 0; c < cols; c++) paneWindow(start + c * pitch, wy, ww, wh, wi++, nt, r === 0);
    });
  });

  if (tier >= 3) {
    rr(-dw / 2 - 8, -dh - 6, 4, dh + 6, 1.5); paint(trim, OUTLINE, 1.3);
    rr(dw / 2 + 4, -dh - 6, 4, dh + 6, 1.5); paint(trim, OUTLINE, 1.3);
  }
  var sw = tier >= 3 ? 50 : 42;
  signBoard(-dh - dw / 2 - 14, Math.min(sw, W - 16), nt);
  g.beginPath(); g.arc(0, -dh, dw / 2, Math.PI, 0); g.closePath(); paint(cozyWindow(99, nt), OUTLINE, 1.4);
  rr(-dw / 2, -dh, dw, dh, 1.5); paint(cz(COZY_DOOR, nt), OUTLINE, 1.8);
  g.strokeStyle = OUTLINE; g.lineWidth = 1.1; line(0, -dh, 0, 0);
  circle(-2.4, -dh / 2, 1); paint('#E8B04A'); circle(2.4, -dh / 2, 1); paint('#E8B04A');
  rr(-dw / 2 - 6, -3, dw + 12, 4, 1.5); paint(cz('#D8CBB2', nt), OUTLINE, 1.2);
  pumpkin(-dw / 2 - 11, 0, 4.2, nt);
  pumpkin(dw / 2 + 12, 0, 3.3, nt);
}
function drawCozyTower(s, W, H, nt) {
  var trim = cz(COZY_TRIM, nt);
  CUR = s;
  rr(-W / 2, -H, W, H, 3); paint(cz('#B5523A', nt), OUTLINE, 2.2);
  if (!STK) {
    g.save(); rr(-W / 2, -H, W, H, 3); g.clip();
    g.strokeStyle = 'rgba(28,34,43,.12)'; g.lineWidth = 1;
    for (var by = -H + 6; by < 0; by += 6) line(-W / 2, by, W / 2, by);
    g.restore();
  }
  g.beginPath(); g.moveTo(-W / 2 - 4, -H + 2); g.lineTo(0, -H - 14); g.lineTo(W / 2 + 4, -H + 2); g.closePath(); paint(cz(COZY_ROOF, nt), OUTLINE, 2);
  belfry(0, -H - 12, s, nt);
  if (STK) return;
  s.wins = [];
  circle(0, -H + 18, 11); paint(trim, OUTLINE, 1.6);
  var hr = (S.clock / 60 % 12) / 12 * Math.PI * 2, mn = (S.clock % 60) / 60 * Math.PI * 2;
  g.strokeStyle = OUTLINE; g.lineWidth = 1.4; g.lineCap = 'round';
  line(0, -H + 18, Math.sin(hr) * 5, -H + 18 - Math.cos(hr) * 5);
  line(0, -H + 18, Math.sin(mn) * 8, -H + 18 - Math.cos(mn) * 8);
  var wi = 0;
  for (var y = -H + 38; y < -52; y += 20) for (var x = -W / 2 + 10; x + 10 <= W / 2 - 8; x += 22) paneWindow(x, y, 10, 13, wi++, nt, false);
  signBoard(-46, 46, nt);
  rr(-12, -30, 24, 30, 2); paint(cz(COZY_DOOR, nt), OUTLINE, 1.8);
  g.strokeStyle = OUTLINE; g.lineWidth = 1.1; line(0, -30, 0, 0);
}
// Window positions are recorded in the school's own units; spirits need them on screen.
function winOnScreen(s, w) { return { x: s.x + w.x * s.sc, y: s.y + w.y * s.sc }; }

// A small rain cloud over each school during the gloomy spell, gone once the light reaches it.
function drawDrizzle(d, s) {
  var cy = -d.h - roofRise(s) - 16;
  g.globalAlpha = S.gloom;
  g.fillStyle = '#9AA2B0';
  circle(-15, cy + 5, 10); g.fill(); circle(0, cy, 13); g.fill(); circle(15, cy + 5, 10); g.fill();
  rr(-24, cy + 3, 48, 12, 6); g.fill();
  g.strokeStyle = '#8FB0DA'; g.lineWidth = 1.6; g.lineCap = 'round';
  for (var r = 0; r < 6; r++) {
    var ry = (S.t * 60 + r * 17) % 26;
    line(-20 + r * 8, cy + 17 + ry, -21 + r * 8, cy + 22 + ry);
  }
  g.globalAlpha = 1;
}
// At night a lit school spills warm light onto the meadow around it. It holds steady; nothing pulses.
function drawCozyGlow(s) {
  if (!isLit(s)) return;
  var d = dims(s), sc = s.sc, gy = s.y - d.h * sc * 0.4, R = d.w * sc * 1.05;
  g.save();
  g.globalCompositeOperation = 'lighter';
  var glow = g.createRadialGradient(s.x, gy, 0, s.x, gy, R);
  glow.addColorStop(0, 'rgba(255,184,92,.22)');
  glow.addColorStop(1, 'rgba(255,184,92,0)');
  g.fillStyle = glow;
  g.fillRect(s.x - R, gy - R, R * 2, R * 2);
  g.restore();
}

function drawRain() {
  var gl = S.gloom;
  if (gl < 0.02) return;
  var n = reduced ? 50 : 130, W = S.W, H = S.H, k = S.k, len = 11 * k, lean = 0.22;
  g.save();
  g.strokeStyle = 'rgba(150,172,205,' + (0.55 * gl).toFixed(3) + ')';
  g.lineWidth = 1.2 * k; g.lineCap = 'round';
  g.beginPath();
  for (var i = 0; i < n; i++) {
    var sp = (240 + (i * 37) % 110) * k, x0 = ((i * 0.61803) % 1) * (W + 300) - 200;
    var y = (S.t * sp + i * 71.3) % (H + 60) - 30, x = x0 + (y + 30) * lean;
    g.moveTo(x, y); g.lineTo(x - lean * len, y - len);
  }
  g.stroke();
  g.restore();
}

// Leaves tumble across the meadow on the breeze, faster when a gust comes through.
function leafShape(x, y, s, rot, flip, c) {
  g.save();
  g.translate(x, y); g.rotate(rot); g.scale(1, 0.35 + 0.65 * Math.abs(Math.sin(flip)));
  g.beginPath(); g.moveTo(-s, 0); g.quadraticCurveTo(0, -s * 0.75, s, 0); g.quadraticCurveTo(0, s * 0.75, -s, 0); g.closePath();
  g.fillStyle = c; g.fill();
  g.strokeStyle = 'rgba(90,50,30,.45)'; g.lineWidth = 0.8;
  g.beginPath(); g.moveTo(-s * 1.25, 0); g.lineTo(s * 0.8, 0); g.stroke();
  g.restore();
}
function heartShape(x, y, s) {
  g.beginPath();
  g.moveTo(x, y + s * 0.9);
  g.bezierCurveTo(x - s * 1.4, y - s * 0.1, x - s * 0.6, y - s * 1.2, x, y - s * 0.35);
  g.bezierCurveTo(x + s * 0.6, y - s * 1.2, x + s * 1.4, y - s * 0.1, x, y + s * 0.9);
  g.closePath();
}
function leafTarget() {
  if (S.phase === 'crisis' || S.phase === 'charge') return 0;
  if (reduced) return 6;
  return S.phase === 'build' || S.phase === 'intro' ? 14 : 22;
}
function spawnLeaf(anywhere) {
  S.leaves.push({
    x: anywhere ? rand(0, S.W) : rand(-40, -10), y: anywhere ? rand(0, S.G.roadTop) : rand(-20, S.G.roadTop * 0.8),
    vx: rand(20, 40) * S.k, vy: rand(8, 16) * S.k, rot: rand(0, 6), vr: rand(-3, 3), flip: rand(0, 6),
    c: pick(LEAVES), s: rand(5, 8) * S.k
  });
}
function stepLeaves(dt) {
  var want = leafTarget(), wind = (26 + S.windy * 150) * S.k, eddy = 20 * S.k;
  if (S.leaves.length < want && Math.random() < dt * 3) spawnLeaf(!S.leaves.length);
  S.leaves = S.leaves.filter(function (l) {
    var a = Math.sin(l.x * 0.005 + S.t * 0.3) * Math.cos(l.y * 0.007 - S.t * 0.22) * Math.PI * 2;
    var tx = wind + Math.cos(a) * eddy, ty = 12 * S.k + Math.sin(a) * eddy, e = Math.min(1, dt);
    l.vx += (tx - l.vx) * e; l.vy += (ty - l.vy) * e;
    l.x += l.vx * dt; l.y += l.vy * dt;
    l.rot += l.vr * dt * (1 + S.windy * 3); l.flip += dt * (3 + S.windy * 8);
    if (l.x > S.W + 30 || l.y > S.H + 20 || l.y < -60) {
      if (S.leaves.length > want) return false;
      l.x = rand(-40, -10); l.y = rand(-20, S.G.roadTop * 0.8);
    }
    return true;
  });
}
function drawLeaves(nt) {
  S.leaves.forEach(function (l) { leafShape(l.x, l.y, l.s, l.rot, l.flip, cz(l.c, nt * 0.6)); });
}
function leafDrag(p, dt) {
  p.vx = p.vx * (1 - Math.min(1, 1.4 * dt)) + S.windy * 60 * S.k * dt;
  if (p.vy > 60 * S.k) p.vy = 60 * S.k;
}

// Fireflies come out at dusk, low over the meadow, blinking yellow-green on and off. Once a school is
// powered, a few of them gather around it.
function seedFlies(n) {
  for (var i = 0; i < n; i++) S.flies.push({ x: rand(0, S.W), y: rand(S.G.horizon, S.G.roadTop - 10 * S.k), ph: rand(0, 10), sp: rand(0.6, 1.3) });
}
function stepFlies(dt) {
  var top = S.G.horizon - 20 * S.k, bottom = S.G.roadTop - 8 * S.k;
  S.flies = S.flies.filter(function (f) { return !f.home || !f.home.dead; });
  S.flies.forEach(function (f) {
    var t = S.t * f.sp * 0.6 + f.ph;
    if (f.home) {
      var s = f.home, d = dims(s);
      var tx = s.x + f.ox * d.w * s.sc * 0.75 + Math.cos(t * 0.9) * 12 * S.k, ty = s.y - f.oy * d.h * s.sc + Math.sin(t * 1.2) * 9 * S.k;
      f.x += (tx - f.x) * Math.min(1, dt * 1.2); f.y += (ty - f.y) * Math.min(1, dt * 1.2);
      return;
    }
    f.x += (Math.cos(t * 0.8) * 12 + Math.cos(t * 0.3 + f.ph) * 8) * S.k * dt;
    f.y += Math.sin(t * 1.1) * 9 * S.k * dt;
    if (f.x > S.W + 10) f.x = -10; else if (f.x < -10) f.x = S.W + 10;
    f.y = clamp(f.y, top, bottom);
  });
}
function drawFlies(nt) {
  if (nt < 0.15 || !S.flies.length) return;
  var night = smooth((nt - 0.15) / 0.4);
  g.save();
  g.globalCompositeOperation = 'lighter';
  S.flies.forEach(function (f) {
    if (CULL && !CULL(f.x)) return;
    var blink = Math.pow(Math.max(0, Math.sin(S.t * 1.1 * f.sp + f.ph)), 5) * night;
    if (blink < 0.02) return;
    g.globalAlpha = blink * 0.4; circle(f.x, f.y, 4.2 * S.k); g.fillStyle = '#B8F04A'; g.fill();
    g.globalAlpha = blink; circle(f.x, f.y, 1.4 * S.k); g.fillStyle = '#F2FFB8'; g.fill();
  });
  g.restore();
}

// Will-o'-wisps: a warm glowing point with a soft trail behind it.
function drawTrail(trail, r, alpha, keep) {
  for (var i = 0; i < trail.length; i++) {
    var q = trail[i];
    if (keep && !keep(q)) continue;
    var f = (i + 1) / (trail.length + 1);
    g.globalAlpha = alpha * f * 0.6;
    circle(q.x, q.y, r * (0.25 + 0.6 * f)); g.fillStyle = '#FFD27A'; g.fill();
  }
  g.globalAlpha = 1;
}
function drawWisp(x, y, r, alpha, boost) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  var R = r * (3.4 + boost), glow = g.createRadialGradient(x, y, 0, x, y, R);
  glow.addColorStop(0, 'rgba(255,214,130,.7)'); glow.addColorStop(1, 'rgba(255,214,130,0)');
  g.globalAlpha = alpha; g.fillStyle = glow; g.fillRect(x - R, y - R, R * 2, R * 2);
  g.globalCompositeOperation = 'source-over';
  circle(x, y, r); g.fillStyle = '#FFF4D6'; g.fill();
  g.lineWidth = Math.max(1, r * 0.22); g.strokeStyle = 'rgba(232,150,50,.7)'; g.stroke();
  circle(x, y, r * 0.45); g.fillStyle = '#FFFFFF'; g.fill();
  g.restore();
}

// Each powered school has a wisp that circles it, passing in front and behind. Now and then it
// dips to a window, the window glows, and a kid inside gets unstuck, day and night, whether or not
// you click. A click sends it spiraling up and back down (or down and back up) with more energy.
var TENDS = ['Got unstuck on fractions', 'Essay outline, sorted', 'Chemistry finally clicked', 'Ready for the quiz', 'FAFSA, filed', 'Proof makes sense now', 'Lab report, done'];
function bless(s, from) {
  if (s.spirit) return;
  s.blessed = true;
  // It starts on the front of its loop, so a wisp flying in from the admin never pops behind the school.
  s.spirit = { a: Math.PI / 2 + rand(-0.4, 0.4), la: rand(0, 6.28), born: S.t, from: from || null, tendAt: S.t + rand(3, 6), tend: 0, swirl: 0, dir: -1, fw: 0, trail: [], lastT: 0 };
  s.ring = 1;
  for (var i = 0; i < 6; i++) S.flies.push({ home: s, ox: rand(-0.7, 0.7), oy: rand(0.1, 0.9), ph: rand(0, 10), sp: rand(0.7, 1.3), x: s.x, y: s.y });
}
// A click's spiral goes up past the roof and back, or down toward the doorstep and back; it never
// dips below the school.
function orbitPos(s) {
  var d = dims(s), sp = s.spirit, sc = s.sc, cy = s.y - d.h * sc * 0.5;
  var reach = sp.dir > 0 ? d.h * 0.5 + roofRise(s) * 0.7 : -d.h * 0.36;
  var up = sp.swirl > 0 ? Math.sin(Math.PI * (1 - sp.swirl)) * reach * sc : 0;
  return {
    x: s.x + Math.cos(sp.a) * (d.w / 2 + 22) * sc,
    y: cy + Math.sin(sp.a) * 10 * sc - up + Math.sin(S.t * 1.3 + sp.a * 0.3) * 3 * sc,
    front: Math.sin(sp.a) > 0
  };
}
function spiritPos(s) {
  var sp = s.spirit, p = orbitPos(s);
  if (sp.tend > 0 && s.wins && s.wins[sp.fw]) {
    var w = winOnScreen(s, s.wins[sp.fw]), e = smooth(Math.sin(Math.PI * Math.min(1, sp.tend)) * 1.15);
    p.x = lerp(p.x, w.x + 8 * s.sc, e); p.y = lerp(p.y, w.y - 5 * s.sc, e);
    p.front = true;
  }
  var u = (S.t - sp.born) / 1.3;
  if (sp.from && u < 1) {
    var e2 = smooth(u);
    p.x = lerp(sp.from.x, p.x, e2); p.y = lerp(sp.from.y, p.y, e2) - Math.sin(Math.PI * e2) * 70 * S.k; p.front = true;
  }
  return p;
}
function stepSpirits(dt) {
  var live = S.phase === 'unlimited' || S.phase === 'choose';
  S.schools.forEach(function (s) {
    var sp = s.spirit;
    if (!sp) return;
    // The loop pauses while the wisp visits a window, so it leaves from the front and comes back to it.
    if (!sp.tend) sp.a += dt * (0.9 + sp.swirl * 5);
    sp.la += dt * (0.5 + sp.swirl * 3.5);
    if (sp.swirl > 0) sp.swirl = Math.max(0, sp.swirl - dt / 1.3);
    if (s.flare > 0) s.flare = Math.max(0, s.flare - dt / 1.6);
    if (sp.tend > 0) {
      var was = sp.tend;
      sp.tend += dt / 2.6;
      if (was < 0.5 && sp.tend >= 0.5) tended(s);
      if (sp.tend >= 1) { sp.tend = 0; sp.tendAt = S.t + rand(5, 9); }
    } else if (live && !sp.swirl && S.t >= sp.tendAt && Math.sin(sp.a) > 0.5 && s.wins && s.wins.length) {
      sp.fw = (Math.random() * s.wins.length) | 0;
      sp.tend = 0.001;
    }
    if (S.t - sp.lastT > 0.04) {
      sp.lastT = S.t;
      var p = spiritPos(s);
      sp.trail.push({ x: p.x, y: p.y, front: p.front });
      if (sp.trail.length > 14) sp.trail.shift();
    }
  });
}
function tended(s) {
  var sp = s.spirit, w = s.wins && s.wins[sp.fw];
  if (!w) return;
  s.flare = 1; s.flareWin = sp.fw;
  var p = winOnScreen(s, w);
  PART_TAG = S.phase === 'choose' ? 'cozy' : undefined;
  burst(p.x, p.y, 5, ['#FFF3C4', '#FFFFFF'], 45 * S.k, 'dot');
  PART_TAG = undefined;
  if (S.phase !== 'unlimited') return;
  addDreams(0.03);
  if (S.t - (UI.tendFloat || 0) > 4 && Math.random() < 0.6) {
    UI.tendFloat = S.t;
    floatText(p.x, p.y - 26 * s.sc, isParty() ? clockStr(S.clock) + ' · still helping' : '💡 ' + pick(TENDS), 'tend', 14);
  }
}
function spiritCheer(s) {
  var sp = s.spirit;
  if (!sp) return;
  sp.dir = -sp.dir; sp.swirl = 1; sp.tend = 0;
}
// A few leaves circle each powered school too, on a wider, slower loop than its wisp, passing in
// front and behind the same way. A click sends them swirling along with the wisp.
var ORBIT_LEAVES = 6;
function leafOrbit(s, i) {
  var d = dims(s), sp = s.spirit, sc = s.sc, a = sp.la + i * Math.PI * 2 / ORBIT_LEAVES;
  var up = sp.swirl > 0 ? Math.sin(Math.PI * (1 - sp.swirl)) * 30 * sc * sp.dir : 0;
  return {
    x: s.x + Math.cos(a) * (d.w / 2 + 24) * sc,
    y: s.y - d.h * sc * (0.32 + 0.12 * Math.sin(a * 2 + i)) + Math.sin(a) * 13 * sc - up,
    front: Math.sin(a) > 0, a: a
  };
}
function drawOrbitLeaf(s, i, nt) {
  var sp = s.spirit, p = leafOrbit(s, i), fade = smooth((S.t - sp.born - 0.8) / 0.8);
  if (fade <= 0) return;
  g.globalAlpha = fade;
  leafShape(p.x, p.y, 6.6 * s.sc * (p.front ? 1.1 : 0.9), p.a * 1.7 + i, S.t * 2.4 + i * 1.3, cz(LEAVES[(i + (s.id || 0)) % LEAVES.length], nt * 0.6));
  g.globalAlpha = 1;
}
// Each wisp is drawn in two layers, one behind its school and one in front. Each trail dot stays in
// the layer it was in when the wisp passed, so the trail never streaks across the building.
function drawSpirit(s, nt, front) {
  var sp = s.spirit, p = spiritPos(s), k = s.sc, fade = smooth((S.t - sp.born) / 0.6), r = 4.6 * k * (p.front ? 1.1 : 0.9);
  drawTrail(sp.trail, r, fade * (front ? 1 : 0.7), function (q) { return q.front === front; });
  if (p.front === front) drawWisp(p.x, p.y, r, fade * (front ? 1 : 0.75), nt + (s.flare || 0) + sp.swirl);
}

// The power-up: UPdog's star turns into a wisp that winds around the Tutoring bar, filling it as it
// goes, with a few leaves tumbling after it. The half of each turn that passes in front of the bar is
// drawn on an overlay canvas above the page's meter. When the bar is full it rises to the admin and
// the ring of light spreads.
function barRect() { return screenRect($('pb-power').querySelector('.pb-bar')); }
function startCharm() {
  var x = S.dog.x, y = S.dog.y - S.dog.w * 0.5;
  S.charm = { stage: 0, t: 0, x: x, y: y, fx: x, fy: y, a: Math.PI, z: 1, trail: [], lt: 0 };
}
function charmStep(dt) {
  var c = S.charm;
  if (!c) return;
  c.t += dt;
  var b = barRect(), cy = b.y + b.h / 2, ry = b.h / 2 + 13;
  if (c.stage === 0) {
    var u = smooth(c.t / 0.7);
    c.x = lerp(c.fx, b.x + 2, u); c.y = lerp(c.fy, cy - ry, u) - Math.sin(Math.PI * u) * 50 * S.k; c.z = 1;
    if (c.t >= 0.7) { c.stage = 1; c.t = 0; }
  } else if (c.stage === 1) {
    var p = 1 - Math.pow(1 - Math.min(1, c.t / 2.3), 1.3);
    S.power = p * 100;
    c.a += dt * 9;
    c.x = b.x + b.w * p; c.y = cy + Math.cos(c.a) * ry; c.z = Math.sin(c.a);
    if (p >= 1) { c.stage = 2; c.t = 0; c.fx = c.x; c.fy = c.y; }
  } else {
    var v = smooth(c.t / 0.6);
    c.x = lerp(c.fx, S.hero.x, v); c.y = lerp(c.fy, S.hero.y - 50 * S.hero.hs, v) - Math.sin(Math.PI * v) * 30 * S.k; c.z = 1;
    if (c.t >= 0.6) { S.charm = null; bloom(); return; }
  }
  if (S.t - c.lt > 0.025) {
    c.lt = S.t;
    c.trail.push({ x: c.x, y: c.y, z: c.z });
    if (c.trail.length > 14) c.trail.shift();
  }
}
function drawCharm(front) {
  var c = S.charm;
  if (!c) return;
  var k = clamp(S.k, 0.85, 1.2), r = 6 * k, side = function (q) { return (q.z > 0) === front; };
  drawTrail(c.trail, r, 1, side);
  [3, 7, 11].forEach(function (back, j) {
    var q = c.trail[c.trail.length - 1 - back];
    if (q && side(q)) leafShape(q.x, q.y + (j - 1) * 2 * k, 6.5 * k, S.t * 4 + j * 2, S.t * 5 + j, LEAVES[j + 1]);
  });
  if (side(c)) drawWisp(c.x, c.y, r * (1 + 0.15 * c.z), 1, 1.2);
}
var og = null, overDirty = false;
function renderOver() {
  if (!og) og = $('pb-over').getContext('2d');
  if (!S.charm && !overDirty) return;
  og.setTransform(1, 0, 0, 1, 0, 0);
  og.clearRect(0, 0, og.canvas.width, og.canvas.height);
  overDirty = false;
  if (!S.charm) return;
  var main = g;
  g = og;
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  drawCharm(true);
  g = main;
  overDirty = true;
}

// After the power-up, the admin and UPdog each get a warm mug, reach over and clink them, and raise
// them. The first time, a little "Cheers!" pops up; after that they clink again every so often.
// The toast plays out DUO_SLOW times slower than the kids' toast, so it's easy to see.
var DUO_SLOW = 1.6;
function duoPose() {
  var D = S.duo;
  if (!D || S.phase !== 'unlimited' || S.t < D.got) return null;
  var c = (S.t - D.clink) / DUO_SLOW, back = 1 - smooth((c - 2) / 0.6);
  return { fade: smooth((S.t - D.got) / 0.6), reach: c < 0 ? 0 : toastReach(c) * back, lift: c < 0 ? 0 : toastLift(c) * back };
}
// Where the two mugs touch, in screen coordinates: just in front of UPdog, at the admin's chest height.
function duoMeet() { var h = S.hero; return { x: h.x + 38 * h.hs, y: h.y - 41 * h.hs }; }
function stepDuo(dt) {
  var D = S.duo;
  if (!D || S.phase !== 'unlimited') return;
  var c = (S.t - D.clink) / DUO_SLOW, was = c - dt / DUO_SLOW, m = duoMeet();
  var at = function (t) { return was < t && c >= t; };
  if (S.t - dt < D.got && S.t >= D.got) burst(m.x, m.y, 8, ['#FFF3C4', '#FFFFFF'], 50 * S.k, 'dot');
  if (at(TOAST.clink1) || at(TOAST.clink2)) {
    sfx.clink();
    burst(m.x, m.y - 6 * S.k, 6, ['#FFFFFF', '#FFE08A'], 60 * S.k, 'star');
    if (!D.cheered) { D.cheered = true; floatText(m.x, m.y - 70 * S.k, 'Cheers!', 'win', 16); }
  }
  if (at(TOAST.raise + 0.1)) {
    for (var i = 0; i < 4; i++) S.parts.push({ x: m.x + rand(-14, 14) * S.k, y: m.y - 20 * S.k, vx: rand(-15, 15), vy: rand(-55, -35) * S.k, life: rand(1.3, 1.8), c: pick(['#E85D8F', '#F48FB1', '#FF9F6E']), s: rand(4, 5.5) * S.k, shape: 'heart', rot: 0, vr: 0, grav: -8 });
  }
  if (c > 3) D.clink = S.t + rand(12, 18);
}

// The power-up's ring of light: it spreads out from the admin and wakes each school as it passes.
// Each school's wisp flies out from the admin to meet it.
function stepBloom(dt) {
  var b = S.bloom;
  if (!b) return;
  var cx = S.hero.x, cy = S.hero.y - 40 * S.k, maxR = Math.hypot(S.W, S.H);
  b.r += maxR / 2.6 * dt;
  S.schools.forEach(function (s) { if (!s.spirit && Math.hypot(s.x - cx, s.y - cy) < b.r) bless(s, { x: cx, y: cy }); });
  if (b.r > maxR * 1.1) S.bloom = null;
}
function drawBloom() {
  var b = S.bloom;
  if (!b) return;
  var cx = S.hero.x, cy = S.hero.y - 40 * S.k, maxR = Math.hypot(S.W, S.H), fade = 1 - b.r / (maxR * 1.1), band = 120 * S.k;
  g.save();
  g.globalCompositeOperation = 'lighter';
  var gr = g.createRadialGradient(cx, cy, Math.max(0, b.r - band), cx, cy, b.r + 8 * S.k);
  gr.addColorStop(0, 'rgba(255,214,150,0)');
  gr.addColorStop(0.8, 'rgba(255,214,150,' + (0.32 * fade).toFixed(3) + ')');
  gr.addColorStop(1, 'rgba(255,214,150,0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, S.W, S.H);
  g.restore();
}

// Weather and critters that tick along whenever cozy mode is on screen.
function cozyStep(dt) {
  var gloomy = S.phase === 'crisis' || S.phase === 'charge';
  if (gloomy) S.gloom = Math.min(1, S.gloom + dt * 0.6);
  else if (S.bloom) S.gloom = Math.min(S.gloom, Math.max(0, 1 - S.bloom.r / Math.hypot(S.W, S.H) * 1.4));
  else S.gloom = Math.max(0, S.gloom - dt * 0.7);
  // A light breeze with a gentle gust every half minute or so.
  S.windy += (0.1 + 0.16 * Math.pow(Math.max(0, Math.sin(S.t * 0.22)), 3) - S.windy) * Math.min(1, dt);
  S.cloudShift += (gloomy ? 0 : 0.004) * dt + (S.bloom ? 0.03 * dt : 0);
  if (S.phase === 'charge') charmStep(dt);
  stepBloom(dt);
  stepLeaves(dt);
  stepFlies(dt);
  stepSpirits(dt);
  stepDuo(dt);
  S.schools.forEach(function (s) { if (s.ring > 0) s.ring = Math.max(0, s.ring - dt * 0.45); });
}

// UPdog floats straight down under a hot-air balloon, hops out with the power-up, and the balloon
// rises straight back up.
function launchBalloon() {
  S.rocket = { t: 0, leg: 0, x: S.dog.x, y: -40 * S.k, from: -40 * S.k };
  sfx.rocket();
}
function balloonStep(dt) {
  var r = S.rocket, sway = Math.sin(S.t * 0.8) * 3 * S.k;
  r.t += dt;
  if (r.leg === 0) {
    var u = Math.min(1, r.t / 3.2), e = 1 - Math.pow(1 - u, 3);
    r.y = lerp(r.from, S.dog.y, e); r.x = S.dog.x + sway * (1 - e);
    if (u >= 1) { r.leg = 1; r.t = 0; deliver(); }
  } else if (r.leg === 1) {
    r.y = S.dog.y - Math.sin(r.t * 2.4) * 1.5;
    if (r.t > 0.7) { r.leg = 2; r.t = 0; }
  } else {
    var v = Math.min(1, r.t / 3.4), e2 = v * v * v;
    r.y = lerp(S.dog.y, -330 * S.k, e2); r.x = S.dog.x + sway * e2;
    if (v >= 1) S.rocket = null;
  }
}
function envelope() {
  g.beginPath(); g.moveTo(-13, -60);
  g.bezierCurveTo(-60, -92, -54, -152, 0, -152);
  g.bezierCurveTo(54, -152, 60, -92, 13, -60);
  g.closePath();
}
function drawBalloon() {
  var r = S.rocket;
  if (!r) return;
  g.save();
  g.translate(r.x, r.y);
  g.rotate(Math.sin(S.t * 0.8) * 0.03);
  g.scale(S.k * 1.15, S.k * 1.15);
  g.lineJoin = 'round'; g.lineCap = 'round';
  envelope(); g.lineWidth = 10; g.strokeStyle = '#FFFFFF'; g.stroke();
  g.strokeStyle = '#FFFFFF'; g.lineWidth = 5; line(-12, -60, -15, -26); line(12, -60, 15, -26);
  envelope(); g.fillStyle = '#C8553D'; g.fill();
  g.save(); envelope(); g.clip();
  [[34, '#F6E7CF'], [24, '#E8A33D'], [13, '#F6E7CF'], [5, '#C8553D']].forEach(function (st) { ellipse(0, -104, st[0], 54); g.fillStyle = st[1]; g.fill(); });
  g.restore();
  envelope(); g.lineWidth = 2.4; g.strokeStyle = OUTLINE; g.stroke();
  circle(0, -110, 13); paint('#FFFFFF', '#1FC39A', 2.6);
  g.fillStyle = '#1FC39A'; g.font = '800 12px ' + UI_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('UP', 0, -109.5);
  g.strokeStyle = OUTLINE; g.lineWidth = 1.4; line(-12, -60, -15, -26); line(12, -60, 15, -26);
  if (r.leg !== 1) {
    g.beginPath(); g.moveTo(-3, -40); g.quadraticCurveTo(0, -54 - Math.sin(S.t * 9) * 2, 3, -40); g.closePath(); paint('#FFC94D', '#FF9F6E', 1.2);
  }
  if (r.leg === 0 && imgReady('dog')) {
    var dw = 44, dh = dw * ART_META.dog[1] / ART_META.dog[0];
    g.drawImage(IMG.dog, -dw / 2, -24 - dh * 0.62, dw, dh);
  }
  rr(-18, -27, 36, 27, 4); paint('#B07A45', OUTLINE, 2);
  g.strokeStyle = 'rgba(28,34,43,.25)'; g.lineWidth = 1;
  for (var wx = -12; wx <= 12; wx += 6) line(wx, -22, wx, -2);
  rr(-20, -30, 40, 7, 3); paint('#7A4A2A', OUTLINE, 1.6);
  g.restore();
}

// Scarves: a flowing tail that ripples in the breeze.
function scarfTail(x, y, len, width, c, ph) {
  var w1 = Math.sin(S.t * 2.6 + ph) * width * 0.5, w2 = Math.sin(S.t * 2.6 + ph + 1.3) * width * 0.8;
  g.beginPath(); g.moveTo(x, y);
  g.bezierCurveTo(x + len * 0.35, y + width * 0.2 + w1, x + len * 0.7, y - width * 0.2 + w2, x + len, y + width * 0.6 + w2);
  g.lineCap = 'round';
  if (STK) { paint(null, OUTLINE, width + 1); return; }
  g.lineWidth = width + 1.4; g.strokeStyle = OUTLINE; g.stroke();
  g.lineWidth = width; g.strokeStyle = c; g.stroke();
}
// UPdog's cozy pose: sitting up, made once from the power-up art (makeUpright) with the star taken out,
// so he matches the power-up he just delivered. His front paws are drawn each frame, so he can hold
// a mug, sip from it, and reach over to clink. UP_* points are in the star art's own pixels.
var UP_PAD = 16, UP_FUR = '#E5B551', UP_EDGE = '#C48E34', UP_MUG = 2.1;
var UP_NEAR = [138, 252], UP_FAR = [266, 262];                  // shoulders: nearest the admin, and the other
var UP_HOLD = [200, 290], UP_SIP = [200, 226], UP_LIFT = [96, 186], UP_REST = [250, 322];
var UP_PAWS = [[185, 304], [216, 304]];                         // empty paws, together at his chest
var upright = null;
function makeUpright() {
  var im = IMG.star, W = im.naturalWidth, H = im.naturalHeight, P = UP_PAD;
  var a = document.createElement('canvas'), x = a.getContext('2d');
  a.width = W + P * 2; a.height = H + P * 2;
  x.drawImage(im, P, P);
  var d;
  try { d = x.getImageData(0, 0, a.width, a.height); } catch (e) { upright = a; return; }
  var p = d.data, fur = [229, 181, 81];
  for (var i = 0; i < p.length; i += 4) {
    if (p[i + 3] < 8) continue;
    var r = p[i], gr = p[i + 1], b = p[i + 2], px = (i / 4) % a.width - P, py = Math.floor(i / 4 / a.width) - P;
    var mx = Math.max(r, gr, b), mn = Math.min(r, gr, b);
    // The logo in the corner goes.
    if (py < 206 && px < 240 && gr > 150 && b > 120 && r < 170) { p[i + 3] = 0; continue; }
    // The old white border goes (a fresh one is drawn below), keeping only its soft inner edge as fur.
    if (mn > 150 && mx - mn < 90 && b > 120) {
      var wt = Math.min(1, (b - 90) / 150);
      p[i + 3] = Math.round(p[i + 3] * (1 - wt));
      p[i] = fur[0]; p[i + 1] = fur[1]; p[i + 2] = fur[2];
      if (!(px > 95 && py > 88) || p[i + 3] < 40) p[i + 3] = 0;
      continue;
    }
    // The star's yellows become fur.
    if (r > 222 && gr > 181 && b < 150) {
      var t = Math.min(1, (gr - 181) / 9);
      p[i] = Math.round(r + (fur[0] - r) * t); p[i + 1] = Math.round(gr + (fur[1] - gr) * t); p[i + 2] = Math.round(b + (fur[2] - b) * t);
    }
  }
  x.putImageData(d, 0, 0);
  // The star hid the front of his collar; finish it under his chin.
  x.globalCompositeOperation = 'source-atop';
  x.translate(P, P);
  x.beginPath(); x.moveTo(100, 222); x.quadraticCurveTo(196, 276, 270, 245);
  x.lineWidth = 23; x.strokeStyle = '#14D1A6'; x.stroke();
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.globalCompositeOperation = 'source-over';
  var o = document.createElement('canvas'), y = o.getContext('2d');
  o.width = a.width; o.height = a.height;
  for (var k = 0; k < 24; k++) { var an = k / 24 * Math.PI * 2; y.drawImage(a, Math.cos(an) * 9, Math.sin(an) * 9); }
  y.globalCompositeOperation = 'source-in'; y.fillStyle = '#FFFFFF'; y.fillRect(0, 0, o.width, o.height);
  y.globalCompositeOperation = 'source-over'; y.drawImage(a, 0, 0);
  upright = o;
}
// His striped scarf, drawn over the collar and settling into place when the light comes in.
function uprightScarf(drop) {
  g.save();
  g.translate(0, -drop);
  g.lineCap = 'round'; g.lineJoin = 'round';
  var w1 = Math.sin(S.t * 2.2) * 8, w2 = Math.sin(S.t * 2.2 + 1.3) * 12;
  g.beginPath(); g.moveTo(278, 252); g.bezierCurveTo(318, 262 + w1, 356, 244 + w2, 404, 272 + w2);
  g.lineWidth = 30; g.strokeStyle = OUTLINE; g.stroke();
  g.lineWidth = 24; g.strokeStyle = '#C8553D'; g.stroke();
  g.lineWidth = 5; g.strokeStyle = '#F6E7CF'; g.setLineDash([9, 20]); g.stroke(); g.setLineDash([]);
  g.beginPath(); g.moveTo(104, 220); g.quadraticCurveTo(200, 280, 334, 222);
  g.lineWidth = 34; g.strokeStyle = OUTLINE; g.stroke();
  g.lineWidth = 28; g.strokeStyle = '#C8553D'; g.stroke();
  g.lineWidth = 6; g.strokeStyle = '#F6E7CF'; g.setLineDash([10, 22]); g.stroke(); g.setLineDash([]);
  circle(278, 250, 16); paint('#B5452E', OUTLINE, 4);
  g.restore();
}
// A front leg from the shoulder to the paw, with a soft elbow that hangs a little.
function armPath(sh, pw) {
  g.beginPath(); g.moveTo(sh[0], sh[1]);
  g.quadraticCurveTo((sh[0] + pw[0]) / 2, (sh[1] + pw[1]) / 2 + 10, pw[0], pw[1]);
}
function dogArm(sh, pw, w, pass) {
  var ang = Math.atan2(pw[1] - sh[1], pw[0] - sh[0]);
  g.lineCap = 'round';
  if (pass === 'border') {
    armPath(sh, pw); g.lineWidth = w + 18; g.strokeStyle = '#FFFFFF'; g.stroke();
    g.beginPath(); g.ellipse(pw[0], pw[1], 15 + 9, 13 + 9, ang, 0, Math.PI * 2); g.fillStyle = '#FFFFFF'; g.fill();
    return;
  }
  armPath(sh, pw); g.lineWidth = w + 5; g.strokeStyle = UP_EDGE; g.stroke();
  armPath(sh, pw); g.lineWidth = w; g.strokeStyle = UP_FUR; g.stroke();
  // The leg grows out of his chest: no edge where it meets the body.
  circle(sh[0], sh[1], w / 2 + 4); g.fillStyle = UP_FUR; g.fill();
  g.beginPath(); g.ellipse(pw[0], pw[1], 15, 13, ang, 0, Math.PI * 2);
  g.fillStyle = UP_FUR; g.fill(); g.lineWidth = 2.5; g.strokeStyle = UP_EDGE; g.stroke();
  // Toes, curled over whatever the paw is holding.
  g.save(); g.translate(pw[0], pw[1]); g.rotate(ang);
  g.strokeStyle = 'rgba(150,100,40,.6)'; g.lineWidth = 2;
  for (var t = -1; t <= 1; t += 2) { g.beginPath(); g.moveTo(7, t * 4.3); g.lineTo(14, t * 4.8); g.stroke(); }
  g.restore();
}
// Screen point to the upright art's pixels, for a dog leaning by rot.
function uprightArt(wx, wy, rot, s) {
  var d = S.dog, dx = wx - d.x, dy = wy - d.y, c = Math.cos(-rot), sn = Math.sin(-rot);
  return [(dx * c - dy * sn) / s + ART_META.star[0] / 2, (dx * sn + dy * c) / s + ART_META.star[1]];
}
function lerp2(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)]; }
function add2(a, b) { return [a[0] + b[0], a[1] + b[1]]; }
// Where his mug and paws are this frame: mug held in both paws at his chest, now and then a sip; for
// the toast, the near paw carries it over to the admin's mug and then raises it to you.
function uprightPose(P, rot, s) {
  if (!P) return { near: UP_PAWS[0], far: UP_PAWS[1], mug: null };
  var u = smooth(P.fade), hs = S.hero.hs, m = duoMeet();
  var meet = uprightArt(m.x + 2.8 * UP_MUG * hs, m.y, rot, s);
  var sip = smooth((Math.sin(S.t * 0.55 + 2.2) - 0.55) / 0.45) * (1 - P.reach) * u;
  var mug = lerp2(lerp2(lerp2(UP_HOLD, UP_SIP, sip), meet, P.reach), UP_LIFT, P.lift);
  var near = add2(mug, lerp2([-22, 14], [24, 10], P.reach));
  var far = lerp2(add2(mug, [24, 12]), UP_REST, P.reach);
  return { near: lerp2(UP_PAWS[0], near, u), far: lerp2(UP_PAWS[1], far, u), mug: mug, fade: P.fade };
}
function dogLean(P) { return P ? -0.06 * P.reach * (1 - 0.4 * P.lift) : 0; }
function drawCozyDog() {
  var d = S.dog;
  if (!d.on || !imgReady('star')) return;
  if (!upright) makeUpright();
  // Same size and spot as the power-up he came in, so the swap is seamless.
  var AW = ART_META.star[0], AH = ART_META.star[1], s = d.w * 1.25 / AW, P = duoPose(), rot = dogLean(P);
  var pose = uprightPose(P, rot, s), mugK = UP_MUG * S.hero.hs / s;
  ellipse(d.x, d.y + 2, d.w * 0.44, 6 * S.k); paint('rgba(0,0,0,.2)');
  g.save();
  g.translate(d.x, d.y);
  g.rotate(rot);
  g.scale(s, s * (1 + Math.sin(S.t * 1.5) * 0.008));
  g.translate(-AW / 2, -AH);
  var mug = function () {
    g.save();
    g.translate(pose.mug[0], pose.mug[1]);
    g.scale(mugK / UP_MUG, mugK / UP_MUG);
    mugShape(0, 0, 0, '#6FA8C8', UP_MUG, 1);
    g.restore();
  };
  // The white sticker border for his paws and mug goes first, so it only shows outside his outline.
  dogArm(UP_FAR, pose.far, 31, 'border');
  dogArm(UP_NEAR, pose.near, 33, 'border');
  var a0 = g.globalAlpha;
  if (pose.mug) { g.globalAlpha = a0 * pose.fade; STK = 18 / mugK; mug(); STK = 0; g.globalAlpha = a0; }
  g.drawImage(upright, -UP_PAD, -UP_PAD);
  if (d.glasses > 0) {
    var e = smooth(d.glasses);
    g.globalAlpha = a0 * e;
    uprightScarf((1 - e) * 40 * S.k / s);
    g.globalAlpha = a0;
  }
  if (pose.mug) { g.globalAlpha = a0 * pose.fade; mug(); g.globalAlpha = a0; }
  dogArm(UP_FAR, pose.far, 31);
  dogArm(UP_NEAR, pose.near, 33);
  g.restore();
}

// The admin: an umbrella in the rain, a quiet float with eyes closed while the power-up settles in,
// then a mug of something warm.
function heroScarf() {
  scarfTail(8, -56, 20, 4.6, '#C8553D', 0);
  rr(-12, -59, 24, 7, 3.5); paint('#C8553D', OUTLINE, 1.4);
  rr(-10, -55, 7, 12, 2.5); paint('#C8553D', OUTLINE, 1.2);
  if (!STK) { g.fillStyle = '#F6E7CF'; g.fillRect(-9.5, -48, 6, 2); }
}
function heroUmbrella(skin) {
  g.strokeStyle = skin; g.lineWidth = 6;
  line(12, -50, 17, -64);
  line(-12, -50, -9, -62);
  circle(-8, -64, 3.5); paint(skin);
  g.strokeStyle = OUTLINE; g.lineWidth = 2; line(18, -60, 16, -106);
  g.beginPath(); g.arc(21, -60, 3, Math.PI, 0, true); g.stroke();
  g.beginPath(); g.moveTo(-18, -100);
  g.quadraticCurveTo(-14, -136, 16, -138); g.quadraticCurveTo(48, -136, 50, -100);
  for (var i = 0; i < 4; i++) g.quadraticCurveTo(50 - i * 17 - 8.5, -108, 50 - (i + 1) * 17, -100);
  g.closePath(); paint('#E07A5F', OUTLINE, 2);
  if (!STK) { g.strokeStyle = 'rgba(28,34,43,.35)'; g.lineWidth = 1.4; line(16, -137, 16, -104); line(16, -137, -1, -103); line(16, -137, 33, -103); }
  circle(18, -64, 3.5); paint(skin);
}
function mugShape(x, y, rot, c, big, handle) {
  g.save();
  g.translate(x, y); g.rotate(rot); g.scale(big, big);
  g.beginPath(); g.arc(handle * 3, 0.2, 1.8, -Math.PI / 2, Math.PI / 2, handle < 0); paint(null, OUTLINE, 1.3);
  rr(-2.8, -3.3, 5.6, 6.6, 1.4); paint(c, OUTLINE, 1);
  if (!STK) {
    ellipse(0, -2.9, 2.3, 0.8); paint('#6B3E26');
    g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 0.8;
    for (var i = -1; i <= 1; i += 2) {
      g.beginPath(); g.moveTo(i * 1.1, -4.5);
      g.quadraticCurveTo(i * 1.1 + 1.4, -6.2 - Math.sin(S.t * 2 + i) * 0.6, i * 1.1, -8);
      g.stroke();
    }
  }
  g.restore();
}
function heroMug(skin) {
  var P = duoPose();
  g.strokeStyle = skin; g.lineWidth = 6;
  line(-12, -50, -16, -30);
  circle(-16, -29, 3.6); paint(skin);
  if (!P) {
    g.strokeStyle = skin; g.lineWidth = 6;
    line(12, -50, 16, -30);
    circle(16, -29, 3.6); paint(skin);
    return;
  }
  // The admin steps 3 units toward UPdog (see drawCozyHero) to meet his mug.
  var hs = S.hero.hs, m = duoMeet(), meetX = (m.x - 4.5 * hs - S.hero.x) / hs - 3, meetY = (m.y - S.hero.y) / hs;
  var sip = smooth((Math.sin(S.t * 0.6) - 0.5) / 0.5) * (1 - P.reach);
  var mx = lerp(lerp(lerp(22, 19, sip), meetX, P.reach), 24, P.lift), my = lerp(lerp(lerp(-47, -65, sip), meetY, P.reach), -76, P.lift);
  var hx = mx - 5, hy = my + 3;
  g.strokeStyle = skin; g.lineWidth = 6;
  line(12, -50, hx, hy);
  var a = g.globalAlpha;
  g.globalAlpha = a * P.fade;
  mugShape(mx, my, -0.1 + 0.2 * P.reach, '#E8A33D', 1.6, -1);
  g.globalAlpha = a;
  circle(hx, hy, 3.8); paint(skin);
}
function heroHappyEyes() {
  g.strokeStyle = OUTLINE; g.lineWidth = 1.6;
  g.beginPath(); g.arc(-4.5, -66, 2.2, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  g.beginPath(); g.arc(4.5, -66, 2.2, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
}
function heroMeditate() {
  var skin = '#8D5524';
  g.lineCap = 'round';
  rr(-21, -15, 42, 11, 5.5); paint('#2B2D42');
  ellipse(-19, -8, 5, 3.2); paint('#111111'); ellipse(19, -8, 5, 3.2); paint('#111111');
  g.save();
  g.translate(0, 11);
  rr(-13, -55, 26, 33, 7); paint('#154BB7', OUTLINE, 2);
  g.beginPath(); g.moveTo(-6, -55); g.lineTo(0, -44); g.lineTo(6, -55); g.closePath(); paint('#FFFFFF');
  g.beginPath(); g.moveTo(-2, -50); g.lineTo(2, -50); g.lineTo(3, -34); g.lineTo(0, -31); g.lineTo(-3, -34); g.closePath(); paint('#F48FB1');
  heroScarf();
  g.strokeStyle = skin; g.lineWidth = 6;
  line(-12, -50, -4, -39); line(12, -50, 4, -39);
  ellipse(0, -40, 3.8, 5.4); paint(skin);
  circle(0, -67, 12); paint(skin, OUTLINE, 2);
  g.fillStyle = '#1B1B1B';
  g.beginPath(); g.arc(0, -69, 12.5, Math.PI * 1.02, Math.PI * 1.98); g.closePath();
  if (STK) paint('#1B1B1B'); else g.fill();
  if (!STK) {
    g.strokeStyle = OUTLINE; g.lineWidth = 1.5;
    g.beginPath(); g.arc(-4.5, -68, 2.3, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    g.beginPath(); g.arc(4.5, -68, 2.3, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    g.beginPath(); g.arc(0, -62, 3, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
  }
  g.restore();
}
function calmLift() {
  var c = smooth(((S.chargeT || 0) - 0.3) / 1.4);
  return c * 16 + Math.sin(S.t * 1.3) * 2.5 * c;
}
function drawCozyHero() {
  var h = S.hero, ph = S.phase, lev = ph === 'charge' ? calmLift() : 0;
  g.save();
  g.translate(h.x, h.y);
  g.scale(h.hs, h.hs);
  ellipse(0, 0, 18 - lev * 0.3, 4); paint('rgba(0,0,0,.22)');
  if (ph === 'charge' || ph === 'unlimited') {
    var calm = ph === 'charge' ? smooth(((S.chargeT || 0) - 0.3) / 2.4) : 0.35;
    var halo = g.createRadialGradient(0, -48 - lev, 6, 0, -48 - lev, 66);
    halo.addColorStop(0, 'rgba(255,214,150,' + (0.15 + 0.45 * calm).toFixed(3) + ')');
    halo.addColorStop(1, 'rgba(255,214,150,0)');
    g.fillStyle = halo;
    g.fillRect(-70, -120 - lev, 140, 150);
  }
  g.translate(0, -lev);
  var P = ph === 'unlimited' ? duoPose() : null;
  if (P) g.translate(3 * P.reach, 0);
  if (ph === 'charge') { STK = 7; heroMeditate(); STK = 0; heroMeditate(); }
  else { STK = 7; heroFigure(ph, S.t); STK = 0; heroFigure(ph, S.t); }
  g.restore();
}

// Teachers ride bicycles home instead of driving.
function drawBike(tc, nt) {
  var sc = S.k * depth(tc.cy) * 1.2, riding = /^(leave|arrive)/.test(tc.state), spin = riding ? S.t * 7 : 0, frame = cz(tc.car, nt);
  g.save();
  g.translate(tc.cx, tc.cy);
  g.scale(sc, sc);
  if (nt > 0.4 && riding) {
    var beam = g.createLinearGradient(14, 0, 60, 0);
    beam.addColorStop(0, 'rgba(255,243,176,.35)'); beam.addColorStop(1, 'rgba(255,243,176,0)');
    g.fillStyle = beam;
    g.beginPath(); g.moveTo(14, -18); g.lineTo(60, -26); g.lineTo(60, -6); g.closePath(); g.fill();
  }
  ellipse(0, 0, 17, 2.6); paint('rgba(0,0,0,.18)');
  g.lineCap = 'round'; g.lineJoin = 'round';
  [-10, 10].forEach(function (wx) {
    circle(wx, -7, 6.5); g.lineWidth = 1.8; g.strokeStyle = OUTLINE; g.stroke();
    g.lineWidth = 0.8; g.strokeStyle = 'rgba(28,34,43,.5)';
    line(wx + Math.cos(spin) * 6, -7 + Math.sin(spin) * 6, wx - Math.cos(spin) * 6, -7 - Math.sin(spin) * 6);
    line(wx + Math.cos(spin + 1.57) * 6, -7 + Math.sin(spin + 1.57) * 6, wx - Math.cos(spin + 1.57) * 6, -7 - Math.sin(spin + 1.57) * 6);
  });
  g.strokeStyle = frame; g.lineWidth = 2.2;
  g.beginPath(); g.moveTo(-10, -7); g.lineTo(-2, -7); g.lineTo(5, -16); g.lineTo(-4, -16); g.lineTo(-2, -7); g.moveTo(5, -16); g.lineTo(10, -7); g.moveTo(-4, -16); g.lineTo(-5, -19); g.moveTo(5, -16); g.lineTo(7, -21); g.stroke();
  g.strokeStyle = OUTLINE; g.lineWidth = 2; line(-7.5, -19.5, -2.5, -19.5); line(6, -21.5, 10, -21.5);
  rr(8, -21, 8, 6, 1.5); paint(cz('#B07A45', nt), OUTLINE, 1);
  circle(10.5, -21.5, 1.4); paint(cz('#E9A0B8', nt)); circle(13.5, -22, 1.4); paint(cz('#F6CF4A', nt));
  if (nt > 0.4) { circle(15.5, -17, 1.4); paint('#FFF3B0'); }
  if (riding) {
    g.strokeStyle = tc.pants; g.lineWidth = 3;
    var pd = Math.sin(spin) * 2.5;
    line(-4, -21, 0 + pd, -10); line(-4, -21, -1 - pd, -11);
    rr(-8, -34, 9, 14, 3.5); paint(cz(tc.shirt, nt), OUTLINE, 1.2);
    g.strokeStyle = tc.skin; g.lineWidth = 2.4; line(-1, -31, 8, -22);
    circle(-3, -39, 4.8); paint(tc.skin, OUTLINE, 1.2);
    g.fillStyle = tc.hair; g.beginPath(); g.arc(-3, -39.3, 5.2, Math.PI, 0); g.closePath(); g.fill();
    if (!tc.scarf) tc.scarf = pick(SCARVES);
    scarfTail(-6, -33, -12, 2.2, tc.scarf, tc.i);
  }
  g.restore();
}

// The mug toast: kids reach in and clink twice, then lift their mugs to you and wave.
var TOAST = { approach: 0.16, clink1: 0.4, clink2: 0.65, raise: 0.8 };
var TOAST_SCALE = 1.15;
function toastReach(a) {
  if (a < TOAST.clink1) return smooth((a - TOAST.approach) / (TOAST.clink1 - TOAST.approach));
  if (a < TOAST.clink2) return 1 - 0.4 * Math.sin(Math.PI * (a - TOAST.clink1) / (TOAST.clink2 - TOAST.clink1));
  return 1;
}
function toastLift(a) { return smooth((a - TOAST.raise) / 0.22); }
function toastPoint(s) {
  var y = s.y + TOAST_SPOTS[1].oy * s.sc, ksc = S.k * depth(y) * 1.3 * TOAST_SCALE;
  return { x: s.x, y: y - 32 * ksc };
}
function toastBeat(k, was) {
  function at(t) { return was < t && k.age >= t; }
  var chooser = S.phase === 'choose';
  if (!chooser && MODE !== 'cozy') return;
  PART_TAG = chooser ? 'cozy' : undefined;
  var m = toastPoint(k.target);
  if (at(TOAST.clink1) || at(TOAST.clink2)) {
    if (!chooser) sfx.clink();
    burst(m.x, m.y - 6 * S.k, 4, ['#FFFFFF', '#FFE08A'], 50 * S.k, 'dot');
  }
  if (at(TOAST.raise + 0.1)) {
    for (var i = 0; i < 3; i++) {
      S.parts.push({ x: m.x + rand(-14, 14) * S.k, y: m.y, vx: rand(-15, 15), vy: rand(-60, -35) * S.k, life: rand(1.2, 1.6), c: pick(['#E85D8F', '#F48FB1', '#FF9F6E']), s: rand(3.5, 5) * S.k, shape: 'heart', rot: 0, vr: 0, grav: -8, only: PART_TAG });
    }
  }
  PART_TAG = undefined;
}
function drawToaster(p, x, y, sc) {
  sc *= TOAST_SCALE;
  var L = 8, bh = 10, bw = 11, hr = 5.6, top = -L - bh, a = p.age;
  var side = p.slot === 0 ? 1 : p.slot === 2 ? -1 : 0, hs = side || 1, handle = side ? -side : 1;
  var reach = toastReach(a), lift = toastLift(a), pop = clamp(Math.min(a / 0.15, p.cheer / 0.15), 0, 1), m = toastPoint(p.target);
  var meetX = (m.x - x) / sc - side * 6.6, meetY = (m.y - y) / sc + (side ? 1.5 : 0);
  var raiseX = side ? 8.5 * hs : 0.5, raiseY = top - (side ? 13 : 18);
  var mx = lerp(lerp(hs * 7, meetX, reach), raiseX, lift), my = lerp(lerp(top + 5, meetY, reach), raiseY, lift);
  var sx = hs * (bw / 2 - 1), gap = Math.abs(mx - sx), lean = clamp(gap - 13, 0, 7) * (mx > sx ? 1 : -1);
  var big = 1.4 + 0.4 * lift, rot = hs * 0.3 * reach * (1 - lift) - hs * 0.15 * lift;
  if (!p.scarf) p.scarf = pick(SCARVES);
  g.save();
  g.translate(x, y);
  g.scale(sc, sc);
  ellipse(0, 0, 7, 2.2); paint('rgba(0,0,0,.2)');
  g.scale(pop, pop);
  g.lineCap = 'round';
  g.strokeStyle = p.pants; g.lineWidth = 3.4;
  line(-2.6 + lean, -L, -3.4, -1);
  line(2.6 + lean, -L, 3.4, -1);
  g.translate(lean, 0);
  mx -= lean;
  if (p.pack) { rr(-bw / 2 - 3, top + 1, 5, bh - 3, 2); paint(p.pack, OUTLINE, 1); }
  rr(-bw / 2, top, bw, bh + 1, 3.5); paint(p.shirt, OUTLINE, 1.3);
  scarfTail(bw / 2 - 2, top + 1, 7, 2.2, p.scarf, p.ph);
  rr(-bw / 2 + 0.5, top - 0.6, bw - 1, 3.2, 1.6); paint(p.scarf, OUTLINE, 0.8);
  g.strokeStyle = p.skin; g.lineWidth = 2.6;
  line(sx, top + 3, mx + handle * 3.4 * big, my);
  if (lift > 0.3) {
    var wave = Math.sin(S.t * 9) * 2.5;
    line(-sx, top + 3, -hs * (bw / 2 + 3 + wave), top - 8);
  } else {
    line(-sx, top + 3, -hs * (bw / 2 + 1.5), top + bh - 1);
  }
  var hy = top - hr + 1;
  circle(0, hy, hr); paint(p.skin, OUTLINE, 1.3);
  g.fillStyle = p.hair;
  g.beginPath(); g.arc(0, hy - 0.3, hr + 0.4, Math.PI, 0); g.closePath();
  if (STK) paint(p.hair); else g.fill();
  if (p.style === 1) { rr(-hr - 0.6, hy - 1, 2.6, 8, 1.3); paint(p.hair); rr(hr - 2, hy - 1, 2.6, 8, 1.3); paint(p.hair); }
  else if (p.style === 2) { circle(-hr, hy - 3, 2.8); paint(p.hair); circle(hr, hy - 3, 2.8); paint(p.hair); }
  if (!STK) {
    if (lift > 0.5) {
      g.strokeStyle = '#1B1B1B'; g.lineWidth = 0.9;
      g.beginPath(); g.arc(-2, hy + 1.2, 1.1, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.beginPath(); g.arc(2, hy + 1.2, 1.1, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      g.beginPath(); g.arc(0, hy + 2.2, 1.6, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
    } else {
      g.fillStyle = '#1B1B1B';
      circle(-2 + side * 0.6, hy + 0.8, 0.95); g.fill();
      circle(2 + side * 0.6, hy + 0.8, 0.95); g.fill();
    }
  }
  mugShape(mx, my, rot, p.mug, big, handle);
  g.restore();
}

// Floating messages become little paper tags with stitched edges and a serif hand.
var TAG_STYLES = {
  sad: ['#F1EEF6', '#5E5A86'],
  happy: ['#EEF3E2', '#3F5E2E'],
  win: ['#FFF8EC', '#7A3A22'],
  tend: ['#FFF8EC', '#7A3A22'],
  cap: ['#FFF8EC', '#A0452C']
};
function cozyTag(text, x, y, size, fg, bg) {
  g.font = 'italic 600 ' + size + 'px ' + SERIF;
  var w = g.measureText(text).width + size * 1.5, h = size * 2;
  x = clamp(x, w / 2 + 6, S.W - w / 2 - 6);
  g.save();
  g.shadowColor = 'rgba(90,50,30,.2)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
  rr(x - w / 2, y - h / 2, w, h, h / 2); g.fillStyle = bg; g.fill();
  g.restore();
  g.save();
  g.setLineDash([3, 3]); g.lineWidth = 1.2; g.strokeStyle = fg; g.globalAlpha *= 0.4;
  rr(x - w / 2 + 3.5, y - h / 2 + 3.5, w - 7, h - 7, (h - 7) / 2); g.stroke();
  g.restore();
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, x, y + 1);
}
function drawCozyFloats() {
  var ks = clamp(S.k, 0.85, 1.1);
  S.floats.forEach(function (f) {
    var age = f.max - f.life, size = Math.round(Math.max(14, f.size * ks)), st = TAG_STYLES[f.style];
    g.globalAlpha = Math.min(1, age / 0.5, f.life / 0.8);
    if (st) cozyTag(f.text, f.x, f.y, size, st[1], st[0]);
    else { g.font = '600 ' + size + 'px ' + SERIF; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#7A3A22'; g.fillText(f.text, f.x, f.y); }
  });
  g.globalAlpha = 1;
}
function drawCozyCursor(p) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  var r = 14 * clamp(S.k, 0.8, 1.2), glow = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.5);
  glow.addColorStop(0, 'rgba(255,214,140,.6)'); glow.addColorStop(1, 'rgba(255,214,140,0)');
  g.fillStyle = glow; g.fillRect(p.x - r * 2, p.y - r * 2, r * 4, r * 4);
  g.restore();
  circle(p.x, p.y, r * 0.32); paint('#FFF9EC', 'rgba(214,160,90,.9)', 1.2);
}
