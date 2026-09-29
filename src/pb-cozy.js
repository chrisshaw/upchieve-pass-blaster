// Cozy mode: the same game on an autumn afternoon. Schools become old-fashioned schoolhouses,
// the crisis is a gray, rainy spell, the power-up is a gust of wind that clears the sky, and
// unlimited mode is lamplit windows, swirling leaves, and fireflies that pile up with every click.
var LEAVES = ['#E07A3F', '#E8A33D', '#C2452D', '#F2CC60', '#B5562E'];
var COZY_WALLS = ['#C8553D', '#D9A441', '#B5452E', '#8FA36B', '#C8553D', '#E3CFA0'];
var COZY_ROOF = '#5B3B33', COZY_TRIM = '#FFF7E8', COZY_DOOR = '#2F5D50';
var SCARVES = ['#C8553D', '#E8A33D', '#6FA8C8', '#8FA36B', '#9C89B8', '#E07A5F'];
var COZY_SKY = [[0, '#1E1A3A', '#3A2F57'], [5, '#2A2450', '#4D3F6B'], [6.5, '#F6B9A0', '#FCE2C4'], [8, '#A9CFE0', '#F6E9D0'],
  [17, '#A9CFE0', '#F6E9D0'], [18.5, '#EE9A78', '#FBD3A1'], [19.3, '#5B4A8B', '#E8A08A'], [20, '#2A2450', '#4D3F6B'], [24, '#1E1A3A', '#3A2F57']];
var GLOOM_SKY = ['#8C95A4', '#BCC2CB'];
var COZY_CLOUDS = [], TREES = [];
(function seedCozy() {
  for (var i = 0; i < 9; i++) COZY_CLOUDS.push({ x: Math.random() * 1.3, y: rand(0.1, 0.62), s: rand(0.8, 1.4), v: rand(0.004, 0.009), storm: i >= 5 });
  for (var j = 0; j < 16; j++) TREES.push({ x: (j + rand(-0.3, 0.3)) / 15, s: rand(0.75, 1.3), c: pick(['#D9622B', '#E8A33D', '#C2452D', '#E07A3F', '#B8A13A']), ph: rand(0, 6) });
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
      g.globalAlpha = nt * (1 - gl) * (0.45 + 0.55 * Math.sin(S.t * 2 + s.tw));
      circle(s.x * W, s.y * G.horizon * 0.95, 1.3 * k);
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
    circle(x, y, 20 * k); paint('#FFF3D6');
    circle(x + 9 * k, y - 5 * k, 17 * k); paint(c[0]);
  }
  g.globalAlpha = 1;

  // Gray clouds roll in with the rain, and the gust blows everything off to the right.
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
  TREES.forEach(function (tr, i) {
    var x = tr.x * S.W, y = G.horizon + 2 * k, s = tr.s * k, sway = Math.sin(S.t * (1.2 + S.windy * 2.5) + tr.ph) * (1 + S.windy * 5) * s;
    g.fillStyle = cz('#6B4A35', nt);
    g.fillRect(x - 2 * s, y - 14 * s, 4 * s, 14 * s);
    g.fillStyle = cz(tr.c, nt);
    circle(x + sway, y - 24 * s, 11 * s); g.fill();
    circle(x - 7 * s + sway * 0.7, y - 17 * s, 8 * s); g.fill();
    circle(x + 7 * s + sway * 0.7, y - 17 * s, 8 * s); g.fill();
  });
}

function drawCozyGround(nt) {
  var G = S.G, W = S.W, H = S.H, k = S.k;
  hillPath(G.horizon, 11 * k, 0.006, 0.013, 0.5); paint(cz('#E6C28C', nt));
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
  g.fillStyle = cz('#EFE2CA', nt);
  g.fillRect(0, G.roadTop, W, 8 * k);
  g.fillStyle = cz('#857A72', nt);
  g.fillRect(0, G.roadTop + 8 * k, W, H - G.roadTop);
  g.fillStyle = cz('#F7E4B8', nt);
  for (var d = 10; d < W; d += 44 * k) { rr(d, G.roadMid - 2 * k, 22 * k, 4 * k, 2 * k); g.fill(); }
}

function drawCozyRainbow(nt) {
  var a = S.rainbow * (1 - nt * 0.85) * (1 - S.gloom);
  if (a <= 0.02) return;
  var cols = ['#D9624A', '#EE9A4D', '#F2CC60', '#9CC47E', '#6FA8C8', '#9C89B8'];
  var bw = 10 * S.k, cx = S.W * 0.52, cy = S.G.horizon + 10 * S.k, R = Math.min(S.W * 0.4, S.G.horizon * 1.05);
  var inner = R - (cols.length - 1) * bw;
  g.save();
  g.globalAlpha = a * 0.85;
  g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy, (R + inner) / 2, Math.PI, 0); g.lineWidth = cols.length * bw + 10 * S.k; g.strokeStyle = '#FFFFFF'; g.stroke();
  cols.forEach(function (c, i) {
    g.beginPath(); g.arc(cx, cy, R - i * bw, Math.PI, 0); g.lineWidth = bw + 0.5; g.strokeStyle = c; g.stroke();
  });
  g.restore();
}

// The schoolhouse: a front gable, a belfry with a bell and a pennant, a SCHOOL sign over the door,
// tall trimmed windows with flower boxes, and a chimney. Bigger schools get a second floor and columns.
function gableH(W) { return Math.min(W * 0.3, 30); }
function roofRise(s) { var d = dims(s); return d.mega ? 36 : gableH(d.w) + 34; }
function schoolWall(s) { return COZY_WALLS[(s.id != null ? s.id : S.nextId) % COZY_WALLS.length]; }
function cozyWindow(i, nt) {
  if (S.gloom > 0.5) return cz('#7D8796', 0);
  if (S.phase === 'unlimited') return nt > 0.3 ? '#FFC861' : '#FFE3A3';
  return cz('#CFE3EE', nt);
}
function belfry(x, y, s, nt) {
  var roof = cz(COZY_ROOF, nt), trim = cz(COZY_TRIM, nt);
  rr(x - 8, y - 13, 16, 15, 2); paint(trim, OUTLINE, 1.8);
  rr(x - 5, y - 10, 10, 9, 4); paint(cz('#3A2A2A', nt));
  g.save();
  g.translate(x, y - 9.5);
  var ring = s.ring || 0;
  g.rotate(Math.sin(S.t * 9) * 0.5 * ring + (S.phase === 'unlimited' ? Math.sin(beatPos() * Math.PI) * 0.12 : 0));
  g.beginPath(); g.moveTo(-3.4, 6); g.quadraticCurveTo(-3.6, 0.5, 0, 0); g.quadraticCurveTo(3.6, 0.5, 3.4, 6); g.lineTo(4.4, 7.2); g.lineTo(-4.4, 7.2); g.closePath();
  paint('#E8B04A', OUTLINE, 1.1);
  g.restore();
  g.beginPath(); g.moveTo(x - 11, y - 12); g.lineTo(x, y - 26); g.lineTo(x + 11, y - 12); g.closePath(); paint(roof, OUTLINE, 1.8);
  g.strokeStyle = '#E5E5E5'; g.lineWidth = 1.8; line(x, y - 26, x, y - 40);
  g.beginPath(); g.moveTo(x, y - 40);
  for (var f = 0; f <= 4; f++) g.lineTo(x + f * 3.6, y - 40 + Math.sin(S.t * (6 + S.windy * 6) + f) * 1.4 + f * 0.9);
  g.lineTo(x, y - 32);
  g.closePath(); paint(S.gloom > 0.5 ? '#9AA0AE' : cz('#C8553D', nt), OUTLINE, 1.2);
}
function smoke(x, y) {
  if (STK) return;
  var on = S.phase === 'unlimited' || S.phase === 'choose' ? 0.7 : 0.45;
  for (var i = 0; i < 3; i++) {
    var ph = (S.t * 0.45 + i / 3) % 1;
    g.globalAlpha = (1 - ph) * on * (1 - S.gloom * 0.6);
    circle(x + ph * (6 + S.windy * 30), y - ph * 32, 3 + ph * 6);
    g.fillStyle = '#FFFFFF'; g.fill();
  }
  g.globalAlpha = 1;
}
function signBoard(y, w, nt) {
  rr(-w / 2, y, w, 10, 2); paint(cz('#F4E6C8', nt), OUTLINE, 1.4);
  if (STK) return;
  g.fillStyle = cz('#5B3B33', nt);
  g.font = '800 7.4px ' + UI_FONT;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText('SCHOOL', 0, y + 5.4);
}
function paneWindow(wx, wy, ww, wh, i, nt, box) {
  var trim = cz(COZY_TRIM, nt), glass = cozyWindow(i, nt);
  rr(wx - 1.6, wy - 1.6, ww + 3.2, wh + 3.2, 1.6); paint(trim, OUTLINE, 1.4);
  rr(wx, wy, ww, wh, 1); paint(glass);
  if (!STK && S.phase === 'unlimited' && nt > 0.3) {
    g.fillStyle = 'rgba(92,52,36,.5)';
    if (i % 2) {
      var bob = Math.sin(beatPos() * Math.PI * 2 + i) * 0.5;
      circle(wx + ww / 2, wy + wh - 5.5 + bob, 2.4); g.fill();
      rr(wx + ww / 2 - 3.2, wy + wh - 3 + bob, 6.4, 3, 1.4); g.fill();
    } else {
      g.beginPath(); g.moveTo(wx + ww * 0.3, wy + wh * 0.5); g.lineTo(wx + ww * 0.7, wy + wh * 0.5); g.lineTo(wx + ww * 0.6, wy + wh * 0.3); g.lineTo(wx + ww * 0.4, wy + wh * 0.3); g.closePath(); g.fill();
      g.fillRect(wx + ww / 2 - 0.5, wy + wh * 0.5, 1, wh * 0.3);
    }
  } else if (!STK && S.phase === 'build') {
    g.strokeStyle = '#FFFFFF'; g.lineWidth = 1.6; line(wx + 2, wy + 6, wx + 6, wy + 2);
  }
  g.strokeStyle = trim; g.lineWidth = 1.3;
  line(wx + ww / 2, wy, wx + ww / 2, wy + wh);
  line(wx, wy + wh / 2, wx + ww, wy + wh / 2);
  if (!box) return;
  rr(wx - 2.4, wy + wh + 1.6, ww + 4.8, 4, 1); paint(cz('#8B5A3C', nt), OUTLINE, 1);
  if (STK) return;
  ['#E07A3F', '#C2452D', '#F2CC60'].forEach(function (c, j) { circle(wx + 1 + j * (ww - 2) / 2, wy + wh + 1.4, 1.7); paint(cz(c, nt)); });
}
function drawSchoolhouse(s, W, H, tier, nt) {
  var wall = cz(schoolWall(s), nt), trim = cz(COZY_TRIM, nt), roof = cz(COZY_ROOF, nt), R = gableH(W);
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

  // Chimney on the right slope, then the roof edges over it.
  var chx = W * 0.26, chy = -H - R * (1 - chx / (W / 2));
  rr(chx - 4, chy - 15, 8, 17, 1); paint(cz('#9C4A35', nt), OUTLINE, 1.6);
  smoke(chx, chy - 18);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.beginPath(); g.moveTo(-W / 2 - 6, -H + 4); g.lineTo(0, -H - R - 2); g.lineTo(W / 2 + 6, -H + 4);
  if (STK) paint(null, OUTLINE, 9);
  else { g.lineWidth = 10; g.strokeStyle = OUTLINE; g.stroke(); g.lineWidth = 7.4; g.strokeStyle = roof; g.stroke(); }
  belfry(0, -H - R - 1, s, nt);
  // Everything below sits inside the walls, so the sticker-outline passes can skip it.
  if (STK) return;

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
  if (!STK) { circle(-2.4, -dh / 2, 1); paint('#E8B04A'); circle(2.4, -dh / 2, 1); paint('#E8B04A'); }
  rr(-dw / 2 - 6, -3, dw + 12, 4, 1.5); paint(cz('#D8CBB2', nt), OUTLINE, 1.2);
}
function drawCozyTower(s, W, H, nt) {
  var trim = cz(COZY_TRIM, nt);
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

// Unlimited mode's outline: warm gold that breathes with the music instead of a racing rainbow.
function goldAcross(W, H, t) {
  var shift = (t % 1) * W, x0 = -W / 2 - shift, cols = ['#FFD27A', '#FFB35C', '#FFE7A3'];
  var gr = g.createLinearGradient(x0, -H - 40, x0 + W * 2, 10);
  for (var i = 0; i <= 8; i++) gr.addColorStop(i / 8, cols[i % cols.length]);
  return gr;
}
// A small rain cloud over each school during the gloomy spell.
function drawDrizzle(d, s) {
  var cy = -d.h - roofRise(s) - 16;
  g.globalAlpha = S.gloom;
  g.fillStyle = '#9AA2B0';
  circle(-15, cy + 5, 10); g.fill(); circle(0, cy, 13); g.fill(); circle(15, cy + 5, 10); g.fill();
  rr(-24, cy + 3, 48, 12, 6); g.fill();
  g.strokeStyle = '#8FB0DA'; g.lineWidth = 1.6; g.lineCap = 'round';
  for (var r = 0; r < 6; r++) {
    var ry = (S.t * 90 + r * 17) % 26;
    line(-20 + r * 8, cy + 17 + ry, -21 + r * 8, cy + 22 + ry);
  }
  g.globalAlpha = 1;
}
// At night each school glows like a lit window, pulsing gently on the beat.
function drawCozyGlow(s) {
  var d = dims(s), sc = s.sc, pulse = Math.pow(1 - beatFrac(), 2);
  var gy = s.y - d.h * sc * 0.55, R = d.w * sc * 1.15;
  g.save();
  g.globalCompositeOperation = 'lighter';
  var glow = g.createRadialGradient(s.x, gy, 0, s.x, gy, R);
  glow.addColorStop(0, 'rgba(255,184,92,' + (0.26 + 0.12 * pulse) + ')');
  glow.addColorStop(1, 'rgba(255,184,92,0)');
  g.fillStyle = glow;
  g.fillRect(s.x - R, gy - R, R * 2, R * 2);
  g.restore();
}

function drawRain() {
  var gl = S.gloom;
  if (gl < 0.02) return;
  var n = reduced ? 50 : 150, W = S.W, H = S.H, k = S.k, len = 12 * k, lean = (0.18 + S.windy * 0.9);
  g.save();
  g.strokeStyle = 'rgba(150,172,205,' + (0.6 * gl).toFixed(3) + ')';
  g.lineWidth = 1.3 * k; g.lineCap = 'round';
  g.beginPath();
  for (var i = 0; i < n; i++) {
    var sp = (380 + (i * 37) % 160) * k, x0 = ((i * 0.61803) % 1) * (W + 300) - 200;
    var y = (S.t * sp + i * 71.3) % (H + 60) - 30, x = x0 + (y + 30) * lean;
    g.moveTo(x, y); g.lineTo(x - lean * len, y - len);
  }
  g.stroke();
  g.restore();
}

// Leaves: a few drift by while you build, then the wind picks up and swirls them around.
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
  if (S.phase === 'build' || S.phase === 'intro') return 7;
  return reduced ? 10 : 28;
}
function spawnLeaf(anywhere) {
  S.leaves.push({
    x: anywhere ? rand(0, S.W) : rand(-40, -10), y: anywhere ? rand(0, S.G.roadTop) : rand(-20, S.G.roadTop * 0.8),
    vx: rand(20, 50) * S.k, vy: rand(10, 30) * S.k, rot: rand(0, 6), vr: rand(-3, 3), flip: rand(0, 6),
    c: pick(LEAVES), s: rand(4, 7) * S.k
  });
}
function stepLeaves(dt) {
  var want = leafTarget(), wind = (25 + S.windy * 230) * S.k, eddy = (22 + S.windy * 55) * S.k;
  if (S.leaves.length < want && Math.random() < dt * 8) spawnLeaf(!S.leaves.length);
  S.leaves = S.leaves.filter(function (l) {
    // A slowly turning flow field makes the leaves loop and eddy instead of flying in straight lines.
    var a = Math.sin(l.x * 0.005 + S.t * 0.6) * Math.cos(l.y * 0.007 - S.t * 0.45) * Math.PI * 2;
    var tx = wind + Math.cos(a) * eddy * 1.6, ty = 14 * S.k + Math.sin(a) * eddy * 1.6, e = Math.min(1, dt * 2);
    l.vx += (tx - l.vx) * e; l.vy += (ty - l.vy) * e;
    l.x += l.vx * dt; l.y += l.vy * dt;
    l.rot += l.vr * dt * (1 + S.windy); l.flip += dt * (3 + S.windy * 4);
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
  if (p.gust) return;
  p.vx = p.vx * (1 - Math.min(1, 1.4 * dt)) + S.windy * 90 * S.k * dt;
  if (p.vy > 80 * S.k) p.vy = 80 * S.k;
}
// While the power-up charges, the wind pulls leaves into a whirl around the admin.
function leafVortex(intensity) {
  var n = Math.ceil(intensity * 2);
  for (var i = 0; i < n; i++) {
    S.parts.push({
      x: -99, y: -99, vx: 0, vy: 0, life: rand(0.8, 1.3), c: pick(LEAVES), s: rand(4, 7) * S.k, shape: 'leaf', rot: rand(0, 6), vr: rand(-6, 6), grav: 0,
      orb: { cx: S.hero.x, cy: S.hero.y - 40 * S.k, a: rand(0, 6.28), r: rand(100, 230) * S.k, w: rand(4, 7), dr: rand(70, 160) * S.k, lift: rand(20, 70) * S.k }
    });
  }
}
function orbitStep(p, dt) {
  var o = p.orb;
  o.a += o.w * dt; o.r = Math.max(10 * S.k, o.r - o.dr * dt); o.cy -= o.lift * dt;
  p.x = o.cx + Math.cos(o.a) * o.r; p.y = o.cy + Math.sin(o.a) * o.r * 0.45; p.rot += p.vr * dt;
}
// The power-up lands as one big gust: leaves sweep across the whole town and blow the rain away.
function gust() {
  var n = reduced ? 40 : 150;
  for (var i = 0; i < n; i++) {
    S.parts.push({
      x: rand(-S.W * 0.5, 0), y: rand(0, S.G.roadTop), vx: rand(750, 1150) * S.k, vy: rand(-70, 50) * S.k, life: rand(1.3, 1.9),
      c: pick(LEAVES), s: rand(4, 8) * S.k, shape: 'leaf', rot: rand(0, 6), vr: rand(-10, 10), grav: 0, gust: 1
    });
  }
  S.windy = 1.3;
}

// Fireflies: every click sends a few up, and they stay, so the night fills with them.
var FLY_MAX = reduced ? 80 : 240;
function addFlies(x, y, n) {
  for (var i = 0; i < n; i++) S.flies.push({ x: x + rand(-12, 12) * S.k, y: y, ph: rand(0, 10), sp: rand(0.6, 1.4), rise: rand(0.8, 1.4) });
  if (S.flies.length > FLY_MAX) S.flies.splice(0, S.flies.length - FLY_MAX);
}
function seedFlies(n) {
  for (var i = 0; i < n; i++) S.flies.push({ x: rand(0, S.W), y: rand(S.G.horizon - 50 * S.k, S.G.roadTop), ph: rand(0, 10), sp: rand(0.6, 1.4), rise: 0 });
}
// They hover over the field and the low sky, the way fireflies do.
function stepFlies(dt) {
  var top = S.G.horizon - 90 * S.k, bottom = S.G.roadTop;
  S.flies.forEach(function (f) {
    var t = S.t * f.sp + f.ph;
    var vx = Math.cos(t * 0.8) * 22 + Math.cos(t * 0.33 + f.ph) * 14 + S.windy * 40, vy = Math.sin(t * 1.1) * 16;
    if (f.rise > 0) { f.rise -= dt; vy -= 90 * f.rise; }
    f.x += vx * S.k * dt; f.y += vy * S.k * dt;
    if (f.x > S.W + 10) f.x = -10; else if (f.x < -10) f.x = S.W + 10;
    f.y = clamp(f.y, top, bottom);
  });
}
function drawFlies(nt) {
  if (!S.flies.length) return;
  var night = clamp(nt * 1.6, 0, 1), pulse = S.phase === 'unlimited' || S.phase === 'choose' ? Math.pow(1 - beatFrac(), 2) : 0;
  g.save();
  if (night < 1) {
    g.fillStyle = '#E09A1F';
    S.flies.forEach(function (f) {
      g.globalAlpha = (1 - night) * (0.5 + 0.4 * Math.sin(S.t * 3 * f.sp + f.ph));
      starPath(f.x, f.y, 3.2 * S.k, f.ph + S.t); g.fill();
    });
  }
  if (night > 0) {
    g.globalCompositeOperation = 'lighter';
    S.flies.forEach(function (f) {
      var a = night * (0.5 + 0.5 * Math.sin(S.t * 3 * f.sp + f.ph)), r = (1.5 + pulse * 0.8) * S.k;
      g.globalAlpha = a * 0.35; circle(f.x, f.y, r * 2.8); g.fillStyle = '#FFB000'; g.fill();
      g.globalAlpha = a; circle(f.x, f.y, r); g.fillStyle = '#FFF3A0'; g.fill();
    });
  }
  g.restore();
}

// Weather and critters that tick along whenever cozy mode is on screen.
function cozyStep(dt) {
  var gloomy = S.phase === 'crisis' || S.phase === 'charge';
  S.gloom = gloomy ? Math.min(1, S.gloom + dt * 0.7) : Math.max(0, S.gloom - dt * 1.1);
  var to = S.phase === 'charge' ? 0.4 + Math.min(1, (S.chargeT || 0) / 2) * 0.6
    : S.phase === 'unlimited' || S.phase === 'choose' ? 0.38 + 0.14 * Math.sin(S.t * 0.4)
    : S.phase === 'crisis' ? 0.2 : 0.05;
  S.windy += (to - S.windy) * Math.min(1, dt * (S.windy > to ? 0.7 : 1.5));
  S.cloudShift += S.windy * S.windy * dt * 0.25;
  stepLeaves(dt);
  stepFlies(dt);
  S.schools.forEach(function (s) { if (s.ring > 0) s.ring = Math.max(0, s.ring - dt * 0.7); });
}

// UPdog floats in under a hot-air balloon, hops out with the power-up, and the balloon drifts off.
function launchBalloon() {
  var p0 = { x: S.W * 0.92, y: -30 * S.k };
  S.rocket = { t: 0, leg: 0, p0: p0, p1: { x: S.W * 0.7, y: S.H * 0.35 }, p2: { x: S.dog.x, y: S.dog.y }, x: p0.x, y: p0.y };
  sfx.rocket();
}
function balloonStep(dt) {
  var r = S.rocket;
  r.t += dt;
  if (r.leg === 0) {
    var u = Math.min(1, r.t / 2.6), e = 1 - Math.pow(1 - u, 2.4);
    r.x = bez(r.p0.x, r.p1.x, r.p2.x, e) + Math.sin(r.t * 1.4) * 10 * S.k * (1 - u);
    r.y = bez(r.p0.y, r.p1.y, r.p2.y, e);
    if (u >= 1) { r.leg = 1; r.t = 0; deliver(); }
  } else if (r.leg === 1) {
    r.y = r.p2.y - Math.sin(r.t * 5) * 2;
    if (r.t > 0.5) { r.leg = 2; r.t = 0; r.from = { x: r.x, y: r.y }; }
  } else {
    var v = Math.min(1, r.t / 2.6), e2 = v * v;
    r.x = r.from.x + (S.W * 0.3 - r.from.x) * e2 + Math.sin(r.t * 1.4) * 8 * S.k;
    r.y = r.from.y + (-260 * S.k - r.from.y) * e2;
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
  g.rotate(Math.sin(S.t * 1.6) * 0.05);
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
  if (r.leg !== 1 && Math.sin(S.t * 22) > -0.3) {
    g.beginPath(); g.moveTo(-3, -40); g.quadraticCurveTo(0, -56 - Math.random() * 4, 3, -40); g.closePath(); paint('#FFC94D', '#FF9F6E', 1.2);
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

// UPdog's cozy look: a striped scarf that drops onto his collar when the power kicks in.
function dogScarf(s, drop) {
  g.save();
  g.translate(0, -drop / s);
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(44, 156); g.quadraticCurveTo(148, 194, 258, 138);
  g.lineWidth = 34; g.strokeStyle = OUTLINE; g.stroke();
  g.lineWidth = 28; g.strokeStyle = '#C8553D'; g.stroke();
  g.lineWidth = 6; g.strokeStyle = '#F6E7CF'; g.setLineDash([10, 22]); g.stroke(); g.setLineDash([]);
  rr(176, 158, 30, 78, 8); paint('#C8553D', OUTLINE, 4);
  g.fillStyle = '#F6E7CF'; g.fillRect(178, 190, 26, 7); g.fillRect(178, 206, 26, 7);
  g.strokeStyle = '#C8553D'; g.lineWidth = 4;
  for (var f = 0; f < 5; f++) line(181 + f * 6, 236, 181 + f * 6 + Math.sin(S.t * 5 + f) * 2, 250);
  g.restore();
}

// The admin's scarf, rain umbrella, and mug.
function heroScarf() {
  rr(-12, -59, 24, 7, 3.5); paint('#C8553D', OUTLINE, 1.4);
  rr(-10, -55, 7, 17, 2.5); paint('#C8553D', OUTLINE, 1.2);
  if (!STK) { g.fillStyle = '#F6E7CF'; g.fillRect(-9.5, -47, 6, 2); g.fillRect(-9.5, -43, 6, 2); }
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
      g.quadraticCurveTo(i * 1.1 + 1.4, -6.2 - Math.sin(S.t * 5 + i) * 0.6, i * 1.1, -8);
      g.stroke();
    }
  }
  g.restore();
}
function heroMug(skin) {
  var up = beatFrac() < 0.5;
  g.strokeStyle = skin; g.lineWidth = 6;
  line(12, -50, 22, up ? -70 : -60);
  line(-12, -50, -24, -62 + Math.sin(S.t * 10) * 4);
  circle(-25, -63 + Math.sin(S.t * 10) * 4, 4); paint(skin);
  mugShape(26, up ? -75 : -65, -0.15, '#E8A33D', 1.6, -1);
  circle(22, up ? -71 : -61, 4); paint(skin);
}
function heroHappyEyes() {
  g.strokeStyle = OUTLINE; g.lineWidth = 1.6;
  g.beginPath(); g.arc(-4.5, -66, 2.2, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
  g.beginPath(); g.arc(4.5, -66, 2.2, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
}

// The mug toast: kids reach in and clink twice, then lift their mugs to you and wave.
var TOAST = { approach: 0.16, clink1: 0.4, clink2: 0.65, raise: 0.8 };
var TOAST_SCALE = 1.15;
function smooth(u) { u = clamp(u, 0, 1); return u * u * (3 - 2 * u); }
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
      S.parts.push({ x: m.x + rand(-14, 14) * S.k, y: m.y, vx: rand(-15, 15), vy: rand(-75, -45) * S.k, life: rand(0.9, 1.3), c: pick(['#E85D8F', '#F48FB1', '#FF9F6E']), s: rand(3.5, 5) * S.k, shape: 'heart', rot: 0, vr: 0, grav: -10, only: PART_TAG });
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
  g.translate(lean, -Math.pow(1 - beatFrac(), 2) * 0.8 * lift);
  mx -= lean;
  if (p.pack) { rr(-bw / 2 - 3, top + 1, 5, bh - 3, 2); paint(p.pack, OUTLINE, 1); }
  rr(-bw / 2, top, bw, bh + 1, 3.5); paint(p.shirt, OUTLINE, 1.3);
  rr(-bw / 2 + 0.5, top - 0.6, bw - 1, 3.2, 1.6); paint(p.scarf, OUTLINE, 0.8);
  g.strokeStyle = p.skin; g.lineWidth = 2.6;
  line(sx, top + 3, mx + handle * 3.4 * big, my);
  if (lift > 0.3) {
    var wave = Math.sin(S.t * 14) * 2.5;
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
function drawCozyCursor(p) {
  g.save();
  g.globalCompositeOperation = 'lighter';
  var r = 16 * clamp(S.k, 0.8, 1.2), glow = g.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 1.6);
  glow.addColorStop(0, 'rgba(255,214,110,.75)'); glow.addColorStop(1, 'rgba(255,214,110,0)');
  g.fillStyle = glow; g.fillRect(p.x - r * 2, p.y - r * 2, r * 4, r * 4);
  g.restore();
  starPath(p.x, p.y, r * 0.8, S.t * 1.5);
  paint('#FFD27A', OUTLINE, 2);
}
