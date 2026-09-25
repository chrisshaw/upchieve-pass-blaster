var BLD = [{ w: 26, h: 14 }, { w: 36, h: 18 }, { w: 44, h: 22 }, { w: 52, h: 24 }, { w: 60, h: 28 }];
var MEGA = { w: 30, h: 64 };
function dims(s) { return s.size >= 100000 ? MEGA : BLD[tierOf(s.size)]; }

function setGeometry(w, h) {
  var oldW = S.W || w, oldH = S.H || h;
  S.W = w; S.H = h;
  S.P = clamp(Math.round(Math.min(w / 260, h / 170)), 2, 4);
  S.G = { horizon: h * 0.34, roadTop: h * 0.86, roadMid: h * 0.93 };
  var fx = w / oldW, fy = h / oldH;
  S.kids.forEach(function (k) { k.x *= fx; k.y *= fy; k.tx *= fx; k.ty *= fy; });
  layout();
  S.teachers.forEach(parkAtSpot);
}

function layout() {
  var n = S.schools.length;
  if (!n) return;
  var G = S.G, P = S.P;
  var left = S.W * 0.03, right = S.W * 0.97;
  var top = G.horizon + P * 4, bottom = G.roadTop - P * 3;
  var aw = right - left, ah = bottom - top, best = null;
  for (var cols = 1; cols <= n; cols++) {
    var rows = Math.ceil(n / cols);
    var sc = Math.min(aw / cols / (74 * P), ah / rows / (34 * P));
    if (!best || sc > best.sc) best = { cols: cols, rows: rows, sc: sc };
  }
  var scale = Math.min(1.4, best.sc);
  var slotW = aw / best.cols, slotH = ah / best.rows;
  S.schools.forEach(function (s, i) {
    var r = Math.floor(i / best.cols), c = i % best.cols;
    var inRow = Math.min(best.cols, n - r * best.cols);
    s.u = P * scale;
    s.x = left + (best.cols - inRow) * slotW / 2 + slotW * (c + 0.5) - 6 * s.u;
    s.y = top + slotH * (r + 1) - slotH * 0.14;
  });
}

function recalcNeeds() {
  var total = 0;
  S.schools.forEach(function (s) { total += s.size; });
  var ratio = Math.max(60, total / 320);
  S.schools.forEach(function (s) { s.need = clamp(Math.round(s.size / ratio), 2, 24); });
}

function addSchool(size) {
  var used = {};
  S.schools.forEach(function (s) { used[s.name] = 1; });
  var name = null;
  for (var i = 0; i < NAMES.length; i++) if (!used[NAMES[i]]) { name = NAMES[i]; break; }
  var s = {
    id: S.nextId++,
    name: name || 'School #' + (S.schools.length + 1),
    size: size || 700,
    inside: 0, incoming: 0, need: 2,
    x: 0, y: 0, u: S.P,
    drop: -S.H, vy: 0, landed: false, hit: 0
  };
  S.schools.push(s);
  recalcNeeds();
  layout();
  s.drop = -(s.y + 60 * s.u);
  if (S.phase === 'unlimited') addStaff(s);
  return s;
}

function removeSchool(s) {
  s.dead = true;
  S.kids.forEach(function (k) { if (k.target === s) { k.mode = 'wander'; k.target = null; k.pause = 0; } });
  if (s.landed) eject(s, s.inside);
  S.schools = S.schools.filter(function (o) { return o !== s; });
  S.teachers = S.teachers.filter(function (t) { return t.school !== s; });
  recalcNeeds();
  layout();
  S.teachers.forEach(parkAtSpot);
  if (S.phase !== 'build') sendEveryoneInside();
}

function makeKid(x, y) {
  return {
    x: x, y: y, tx: x, ty: y, mode: 'wander', target: null,
    speed: rand(16, 30) * S.P / 3, pause: rand(0, 1.5), ph: Math.random() * 10,
    pal: { h: pick(HAIR), s: pick(SKIN), e: '#1B1B1B', t: pick(SHIRT), p: pick(PANTS), f: '#222' }
  };
}
function groundPoint(k) {
  k.tx = rand(S.W * 0.04, S.W * 0.96);
  k.ty = rand(S.G.horizon + S.P * 6, S.G.roadTop - S.P);
}
function spawnEdge() {
  var G = S.G, r = Math.random(), x, y;
  if (r < 0.4) { x = -12; y = rand(G.horizon + 10, G.roadTop); }
  else if (r < 0.8) { x = S.W + 12; y = rand(G.horizon + 10, G.roadTop); }
  else { x = rand(0, S.W); y = S.H + 12; }
  var k = makeKid(x, y);
  groundPoint(k);
  k.pause = 0;
  S.kids.push(k);
  return k;
}
function eject(s, n) {
  for (var i = 0; i < n && s.inside > 0; i++) {
    s.inside--;
    var k = makeKid(s.x + rand(-4, 4), s.y + 2);
    k.tx = s.x + rand(-60, 60) * S.P / 3;
    k.ty = clamp(s.y + rand(8, 50) * S.P / 3, S.G.horizon + 6, S.G.roadTop - 2);
    k.pause = 0;
    S.kids.push(k);
  }
}

function assignKids() {
  var wanderers = S.kids.filter(function (k) { return k.mode === 'wander'; });
  var spawned = 0;
  S.schools.forEach(function (s) {
    if (!s.landed) return;
    var want = Math.min(3, s.need - s.inside - s.incoming);
    while (want-- > 0) {
      var k = null, bi = -1, bd = Infinity;
      for (var i = 0; i < wanderers.length; i++) {
        var d = Math.abs(wanderers[i].x - s.x) + Math.abs(wanderers[i].y - s.y);
        if (d < bd) { bd = d; bi = i; }
      }
      if (bi >= 0) k = wanderers.splice(bi, 1)[0];
      else if (spawned < 8) { k = spawnEdge(); spawned++; }
      if (!k) break;
      k.mode = 'go'; k.target = s; k.pause = 0;
      s.incoming++;
    }
    if (S.phase === 'build' && s.inside > s.need) eject(s, s.inside - s.need);
  });
  if (S.phase === 'build' || S.phase === 'title' || S.phase === 'select') {
    var goal = S.phase === 'build' ? 26 : 18;
    if (wanderers.length < goal) spawnEdge();
  }
}

function sendEveryoneInside() {
  var landed = S.schools.filter(function (s) { return !s.dead; });
  if (!landed.length) return;
  S.kids.forEach(function (k) {
    if (k.mode !== 'wander') return;
    var s = pick(landed);
    k.mode = 'go'; k.target = s; k.pause = 0;
    s.incoming++;
  });
}

function updateKids(dt) {
  var keep = [];
  for (var i = 0; i < S.kids.length; i++) {
    var k = S.kids[i];
    var going = k.mode === 'go';
    var tx = going ? k.target.x : k.tx, ty = going ? k.target.y : k.ty;
    if (going && (k.target.dead || !k.target.landed)) {
      if (k.target.dead) { k.mode = 'wander'; k.target = null; groundPoint(k); }
      keep.push(k);
      continue;
    }
    if (!going && k.pause > 0) { k.pause -= dt; keep.push(k); continue; }
    var dx = tx - k.x, dy = ty - k.y, d = Math.sqrt(dx * dx + dy * dy);
    var sp = k.speed * (going ? 2.4 : 1);
    k.ph += dt * (going ? 14 : 8);
    if (d < sp * dt + 1) {
      if (going) {
        k.target.inside++;
        k.target.incoming = Math.max(0, k.target.incoming - 1);
        sfx.pop();
        burst(k.target.x, k.target.y - 6 * k.target.u, 3, ['#FFFFFF', '#FFD23F'], 60);
        continue;
      }
      k.x = tx; k.y = ty;
      k.pause = rand(0.3, 2.2);
      groundPoint(k);
    } else {
      k.x += dx / d * sp * dt;
      k.y += dy / d * sp * dt;
    }
    keep.push(k);
  }
  S.kids = keep;
}

function updateSchools(dt) {
  S.schools.forEach(function (s) {
    if (s.hit > 0) s.hit -= dt;
    if (s.landed) return;
    s.vy += 2600 * dt;
    s.drop += s.vy * dt;
    if (s.drop >= 0) {
      s.drop = 0;
      if (s.vy > 500) {
        s.vy = -s.vy * 0.22;
        sfx.thud();
        if (!reduced) S.shake = Math.max(S.shake, 0.25);
        burst(s.x, s.y, 14, ['#C9B79C', '#A89274', '#E8DCC6'], 120);
      } else {
        s.vy = 0;
        s.landed = true;
      }
    }
  });
}

// Teachers and their cars, only on the map once the power-up is on.
function carSpot(tc) {
  var s = tc.school, d = dims(s);
  return { x: s.x + d.w / 2 * s.u + (8 + tc.i * 12) * S.P * 0.8, y: s.y + S.P };
}
function parkAtSpot(tc) {
  if (tc.state === 'in' || tc.state === 'walkout' || tc.state === 'walkin') {
    var p = carSpot(tc);
    tc.cx = p.x; tc.cy = p.y;
  }
}
function isWorkday(m) { return m >= 7 * 60 && m < 16 * 60 + 30; }
function addStaff(s) {
  var n = tierOf(s.size) >= 2 && S.schools.length <= 6 ? 2 : 1;
  var m = S.clock % 1440;
  for (var i = 0; i < n; i++) {
    var tc = {
      school: s, i: i, state: isWorkday(m) ? 'in' : 'away',
      delay: rand(0, 50), car: pick(CARS), px: 0, py: 0, cx: -80, cy: S.G.roadMid, ph: 0,
      pal: { h: pick(HAIR), s: pick(SKIN), e: '#1B1B1B', c: pick(['#6D597A', '#355070', '#B56576', '#2A9D8F', '#8D99AE']), k: '#FFD23F', p: '#2B2D42', f: '#111' }
    };
    parkAtSpot(tc);
    S.teachers.push(tc);
  }
}
function moveTo(o, kx, ky, tx, ty, sp, dt) {
  var dx = tx - o[kx], dy = ty - o[ky], d = Math.sqrt(dx * dx + dy * dy);
  if (d <= sp * dt) { o[kx] = tx; o[ky] = ty; return true; }
  o[kx] += dx / d * sp * dt; o[ky] += dy / d * sp * dt;
  return false;
}
function updateTeachers(dt) {
  var m = S.clock % 1440, walk = 26 * S.P / 3, drive = 110 * S.P / 3, road = S.G.roadMid;
  S.teachers.forEach(function (tc) {
    var s = tc.school, spot = carSpot(tc);
    tc.ph += dt * 8;
    if (tc.state === 'in' && m >= 16 * 60 + 30 + tc.delay && m < 20 * 60) {
      tc.state = 'walkout'; tc.px = s.x; tc.py = s.y + 1;
    } else if (tc.state === 'walkout') {
      if (moveTo(tc, 'px', 'py', spot.x, spot.y, walk, dt)) { tc.state = 'leave1'; if (Math.random() < 0.3) sfx.honk(); }
    } else if (tc.state === 'leave1') {
      if (moveTo(tc, 'cx', 'cy', spot.x, road, drive * 0.6, dt)) tc.state = 'leave2';
    } else if (tc.state === 'leave2') {
      if (moveTo(tc, 'cx', 'cy', S.W + 80, road, drive, dt)) tc.state = 'away';
    } else if (tc.state === 'away' && m >= 7 * 60 + tc.delay && m < 12 * 60) {
      tc.state = 'arrive1'; tc.cx = -60 - rand(0, 120); tc.cy = road;
    } else if (tc.state === 'arrive1') {
      if (moveTo(tc, 'cx', 'cy', spot.x, road, drive, dt)) tc.state = 'arrive2';
    } else if (tc.state === 'arrive2') {
      if (moveTo(tc, 'cx', 'cy', spot.x, spot.y, drive * 0.6, dt)) { tc.state = 'walkin'; tc.px = spot.x; tc.py = spot.y; }
    } else if (tc.state === 'walkin') {
      if (moveTo(tc, 'px', 'py', s.x, s.y + 1, walk, dt)) tc.state = 'in';
    }
  });
}

function nightness(m) {
  var h = (m % 1440) / 60;
  if (h >= 7.5 && h <= 17) return 0;
  if (h >= 20 || h <= 5) return 1;
  if (h > 17) return (h - 17) / 3;
  return (7.5 - h) / 2.5;
}
function isParty() {
  if (S.phase !== 'unlimited') return false;
  var h = (S.clock % 1440) / 60;
  return h >= 18 || h < 6.5;
}
var DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
function clockStr(m) {
  m = ((m % 1440) + 1440) % 1440;
  var h = Math.floor(m / 60), mm = Math.floor(m % 60);
  return (h % 12 || 12) + ':' + (mm < 10 ? '0' : '') + mm + ' ' + (h < 12 ? 'AM' : 'PM');
}

function burst(x, y, n, colors, spd) {
  if (reduced) n = Math.ceil(n / 3);
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, v = rand(0.3, 1) * spd;
    S.parts.push({ x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.5, life: rand(0.4, 1), c: pick(colors), s: Math.max(2, Math.round(S.P * rand(0.6, 1.3))) });
  }
  if (S.parts.length > 700) S.parts.splice(0, S.parts.length - 700);
}
function floatText(x, y, text, color, size) {
  S.floats.push({ x: x, y: y, text: text, c: color || '#FFD23F', size: size || 8, life: 1.2, max: 1.2 });
  if (S.floats.length > 60) S.floats.shift();
}
function updateFx(dt) {
  S.parts = S.parts.filter(function (p) {
    p.life -= dt; p.vy += 320 * dt; p.x += p.vx * dt; p.y += p.vy * dt;
    return p.life > 0;
  });
  S.floats = S.floats.filter(function (f) { f.life -= dt; f.y -= 34 * dt; return f.life > 0; });
  if (S.shake > 0) S.shake -= dt;
  if (S.flash > 0) S.flash -= dt;
}

var METER_KEYS = ['grades', 'scores', 'college', 'dreams'];
function updateMeters(dt) {
  var m = S.meters;
  if (S.phase === 'crisis' || S.phase === 'shop') {
    METER_KEYS.forEach(function (k) { m[k] = Math.max(6, m[k] - rand(3, 11) * dt); });
  } else if (S.phase === 'unlimited') {
    var drift = 0.8 * dt * (1 + S.sessions / 200);
    METER_KEYS.forEach(function (k) { m[k] += drift; });
  }
}
function boostMeters(amount) {
  METER_KEYS.forEach(function (k) { S.meters[k] += amount * rand(0.7, 1.3); });
}

var BLAST_MSGS = ['+1 TUTOR', 'UNSTUCK!', 'ESSAY FIXED', 'MATH CLICKED', 'A+', 'FAFSA DONE', 'GOT IT!', 'CHEM SOLVED', '+1 SESSION', 'LAB REPORT OK', 'MOLE DAY!', 'PROOF DONE'];
function blast(s, px, py) {
  var d = dims(s), top = s.y - d.h * s.u;
  S.sessions++;
  S.combo = S.t - S.lastBlast < 0.6 ? S.combo + 1 : 1;
  S.lastBlast = S.t;
  s.hit = 0.16;
  burst(px, py, 16, ['#FFD23F', '#FFFFFF', '#FF5EA8', '#7BE0C8', '#5FA8FF'], 170 * S.P / 3);
  var msg = isParty() && Math.random() < 0.5 ? clockStr(S.clock) + ' STILL ON' : pick(BLAST_MSGS);
  floatText(px, top - 3 * s.u, msg, pick(['#FFD23F', '#7BE0C8', '#FFFFFF']), 8);
  if (S.combo >= 5 && S.combo % 5 === 0) floatText(s.x, top - 14 * s.u, S.combo + 'x COMBO!', '#FF5EA8', 11);
  if (S.sessions % 3 === 1) floatText(S.W - 40, 46, '-0', '#A9B0DA', 8);
  boostMeters((2 + Math.min(S.combo, 20) * 0.12) * (1 + S.sessions / 120));
  sfx.blast(S.combo);
  S.idle = 0;
}

function schoolAt(px, py) {
  for (var i = S.schools.length - 1; i >= 0; i--) {
    var s = S.schools[i], d = dims(s), hw = d.w / 2 * s.u;
    if (px >= s.x - hw && px <= s.x + hw && py >= s.y - (d.h + 6) * s.u && py <= s.y + 3) return s;
  }
  return null;
}
