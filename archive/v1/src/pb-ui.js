var DPR = 1;
var MAX_SCHOOLS = 100;
var METERS = [
  { k: 'grades', label: 'GRADES' },
  { k: 'scores', label: 'TEST SCORES' },
  { k: 'college', label: 'COLLEGE DREAMS' },
  { k: 'dreams', label: 'DREAMS', cls: 'pb-meter--dreams' }
];
var COLLEGE = [[0, 'Undecided'], [30, 'Maybe college?'], [45, 'Community college'], [60, 'State university'], [80, 'Honors college'],
  [100, 'Top-choice school'], [150, 'Full scholarship'], [220, 'Grad school'], [320, 'PhD'], [450, 'Nobel Prize'], [650, 'Moon University'], [1000, 'Dean of Moon U']];
var DREAMS = [[0, 'Get through today'], [30, 'Pass the class'], [45, 'Graduate'], [60, 'Nurse'], [80, 'Engineer'], [100, 'Doctor'],
  [150, 'Astronaut'], [220, 'Astronaut doctor'], [320, 'Mayor'], [450, 'President'], [650, 'President of Mars'], [1000, 'Bigger than Mars']];
function ladder(L, v) { var out = L[0][1]; for (var i = 0; i < L.length; i++) if (v >= L[i][0]) out = L[i][1]; return out; }
function gradeText(v) {
  if (v < 20) return 'F';
  if (v < 40) return 'D';
  if (v < 60) return 'C';
  if (v < 80) return 'B';
  if (v < 100) return 'A';
  var n = Math.floor((v - 100) / 40) + 1;
  return n <= 6 ? 'A' + '+'.repeat(n) : 'A+ x' + n;
}
function meterText(k, v) {
  if (k === 'grades') return gradeText(v);
  if (k === 'scores') return num(v) + '%';
  if (k === 'college') return ladder(COLLEGE, v);
  return ladder(DREAMS, v);
}

var meterEls = {};
(function buildMeters() {
  var wrap = $('pb-meters');
  METERS.forEach(function (m) {
    var el = document.createElement('div');
    el.className = 'pb-meter' + (m.cls ? ' ' + m.cls : '');
    el.innerHTML = '<div class="pb-meter-top"><span class="pb-meter-label">' + m.label + '</span><span class="pb-meter-lvl" hidden></span></div>' +
      '<div class="pb-meter-bar"><span class="pb-meter-fill"></span></div><div class="pb-meter-val"></div>';
    wrap.appendChild(el);
    meterEls[m.k] = { fill: el.querySelector('.pb-meter-fill'), val: el.querySelector('.pb-meter-val'), lvl: el.querySelector('.pb-meter-lvl') };
  });
})();
function paintMeters() {
  METERS.forEach(function (m, i) {
    var v = S.meters[m.k], e = meterEls[m.k];
    if (S.phase === 'crisis' || S.phase === 'shop') v = Math.max(1, v + Math.sin(S.t * 18 + i * 2) * 3);
    e.fill.style.width = (v < 100 ? v : v % 100) + '%';
    e.val.textContent = meterText(m.k, v);
    if (v >= 100) { e.lvl.hidden = false; e.lvl.textContent = 'x' + (Math.floor(v / 100) + 1); }
    else e.lvl.hidden = true;
  });
}

function paintHud() {
  var fill = $('pb-power-fill'), n = $('pb-power-num');
  if (S.phase === 'unlimited') { if (!n.firstElementChild) n.innerHTML = INF; }
  else {
    fill.style.width = Math.min(100, S.power) + '%';
    n.textContent = S.power > 0 ? num(S.power) : 'EMPTY';
  }
  if (S.phase === 'unlimited') $('pb-clock').textContent = DAYS[Math.floor(S.clock / 1440) % 7] + ' ' + clockStr(S.clock);
  $('pb-q-sessions').textContent = num(S.sessions);
}

var bannerTimer = null;
function banner(html, ms, alarm) {
  var b = $('pb-banner');
  ms = ms || 2600;
  b.innerHTML = html;
  b.classList.remove('is-on', 'is-alarm');
  void b.offsetWidth;
  b.classList.add('is-on');
  if (alarm) b.classList.add('is-alarm');
  clearTimeout(bannerTimer);
  bannerTimer = setTimeout(function () { b.classList.remove('is-on', 'is-alarm'); }, ms);
  S.bannerUntil = S.t + ms / 1000;
}
function say(text) { $('pb-live').textContent = text; }
var INF = '<span class="pb-inf">∞</span>';
function setLevel(html) { $('pb-level').innerHTML = html; }
function focusQuiet(el) { try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }

// Deck: the school list is the real pricing calculator.
function totals() {
  var kids = 0, price = 0, big = 0;
  S.schools.forEach(function (s) { kids += s.size; price += priceFor(s.size); big = Math.max(big, s.size); });
  return { kids: kids, price: price, big: big, n: S.schools.length };
}
function renderList() {
  var ol = $('pb-list');
  ol.innerHTML = '';
  S.schools.forEach(function (s) { ol.appendChild(schoolItem(s)); });
  updateTotals();
}
function schoolItem(s) {
  var li = document.createElement('li');
  li.className = 'pb-school';
  li.innerHTML = '<span class="pb-school-name"></span><span class="pb-school-price"></span>' +
    '<div class="pb-school-ctrl">' +
    '<button type="button" class="pb-step" data-d="-100" aria-label="Remove 100 students">-</button>' +
    '<input class="pb-size" type="number" min="1" step="1" inputmode="numeric" id="pb-size-' + s.id + '">' +
    '<button type="button" class="pb-step" data-d="100" aria-label="Add 100 students">+</button>' +
    '<span class="pb-kids">kids</span>' +
    '<button type="button" class="pb-remove" aria-label="Remove school">&times;</button></div>';
  var name = li.querySelector('.pb-school-name'), input = li.querySelector('.pb-size');
  name.textContent = s.name;
  input.value = s.size;
  input.setAttribute('aria-label', 'Students at ' + s.name);
  li.querySelector('.pb-remove').setAttribute('aria-label', 'Remove ' + s.name);
  s.li = li;
  paintSchoolPrice(s);
  li.querySelectorAll('.pb-step').forEach(function (b) {
    b.addEventListener('click', function () { setSize(s, Math.max(1, s.size + Number(b.getAttribute('data-d')))); });
  });
  input.addEventListener('input', function () {
    var v = parseInt(input.value, 10);
    if (v >= 1) setSize(s, v, true);
  });
  input.addEventListener('change', function () { input.value = s.size; });
  li.querySelector('.pb-remove').addEventListener('click', function () {
    removeSchool(s);
    renderList();
    say(s.name + ' removed.');
    focusQuiet($('pb-add'));
  });
  return li;
}
function paintSchoolPrice(s) {
  if (s.li) s.li.querySelector('.pb-school-price').textContent = money(priceFor(s.size)) + '/yr';
}
function setSize(s, v, fromInput) {
  if (v === s.size) return;
  var before = tierOf(s.size), grew = v > s.size;
  s.size = Math.min(v, 999999999);
  if (!fromInput && s.li) s.li.querySelector('.pb-size').value = s.size;
  recalcNeeds();
  layout();
  S.teachers.forEach(parkAtSpot);
  paintSchoolPrice(s);
  updateTotals();
  var top = s.y - dims(s).h * s.u;
  if (!fromInput) floatText(s.x, top - 6 * s.u, grew ? '+100 SEATS' : '-100 SEATS', grew ? '#7BE0C8' : '#FFFFFF', 7);
  if (tierOf(s.size) !== before) {
    burst(s.x, s.y - dims(s).h * s.u / 2, 12, ['#FFD23F', '#FFFFFF'], 120);
    sfx.thud();
  } else if (!fromInput) sfx.blast(grew ? 4 : 1);
}
function updateTotals() {
  var t = totals();
  $('pb-count').textContent = t.n + ' BLDG';
  $('pb-students').textContent = num(t.kids);
  $('pb-price').textContent = money(t.price);
  $('pb-q-price').textContent = money(t.price);
  $('pb-q-bldg').textContent = num(t.n);
  $('pb-q-kids').textContent = num(t.kids);
  $('pb-add').disabled = $('pb-add5').disabled = t.n >= MAX_SCHOOLS;
  if (S.phase === 'build') $('pb-next').disabled = t.n === 0;
  var egg = $('pb-egg'), msg = '';
  if (t.big >= 10000000) msg = 'Hello, federal government. That’s still one building, so it’s still $25,000.';
  else if (t.big >= 100000) msg = 'That’s one very large building. Still one building. Still $25,000 a year.';
  else if (t.n >= MAX_SCHOOLS) msg = 'That’s 100 buildings. Your quote works the same way, but let’s talk: partnerships@upchieve.org';
  else if (t.n >= 30) msg = 'Big district! Same deal for every building: one flat yearly price.';
  egg.hidden = !msg;
  egg.textContent = msg;
  if (!$('pb-shop').hidden) fillReceipt();
}
function addSchools(count) {
  var room = MAX_SCHOOLS - S.schools.length;
  count = Math.min(count, room);
  for (var i = 0; i < count; i++) {
    (function (delay) {
      setTimeout(function () {
        if (S.schools.length >= MAX_SCHOOLS || S.phase === 'title') return;
        var s = addSchool(700);
        var ol = $('pb-list'), li = schoolItem(s);
        li.classList.add('is-new');
        ol.appendChild(li);
        ol.scrollTop = ol.scrollHeight;
        updateTotals();
        if (S.schools.length === 1 && S.phase === 'build') {
          setTimeout(function () { banner('+1 SCHOOL!<small>More students keep showing up. Add capacity!</small>', 3000); }, 500);
        }
        say(s.name + ' added with 700 students.');
      }, delay);
    })(i * 140);
  }
  $('pb-add').classList.remove('is-pulse');
}

function fillReceipt() {
  var t = totals(), rows = [];
  function esc(x) { var d = document.createElement('span'); d.textContent = x; return d.innerHTML; }
  if (S.schools.length <= 8) {
    S.schools.forEach(function (s) {
      rows.push('<div><span>' + esc(s.name) + ' (' + num(s.size) + ')</span><span>' + money(priceFor(s.size)) + '</span></div>');
    });
  } else {
    var byTier = {};
    S.schools.forEach(function (s) { var k = tierOf(s.size); byTier[k] = (byTier[k] || 0) + 1; });
    Object.keys(byTier).forEach(function (k) {
      var tier = TIERS[k], lo = k > 0 ? TIERS[k - 1].upTo + 1 : 1;
      var label = tier.upTo === Infinity ? num(lo) + '+ kids' : num(lo) + '–' + num(tier.upTo) + ' kids';
      rows.push('<div><span>' + byTier[k] + ' × ' + label + '</span><span>' + money(byTier[k] * tier.price) + '</span></div>');
    });
  }
  rows.push('<div class="pb-rule"></div>');
  rows.push('<div class="pb-strong"><span>' + t.n + (t.n === 1 ? ' building' : ' buildings') + '</span><span>' + money(t.price) + '</span></div>');
  rows.push('<div><span>Tutoring hours</span><span>UNLIMITED</span></div>');
  rows.push('<div><span>Overage fees</span><span>$0</span></div>');
  $('pb-receipt').innerHTML = rows.join('');
  $('pb-shop-total').textContent = money(t.price);
  var per = t.kids ? t.price / t.kids : 0;
  $('pb-shop-per').textContent = per >= 0.01 || !per ? money(per, true) : '$' + per.toPrecision(2);
}

// Phases
function resetWorld() {
  S.schools = []; S.kids = []; S.teachers = []; S.parts = []; S.floats = [];
  S.meters = { grades: 72, scores: 70, college: 68, dreams: 75 };
  S.power = 0; S.unlimited = false; S.clock = 21 * 60; S.clockTarget = null;
  S.sessions = 0; S.combo = 0; S.nudges = 0; S.seen = {}; S.idle = 0;
  root.classList.remove('is-unlimited', 'is-crisis');
  $('pb-meters').classList.add('is-idle');
  $('pb-clock').hidden = true;
  $('pb-quote').hidden = true;
  $('pb-shop').hidden = true;
  var next = $('pb-next');
  next.hidden = false; next.disabled = true; next.textContent = 'DONE ADDING SCHOOLS'; next.classList.remove('is-pulse');
  $('pb-hint').textContent = 'Add each school in your district and set how many students it holds.';
  cv.removeAttribute('tabindex');
  renderList();
  paintMeters();
}
function goTitle() {
  resetWorld();
  S.phase = 'title';
  S.role = null;
  setLevel('1 PLAYER');
  $('pb-select').hidden = true;
  $('pb-title').hidden = false;
}
function goSelect() {
  sfx.coin();
  S.phase = 'select';
  $('pb-title').hidden = true;
  $('pb-select').hidden = false;
  focusQuiet($('pb-roles').querySelector('button'));
}
function goBuild(role) {
  S.role = role || ROLES[2];
  S.phase = 'build';
  $('pb-title').hidden = true;
  $('pb-select').hidden = true;
  S.clockTarget = 33 * 60;
  setLevel('LEVEL 1: STUDENTS ON THE LOOSE');
  banner('STUDENTS ON THE LOOSE!<small>Quick! Add your schools.</small>', 3200);
  $('pb-add').classList.add('is-pulse');
  say('Level 1. Students are wandering. Add your schools to place them.');
  focusQuiet($('pb-add'));
}
function goCrisis() {
  S.phase = 'crisis';
  sendEveryoneInside();
  root.classList.add('is-crisis');
  $('pb-meters').classList.remove('is-idle');
  setLevel('LEVEL 2: DREAMS ARE DROPPING');
  banner('WARNING: DREAMS DROPPING!<small>Grades, scores, and dreams are falling fast</small>', 3400, true);
  sfx.alarm();
  var next = $('pb-next');
  next.textContent = 'VISIT THE POWER-UP SHOP';
  next.classList.add('is-pulse');
  $('pb-hint').textContent = 'Your students need help. The shop has exactly one item.';
  say('Level 2. Grades, test scores, and dreams are dropping. Visit the power-up shop.');
}
function openShop() {
  S.phase = 'shop';
  fillReceipt();
  $('pb-shop').hidden = false;
  sfx.coin();
  focusQuiet($('pb-buy'));
}
function closeShop() {
  $('pb-shop').hidden = true;
  S.phase = 'crisis';
  focusQuiet($('pb-next'));
}
function buy() {
  $('pb-shop').hidden = true;
  $('pb-next').hidden = true;
  S.phase = 'powerup';
  S.powerAnim = 0;
  S.flash = 0.35;
  root.classList.remove('is-crisis');
  sfx.powerup();
  setLevel('POWER-UP ACQUIRED');
  banner('POWER-UP ACQUIRED!', 2000);
  say('Power-up acquired. Charging.');
}
function powerStep(dt) {
  S.powerAnim += dt;
  var a = S.powerAnim;
  S.power = a < 1.3 ? a / 1.3 * 100 : 100 + Math.pow((a - 1.3) / 0.8, 2) * 899;
  if (a >= 2.1) startUnlimited();
}
function startUnlimited() {
  S.phase = 'unlimited';
  S.unlimited = true;
  S.clock = 13 * 60;
  S.idle = 0;
  root.classList.add('is-unlimited');
  S.teachers = [];
  S.schools.forEach(addStaff);
  boostMeters(45);
  S.flash = 0.45;
  if (!reduced) S.shake = 0.4;
  S.schools.forEach(function (s) { burst(s.x, s.y - dims(s).h * s.u, 18, ['#FFD23F', '#FF5EA8', '#7BE0C8', '#FFFFFF'], 200); });
  sfx.coin();
  setLevel('LEVEL ' + INF + ': UNLIMITED MODE');
  banner('UNLIMITED!!<small>Tap your schools. As much as you want. Forever.</small>', 3800);
  $('pb-clock').hidden = false;
  $('pb-quote').hidden = false;
  $('pb-hint').textContent = 'Tap any school to send tutors. The power meter never goes down.';
  cv.setAttribute('tabindex', '0');
  cv.setAttribute('aria-label', 'District map in unlimited mode. Press space to send tutors to a school.');
  updateTotals();
  say('Unlimited tutoring is on. Tap schools, or press space on the map, to send tutors.');
}

function crossed(prev, cur, minute) {
  var a = prev % 1440, b = cur % 1440;
  return b >= a ? a < minute && b >= minute : a < minute || b >= minute;
}
function once(key, fn) { if (!S.seen[key]) { S.seen[key] = 1; fn(); } }
function unlimitedStep(dt) {
  var prev = S.clock;
  S.clock += 36 * dt;
  if (crossed(prev, S.clock, 16 * 60 + 30)) once('out', function () { banner('4:30 PM: TEACHERS CLOCK OUT<small>UPchieve doesn’t.</small>', 3200); });
  if (crossed(prev, S.clock, 2 * 60)) once('2am', function () { banner('2:00 AM: STILL UNLIMITED<small>The kids are having a study party.</small>', 3200); });
  if (crossed(prev, S.clock, 7 * 60 + 30)) once('back', function () { banner('7:30 AM: TEACHERS ARE BACK<small>Power left: still ' + INF + '</small>', 3200); });
  if (Math.floor(prev / 1440) % 7 !== 5 && Math.floor(S.clock / 1440) % 7 === 5) once('sat', function () { banner('SATURDAY<small>Still unlimited. Obviously.</small>', 3000); });
  updateTeachers(dt);
  S.idle += dt;
  if (S.idle > 9 && S.nudges < 3 && S.t > (S.bannerUntil || 0)) {
    S.nudges++;
    S.idle = 0;
    banner('GO ON. TAP A SCHOOL.<small>It’s unlimited. We checked.</small>', 2800);
  }
  if (isParty() && S.schools.length && Math.random() < dt * Math.min(6, S.schools.length * 1.5)) {
    var s = pick(S.schools), d = dims(s);
    S.floats.push({ note: true, x: s.x + rand(-d.w / 2, d.w / 2) * s.u, y: s.y - d.h * s.u, c: pick(SHIRT), life: 1.4, max: 1.4 });
  }
}

function step(dt) {
  S.t += dt;
  if (S.clockTarget != null) {
    S.clock = lerp(S.clock, S.clockTarget, Math.min(1, dt * 2));
    if (Math.abs(S.clock - S.clockTarget) < 1) { S.clock = S.clockTarget; S.clockTarget = null; }
  }
  if (S.phase === 'unlimited') unlimitedStep(dt);
  else if (S.phase === 'powerup') powerStep(dt);
  S.assignT = (S.assignT || 0) - dt;
  if (S.assignT <= 0) { assignKids(); S.assignT = 0.15; }
  updateKids(dt);
  updateSchools(dt);
  updateFx(dt);
  updateMeters(dt);
  S.uiT = (S.uiT || 0) - dt;
  if (S.uiT <= 0) { paintMeters(); paintHud(); S.uiT = 0.1; }
}

// Static pixel art for the role cards and the shop item.
var STAR = ['.....#.....', '....###....', '....###....', '###########', '.#########.', '..#######..', '..#######..', '.####.####.', '.###...###.', '##.......##'];
(function buildRoles() {
  var wrap = $('pb-roles');
  ROLES.forEach(function (r) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'pb-role';
    b.innerHTML = '<canvas width="16" height="16"></canvas><span class="pb-role-name"></span><span class="pb-role-stats"></span>';
    b.querySelector('.pb-role-name').textContent = r.name;
    b.querySelector('.pb-role-stats').innerHTML = r.stats.map(function (st) { return '<span>' + st[0] + ' <b>' + st[1] + '</b></span>'; }).join('');
    var c = b.querySelector('canvas').getContext('2d');
    c.fillStyle = '#252F66'; c.fillRect(0, 0, 16, 16);
    drawSprite(c, ADULT[0], 8, 15, 1, { h: r.hair, s: r.skin, e: '#1B1B1B', c: r.suit, k: '#FFD23F', p: '#2B2D42', f: '#111' });
    b.addEventListener('click', function () { sfx.coin(); goBuild(r); });
    wrap.appendChild(b);
  });
  var ic = $('pb-item-icon').getContext('2d');
  ic.fillStyle = '#000'; ic.fillRect(0, 0, 24, 24);
  drawSprite(ic, STAR, 12, 22, 2, { '#': '#FFD23F' });
  ic.fillStyle = '#FF5EA8'; ic.fillRect(10, 10, 1, 2); ic.fillRect(13, 10, 1, 2);
})();

// Wiring
$('pb-start').addEventListener('click', goSelect);
$('pb-skip').addEventListener('click', function () { goBuild(null); });
$('pb-add').addEventListener('click', function () { addSchools(1); });
$('pb-add5').addEventListener('click', function () { addSchools(5); });
$('pb-next').addEventListener('click', function () {
  if (S.phase === 'build') goCrisis();
  else if (S.phase === 'crisis') openShop();
});
$('pb-buy').addEventListener('click', buy);
$('pb-shop-close').addEventListener('click', closeShop);
$('pb-again').addEventListener('click', function () { goTitle(); focusQuiet($('pb-start')); });
$('pb-mute').addEventListener('click', function () {
  muted = !muted;
  this.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON';
  this.setAttribute('aria-pressed', String(muted));
});
root.addEventListener('keydown', function (e) {
  if (e.key === 'Escape' && !$('pb-shop').hidden) closeShop();
});

function pointerPos(e) {
  var r = cv.getBoundingClientRect();
  return { x: e.clientX - r.left, y: e.clientY - r.top };
}
cv.addEventListener('pointerdown', function (e) {
  var p = pointerPos(e), s = schoolAt(p.x, p.y);
  if (S.phase === 'unlimited') {
    if (s) blast(s, p.x, p.y);
    else burst(p.x, p.y, 5, ['#FFFFFF', '#FFD23F'], 70);
  } else if (S.phase === 'crisis' && s) {
    floatText(p.x, p.y - 10, 'NO POWER!', '#FF4D4D', 9);
    sfx.buzz();
  } else if (S.phase === 'build' && s) {
    floatText(s.x, s.y - dims(s).h * s.u - 8, num(s.size) + ' KIDS', '#FFFFFF', 8);
  }
});
cv.addEventListener('keydown', function (e) {
  if (S.phase !== 'unlimited' || !S.schools.length) return;
  if (e.key === ' ' || e.key === 'Enter') {
    e.preventDefault();
    var s = pick(S.schools);
    blast(s, s.x, s.y - dims(s).h * s.u / 2);
  }
});

function resize() {
  var r = $('pb-screen').getBoundingClientRect();
  var w = Math.max(200, r.width), h = Math.max(200, r.height);
  DPR = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.round(w * DPR);
  cv.height = Math.round(h * DPR);
  setGeometry(w, h);
}
if (window.ResizeObserver) new ResizeObserver(resize).observe($('pb-screen'));
else window.addEventListener('resize', resize);
resize();

var visible = true, last = 0;
if (window.IntersectionObserver) {
  new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(root);
}
function frame(ts) {
  requestAnimationFrame(frame);
  if (!visible || document.hidden) { last = ts; return; }
  var dt = Math.min(0.05, (ts - (last || ts)) / 1000);
  last = ts;
  step(dt);
  render();
}
goTitle();
requestAnimationFrame(frame);
