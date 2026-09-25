var DPR = 1;
var MAX_SCHOOLS = 60;
var COUNTDOWN = 3;
var CROWD = 50;
var touchFirst = window.matchMedia && window.matchMedia('(hover: none)').matches;
var UI = {
  pop: null, drag: null, cd: null, cdShown: 0, flashUntil: 0,
  hoverS: null, hoverT: 0, hoverBlock: null, inPop: false,
  canStamp: function () { return S.phase === 'build' && S.schools.length < MAX_SCHOOLS && $('pb-invoice').hidden; }
};
var INF = '<span class="pb-inf">∞</span>';
var DONE_FACE = '<b>✓</b><small>Done</small>';
function verb() { return touchFirst ? 'Tap' : 'Click'; }
function say(text) { $('pb-live').textContent = text; }
function focusQuiet(el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
function once(key, fn) { if (!S.seen[key]) { S.seen[key] = 1; fn(); } }
function screenRect(el) {
  var r = el.getBoundingClientRect(), s = $('pb-screen').getBoundingClientRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
}

// The status line is the only place text appears: the current instruction,
// briefly replaced by a status moment that then hands back to the instruction.
var statusLine = { base: '', alarm: false, shown: '' };
function paintStatus(html, alarm) {
  if (html === statusLine.shown) return;
  statusLine.shown = html;
  var el = $('pb-status');
  el.innerHTML = html;
  el.classList.toggle('is-alarm', !!alarm);
  el.classList.remove('is-new');
  void el.offsetWidth;
  el.classList.add('is-new');
}
function setStatus(html, alarm) {
  statusLine.base = html;
  statusLine.alarm = !!alarm;
  if (!UI.flashUntil) paintStatus(html, alarm);
}
function flashStatus(html, ms, alarm) {
  UI.flashUntil = S.t + (ms || 2800) / 1000;
  statusLine.shown = '';
  paintStatus(html, alarm);
}
function statusStep() {
  if (UI.flashUntil && S.t >= UI.flashUntil) { UI.flashUntil = 0; paintStatus(statusLine.base, statusLine.alarm); }
}
function buildStatus() {
  if (S.phase !== 'build' || UI.cd != null) return;
  if (!S.schools.length) setStatus('<em>Kids with nowhere to go!</em> ' + verb() + ' anywhere to add your district’s schools.');
  else if (S.schools.length >= MAX_SCHOOLS) setStatus('That’s ' + MAX_SCHOOLS + ' buildings! Hit <em>Done</em> when you’re ready.');
  else setStatus('<em>Add every school</em> in your district. ' + (touchFirst ? 'Tap' : 'Hover over') + ' one to change its size.');
}

function totalPrice() {
  var p = 0;
  S.schools.forEach(function (s) { p += priceFor(s.size); });
  return p;
}
function updatePrices() {
  var p = money(totalPrice());
  $('pb-tip-price').textContent = p;
  $('pb-inv-total').textContent = p;
}
function onSchoolsChanged() {
  updatePrices();
  $('pb-done').hidden = !(S.phase === 'build' && S.schools.length);
  buildStatus();
}

// Size picker: chips in a small card anchored to the school.
function shortNum(n) {
  if (n >= 1e6) return Math.round(n / 1e6) + 'M';
  if (n >= 1e3) return Math.round(n / 1e3) + 'K';
  return String(n);
}
(function buildChips() {
  var box = $('pb-chips');
  SIZES.forEach(function (_, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pb-chip';
    b.addEventListener('click', function () { chooseSize(i); });
    box.appendChild(b);
  });
})();
function paintChips(s) {
  var t = tierOf(s.size);
  $('pb-chips').querySelectorAll('.pb-chip').forEach(function (b, i) {
    b.textContent = i === 4 && s.size > SIZES[4].size ? '2,500+ (' + shortNum(s.size) + ')' : SIZES[i].label;
    b.classList.toggle('is-on', i === t);
    b.setAttribute('aria-pressed', String(i === t));
    b.title = i === 4 && t === 4 ? 'Tap again to add capacity' : '';
  });
}
function openPop(s, how) {
  UI.pop = { s: s, how: how, t: 0, dur: how === 'hover' ? 5 : 4, after: null, out: 0 };
  $('pb-pop-name').textContent = s.name;
  paintChips(s);
  $('pb-pop').hidden = false;
  positionPop();
  if (how !== 'hover') cancelCountdown();
}
function positionPop() {
  if (!UI.pop) return;
  var el = $('pb-pop'), s = UI.pop.s, r = srect(s), pw = el.offsetWidth, ph = el.offsetHeight;
  var x = clamp(s.x - pw / 2, 8, S.W - pw - 8), y = r.y - ph - 12, below = false;
  if (y < 8) { y = s.y + 14; below = true; }
  if (below && y + ph > S.H - 8) { y = clamp(r.y + r.h / 2 - ph / 2, 8, S.H - ph - 8); below = false; }
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.classList.toggle('is-below', below);
  $('pb-pop-tail').style.left = clamp(s.x - x, 16, pw - 16) + 'px';
}
function closePop() {
  if (!UI.pop) return;
  var P = UI.pop;
  UI.hoverBlock = P.s;
  UI.pop = null;
  UI.inPop = false;
  $('pb-pop').hidden = true;
  if (P.how !== 'hover') S.idleBuild = 0;
}
function chooseSize(i) {
  if (!UI.pop) return;
  var s = UI.pop.s;
  cancelCountdown();
  S.idleBuild = 0;
  if (i === 4 && tierOf(s.size) === 4) {
    var next = Math.min(s.size * 10, 300000000);
    setSize(s, next);
    floatText(s.x, schoolTop(s), '+CAPACITY!', 'cap', 17);
    if (next >= 1000000) once('fed', function () { flashStatus('Hi, <em>federal government</em> 👋 Still one building, still $25,000.', 4000); });
  } else {
    setSize(s, SIZES[i].size);
  }
  s.squash = 0.6;
  sfx.chip(i);
  paintChips(s);
  updatePrices();
  positionPop();
  UI.pop.how = 'click';
  UI.pop.after = 1.4;
  say(s.name + ': ' + SIZES[tierOf(s.size)].label + ' students, ' + money(priceFor(s.size)) + ' a year.');
}
function popStep(dt) {
  var P = UI.pop;
  if (!P) return;
  if (P.after != null) {
    P.after -= dt;
    if (P.after <= 0) { closePop(); return; }
  } else if (!UI.inPop) {
    P.t += dt;
    if (P.t >= P.dur) { closePop(); return; }
  }
  if (S.ptr.mouse && !UI.inPop) {
    var r = srect(P.s), p = S.ptr;
    var near = p.inside && p.x > r.x - 30 && p.x < r.x + r.w + 30 && p.y > r.y - 30 && p.y < P.s.y + 30;
    P.out = near ? 0 : P.out + dt;
    if (P.out > 0.35) { closePop(); return; }
  }
  $('pb-pop-timer').style.transform = 'scaleX(' + (P.after != null ? P.after / 1.4 : 1 - P.t / P.dur) + ')';
}
function hoverStep(dt) {
  if (!S.ptr.mouse || !S.ptr.inside || UI.drag) { UI.hoverS = null; return; }
  var over = schoolAt(S.ptr.x, S.ptr.y);
  if (over !== UI.hoverS) { UI.hoverS = over; UI.hoverT = 0; UI.hoverBlock = null; }
  if (over && over.landed && over !== UI.hoverBlock && !(UI.pop && UI.pop.s === over)) {
    UI.hoverT += dt;
    if (UI.hoverT > 0.25) { closePop(); openPop(over, 'hover'); }
  }
}
$('pb-pop').addEventListener('pointerenter', function () { UI.inPop = true; });
$('pb-pop').addEventListener('pointerleave', function () { UI.inPop = false; });
$('pb-pop-del').addEventListener('click', function () {
  if (!UI.pop) return;
  var s = UI.pop.s;
  closePop();
  removeSchool(s);
  onSchoolsChanged();
  say(s.name + ' removed.');
});
$('pb-pop-copy').addEventListener('click', function () {
  if (!UI.pop) return;
  var s = UI.pop.s;
  closePop();
  for (var i = 0; i < 5; i++) {
    setTimeout(function () {
      if (!UI.canStamp()) return;
      var p = freeSpot(), n = addSchool(p.x, p.y, tierOf(s.size));
      setSize(n, s.size);
      onSchoolsChanged();
    }, i * 150);
  }
  S.idleBuild = -0.8;
});

// The Done button doubles as the countdown.
function paintRing(frac) { $('pb-done-ring').style.strokeDashoffset = String(289 * (1 - frac)); }
function startCountdown() {
  UI.cd = COUNTDOWN;
  UI.cdShown = 0;
  $('pb-done').classList.add('is-counting');
}
function cancelCountdown() {
  if (UI.cd == null) return;
  UI.cd = null;
  $('pb-done').classList.remove('is-counting');
  $('pb-done-face').innerHTML = DONE_FACE;
  paintRing(0);
  buildStatus();
}
function countdownStep(dt) {
  if (UI.cd == null) {
    var calm = S.schools.length && (!UI.pop || UI.pop.how === 'hover') && !UI.drag && $('pb-invoice').hidden;
    if (calm && S.schools.every(function (s) { return s.landed; })) {
      S.idleBuild = (S.idleBuild || 0) + dt;
      if (S.idleBuild >= 2) startCountdown();
    }
    return;
  }
  UI.cd -= dt;
  paintRing(Math.max(0, UI.cd / COUNTDOWN));
  var n = Math.ceil(UI.cd);
  if (n !== UI.cdShown && n > 0) {
    UI.cdShown = n;
    $('pb-done-face').innerHTML = '<b>' + n + '</b><small>Go!</small>';
    setStatus('Got every school? Moving on in <b>' + n + '</b>… ' + verb() + ' the map to add more.');
    sfx.tick(n);
  }
  if (UI.cd <= 0) goCrisis();
}

// Phases
function goCrisis() {
  if (S.phase !== 'build') return;
  cancelCountdown();
  closePop();
  S.phase = 'crisis';
  $('pb-done').hidden = true;
  sendEveryoneInside();
  root.classList.add('is-crisis');
  $('pb-dreams').hidden = false;
  S.dreams = 0.78;
  setStatus('<em>Oh no, dreams are dropping!</em>', true);
  sfx.alarm();
  UI.puAt = S.t + 1.4;
  UI.sadT = 0.4;
  UI.wiggleT = 4;
  cv.setAttribute('aria-label', 'Your schools. Grades and dreams are dropping. A power-up is on its way.');
  say('Dreams are dropping. A power-up is on its way.');
}
function orbSpot(badge) {
  if (badge) return { x: S.hero.x + 30 * S.k, y: S.hero.y - 74 * S.k };
  return { x: S.hero.x + 110 * S.k + 34, y: S.hero.y - 64 * S.k };
}
function placeOrb(p) {
  var pu = $('pb-pu');
  pu.style.left = p.x + 'px';
  pu.style.top = p.y + 'px';
}
function noPower(x, y) {
  floatText(x, y - 10, 'No power!', 'sad', 16);
  sfx.buzz();
  var pw = $('pb-power');
  pw.classList.remove('is-shake');
  void pw.offsetWidth;
  pw.classList.add('is-shake');
  flashStatus('<em>No power yet!</em> ' + verb() + ' the power-up ⭐ first.', 1800, true);
}
function crisisStep(dt) {
  UI.sadT -= dt;
  if (UI.sadT <= 0) { sadEvent(); UI.sadT = rand(0.5, 0.8); }
  var pu = $('pb-pu');
  if (UI.puAt && S.t >= UI.puAt) {
    UI.puAt = 0;
    updatePrices();
    placeOrb(orbSpot(false));
    pu.className = 'pb-pu is-arrive';
    pu.hidden = false;
    sfx.swoosh();
    setStatus('<em>Dreams are dropping!</em> ' + verb() + ' the power-up to charge up.', true);
    say('Power-up available: unlimited tutoring for ' + money(totalPrice()) + ' a year.');
  }
  if (!pu.hidden && !UI.puAt) {
    UI.wiggleT -= dt;
    if (UI.wiggleT <= 0) {
      UI.wiggleT = 4;
      pu.classList.remove('is-wiggle');
      void pu.offsetWidth;
      pu.classList.add('is-wiggle');
    }
  }
}
function give() {
  if (S.phase !== 'crisis') return;
  S.phase = 'charge';
  S.chargeT = 0;
  UI.absorbed = false;
  root.classList.remove('is-crisis');
  var pu = $('pb-pu');
  pu.classList.remove('is-arrive', 'is-wiggle');
  pu.classList.add('is-given');
  placeOrb({ x: S.hero.x, y: S.hero.y - 50 * S.k });
  var pw = $('pb-power'), r = screenRect(pw);
  pw.style.setProperty('--pb-dx', (S.W / 2 - (r.x + r.w * 2.1 / 2)) + 'px');
  pw.style.setProperty('--pb-dy', (S.H / 2 - (r.y + r.h / 2)) + 'px');
  pw.classList.add('is-charging');
  setStatus('<em>Charging…</em>');
  sfx.charge();
  say('Charging the power-up.');
}
function chargeStep(dt) {
  S.chargeT += dt;
  var t = S.chargeT - 0.45;
  if (!UI.absorbed && S.chargeT >= 0.45) {
    UI.absorbed = true;
    $('pb-pu').hidden = true;
    S.hero.pulse = 1;
    burst(S.hero.x, S.hero.y - 50 * S.k, 20, ['#FFC94D', '#FFFFFF'], 160 * S.k, 'star');
  }
  if (t <= 0) return;
  var f = Math.min(1, t / 1.6);
  S.power = t < 1.6 ? f * 100 : 100 + Math.pow(Math.min(1, (t - 1.6) / 0.5), 2) * 899;
  chargeFx(0.5 + f * 2.5);
  S.shake = Math.max(S.shake, 0.03 + 0.1 * f);
  if (t >= 2.1) boom();
}
function boom() {
  S.flash = 0.5;
  if (!reduced) S.shake = 0.45;
  S.wave = { r: 0, v: Math.max(S.W, S.H) * 1.6, life: 0.7, max: 0.7 };
  sfx.boom();
  for (var i = 0; i < 6; i++) burst(rand(0, S.W), rand(0, S.H * 0.5), 16, POP, 240 * S.k, 'conf');
  S.schools.forEach(function (s) { s.squash = 1; burst(s.x, schoolTop(s), 14, POP, 220 * S.k, 'star'); });
  $('pb-power').classList.remove('is-charging');
  startUnlimited();
}
function startUnlimited() {
  S.phase = 'unlimited';
  S.uStart = S.t;
  S.beat = -1;
  S.clock = 15 * 60;
  S.idle = 0;
  root.classList.add('is-unlimited');
  S.teachers = [];
  S.schools.forEach(addStaff);
  addDreams(1.02 - S.dreams);
  var pu = $('pb-pu');
  pu.className = 'pb-pu is-badge';
  placeOrb(orbSpot(true));
  pu.hidden = false;
  $('pb-orb').setAttribute('aria-label', 'UPchieve power-up, active. See the price.');
  setStatus('<em>Unlimited power!</em> ' + verb() + ' your schools. As much as you want.');
  $('pb-clock').hidden = false;
  $('pb-again').hidden = false;
  music.on = true;
  music.next = 0;
  music.step = 0;
  music.t0 = 0;
  cv.setAttribute('aria-label', 'Unlimited mode. Press space on the map to send tutors to a school.');
  say('Unlimited tutoring is on. ' + verb() + ' schools, or press space on the map, to send tutors.');
}
function onDreamLoop() {
  var m = $('pb-dreams-mult');
  m.textContent = '×' + num(S.mult);
  m.classList.remove('is-bump');
  void m.offsetWidth;
  m.classList.add('is-bump');
  if (S.phase === 'unlimited') {
    sfx.chime();
    var r = screenRect($('pb-dreams'));
    burst(r.x + r.w - 24, r.y + r.h, 14, POP, 180 * S.k, 'conf');
  }
}
function onBeat(b) {
  var party = isParty();
  S.schools.forEach(function (s) { s.squash = Math.max(s.squash, party ? 0.24 : 0.07); });
  if (!party || !S.schools.length) return;
  if (b % 2 === 0) {
    var s = pick(S.schools);
    floatText(s.x + rand(-40, 40) * s.sc, schoolTop(s), pick(['♪', '♫']), pick(SHIRT), 26);
  }
  if (b % 4 === 0) {
    var c = pick(S.schools);
    burst(c.x, schoolTop(c) - 20 * c.sc, 16, POP, 220 * S.k, 'conf');
  }
}
function crossed(prev, cur, minute) {
  var a = prev % 1440, b = cur % 1440;
  return b >= a ? a < minute && b >= minute : a < minute || b >= minute;
}
function unlimitedStep(dt) {
  var prev = S.clock, m = S.clock % 1440;
  S.clock += (m >= 7.5 * 60 && m < 16 * 60 ? 60 : 30) * dt;
  if (crossed(prev, S.clock, 16 * 60 + 30)) once('out', function () { flashStatus('<em>4:30 PM:</em> teachers clock out. UPchieve doesn’t.', 3200); });
  if (crossed(prev, S.clock, 20 * 60)) once('party', function () { flashStatus('<em>8:00 PM:</em> the study party is on.', 3000); });
  if (crossed(prev, S.clock, 2 * 60)) once('2am', function () { flashStatus('<em>2:00 AM:</em> still unlimited. Still going.', 3000); });
  if (crossed(prev, S.clock, 7 * 60 + 30)) once('back', function () { flashStatus('<em>7:30 AM:</em> teachers are back. Power left: ' + INF, 3200); });
  if (Math.floor(prev / 1440) % 7 !== 5 && Math.floor(S.clock / 1440) % 7 === 5) once('sat', function () { flashStatus('<em>Saturday.</em> Still unlimited. Obviously.', 3000); });
  updateTeachers(dt);
  S.idle += dt;
  if (S.idle > 8 && S.nudges < 3 && !UI.flashUntil) {
    S.nudges++;
    S.idle = 0;
    flashStatus('<em>Keep going!</em> It’s unlimited. We checked.', 2800);
  }
  var b = Math.floor(beatPos());
  if (b !== S.beat && b >= 0) { S.beat = b; onBeat(b); }
  musicTick(isParty());
}

var lastClock = '';
function paintHud() {
  var jitter = S.phase === 'crisis' ? Math.sin(S.t * 18) * 0.03 : 0;
  $('pb-dreams-fill').style.width = clamp(S.dreams + jitter, 0.02, 1) * 100 + '%';
  var pn = $('pb-power-num');
  if (S.phase === 'unlimited') {
    if (!pn.firstElementChild) pn.innerHTML = INF;
    var c = DAYS[Math.floor(S.clock / 1440) % 7] + ' ' + clockStr(S.clock);
    if (c !== lastClock) { lastClock = c; $('pb-clock').textContent = c; }
  } else {
    $('pb-power-fill').style.width = Math.min(100, S.power) + '%';
    pn.textContent = num(S.power);
  }
}

// Invoice
function renderInvoice() {
  var box = $('pb-lines');
  box.innerHTML = '';
  if (!S.schools.length) box.innerHTML = '<div class="pb-line"><span class="pb-line-name">No schools yet</span></div>';
  S.schools.forEach(function (s) {
    var row = document.createElement('div');
    row.className = 'pb-line';
    var opts = SIZES.map(function (z, i) { return '<option value="' + i + '">' + z.label + ' kids</option>'; }).join('');
    if (s.size > SIZES[4].size) opts += '<option value="x">' + num(s.size) + ' kids</option>';
    row.innerHTML = '<span class="pb-line-name"></span><select></select><span class="pb-line-price"></span><button type="button" class="pb-x">&times;</button>';
    row.querySelector('.pb-line-name').textContent = s.name;
    var sel = row.querySelector('select'), price = row.querySelector('.pb-line-price'), del = row.querySelector('.pb-x');
    sel.innerHTML = opts;
    sel.value = s.size > SIZES[4].size ? 'x' : String(tierOf(s.size));
    sel.setAttribute('aria-label', 'Students at ' + s.name);
    price.textContent = money(priceFor(s.size));
    sel.addEventListener('change', function () {
      if (sel.value === 'x') return;
      setSize(s, SIZES[Number(sel.value)].size);
      price.textContent = money(priceFor(s.size));
      updatePrices();
    });
    del.setAttribute('aria-label', 'Remove ' + s.name);
    del.addEventListener('click', function () {
      removeSchool(s);
      onSchoolsChanged();
      renderInvoice();
      focusQuiet($('pb-inv-close'));
    });
    box.appendChild(row);
  });
  $('pb-inv-add').hidden = S.phase !== 'build';
  $('pb-inv-add').disabled = S.schools.length >= MAX_SCHOOLS;
  updatePrices();
}
function openInvoice() {
  cancelCountdown();
  closePop();
  renderInvoice();
  $('pb-invoice').hidden = false;
  focusQuiet($('pb-inv-close'));
}
function closeInvoice() {
  $('pb-invoice').hidden = true;
  S.idleBuild = 0;
  focusQuiet(cv);
}
$('pb-inv-add').addEventListener('click', function () {
  if (S.phase !== 'build' || S.schools.length >= MAX_SCHOOLS) return;
  var p = freeSpot();
  addSchool(p.x, p.y, DEFAULT_TIER);
  onSchoolsChanged();
  renderInvoice();
});
$('pb-inv-close').addEventListener('click', closeInvoice);
$('pb-invoice').addEventListener('click', function (e) { if (e.target === this) closeInvoice(); });
$('pb-tip-invoice').addEventListener('click', openInvoice);
$('pb-orb').addEventListener('click', function () { if (S.phase === 'crisis') give(); });
$('pb-done').addEventListener('click', goCrisis);
$('pb-again').addEventListener('click', resetGame);
$('pb-mute').addEventListener('click', function () {
  muted = !muted;
  this.innerHTML = muted ? '&#128263;' : '&#128266;';
  this.setAttribute('aria-pressed', String(muted));
  this.setAttribute('aria-label', muted ? 'Unmute sound' : 'Mute sound');
});
root.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (!$('pb-invoice').hidden) closeInvoice();
  else if (UI.pop) closePop();
});

function resetGame() {
  closePop();
  cancelCountdown();
  $('pb-invoice').hidden = true;
  S.schools = []; S.kids = []; S.teachers = []; S.parts = []; S.floats = [];
  S.dreams = 0.78; S.mult = 1; S.power = 0; S.clock = 10 * 60; S.wave = null;
  S.sessions = 0; S.combo = 0; S.nudges = 0; S.seen = {}; S.idle = 0; S.idleBuild = 0;
  S.phase = 'build';
  UI.flashUntil = 0;
  music.on = false;
  root.classList.remove('is-crisis', 'is-unlimited');
  ['pb-dreams', 'pb-clock', 'pb-again', 'pb-pu'].forEach(function (id) { $(id).hidden = true; });
  $('pb-pu').className = 'pb-pu';
  $('pb-power').classList.remove('is-charging', 'is-shake');
  $('pb-dreams-mult').textContent = '×1';
  $('pb-power-num').textContent = '0';
  $('pb-power-fill').style.width = '0%';
  $('pb-orb').setAttribute('aria-label', 'UPchieve power-up. Click to charge up.');
  cv.setAttribute('aria-label', 'A school district map. Click the map to add a school.');
  seedHoard(CROWD);
  onSchoolsChanged();
}

// Input
function pointerPos(e) {
  var r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function stampAt(x, y) {
  closePop();
  var s = addSchool(x, y, DEFAULT_TIER);
  onSchoolsChanged();
  openPop(s, 'new');
  say(s.name + ' added. Choose how many students it has.');
  return s;
}
cv.addEventListener('pointermove', function (e) {
  var p = pointerPos(e);
  S.ptr.x = p.x; S.ptr.y = p.y; S.ptr.inside = true; S.ptr.mouse = e.pointerType === 'mouse';
  var d = UI.drag;
  if (d) {
    if (!d.moved && Math.abs(p.x - d.sx) + Math.abs(p.y - d.sy) > 6) { d.moved = true; closePop(); }
    if (d.moved) placeSchool(d.s, p.x - d.ox, p.y - d.oy);
  }
  if (S.phase === 'unlimited' && S.ptr.mouse && Math.random() < 0.4) {
    S.parts.push({ x: p.x, y: p.y, vx: rand(-20, 20), vy: rand(-30, 0), life: 0.5, c: pick(POP), s: 3 * S.k, shape: 'dot', rot: 0, vr: 0, grav: 60 });
  }
});
cv.addEventListener('pointerleave', function () { S.ptr.inside = false; });
cv.addEventListener('pointerdown', function (e) {
  audio();
  var p = pointerPos(e);
  S.ptr.x = p.x; S.ptr.y = p.y; S.ptr.mouse = e.pointerType === 'mouse';
  var s = schoolAt(p.x, p.y);
  if (S.phase === 'unlimited') {
    if (s) blast(s, p.x, p.y);
    else burst(p.x, p.y, 6, ['#FFFFFF', '#FFC94D'], 100 * S.k, 'star');
    return;
  }
  if (S.phase === 'crisis') {
    if (s || heroAt(p.x, p.y)) noPower(p.x, p.y);
    return;
  }
  if (S.phase !== 'build') return;
  cancelCountdown();
  S.idleBuild = 0;
  if (s) {
    UI.drag = { s: s, ox: p.x - s.x, oy: p.y - s.y, sx: p.x, sy: p.y, moved: false };
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
    return;
  }
  if (UI.canStamp()) stampAt(p.x, p.y + 24 * S.k);
});
cv.addEventListener('pointerup', function () {
  var d = UI.drag;
  if (!d) return;
  UI.drag = null;
  if (d.moved) {
    d.s.squash = 0.7;
    sfx.stamp();
    burst(d.s.x, d.s.y, 10, ['#EEEAE0', '#FFFFFF'], 110 * S.k, 'dot');
    UI.hoverBlock = d.s;
  } else if (UI.pop && UI.pop.s === d.s) {
    UI.pop.how = 'click';
    UI.pop.t = 0;
    cancelCountdown();
  } else {
    closePop();
    openPop(d.s, 'click');
  }
});
cv.addEventListener('pointercancel', function () { UI.drag = null; });
cv.addEventListener('keydown', function (e) {
  if (e.key !== ' ' && e.key !== 'Enter') return;
  e.preventDefault();
  audio();
  if (S.phase === 'unlimited' && S.schools.length) {
    var s = pick(S.schools);
    blast(s, s.x, s.y - dims(s).h * s.sc / 2);
  } else if (UI.canStamp()) {
    var p = freeSpot();
    stampAt(p.x, p.y);
    focusQuiet($('pb-chips').querySelector('.is-on') || $('pb-chips').firstElementChild);
  }
});
function updateCursor() {
  var c = 'default';
  if (S.ptr.mouse && S.ptr.inside) {
    if (UI.drag && UI.drag.moved) c = 'grabbing';
    else if (S.phase === 'unlimited') c = 'none';
    else if (S.phase === 'build') c = schoolAt(S.ptr.x, S.ptr.y) ? 'grab' : UI.canStamp() ? 'none' : 'default';
    else if (S.phase === 'crisis') c = schoolAt(S.ptr.x, S.ptr.y) ? 'not-allowed' : 'default';
  }
  if (cv.style.cursor !== c) cv.style.cursor = c;
}

function step(dt) {
  S.t += dt;
  if (S.phase === 'build') { hoverStep(dt); countdownStep(dt); }
  else if (S.phase === 'crisis') crisisStep(dt);
  else if (S.phase === 'charge') chargeStep(dt);
  else if (S.phase === 'unlimited') unlimitedStep(dt);
  popStep(dt);
  statusStep();
  S.assignT = (S.assignT || 0) - dt;
  if (S.assignT <= 0) { assignKids(); S.assignT = 0.15; }
  updateKids(dt);
  updateSchools(dt);
  updateDreams(dt);
  updateFx(dt);
  updateCursor();
  S.uiT = (S.uiT || 0) - dt;
  if (S.uiT <= 0) { paintHud(); S.uiT = 0.06; }
}

function resize() {
  var r = $('pb-screen').getBoundingClientRect();
  var w = Math.max(240, r.width), h = Math.max(240, r.height);
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * DPR);
  cv.height = Math.round(h * DPR);
  setGeometry(w, h);
  var pw = $('pb-power');
  pw.style.left = Math.max(8, S.hero.x - 34 * S.k) + 'px';
  pw.style.top = (S.hero.y - 118 * S.k - pw.offsetHeight) + 'px';
  if (!$('pb-pu').hidden) placeOrb(orbSpot(S.phase === 'unlimited'));
  positionPop();
}
if (window.ResizeObserver) new ResizeObserver(resize).observe($('pb-screen'));
else window.addEventListener('resize', resize);
resize();
seedHoard(CROWD);
onSchoolsChanged();

var visible = true, last = 0;
if (window.IntersectionObserver) {
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe($('pb-screen'));
}
function frame(ts) {
  requestAnimationFrame(frame);
  if (!visible || document.hidden) { last = ts; return; }
  var dt = Math.min(0.05, (ts - (last || ts)) / 1000);
  last = ts;
  step(dt);
  render();
}
requestAnimationFrame(frame);
