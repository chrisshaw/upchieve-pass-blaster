// The mode chooser: one live town painted both ways, split by a slanted divider like a before/after
// slider. Hovering (or focusing) a side lets it grow to about three quarters of the frame; clicking or
// tapping a side sweeps the divider across and starts that mode.
var CH = { split: 0.5, v: 0, target: 0.5, picked: null, pickedAt: 0, beat: -1, cheerT: 0 };
var PREVIEW_CLOCK = { party: 21 * 60, cozy: 19 * 60 };
var TILT = 0.09;
// Demo schools, as [share of the width, share of the way from horizon to road, size tier].
var DEMO = [[0.22, 0.42, 1], [0.5, 0.6, 2], [0.8, 0.45, 1], [0.34, 0.9, 0], [0.7, 0.92, 3]];

function splitGeom() {
  var x = CH.split * S.W, dx = TILT * S.H;
  return { x: x, top: x + dx, bottom: x - dx, dx: dx };
}
function enterChooser(from) {
  S.phase = 'choose';
  S.schools = []; S.kids = []; S.parts = []; S.floats = []; S.leaves = []; S.flies = [];
  S.gloom = 0; S.windy = 0.1; S.rainbow = 0; S.bloom = null; S.charm = null; S.duo = null; S.uStart = 0; S.ptr.inside = false;
  seedHoard(CROWD);
  DEMO.forEach(function (d) {
    var s = addSchool(d[0] * S.W, lerp(S.G.horizon, S.G.roadTop, d[1]), d[2]);
    s.drop = 0; s.landed = true;
  });
  PART_TAG = 'cozy';
  S.schools.forEach(function (s) { s.inside = s.need; bless(s); s.spirit.born = S.t - 5; s.ring = 0; });
  PART_TAG = undefined;
  seedFlies(28);
  S.dog.on = true; S.dog.glasses = 1;
  var over = TILT * S.H / S.W + 0.03;
  CH.split = from === 'party' ? 1 + over : from === 'cozy' ? -over : 0.5;
  CH.v = 0; CH.target = 0.5; CH.picked = null; CH.cheerT = 0.3;
  root.classList.remove('is-cozy');
  $('pb-choose').classList.remove('is-picked');
  $('pb-choose').hidden = false;
  $('pb-power').hidden = true;
  $('pb-done').hidden = true;
  setStatus('Pick your mode!', '');
  cv.setAttribute('aria-label', 'Pick a mode. Party mode on the left, cozy mode on the right.');
  paintChooser();
}
function lean(m) {
  if (CH.picked) return;
  CH.target = m === 'party' ? 0.75 : m === 'cozy' ? 0.25 : 0.5;
}
function pickMode(m) {
  if (CH.picked || S.phase !== 'choose') return;
  audio();
  MODE = m;
  CH.picked = m;
  CH.pickedAt = S.t;
  var over = TILT * S.H / S.W + 0.03;
  CH.target = m === 'party' ? 1 + over : -over;
  root.classList.toggle('is-cozy', m === 'cozy');
  $('pb-choose').classList.add('is-picked');
  applyModeText();
  sfx.swoosh();
  say(m === 'cozy' ? 'Cozy mode.' : 'Party mode.');
}
function chooseStep(dt) {
  // A spring with a little overshoot, so the divider settles instead of sliding mechanically.
  if (reduced) { CH.split = CH.target; CH.v = 0; }
  else {
    var k = CH.picked ? 90 : 60, damp = CH.picked ? 14 : 11;
    CH.v += ((CH.target - CH.split) * k - CH.v * damp) * dt;
    CH.split += CH.v * dt;
  }
  paintChooser();
  if (CH.picked && (Math.abs(CH.split - CH.target) < 0.01 || S.t - CH.pickedAt > 0.9)) { startIntro(); return; }

  // Keep the demo town lively: a school's crew comes out now and then, and the party half gets fireworks.
  CH.cheerT -= dt;
  if (CH.cheerT <= 0 && S.schools.length) {
    CH.cheerT = rand(0.6, 1.1);
    var s = pick(S.schools), top = s.y - dims(s).h * s.sc * 0.5;
    cheer(s);
    s.ring = 1;
    PART_TAG = 'party'; burst(s.x, top, 10, POP, 150 * S.k, 'star');
    PART_TAG = undefined;
    spiritCheer(s);
  }
  var b = Math.floor(S.t / (STEP * 4));
  if (b !== CH.beat) {
    CH.beat = b;
    PART_TAG = 'party';
    if (b % 2 === 0) firework();
    if (b % 4 === 0 && S.schools.length) { var c = pick(S.schools); burst(c.x, c.y - (dims(c).h + 28) * c.sc, 16, POP, 220 * S.k, 'conf'); }
    PART_TAG = undefined;
  }
}
function paintChooser() {
  var gm = splitGeom(), W = S.W, px = Math.max(0, gm.x), cx = Math.min(W, gm.x);
  var sp = $('pb-split');
  sp.style.setProperty('--pb-tilt', Math.atan2(2 * gm.dx, S.H) + 'rad');
  sp.style.transform = 'translateX(' + gm.x + 'px) rotate(' + Math.atan2(2 * gm.dx, S.H) + 'rad)';
  $('pb-pick-party').style.clipPath = 'polygon(0 0,' + gm.top + 'px 0,' + gm.bottom + 'px 100%,0 100%)';
  $('pb-pick-cozy').style.clipPath = 'polygon(' + gm.top + 'px 0,100% 0,100% 100%,' + gm.bottom + 'px 100%)';
  var fp = clamp(CH.split, 0, 1);
  placeLabel($('pb-pick-party-label'), px / 2, fp, -2);
  placeLabel($('pb-pick-cozy-label'), (cx + W) / 2, 1 - fp, 2);
}
function placeLabel(el, x, share, tilt) {
  el.style.left = x + 'px';
  el.style.transform = 'translate(-50%, -50%) rotate(' + tilt + 'deg) scale(' + clamp(0.5 + share, 0.72, 1.18).toFixed(3) + ')';
}
function renderChooser() {
  var gm = splitGeom(), H = S.H, keep = { mode: MODE, clock: S.clock };
  S.phase = 'unlimited';
  g.save();
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  ['party', 'cozy'].forEach(function (m) {
    MODE = m;
    S.clock = PREVIEW_CLOCK[m];
    g.save();
    g.beginPath();
    var over = gm.dx * 8 / H;
    if (m === 'party') { g.moveTo(-4, -4); g.lineTo(gm.top + over, -4); g.lineTo(gm.bottom - over, H + 4); g.lineTo(-4, H + 4); }
    else { g.moveTo(gm.top + over, -4); g.lineTo(S.W + 4, -4); g.lineTo(S.W + 4, H + 4); g.lineTo(gm.bottom - over, H + 4); }
    g.closePath();
    g.clip();
    var edge = m === 'party' ? Math.max(gm.top, gm.bottom) + 110 * S.k : Math.min(gm.top, gm.bottom) - 110 * S.k;
    CULL = m === 'party' ? function (x) { return x < edge; } : function (x) { return x > edge; };
    drawScene();
    CULL = null;
    g.restore();
  });
  g.restore();
  S.phase = 'choose';
  MODE = keep.mode;
  S.clock = keep.clock;
}

// After a pick: the demo schools pop away, their kids spill out, and the clock races to morning.
function startIntro() {
  S.phase = 'intro';
  S.introT = 0;
  S.clock = S.introFrom = PREVIEW_CLOCK[MODE];
  S.parts = []; S.flies = [];
  $('pb-choose').hidden = true;
  burst(S.dog.x, S.dog.y - 50 * S.k, 18, ['#FFFFFF', '#FFF0C3'], 180 * S.k, 'dot');
  S.dog.on = false; S.dog.glasses = 0;
  S.schools.forEach(function (s, i) { s.vanishAt = 0.12 + i * 0.09; });
  setStatus('', '');
  sfx.poof();
}
function introStep(dt) {
  S.introT += dt;
  var u = Math.min(1, S.introT / (MODE === 'cozy' ? 1.4 : 1.1));
  S.clock = lerp(S.introFrom, 34 * 60, u * u * (3 - 2 * u));
  S.schools.slice().forEach(function (s) {
    if (s.vanishAt == null || S.introT < s.vanishAt) return;
    burst(s.x, s.y - dims(s).h * s.sc * 0.5, 14, ['#FFFFFF', '#FFF0C3', '#EEEAE0'], 160 * S.k, 'dot');
    removeSchool(s);
  });
  if (u < 1) return;
  S.phase = 'build';
  S.clock = 10 * 60;
  S.idleBuild = 0;
  $('pb-power').hidden = false;
  cv.setAttribute('aria-label', 'A school district map. Click the map to add a school.');
  onSchoolsChanged();
  focusQuiet(cv);
}

var knob = $('pb-split').querySelector('.pb-split-knob'), knobUpAt = -1e9;
function onKnob(el) { return !!el && (el === knob || knob.contains(el)); }
['party', 'cozy'].forEach(function (m) {
  var b = $('pb-pick-' + m);
  b.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') lean(m); });
  // Moving onto the knob keeps the lean, or the divider would slide out from under the pointer.
  b.addEventListener('pointerleave', function (e) { if (e.pointerType !== 'touch' && !onKnob(e.relatedTarget)) lean(null); });
  b.addEventListener('focus', function () { lean(m); });
  b.addEventListener('blur', function () { lean(null); });
  // A tap on the knob swings the divider away, and the browser's click can then land on the side
  // underneath it; that isn't a pick.
  b.addEventListener('click', function () { if (performance.now() - knobUpAt > 500) pickMode(m); });
});

// The knob is a real handle, like a before/after slider's. Drag it to paint more of the town either
// way; let go most of the way across (or flick it) to pick that side. A tap swings it to peek at the
// other side, which is how you get the hover preview on a phone.
var DRAG = null;
function knobShare(e) { var r = $('pb-choose').getBoundingClientRect(); return (e.clientX - r.left) / r.width; }
knob.addEventListener('pointerdown', function (e) {
  if (CH.picked || S.phase !== 'choose') return;
  e.preventDefault();
  try { knob.setPointerCapture(e.pointerId); } catch (err) {}
  DRAG = { id: e.pointerId, x0: e.clientX, off: CH.split - knobShare(e), moved: false, v: 0, t: performance.now() };
  $('pb-choose').classList.add('is-dragging');
});
knob.addEventListener('pointermove', function (e) {
  if (!DRAG || e.pointerId !== DRAG.id || CH.picked) return;
  if (!DRAG.moved && Math.abs(e.clientX - DRAG.x0) < 6) return;
  DRAG.moved = true;
  var sp = clamp(knobShare(e) + DRAG.off, 0.04, 0.96), now = performance.now(), dt = (now - DRAG.t) / 1000;
  if (dt > 0) DRAG.v = lerp(DRAG.v, (sp - CH.split) / dt, 0.5);
  DRAG.t = now;
  CH.split = CH.target = sp; CH.v = 0;
  paintChooser();
});
function dropKnob(e, cancel) {
  if (!DRAG || e.pointerId !== DRAG.id) return;
  var D = DRAG;
  DRAG = null;
  knobUpAt = performance.now();
  $('pb-choose').classList.remove('is-dragging');
  if (cancel || CH.picked) return;
  if (!D.moved) { lean(CH.target >= 0.5 ? 'cozy' : 'party'); return; }
  var sp = CH.split, v = performance.now() - D.t > 90 ? 0 : D.v;
  if (sp > 0.82 || (sp > 0.6 && v > 1.2)) { CH.v = v; pickMode('party'); }
  else if (sp < 0.18 || (sp < 0.4 && v < -1.2)) { CH.v = v; pickMode('cozy'); }
}
knob.addEventListener('pointerup', function (e) { dropKnob(e, false); });
knob.addEventListener('pointercancel', function (e) { dropKnob(e, true); });
knob.addEventListener('pointerleave', function (e) {
  var to = e.relatedTarget;
  if (DRAG || e.pointerType === 'touch' || (to && to.closest && to.closest('.pb-pick'))) return;
  lean(null);
});
