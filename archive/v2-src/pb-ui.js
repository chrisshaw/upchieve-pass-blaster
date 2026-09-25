var DPR = 1;
var MAX_SCHOOLS = 60;
var COUNTDOWN = 3;
var touchFirst = window.matchMedia && window.matchMedia('(hover: none)').matches;
var UI = {
  pop: null, drag: null, cd: null, cdShown: 0,
  hoverS: null, hoverT: 0, hoverBlock: null, inPop: false,
  canStamp: function () {
    return (S.phase === 'build' || S.phase === 'crisis') && S.schools.length < MAX_SCHOOLS && $('pb-invoice').hidden;
  }
};
var INF = '<span class="pb-inf">∞</span>';
function verb() { return touchFirst ? 'Tap' : 'Click'; }
function say(text) { $('pb-live').textContent = text; }
function focusQuiet(el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
function once(key, fn) { if (!S.seen[key]) { S.seen[key] = 1; fn(); } }

var missionHtml = '';
function mission(html, alarm) {
  if (html === missionHtml) return;
  missionHtml = html;
  var m = $('pb-mission');
  m.innerHTML = html;
  m.classList.toggle('is-alarm', !!alarm);
  m.classList.remove('is-new');
  void m.offsetWidth;
  m.classList.add('is-new');
}
function buildMission() {
  if (S.phase !== 'build') return;
  if (!S.schools.length) mission('<em>Kids with nowhere to go!</em><br>' + verb() + ' anywhere to add your district’s schools.');
  else if (S.schools.length >= MAX_SCHOOLS) mission('That’s ' + MAX_SCHOOLS + ' buildings! Hit <em>I’m done</em> when you’re ready.');
  else mission('<em>Add every school</em> in your district. ' + (touchFirst ? 'Tap' : 'Hover over') + ' a school to change its size.');
}

var annTimer = null;
function announce(big, sub, ms, alarm) {
  var a = $('pb-announce');
  ms = ms || 2800;
  a.innerHTML = '<span class="pb-announce-big">' + big + '</span>' + (sub ? '<span class="pb-announce-sub">' + sub + '</span>' : '');
  a.style.setProperty('--pb-dur', ms + 'ms');
  a.classList.remove('is-on', 'is-alarm');
  void a.offsetWidth;
  a.classList.add('is-on');
  if (alarm) a.classList.add('is-alarm');
  clearTimeout(annTimer);
  annTimer = setTimeout(function () { a.classList.remove('is-on'); }, ms);
  S.annUntil = S.t + ms / 1000;
}

function totalPrice() {
  var p = 0;
  S.schools.forEach(function (s) { p += priceFor(s.size); });
  return p;
}
function updatePrices() {
  var p = money(totalPrice()), n = S.schools.length;
  $('pb-pu-price').textContent = p;
  $('pb-q-price').textContent = p;
  $('pb-inv-total').textContent = p;
  $('pb-q-bldg').textContent = n + (n === 1 ? ' building' : ' buildings');
}
function onSchoolsChanged() {
  updatePrices();
  $('pb-done').hidden = !(S.phase === 'build' && S.schools.length);
  buildMission();
}

// Size picker, anchored next to the school it edits.
(function buildChips() {
  var box = $('pb-pop-opts');
  SIZES.forEach(function (sz, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pb-size';
    b.addEventListener('click', function () { chooseSize(i); });
    box.appendChild(b);
  });
})();
function paintChips(s) {
  var t = tierOf(s.size);
  $('pb-pop-opts').querySelectorAll('.pb-size').forEach(function (b, i) {
    var extra = i === 4 && s.size > SIZES[4].size ? ' <small>(' + num(s.size) + ')</small>' : ' <small>kids</small>';
    b.innerHTML = SIZES[i].label + extra;
    b.classList.toggle('is-on', i === t);
    b.setAttribute('aria-pressed', String(i === t));
  });
  $('pb-pop-hint').hidden = t !== 4;
}
function openPop(s, how) {
  UI.pop = { s: s, how: how, t: 0, dur: how === 'hover' ? 6 : 4, after: null, out: 0 };
  $('pb-pop-name').textContent = s.name;
  paintChips(s);
  $('pb-pop').hidden = false;
  positionPop();
  if (how !== 'hover') cancelCountdown();
}
function positionPop() {
  if (!UI.pop) return;
  var el = $('pb-pop');
  if (S.W < 600) { el.style.left = ''; el.style.top = ''; return; }
  var r = srect(UI.pop.s), pw = el.offsetWidth || 250, ph = el.offsetHeight || 320;
  var x = r.x + r.w + 16;
  if (x + pw > S.W - 8) x = r.x - pw - 16;
  if (x < 8) x = clamp(r.x + r.w / 2 - pw / 2, 8, S.W - pw - 8);
  el.style.left = x + 'px';
  el.style.top = clamp(r.y + r.h / 2 - ph / 2, 64, S.H - ph - 8) + 'px';
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
    floatText(s.x, schoolTop(s), '+CAPACITY!', 'cap', 22);
    if (next >= 1000000) once('fed', function () { announce('Hi, <em>federal government</em> 👋', 'Still one building. Still $25,000.', 3600); });
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
  $('pb-pop-timer').style.width = ((P.after != null ? P.after / 1.4 : 1 - P.t / P.dur) * 100) + '%';
}
function hoverStep(dt) {
  if (S.phase !== 'build' || !S.ptr.mouse || !S.ptr.inside || UI.drag) { UI.hoverS = null; return; }
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
  var s = UI.pop.s, tier = tierOf(s.size);
  closePop();
  for (var i = 0; i < 5 && S.schools.length < MAX_SCHOOLS; i++) {
    (function (d) {
      setTimeout(function () {
        if (S.schools.length >= MAX_SCHOOLS || S.phase === 'unlimited') return;
        var p = freeSpot(), n = addSchool(p.x, p.y, Math.min(tier, 4));
        n.size = s.size;
        placeSchool(n, n.x, n.y);
        recalcNeeds();
        onSchoolsChanged();
      }, d);
    })(i * 150);
  }
  S.idleBuild = -0.8;
});

// Countdown to level 2
function startCountdown() {
  UI.cd = COUNTDOWN;
  UI.cdShown = 0;
  $('pb-countdown').hidden = false;
}
function cancelCountdown() {
  if (UI.cd == null) return;
  UI.cd = null;
  $('pb-countdown').hidden = true;
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
  var n = Math.ceil(UI.cd);
  if (n !== UI.cdShown && n > 0) {
    UI.cdShown = n;
    var el = $('pb-cd-num');
    el.textContent = n;
    el.classList.remove('is-tick');
    void el.offsetWidth;
    el.classList.add('is-tick');
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
  announce('Level 2: Dreams are <em>dropping</em>', 'Grades, scores, and college plans are sliding', 2800, true);
  mission('<em>Oh no, dreams are dropping!</em><br>Grab the power-up.', true);
  sfx.alarm();
  UI.puAt = S.t + 1.3;
  UI.sadT = 0.5;
  UI.wiggleT = 5;
  say('Level 2. Dreams are dropping. A power-up is available.');
}
function crisisStep(dt) {
  UI.sadT -= dt;
  if (UI.sadT <= 0) { sadEvent(); UI.sadT = rand(0.35, 0.6); }
  var pu = $('pb-powerup');
  if (UI.puAt && S.t >= UI.puAt) {
    UI.puAt = 0;
    updatePrices();
    pu.hidden = false;
    if (UPDOG) { $('pb-dog-delivery').hidden = false; $('pb-dog-bubble').hidden = false; }
    sfx.swoosh();
    say('Power-up available: unlimited tutoring for ' + money(totalPrice()) + ' a year.');
  }
  if (!pu.hidden) {
    UI.wiggleT -= dt;
    if (UI.wiggleT <= 0) {
      UI.wiggleT = 4;
      pu.classList.remove('is-wiggle');
      void pu.offsetWidth;
      pu.classList.add('is-wiggle');
    }
  }
}
function unlock() {
  if (S.phase !== 'crisis') return;
  S.phase = 'powerup';
  $('pb-powerup').hidden = true;
  $('pb-dog-bubble').hidden = true;
  $('pb-dog-delivery').classList.add('is-jump');
  setTimeout(function () { $('pb-dog-delivery').hidden = true; }, 700);
  $('pb-gauge').hidden = false;
  S.powerAnim = 0;
  S.flash = 0.3;
  root.classList.remove('is-crisis');
  sfx.powerup();
  announce('Power-up <em>unlocked!</em>', null, 2000);
  mission('<em>Charging…</em>');
}
function powerStep(dt) {
  S.powerAnim += dt;
  var a = S.powerAnim;
  S.power = a < 1.3 ? a / 1.3 * 100 : 100 + Math.pow((a - 1.3) / 0.8, 2) * 899;
  if (a >= 2.1) startUnlimited();
}
function startUnlimited() {
  S.phase = 'unlimited';
  S.clock = 13 * 60;
  S.idle = 0;
  root.classList.add('is-unlimited');
  S.teachers = [];
  S.schools.forEach(addStaff);
  S.flash = 0.45;
  if (!reduced) S.shake = 0.35;
  S.schools.forEach(function (s) { burst(s.x, schoolTop(s), 18, POP, 220 * S.k, 'conf'); });
  addDreams(1.02 - S.dreams);
  sfx.chime();
  announce('<em>UNLIMITED</em> mode', verb() + ' your schools. It never runs out.', 3400);
  mission('<em>' + verb() + ' your schools!</em> As much as you want. Forever.');
  $('pb-clock').hidden = false;
  $('pb-quote').hidden = false;
  if (UPDOG) $('pb-dog-party').hidden = false;
  updatePrices();
  music.on = true;
  music.next = 0;
  cv.setAttribute('aria-label', 'District map in unlimited mode. Press space to send tutors to a school.');
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
    floatText(S.W / 2, S.H * 0.34, 'DREAMS ×' + num(S.mult) + '!', 'big', 28);
  }
}
function crossed(prev, cur, minute) {
  var a = prev % 1440, b = cur % 1440;
  return b >= a ? a < minute && b >= minute : a < minute || b >= minute;
}
function unlimitedStep(dt) {
  var prev = S.clock;
  S.clock += 36 * dt;
  if (crossed(prev, S.clock, 16 * 60 + 30)) once('out', function () { announce('<em>4:30 PM</em>', 'Teachers clock out. UPchieve doesn’t.', 3200); });
  if (crossed(prev, S.clock, 2 * 60)) once('2am', function () { announce('<em>2:00 AM</em>', 'Study party. Still unlimited.', 3200); });
  if (crossed(prev, S.clock, 7 * 60 + 30)) once('back', function () { announce('<em>7:30 AM</em>', 'Teachers are back. Power left: ' + INF, 3200); });
  if (Math.floor(prev / 1440) % 7 !== 5 && Math.floor(S.clock / 1440) % 7 === 5) once('sat', function () { announce('<em>Saturday</em>', 'Still unlimited. Obviously.', 3000); });
  updateTeachers(dt);
  S.idle += dt;
  if (S.idle > 8 && S.nudges < 3 && S.t > (S.annUntil || 0)) {
    S.nudges++;
    S.idle = 0;
    announce('Keep <em>going!</em>', 'It’s unlimited. We checked.', 2800);
  }
  if (isParty() && S.schools.length && Math.random() < dt * Math.min(5, S.schools.length * 1.5)) {
    var s = pick(S.schools);
    floatText(s.x + rand(-40, 40) * s.sc, schoolTop(s), pick(['♪', '♫']), pick(SHIRT), 28);
  }
  musicTick(isParty());
}

var lastHud = '';
function paintHud() {
  var jitter = S.phase === 'crisis' ? Math.sin(S.t * 18) * 0.03 : 0;
  $('pb-dreams-fill').style.width = clamp(S.dreams + jitter, 0.02, 1) * 100 + '%';
  var gn = $('pb-gauge-num');
  if (S.phase === 'unlimited') {
    if (!gn.firstElementChild) gn.innerHTML = INF;
    var c = DAYS[Math.floor(S.clock / 1440) % 7] + ' ' + clockStr(S.clock);
    if (c !== lastHud) { lastHud = c; $('pb-clock').textContent = c; }
    $('pb-q-sessions').textContent = num(S.sessions);
  } else if (S.phase === 'powerup') {
    $('pb-gauge-fill').style.width = Math.min(100, S.power) + '%';
    gn.textContent = num(S.power);
  }
}

// Invoice
function renderInvoice() {
  var box = $('pb-lines');
  box.innerHTML = '';
  if (!S.schools.length) {
    box.innerHTML = '<div class="pb-line"><span class="pb-line-name">No schools yet</span></div>';
  }
  S.schools.forEach(function (s) {
    var row = document.createElement('div');
    row.className = 'pb-line';
    var opts = SIZES.map(function (z, i) { return '<option value="' + i + '">' + z.label + ' kids</option>'; }).join('');
    if (s.size > SIZES[4].size) opts += '<option value="x">' + num(s.size) + ' kids</option>';
    row.innerHTML = '<span class="pb-line-name"></span><select aria-label="Students">' + opts + '</select><span class="pb-line-price"></span><button type="button" class="pb-x" aria-label="Remove">&times;</button>';
    row.querySelector('.pb-line-name').textContent = s.name;
    var sel = row.querySelector('select'), price = row.querySelector('.pb-line-price');
    sel.value = s.size > SIZES[4].size ? 'x' : String(tierOf(s.size));
    sel.setAttribute('aria-label', 'Students at ' + s.name);
    price.textContent = money(priceFor(s.size));
    sel.addEventListener('change', function () {
      if (sel.value === 'x') return;
      setSize(s, SIZES[Number(sel.value)].size);
      price.textContent = money(priceFor(s.size));
      updatePrices();
    });
    row.querySelector('.pb-x').setAttribute('aria-label', 'Remove ' + s.name);
    row.querySelector('.pb-x').addEventListener('click', function () {
      removeSchool(s);
      onSchoolsChanged();
      renderInvoice();
      focusQuiet($('pb-inv-add'));
    });
    box.appendChild(row);
  });
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
  if (S.schools.length >= MAX_SCHOOLS) return;
  var p = freeSpot();
  addSchool(p.x, p.y, DEFAULT_TIER);
  if (S.phase !== 'build') sendEveryoneInside();
  onSchoolsChanged();
  renderInvoice();
});
$('pb-inv-close').addEventListener('click', closeInvoice);
$('pb-invoice').addEventListener('click', function (e) { if (e.target === this) closeInvoice(); });
$('pb-pu-invoice').addEventListener('click', function (e) { e.stopPropagation(); openInvoice(); });
$('pb-q-invoice').addEventListener('click', openInvoice);
$('pb-powerup').addEventListener('click', unlock);
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
  S.dreams = 0.78; S.mult = 1; S.power = 0; S.clock = 10 * 60;
  S.sessions = 0; S.combo = 0; S.nudges = 0; S.seen = { intro: 1 }; S.idle = 0; S.idleBuild = 0;
  S.phase = 'build';
  music.on = false;
  root.classList.remove('is-crisis', 'is-unlimited');
  ['pb-dreams', 'pb-gauge', 'pb-clock', 'pb-quote', 'pb-powerup', 'pb-dog-delivery', 'pb-dog-bubble', 'pb-dog-party'].forEach(function (id) { $(id).hidden = true; });
  $('pb-dog-delivery').classList.remove('is-jump');
  $('pb-dreams-mult').textContent = '×1';
  $('pb-gauge-num').textContent = '0';
  $('pb-gauge-fill').style.width = '0%';
  cv.setAttribute('aria-label', 'A school district map. Click the map to stamp a school.');
  seedHoard(40);
  onSchoolsChanged();
  announce('Level 1: Students on the <em>loose</em>', 'Give them somewhere to go', 2600);
}

// Input
function pointerPos(e) {
  var r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
function stampAt(x, y) {
  closePop();
  var s = addSchool(x, y, DEFAULT_TIER);
  if (S.phase !== 'build') sendEveryoneInside();
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
    if (d.moved) { placeSchool(d.s, p.x - d.ox, p.y - d.oy); S.teachers.forEach(parkAtSpot); }
  }
  if (S.phase === 'unlimited' && S.ptr.mouse && Math.random() < 0.4) {
    S.parts.push({ x: p.x, y: p.y, vx: rand(-20, 20), vy: rand(-30, 0), life: 0.5, c: pick(POP), s: 3 * S.k, shape: 'dot', rot: 0, vr: 0 });
  }
});
cv.addEventListener('pointerleave', function () { S.ptr.inside = false; });
cv.addEventListener('pointerdown', function (e) {
  audio();
  var p = pointerPos(e);
  S.ptr.x = p.x; S.ptr.y = p.y; S.ptr.mouse = e.pointerType === 'mouse';
  if (S.phase === 'unlimited') {
    var hit = schoolAt(p.x, p.y);
    if (hit) blast(hit, p.x, p.y);
    else burst(p.x, p.y, 6, ['#FFFFFF', '#FFC94D'], 100 * S.k, 'star');
    return;
  }
  if (S.phase !== 'build' && S.phase !== 'crisis') return;
  cancelCountdown();
  S.idleBuild = 0;
  var s = schoolAt(p.x, p.y);
  if (s) {
    UI.drag = { s: s, ox: p.x - s.x, oy: p.y - s.y, sx: p.x, sy: p.y, moved: false };
    try { cv.setPointerCapture(e.pointerId); } catch (err) { /* capture is optional */ }
    return;
  }
  if (!UI.canStamp()) return;
  stampAt(p.x, p.y + 24 * S.k);
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
    focusQuiet($('pb-pop-opts').querySelector('.is-on') || $('pb-pop-opts').firstElementChild);
  }
});
function updateCursor() {
  var c = 'default';
  if (S.ptr.mouse && S.ptr.inside) {
    if (UI.drag && UI.drag.moved) c = 'grabbing';
    else if (S.phase === 'unlimited') c = 'none';
    else if (S.phase === 'build' || S.phase === 'crisis') c = schoolAt(S.ptr.x, S.ptr.y) ? 'grab' : UI.canStamp() ? 'none' : 'default';
  }
  if (cv.style.cursor !== c) cv.style.cursor = c;
}

function step(dt) {
  S.t += dt;
  if (S.phase === 'build') { hoverStep(dt); countdownStep(dt); }
  else if (S.phase === 'crisis') crisisStep(dt);
  else if (S.phase === 'powerup') powerStep(dt);
  else if (S.phase === 'unlimited') unlimitedStep(dt);
  popStep(dt);
  S.assignT = (S.assignT || 0) - dt;
  if (S.assignT <= 0) { assignKids(); S.assignT = 0.15; }
  updateKids(dt);
  updateSchools(dt);
  updateDreams(dt);
  updateFx(dt);
  updateCursor();
  S.uiT = (S.uiT || 0) - dt;
  if (S.uiT <= 0) { paintHud(); S.uiT = 0.08; }
}

function resize() {
  var r = $('pb-screen').getBoundingClientRect();
  var w = Math.max(240, r.width), h = Math.max(240, r.height);
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * DPR);
  cv.height = Math.round(h * DPR);
  setGeometry(w, h);
  positionPop();
}
if (window.ResizeObserver) new ResizeObserver(resize).observe($('pb-screen'));
else window.addEventListener('resize', resize);
if (UPDOG) { $('pb-dog-delivery').src = UPDOG; $('pb-dog-party').src = UPDOG; }
resize();
seedHoard(40);
onSchoolsChanged();

var visible = true, last = 0;
function intro() { once('intro', function () { announce('Level 1: Students on the <em>loose</em>', 'Give them somewhere to go', 2600); }); }
if (window.IntersectionObserver) {
  new IntersectionObserver(function (es) {
    visible = es[0].isIntersecting;
    if (visible) intro();
  }, { threshold: 0.4 }).observe($('pb-screen'));
} else intro();
function frame(ts) {
  requestAnimationFrame(frame);
  if (!visible || document.hidden) { last = ts; return; }
  var dt = Math.min(0.05, (ts - (last || ts)) / 1000);
  last = ts;
  step(dt);
  render();
}
requestAnimationFrame(frame);
