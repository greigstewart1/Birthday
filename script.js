(() => {
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const forEl = { style: {} }, hint = document.getElementById('hint'), title = document.getElementById('title');
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

let W, H, dpr, cw, ch, cols, rows, stars, burnV, bufB, bufA, env, big;

function hash(x, y) { let h = Math.imul(x, 374761393) + Math.imul(y, 668265263); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) { const xi = Math.floor(x), yi = Math.floor(y), fx = ease(x - xi), fy = ease(y - yi);
  return lerp(lerp(hash(xi, yi), hash(xi + 1, yi), fx), lerp(hash(xi, yi + 1), hash(xi + 1, yi + 1), fx), fy); }

function resize() {
  dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
  cw = clamp(Math.round(W / 105), 4, 9); ch = Math.round(cw * 1.7);
  cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
  cv.width = W * dpr; cv.height = H * dpr;
  for (const c of [cB, cA]) { c.width = cols * S; c.height = rows * S; }
  const n = cols * rows;
  bufB = { r: new Float32Array(n), g: new Float32Array(n), b: new Float32Array(n), a: new Float32Array(n) };
  bufA = { r: new Float32Array(n), g: new Float32Array(n), b: new Float32Array(n), a: new Float32Array(n) };
  const ew = Math.min(W * 0.7, 460);
  env = { cx: W / 2, cy: H * 0.52, w: ew, h: ew * 0.64 };
  const lw = Math.min(W * 0.88, 560);
  big = { cx: W / 2, cy: H * 0.5, w: lw, h: Math.min(H * 0.62, lw * 1.15) };
  const ox = big.cx, oy = big.cy + big.h * 0.5, maxD = Math.hypot(Math.max(ox, W - ox), Math.max(oy, H - oy));
  burnV = new Float32Array(n);
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
  x.strokeStyle = '#6a4a33'; x.lineWidth = Math.max(1.5, R.h * 0.004);
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

function bouquet(x, bt) {
  const u = Math.min(W * 0.95, H * 0.62), cx = W / 2, base = H * 0.5 + 0.52 * u, ty = base - 0.4 * u;
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
  R.forEach((q, i) => rose(x, cx + q[0] * u, ty + q[1] * u, q[2] * u, (bt - 0.8 - i * 0.25) / 1.0, i * 1.7));
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
  const R = big, mw = R.w * 0.82;
  let hf = R.w * 0.2; tx.font = `${hf}px ${SCRIPT}`; while (tx.measureText(HEADING).width > mw && hf > 14) { hf -= 1; tx.font = `${hf}px ${SCRIPT}`; }
  tx.shadowColor = '#ff4f93'; tx.shadowBlur = 14; tx.fillStyle = '#ffb8d4'; tx.fillText(HEADING, R.cx, R.cy - R.h * 0.36);
  tx.shadowBlur = 0;
  let bf = R.w * 0.075, lines; const room = R.h * 0.44;
  for (; bf > 12; bf -= 1) { tx.font = `600 ${bf}px ${BODY}`; lines = wrap(tx, MESSAGE.body, mw); if (lines.length * bf * 1.4 <= room) break; }
  tx.fillStyle = '#fff3e2'; const y0 = R.cy - R.h * 0.22 + bf * 0.7;
  lines.forEach((l, i) => tx.fillText(l, R.cx, y0 + i * bf * 1.4));
  const sf = R.w * 0.09; tx.font = `${sf}px ${SCRIPT}`; tx.fillStyle = '#ffb8d4'; tx.shadowColor = '#ff4f93'; tx.shadowBlur = 10;
  tx.fillText(MESSAGE.sign, R.cx - sf * 0.4, R.cy + R.h * 0.4); tx.shadowBlur = 0;
  heart(tx, R.cx + tx.measureText(MESSAGE.sign).width / 2 + sf * 0.3, R.cy + R.h * 0.4 + 2, sf * 0.28, '#ff5c9e');
  textReady = true;
}
if (document.fonts && document.fonts.load) Promise.all([document.fonts.load('40px "Great Vibes"'), document.fonts.load('600 24px "Dancing Script"')]).then(() => { textReady = false; }).catch(() => {});

/* ---------- floating hearts and petals ---------- */
let hearts = [], petals = [];
const initFloaters = () => { hearts = Array.from({ length: 16 }, () => ({ x: Math.random() * W, y: Math.random() * H, s: 5 + Math.random() * 9, vy: 12 + Math.random() * 22, ph: Math.random() * 6, a: 0.15 + Math.random() * 0.3 })); petals = []; };

/* ---------- state ---------- */
let phase = 'closed', t0 = 0, burnStart = 0, embers = [], last = performance.now();
const OPEN = 3.2, BURN = 4.4, FIRE = ['#ff3d00', '#ff8a00', '#ffc400', '#fff176'], FCH = '^*#%&@+';
function go(p) { phase = p; t0 = performance.now(); }
addEventListener('pointerdown', () => {
  if (phase === 'closed') { go('opening'); hint.style.opacity = 0; forEl.style.opacity = 0; }
  else if (phase === 'letter') { go('burning'); burnStart = t0; hint.style.opacity = 0; }
  else if (phase === 'bouquet' && (performance.now() - burnStart) / 1000 > 7) { go('closed'); title.style.opacity = 0; hint.textContent = 'tap to open'; hint.style.opacity = ''; forEl.style.opacity = ''; embers = []; }
});
title.textContent = 'Happy Birthday';
addEventListener('resize', resize);

function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000); last = now; const el = (now - t0) / 1000;
  if (phase === 'opening' && el >= OPEN) { go('letter'); hint.textContent = 'tap again'; hint.style.opacity = ''; }
  const bt = phase === 'burning' || phase === 'bouquet' ? (now - burnStart) / 1000 : 0;
  if (phase === 'burning' && bt >= BURN) { phase = 'bouquet'; hint.textContent = 'tap to replay'; }
  if (bt > 3) title.style.opacity = 1;
  if (bt > 9) hint.style.opacity = '';

  // scene B: envelope / letter
  const showB = phase !== 'bouquet';
  if (showB) {
    setup(xB); const bob = Math.sin(now / 700) * 4;
    if (phase === 'closed') envelope(xB, { ...env, cy: env.cy + bob }, 0, null, 0, 1, 0);
    else if (phase === 'opening') {
      const t = el / OPEN, flap = ease(t / 0.28), rise = ease((t - 0.28) / 0.3), ex = ease((t - 0.6) / 0.4);
      const sm = { cx: env.cx, cy: env.cy - env.h * 0.05 - rise * env.h * 0.62, w: env.w * 0.88, h: env.h * 0.9 };
      const L = { cx: lerp(sm.cx, big.cx, ex), cy: lerp(sm.cy, big.cy, ex), w: lerp(sm.w, big.w, ex), h: lerp(sm.h, big.h, ex) };
      envelope(xB, env, flap, rise > 0 ? L : null, ease((t - 0.8) / 0.2), 1 - ex, ex * H * 0.3);
      if (ex > 0) { xB.save(); xB.globalAlpha = ex; paper(xB, L, ease((t - 0.8) / 0.2)); xB.restore(); }
    } else paper(xB, { ...big, cy: big.cy + (phase === 'letter' ? Math.sin(now / 900) * 4 : 0) }, 1);
    sample(cB, xB, bufB);
  }
  // scene A: bouquet
  const showA = bt > 0;
  if (showA) { setup(xA); bouquet(xA, bt); sample(cA, xA, bufA); }

  // compose
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  ctx.font = `bold ${cw / 0.6}px "Courier New", monospace`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const occupied = new Uint8Array(cols * rows);
  const p = phase === 'burning' ? lerp(-0.1, 1.25, ease(bt / BURN)) : phase === 'bouquet' ? 2 : -1;
  const spark = Math.floor(now / 70);
  let lastCol = '';
  const put = (c, r, chr, col) => { if (col !== lastCol) { ctx.fillStyle = col; lastCol = col; } ctx.fillText(chr, c * cw + cw / 2, r * ch + ch / 2); };
  const draw = (buf, n, c, r) => { const R = buf.r[n], G = buf.g[n], B = buf.b[n], lum = (0.3 * R + 0.59 * G + 0.11 * B) / 255;
    const idx = Math.round(clamp(buf.a[n] * Math.pow(lum, 1.1) * 1.15) * (RAMP.length - 1)); if (!idx) return false;
    put(c, r, RAMP[idx], `rgb(${R | 0},${G | 0},${B | 0})`); return true; };
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
    const n = r * cols + c; let done = false;
    if (showB && bufB.a[n] > 0.1) {
      const v = burnV[n] - p;
      if (v > 0.14 || p < 0 && phase !== 'burning') done = draw(bufB, n, c, r);
      else if (v > 0.07) { const k = 0.3; put(c, r, ':', `rgb(${bufB.r[n] * k | 0},${bufB.g[n] * k * 0.7 | 0},${bufB.b[n] * k * 0.5 | 0})`); done = true; }
      else if (v > 0) { const h = hash(c + spark, r); put(c, r, FCH[h * FCH.length | 0], FIRE[hash(r, c + spark) * 4 | 0]); done = true;
        if (Math.random() < 0.012 && embers.length < 250) embers.push({ x: c * cw, y: r * ch, vx: (Math.random() - 0.5) * 30, vy: -20 - Math.random() * 60, life: 1 }); }
    }
    if (!done && showA && bufA.a[n] > 0.1) done = draw(bufA, n, c, r);
    if (done) occupied[n] = 1;
  }
  // stars
  for (const s of stars) { const n = s.r * cols + s.c; if (occupied[n]) continue; const tw = 0.5 + 0.5 * Math.sin(now / 600 + s.p), a = 0.15 + 0.5 * tw * (0.4 + s.s);
    put(s.c, s.r, s.s > 0.8 ? '+' : s.s > 0.4 ? '.' : "'", `rgba(190,205,255,${a.toFixed(2)})`); }
  // crisp message
  const tA = phase === 'letter' ? ease(el / 0.9) : phase === 'burning' && bt < BURN ? 1 : 0;
  if (tA > 0) {
    if (!textReady) buildText();
    ox.globalCompositeOperation = 'source-over'; ox.globalAlpha = 1; ox.clearRect(0, 0, ocv.width, ocv.height); ox.globalAlpha = tA; ox.drawImage(tcv, 0, 0); ox.globalAlpha = 1;
    if (phase === 'burning') {
      const m = maskImg.data; for (let n = 0; n < burnV.length; n++) m[n * 4 + 3] = burnV[n] - p <= 0.14 ? 255 : 0;
      mx.putImageData(maskImg, 0, 0); ox.globalCompositeOperation = 'destination-out'; ox.imageSmoothingEnabled = false;
      ox.drawImage(mcv, 0, 0, cols * cw * dpr, rows * ch * dpr); ox.globalCompositeOperation = 'source-over';
    }
    ctx.drawImage(ocv, 0, 0, W, H);
  }
  // hearts and petals
  if (phase !== 'closed') for (const h of hearts) { h.y -= h.vy * dt; if (h.y < -20) { h.y = H + 20; h.x = Math.random() * W; }
    ctx.globalAlpha = h.a; heart(ctx, h.x + Math.sin(now / 900 + h.ph) * 10, h.y, h.s, '#ff6fa8'); }
  if (bt > 3.5 && petals.length < 28 && Math.random() < 0.12) petals.push({ x: Math.random() * W, y: -10, vx: (Math.random() - 0.5) * 20, vy: 25 + Math.random() * 30, r: Math.random() * 6, s: 3 + Math.random() * 4 });
  petals = petals.filter(q => q.y < H + 20);
  for (const q of petals) { q.x += q.vx * dt + Math.sin(now / 700 + q.r) * 0.4; q.y += q.vy * dt; q.r += dt * 2; ctx.globalAlpha = 0.75; ctx.fillStyle = '#ff9ec4'; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.r); ctx.beginPath(); ctx.ellipse(0, 0, q.s, q.s * 0.55, 0, 0, 7); ctx.fill(); ctx.restore(); }
  ctx.globalAlpha = 1; lastCol = '';
  // embers
  embers = embers.filter(e => (e.life -= dt * 0.7) > 0);
  for (const e of embers) { e.x += e.vx * dt; e.y += e.vy * dt; put(Math.floor(e.x / cw), Math.floor(e.y / ch), e.life > 0.5 ? '*' : '.', e.life > 0.6 ? '#ffb300' : '#ff5722'); }
  requestAnimationFrame(frame);
}
resize(); requestAnimationFrame(frame);
})();
