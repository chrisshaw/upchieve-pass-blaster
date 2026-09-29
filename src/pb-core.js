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
  'Lincoln High', 'Maple Middle', 'Roosevelt Academy', 'Riverside High',
  'Oak Hill Middle', 'Washington Prep', 'Central High', 'Sunnyvale Middle',
  'Hillcrest High', 'Pine Ridge Academy', 'Northgate High', 'Cedar Grove Middle',
  'Harbor View High', 'Brookside Academy', 'Mesa Verde High', 'Southside Middle',
  'Westfield High', 'Lakeview Middle', 'Jefferson Prep', 'Kennedy High'
];

var SKIN = ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC', '#5C3A21'];
var HAIR = ['#1B1B1B', '#3B2314', '#6A4E2A', '#B5651D', '#E8C07D', '#2E2E5E'];
var SHIRT = ['#154BB7', '#F48FB1', '#FFC94D', '#5CC9A7', '#9B87F5', '#FF9F6E', '#5FA8FF', '#E85D8F'];
var PANTS = ['#2B2D42', '#3A4690', '#5C4033', '#1F3A5F'];
var CARS = ['#154BB7', '#F48FB1', '#5CC9A7', '#9B87F5', '#FF9F6E', '#FFC94D', '#8A93A6'];
var WALLS = ['#FFE7A8', '#FFD3BF', '#E2D6FB', '#FFD6E4', '#CFE6FB'];
var POP = ['#FFC94D', '#FFFFFF', '#F48FB1', '#5CC9A7', '#9B87F5', '#5FA8FF'];
var OUTLINE = '#1C222B';

// Which version is on: 'party' (the original) or 'cozy'. The chooser sets it.
var MODE = 'party';

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
function noiseHit(at, vol, type, freq, dur) {
  var a = audio();
  if (!a) return;
  if (!noiseBuf) {
    noiseBuf = a.createBuffer(1, a.sampleRate * 0.3, a.sampleRate);
    var d = noiseBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  var t0 = Math.max(at, a.currentTime);
  var src = a.createBufferSource(), f = a.createBiquadFilter(), v = a.createGain();
  src.buffer = noiseBuf;
  f.type = type; f.frequency.value = freq;
  v.gain.setValueAtTime(vol, t0);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(v); v.connect(a.destination);
  src.start(t0); src.stop(t0 + dur + 0.02);
}
function hat(at, vol) { noiseHit(at, vol, 'highpass', 7000, 0.05); }
var lastPop = 0;
var SFX_PARTY = {
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
  honk: function () { tone(330, 0.12, 'square', 0.022); tone(330, 0.12, 'square', 0.022, 0.16); },
  rocket: function () { tone(120, 1.4, 'sawtooth', 0.03, 0, 900); noiseHit(0, 0.05, 'bandpass', 600, 1.2); },
  poof: function () { noiseHit(0, 0.1, 'lowpass', 1400, 0.3); tone(880, 0.08, 'square', 0.03, 0.05); tone(1319, 0.16, 'square', 0.03, 0.12); },
  pew: function () { noiseHit(0, 0.04, 'highpass', 3000, 0.25); tone(rand(900, 1400), 0.2, 'triangle', 0.02, 0, 300); },
  buzz: function () { tone(120, 0.22, 'square', 0.05); tone(90, 0.22, 'square', 0.04, 0.05); },
  charge: function () {
    tone(90, 1.9, 'sawtooth', 0.035, 0, 1800);
    for (var i = 0; i < 16; i++) tone(262 * Math.pow(2, i / 6), 0.1, 'square', 0.025, 0.1 + i * 0.1);
  },
  boom: function () {
    tone(160, 0.6, 'sine', 0.22, 0, 35);
    noiseHit(0, 0.12, 'lowpass', 900, 0.6);
    [523, 659, 784, 1047, 1319].forEach(function (f, i) { tone(f, 0.25, 'square', 0.03, 0.12 + i * 0.06); });
  }
};

// Cozy mode swaps the chiptune blips for soft bells, wood knocks, wind, and rain.
var loopBuf = null;
function loopNoise(a) {
  if (!loopBuf) {
    loopBuf = a.createBuffer(1, a.sampleRate * 2, a.sampleRate);
    var d = loopBuf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return loopBuf;
}
function wind(dur, f0, f1, vol, delay) {
  var a = audio();
  if (!a) return;
  var t0 = a.currentTime + (delay || 0);
  var src = a.createBufferSource(), f = a.createBiquadFilter(), v = a.createGain();
  src.buffer = loopNoise(a); src.loop = true;
  f.type = 'bandpass'; f.Q.value = 0.9;
  f.frequency.setValueAtTime(f0, t0);
  f.frequency.exponentialRampToValueAtTime(f1, t0 + dur);
  v.gain.setValueAtTime(0.0001, t0);
  v.gain.exponentialRampToValueAtTime(vol, t0 + dur * 0.55);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(f); f.connect(v); v.connect(a.destination);
  src.start(t0); src.stop(t0 + dur + 0.05);
}
var rain = null;
function rainOn() {
  var a = audio();
  if (!a || rain) return;
  var src = a.createBufferSource(), hi = a.createBiquadFilter(), lo = a.createBiquadFilter(), v = a.createGain();
  src.buffer = loopNoise(a); src.loop = true;
  hi.type = 'highpass'; hi.frequency.value = 500;
  lo.type = 'lowpass'; lo.frequency.value = 2600;
  v.gain.setValueAtTime(0.0001, a.currentTime);
  v.gain.exponentialRampToValueAtTime(0.03, a.currentTime + 1.5);
  src.connect(hi); hi.connect(lo); lo.connect(v); v.connect(a.destination);
  src.start();
  rain = { src: src, v: v };
}
function rainOff(fast) {
  if (!rain) return;
  var r = rain, t = AC.currentTime, end = fast ? 0.05 : 0.9;
  rain = null;
  r.v.gain.cancelScheduledValues(t);
  r.v.gain.setValueAtTime(Math.max(0.0001, r.v.gain.value), t);
  r.v.gain.exponentialRampToValueAtTime(0.0001, t + end);
  r.src.stop(t + end + 0.05);
}
function bell(delay, vol) {
  tone(880, 1.4, 'sine', vol, delay);
  tone(1760, 0.9, 'sine', vol * 0.3, delay);
  tone(2429, 0.6, 'sine', vol * 0.25, delay);
}
var PENTA = [0, 2, 4, 7, 9];
var lastClink = 0;
var SFX_COZY = {
  stamp: function () { tone(210, 0.14, 'triangle', 0.14, 0, 90); noiseHit(0, 0.04, 'lowpass', 700, 0.06); },
  pop: function () {
    var now = performance.now();
    if (now - lastPop < 80) return;
    lastPop = now;
    tone(rand(620, 780), 0.08, 'sine', 0.03, 0, 1000);
  },
  chip: function (i) { var f = 523 * [1, 1.125, 1.25, 1.5, 1.667][i]; tone(f, 0.25, 'sine', 0.05); tone(f * 4, 0.04, 'sine', 0.008); },
  tick: function (n) { tone(n <= 1 ? 1320 : 990, 0.07, 'sine', 0.05); },
  go: function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.4, 'sine', 0.04, i * 0.09); }); },
  sad: function () { tone(rand(520, 680), 0.14, 'sine', 0.018, 0, rand(260, 340)); },
  alarm: function () {
    noiseHit(0, 0.1, 'lowpass', 220, 0.3);
    wind(2.4, 180, 90, 0.06);
    tone(392, 0.5, 'triangle', 0.03); tone(330, 0.7, 'triangle', 0.03, 0.4);
    rainOn();
  },
  swoosh: function () { wind(0.9, 400, 1600, 0.05); tone(1047, 0.5, 'sine', 0.035, 0.3); tone(1568, 0.6, 'sine', 0.03, 0.42); },
  blast: function (combo) {
    var c = Math.min(combo - 1, 12), m = 64 + PENTA[c % 5] + 12 * Math.floor(c / 5);
    tone(mtof(m), 0.3, 'sine', 0.05); tone(mtof(m + 12), 0.06, 'triangle', 0.012);
  },
  chime: function () { bell(0, 0.04); bell(0.18, 0.03); },
  honk: function () { tone(440, 0.1, 'sine', 0.02); tone(440, 0.1, 'sine', 0.02, 0.14); },
  rocket: function () { wind(2.4, 300, 700, 0.04); [392, 523, 659].forEach(function (f, i) { tone(f, 0.5, 'sine', 0.025, 0.3 + i * 0.22); }); },
  poof: function () { noiseHit(0, 0.05, 'lowpass', 1200, 0.2); tone(1047, 0.25, 'sine', 0.035, 0.05); tone(1568, 0.35, 'sine', 0.03, 0.14); },
  buzz: function () { tone(196, 0.22, 'sine', 0.08, 0, 130); },
  charge: function () {
    wind(2.2, 250, 2400, 0.07);
    for (var i = 0; i < 14; i++) tone(mtof(60 + PENTA[i % 5] + 12 * Math.floor(i / 5)), 0.5, 'sine', 0.03, 0.15 + i * 0.12);
  },
  boom: function () {
    wind(1.6, 1800, 300, 0.12);
    bell(0, 0.07); bell(0.32, 0.06); bell(0.64, 0.05);
    [262, 330, 392, 494, 587].forEach(function (f, i) { tone(f, 1.6, 'triangle', 0.025, 0.1 + i * 0.05); });
  },
  clink: function () {
    var now = performance.now();
    if (now - lastClink < 70) return;
    lastClink = now;
    tone(rand(2600, 3000), 0.12, 'sine', 0.035); tone(rand(3900, 4300), 0.07, 'sine', 0.015);
    noiseHit(0, 0.02, 'highpass', 5000, 0.03);
  }
};
// The chooser's demo town stays quiet; only the swoosh of picking a mode plays there.
var sfx = {};
Object.keys(SFX_PARTY).concat(['clink']).forEach(function (k) {
  sfx[k] = function (a) {
    if (S.phase === 'choose' && k !== 'swoosh') return;
    var f = (MODE === 'cozy' ? SFX_COZY : SFX_PARTY)[k];
    if (f) f(a);
  };
});

// Unlimited mode loop: I-V-vi-IV, with a kick drum added once the night party starts.
// Cozy mode plays a slow lo-fi loop instead (IV-iii-ii-I sevenths, swung hats), with soft drums at night.
var music = { on: false, next: 0, step: 0, t0: 0 };
var STEP = 60 / 138 / 4;
var COZY_STEP = 60 / 84 / 4;
function stepLen() { return MODE === 'cozy' ? COZY_STEP : STEP; }
var PROG = [[48, 52, 55, 60], [43, 47, 50, 55], [45, 48, 52, 57], [41, 45, 48, 53]];
var COZY_PROG = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }
function cozyNotes(i, s, t, night) {
  var ch = COZY_PROG[Math.floor(i / 16) % 4], st = COZY_STEP, sw = s % 4 === 2 ? st * 0.28 : 0;
  if (s === 0 || s === 10) ch.forEach(function (m, j) { note(mtof(m), st * 7, 'sine', 0.018, t + j * 0.012); note(mtof(m + 12), st * 3, 'triangle', 0.004, t + j * 0.012); });
  if (s === 0) note(mtof(ch[0] - 12), st * 6, 'sine', 0.09, t);
  if (s === 7) note(mtof(ch[2] - 12), st * 3, 'sine', 0.06, t);
  if (s % 4 === 2) hat(t + sw, 0.012);
  if (night && (s === 0 || s === 10)) note(110, 0.22, 'sine', 0.12, t, 45);
  if (night && (s === 4 || s === 12)) noiseHit(t, 0.03, 'bandpass', 1400, 0.16);
  if ((s === 3 || s === 6 || s === 11 || s === 14) && Math.random() < 0.3) note(mtof(72 + pick(PENTA) + (Math.random() < 0.3 ? 12 : 0)), st * 4, 'sine', 0.016, t + sw);
}
function musicTick(party) {
  var a = audio();
  if (!a || !music.on) return;
  var st = stepLen();
  if (music.next < a.currentTime) {
    music.next = a.currentTime + 0.05;
    if (!music.t0) music.t0 = music.next - music.step * st;
  }
  while (music.next < a.currentTime + 0.2) {
    var i = music.step, t = music.next, ch = PROG[Math.floor(i / 16) % 4], s = i % 16;
    if (MODE === 'cozy') cozyNotes(i, s, t, party);
    else {
      if (s % 2 === 0) note(mtof(ch[0] - 12 + (s % 8 === 4 ? 12 : 0)), STEP * 1.7, 'triangle', 0.07, t);
      note(mtof(ch[[0, 1, 2, 3, 2, 1, 2, 3][s % 8]] + 12), STEP * 0.8, 'square', 0.012, t);
      if (s % 4 === 2) hat(t, 0.025);
      if (party && s % 4 === 0) note(150, 0.16, 'sine', 0.16, t, 40);
      if (party && s % 8 === 4) noiseHit(t, 0.06, 'bandpass', 1800, 0.12);
    }
    music.next += st;
    music.step++;
  }
}

// Beats since the loop started, used to bounce the world in time with the music.
function beatPos() {
  if (AC && music.on && music.t0 && !muted) return (AC.currentTime - music.t0) / (stepLen() * 4);
  return (S.t - (S.uStart || 0)) / (stepLen() * 4);
}

var IMG = {};
Object.keys(ART).forEach(function (k) { var im = new Image(); im.src = ART[k]; IMG[k] = im; });
function imgReady(k) { return IMG[k] && IMG[k].complete && IMG[k].naturalWidth > 0; }

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
  hero: { x: 0, y: 0, hs: 1, pulse: 0, hit: 0 },
  dog: { x: 0, y: 0, w: 100, on: false, glasses: 0, jump: 0 },
  zone: { right: 0, top: 0, meter: 9999 },
  rocket: null,
  wavelets: [],
  rainbow: 0,
  wave: null,
  beat: -1,
  // Cozy mode: how gray and rainy it is (0-1), how hard the wind blows, and the leaves and fireflies it carries.
  gloom: 0, windy: 0, cloudShift: 0, leaves: [], flies: [],
  W: 0, H: 0, k: 1, t: 0
};
