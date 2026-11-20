(() => {
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const title = document.getElementById('title');
const mk = () => { const c = document.createElement('canvas'); return [c, c.getContext('2d', { willReadFrequently: true })]; };
const [cB, xB] = mk(), [cA, xA] = mk();
const S = 3, RAMP = " .'`:;-~=+*xoO#%@", PI = Math.PI;
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const ease = t => { t = clamp(t); return t * t * (3 - 2 * t); };
const lerp = (a, b, t) => a + (b - a) * t;

/* ---- edit the message here ---- */
const MESSAGE = {
  to: 'Holly',
  body: "You make every day brighter just by being in it. I'm so lucky to have you, and I love you more than words can say. I hope today is as beautiful as you are.",
  sign: 'Love Greig'
};
const HEADING = 'Happy Birthday, ' + (MESSAGE.to || 'my love');

let W, H, dpr, cw, ch, cols, rows, stars, burnV, burnt, occupied, bufB, bufA, env, big;
const acv = document.createElement('canvas'), actx = acv.getContext('2d');
let dirty = true;

function hash(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), fx = ease(x - xi), fy = ease(y - yi);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), fx), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), fx), fy); }

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
  cw = clamp(Math.round(W / 80), 5, 9); ch = Math.round(cw * 1.7);
  cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
  cv.width = acv.width = Math.round(W * dpr); cv.height = acv.height = Math.round(H * dpr); dirty = true;
  for (const c of [cB, cA]) { c.width = cols * S; c.height = rows * S; }
  const n = cols * rows;
  bufB = { r: new Float32Array(n), g: new Float32Array(n), b: new Float32Array(n), a: new Float32Array(n) };
  bufA = { r: new Float32Array(n), g: new Float32Array(n), b: new Float32Array(n), a: new Float32Array(n) };
  const ew = Math.min(W * 0.7, 460);
  env = { cx: W / 2, cy: H * 0.52, w: ew, h: ew * 0.64 };
  const lw = Math.min(W * 0.88, 560);
  big = { cx: W / 2, cy: H * 0.5, w: lw, h: Math.min(H * 0.7, lw * 1.3) };
  const ox = big.cx, oy = big.cy + big.h * 0.5, maxD = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
  burnV = new Float32Array(n); burnt = new Uint8Array(n); occupied = new Uint8Array(n);
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const d = Math.hypot(c * cw - ox, r * ch - oy) / maxD * 1.5;
    const nz = 0.6 * vnoise(c * 0.12, r * 0.12) + 0.3 * vnoise(c * 0.4, r * 0.4) + 0.1 * hash(c, r);
    burnV[r * cols + c] = 0.6 * Math.min(d, 1) + 0.4 * nz;
  }
  mcv.width = cols; mcv.height = rows; maskImg = mx.createImageData(cols, rows); textReady = false; initFloaters();
  stars = Array.from({ length: Math.round(n / 45) }, () => ({ c: Math.floor(Math.random() * cols), r: Math.floor(Math.random() * rows), p: Math.random() * 6, s: Math.random() }));
}

/* ---------- drawing helpers (coordinates are screen px) ---------- */
function setup(x) { x.setTransform(cols * S / (cols * cw), 0, 0, rows * S / (rows * ch), 0, 0); x.clearRect(0, 0, W + cw, H + ch); }
function heart(x, px, py, s, col) { x.fillStyle = col; x.beginPath(); x.moveTo(px, py + s * 0.35);
  x.bezierCurveTo(px - s, py - s * 0.2, px - s * 0.5, py - s * 0.9, px, py - s * 0.35);
  x.bezierCurveTo(px + s * 0.5, py - s * 0.9, px + s, py - s * 0.2, px, py + s * 0.35); x.fill(); }
function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }

function paper(x, R) {
  x.fillStyle = '#3a281b'; rrect(x, R.cx - R.w / 2, R.cy - R.h / 2, R.w, R.h, 6); x.fill();
  x.strokeStyle = '#e0b98a'; x.lineWidth = Math.max(3, R.w * 0.015); x.stroke();
  x.strokeStyle = '#4d3624'; x.lineWidth = Math.max(1.5, R.h * 0.004);
  for (let y = R.cy - R.h * 0.2; y < R.cy + R.h * 0.38; y += R.h * 0.075) { x.beginPath(); x.moveTo(R.cx - R.w * 0.42, y); x.lineTo(R.cx + R.w * 0.42, y); x.stroke(); }
  heart(x, R.cx, R.cy - R.h * 0.4, R.w * 0.035, '#ff7fb0');
}

function envelope(x, E, flap, L, textA, alpha, dy) {
  x.save(); x.globalAlpha = alpha; const w = E.w, h = E.h, l = E.cx - w / 2, t = E.cy - h / 2 + dy, r = l + w, b = t + h, cx = E.cx;
  x.fillStyle = '#a97a4f'; x.fillRect(l, t, w, h);
  const apex = t + h * 0.58 * Math.cos(flap * PI);
  if (flap > 0.5) { x.fillStyle = '#8f6540'; x.beginPath(); x.moveTo(l, t); x.lineTo(r, t); x.lineTo(cx, apex); x.fill(); }
  if (L) { x.save(); x.globalAlpha = alpha; paper(x, { cx: L.cx, cy: L.cy + dy, w: L.w, h: L.h }, textA); x.restore(); }
  x.fillStyle = '#d6a674'; x.beginPath(); x.moveTo(l, t); x.lineTo(cx, E.cy + dy + h * 0.05); x.lineTo(l, b); x.fill();
  x.beginPath(); x.moveTo(r, t); x.lineTo(cx, E.cy + dy + h * 0.05); x.lineTo(r, b); x.fill();
  x.fillStyle = '#e9c496'; x.beginPath(); x.moveTo(l, b); x.lineTo(cx, E.cy + dy - h * 0.08); x.lineTo(r, b); x.fill();
  if (flap <= 0.5) { x.fillStyle = '#f0cf9f'; x.beginPath(); x.moveTo(l, t); x.lineTo(r, t); x.lineTo(cx, apex); x.fill();
    heart(x, cx, apex - h * 0.08, h * 0.16 * (1 - flap * 2), '#ff4f93'); }
  x.restore();
}

function rose(x, px, py, r, b, seed) {
  if (b <= 0) return; r *= ease(b); x.save(); x.translate(px, py);
  const g = x.createRadialGradient(0, 0, r * 0.1, 0, 0, r); g.addColorStop(0, '#ff7fb0'); g.addColorStop(1, '#a8124f');
  x.fillStyle = g; x.beginPath(); x.arc(0, 0, r, 0, 7); x.fill(); x.lineCap = 'round';
  for (let i = 0; i < 4; i++) { x.strokeStyle = i % 2 ? '#ffc4dc' : '#ff5c9c'; x.lineWidth = r * 0.17; x.beginPath();
    x.arc(0, 0, r * (0.88 - i * 0.2), seed + i * 1.3, seed + i * 1.3 + PI * 1.5); x.stroke(); }
  x.strokeStyle = '#ffe3ee'; x.lineWidth = r * 0.12; x.beginPath();
  for (let a = 0; a <= 3.2 * PI; a += 0.15) { const rd = r * 0.5 * a / (3.2 * PI), X = Math.cos(a + seed) * rd, Y = Math.sin(a + seed) * rd; a ? x.lineTo(X, Y) : x.moveTo(X, Y); }
  x.stroke(); x.restore();
}

function bqGeom() { const u = Math.min(W * 0.95, H * 0.62), base = H * 0.5 + 0.52 * u; return { u, cx: W / 2, base, ty: base - 0.4 * u }; }
function bouquet(x, bt) {
  const { u, cx, base, ty } = bqGeom();
  x.save(); x.translate(cx, base); x.rotate(Math.sin(bt * 1.3) * 0.012); x.translate(-cx, -base);
  const grow = ease(bt / 0.8);
  x.fillStyle = '#1f6b3d'; x.beginPath(); x.ellipse(cx, ty - 0.28 * u, 0.4 * u * grow, 0.36 * u * grow, 0, 0, 7); x.fill();
  // leaves + baby's breath
  for (let i = 0; i < 9; i++) { const a = -PI + (i + 0.5) * PI / 9, d = u * (0.3 + 0.04 * (i % 2));
    x.save(); x.translate(cx + Math.cos(a) * d * 1.05, ty - 0.28 * u + Math.sin(a) * d * 0.9); x.rotate(a + PI / 2);
    x.fillStyle = i % 2 ? '#2f9e5b' : '#237a46'; x.beginPath(); x.ellipse(0, 0, u * 0.05 * grow, u * 0.14 * grow, 0, 0, 7); x.fill(); x.restore(); }
  x.fillStyle = '#fff'; for (let i = 0; i < 26; i++) { const a = -PI + hash(i, 3) * PI, d = u * (0.32 + hash(i, 9) * 0.2);
    x.beginPath(); x.arc(cx + Math.cos(a) * d * 1.05, ty - 0.28 * u + Math.sin(a) * d, u * 0.012 * grow, 0, 7); x.fill(); }
  // wrapping cone
  const hw = 0.28 * u, g = x.createLinearGradient(cx - hw, 0, cx + hw, 0); g.addColorStop(0, '#e8d5b5'); g.addColorStop(0.5, '#fbf1de'); g.addColorStop(1, '#bfa27a');
  x.fillStyle = g; x.beginPath(); x.moveTo(cx - hw, ty); x.lineTo(cx + hw, ty); x.lineTo(cx, base); x.fill();
  const half = y => hw * (base - y) / (base - ty), y1 = ty + 0.13 * u, y2 = ty + 0.2 * u;
  x.fillStyle = '#ff5c9e'; x.beginPath(); x.moveTo(cx - half(y1), y1); x.lineTo(cx + half(y1), y1); x.lineTo(cx + half(y2), y2); x.lineTo(cx - half(y2), y2); x.fill();
  // roses
  const R = [[0, -0.3, 0.17], [-0.21, -0.2, 0.15], [0.21, -0.2, 0.15], [-0.11, -0.5, 0.14], [0.12, -0.5, 0.14], [-0.33, -0.38, 0.12], [0.33, -0.38, 0.12], [0, -0.08, 0.13]];
  R.forEach((q, i) => rose(x, cx + q[0] * u, ty + q[1] * u, q[2] * u, (bt - 1.6 - i * 0.28) / 1.1, i * 1.7));
  // bow
  const by = ty + 0.165 * u; x.fillStyle = '#ff5c9e'; for (const s of [-1, 1]) { x.save(); x.translate(cx + s * 0.07 * u, by); x.rotate(s * 0.4);
    x.beginPath(); x.ellipse(0, 0, 0.07 * u, 0.035 * u, 0, 0, 7); x.fill(); x.restore(); }
  x.fillStyle = '#ffc4dc'; x.beginPath(); x.arc(cx, by, 0.025 * u, 0, 7); x.fill(); x.restore();
}

/* ---------- ascii sampling ---------- */
function sample(c, x, buf) {
  const d = x.getImageData(0, 0, c.width, c.height).data, w = c.width;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    let sr = 0, sg = 0, sb = 0, sa = 0;
    for (let j = 0; j < S; j++) for (let i = 0; i < S; i++) { const k = ((r * S + j) * w + q * S + i) * 4, a = d[k + 3]; if (a) { sr += d[k] * a; sg += d[k + 1] * a; sb += d[k + 2] * a; sa += a; } }
    const n = r * cols + q;
    if (sa) { buf.r[n] = sr / sa; buf.g[n] = sg / sa; buf.b[n] = sb / sa; buf.a[n] = sa / (S * S * 255); } else buf.a[n] = 0;
  }
}


/* ---------- crisp handwritten message layer ---------- */
const tcv = document.createElement('canvas'), tx = tcv.getContext('2d');
const ocv = document.createElement('canvas'), ox = ocv.getContext('2d');
const mcv = document.createElement('canvas'), mx = mcv.getContext('2d');
let textReady = false, maskImg;
const SCRIPT = '"Great Vibes", "Apple Chancery", "Snell Roundhand", cursive', BODY = '"Dancing Script", "Apple Chancery", "Snell Roundhand", cursive';
function wrap(c, text, maxW) { const out = []; let line = ''; for (const w of text.split(' ')) { const t = line ? line + ' ' + w : w; if (c.measureText(t).width > maxW && line) { out.push(line); line = w; } else line = t; } out.push(line); return out; }
function buildText() {
  tcv.width = ocv.width = Math.round(W * dpr); tcv.height = ocv.height = Math.round(H * dpr);
  tx.setTransform(dpr, 0, 0, dpr, 0, 0); tx.clearRect(0, 0, W, H); tx.textAlign = 'center'; tx.textBaseline = 'middle';
  const R = big, mw = R.w * 0.78, maxH = R.h * 0.84;
  let hf = Math.min(R.w * 0.17, 64); tx.font = `${hf}px ${SCRIPT}`;
  while (tx.measureText(HEADING).width > R.w * 0.84 && hf > 14) { hf -= 1; tx.font = `${hf}px ${SCRIPT}`; }
  let bf = Math.min(R.w * 0.082, 30), lines, sf, total, gap1, gap2;
  for (; bf > 12; bf -= 1) { tx.font = `600 ${bf}px ${BODY}`; lines = wrap(tx, MESSAGE.body, mw);
    sf = Math.min(R.w * 0.095, 36); gap1 = hf * 0.7; gap2 = bf * 1.2;
    total = hf + gap1 + lines.length * bf * 1.5 + gap2 + sf; if (total <= maxH) break; }
  const y0 = R.cy - total / 2, cx = R.cx;
  // heading: soft outer glow, then a crisp gradient pass
  const g = tx.createLinearGradient(cx - R.w * 0.4, 0, cx + R.w * 0.4, 0); g.addColorStop(0, '#ffd9ea'); g.addColorStop(0.5, '#fff0f6'); g.addColorStop(1, '#ffb3d1');
  tx.font = `${hf}px ${SCRIPT}`; const hy = y0 + hf / 2;
  tx.shadowColor = 'rgba(255,47,134,0.95)'; tx.shadowBlur = 26; tx.fillStyle = '#ff7fb0'; tx.fillText(HEADING, cx, hy);
  tx.shadowColor = 'rgba(255,127,176,0.8)'; tx.shadowBlur = 8; tx.fillStyle = g; tx.fillText(HEADING, cx, hy); tx.shadowBlur = 0;
  // divider
  const dy = y0 + hf + gap1 * 0.5, dw = R.w * 0.3;
  for (const sd of [-1, 1]) { const lg = tx.createLinearGradient(cx, 0, cx + sd * dw, 0); lg.addColorStop(0, 'rgba(255,150,195,0.85)'); lg.addColorStop(1, 'rgba(255,150,195,0)');
    tx.strokeStyle = lg; tx.lineWidth = 1.2; tx.beginPath(); tx.moveTo(cx + sd * R.w * 0.045, dy); tx.lineTo(cx + sd * dw, dy); tx.stroke(); }
  heart(tx, cx, dy, R.w * 0.026, '#ff6fa8');
  // body
  tx.font = `600 ${bf}px ${BODY}`; tx.fillStyle = '#fff6ea'; tx.shadowColor = 'rgba(255,120,170,0.35)'; tx.shadowBlur = 6;
  const by = y0 + hf + gap1 + bf * 0.75; lines.forEach((l, i) => tx.fillText(l, cx, by + i * bf * 1.5)); tx.shadowBlur = 0;
  // sign-off, text and heart centred as one group
  tx.font = `${sf}px ${SCRIPT}`; const tw = tx.measureText(MESSAGE.sign).width, hw = sf * 0.5, grp = tw + sf * 0.35 + hw, sy = y0 + total - sf / 2;
  tx.textAlign = 'left'; tx.shadowColor = 'rgba(255,47,134,0.9)'; tx.shadowBlur = 12; tx.fillStyle = '#ffb8d4'; tx.fillText(MESSAGE.sign, cx - grp / 2, sy); tx.shadowBlur = 0; tx.textAlign = 'center';
  heart(tx, cx - grp / 2 + tw + sf * 0.35 + hw / 2, sy + sf * 0.05, sf * 0.26, '#ff5c9e');
  textReady = true;
}
if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px "Great Vibes"'), document.fonts.load('600 24px "Dancing Script"')]).then(() => { textReady = false; }).catch(() => {});

/* ---------- particles: petals, hearts, embers, sparkles ---------- */
const calm = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const sprite = rgb => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, `rgba(${rgb},1)`); gr.addColorStop(0.35, `rgba(${rgb},0.4)`); gr.addColorStop(1, `rgba(${rgb},0)`); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); return c; };
const GLOW_FIRE = sprite('255,140,40'), GLOW_PINK = sprite('255,110,175');
const PETAL_COL = ['#ff9ec4', '#ff7fb0', '#ffc4dc', '#ff8fbf'];
let hearts = [], petals = [], embers = [], sparkles = [], fireList = [];
const rnd = Math.random;
function newPetal(y) { const d = 0.4 + rnd() * 0.6; return { x: rnd() * W, y, d, vx: (rnd() - 0.5) * 14, vy: 16 + 30 * d, r: rnd() * 6, s: 3 + 5 * d, f: rnd() * 6, fs: 1.5 + rnd() * 2, c: PETAL_COL[(rnd() * 4) | 0] }; }
function initFloaters() {
  hearts = Array.from({ length: 22 }, () => ({ x: rnd() * W, y: rnd() * H, s: 5 + rnd() * 9, vy: 12 + rnd() * 22, ph: rnd() * 6, a: 0.15 + rnd() * 0.3 }));
  petals = Array.from({ length: calm ? 4 : 9 }, () => newPetal(rnd() * H));
  sparkles = Array.from({ length: 16 }, () => ({ a: rnd() * 6.28, r: Math.sqrt(rnd()), p: rnd() * 6, sp: 1.5 + rnd() * 2 }));
  embers = [];
}

/* ---------- state ---------- */
const hint = document.getElementById('hint'), intro = document.getElementById('intro'), replay = document.getElementById('replay');
let phase = 'closed', t0 = 0, burnStart = 0, last = performance.now(), frameNo = 0, G = ctx, lastCol = '';
const OPEN = 3.2, BURN = 5, BAND = 0.07;
const FIRE_STOPS = [[0, 255, 244, 200], [0.35, 255, 196, 0], [0.7, 255, 106, 0], [1, 190, 35, 0]];
function fireColor(t) { for (let i = 1; i < FIRE_STOPS.length; i++) { const a = FIRE_STOPS[i - 1], b = FIRE_STOPS[i]; if (t <= b[0]) { const k = (t - a[0]) / (b[0] - a[0]);
  return `rgb(${lerp(a[1], b[1], k) | 0},${lerp(a[2], b[2], k) | 0},${lerp(a[3], b[3], k) | 0})`; } } return 'rgb(190,35,0)'; }
function go(p) { phase = p; t0 = performance.now(); dirty = true; }
function setHint(t) { hint.textContent = t; hint.classList.remove('off'); }
function reset() { go('closed'); title.classList.remove('show'); replay.classList.remove('show'); intro.classList.add('show'); setHint('A little surprise for you'); embers = []; fireList = []; burnt.fill(0); }
addEventListener('pointerdown', e => {
  if (e.target.closest && e.target.closest('#replay')) return;
  if (phase === 'closed') { go('opening'); hint.classList.add('off'); intro.classList.remove('show'); }
  else if (phase === 'letter') { go('burning'); burnStart = t0; burnt.fill(0); hint.classList.add('off'); }
});
replay.addEventListener('click', reset);
title.textContent = 'Happy Birthday';
requestAnimationFrame(() => intro.classList.add('show'));
addEventListener('resize', resize);

function radial(cx, cy, r, a, rgb) { if (a <= 0.003) return; const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, `rgba(${rgb},${a})`); g.addColorStop(1, `rgba(${rgb},0)`); ctx.fillStyle = g; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); }
const put = (c, r, chr, col) => { if (col !== lastCol) { G.fillStyle = col; lastCol = col; } G.fillText(chr, c * cw + cw / 2, r * ch + ch / 2); };
const draw = (buf, n, c, r) => { const R = buf.r[n], Gc = buf.g[n], B = buf.b[n], lum = (0.3 * R + 0.59 * Gc + 0.11 * B) / 255;
  const idx = Math.round(clamp(buf.a[n] * Math.pow(lum, 1.1) * 1.15) * (RAMP.length - 1)); if (!idx) return false;
  put(c, r, RAMP[idx], `rgb(${R | 0},${Gc | 0},${B | 0})`); return true; };

function composeAscii(now, bt) {
  actx.setTransform(dpr, 0, 0, dpr, 0, 0); actx.clearRect(0, 0, W, H);
  actx.font = `bold ${cw / 0.6}px "Courier New", monospace`; actx.textAlign = 'center'; actx.textBaseline = 'middle';
  G = actx; lastCol = ''; occupied.fill(0); fireList.length = 0;
  const showB = phase !== 'bouquet', showA = bt > 0, burning = phase === 'burning', spark = Math.floor(now / 70);
  const p = burning ? lerp(-0.1, 1.25, ease(bt / BURN)) : 2, maxE = calm ? 60 : 130;
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const n = r * cols + c; let done = false, revealA = phase === 'bouquet';
    if (burning && !burnt[n]) {
      const v0 = burnV[n] - p;
      if (v0 > 0.3) { if (bufB.a[n] > 0.1) done = draw(bufB, n, c, r); }
      else {
        const v = v0 + (vnoise(c * 0.2, r * 0.2 - now * 0.0012) - 0.5) * 0.05;
        if (v <= 0) burnt[n] = 1;
        else if (bufB.a[n] > 0.1) {
          if (v > 2 * BAND) done = draw(bufB, n, c, r);
          else if (v > BAND) { const k = 0.3, glow = hash(c * 7 + spark, r) < 0.1; put(c, r, glow ? '.' : ':', glow ? '#ff5a1f' : `rgb(${bufB.r[n] * k | 0},${bufB.g[n] * k * 0.7 | 0},${bufB.b[n] * k * 0.5 | 0})`); done = true; }
          else { const t = v / BAND, h = hash(c + spark, r), chars = t < 0.45 ? '@#%&' : '*^+x';
            put(c, r, chars[(h * 4) | 0], fireColor(t)); done = true;
            if (fireList.length < 240 && h > 0.7) fireList.push(c * cw + cw / 2, r * ch + ch / 2);
            if (rnd() < 0.016 && embers.length < maxE) embers.push({ x: c * cw + rnd() * cw, y: r * ch, vx: (rnd() - 0.5) * 26, vy: -18 - rnd() * 50, life: 1, k: 0.5 + rnd() * 0.9, ph: rnd() * 6 }); }
        }
      }
    } else if (showB && !burning && bufB.a[n] > 0.1) done = draw(bufB, n, c, r);
    if (burning && burnt[n]) revealA = true;
    if (!done && showA && revealA && bufA.a[n] > 0.1) done = draw(bufA, n, c, r);
    if (done) occupied[n] = 1;
  }
  G = ctx; lastCol = '';
}

function frame(now) {
  frameNo++; const dt = Math.min(0.05, (now - last) / 1000); last = now; const el = (now - t0) / 1000;
  if (phase === 'opening' && el >= OPEN) { go('letter'); setHint('tap again'); }
  const bt = phase === 'burning' || phase === 'bouquet' ? (now - burnStart) / 1000 : 0;
  if (phase === 'burning' && bt >= BURN) phase = 'bouquet';
  if (bt > BURN) title.classList.add('show');
  if (bt > BURN + 2.5) replay.classList.add('show');

  // scene B (envelope / letter) only when it changes; it is static while the letter burns
  if (phase === 'opening' || (dirty && (phase === 'closed' || phase === 'letter'))) {
    setup(xB);
    if (phase === 'closed') envelope(xB, env, 0, null, 0, 1, 0);
    else if (phase === 'opening') {
      const t = el / OPEN, flap = ease(t / 0.28), rise = ease((t - 0.28) / 0.3), ex = ease((t - 0.6) / 0.4);
      const sm = { cx: env.cx, cy: env.cy - env.h * 0.05 - rise * env.h * 0.62, w: env.w * 0.88, h: env.h * 0.9 };
      const L = { cx: lerp(sm.cx, big.cx, ex), cy: lerp(sm.cy, big.cy, ex), w: lerp(sm.w, big.w, ex), h: lerp(sm.h, big.h, ex) };
      envelope(xB, env, flap, rise > 0 ? L : null, 0, 1 - ex, ex * H * 0.3);
      if (ex > 0) { xB.save(); xB.globalAlpha = ex; paper(xB, L); xB.restore(); }
    } else paper(xB, big);
    sample(cB, xB, bufB);
  }
  // ASCII layer is cached; redrawn only when something in it moves
  if (dirty || phase === 'opening' || ((phase === 'burning' || phase === 'bouquet') && frameNo % 2 === 0)) {
    if (bt > 0) { setup(xA); bouquet(xA, bt); sample(cA, xA, bufA); }
    composeAscii(now, bt); dirty = false;
  }

  // ----- paint -----
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  const bq = bqGeom(), breathe = Math.sin(now / 1300);
  if (phase === 'closed') radial(env.cx, env.cy, Math.min(W, H) * 0.5, 0.2 + 0.04 * breathe, '255,60,140');
  else if (phase === 'opening') radial(env.cx, env.cy, Math.min(W, H) * 0.5, 0.2 * (1 - ease(el / OPEN)), '255,60,140');
  else if (phase === 'letter' || phase === 'burning') radial(big.cx, big.cy, Math.max(big.w, big.h) * 0.8, 0.06, '255,60,140');
  if (bt > 0) { const k = ease((bt - BURN + 2.5) / 3.5); radial(bq.cx, bq.ty - 0.28 * bq.u, bq.u * 1.05, (phase === 'bouquet' ? 0.2 + 0.03 * breathe : 0.1 * ease(bt / BURN)) * (0.4 + 0.6 * k), '255,60,140'); }
  ctx.drawImage(acv, 0, 0, W, H);

  ctx.font = `bold ${cw / 0.6}px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; lastCol = '';
  for (const s of stars) { const n = s.r * cols + s.c; if (occupied[n]) continue; const tw = 0.5 + 0.5 * Math.sin(now / 600 + s.p), a = 0.15 + 0.5 * tw * (0.4 + s.s);
    put(s.c, s.r, s.s > 0.8 ? '+' : s.s > 0.4 ? '.' : "'", `rgba(190,205,255,${a.toFixed(2)})`); }

  // crisp message, fading softly ahead of the fire
  const tA = phase === 'letter' ? ease(el / 0.9) : phase === 'burning' ? 1 : 0;
  if (tA > 0) {
    if (!textReady) buildText();
    const rx = Math.max(0, big.cx - big.w / 2 - 12), ry = Math.max(0, big.cy - big.h / 2 - 12), rw = Math.min(W - rx, big.w + 24), rh = Math.min(H - ry, big.h + 24);
    const dx = rx * dpr, dy = ry * dpr, dw = rw * dpr, dh = rh * dpr;
    ox.globalCompositeOperation = 'source-over'; ox.globalAlpha = 1; ox.clearRect(dx, dy, dw, dh); ox.globalAlpha = tA; ox.drawImage(tcv, dx, dy, dw, dh, dx, dy, dw, dh); ox.globalAlpha = 1;
    if (phase === 'burning') {
      if (frameNo % 2 === 0) { const p = lerp(-0.1, 1.25, ease(bt / BURN)), m = maskImg.data;
        for (let n = 0; n < burnV.length; n++) m[n * 4 + 3] = clamp((0.26 - (burnV[n] - p)) / 0.15) * 255;
        mx.putImageData(maskImg, 0, 0); }
      ox.globalCompositeOperation = 'destination-out'; ox.imageSmoothingEnabled = true;
      ox.drawImage(mcv, rx / cw, ry / ch, rw / cw, rh / ch, dx, dy, dw, dh); ox.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(ocv, dx, dy, dw, dh, rx, ry, rw, rh);
  }

  // fire glow + embers (additive)
  ctx.globalCompositeOperation = 'lighter';
  if (phase === 'burning') for (let i = 0; i < fireList.length; i += 6) { ctx.globalAlpha = 0.3; ctx.drawImage(GLOW_FIRE, fireList[i] - cw * 4, fireList[i + 1] - cw * 4, cw * 8, cw * 8); }
  embers = embers.filter(e => (e.life -= dt * 0.55) > 0);
  for (const e of embers) { e.x += (e.vx + Math.sin(now / 400 + e.ph) * 14) * dt; e.y += e.vy * dt; e.vy -= 6 * dt;
    const fl = 0.6 + 0.4 * Math.sin(now / 60 + e.ph), sz = (2.5 + 4 * e.k) * (0.4 + 0.6 * e.life); ctx.globalAlpha = clamp(e.life * 1.1) * fl * 0.8; ctx.drawImage(GLOW_FIRE, e.x - sz, e.y - sz, sz * 2, sz * 2);
    ctx.globalAlpha = clamp(e.life * 1.5); ctx.fillStyle = e.life > 0.5 ? '#ffe3a0' : '#ff8a3d'; ctx.fillRect(e.x - 0.8, e.y - 0.8, 1.6, 1.6); }
  // sparkles over the bouquet
  if (phase === 'bouquet' && bt > BURN - 1) { const k = ease((bt - BURN + 1) / 2);
    for (const q of sparkles) { const tw = Math.sin(now / 1000 * q.sp + q.p), a = Math.max(0, tw) * k; if (a < 0.05) continue;
      const x = bq.cx + Math.cos(q.a) * q.r * bq.u * 0.42, y = bq.ty - 0.3 * bq.u + Math.sin(q.a) * q.r * bq.u * 0.4, sz = 5 + 6 * a;
      ctx.globalAlpha = a * 0.8; ctx.drawImage(GLOW_PINK, x - sz * 1.6, y - sz * 1.6, sz * 3.2, sz * 3.2);
      ctx.globalAlpha = a; ctx.fillStyle = '#fff'; ctx.fillRect(x - sz * 0.6, y - 0.5, sz * 1.2, 1); ctx.fillRect(x - 0.5, y - sz * 0.6, 1, sz * 1.2); } }
  ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;

  // floating hearts (letter onwards) and falling petals (always)
  if (phase !== 'closed' && phase !== 'opening') { const nh = phase === 'bouquet' ? 22 : 12;
    for (let i = 0; i < nh; i++) { const h = hearts[i]; h.y -= h.vy * dt; if (h.y < -20) { h.y = H + 20; h.x = rnd() * W; }
      ctx.globalAlpha = h.a * (phase === 'bouquet' ? 1.3 : 1); heart(ctx, h.x + Math.sin(now / 900 + h.ph) * 10, h.y, h.s, '#ff6fa8'); } }
  const maxP = calm ? 8 : phase === 'bouquet' ? 34 : phase === 'burning' ? 20 : 14;
  if (petals.length < maxP && rnd() < (phase === 'bouquet' ? 0.1 : 0.05)) petals.push(newPetal(-12));
  petals = petals.filter(q => q.y < H + 20);
  for (const q of petals) { q.x += (q.vx + Math.sin(now / 900 + q.r) * 12) * dt; q.y += q.vy * dt; q.r += dt * 1.2; q.f += dt * q.fs;
    ctx.globalAlpha = 0.35 + 0.45 * q.d; ctx.fillStyle = q.c; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r);
    ctx.beginPath(); ctx.ellipse(0, 0, q.s * (0.35 + 0.65 * Math.abs(Math.cos(q.f))), q.s * 0.62, 0, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.globalAlpha = 1;
  requestAnimationFrame(frame);
}
resize(); requestAnimationFrame(frame);
})();
