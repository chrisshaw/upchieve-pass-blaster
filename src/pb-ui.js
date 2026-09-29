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
function verb() { return touchFirst ? 'Tap' : 'Click'; }
// Words that change with the mode. {v} becomes Click or Tap.
var TEXT = {
  party: {
    crisis: 'Oh no! Dreams are dropping!', crisisSub: 'Grades, test scores, graduation, college plans: all sliding.',
    crisisLabel: 'Your schools. Grades and dreams are dropping. UPdog is on the way with a power-up.',
    crisisSay: 'Dreams are dropping. UPdog is on the way with a power-up.',
    deliverSub: '{v} UPdog’s power-up to save the day.',
    noPower: 'No power!', noPowerMain: 'No power yet!',
    charge: 'Charging…', chargeSub: 'Unlimited tutoring, loading up.',
    unlimited: 'Unlimited power!', unlimitedFlash: 'UNLIMITED POWER!',
    out: '4:30 PM: Teachers clock out.', outSub: 'UPchieve doesn’t.',
    night: '8:00 PM: Study party!', lateSub: 'Late-night essay help, no extra charge.',
    backSub: 'Power left: ' + INF, nudge: 'Keep clicking!', nudgeSub: 'It’s unlimited. We checked.',
    unlimitedSub: '{v} your schools. As much as you want. It never runs out.', unlimitedFlashSub: '{v} your schools. As much as you want.',
    build0: 'Kids with nowhere to go!', build0Sub: '{v} anywhere on the map to add your district’s schools.',
    buildMany: 'That’s a lot of buildings!', buildManySub: 'Hit <em>Done</em> when you’re ready.',
    build: 'Add all your schools!', buildSub: '{h} a school to change its size. Hit <em>Done</em> when that’s everyone.',
    deliver: 'Power up with UPchieve!', orb: 'Power up!', tipName: 'UPchieve power-up',
    done: 'Done', popQ: 'How many students at', copy: '+5 more like this',
    power: 'Power', tab: 'the price calculator, but fun'
  },
  cozy: {
    crisis: 'Uh oh. It’s getting gloomy.', crisisSub: 'Kids are stuck on homework with no one to ask, and grades are slipping.',
    crisisLabel: 'Your schools on a rainy day. Kids are stuck on homework. UPdog is on the way with a power-up.',
    crisisSay: 'Kids are stuck on homework. UPdog is on the way with a power-up.',
    deliverSub: '{v} UPdog’s star to bring in the tutors.',
    noPower: 'Not yet!', noPowerMain: 'Not yet!',
    charge: 'Take a deep breath…', chargeSub: 'Unlimited tutoring is on its way.',
    unlimited: 'Unlimited tutoring.', unlimitedFlash: 'Unlimited tutoring.',
    unlimitedSub: 'Visit your schools whenever you like. The tutors never run out.', unlimitedFlashSub: 'Every school has a tutor looking after it now, day and night.',
    out: '4:30 PM: Teachers head home.', outSub: 'The tutors stay on.',
    night: '8:00 PM: Study night.', lateSub: 'Late-night essay help. Take your time.',
    backSub: 'Tutoring left: ' + INF, nudge: 'No rush.', nudgeSub: 'The tutors are here whenever you need them.',
    build0: 'Every kid needs a place to learn.', build0Sub: '{v} anywhere in the meadow to add your district’s schools.',
    buildMany: 'That’s a lot of schoolhouses!', buildManySub: '{v} <em>All done</em> whenever you’re ready.',
    build: 'Add all your schools.', buildSub: '{h} a schoolhouse to change its size. {v} <em>All done</em> when that’s everyone.',
    settle: 'Looks like everyone’s here.', settleSub: 'Take your time. Add more, or we’ll carry on shortly.',
    deliver: 'UPdog is here!', orb: 'For you!', tipName: 'UPchieve tutoring',
    done: 'All done', popQ: 'How many kids learn at', copy: '+5 more just like it',
    power: 'Tutoring', tab: 'the price calculator, but cozy'
  }
};
function tx(key) { return TEXT[MODE][key].replace('{v}', verb()).replace('{h}', touchFirst ? 'Tap' : 'Hover over'); }
function doneFace() { return '<b>✓</b><small>' + tx('done') + '</small>'; }
// Puts the current mode's words on the parts of the page that aren't redrawn every frame.
function applyModeText() {
  $('pb-tab-sub').textContent = tx('tab');
  $('pb-power-label').textContent = tx('power');
  $('pb-done-face').innerHTML = doneFace();
  $('pb-orb-cta').textContent = tx('orb');
  $('pb-tip-name').textContent = tx('tipName');
  $('pb-pop-q').textContent = tx('popQ');
  $('pb-pop-copy').textContent = tx('copy');
}
function say(text) { $('pb-live').textContent = text; }
// Cozy mode lets cards drift away instead of vanishing: they fade and float up a little, then hide.
function softHide(el) {
  if (el.hidden || el.classList.contains('is-leaving')) return;
  if (MODE !== 'cozy' || reduced) { el.hidden = true; return; }
  el.classList.add('is-leaving');
  clearTimeout(el.pbLeave);
  el.pbLeave = setTimeout(function () { el.classList.remove('is-leaving'); el.hidden = true; }, 420);
}
function softShow(el) {
  clearTimeout(el.pbLeave);
  el.classList.remove('is-leaving');
  el.hidden = false;
}
function focusQuiet(el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
function once(key, fn) { if (!S.seen[key]) { S.seen[key] = 1; fn(); } }
function screenRect(el) {
  var r = el.getBoundingClientRect(), s = $('pb-screen').getBoundingClientRect();
  return { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height };
}

// The status line is the only place text appears: the current instruction,
// briefly replaced by a status moment that then hands back to the instruction.
var statusLine = { main: '', sub: '', alarm: false, shown: '' };
function paintStatus(main, sub, alarm) {
  var key = main + '|' + (sub || '') + '|' + !!alarm;
  if (key === statusLine.shown) return;
  var el = $('pb-status'), fresh = statusLine.shown.split('|')[0] !== main;
  statusLine.shown = key;
  $('pb-status-main').innerHTML = main;
  $('pb-status-sub').innerHTML = sub || '';
  el.classList.toggle('is-alarm', !!alarm);
  if (fresh) { el.classList.remove('is-new'); void el.offsetWidth; el.classList.add('is-new'); }
}
function setStatus(main, sub, alarm) {
  statusLine.main = main; statusLine.sub = sub; statusLine.alarm = !!alarm;
  if (!UI.flashUntil) paintStatus(main, sub, alarm);
}
function flashStatus(main, sub, ms, alarm) {
  UI.flashUntil = S.t + (ms || 3800) / 1000;
  paintStatus(main, sub, alarm);
  say(main + ' ' + (sub || '').replace(/<[^>]+>/g, ''));
}
function statusStep() {
  if (UI.flashUntil && S.t >= UI.flashUntil) { UI.flashUntil = 0; paintStatus(statusLine.main, statusLine.sub, statusLine.alarm); }
}
function buildStatus() {
  if (S.phase !== 'build' || UI.cd != null) return;
  if (!S.schools.length) setStatus(tx('build0'), tx('build0Sub'));
  else if (S.schools.length >= MAX_SCHOOLS) setStatus(tx('buildMany'), tx('buildManySub'));
  else setStatus(tx('build'), tx('buildSub'));
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
  var cozy = MODE === 'cozy';
  UI.pop = { s: s, how: how, t: 0, dur: how === 'hover' ? (cozy ? 7 : 5) : (cozy ? 6 : 4), after: null, out: 0 };
  $('pb-pop-name').textContent = s.name;
  paintChips(s);
  softShow($('pb-pop'));
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
  softHide($('pb-pop'));
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
    if (next >= 1000000) once('fed', function () { flashStatus('Hi, federal government \ud83d\udc4b', 'Still one building. Still $25,000.', 4200); });
  } else {
    setSize(s, SIZES[i].size);
  }
  s.squash = MODE === 'cozy' ? 0.2 : 0.6;
  sfx.chip(i);
  paintChips(s);
  updatePrices();
  positionPop();
  UI.pop.how = 'click';
  UI.pop.after = MODE === 'cozy' ? 1.8 : 1.4;
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
    if (P.out > (MODE === 'cozy' ? 0.8 : 0.35)) { closePop(); return; }
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
    }, i * (MODE === 'cozy' ? 280 : 150));
  }
  S.idleBuild = -0.8;
});

// The Done button doubles as the countdown. Cozy mode skips the countdown: after a longer pause it
// says it'll carry on, waits a few more quiet seconds, and moves along.
var COZY_WAIT = 3.2, COZY_SETTLE = 2.8;
function paintRing(frac) { $('pb-done-ring').style.strokeDashoffset = String(289 * (1 - frac)); }
function startCountdown() {
  UI.cdShown = 0;
  if (MODE === 'cozy') {
    UI.cd = COZY_SETTLE;
    $('pb-done').classList.add('is-settling');
    setStatus(tx('settle'), tx('settleSub'));
    return;
  }
  UI.cd = COUNTDOWN;
  $('pb-done').classList.add('is-counting');
}
function cancelCountdown() {
  if (UI.cd == null) return;
  UI.cd = null;
  $('pb-done').classList.remove('is-counting', 'is-settling');
  $('pb-done-face').innerHTML = doneFace();
  paintRing(0);
  buildStatus();
}
function countdownStep(dt) {
  if (UI.cd == null) {
    var calm = S.schools.length && (!UI.pop || UI.pop.how === 'hover') && !UI.drag && $('pb-invoice').hidden;
    if (calm && S.schools.every(function (s) { return s.landed; })) {
      S.idleBuild = (S.idleBuild || 0) + dt;
      if (S.idleBuild >= (MODE === 'cozy' ? COZY_WAIT : 2)) startCountdown();
    }
    return;
  }
  UI.cd -= dt;
  if (MODE === 'cozy') { if (UI.cd <= 0) goCrisis(); return; }
  paintRing(Math.max(0, UI.cd / COUNTDOWN));
  var n = Math.ceil(UI.cd);
  if (n !== UI.cdShown && n > 0) {
    UI.cdShown = n;
    $('pb-done-face').innerHTML = '<b>' + n + '</b><small>Go!</small>';
    setStatus('Got every school?', 'Moving on in <b>' + n + '</b>\u2026 ' + verb() + ' the map to add more.');
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
  softHide($('pb-done'));
  sendEveryoneInside();
  root.classList.add('is-crisis');
  $('pb-dreams').hidden = false;
  S.dreams = 0.78;
  setStatus(tx('crisis'), tx('crisisSub'), true);
  sfx.alarm();
  UI.rocketAt = S.t + (MODE === 'cozy' ? 1.9 : 1.6);
  UI.sadT = MODE === 'cozy' ? 0.7 : 0.4;
  UI.wiggleT = 4;
  cv.setAttribute('aria-label', tx('crisisLabel'));
  say(tx('crisisSay'));
}

// UPdog's rocket swoops in, drops off the power-up next to the admin, and flies away.
function bez(a, b, c, t) { var u = 1 - t; return u * u * a + 2 * u * t * b + t * t * c; }
function launchRocket() {
  if (MODE === 'cozy') { launchBalloon(); return; }
  var p0 = { x: S.W + 160, y: S.H * 0.2 };
  S.rocket = { t: 0, leg: 0, p0: p0, p1: { x: S.W * 0.55, y: -S.H * 0.2 }, p2: { x: S.dog.x, y: S.dog.y - 80 * S.k }, x: p0.x, y: p0.y, ang: Math.PI };
  sfx.rocket();
}
function rocketStep(dt) {
  var r = S.rocket;
  if (!r) return;
  if (MODE === 'cozy') { balloonStep(dt); return; }
  r.t += dt;
  var px = r.x, py = r.y;
  if (r.leg === 0) {
    var u = Math.min(1, r.t / 1.5), e = 1 - Math.pow(1 - u, 2.2);
    r.x = bez(r.p0.x, r.p1.x, r.p2.x, e);
    r.y = bez(r.p0.y, r.p1.y, r.p2.y, e);
    if (u >= 1) { r.leg = 1; r.t = 0; deliver(); }
  } else if (r.leg === 1) {
    r.y = r.p2.y + Math.sin(r.t * 22) * 2;
    if (r.t > 0.35) { r.leg = 2; r.t = 0; r.from = { x: r.x, y: r.y }; }
  } else {
    var v = Math.min(1, r.t / 1.1), e2 = v * v;
    r.x = r.from.x + (S.W + 280 - r.from.x) * e2;
    r.y = r.from.y + (-240 - r.from.y) * e2 - Math.sin(v * Math.PI) * 50 * S.k;
    if (v >= 1) { S.rocket = null; return; }
  }
  var dx = r.x - px, dy = r.y - py;
  if (r.leg !== 1 && Math.abs(dx) + Math.abs(dy) > 0.5) r.ang = Math.atan2(dy, dx);
  var tail = 82 * S.k, tx = r.x - Math.cos(r.ang) * tail, ty = r.y - Math.sin(r.ang) * tail;
  for (var i = 0; i < 3; i++) {
    S.parts.push({ x: tx + rand(-6, 6), y: ty + rand(-6, 6), vx: -Math.cos(r.ang) * 90 + rand(-30, 30), vy: -Math.sin(r.ang) * 90 + rand(-30, 30), life: rand(0.3, 0.6), c: pick(['#FFC94D', '#FF9F6E', '#FFFFFF', '#FFE08A']), s: rand(4, 8) * S.k, shape: 'dot', rot: 0, vr: 0, grav: -20 });
  }
}
function placePu(badge) {
  var pu = $('pb-pu');
  pu.style.left = S.dog.x + 'px';
  pu.style.top = S.dog.y + 'px';
  pu.style.setProperty('--pb-orb-w', (badge ? S.dog.w * 0.6 : S.dog.w * 1.25) + 'px');
}
function deliver() {
  sfx.poof();
  burst(S.dog.x, S.dog.y - 60 * S.k, 24, ['#FFFFFF', '#FFF0C3', '#FFC94D'], 220 * S.k, 'dot');
  updatePrices();
  var pu = $('pb-pu');
  placePu(false);
  pu.className = 'pb-pu is-arrive';
  pu.hidden = false;
  UI.wiggleT = 3;
  setStatus(tx('deliver'), tx('deliverSub'));
  say('UPdog brought a power-up: unlimited tutoring for ' + money(totalPrice()) + ' a year.');
}
function noPower(x, y) {
  floatText(x, y - 10, tx('noPower'), 'sad', 16);
  sfx.buzz();
  var pw = $('pb-power');
  pw.classList.remove('is-shake');
  void pw.offsetWidth;
  if (MODE !== 'cozy') pw.classList.add('is-shake');
  var ready = !$('pb-pu').hidden;
  flashStatus(tx('noPowerMain'), ready ? verb() + ' UPdog’s power-up first.' : 'Hang on, help is on the way…', 1800, true);
}
function crisisStep(dt) {
  UI.sadT -= dt;
  if (UI.sadT <= 0) { sadEvent(); UI.sadT = MODE === 'cozy' ? rand(1.1, 1.7) : rand(0.5, 0.8); }
  if (UI.rocketAt && S.t >= UI.rocketAt) { UI.rocketAt = 0; launchRocket(); }
  var pu = $('pb-pu');
  if (!pu.hidden && MODE !== 'cozy') {
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
  if (S.phase !== 'crisis' || $('pb-pu').hidden) return;
  S.phase = 'charge';
  S.chargeT = 0;
  root.classList.remove('is-crisis');
  softHide($('pb-pu'));
  S.dog.on = true;
  setStatus(tx('charge'), tx('chargeSub'));
  sfx.charge();
  if (MODE === 'cozy') { startCharm(); say('Taking a deep breath.'); return; }
  S.toss = { t: 0, x0: S.dog.x - S.dog.w * 0.1, y0: S.dog.y - S.dog.w * 0.4, x1: S.hero.x, y1: S.hero.y - 50 * S.hero.hs };
  var pw = $('pb-power'), r = screenRect(pw);
  pw.style.setProperty('--pb-dx', (S.W / 2 - (r.x + r.w * 2.2 / 2)) + 'px');
  pw.style.setProperty('--pb-dy', (S.H / 2 - (r.y + r.h / 2)) + 'px');
  pw.classList.add('is-charging');
  say('Charging the power-up.');
}
// Cozy mode's charge is a calm moment: the admin floats up with eyes closed while UPdog's star, now a
// wisp, winds around the Tutoring bar and fills it (see charmStep). Then the light spreads.
function calmStep(dt) {
  S.chargeT += dt;
  if (Math.random() < dt * 3) {
    S.parts.push({ x: S.hero.x + rand(-30, 30) * S.k, y: S.hero.y - rand(20, 90) * S.k, vx: rand(-6, 6), vy: rand(-26, -14) * S.k, life: rand(1.2, 1.8), c: pick(['#FFE7A3', '#FFFFFF']), s: rand(2, 3.4) * S.k, shape: 'dot', rot: 0, vr: 0, grav: 0 });
  }
}
function chargeStep(dt) {
  if (MODE === 'cozy') { calmStep(dt); return; }
  S.chargeT += dt;
  if (S.toss) {
    S.toss.t = Math.min(1, S.chargeT / 0.45);
    if (S.toss.t >= 1) {
      S.toss = null;
      S.hero.pulse = 1;
      burst(S.hero.x, S.hero.y - 50 * S.hero.hs, 24, ['#FFC94D', '#FFFFFF'], 180 * S.k, 'star');
    }
  }
  var t = S.chargeT - 0.45;
  if (t <= 0) return;
  var f = Math.min(1, t / 1.6);
  S.power = t < 1.6 ? f * 100 : 100 + Math.pow(Math.min(1, (t - 1.6) / 0.5), 2) * 899;
  chargeFx(0.5 + f * 2.5);
  S.shake = Math.max(S.shake, 0.03 + 0.1 * f);
  if (t >= 2.1) boom();
}
function boom() {
  S.flash = 0.55;
  if (!reduced) { S.shake = 0.5; S.punch = 1; }
  S.wave = { r: 0, v: Math.max(S.W, S.H) * 1.6, life: 0.7, max: 0.7 };
  sfx.boom();
  for (var i = 0; i < 6; i++) burst(rand(0, S.W), rand(0, S.H * 0.5), 16, POP, 240 * S.k, 'conf');
  firework(); firework(); firework();
  S.schools.forEach(function (s) { s.squash = 1; burst(s.x, schoolTop(s), 14, POP, 220 * S.k, 'star'); cheer(s); cheer(s); });
  S.hero.jumpT = 0;
  S.dog.jumpT = -0.12;
  S.dog.glasses = 0.001;
  $('pb-power').classList.remove('is-charging');
  startUnlimited();
}
// Cozy mode's power-up lands softly: a ring of warm light spreads from the admin, the rain fades,
// and each school it reaches lights up and gets its caretaker spirit.
function bloom() {
  S.bloom = { r: 0 };
  S.duo = { got: S.t + 2.2, clink: S.t + 3.2 };
  sfx.boom();
  rainOff();
  S.dog.glasses = 0.001;
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
  placePu(true);
  softShow(pu);
  $('pb-orb').setAttribute('aria-label', 'UPchieve power-up, active. See the price.');
  if (MODE === 'cozy') seedFlies(36);
  setStatus(tx('unlimited'), tx('unlimitedSub'));
  flashStatus(tx('unlimitedFlash'), tx('unlimitedFlashSub'), MODE === 'cozy' ? 4400 : 3600);
  $('pb-clock').hidden = false;
  $('pb-again').hidden = false;
  music.on = true;
  music.next = 0;
  music.step = 0;
  music.t0 = 0;
  cv.setAttribute('aria-label', 'Unlimited mode. Press space on the map to send tutors to a school.');
}
function onDreamLoop() {
  var m = $('pb-dreams-mult');
  m.textContent = '×' + num(S.mult);
  if (MODE === 'cozy') { if (S.phase === 'unlimited') sfx.chime(); return; }
  m.classList.remove('is-bump');
  void m.offsetWidth;
  m.classList.add('is-bump');
  if (S.phase === 'unlimited') {
    sfx.chime();
    var r = screenRect($('pb-dreams'));
    burst(r.x + r.w / 2, r.y + 20, 16, POP, 180 * S.k, 'conf');
  }
}
var beatTimer = null;
function onBeat(b) {
  var party = isParty();
  if (MODE === 'cozy') { cozyBeat(b); return; }
  S.schools.forEach(function (s) { s.squash = Math.max(s.squash, party ? 0.24 : 0.12); });
  root.classList.add('is-beat');
  clearTimeout(beatTimer);
  beatTimer = setTimeout(function () { root.classList.remove('is-beat'); }, 120);
  if (b % (party ? 2 : 4) === 0) firework();
  if (!S.schools.length) return;
  if (party && b % 2 === 0) {
    var s = pick(S.schools);
    floatText(s.x + rand(-40, 40) * s.sc, schoolTop(s), pick(['♪', '♫']), pick(SHIRT), 26);
  }
  if (b % 4 === 0) {
    var c2 = pick(S.schools);
    burst(c2.x, schoolTop(c2) - 20 * c2.sc, 16, POP, 220 * S.k, 'conf');
  }
}
// Cozy mode doesn't bounce to the music. Now and then a school's bell sways, and that's all.
function cozyBeat(b) {
  if (b % 16 === 8 && S.schools.length) pick(S.schools).ring = 0.6;
}
function crossed(prev, cur, minute) {
  var a = prev % 1440, b = cur % 1440;
  return b >= a ? a < minute && b >= minute : a < minute || b >= minute;
}
function unlimitedStep(dt) {
  var prev = S.clock, m = S.clock % 1440, cozy = MODE === 'cozy', school = m >= 7.5 * 60 && m < 16 * 60;
  // Cozy days pass a little under half as fast.
  S.clock += (cozy ? (school ? 32 : 17) : (school ? 60 : 30)) * dt;
  S.rainbow = Math.min(1, S.rainbow + dt / (cozy ? 2.5 : 1.2));
  if (S.dog.glasses > 0) S.dog.glasses = Math.min(1, S.dog.glasses + dt / (cozy ? 2 : 0.9));
  if (crossed(prev, S.clock, 16 * 60 + 30)) once('out', function () { flashStatus(tx('out'), tx('outSub')); });
  if (crossed(prev, S.clock, 20 * 60)) once('party', function () { flashStatus(tx('night'), 'Tutors are still online. Of course.'); });
  if (crossed(prev, S.clock, 2 * 60)) once('2am', function () { flashStatus('2:00 AM. Still unlimited.', tx('lateSub')); });
  if (crossed(prev, S.clock, 7 * 60 + 30)) once('back', function () { flashStatus('7:30 AM: Teachers are back.', tx('backSub')); });
  if (Math.floor(prev / 1440) % 7 !== 5 && Math.floor(S.clock / 1440) % 7 === 5) once('sat', function () { flashStatus('Saturday!', 'Still unlimited. No weekend surcharge.'); });
  updateTeachers(dt);
  S.idle += dt;
  if (S.idle > (cozy ? 15 : 8) && S.nudges < (cozy ? 2 : 3) && !UI.flashUntil) {
    S.nudges++;
    S.idle = 0;
    flashStatus(tx('nudge'), tx('nudgeSub'), cozy ? 4200 : 2800);
  }
  var b = Math.floor(beatPos());
  if (b !== S.beat && b >= 0) { S.beat = b; onBeat(b); }
  musicTick(isParty());
}
function jumpStep(o, dt) {
  if (o.jumpT == null) return;
  o.jumpT += dt;
  o.jump = o.jumpT > 0 && o.jumpT < 0.55 ? Math.sin(o.jumpT / 0.55 * Math.PI) * 60 * S.k : 0;
  if (o.jumpT > 0.6) o.jumpT = null;
}

var lastClock = '';
function paintHud() {
  var jitter = S.phase === 'crisis' && MODE !== 'cozy' ? Math.sin(S.t * 18) * 0.03 : 0;
  $('pb-dreams-fill').style.height = clamp(S.dreams + jitter, 0.02, 1) * 100 + '%';
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
  softShow($('pb-invoice'));
  focusQuiet($('pb-inv-close'));
}
function closeInvoice() {
  softHide($('pb-invoice'));
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
$('pb-orb-img').src = ART.star;
$('pb-orb').addEventListener('click', function () { if (S.phase === 'crisis') give(); });
$('pb-done').addEventListener('click', goCrisis);
$('pb-again').addEventListener('click', resetGame);
$('pb-mute').addEventListener('click', function () {
  muted = !muted;
  if (muted) rainOff(true);
  else if (MODE === 'cozy' && (S.phase === 'crisis' || S.phase === 'charge')) rainOn();
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
  var from = MODE;
  rainOff(true);
  closePop();
  cancelCountdown();
  $('pb-invoice').hidden = true;
  S.schools = []; S.kids = []; S.teachers = []; S.parts = []; S.floats = [];
  S.dreams = 0.78; S.mult = 1; S.power = 0; S.clock = 10 * 60; S.wave = null;
  S.sessions = 0; S.combo = 0; S.nudges = 0; S.seen = {}; S.idle = 0; S.idleBuild = 0;
  S.phase = 'build';
  S.rocket = null; S.toss = null; S.rainbow = 0; S.punch = 0; S.bloom = null; S.duo = null; S.charm = null;
  S.dog.on = false; S.dog.glasses = 0; S.dog.jumpT = null; S.hero.jumpT = null;
  UI.rocketAt = 0;
  UI.flashUntil = 0;
  root.classList.remove('is-beat');
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
  enterChooser(from);
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
  if (S.phase === 'unlimited' && S.ptr.mouse && MODE !== 'cozy' && Math.random() < 0.4) {
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
  if (S.phase === 'choose') chooseStep(dt);
  else if (S.phase === 'intro') introStep(dt);
  else if (S.phase === 'build') { hoverStep(dt); countdownStep(dt); }
  else if (S.phase === 'crisis') crisisStep(dt);
  else if (S.phase === 'charge') chargeStep(dt);
  else if (S.phase === 'unlimited') unlimitedStep(dt);
  popStep(dt);
  statusStep();
  rocketStep(dt);
  jumpStep(S.hero, dt);
  jumpStep(S.dog, dt);
  if (S.punch > 0) S.punch = Math.max(0, S.punch - dt * 2.5);
  S.assignT = (S.assignT || 0) - dt;
  if (S.assignT <= 0) { assignKids(); S.assignT = 0.15; }
  updateKids(dt);
  updateSchools(dt);
  updateDreams(dt);
  updateFx(dt);
  if (MODE === 'cozy' || S.phase === 'choose') cozyStep(dt);
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
  $('pb-over').width = cv.width;
  $('pb-over').height = cv.height;
  overDirty = true;
  setGeometry(w, h);
  placePu(S.phase === 'unlimited');
  positionPop();
  if (S.phase === 'choose') paintChooser();
}
if (window.ResizeObserver) new ResizeObserver(resize).observe($('pb-screen'));
else window.addEventListener('resize', resize);
resize();
enterChooser();

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
