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
function tierOf(n) {
  for (var i = 0; i < TIERS.length; i++) if (n <= TIERS[i].upTo) return i;
  return TIERS.length - 1;
}
function priceFor(n) { return TIERS[tierOf(n)].price; }
function money(n, cents) {
  return '$' + n.toLocaleString('en-US', {
    minimumFractionDigits: cents ? 2 : 0,
    maximumFractionDigits: cents ? 2 : 0
  });
}
function num(n) { return Math.round(n).toLocaleString('en-US'); }

var NAMES = [
  'Lincoln High', 'Maple Middle', 'Eastside Elementary', 'Roosevelt Academy',
  'Riverside High', 'Oak Hill Middle', 'Washington Prep', 'Central High',
  'Lakeview Elementary', 'Sunnyvale Middle', 'Hillcrest High', 'Pine Ridge Academy',
  'Westfield Elementary', 'Northgate High', 'Cedar Grove Middle', 'Harbor View High',
  'Jefferson Elementary', 'Brookside Academy', 'Mesa Verde High', 'Southside Middle'
];

var ROLES = [
  { id: 'principal', name: 'PRINCIPAL', suit: '#C0392B', hair: '#3B2314', skin: '#C68642',
    stats: [['Buildings', '1'], ['Knows every name', 'YES'], ['Coffee', '|||||']] },
  { id: 'curriculum', name: 'DIRECTOR OF CURRICULUM', suit: '#1F7A6B', hair: '#1B1B1B', skin: '#8D5524',
    stats: [['Binders', '47'], ['Standards known', 'ALL'], ['Coffee', '||||||']] },
  { id: 'super', name: 'SUPERINTENDENT', suit: '#2E3A8C', hair: '#B8B8C8', skin: '#F1C27D',
    stats: [['Buildings', 'MANY'], ['Board emails', '212'], ['Sleep', '|']] }
];

var SKIN = ['#8D5524', '#C68642', '#E0AC69', '#F1C27D', '#FFDBAC', '#5C3A21'];
var HAIR = ['#1B1B1B', '#3B2314', '#6A4E2A', '#B5651D', '#E8C07D', '#2E2E5E'];
var SHIRT = ['#FF5EA8', '#FFD23F', '#7BE0C8', '#5FA8FF', '#FF8C42', '#9B5DE5', '#00BBF9', '#F15BB5', '#FEE440', '#00F5D4'];
var PANTS = ['#2B2D42', '#3A4690', '#5C4033', '#1F3A5F'];
var CARS = ['#E63946', '#F4A261', '#2A9D8F', '#8338EC', '#3A86FF', '#FFBE0B', '#6C757D'];

function pick(a) { return a[(Math.random() * a.length) | 0]; }
function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
function lerp(a, b, t) { return a + (b - a) * t; }

// Sprites: each letter maps to a palette key, '.' is transparent.
var KID = [
  ['.hhh.', 'hhhhh', '.ese.', '.sss.', 'ttttt', 'sttts', '.ppp.', '.f.f.'],
  ['.hhh.', 'hhhhh', '.ese.', '.sss.', 'ttttt', 'sttts', '.ppp.', 'f...f']
];
var ADULT = [
  ['..hhh..', '.hhhhh.', '.seses.', '.sssss.', '..sss..', 'ccckccc', 'ccckccc', 'scccccs', '.ccccc.', '.pp.pp.', '.pp.pp.', '.ff.ff.'],
  ['..hhh..', '.hhhhh.', '.seses.', '.sssss.', '..sss..', 'ccckccc', 'ccckccc', 'scccccs', '.ccccc.', '.pp.pp.', 'pp...pp', 'ff...ff']
];
var NOTE = ['..##', '..#.', '..#.', '###.', '###.'];

function drawSprite(g, rows, x, y, u, pal) {
  // x, y is the bottom center of the sprite.
  var h = rows.length, w = rows[0].length;
  var ox = Math.round(x - (w * u) / 2), oy = Math.round(y - h * u);
  for (var r = 0; r < h; r++) {
    var row = rows[r];
    for (var c = 0; c < w; c++) {
      var k = row[c];
      if (k === '.') continue;
      g.fillStyle = pal[k] || '#000';
      g.fillRect(ox + Math.round(c * u), oy + Math.round(r * u), Math.ceil(u), Math.ceil(u));
    }
  }
}

// Audio: tiny square-wave blips so nothing needs to be downloaded.
var AC = null, muted = false;
function audio() {
  if (muted) return null;
  if (!AC) {
    try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; }
  }
  if (AC.state === 'suspended') AC.resume();
  return AC;
}
function tone(freq, dur, type, vol, delay, slideTo) {
  var a = audio();
  if (!a) return;
  var t0 = a.currentTime + (delay || 0);
  var o = a.createOscillator(), v = a.createGain();
  o.type = type || 'square';
  o.frequency.setValueAtTime(freq, t0);
  if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  v.gain.setValueAtTime(vol || 0.04, t0);
  v.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  o.connect(v); v.connect(a.destination);
  o.start(t0); o.stop(t0 + dur + 0.02);
}
var lastPop = 0;
var sfx = {
  coin: function () { tone(988, 0.08, 'square', 0.04); tone(1319, 0.3, 'square', 0.04, 0.08); },
  thud: function () { tone(160, 0.22, 'triangle', 0.14, 0, 45); },
  pop: function () {
    var now = performance.now();
    if (now - lastPop < 70) return;
    lastPop = now;
    tone(rand(620, 760), 0.05, 'square', 0.02, 0, 1100);
  },
  alarm: function () {
    for (var i = 0; i < 3; i++) { tone(880, 0.16, 'sawtooth', 0.03, i * 0.36); tone(620, 0.16, 'sawtooth', 0.03, i * 0.36 + 0.18); }
  },
  buzz: function () { tone(110, 0.22, 'square', 0.05); },
  powerup: function () {
    var n = [262, 330, 392, 523, 659, 784, 1047, 1319, 1568, 2093];
    for (var i = 0; i < n.length; i++) tone(n[i], 0.14, 'square', 0.035, i * 0.11);
  },
  blast: function (combo) { tone(Math.min(440 + combo * 40, 1760), 0.08, 'square', 0.03, 0, Math.min(880 + combo * 60, 2600)); },
  honk: function () { tone(330, 0.12, 'square', 0.025); tone(330, 0.12, 'square', 0.025, 0.16); }
};

var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var S = {
  phase: 'title',
  role: null,
  schools: [],
  kids: [],
  teachers: [],
  parts: [],
  floats: [],
  meters: { grades: 72, scores: 70, college: 68, dreams: 75 },
  power: 0,
  unlimited: false,
  clock: 21 * 60,
  clockTarget: null,
  day: 0,
  sessions: 0,
  combo: 0,
  lastBlast: 0,
  shake: 0,
  flash: 0,
  nudges: 0,
  seen: {},
  nextId: 1,
  W: 0, H: 0, P: 3, t: 0
};
