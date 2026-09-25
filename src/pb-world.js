var BLD = [{ w: 88, h: 54 }, { w: 106, h: 64 }, { w: 122, h: 74 }, { w: 138, h: 82 }, { w: 154, h: 92 }];
function dims(s) {
  if (s.size >= 25000) return { w: 84, h: Math.min(360, 110 + (Math.log10(s.size) - 4.4) * 55), mega: true };
  return BLD[tierOf(s.size)];
}
function depth(y) {
  var t = clamp((y - S.G.horizon) / (S.G.roadTop - S.G.horizon), 0, 1);
  return lerp(0.7, 1.08, t);
}
function srect(s) {
  var d = dims(s), sc = s.sc, extra = d.mega ? 16 : 30;
  return { x: s.x - d.w * sc / 2, y: s.y - (d.h + extra) * sc, w: d.w * sc, h: (d.h + extra) * sc };
}

function setGeometry(w, h) {
  var fx = S.W ? w / S.W : 1, fy = S.H ? h / S.H : 1;
  S.W = w; S.H = h;
  S.k = w >= h ? clamp(w / 1000, 0.55, 1.2) : clamp(w / 560, 0.5, 1);
  S.G = w >= h
    ? { horizon: h * 0.36, roadTop: h * 0.87, roadMid: h * 0.935 }
    : { horizon: h * 0.3, roadTop: h * 0.88, roadMid: h * 0.94 };
  S.kids.forEach(function (k) { k.x *= fx; k.y *= fy; k.tx *= fx; k.ty *= fy; });
  S.schools.forEach(function (s) { s.x *= fx; s.y *= fy; placeSchool(s, s.x, s.y); });
  S.teachers.forEach(function (tc) { tc.px *= fx; tc.py *= fy; tc.cx *= fx; tc.cy *= fy; parkAtSpot(tc); });
  S.hero.x = 34 + 30 * S.k;
  S.hero.y = S.G.roadTop + 6 * S.k;
}

function placeSchool(s, x, y) {
  var d = dims(s);
  s.y = clamp(y, S.G.horizon + 34 * S.k, S.G.roadTop - 8);
  s.sc = S.k * depth(s.y) * 1.2;
  var hw = d.w * s.sc / 2 + 6;
  s.x = clamp(x, hw, S.W - hw);
}

function recalcNeeds() {
  var base = [6, 11, 15, 18, 22], sum = 0;
  S.schools.forEach(function (s) { s.baseNeed = dims(s).mega ? 26 : base[tierOf(s.size)]; sum += s.baseNeed; });
  var f = Math.min(1, 260 / Math.max(1, sum));
  S.schools.forEach(function (s) { s.need = Math.max(1, Math.round(s.baseNeed * f)); });
}

function addSchool(x, y, tier) {
  var used = {};
  S.schools.forEach(function (s) { used[s.name] = 1; });
  var name = null;
  for (var i = 0; i < NAMES.length; i++) if (!used[NAMES[i]]) { name = NAMES[i]; break; }
  var s = {
    id: S.nextId++,
    name: name || 'School #' + (S.schools.length + 1),
    size: SIZES[tier].size,
    inside: 0, incoming: 0, need: 2, sc: 1,
    drop: -70 * S.k, vy: 0, landed: false, squash: 0, hit: 0,
    wall: WALLS[(S.nextId - 2) % WALLS.length]
  };
  placeSchool(s, x, y);
  S.schools.push(s);
  recalcNeeds();
  if (S.phase === 'unlimited') addStaff(s);
  return s;
}

function freeSpot() {
  var best = null;
  for (var i = 0; i < 40; i++) {
    var x = rand(S.W * 0.08, S.W * 0.92), y = rand(S.G.horizon + 70 * S.k, S.G.roadTop - 10), near = Infinity;
    S.schools.forEach(function (s) {
      var d = Math.abs(s.x - x) / 1.6 + Math.abs(s.y - y);
      if (d < near) near = d;
    });
    if (!best || near > best.near) best = { x: x, y: y, near: near };
  }
  return best;
}

function setSize(s, size) {
  s.size = size;
  placeSchool(s, s.x, s.y);
  recalcNeeds();
  S.teachers.forEach(parkAtSpot);
  if (S.phase === 'build' && s.inside > s.need) eject(s, s.inside - s.need);
}

function removeSchool(s) {
  s.dead = true;
  S.kids.forEach(function (k) { if (k.target === s) { k.mode = 'wander'; k.target = null; k.pause = 0; } });
  if (s.landed) eject(s, s.inside);
  S.schools = S.schools.filter(function (o) { return o !== s; });
  S.teachers = S.teachers.filter(function (t) { return t.school !== s; });
  recalcNeeds();
  if (S.phase !== 'build') sendEveryoneInside();
}

function makeKid(x, y) {
  return {
    x: x, y: y, tx: x, ty: y, mode: 'wander', target: null,
    speed: rand(22, 38), pause: rand(0, 1.5), ph: Math.random() * 10,
    skin: pick(SKIN), hair: pick(HAIR), shirt: pick(SHIRT), pants: pick(PANTS),
    style: (Math.random() * 3) | 0, pack: Math.random() < 0.4 ? pick(SHIRT) : null
  };
}
function groundPoint(k) {
  k.tx = rand(S.W * 0.03, S.W * 0.97);
  k.ty = rand(S.G.horizon + 14 * S.k, S.G.roadTop - 2);
}
function seedHoard(n) {
  for (var i = 0; i < n; i++) {
    var k = makeKid(0, 0);
    groundPoint(k);
    k.x = k.tx; k.y = k.ty;
    groundPoint(k);
    S.kids.push(k);
  }
}
function spawnEdge() {
  var G = S.G, r = Math.random(), x, y;
  if (r < 0.45) { x = -14; y = rand(G.horizon + 10, G.roadTop); }
  else if (r < 0.9) { x = S.W + 14; y = rand(G.horizon + 10, G.roadTop); }
  else { x = rand(0, S.W); y = S.H + 14; }
  var k = makeKid(x, y);
  groundPoint(k);
  k.pause = 0;
  S.kids.push(k);
  return k;
}
function eject(s, n) {
  for (var i = 0; i < n && s.inside > 0; i++) {
    s.inside--;
    var k = makeKid(s.x + rand(-6, 6), s.y + 3);
    k.tx = clamp(s.x + rand(-80, 80) * S.k, 10, S.W - 10);
    k.ty = clamp(s.y + rand(10, 60) * S.k, S.G.horizon + 10, S.G.roadTop - 2);
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
      else if (spawned < 4) { k = spawnEdge(); spawned++; }
      if (!k) break;
      k.mode = 'go'; k.target = s; k.pause = 0;
      s.incoming++;
    }
  });
}

function sendEveryoneInside() {
  if (!S.schools.length) return;
  S.kids.forEach(function (k) {
    if (k.mode !== 'wander') return;
    var s = pick(S.schools);
    k.mode = 'go'; k.target = s; k.pause = 0;
    s.incoming++;
  });
}

function updateKids(dt) {
  var keep = [];
  for (var i = 0; i < S.kids.length; i++) {
    var k = S.kids[i], going = k.mode === 'go';
    if (going && k.target.dead) { k.mode = 'wander'; k.target = null; groundPoint(k); going = false; }
    if (going && !k.target.landed) { keep.push(k); continue; }
    if (!going && k.pause > 0) { k.pause -= dt; keep.push(k); continue; }
    var tx = going ? k.target.x : k.tx, ty = going ? k.target.y : k.ty;
    var dx = tx - k.x, dy = ty - k.y, d = Math.sqrt(dx * dx + dy * dy);
    var sp = k.speed * S.k * (going ? 2.6 : 1);
    k.ph += dt * (going ? 16 : 9);
    if (d < sp * dt + 1) {
      if (going) {
        k.target.inside++;
        k.target.incoming = Math.max(0, k.target.incoming - 1);
        sfx.pop();
        burst(k.target.x, k.target.y - 14 * k.target.sc, 3, ['#FFFFFF', '#FFC94D'], 70, 'dot');
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
    if (s.squash > 0) s.squash = Math.max(0, s.squash - dt * 3);
    if (s.landed) return;
    s.vy += 3400 * dt;
    s.drop += s.vy * dt;
    if (s.drop >= 0) {
      s.drop = 0; s.vy = 0; s.landed = true; s.squash = 1;
      sfx.stamp();
      if (!reduced) S.shake = Math.max(S.shake, 0.18);
      burst(s.x, s.y, 16, ['#FFFFFF', '#EEEAE0', '#FFF0C3'], 150 * S.k, 'dot');
    }
  });
}

// Teachers and their cars appear once the power-up is on.
function carSpot(tc) {
  var s = tc.school, d = dims(s);
  return { x: s.x + d.w * s.sc / 2 + (26 + tc.i * 48) * s.sc, y: s.y + 2 };
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
      school: s, i: i, state: isWorkday(m) ? 'in' : 'away', delay: rand(0, 50),
      car: pick(CARS), px: 0, py: 0, cx: -80, cy: S.G.roadMid, ph: 0,
      skin: pick(SKIN), hair: pick(HAIR), shirt: pick(['#6D597A', '#355070', '#B56576', '#2A9D8F', '#8D99AE']), pants: '#2B2D42', adult: true
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
  var m = S.clock % 1440, walk = 32 * S.k, drive = 150 * S.k, road = S.G.roadMid;
  S.teachers.forEach(function (tc) {
    var s = tc.school, spot = carSpot(tc);
    tc.ph += dt * 9;
    if (tc.state === 'in' && m >= 16 * 60 + 30 + tc.delay && m < 20 * 60) {
      tc.state = 'walkout'; tc.px = s.x; tc.py = s.y + 2;
    } else if (tc.state === 'walkout') {
      if (moveTo(tc, 'px', 'py', spot.x, spot.y, walk, dt)) { tc.state = 'leave1'; if (Math.random() < 0.3) sfx.honk(); }
    } else if (tc.state === 'leave1') {
      if (moveTo(tc, 'cx', 'cy', spot.x, road, drive * 0.6, dt)) tc.state = 'leave2';
    } else if (tc.state === 'leave2') {
      if (moveTo(tc, 'cx', 'cy', S.W + 90, road, drive, dt)) tc.state = 'away';
    } else if (tc.state === 'away' && m >= 7 * 60 + tc.delay && m < 12 * 60) {
      tc.state = 'arrive1'; tc.cx = -70 - rand(0, 140); tc.cy = road;
    } else if (tc.state === 'arrive1') {
      if (moveTo(tc, 'cx', 'cy', spot.x, road, drive, dt)) tc.state = 'arrive2';
    } else if (tc.state === 'arrive2') {
      if (moveTo(tc, 'cx', 'cy', spot.x, spot.y, drive * 0.6, dt)) { tc.state = 'walkin'; tc.px = spot.x; tc.py = spot.y; }
    } else if (tc.state === 'walkin') {
      if (moveTo(tc, 'px', 'py', s.x, s.y + 2, walk, dt)) tc.state = 'in';
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

function burst(x, y, n, colors, spd, shape) {
  if (reduced) n = Math.ceil(n / 3);
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, v = rand(0.3, 1) * spd;
    S.parts.push({
      x: x, y: y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - spd * 0.5, life: rand(0.5, 1.1),
      c: pick(colors), s: rand(3, 7) * S.k, shape: shape || 'star', rot: Math.random() * 6, vr: rand(-8, 8), grav: 340
    });
  }
  if (S.parts.length > 700) S.parts.splice(0, S.parts.length - 700);
}
function floatText(x, y, text, style, size) {
  S.floats.push({ x: x, y: y, text: text, style: style || 'win', size: size || 15, life: 1.2, max: 1.2 });
  if (S.floats.length > 14) S.floats.shift();
}
function updateFx(dt) {
  S.parts = S.parts.filter(function (p) {
    p.life -= dt; p.vy += (p.grav === undefined ? 340 : p.grav) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
    return p.life > 0;
  });
  S.floats = S.floats.filter(function (f) { f.life -= dt; f.y -= 38 * dt; return f.life > 0; });
  if (S.wave) { S.wave.r += S.wave.v * dt; S.wave.life -= dt; if (S.wave.life <= 0) S.wave = null; }
  if (S.hero.pulse > 0) S.hero.pulse = Math.max(0, S.hero.pulse - dt * 4);
  if (S.shake > 0) S.shake -= dt;
  if (S.flash > 0) S.flash -= dt;
}

var SAD = ['GRADES', 'SAT SCORES', 'GRADUATION', 'COLLEGE ACCEPTANCE', 'ATTENDANCE', 'CONFIDENCE', 'HOMEWORK DONE', 'FAFSA FILED', 'AP SCORES', 'READING LEVEL'];
var WINS = ['A+ ON THE ESSAY', 'MATH CLICKED', 'UNSTUCK!', 'LAB REPORT DONE', 'PROOF SOLVED', 'GOT IT!'];
function schoolTop(s) { return s.y - (dims(s).h + 8) * s.sc; }
function sadEvent() {
  if (!S.schools.length) return;
  var s = pick(S.schools);
  floatText(s.x + rand(-20, 20) * S.k, schoolTop(s), '🔽 ' + pick(SAD), 'sad', 15);
  if (Math.random() < 0.5) sfx.sad();
}
function addDreams(v) {
  S.dreams += v;
  while (S.dreams >= 1) {
    S.dreams -= 1;
    S.mult *= 2;
    onDreamLoop();
  }
}
function updateDreams(dt) {
  if (S.phase === 'crisis') S.dreams = Math.max(0.06, S.dreams - 0.085 * dt);
  else if (S.phase === 'unlimited') addDreams(0.012 * dt);
}

function blast(s, px, py) {
  S.sessions++;
  S.combo = S.t - S.lastBlast < 0.6 ? S.combo + 1 : 1;
  S.lastBlast = S.t;
  s.hit = 0.18;
  s.squash = 0.45;
  burst(px, py, 16, POP, 190 * S.k, 'star');
  var r = Math.random();
  if (isParty() && r < 0.35) floatText(px, schoolTop(s), '🌙 ' + clockStr(S.clock) + ': STILL ON', 'win', 15);
  else if (r < 0.72) floatText(px, schoolTop(s), '🔼 ' + pick(SAD), 'happy', 15);
  else floatText(px, schoolTop(s), pick(WINS) + ' ✨', 'win', 15);
  if (S.combo >= 5 && S.combo % 5 === 0) floatText(px, py - 46 * S.k, S.combo + 'x STREAK!', 'big', 20);
  addDreams(0.1 * (1 + Math.min(S.combo, 20) * 0.03));
  sfx.blast(S.combo);
  S.idle = 0;
}

function schoolAt(px, py) {
  var list = S.schools.slice().sort(function (a, b) { return b.y - a.y; });
  for (var i = 0; i < list.length; i++) {
    var r = srect(list[i]);
    if (px >= r.x && px <= r.x + r.w && py >= r.y && py <= list[i].y + 4) return list[i];
  }
  return null;
}

// Energy streaming into the admin while the power-up charges.
function chargeFx(intensity) {
  var n = Math.ceil(intensity * 3);
  for (var i = 0; i < n; i++) {
    var a = Math.random() * Math.PI * 2, r = rand(120, 420) * S.k;
    var x = S.hero.x + Math.cos(a) * r, y = S.hero.y - 40 * S.k + Math.sin(a) * r, life = rand(0.35, 0.6);
    S.parts.push({ x: x, y: y, vx: (S.hero.x - x) / life, vy: (S.hero.y - 40 * S.k - y) / life, life: life, c: pick(POP), s: rand(3, 6) * S.k, shape: 'dot', rot: 0, vr: 0, grav: 0 });
  }
}
function heroAt(px, py) {
  return Math.abs(px - S.hero.x) < 30 * S.k && py < S.hero.y + 4 && py > S.hero.y - 110 * S.k;
}
