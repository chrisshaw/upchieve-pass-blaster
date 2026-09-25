var root = document.querySelector('.pb:not([data-pb-ready])');
if (!root) return;
root.setAttribute('data-pb-ready', '1');
function $(id) { return root.querySelector('#' + id); }

// Keep in sync with the tiers in the old price calculator on /schools.
var TIERS = [
  { upTo: 500, price: 5000 },
  { upTo: 1500, price: 10000 },
  { upTo: 2000, price: 15000 },
  { upTo: 2500, price: 20000 },
  { upTo: Infinity, price: 25000 }
];
// The size picker offers one choice per tier. `size` is a stand-in head count for each range.
var SIZES = [
  { label: 'Up to 500', size: 400 },
  { label: '501 – 1,500', size: 1000 },
  { label: '1,501 – 2,000', size: 1750 },
  { label: '2,001 – 2,500', size: 2250 },
  { label: '2,500+', size: 3000 }
];
var DEFAULT_TIER = 1;
function tierOf(n) {
  for (var i = 0; i < TIERS.length; i++) if (n <= TIERS[i].upTo) return i;
  return TIERS.length - 1;
}
function priceFor(n) { return TIERS[tierOf(n)].price; }
function money(n) { return '$' + Math.round(n).toLocaleString('en-US'); }
function num(n) { return Math.round(n).toLocaleString('en-US'); }

var NAMES = [
  'Lincoln High', 'Maple Middle', 'Eastside Elementary', 'Roosevelt Academy',
  'Riverside High', 'Oak Hill Middle', 'Washington Prep', 'Central High',
  'Lakeview Elementary', 'Sunnyvale Middle', 'Hillcrest High', 'Pine Ridge Academy',
  'Westfield Elementary', 'Northgate High', 'Cedar Grove Middle', 'Harbor View High',
  'Jefferson Elementary', 'Brookside Academy', 'Mesa Verde High', 'Southside Middle'
];

var SKIN = ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC', '#5C3A21'];
var HAIR = ['#1B1B1B', '#3B2314', '#6A4E2A', '#B5651D', '#E8C07D', '#2E2E5E'];
var SHIRT = ['#154BB7', '#F48FB1', '#FFC94D', '#5CC9A7', '#9B87F5', '#FF9F6E', '#5FA8FF', '#E85D8F'];
var PANTS = ['#2B2D42', '#3A4690', '#5C4033', '#1F3A5F'];
var CARS = ['#154BB7', '#F48FB1', '#5CC9A7', '#9B87F5', '#FF9F6E', '#FFC94D', '#8A93A6'];
var WALLS = ['#FFE7A8', '#FFD3BF', '#E2D6FB', '#FFD6E4', '#CFE6FB'];
var POP = ['#FFC94D', '#FFFFFF', '#F48FB1', '#5CC9A7', '#9B87F5', '#5FA8FF'];
var OUTLINE = '#1C222B';

function pick(a) { return a[(Math.random() * a.length) | 0]; }
function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }

// Audio: synthesized blips and a small chiptune loop, so nothing is downloaded.
var AC = null, muted = false, noiseBuf = null;
function audio() {
  if (muted) return null;
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function note(freq, dur, type, vol, at, slideTo) {
  var a = audio();
  if (!a) return;
  var t0 = Math.max(at, a.currentTime);
  var o = a.createOscillator(), v = a.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  v.gain.setValueAtTime(vol, t0);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(v); v.connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
function tone(freq, dur, type, vol, delay, slideTo) {
  var a = audio();
  if (a) note(freq, dur, type, vol, a.currentTime + (delay || 0), slideTo);
}
function hat(at, vol) {
  var a = audio();
  if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 0.1, a.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  var src = a.createBufferSource(), f = a.createBiquadFilter(), v = a.createGain();
  src.buffer = noiseBuf;
  f.type = 'highpass'; f.frequency.value = 7000;
  v.gain.setValueAtTime(vol, at);
  v.gain.exponentialRampToValueAtTime(0.0001, at + 0.05);
  src.connect(f); f.connect(v); v.connect(a.destination);
  src.start(at); src.stop(at + 0.06);
}
var lastPop = 0;
var sfx = {
  stamp: function () { tone(190, 0.16, 'triangle', 0.16, 0, 60); tone(900, 0.05, 'square', 0.02, 0, 300); },
  pop: function () {
    var now = performance.now();
    if (now - lastPop < 80) return;
    lastPop = now;
    tone(rand(700, 900), 0.05, 'sine', 0.035, 0, 1400);
  },
  chip: function (i) { tone(440 + i * 110, 0.08, 'square', 0.03); },
  tick: function (n) { tone(n <= 1 ? 1175 : 880, 0.09, 'square', 0.04); },
  go: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.12, 'square', 0.035, i * 0.08); }); },
  sad: function () { tone(rand(330, 420), 0.18, 'triangle', 0.03, 0, 180); },
  alarm: function () {
    for (var i = 0; i < 3; i++) { tone(880, 0.16, 'sawtooth', 0.028, i * 0.36); tone(620, 0.16, 'sawtooth', 0.028, i * 0.36 + 0.18); }
  },
  swoosh: function () { tone(300, 0.45, 'sawtooth', 0.02, 0, 1800); tone(1568, 0.3, 'square', 0.03, 0.4); tone(2093, 0.4, 'square', 0.03, 0.5); },
  powerup: function () {
    var n = [262, 330, 392, 523, 659, 784, 1047, 1319, 1568, 2093];
    for (var i = 0; i < n.length; i++) tone(n[i], 0.14, 'square', 0.035, i * 0.11);
  },
  blast: function (combo) { tone(Math.min(520 + combo * 35, 1900), 0.08, 'square', 0.028, 0, Math.min(1000 + combo * 50, 2800)); },
  chime: function () { tone(1319, 0.12, 'square', 0.035); tone(1760, 0.3, 'square', 0.035, 0.1); },
  honk: function () { tone(330, 0.12, 'square', 0.022); tone(330, 0.12, 'square', 0.022, 0.16); }
};

// Unlimited mode loop: I-V-vi-IV, with a kick drum added once the night party starts.
var music = { on: false, next: 0, step: 0 };
var STEP = 60 / 138 / 4;
var PROG = [[48, 52, 55, 60], [43, 47, 50, 55], [45, 48, 52, 57], [41, 45, 48, 53]];
function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function musicTick(party) {
  var a = audio();
  if (!a || !music.on) return;
  if (music.next < a.currentTime) music.next = a.currentTime + 0.05;
  while (music.next < a.currentTime + 0.2) {
    var i = music.step, t = music.next, ch = PROG[Math.floor(i / 16) % 4], s = i % 16;
    if (s % 2 === 0) note(mtof(ch[0] - 12 + (s % 8 === 4 ? 12 : 0)), STEP * 1.7, 'triangle', 0.07, t);
    note(mtof(ch[[0, 1, 2, 3, 2, 1, 2, 3][s % 8]] + 12), STEP * 0.8, 'square', 0.012, t);
    if (s % 4 === 2) hat(t, 0.025);
    if (party && s % 4 === 0) note(150, 0.16, 'sine', 0.16, t, 40);
    music.next += STEP;
    music.step++;
  }
}

var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var S = {
  phase: 'build',
  schools: [],
  kids: [],
  teachers: [],
  parts: [],
  floats: [],
  dreams: 0.78,
  mult: 1,
  power: 0,
  clock: 10 * 60,
  sessions: 0,
  combo: 0,
  lastBlast: 0,
  shake: 0,
  flash: 0,
  nudges: 0,
  idle: 0,
  seen: {},
  nextId: 1,
  ptr: { x: 0, y: 0, inside: false, mouse: false },
  W: 0, H: 0, k: 1, t: 0
};
