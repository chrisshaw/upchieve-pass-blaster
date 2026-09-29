var cv = $('pb-canvas'), g = cv.getContext('2d');
var UI_FONT = '"Work Sans", system-ui, -apple-system, sans-serif';
var STARS = [], TUFTS = [], CLOUDS = [], DOODLES = [];
(function seed() {
  for (var i = 0; i < 90; i++) STARS.push({ x: Math.random(), y: Math.random(), tw: Math.random() * 6 });
  for (var j = 0; j < 70; j++) TUFTS.push({ x: Math.random(), y: Math.random(), f: Math.random() < 0.3 ? pick(['#FFFFFF', '#FFC94D', '#F48FB1', '#B9A6F5']) : null });
  for (var k = 0; k < 5; k++) CLOUDS.push({ x: Math.random(), y: rand(0.12, 0.6), s: rand(0.8, 1.3), v: rand(0.004, 0.009) });
  var dc = ['#B9A6F5', '#FFB896', '#8FDCC4', '#7FB8FF', '#F7A8C8'];
  [[0.06, 0.2], [0.2, 0.5], [0.33, 0.12], [0.62, 0.42], [0.78, 0.16], [0.9, 0.55], [0.47, 0.72]].forEach(function (p, i) {
    DOODLES.push({ x: p[0], y: p[1], r: rand(7, 12), c: dc[i % dc.length], rot: rand(0, 1), tw: Math.random() * 6 });
  });
})();

function rgb(h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
function mix(a, b, t) {
  var A = rgb(a), B = rgb(b);
  return 'rgb(' + Math.round(lerp(A[0], B[0], t)) + ',' + Math.round(lerp(A[1], B[1], t)) + ',' + Math.round(lerp(A[2], B[2], t)) + ')';
}
var dkCache = {};
function dk(hex, n) {
  var q = (n * 20) | 0, key = hex + q;
  return dkCache[key] || (dkCache[key] = mix(hex, '#0B1030', q / 20 * 0.42));
}
var SKY = [[0, '#1B2552', '#33427A'], [5, '#26306A', '#4A4F8E'], [6.5, '#FFCDB8', '#FFE9D6'], [8, '#BFE0FB', '#E3F2FD'],
  [17, '#BFE0FB', '#E3F2FD'], [18.5, '#F9B8D0', '#FFE0C7'], [20, '#26306A', '#4A4F8E'], [24, '#1B2552', '#33427A']];
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

function rr(x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y);
  g.arcTo(x + w, y, x + w, y + h, r);
  g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r);
  g.arcTo(x, y, x + w, y, r);
  g.closePath();
}
function circle(x, y, r) { g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); }
function ellipse(x, y, rx, ry) { g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); }
var STK = 0, STK_STYLE = '#FFFFFF';
function paint(fill, stroke, lw) {
  if (STK) {
    if (fill && fill.indexOf('rgba(0,0,0') === 0) return;
    g.fillStyle = STK_STYLE; g.fill();
    g.lineJoin = 'round'; g.lineWidth = (lw || 0) + STK; g.strokeStyle = STK_STYLE; g.stroke();
    return;
  }
  if (fill) { g.fillStyle = fill; g.fill(); }
  if (stroke) { g.lineWidth = lw || 2; g.strokeStyle = stroke; g.stroke(); }
}
function line(x1, y1, x2, y2) {
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2);
  if (!STK) { g.stroke(); return; }
  var lw = g.lineWidth, ss = g.strokeStyle;
  g.lineWidth = lw + STK; g.strokeStyle = STK_STYLE; g.stroke();
  g.lineWidth = lw; g.strokeStyle = ss;
}
function sparklePath(x, y, r, rot) {
  g.beginPath();
  for (var i = 0; i < 8; i++) {
    var a = rot + i * Math.PI / 4, rad = i % 2 ? r * 0.26 : r;
    g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  g.closePath();
}
function starPath(x, y, r, rot) {
  g.beginPath();
  for (var i = 0; i < 10; i++) {
    var a = rot + i * Math.PI / 5 - Math.PI / 2, rad = i % 2 ? r * 0.45 : r;
    g.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad);
  }
  g.closePath();
}
function isGloomy() { return S.phase === 'crisis' || S.phase === 'charge'; }

function drawSky(nt) {
  var G = S.G, W = S.W, k = S.k, gloomy = isGloomy();
  var c = gloomy ? ['#AEB4C2', '#D5D9E1'] : skyAt(S.clock);
  var grad = g.createLinearGradient(0, 0, 0, G.horizon);
  grad.addColorStop(0, c[0]); grad.addColorStop(1, c[1]);
  g.fillStyle = grad;
  g.fillRect(0, 0, W, G.horizon + 4);

  if (nt > 0 && !gloomy) {
    g.fillStyle = '#FFFFFF';
    STARS.forEach(function (s) {
      g.globalAlpha = nt * (0.45 + 0.55 * Math.sin(S.t * 2 + s.tw));
      circle(s.x * W, s.y * G.horizon * 0.95, 1.4 * k);
      g.fill();
    });
    g.globalAlpha = 1;
  }

  var h = (S.clock % 1440) / 60, t, x, y;
  if (!gloomy) {
    if (h >= 6 && h <= 19) {
      t = (h - 6) / 13; x = W * (0.08 + 0.84 * t); y = G.horizon - Math.sin(Math.PI * t) * G.horizon * 0.7;
      var glow = g.createRadialGradient(x, y, 0, x, y, 70 * k);
      glow.addColorStop(0, 'rgba(255,240,150,.55)'); glow.addColorStop(1, 'rgba(255,240,150,0)');
      g.fillStyle = glow; g.fillRect(x - 70 * k, y - 70 * k, 140 * k, 140 * k);
      circle(x, y, 26 * k); paint('#FFD66B', '#F5B83D', 3 * k);
    } else {
      var hn = h < 6 ? h + 24 : h;
      t = (hn - 19) / 11; x = W * (0.08 + 0.84 * t); y = G.horizon - Math.sin(Math.PI * t) * G.horizon * 0.7;
      circle(x, y, 20 * k); paint('#FFFCE2');
      circle(x + 9 * k, y - 5 * k, 17 * k); paint(c[0]);
    }
  }

  // A little rocket crosses the night sky, for the Math Blaster fans.
  if (nt > 0.7 && S.phase === 'unlimited') {
    var span = W + 300, rx = (S.t * 90) % span - 150, ry = G.horizon * 0.35 + Math.sin(S.t * 0.8) * 12 * k;
    g.save(); g.translate(rx, ry); g.scale(k, k);
    g.fillStyle = S.t % 0.2 < 0.1 ? '#FFD23F' : '#FF8C42';
    g.beginPath(); g.moveTo(-18, -5); g.lineTo(-34 - Math.random() * 8, 0); g.lineTo(-18, 5); g.fill();
    ellipse(0, 0, 20, 8); paint('#F4F1FF', OUTLINE, 2);
    g.beginPath(); g.moveTo(14, -6); g.quadraticCurveTo(30, 0, 14, 6); paint('#FF5EA8', OUTLINE, 2);
    circle(4, 0, 3.5); paint('#7FB8FF', OUTLINE, 1.5);
    g.beginPath(); g.moveTo(-12, -6); g.lineTo(-20, -14); g.lineTo(-6, -7); paint('#5FA8FF', OUTLINE, 1.5);
    g.beginPath(); g.moveTo(-12, 6); g.lineTo(-20, 14); g.lineTo(-6, 7); paint('#5FA8FF', OUTLINE, 1.5);
    g.restore();
  }

  if (nt < 1 || gloomy) {
    g.globalAlpha = gloomy ? 1 : 1 - nt;
    CLOUDS.forEach(function (cl) {
      var cx = ((cl.x + S.t * cl.v) % 1.3 - 0.15) * W, cy = cl.y * G.horizon, s = cl.s * k, col = gloomy ? '#9AA0AE' : '#FFFFFF';
      g.fillStyle = col;
      circle(cx, cy, 18 * s); g.fill();
      circle(cx + 20 * s, cy - 8 * s, 22 * s); g.fill();
      circle(cx + 42 * s, cy, 17 * s); g.fill();
      rr(cx - 10 * s, cy, 66 * s, 14 * s, 7 * s); g.fill();
    });
    g.globalAlpha = 1;
  }
}

function hillPath(base, amp, f1, f2, ph) {
  var W = S.W;
  g.beginPath();
  g.moveTo(0, base + 4);
  for (var x = 0; x <= W + 20; x += 20) g.lineTo(x, base - (Math.sin(x * f1 + ph) + Math.sin(x * f2 + ph * 2) + 2) * amp);
  g.lineTo(W, base + 4);
  g.closePath();
}
function drawGround(nt) {
  var G = S.G, W = S.W, H = S.H, k = S.k;
  hillPath(G.horizon, 11 * k, 0.006, 0.013, 0.5); paint(dk('#BDE7DA', nt));
  hillPath(G.horizon, 6 * k, 0.011, 0.021, 2.1); paint(dk('#A3DCC8', nt));
  var grass = g.createLinearGradient(0, G.horizon, 0, G.roadTop);
  grass.addColorStop(0, dk('#C6EDD2', nt)); grass.addColorStop(1, dk('#A5DDB5', nt));
  g.fillStyle = grass;
  g.fillRect(0, G.horizon, W, G.roadTop - G.horizon);
  var tuft = dk('#8FCFA3', nt);
  TUFTS.forEach(function (t) {
    var x = t.x * W, y = G.horizon + 10 * k + t.y * (G.roadTop - G.horizon - 14 * k);
    if (t.f) { circle(x, y, 2.6 * k); paint(dk(t.f, nt)); }
    else { ellipse(x, y, 6 * k, 2 * k); paint(tuft); }
  });
  g.fillStyle = dk('#EEEAE0', nt);
  g.fillRect(0, G.roadTop, W, 8 * k);
  g.fillStyle = dk('#7A8294', nt);
  g.fillRect(0, G.roadTop + 8 * k, W, H - G.roadTop);
  g.fillStyle = dk('#FFF0C3', nt);
  for (var d = 10; d < W; d += 44 * k) { rr(d, G.roadMid - 2 * k, 22 * k, 4 * k, 2 * k); g.fill(); }
}

function beatFrac() { var b = beatPos(); return b - Math.floor(b); }
function windowColor(i) {
  if (isGloomy()) return '#A3AAB8';
  if (isParty()) return 'hsl(' + ((S.t * 140 + i * 47) % 360 | 0) + ',95%,' + (58 + 22 * Math.pow(1 - beatFrac(), 2) | 0) + '%)';
  if (S.phase === 'unlimited' || S.phase === 'powerup') return nightness(S.clock) > 0.3 ? '#FFE08A' : '#FFF0C3';
  return '#DCEAFB';
}

function drawHouse(s, W, H, tier, nt) {
  var wall = dk(s.wall || WALLS[0], nt), roof = dk('#154BB7', nt), white = dk('#FFFFFF', nt), party = isParty();
  rr(-W / 2, -H, W, H, 5); paint(wall);
  g.save(); g.clip();
  g.strokeStyle = 'rgba(28,34,43,.07)'; g.lineWidth = 1.2;
  for (var by = -H + 9; by < -6; by += 9) line(-W / 2, by, W / 2, by);
  g.fillStyle = 'rgba(28,34,43,.10)'; g.fillRect(-W / 2, -8, W, 8);
  g.restore();
  rr(-W / 2, -H, W, H, 5); paint(null, OUTLINE, 2.2);
  rr(-W / 2 - 5, -H - 7, W + 10, 9, 3); paint(roof, OUTLINE, 2);

  if (tier === 0) {
    rr(-11, -H - 34, 22, 28, 3); paint(white, OUTLINE, 2);
    g.beginPath(); g.moveTo(-15, -H - 33); g.lineTo(0, -H - 50); g.lineTo(15, -H - 33); g.closePath(); paint(roof, OUTLINE, 2);
    circle(0, -H - 20, 5); paint('#FFC94D', OUTLINE, 1.5);
  } else {
    g.beginPath(); g.moveTo(-32, -H - 6); g.lineTo(0, -H - 30); g.lineTo(32, -H - 6); g.closePath(); paint(white, OUTLINE, 2);
    circle(0, -H - 15, 7); paint('#FFFCE2', OUTLINE, 1.5);
    var hr = (S.clock / 60 % 12) / 12 * Math.PI * 2, mn = (S.clock % 60) / 60 * Math.PI * 2;
    g.strokeStyle = OUTLINE; g.lineWidth = 1.4; g.lineCap = 'round';
    line(0, -H - 15, Math.sin(hr) * 3.5, -H - 15 - Math.cos(hr) * 3.5);
    line(0, -H - 15, Math.sin(mn) * 5.5, -H - 15 - Math.cos(mn) * 5.5);
  }

  var px = -W / 2 + 12;
  g.strokeStyle = '#E5E5E5'; g.lineWidth = 2.5; line(px, -H - 7, px, -H - 46);
  g.beginPath(); g.moveTo(px, -H - 46);
  for (var f = 0; f <= 4; f++) g.lineTo(px + f * 5, -H - 46 + Math.sin(S.t * 6 + f) * 1.8);
  for (var f2 = 4; f2 >= 0; f2--) g.lineTo(px + f2 * 5, -H - 34 + Math.sin(S.t * 6 + f2) * 1.8);
  g.closePath(); paint(isGloomy() ? '#9AA0AE' : '#F48FB1', OUTLINE, 1.5);

  var ws = tier === 0 ? 12 : 14, pitch = ws + 7, inner = tier === 0 ? 16 : 26, wi = 0;
  [[-W / 2 + 9, -inner], [inner, W / 2 - 9]].forEach(function (wing) {
    var ww = wing[1] - wing[0], cols = Math.max(1, Math.floor((ww + 7) / pitch));
    var start = wing[0] + (ww - (cols * pitch - 7)) / 2;
    for (var wy = -H + 10; wy + ws <= -14; wy += pitch) {
      for (var c = 0; c < cols; c++) {
        var wx = start + c * pitch;
        rr(wx, wy, ws, ws, 3); paint(windowColor(wi), OUTLINE, 1.6);
        if (party) {
          var bob = Math.sin(S.t * 12 + wi * 1.7) * 1.6;
          circle(wx + ws / 2, wy + ws * 0.5 + bob, ws * 0.2); paint('#1B1033');
          rr(wx + ws * 0.22, wy + ws * 0.7 + bob, ws * 0.56, ws * 0.4, 3); paint('#1B1033');
        } else if (S.phase === 'build') {
          g.strokeStyle = '#FFFFFF'; g.lineWidth = 2; line(wx + 3, wy + 7, wx + 7, wy + 3);
        }
        g.fillStyle = white; g.fillRect(wx - 2, wy + ws, ws + 4, 3);
        wi++;
      }
    }
  });

  if (tier >= 2) {
    rr(-23, -38, 6, 38, 2); paint(white, OUTLINE, 1.5);
    rr(17, -38, 6, 38, 2); paint(white, OUTLINE, 1.5);
    rr(-27, -45, 54, 8, 2); paint(white, OUTLINE, 1.5);
  } else {
    rr(-18, -44, 36, 9, 2); paint(white, OUTLINE, 1.5);
    g.strokeStyle = 'rgba(28,34,43,.35)'; g.lineWidth = 1.5; line(-11, -39.5, 11, -39.5);
  }
  rr(-12, -31, 24, 31, 6); paint(roof, OUTLINE, 2);
  g.strokeStyle = OUTLINE; g.lineWidth = 1.2; line(0, -30, 0, 0);
  rr(-8, -26, 16, 7, 3); paint(windowColor(99), OUTLINE, 1);
  rr(-17, -4, 34, 5, 2); paint(dk('#EEEAE0', nt), OUTLINE, 1.2);
}

function drawTower(W, H, nt) {
  rr(-W / 2, -H, W, H, 4); paint(dk('#9FC3F0', nt), OUTLINE, 2.2);
  g.strokeStyle = OUTLINE; g.lineWidth = 2; line(0, -H - 28, 0, -H);
  circle(0, -H - 29, 3.5); paint(S.t % 1 < 0.5 ? '#E85D8F' : '#7A2A45');
  var wi = 0;
  for (var y = -H + 10; y < -40; y += 13) for (var x = -W / 2 + 8; x + 11 <= W / 2 - 6; x += 18) { rr(x, y, 11, 8, 2); paint(windowColor(wi++)); }
  rr(-W / 2 + 6, -36, W - 12, 9, 2); paint(dk('#FFFFFF', nt), OUTLINE, 1.5);
  rr(-15, -24, 30, 24, 3); paint(dk('#154BB7', nt), OUTLINE, 2);
}

function drawPartyLights(s, i) {
  var d = dims(s), sc = s.sc, top = s.y - (d.h + 30) * sc, hue = (S.t * 90 + i * 70) % 360 | 0, pulse = Math.pow(1 - beatFrac(), 2);
  g.save();
  g.globalCompositeOperation = 'lighter';
  var gy = s.y - d.h * sc / 2, R = d.w * sc;
  var glow = g.createRadialGradient(s.x, gy, 0, s.x, gy, R);
  glow.addColorStop(0, 'hsla(' + hue + ',95%,60%,' + (0.25 + 0.2 * pulse) + ')');
  glow.addColorStop(1, 'hsla(' + hue + ',95%,60%,0)');
  g.fillStyle = glow;
  g.fillRect(s.x - R, gy - R, R * 2, R * 2);
  for (var b = 0; b < 2; b++) {
    var ang = -Math.PI / 2 + Math.sin(S.t * 1.4 + i + b * 2.2) * 0.75, len = S.H * 0.6, spread = 0.1;
    var beam = g.createLinearGradient(s.x, top, s.x + Math.cos(ang) * len, top + Math.sin(ang) * len);
    beam.addColorStop(0, 'hsla(' + ((hue + b * 140) % 360) + ',95%,65%,.45)');
    beam.addColorStop(1, 'hsla(' + ((hue + b * 140) % 360) + ',95%,65%,0)');
    g.fillStyle = beam;
    g.beginPath();
    g.moveTo(s.x, top);
    g.lineTo(s.x + Math.cos(ang - spread) * len, top + Math.sin(ang - spread) * len);
    g.lineTo(s.x + Math.cos(ang + spread) * len, top + Math.sin(ang + spread) * len);
    g.closePath();
    g.fill();
  }
  g.restore();
  var bx = s.x, by = top - 12 * sc, br = 8 * sc;
  g.strokeStyle = '#DDDDDD'; g.lineWidth = 1.5; line(bx, top + 2 * sc, bx, by + br);
  circle(bx, by, br); paint('#E8ECF5', OUTLINE, 1.5);
  for (var f = 0; f < 6; f++) {
    var fa = S.t * 3 + f * 1.05;
    g.globalAlpha = 0.5 + 0.5 * Math.sin(fa * 2);
    circle(bx + Math.cos(fa) * br * 0.6, by + Math.sin(f * 1.7) * br * 0.5, 1.6 * sc); paint('#FFFFFF');
  }
  g.globalAlpha = 1;
}

var RAINBOW = ['#154BB7', '#5CC9A7', '#FFC94D', '#FF9F6E', '#F48FB1', '#9B87F5'];
function rainbowAcross(W, H, t) {
  var shift = (t % 1) * W, x0 = -W / 2 - shift;
  var gr = g.createLinearGradient(x0, -H - 40, x0 + W * 2, 10);
  for (var i = 0; i <= 12; i++) gr.addColorStop(i / 12, RAINBOW[i % RAINBOW.length]);
  return gr;
}
function drawSchool(s, nt, ghost) {
  var d = dims(s), sc = s.sc, sq = s.squash || 0;
  g.save();
  g.translate(s.x, s.y + (s.drop || 0));
  g.scale(sc * (1 + 0.14 * sq), sc * (1 - 0.2 * sq));
  if (ghost) g.globalAlpha = 0.55;
  ellipse(0, 2, d.w * 0.6, 7); paint('rgba(0,0,0,.18)');
  var cozy = MODE === 'cozy';
  var shape = cozy
    ? function () { if (d.mega) drawCozyTower(s, d.w, d.h, nt); else drawSchoolhouse(s, d.w, d.h, tierOf(s.size), nt); }
    : function () { if (d.mega) drawTower(d.w, d.h, nt); else drawHouse(s, d.w, d.h, tierOf(s.size), nt); };
  if (!ghost && S.phase === 'unlimited' && !cozy) {
    // The die-cut outline powers up: brand colors flow across it and it thickens on every beat.
    STK_STYLE = rainbowAcross(d.w, d.h, S.t * 0.6 + s.id * 0.13);
    STK = 16 + 10 * Math.pow(1 - beatFrac(), 2); shape();
    STK_STYLE = '#FFFFFF'; STK = 6; shape();
    STK = 0;
  } else if (!ghost) {
    STK = 12; shape(); STK = 0;
  }
  shape();
  if (s.hit > 0) {
    g.globalAlpha = Math.min(0.65, s.hit / 0.18 * 0.65) * (cozy ? 0.35 : 1);
    rr(-d.w / 2 - 3, -d.h - 8, d.w + 6, d.h + 10, 6); paint('#FFFFFF');
  }
  g.globalAlpha = 1;
  if (cozy) {
    if (S.gloom > 0.02 && s.landed && !ghost && !s.blessed) drawDrizzle(d, s);
  } else if (isGloomy() && s.landed && !ghost) {
    var cy = -d.h - 64;
    g.fillStyle = '#8E94A3';
    circle(-18, cy + 6, 12); g.fill(); circle(0, cy, 16); g.fill(); circle(18, cy + 6, 12); g.fill();
    rr(-28, cy + 4, 56, 14, 7); g.fill();
    g.strokeStyle = '#7FA7E6'; g.lineWidth = 2; g.lineCap = 'round';
    for (var r = 0; r < 7; r++) {
      var ry = (S.t * 110 + r * 17) % 30;
      line(-24 + r * 8, cy + 20 + ry, -26 + r * 8, cy + 26 + ry);
    }
  }
  g.restore();
}

// Dancers stay planted: feet wide, hips swaying on the beat, arms pumping, a knee bend on each beat.
function drawPerson(p, x, y, sc, moving) {
  if (p.mug && p.mode === 'cheer' && MODE === 'cozy') { drawToaster(p, x, y, sc); return; }
  var dancing = p.mode === 'cheer';
  if (dancing) moving = false;
  var adult = p.adult, sw = moving ? Math.sin(p.ph) : 0, bob = moving ? Math.abs(Math.sin(p.ph)) * 1.5 : 0;
  var L = adult ? 11 : 8, bh = adult ? 14 : 10, bw = adult ? 12 : 11, hr = adult ? 5.8 : 5.6;
  var bp = dancing ? beatPos() : 0, bf = bp - Math.floor(bp), pump = dancing && (bp * 2) % 1 < 0.5;
  g.save();
  g.translate(x, y);
  g.scale(sc, sc);
  ellipse(0, 0, 7, 2.2); paint('rgba(0,0,0,.2)');
  if (dancing) {
    var pop = clamp(Math.min(p.age / 0.15, p.cheer / 0.15), 0, 1);
    g.scale(pop, pop * (1 - 0.08 * Math.pow(1 - bf, 3)));
    g.rotate(Math.sin(bp * Math.PI) * 0.22 * (p.slot % 2 ? -1 : 1));
  }
  g.translate(0, -bob);
  g.lineCap = 'round';
  g.strokeStyle = p.pants; g.lineWidth = 3.4;
  line(-2.6, -L, dancing ? -4.5 : -2.6 + sw * 3, -1);
  line(2.6, -L, dancing ? 4.5 : 2.6 - sw * 3, -1);
  var top = -L - bh;
  if (p.pack) { rr(-bw / 2 - 3, top + 1, 5, bh - 3, 2); paint(p.pack, OUTLINE, 1); }
  rr(-bw / 2, top, bw, bh + 1, 3.5); paint(p.shirt, OUTLINE, 1.3);
  if (MODE === 'cozy') {
    if (!p.scarf) p.scarf = pick(SCARVES);
    scarfTail(bw / 2 - 2, top + 1, 7, 2.2, p.scarf, p.ph || 0);
    rr(-bw / 2 + 0.5, top - 0.6, bw - 1, 3.2, 1.6); paint(p.scarf, OUTLINE, 0.8);
  }
  if (adult) {
    g.strokeStyle = '#FFD23F'; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(-3, top); g.lineTo(0, top + 7); g.lineTo(3, top); g.stroke();
    rr(-2, top + 7, 4, 4, 1); paint('#FFFFFF');
  }
  g.strokeStyle = p.skin; g.lineWidth = 2.6;
  if (dancing) {
    line(-bw / 2 + 1, top + 3, -bw / 2 - 4, top - (pump ? 9 : 3));
    line(bw / 2 - 1, top + 3, bw / 2 + 4, top - (pump ? 3 : 9));
  } else {
    line(-bw / 2 + 1, top + 3, -bw / 2 - 1.5 - sw * 1.5, top + bh - 1);
    line(bw / 2 - 1, top + 3, bw / 2 + 1.5 + sw * 1.5, top + bh - 1);
  }
  var hy = top - hr + 1;
  circle(0, hy, hr); paint(p.skin, OUTLINE, 1.3);
  g.fillStyle = p.hair;
  g.beginPath(); g.arc(0, hy - 0.3, hr + 0.4, Math.PI, 0); g.closePath(); g.fill();
  if (p.style === 1) { rr(-hr - 0.6, hy - 1, 2.6, 8, 1.3); g.fill(); rr(hr - 2, hy - 1, 2.6, 8, 1.3); g.fill(); }
  else if (p.style === 2) { circle(-hr, hy - 3, 2.8); g.fill(); circle(hr, hy - 3, 2.8); g.fill(); }
  g.fillStyle = '#1B1B1B';
  circle(-2, hy + 0.8, 0.95); g.fill();
  circle(2, hy + 0.8, 0.95); g.fill();
  g.restore();
}

function drawCar(tc, nt) {
  if (MODE === 'cozy') { drawBike(tc, nt); return; }
  var sc = S.k * depth(tc.cy) * 1.2, col = dk(tc.car, nt);
  g.save();
  g.translate(tc.cx, tc.cy);
  g.scale(sc, sc);
  if (nt > 0.4) {
    var beam = g.createLinearGradient(22, 0, 80, 0);
    beam.addColorStop(0, 'rgba(255,243,176,.45)'); beam.addColorStop(1, 'rgba(255,243,176,0)');
    g.fillStyle = beam;
    g.beginPath(); g.moveTo(22, -11); g.lineTo(80, -22); g.lineTo(80, 2); g.closePath(); g.fill();
  }
  ellipse(0, 1, 25, 3.5); paint('rgba(0,0,0,.22)');
  g.beginPath(); g.moveTo(-13, -15); g.lineTo(-8, -24); g.lineTo(9, -24); g.lineTo(15, -15); g.closePath(); paint(col, OUTLINE, 1.6);
  g.beginPath(); g.moveTo(-9, -15); g.lineTo(-6, -21); g.lineTo(7.5, -21); g.lineTo(11, -15); g.closePath(); paint(dk('#BFE3FF', nt));
  rr(-23, -15, 46, 11, 5); paint(col, OUTLINE, 1.6);
  circle(-13, -4, 4.5); paint('#1E1E24'); circle(-13, -4, 1.8); paint('#AAAAAA');
  circle(13, -4, 4.5); paint('#1E1E24'); circle(13, -4, 1.8); paint('#AAAAAA');
  circle(21, -11, 2); paint(nt > 0.4 ? '#FFF3B0' : '#FFFFFF');
  g.restore();
}

// The admin in the bottom-left corner: holds a stamp, panics, charges up, then dances with UPdog.
function heroFigure(ph, t) {
  var skin = '#8D5524';
  g.lineCap = 'round';
  rr(-9, -24, 7, 23, 3); paint('#2B2D42');
  rr(2, -24, 7, 23, 3); paint('#2B2D42');
  ellipse(-5, -1, 6, 3); paint('#111111'); ellipse(6, -1, 6, 3); paint('#111111');
  rr(-13, -55, 26, 33, 7); paint('#154BB7', OUTLINE, 2);
  g.beginPath(); g.moveTo(-6, -55); g.lineTo(0, -44); g.lineTo(6, -55); g.closePath(); paint('#FFFFFF');
  g.beginPath(); g.moveTo(-2, -50); g.lineTo(2, -50); g.lineTo(3, -34); g.lineTo(0, -31); g.lineTo(-3, -34); g.closePath(); paint('#F48FB1');
  rr(4, -44, 8, 9, 2); paint('#FFFCE2', OUTLINE, 1);
  if (!STK) { g.fillStyle = '#154BB7'; g.font = '700 5px ' + UI_FONT; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('UP', 8, -39.5); }
  var cozy = MODE === 'cozy';
  if (cozy) heroScarf();
  g.strokeStyle = skin; g.lineWidth = 6;
  if (cozy && ph === 'crisis') {
    heroUmbrella(skin);
  } else if (cozy && ph === 'unlimited') {
    heroMug(skin);
  } else if (ph === 'crisis') {
    line(-12, -50, -20, -64); line(12, -50, 20, -64);
    circle(-20, -66, 3.5); paint(skin); circle(20, -66, 3.5); paint(skin);
  } else if (ph === 'charge') {
    line(-12, -50, -26, -54); line(12, -50, 26, -54);
  } else if (ph === 'unlimited') {
    var up = beatFrac() < 0.5;
    line(-12, -50, -22, up ? -66 : -40); line(12, -50, 22, up ? -40 : -66);
    circle(-22, up ? -68 : -38, 4); paint(skin); circle(22, up ? -38 : -68, 4); paint(skin);
  } else {
    line(-12, -50, -17, -30);
    line(12, -50, 22, -44);
    rr(18, -58, 8, 10, 2); paint('#8B5A2B', OUTLINE, 1.2);
    rr(14, -48, 16, 6, 2); paint('#E85D8F', OUTLINE, 1.2);
  }
  circle(0, -67, 12); paint(skin, OUTLINE, 2);
  g.fillStyle = '#1B1B1B';
  g.beginPath(); g.arc(0, -69, 12.5, Math.PI * 1.02, Math.PI * 1.98); g.closePath();
  if (STK) paint('#1B1B1B'); else g.fill();
  if (STK) return;
  if (cozy && ph === 'unlimited') {
    heroHappyEyes();
  } else if (!cozy && (ph === 'unlimited' || (ph === 'charge' && (S.chargeT || 0) > 1.2))) {
    g.fillStyle = '#111111';
    g.fillRect(-10, -69, 8, 4); g.fillRect(2, -69, 8, 4); g.fillRect(-2, -68, 4, 1.6); g.fillRect(-12, -69, 2, 1.6); g.fillRect(10, -69, 2, 1.6);
    g.fillStyle = '#FFFFFF'; g.fillRect(-9, -68.5, 2, 1.2); g.fillRect(3, -68.5, 2, 1.2);
  } else {
    g.fillStyle = OUTLINE;
    circle(-4.5, -67, 1.6); g.fill(); circle(4.5, -67, 1.6); g.fill();
    if (ph === 'crisis') {
      g.strokeStyle = OUTLINE; g.lineWidth = 1.4;
      line(-7, -72, -2.5, -71); line(7, -72, 2.5, -71);
      circle(13, -72 + (t * 30) % 8, 2.2); paint('#7FB8FF');
    }
  }
  g.strokeStyle = OUTLINE; g.lineWidth = 1.5;
  g.beginPath();
  if (ph === 'crisis') g.arc(0, -58, 3.2, Math.PI * 1.15, Math.PI * 1.85);
  else g.arc(0, -62, 4, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
}
function drawHero() {
  if (MODE === 'cozy') { drawCozyHero(); return; }
  var h = S.hero, k = h.hs, t = S.t, ph = S.phase;
  var bounce = ph === 'unlimited' ? Math.pow(1 - beatFrac(), 2) * 8 : ph === 'crisis' ? Math.abs(Math.sin(t * 9)) * 2 : 0;
  var shakeX = ph === 'charge' ? rand(-1, 1) * 2.5 * Math.min(1, (S.chargeT || 0)) : 0;
  g.save();
  g.translate(h.x + shakeX, h.y);
  g.scale(k, k);
  ellipse(0, 0, 18, 4); paint('rgba(0,0,0,.22)');
  if (ph === 'charge' || ph === 'unlimited') {
    var power = ph === 'charge' ? Math.min(1, (S.chargeT || 0) / 2) : 0.7 + 0.3 * Math.pow(1 - beatFrac(), 2);
    var aura = g.createRadialGradient(0, -40, 4, 0, -40, 70);
    var hue = (t * 200) % 360 | 0;
    aura.addColorStop(0, ph === 'charge' ? 'rgba(255,236,150,' + (0.3 + power * 0.6) + ')' : 'hsla(' + hue + ',95%,65%,.55)');
    aura.addColorStop(1, 'rgba(255,236,150,0)');
    g.fillStyle = aura;
    g.fillRect(-80, -120, 160, 150);
  }
  g.translate(0, -bounce - (h.jump || 0));
  STK = 7; heroFigure(ph, t); STK = 0;
  heroFigure(ph, t);
  if (ph === 'unlimited') {
    for (var sp = 0; sp < 8; sp++) {
      var a = t * 3 + sp * 0.785, r2 = 38 + Math.sin(t * 6 + sp) * 4;
      starPath(Math.cos(a) * r2, -42 + Math.sin(a) * r2, 3.4, t * 4); paint(POP[sp % POP.length]);
    }
  }
  g.restore();
}

// UPdog: stays by the admin once he delivers the power-up, and gets his shades when it kicks in.
function easeBounce(t) {
  if (t < 1 / 2.75) return 7.5625 * t * t;
  if (t < 2 / 2.75) { t -= 1.5 / 2.75; return 7.5625 * t * t + 0.75; }
  if (t < 2.5 / 2.75) { t -= 2.25 / 2.75; return 7.5625 * t * t + 0.9375; }
  t -= 2.625 / 2.75; return 7.5625 * t * t + 0.984375;
}
function drawDog() {
  if (MODE === 'cozy') { drawCozyDog(); return; }
  var d = S.dog;
  if (!d.on || !imgReady('dog')) return;
  var w = d.w, s = w / ART_META.dog[0], h = ART_META.dog[1] * s;
  var dancing = S.phase === 'unlimited', bf = dancing ? beatFrac() : 0;
  var bounce = dancing ? Math.pow(1 - bf, 2) * 12 * S.k : 0;
  var tilt = dancing ? (Math.floor(beatPos()) % 2 ? 0.1 : -0.1) * (1 - bf * 0.6) : 0;
  ellipse(d.x, d.y + 2, w * 0.42, 6 * S.k); paint('rgba(0,0,0,.2)');
  g.save();
  g.translate(d.x, d.y - bounce - (d.jump || 0));
  g.rotate(tilt);
  g.drawImage(IMG.dog, -w / 2, -h, w, h);
  if (d.glasses > 0 && imgReady('glasses')) {
    var e = easeBounce(Math.min(1, d.glasses));
    g.drawImage(IMG.glasses, -w / 2 + ART_META.glassesAt[0] * s, -h + ART_META.glassesAt[1] * s - (1 - e) * 160 * S.k, ART_META.glasses[0] * s, ART_META.glasses[1] * s);
  }
  g.restore();
}
function drawRocket() {
  if (MODE === 'cozy') { drawBalloon(); return; }
  var r = S.rocket;
  if (!r || !imgReady('rocket')) return;
  var w = 190 * S.k, h = w * ART_META.rocket[1] / ART_META.rocket[0];
  g.save();
  g.translate(r.x, r.y);
  g.rotate(r.ang + 0.7);
  g.drawImage(IMG.rocket, -w / 2, -h / 2, w, h);
  g.restore();
}
function drawRainbow(nt) {
  var a = S.rainbow * (1 - nt * 0.85);
  if (a <= 0.02) return;
  var cols = ['#E85D8F', '#FF9F6E', '#FFC94D', '#5CC9A7', '#5FA8FF', '#9B87F5'];
  var bw = 10 * S.k, cx = S.W * 0.52, cy = S.G.horizon + 10 * S.k, R = Math.min(S.W * 0.4, S.G.horizon * 1.05);
  var inner = R - (cols.length - 1) * bw;
  g.save();
  g.globalAlpha = a;
  g.lineCap = 'round';
  g.beginPath(); g.arc(cx, cy, (R + inner) / 2, Math.PI, 0); g.lineWidth = cols.length * bw + 10 * S.k; g.strokeStyle = '#FFFFFF'; g.stroke();
  cols.forEach(function (c, i) {
    g.beginPath(); g.arc(cx, cy, R - i * bw, Math.PI, 0); g.lineWidth = bw + 0.5; g.strokeStyle = c; g.stroke();
  });
  g.restore();
}
function drawDoodles(nt) {
  var party = S.phase === 'unlimited', pulse = party ? Math.pow(1 - beatFrac(), 2) : 0;
  DOODLES.forEach(function (d) {
    var r = d.r * S.k * (0.85 + 0.15 * Math.sin(S.t * 1.5 + d.tw) + pulse * 0.5);
    var rot = d.rot + (party ? S.t * 1.2 : Math.sin(S.t * 0.6 + d.tw) * 0.2);
    g.globalAlpha = 0.9;
    sparklePath(d.x * S.W, d.y * S.G.horizon, r, rot); paint(nt > 0.5 ? '#FFFCE2' : d.c);
  });
  g.globalAlpha = 1;
}

function pill(text, x, y, size, fg, bg) {
  g.font = 'italic 800 ' + size + 'px ' + UI_FONT;
  var w = g.measureText(text).width + size * 1.3, h = size * 1.9;
  x = clamp(x, w / 2 + 6, S.W - w / 2 - 6);
  g.save();
  g.shadowColor = 'rgba(28,34,43,.22)'; g.shadowBlur = 6; g.shadowOffsetY = 2;
  rr(x - w / 2, y - h / 2, w, h, 8);
  g.lineWidth = 6; g.strokeStyle = '#FFFFFF'; g.stroke();
  g.fillStyle = bg; g.fill();
  g.restore();
  g.fillStyle = fg;
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(text, x, y + 1);
}

// Floating events use the page's label-chip look: tinted chip, dark text.
var FLOAT_STYLES = {
  sad: ['#FFE3EA', '#9E1F4B'],
  happy: ['#DEF4F0', '#0B5C48'],
  win: ['#FFFCE2', '#101010'],
  cap: ['#FFFCE2', '#154BB7'],
  big: ['#154BB7', '#FFFFFF']
};
function drawFloats() {
  if (MODE === 'cozy') { drawCozyFloats(); return; }
  var ks = clamp(S.k, 0.85, 1.2);
  g.lineJoin = 'round';
  S.floats.forEach(function (f) {
    var age = f.max - f.life, size = Math.round(Math.max(15, f.size * ks));
    var pop = age < 0.14 ? lerp(0.5, 1.12, age / 0.14) : age < 0.24 ? lerp(1.12, 1, (age - 0.14) / 0.1) : 1;
    g.globalAlpha = Math.min(1, f.life / 0.4);
    g.save();
    g.translate(f.x, f.y);
    g.rotate(f.rot || 0);
    g.scale(pop, pop);
    var st = FLOAT_STYLES[f.style];
    if (st) {
      pill(f.text, 0, 0, size, st[1], st[0]);
    } else {
      g.font = '800 ' + size + 'px ' + UI_FONT;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.lineWidth = 4; g.strokeStyle = '#FFFFFF'; g.strokeText(f.text, 0, 0);
      g.fillStyle = f.style; g.fillText(f.text, 0, 0);
    }
    g.restore();
  });
  g.globalAlpha = 1;
}

function drawParts() {
  S.parts.forEach(function (p) {
    if (p.only && p.only !== MODE) return;
    g.globalAlpha = Math.min(1, p.life * 2);
    g.fillStyle = p.c;
    if (p.shape === 'star') { starPath(p.x, p.y, p.s * 1.4, p.rot); g.fill(); }
    else if (p.shape === 'leaf') leafShape(p.x, p.y, p.s * 1.1, p.rot, p.rot * 1.3, p.c);
    else if (p.shape === 'heart') { heartShape(p.x, p.y, p.s); g.fill(); g.lineWidth = 1.2; g.strokeStyle = '#FFFFFF'; g.stroke(); }
    else if (p.shape === 'conf') {
      g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.s, -p.s / 2.5, p.s * 2, p.s / 1.25); g.restore();
    } else { circle(p.x, p.y, p.s * 0.7); g.fill(); }
  });
  g.globalAlpha = 1;
}

function drawCursor(nt) {
  var p = S.ptr;
  if (!p.inside || !p.mouse || UI.drag) return;
  if (S.phase === 'unlimited' && MODE === 'cozy') { drawCozyCursor(p); return; }
  if (S.phase === 'unlimited') {
    starPath(p.x, p.y, 16 * clamp(S.k, 0.8, 1.2), S.t * 3);
    paint('hsl(' + ((S.t * 300) % 360 | 0) + ',85%,65%)', OUTLINE, 2);
    return;
  }
  if (S.phase !== 'build') return;
  var over = schoolAt(p.x, p.y);
  if (over) {
    var r = srect(over);
    g.save();
    g.setLineDash([8, 6]); g.lineDashOffset = -S.t * 30;
    rr(r.x - 6, r.y - 6, r.w + 12, r.h + 12, 10); paint(null, MODE === 'cozy' ? '#A0452C' : '#154BB7', MODE === 'cozy' ? 2 : 3);
    g.restore();
    return;
  }
  if (!UI.canStamp()) return;
  var ghost = { size: SIZES[DEFAULT_TIER].size, x: p.x, y: p.y + 24 * S.k, drop: 0, squash: 0, hit: 0, sc: 1, wall: WALLS[(S.nextId - 1) % WALLS.length] };
  placeSchool(ghost, ghost.x, ghost.y);
  drawSchool(ghost, nt, true);
  if (MODE === 'cozy') cozyTag('Click to add a schoolhouse', p.x, ghost.y + 24 * S.k, Math.round(clamp(15 * S.k, 14, 17)), '#FFF8EC', '#A0452C');
  else pill('Click to add a school', p.x, ghost.y + 24 * S.k, Math.round(clamp(16 * S.k, 14, 18)), '#FFFFFF', '#154BB7');
}

function render() {
  if (S.phase === 'choose') { renderChooser(); return; }
  g.save();
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  if (S.shake > 0) g.translate(rand(-1, 1) * S.shake * 16, rand(-1, 1) * S.shake * 16);
  if (S.punch > 0) {
    var z = 1 + 0.05 * S.punch;
    g.translate(S.W / 2, S.H / 2); g.scale(z, z); g.translate(-S.W / 2, -S.H / 2);
  }
  drawScene();
  g.restore();
}
// The chooser sets CULL to skip anything that falls outside the half being painted.
var CULL = null;
function drawScene() {
  var nt = isGloomy() ? 0 : nightness(S.clock), cozy = MODE === 'cozy';
  if (cozy) {
    drawCozySky(nt);
    drawCozyRainbow(nt);
    drawCozyGround(nt);
  } else {
    drawSky(nt);
    drawRainbow(nt);
    drawDoodles(nt);
    drawGround(nt);
  }

  var list = [];
  S.schools.forEach(function (s) { list.push({ y: s.y, k: 0, o: s }); });
  // Roof dancers sort just after their school so they stand on top of it, not behind it.
  S.kids.forEach(function (k) { list.push({ y: k.roof ? k.target.y + 0.1 : k.y, k: 1, o: k }); });
  S.teachers.forEach(function (tc) {
    if (tc.state !== 'away') list.push({ y: tc.cy, k: 2, o: tc });
    if (tc.state === 'walkout' || tc.state === 'walkin') list.push({ y: tc.py, k: 3, o: tc });
  });
  list.sort(function (a, b) { return a.y - b.y; });
  if (isParty()) S.schools.forEach(cozy ? drawCozyGlow : drawPartyLights);
  list.forEach(function (e) {
    var o = e.o;
    if (CULL && !CULL(e.k === 2 ? o.cx : e.k === 3 ? o.px : o.x)) return;
    if (e.k === 0) drawSchool(o, nt, false);
    else if (e.k === 1) {
      var ksc = S.k * depth(o.roof ? o.target.y : o.y) * 1.3, ky = o.y - (o.hop || 0), km = o.pause <= 0 || o.mode !== 'wander';
      STK = 3.5; drawPerson(o, o.x, ky, ksc, km); STK = 0;
      drawPerson(o, o.x, ky, ksc, km);
    }
    else if (e.k === 2) drawCar(o, nt);
    else drawPerson(o, o.px, o.py, S.k * depth(o.py) * 1.3, true);
  });

  if (cozy) { drawSpirits(nt); drawBloom(); drawFlies(nt); }
  drawHero();
  drawDog();
  drawRocket();
  if (cozy) { drawRain(); drawLeaves(nt); }
  if (S.toss) {
    var tt = S.toss.t, tx = lerp(S.toss.x0, S.toss.x1, tt), ty = lerp(S.toss.y0, S.toss.y1, tt) - Math.sin(tt * Math.PI) * 90 * S.k;
    starPath(tx, ty, 26 * S.k, S.t * (cozy ? 1.5 : 10)); g.lineJoin = 'round';
    paint(null, '#FFFFFF', 8 * S.k); paint('#FFC94D', OUTLINE, 2);
  }
  S.wavelets.forEach(function (w) {
    g.globalAlpha = w.life / 0.4;
    circle(w.x, w.y, w.r); paint(null, '#FFFFFF', 5 * S.k);
  });
  g.globalAlpha = 1;
  if (S.wave) {
    g.globalAlpha = Math.max(0, S.wave.life / S.wave.max);
    circle(S.hero.x, S.hero.y - 50 * S.k, S.wave.r); paint(null, '#FFFFFF', 14 * S.k * g.globalAlpha + 2);
    circle(S.hero.x, S.hero.y - 50 * S.k, S.wave.r * 0.8); paint(null, '#FFC94D', 6 * S.k);
    g.globalAlpha = 1;
  }
  drawCursor(nt);
  drawParts();
  drawFloats();

  if (S.flash > 0) {
    g.globalAlpha = Math.min(1, S.flash * 2) * (cozy ? 0.7 : 1);
    g.fillStyle = cozy ? '#FFE6B0' : '#FFFFFF';
    g.fillRect(-20, -20, S.W + 40, S.H + 40);
    g.globalAlpha = 1;
  }
}
