// YZ BÜLTENİ · "Bir Sorudan Sohbete" — the history of AI as one evening bulletin. Broadcast News Package, 1080×1920 vertical.
// Canvas 2D, deterministic render(t). The timeline is built from the narration's real durations (vo/dur.json): every shot
// lasts as long as its lines plus a tail, and every cut is snapped to the 120 BPM grid (beat 0 = 1.5 s).
// Clean frame: no burned-in subtitles, no crawl; subtitles ship as a sidecar .srt (tools/subs.py).
const W = 1080, H = 1920;
let DUR = 120;
const cv = document.getElementById('out'); const ctx = cv.getContext('2d');

const C = {
  ink: '#121417', ink2: '#1B1E23', ink3: '#22262C', line: '#454B55',
  lemon: '#F2CF1D', lemonL: '#F8DE4A', lemonD: '#D8B30C', gold: '#D4B064', olive: '#6E5A1E',
  paper: '#F4F1E8', white: '#FFFFFF', grey: '#C9CCD2', grey2: '#7D838D',
};
const F = { b8: s => `800 ${s}px Barlow`, b6: s => `600 ${s}px Barlow`, b6i: s => `italic 600 ${s}px Barlow`, mono: s => `500 ${s}px Plex` };

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const eo = x => 1 - Math.pow(1 - x, 3);
const eio = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
const back = (x, s = 1.70158) => 1 + (s + 1) * Math.pow(x - 1, 3) + s * Math.pow(x - 1, 2);
function hash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
function mixc(a, b, k) { const pa = a.match(/\w\w/g).map(h => parseInt(h, 16)), pb = b.match(/\w\w/g).map(h => parseInt(h, 16)); return `rgb(${pa.map((v, i) => Math.round(lerp(v, pb[i], k))).join(',')})`; }

// ============ Timeline from the voice ============
// [shot, narration lines, minimum length, transition in, lead before the first line, tail after the last line]
const PLAN = [
  ['sting', [], 1.5, 'none', 0, 0],
  ['rundown', ['v1'], 5.5, 'wipe', .3, 1.4],
  ['eniac', ['v2'], 4.5, 'wipe', .15, .9],
  ['turing', ['v3'], 5.0, 'cut', .15, .7],
  ['quote', ['v4'], 6.5, 'cut', .3, 2.3],
  ['dart', ['v5'], 8.0, 'cut', .2, 1.8],
  ['winter', ['v6', 'v7'], 9.0, 'wipe', .2, 1.9],
  ['deepblue', ['v8'], 6.0, 'wipe', .15, .9],
  ['chess', ['v9', 'v10'], 9.0, 'cut', .15, 1.2],
  ['go', ['v11'], 6.5, 'cut', .15, 2.0],
  ['vision', ['v12', 'v13', 'v14'], 18, 'wipe', .2, 2.6],
  ['transformer', ['v15'], 6.0, 'wipe', .15, 1.0],
  ['scale', ['v16'], 8.5, 'cut', .15, 2.2],
  ['chatgpt', ['v17'], 6.0, 'cut', .15, 2.0],
  ['recap', ['v18'], 5.0, 'wipe', .2, 1.6],
  ['end', [], 5.5, 'slant', 0, 0],
];
const GAP = .4, T0 = 1.5, BEAT = .5;
const S = {}, D = {}, V = {}, TIN = {};
let TEXTS_VO = {};
function buildTimeline(dur) {
  let t = 0;
  for (const [id, lines, min, tin, lead, tail] of PLAN) {
    S[id] = t; TIN[id] = tin;
    let a = t + lead;
    lines.forEach((l, i) => { V[l] = { a: Math.round(a * 1000) / 1000, d: dur[l] }; a += dur[l] + (i < lines.length - 1 ? GAP : 0); });
    let end = Math.max(t + min, a + tail);
    if (id !== 'sting' && id !== 'end') end = T0 + Math.ceil((end - T0) / BEAT - 1e-6) * BEAT;
    D[id] = end - t; t = end;
  }
  DUR = Math.round(t * 1000) / 1000;
}
const vt = (id, f) => V[id].a + V[id].d * f;            // a moment inside a narration line (fraction of its length)
const ve = id => V[id].a + V[id].d;                      // end of a line
function shotAt(t) { let id = PLAN[0][0]; for (const [k] of PLAN) if (t >= S[k]) id = k; return id; }

// ============ Text and images ============
let TX = [];
function text(s, x, y, font, color, align = 'left', ls = 0, id = null, pass = false) {
  ctx.font = font; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = 'alphabetic';
  ctx.letterSpacing = ls + 'px'; ctx.fillText(s, x, y);
  const w = ctx.measureText(s).width; ctx.letterSpacing = '0px';
  if (id) {
    const m = ctx.getTransform(); const x0 = align === 'left' ? x : align === 'right' ? x - w : x - w / 2; const fs = parseInt(font.match(/(\d+)px/)[1]);
    const p0 = m.transformPoint({ x: x0, y: y - fs }), p1 = m.transformPoint({ x: x0 + w, y: y + 8 });
    const o = { id, text: s, x0: Math.min(p0.x, p1.x), y0: Math.min(p0.y, p1.y), x1: Math.max(p0.x, p1.x), y1: Math.max(p0.y, p1.y) };
    if (pass) o.pass = true; TX.push(o);
  }
  return w;
}
function tw(s, font, ls = 0) { ctx.font = font; ctx.letterSpacing = ls + 'px'; const w = ctx.measureText(s).width; ctx.letterSpacing = '0px'; return w; }
// mask push: the block slides up from below a clip rectangle that ends at its baseline
function push(y, h, k, fn, x0 = 0, x1 = W) { if (k <= 0) return; ctx.save(); ctx.beginPath(); ctx.rect(x0, y - h, x1 - x0, h + 22); ctx.clip(); ctx.translate(0, (1 - k) * (h + 22)); fn(); ctx.restore(); }

const IM = {};
function loadImg(src) { return new Promise((ok, no) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => no(src); i.src = src; }); }
function photo(img, fx, fy, s, rx = 0, ry = 0, rw = W, rh = H, filter = null) {
  s = Math.max(s, rw / img.width, rh / img.height);
  let ox = rx + rw / 2 - fx * s, oy = ry + rh / 2 - fy * s;
  ox = Math.min(rx, Math.max(rx + rw - img.width * s, ox)); oy = Math.min(ry, Math.max(ry + rh - img.height * s, oy));
  ctx.save(); ctx.beginPath(); ctx.rect(rx, ry, rw, rh); ctx.clip(); if (filter) ctx.filter = filter;
  ctx.drawImage(img, ox, oy, img.width * s, img.height * s); ctx.restore();
}
const GR = [];
function makeGrain() {
  for (let k = 0; k < 6; k++) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const d = g.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = 128 + (hash(i * .37 + k * 9.1) + hash(i * .11 + k) - 1) * 150; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    g.putImageData(d, 0, 0); GR.push(c);
  }
}
function grain(t, a = .07, ry = 0, rh = H) {
  const f = Math.floor(t * 24), c = GR[f % GR.length];
  ctx.save(); ctx.beginPath(); ctx.rect(0, ry, W, rh); ctx.clip(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = a;
  const ox = -Math.floor(hash(f) * 256), oy = -Math.floor(hash(f + 7) * 256);
  for (let x = ox; x < W; x += 256) for (let y = oy; y < H; y += 256) ctx.drawImage(c, x, y);
  ctx.restore();
}
function vignette(a = .5, cy = H / 2) {
  const g = ctx.createRadialGradient(W / 2, cy, H * .2, W / 2, cy, H * .7);
  g.addColorStop(0, 'rgba(8,9,11,0)'); g.addColorStop(1, `rgba(8,9,11,${a})`); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
}

// ============ Brand: plate, wordmark ============
function plate(cx, cy, s, glint = -1, drop = 1) {
  const w = 520 * s, h = 180 * s, k = h * .28;
  ctx.save(); ctx.translate(cx, cy);
  const path = new Path2D(); path.moveTo(-w / 2 + k, -h / 2); path.lineTo(w / 2 + k, -h / 2); path.lineTo(w / 2 - k, h / 2); path.lineTo(-w / 2 - k, h / 2); path.closePath();
  const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2); g.addColorStop(0, C.lemonL); g.addColorStop(1, C.lemonD);
  ctx.fillStyle = g; ctx.fill(path); ctx.save(); ctx.clip(path);
  const gx = -w / 2 - k;
  ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(gx + 2 * k, -h / 2); ctx.lineTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.lineTo(gx, h / 2); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(gx + 2 * k + w * .085, -h / 2); ctx.lineTo(gx + 2 * k + w * .11, -h / 2); ctx.lineTo(gx + w * .11, h / 2); ctx.lineTo(gx + w * .085, h / 2); ctx.fill();
  ctx.font = F.b8(h * .8); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'; ctx.letterSpacing = (h * .06) + 'px';
  let x = -w * .12;
  ['Y', 'Z'].forEach((L, i) => {
    const d = clamp(drop * 3 - i); const yy = h * .29 + (1 - eo(d)) * -h * 1.1;
    ctx.save(); ctx.globalAlpha *= clamp(d * 3); ctx.fillStyle = C.ink; ctx.fillText(L, x, yy); ctx.restore();
    x += ctx.measureText(L).width;
  });
  ctx.letterSpacing = '0px';
  if (glint >= 0 && glint <= 1) {
    const gx2 = lerp(-w, w, glint); const gg = ctx.createLinearGradient(gx2 - 80 * s, 0, gx2 + 80 * s, 0);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(.5, 'rgba(255,255,255,.6)'); gg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gg; ctx.fillRect(-w, -h, w * 2, h * 2);
  }
  ctx.restore(); ctx.restore();
}
function wordmark(x, y, size, align = 'center', id = null) {
  const parts = [['YZ ', C.white], ['BÜLTENİ', C.lemon]], ls = size * .12;
  const tot = parts.reduce((a, [s]) => a + tw(s, F.b8(size), ls), 0);
  let cx = align === 'center' ? x - tot / 2 : align === 'right' ? x - tot : x; const x0 = cx;
  for (const [s, c] of parts) cx += text(s, cx, y, F.b8(size), c, 'left', ls);
  if (id) TX.push({ id, text: 'YZ BÜLTENİ', x0, y0: y - size, x1: cx, y1: y + 8 });
}

// ============ Package layer (drawn per picture, so a wipe brushes it over) ============
const STRAPS = {
  eniac: ['SORU', 'Makineler düşünebilir mi?', '1950–1956 · İLK FİKİRLER'],
  turing: ['KİŞİ', 'Alan Turing', 'MATEMATİKÇİ · 1912–1954'],
  quote: ['SORU', 'Turing\'in sorusu', 'MIND DERGİSİ · EKİM 1950'],
  dart: ['SORU', 'Alanın adı konuyor: yapay zekâ', 'DARTMOUTH ÖNERİSİ · 1955'],
  winter: ['KIŞ', 'Lighthill raporu alanı eleştiriyor', 'İNGİLTERE · 1973'],
  deepblue: ['OYUN', 'Deep Blue, Kasparov\'un karşısında', 'NEW YORK · MAYIS 1997'],
  chess: ['OYUN', 'Bilgisayar, şampiyonu yeniyor', 'DEEP BLUE 3½ – KASPAROV 2½'],
  go: ['OYUN', 'AlphaGo, Lee Sedol\'u 4–1 yeniyor', 'SEUL · MART 2016'],
  vision: ['GÖRME', 'Hata, insan uzmanın altında', 'IMAGENET (ILSVRC) · 2010–2015'],
  transformer: ['DİL', 'Transformer mimarisi yayımlanıyor', 'GOOGLE · HAZİRAN 2017'],
  scale: ['DİL', 'Modeller büyüyor', '60 MİLYONDAN 175 MİLYAR PARAMETREYE'],
  chatgpt: ['DİL', 'ChatGPT herkese açılıyor', 'OPENAI · 30 KASIM 2022'],
};
function strap(tov) {
  const id = shotAt(tov), Sx = STRAPS[id]; if (!Sx) return;
  const x0 = 60, ty = 1486, by = 1542, bh = 150, bw = 900;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.fillRect(x0 + 8, by + 8, bw + 60, bh);
  ctx.fillStyle = C.paper; ctx.fillRect(x0, by, bw, bh);
  ctx.fillStyle = C.lemon; ctx.fillRect(x0, by, 14, bh);
  ctx.fillStyle = C.ink; ctx.fillRect(x0 + bw, by, 60, bh); ctx.fillStyle = C.lemon; ctx.fillRect(x0 + bw, by, 60, 6);
  text('YZ', x0 + bw + 30, by + 92, F.b8(34), C.lemon, 'center', 1);
  ctx.save(); ctx.beginPath(); ctx.rect(x0 + 14, by, bw - 14, bh); ctx.clip();
  text(Sx[1], x0 + 40, by + 74, F.b8(60), C.ink, 'left', .5, 'strap'); text(Sx[2], x0 + 42, by + 122, F.b6(30), C.olive, 'left', 2, 'strape');
  ctx.restore();
  const tabW = 44 + tw(Sx[0], F.b8(34), 3);
  ctx.fillStyle = C.lemon; ctx.fillRect(x0, ty, tabW, by - ty);
  text(Sx[0], x0 + 22, ty + 42, F.b8(34), C.ink, 'left', 3, 'tab');
  ctx.restore();
}
const SOURCES = {
  eniac: 'FOTO: ABD ORDUSU · WIKIMEDIA COMMONS', turing: 'FOTO: KAMU MALI · WIKIMEDIA COMMONS',
  quote: 'KAYNAK: MIND, CİLT 59, SAYI 236', dart: 'KAYNAK: AI MAGAZINE 27(4) · 2006',
  winter: 'KAYNAK: SCIENCE RESEARCH COUNCIL, 1973', deepblue: 'FOTO: JAMES THE PHOTOGRAPHER · CC BY 2.0',
  chess: 'KAYNAK: IBM · CHESS.COM', go: 'KAYNAK: NATURE · FOTO: GARY TODD, CC0',
  vision: 'KAYNAK: RUSSAKOVSKY VD. 2015 · HE VD. 2015', transformer: 'KAYNAK: ARXIV 1706.03762',
  scale: 'KAYNAK: CACM 2017 · OPENAI · FOTO: NASA', chatgpt: 'KAYNAK: OPENAI, 30 KASIM 2022',
};
function credit(tov) {
  const s = SOURCES[shotAt(tov)]; if (!s) return;
  ctx.save(); ctx.globalAlpha = .75; text(s, 1020, 1466, F.mono(17), C.paper, 'right', .5, 'src', true); ctx.restore();
}
const TAGS = {
  eniac: ['ARŞİV', 'ABD Ordusu fotoğrafı · 1947 dolayı'], turing: ['ARŞİV', 'Turing, 16 yaşında'],
  deepblue: ['ARŞİV', 'Bir Deep Blue kabini, müzede'], go: ['TEMSİLİ', 'Müzedeki Go taşları, Seul'],
  scale: ['TEMSİLİ', 'NASA Pleiades süper bilgisayarı'],
};
function cornerTag(tov) {
  const A = TAGS[shotAt(tov)]; if (!A) return;
  const x = 60, y = 60, h = 62, w = 34 + Math.max(tw(A[0], F.mono(18), 3), tw(A[1], F.b6(24), .5)) + 26;
  ctx.fillStyle = 'rgba(18,20,23,.84)'; ctx.fillRect(x, y, w, h); ctx.fillStyle = C.gold; ctx.fillRect(x, y, 8, h);
  text(A[0], x + 26, y + 26, F.mono(18), C.gold, 'left', 3, 'tag');
  text(A[1], x + 26, y + 52, F.b6(24), C.white, 'left', .5, 'tagc');
}
function bug(t) {
  if (t < 1.45 || t > S.end - .2) return;
  ctx.save(); ctx.globalAlpha = .95; plate(948, 100, .3, -1, 1); text('BÜLTENİ', 852, 112, F.b8(28), C.white, 'right', 3); ctx.restore();
}

// ============ Shared drawing ============
function studioBg(t) {
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  const rg = ctx.createRadialGradient(780, 560, 60, 780, 560, 1300); rg.addColorStop(0, 'rgba(242,207,29,.15)'); rg.addColorStop(1, 'rgba(242,207,29,0)');
  ctx.fillStyle = rg; ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 7; i++) {
    const x = ((i * 300 + t * (26 + i * 5)) % 2000) - 300, w = 30 + hash(i) * 100;
    ctx.fillStyle = `rgba(242,207,29,${.022 + hash(i + 9) * .03})`;
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w - 700, H); ctx.lineTo(x - 700, H); ctx.fill();
  }
  ctx.fillStyle = 'rgba(244,241,232,.05)';
  for (let x = 30 - (t * 12) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
}
function stamp(t0, t, cx, cy, word, rot = -.08, style = 'fill', size = 64, id = 'stamp') {
  const sk = seg(t, t0, t0 + .16); if (sk <= 0) return;
  const w = tw(word, F.b8(size), 4) + 90, h = size * 1.55;
  const s = 1 + .9 * (1 - eo(sk));
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(s, s); ctx.globalAlpha = clamp(sk * 3);
  if (style === 'fill') { ctx.fillStyle = C.lemon; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = C.ink; ctx.lineWidth = 4; ctx.strokeRect(-w / 2 + 12, -h / 2 + 12, w - 24, h - 24); text(word, 0, size * .36, F.b8(size), C.ink, 'center', 4, id); }
  else { ctx.fillStyle = 'rgba(18,20,23,.95)'; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.strokeStyle = C.lemon; ctx.lineWidth = 5; ctx.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20); ctx.lineWidth = 2; ctx.strokeRect(-w / 2 + 20, -h / 2 + 20, w - 40, h - 40); text(word, 0, size * .36, F.b8(size), C.lemon, 'center', 4, id); }
  ctx.restore();
  const rr = seg(t, t0 + .04, t0 + .55); if (rr > 0 && rr < 1) { ctx.strokeStyle = `rgba(242,207,29,${.8 * (1 - rr)})`; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(cx, cy, w * .55 + rr * 200, h * .7 + rr * 90, rot, 0, Math.PI * 2); ctx.stroke(); }
}
function chip(t0, t, x, y, label, col = C.lemon, size = 34, id = 'chip') {
  const k = seg(t, t0, t0 + .22); if (k <= 0) return;
  const w = tw(label, F.b8(size), 2) + 44, h = size * 1.6, s = back(k, 2.4);
  ctx.save(); ctx.translate(x + w / 2, y); ctx.scale(s, s); ctx.fillStyle = col; ctx.fillRect(-w / 2, -h / 2, w, h);
  text(label, -w / 2 + 22, size * .36, F.b8(size), C.ink, 'left', 2, id); ctx.restore();
}
function eyebrow(t0, t, s, x, y, size = 24, id = 'eye') { const k = eo(seg(t, t0, t0 + .25)); if (k <= 0) return; ctx.save(); ctx.globalAlpha = k; text(s, x, y, F.mono(size), C.gold, 'left', 3, id); ctx.restore(); }
function card(x, y, w, h) { ctx.fillStyle = 'rgba(0,0,0,.4)'; ctx.fillRect(x + 14, y + 18, w, h); ctx.fillStyle = C.ink2; ctx.fillRect(x, y, w, h); ctx.fillStyle = C.lemon; ctx.fillRect(x, y, w, 6); }
function flipTile(x, y, w, h, from, to, t0, t, font, col) {
  const p = from === null ? 1 : seg(t, t0, t0 + .26);
  const half = (s, top, sc = 1) => {
    if (s === null) return;
    ctx.save(); ctx.beginPath(); ctx.rect(x, top ? y : y + h / 2, w, h / 2); ctx.clip();
    ctx.translate(0, y + h / 2); ctx.scale(1, sc); ctx.translate(0, -(y + h / 2));
    ctx.fillStyle = top ? '#2B3038' : '#262A31'; ctx.fillRect(x, y, w, h);
    text(s, x + w / 2, y + h * .78, font, col, 'center'); ctx.restore();
  };
  if (p >= 1) { half(to, true); half(to, false); } else if (p <= 0) { half(from, true); half(from, false); }
  else { half(to, true); half(from, false); if (p < .5) half(from, true, 1 - p * 2); else half(to, false, (p - .5) * 2); }
  ctx.fillStyle = 'rgba(0,0,0,.6)'; ctx.fillRect(x, y + h / 2 - 1.5, w, 3);
}
// a paper document flying in on an arc (scale .08 → 1, rotation settles); body drawn in local coordinates
function docIn(t, t0, cx, cy, w, h, fromX, fromY, rot0, rot1, body) {
  const k = seg(t, t0, t0 + .55); if (k <= 0) return;
  const e = eio(k), x = lerp(fromX, cx, e), y = lerp(fromY, cy, e) - Math.sin(e * Math.PI) * 180;
  ctx.save(); ctx.translate(x, y); ctx.rotate(lerp(rot0, rot1, eo(k))); ctx.scale(lerp(.08, 1, eo(k)), lerp(.08, 1, eo(k))); ctx.translate(-w / 2, -h / 2);
  ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(16, 20, w, h); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, w, h);
  body(k >= 1); ctx.restore();
}
function greyLines(x, y, ws, k, gap = 26) { ws.forEach((w, i) => { const q = clamp(k * ws.length - i); if (q > 0) { ctx.fillStyle = '#CFC9B8'; ctx.fillRect(x, y + i * gap, w * q, 11); } }); }

// ============ Shots ============
function shotSting(t) {
  studioBg(t);
  [[.04, .3, 26, -70], [.1, .36, 10, 50]].forEach(([a, b, h, dy]) => {
    const k = seg(t, a, b); if (k <= 0 || k >= 1) return;
    ctx.save(); ctx.translate(540, 820 + dy); ctx.rotate(-.2); const x = lerp(-1500, 1500, eio(k)); ctx.fillStyle = C.lemon; ctx.fillRect(x - 600, -h / 2, 1200, h); ctx.restore();
  });
}
function stingLogo(t) {
  if (t > 1.5) return;
  const k = seg(t, .16, .42), fly = eio(seg(t, 1.12, 1.45));
  const shake = t > .42 && t < .7 ? Math.sin(t * 90) * 14 * (1 - seg(t, .42, .7)) : 0;
  const cx = lerp(540, 948, fly) + shake, cy = lerp(820, 100, fly), s = lerp(back(k, 2.2) * 1.15, .3, fly);
  if (k > 0) { ctx.save(); ctx.translate(cx, cy); ctx.rotate((1 - eo(k)) * -.12 * (1 - fly)); ctx.translate(-cx, -cy); plate(cx, cy, s, seg(t, .85, 1.12) || -1, seg(t, .3, .7)); ctx.restore(); }
  const r = seg(t, .42, .8); if (r > 0 && r < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - r})`; ctx.lineWidth = 6 * (1 - r) + 1; ctx.beginPath(); ctx.ellipse(540, 820, 330 + r * 500, 130 + r * 260, 0, 0, Math.PI * 2); ctx.stroke(); }
  const wa = seg(t, .5, .8), wo = 1 - seg(t, 1.05, 1.18);
  if (wa > 0 && wo > 0) {
    ctx.save(); ctx.globalAlpha = wo; ctx.beginPath(); ctx.rect(540 - 480 * eo(wa), 960, 960 * eo(wa), 170); ctx.clip();
    wordmark(540, 1050, 84, 'center'); text('ARŞİV ÖZEL · 1950–2022', 540, 1104, F.mono(26), C.gold, 'center', 3); ctx.restore();
  }
}

const ROWS = [
  ['01', 'Makineler düşünebilir mi?', 'SORU', '1950–1956'],
  ['02', 'Vaatler tutmuyor: yapay zekâ kışı', 'KIŞ', '1973'],
  ['03', 'Makine, şampiyonu yeniyor', 'OYUN', '1997 · 2016'],
  ['04', 'Görmede insan uzman geçiliyor', 'GÖRME', '2010–2015'],
  ['05', 'Makine konuşmaya başlıyor', 'DİL', '2017–2022'],
];
function rundown(t, close) {
  studioBg(t);
  const A0 = close ? S.recap : S.rundown, u = t - A0;
  const zs = close ? lerp(1.03, 1.0, eo(seg(u, -.3, .6))) : lerp(1.0, 1.025, seg(u, 0, D.rundown));
  ctx.save(); ctx.translate(540, 900); ctx.scale(zs, zs); ctx.translate(-540, -900);
  const m = (a, b) => close ? 1 : eo(seg(u, a, b));
  const x = 60, ta = m(-.3, -.05);
  const tab = close ? 'BÜLTEN SONU' : 'BU BÜLTENDE', tabW = 44 + tw(tab, F.b8(34), 3);
  ctx.fillStyle = C.lemon; ctx.fillRect(x, 196, tabW * ta, 56); if (ta > .9) text(tab, x + 22, 238, F.b8(34), C.ink, 'left', 3, 'rtab');
  push(440, 170, m(.0, .3), () => text('1950–2022', x - 6, 440, F.b8(176), C.white, 'left', 2, 'rdate'));
  push(522, 70, m(.2, .5), () => text('72 YIL · 5 HABER', x, 522, F.b8(70), C.lemon, 'left', 3, 'rsub'));
  ctx.save(); ctx.globalAlpha = m(.45, .7); text('YAPAY ZEKÂNIN KISA TARİHİ', x + 2, 572, F.mono(24), C.gold, 'left', 3, 'rkick'); ctx.restore();
  const X0 = 60, RW = 960, RH = 150;
  ROWS.forEach(([n, title, cat, date], i) => {
    const a = .7 + i * .32, y = 640 + i * 168;
    const k = close ? 1 : seg(u, a, a + .3); if (k <= 0) return;
    const sy = close ? 1 : back(k, 2.0);
    ctx.save(); ctx.translate(0, y); ctx.scale(1, Math.max(.02, sy)); ctx.translate(0, -y);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(X0 + 10, y + 10, RW, RH);
    ctx.fillStyle = C.ink2; ctx.fillRect(X0, y, RW, RH); ctx.fillStyle = C.lemon; ctx.fillRect(X0, y, 128, RH);
    text(n, X0 + 64, y + 104, F.b8(88), C.ink, 'center');
    text(title, X0 + 158, y + 72, F.b8(50), C.white, 'left', .5, 'row' + i);
    text(cat, X0 + 160, y + 118, F.b6(30), C.gold, 'left', 3, 'rowc' + i);
    text(date, X0 + RW - 26, y + 118, F.mono(22), C.grey2, 'right', 2, close ? null : 'rowd' + i);
    const sw = close ? 0 : seg(u, a + .05, a + .45);
    if (sw > 0 && sw < 1) { const gx = X0 + 128 + (RW - 128) * eio(sw); const g = ctx.createLinearGradient(gx - 160, 0, gx, 0); g.addColorStop(0, 'rgba(242,207,29,0)'); g.addColorStop(1, 'rgba(242,207,29,.28)'); ctx.fillStyle = g; ctx.fillRect(Math.max(X0 + 128, gx - 160), y, Math.min(160, gx - X0 - 128), RH); }
    if (close) {
      const ck = seg(u, .55 + i * .35, .55 + i * .35 + .22);
      if (ck > 0) {
        const s = back(ck, 2.6), cx = X0 + RW - 60, cy = y + 52;
        ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.arc(0, 0, 30, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-3, 11); ctx.lineTo(15, -10); ctx.stroke(); ctx.restore();
      }
    }
    ctx.restore();
  });
  if (!close) { const hl = seg(u, D.rundown - .9, D.rundown - .65); if (hl > 0) { ctx.strokeStyle = C.lemon; ctx.lineWidth = 5; ctx.globalAlpha = .6 + .4 * Math.cos((u - D.rundown + .9) * Math.PI * 4); ctx.strokeRect(X0 - 4, 636, RW * eo(hl) + 8, RH + 8); ctx.globalAlpha = 1; } }
  ctx.restore();
}

// ① SORU — ENIAC archive plate, then Turing, the quote, the Dartmouth proposal
function shotEniac(t) {
  const u = t - S.eniac;
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  photo(IM.eniac, 720, 520, lerp(1.62, 1.72, seg(u, -.3, D.eniac)), 0, 0, W, 1200);
  const g = ctx.createLinearGradient(0, 760, 0, 1200); g.addColorStop(0, 'rgba(18,20,23,0)'); g.addColorStop(1, 'rgba(18,20,23,1)');
  ctx.fillStyle = g; ctx.fillRect(0, 760, W, 440); vignette(.45, 600); grain(t, .07, 0, 1200);
  eyebrow(-.1, u, 'ENIAC · BALİSTİK ARAŞTIRMA LAB.', 60, 1150, 24, 'en0');
  push(1330, 180, eo(seg(u, .05, .4)), () => text('ENIAC', 54, 1330, F.b8(200), C.white, 'left', 4, 'en1'));
  push(1410, 60, eo(seg(u, .35, .65)), () => text('Oda büyüklüğünde bir bilgisayar', 60, 1410, F.b6(50), C.lemon, 'left', 1, 'en2'));
}
function shotTuring(t) {
  const u = t - S.turing; studioBg(t);
  const k = eo(seg(u, 0, .45)), y = 220 + (1 - k) * 160;
  ctx.save(); ctx.translate(540, y + 490); ctx.rotate(lerp(-.05, -.012, k)); ctx.translate(-540, -(y + 490)); ctx.globalAlpha = clamp(k * 3);
  card(170, y - 10, 740, 1000);
  photo(IM.turing, 500, 600, lerp(.72, .76, seg(u, 0, D.turing)), 180, y, 720, 980);
  grain(t, .06, y, 980);
  ctx.restore();
  push(1340, 150, eo(seg(u, .35, .7)), () => text('ALAN TURING', 54, 1340, F.b8(150), C.white, 'left', 3, 'tu1'));
  eyebrow(vt('v3', .55) - S.turing + S.turing, t, 'COMPUTING MACHINERY AND INTELLIGENCE', 60, 1404, 23, 'tu2');
}
const QL = ['I propose to consider', 'the question,', '‘Can machines', 'think?’'];
function shotQuote(t) {
  const u = t - S.quote; studioBg(t);
  const zq = lerp(1, 1.03, eio(seg(u, 0, D.quote))); ctx.save(); ctx.translate(540, 760); ctx.scale(zq, zq); ctx.translate(-540, -760);
  const qk = seg(u, -.05, .2); if (qk > 0) { const s = back(qk, 2.4); ctx.save(); ctx.translate(120, 330); ctx.scale(s, s); text('“', -60, 170, F.b8(360), C.lemon, 'left'); ctx.restore(); }
  const ul = eio(seg(t, vt('v4', .62), vt('v4', .62) + .35));
  if (ul > 0) { ctx.fillStyle = C.lemon; ctx.fillRect(130, 520 + 3 * 116 + 20, tw('think?', F.b8(100), 1) * ul, 12); }
  QL.forEach((L, i) => {
    const k = eo(seg(u, .15 + i * .18, .45 + i * .18)); if (k <= 0) return;
    ctx.save(); ctx.beginPath(); ctx.rect(0, 420 + i * 116, W, 124); ctx.clip();
    text(L, 130, 520 + i * 116 + (1 - k) * 120, F.b8(100), C.white, 'left', 1, 'q' + i); ctx.restore();
  });
  const zk = eo(seg(u, .9, 1.2)); ctx.save(); ctx.globalAlpha = zk;
  text('“Makineler düşünebilir mi?”', 130, 1030, F.b8(62), C.lemon, 'left', 1, 'qtr');
  ctx.fillStyle = C.gold; ctx.fillRect(130, 1070, 70 * zk, 4);
  text('A. M. TURING', 130, 1136, F.b8(46), C.paper, 'left', 3, 'qwho');
  text('MIND · CİLT 59 · SAYI 236 · EKİM 1950', 130, 1184, F.mono(23), C.grey2, 'left', 2, 'qsrc');
  ctx.restore(); ctx.restore();
}
function shotDart(t) {
  const u = t - S.dart; studioBg(t);
  const t0 = S.dart - .05, mk = eio(seg(t, vt('v5', .8), vt('v5', .8) + .4));
  docIn(t, t0, 540, 750, 840, 1060, 540, 1700, .3, -.02, id => {
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, 840, 110);
    text('ÖNERİ', 44, 74, F.b8(56), C.lemon, 'left', 4, id ? 'd0' : null);
    text('31 AĞUSTOS 1955', 796, 72, F.mono(26), C.paper, 'right', 2, id ? 'd1' : null);
    ['A PROPOSAL FOR THE', 'DARTMOUTH SUMMER', 'RESEARCH PROJECT ON'].forEach((L, i) => text(L, 44, 196 + i * 56, F.b6(48), C.ink, 'left', 2, id ? 'dt' + i : null));
    if (mk > 0) { ctx.fillStyle = C.lemon; ctx.fillRect(36, 318, (tw('ARTIFICIAL INTELLIGENCE', F.b8(70), 1) + 18) * mk, 86); }
    text('ARTIFICIAL INTELLIGENCE', 44, 390, F.b8(70), C.ink, 'left', 1, id ? 'dai' : null);
    ctx.fillStyle = '#D9D4C5'; ctx.fillRect(44, 440, 752, 2);
    const NAMES = [['J. McCARTHY', 'DARTMOUTH COLLEGE'], ['M. L. MINSKY', 'HARVARD UNIVERSITY'], ['N. ROCHESTER', 'I.B.M. CORPORATION'], ['C. E. SHANNON', 'BELL TELEPHONE LABORATORIES']];
    NAMES.forEach(([n, org], i) => {
      const y = 510 + i * 92, ck = seg(t, vt('v5', .22) + i * .22, vt('v5', .22) + i * .22 + .15);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 3; ctx.strokeRect(44, y - 34, 40, 40);
      if (ck > 0) { ctx.strokeStyle = C.olive; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(52, y - 14); ctx.lineTo(62, y - 4); ctx.lineTo(62 + 18 * ck, y - 4 - 22 * ck); ctx.stroke(); }
      text(n, 104, y, F.b8(40), C.ink, 'left', 2, id ? 'dn' + i : null);
      text(org, 104, y + 36, F.mono(20), C.olive, 'left', 1.5, id ? 'do' + i : null);
    });
    ctx.fillStyle = '#D9D4C5'; ctx.fillRect(44, 900, 752, 2);
    text('HANOVER, NEW HAMPSHIRE · YAZ 1956', 44, 950, F.mono(24), C.grey2, 'left', 2, id ? 'dh' : null);
    greyLines(44, 985, [600, 520], seg(u, .8, 1.4));
  });
  stamp(ve('v5') + .25, t, 640, 1340, 'ALANIN ADI KONDU', -.07, 'fill', 56, 'dst');
}

// ② KIŞ — the Lighthill report, then the stamp
function shotWinter(t) {
  const u = t - S.winter; studioBg(t);
  const cold = seg(t, vt('v7', .2), vt('v7', .6)); if (cold > 0) { ctx.fillStyle = `rgba(150,170,190,${.06 * cold})`; ctx.fillRect(0, 0, W, H); }
  docIn(t, S.winter - .1, 540, 720, 760, 920, 1300, 1500, .4, .015, id => {
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, 760, 104);
    text('RAPOR', 40, 70, F.b8(54), C.lemon, 'left', 4, id ? 'w0' : null); text('LONDRA · 1973', 720, 68, F.mono(26), C.paper, 'right', 2, id ? 'w1' : null);
    text('ARTIFICIAL INTELLIGENCE:', 40, 200, F.b8(58), C.ink, 'left', 1, id ? 'w2' : null);
    text('A GENERAL SURVEY', 40, 262, F.b8(58), C.ink, 'left', 1, id ? 'w3' : null);
    ctx.fillStyle = '#D9D4C5'; ctx.fillRect(40, 300, 680, 2);
    text('SIR JAMES LIGHTHILL FRS', 40, 352, F.mono(26), C.ink, 'left', 2, id ? 'w4' : null);
    text('İNGİLTERE BİLİM ARAŞTIRMA KONSEYİ (SRC) İÇİN', 40, 394, F.mono(20), C.olive, 'left', 1, id ? 'w5' : null);
    greyLines(40, 450, [660, 620, 680, 560, 640, 600, 660, 420, 650, 600, 540, 380], seg(u, .5, 2.0), 30);
  });
  stamp(ve('v7') + .2, t, 560, 1290, 'YZ KIŞI', -.09, 'frame', 96, 'wst');
}

// ③ OYUN — Deep Blue, the board, AlphaGo
function shotDeepBlue(t) {
  const u = t - S.deepblue; studioBg(t);
  const k = eo(seg(u, -.15, .3)), y = 200 + (1 - k) * 140;
  ctx.save(); ctx.globalAlpha = clamp(k * 3); ctx.translate(540, y + 420); ctx.rotate(lerp(.04, .012, k)); ctx.translate(-540, -(y + 420));
  card(260, y - 10, 560, 852); photo(IM.deepblue, 200, 300, 1.4, 270, y, 540, 832); grain(t, .06, y, 832); ctx.restore();
  push(1290, 150, eo(seg(u, .3, .65)), () => text('DEEP BLUE', 54, 1290, F.b8(150), C.white, 'left', 3, 'db1'));
  eyebrow(.6, u, 'IBM · 3–11 MAYIS 1997 · NEW YORK', 60, 1356, 24, 'db2');
  eyebrow(.9, u, 'RAKİP: DÜNYA ŞAMPİYONU GARRİ KASPAROV', 60, 1404, 22, 'db3');
}
function shotChess(t) {
  const u = t - S.chess; studioBg(t);
  const fl = vt('v9', .5), k = seg(u, -.05, .25), b = back(k, 1.3);
  ctx.save(); ctx.translate(0, (1 - b) * 80); ctx.globalAlpha = clamp(k * 4);
  card(60, 230, 960, 820);
  eyebrow(-1, u, 'SATRANÇ · ALTI OYUNLUK MAÇ', 110, 300, 24, 'ch0');
  ctx.fillStyle = C.line; ctx.fillRect(110, 330, 860, 2);
  const yr = t < fl + .13 ? ['1996', 'PHILADELPHIA'] : ['1997', 'NEW YORK'];
  push(420, 70, t < fl ? 1 : eo(seg(t, fl, fl + .25)), () => { const w1 = text(yr[0], 110, 420, F.b8(74), C.lemon, 'left', 2, 'chy'); text(yr[1], 110 + w1 + 20, 418, F.b6(40), C.grey, 'left', 3, 'chc'); }, 0, W);
  const won = t >= fl + .35;
  [['KASPAROV', '4', '2½', 'İNSAN'], ['DEEP BLUE', '2', '3½', 'MAKİNE']].forEach(([n, a, b2, who], i) => {
    const y = 500 + i * 230;
    if (won && i === 1) { ctx.fillStyle = C.lemon; ctx.fillRect(60, y - 10, 12, 190); }
    text(n, 110, y + 104, F.b8(84), won && i === 1 ? C.lemon : C.white, 'left', 2, 'chn' + i);
    text(who, 112, y + 150, F.mono(20), C.grey2, 'left', 3);
    flipTile(700, y, 270, 180, a, b2, fl + i * .15, t, F.b8(140), won && i === 1 ? C.lemon : C.white);
  });
  if (won) { ctx.save(); ctx.globalAlpha = eo(seg(t, fl + .35, fl + .6)); text('1996 MAÇI: KASPAROV 4 – DEEP BLUE 2', 110, 1010, F.mono(22), C.grey2, 'left', 1.5, 'chold'); ctx.restore(); }
  ctx.restore();
  chip(vt('v10', .45), t, 60, 1160, 'TURNUVA KOŞULLARINDA BİR İLK', C.lemon, 40, 'chip1');
  eyebrow(vt('v10', .7), t, 'KAYNAK: IBM ARŞİVİ', 60, 1270, 20, 'ch9');
}
function shotGo(t) {
  const u = t - S.go;
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  photo(IM.baduk, 640, 430, lerp(1.4, 1.5, seg(u, 0, D.go)), 0, 0, W, 980);
  const g = ctx.createLinearGradient(0, 640, 0, 980); g.addColorStop(0, 'rgba(18,20,23,0)'); g.addColorStop(1, 'rgba(18,20,23,1)'); ctx.fillStyle = g; ctx.fillRect(0, 640, W, 340);
  vignette(.4, 500); grain(t, .07, 0, 980);
  const k = eo(seg(u, .05, .35));
  ctx.save(); ctx.translate(0, (1 - k) * 120); ctx.globalAlpha = clamp(k * 3);
  card(60, 900, 960, 530);
  text('GO · BEŞ OYUNLUK MAÇ', 110, 966, F.mono(24), C.gold, 'left', 3, 'go0');
  text('SEUL · 9–15 MART 2016', 970, 966, F.mono(24), C.grey, 'right', 2, 'go1');
  ctx.fillStyle = C.line; ctx.fillRect(110, 994, 860, 2);
  const fl = vt('v11', .72), won = t >= fl + .4;
  [['ALPHAGO', '4', 'DEEPMIND · MAKİNE'], ['LEE SEDOL', '1', 'GO USTASI · İNSAN']].forEach(([n, v, who], i) => {
    const y = 1030 + i * 196;
    if (won && i === 0) { ctx.fillStyle = C.lemon; ctx.fillRect(60, y, 12, 170); }
    text(n, 110, y + 100, F.b8(84), won && i === 0 ? C.lemon : C.white, 'left', 2, 'gon' + i);
    text(who, 112, y + 146, F.mono(20), C.grey2, 'left', 3);
    flipTile(760, y, 210, 170, '0', v, fl + i * .15, t, F.b8(130), won && i === 0 ? C.lemon : C.white);
  });
  ctx.restore();
  stamp(ve('v11') + .3, t, 560, 560, 'MAKİNE KAZANDI', -.08, 'fill', 64, 'gost');
}

// ④ GÖRME — ILSVRC winning top-5 error, 2010→2015, against one trained human expert (5.1 %)
const VD = [[2010, 28.2], [2011, 25.8], [2012, 16.4], [2013, 11.7], [2014, 6.7], [2015, 3.57]];
const CX0 = 160, CX1 = 960, CY0 = 470, CY1 = 1180;
const CYv = v => CY1 - v / 30 * (CY1 - CY0), CXi = i => lerp(CX0, CX1, i / 5);
let VT = [], CROSS = 0;
function visionTimes() {
  CROSS = vt('v14', .8);
  VT = [vt('v12', .78), vt('v12', .78) + .5, vt('v13', .3), vt('v13', .75), vt('v14', .2), CROSS];
}
const pc = v => '%' + String(v).replace('.', ',');
function shotVision(t) {
  const u = t - S.vision;
  ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(244,241,232,.035)'; for (let x = 30 - (t * 8) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
  const sh = t > CROSS && t < CROSS + .4 ? 1 - seg(t, CROSS, CROSS + .4) : 0;
  ctx.save(); ctx.translate(Math.sin(t * 83) * 14 * sh, Math.cos(t * 71) * 10 * sh);
  eyebrow(-.2, u, 'ILSVRC · GÖRÜNTÜ SINIFLANDIRMA', 60, 236, 24, 'vi0');
  push(320, 80, eo(seg(u, -.1, .25)), () => text('Kazananın hata oranı', 54, 320, F.b8(76), C.white, 'left', 1, 'vi1'));
  ctx.save(); ctx.globalAlpha = eo(seg(u, .2, .45)); text('İLK 5 TAHMİN HATASI (TOP-5)', 60, 368, F.mono(22), C.grey, 'left', 2, 'vi2'); ctx.restore();
  const ga = eo(seg(u, -.2, .1)); ctx.globalAlpha = ga;
  ctx.strokeStyle = 'rgba(244,241,232,.09)'; ctx.lineWidth = 1;
  for (let v = 0; v <= 30; v += 10) { ctx.beginPath(); ctx.moveTo(CX0, CYv(v)); ctx.lineTo(CX1 + 20, CYv(v)); ctx.stroke(); text(pc(v), CX0 - 18, CYv(v) + 8, F.mono(22), C.grey2, 'right'); }
  VD.forEach(([y], i) => text(String(y), CXi(i), CY1 + 50, F.mono(24), t >= VT[i] ? C.paper : C.grey2, 'center', 1, 'vy' + i));
  ctx.globalAlpha = 1;
  // the human line
  const hl = eio(seg(u, .3, .8)), hf = t > CROSS && t < CROSS + .6 ? .5 + .5 * Math.cos((t - CROSS) * 30) : 0;
  ctx.strokeStyle = hf > 0 ? mixc('D4B064', 'FFFFFF', hf) : C.gold; ctx.lineWidth = 4; ctx.setLineDash([18, 12]);
  ctx.beginPath(); ctx.moveTo(CX0, CYv(5.1)); ctx.lineTo(lerp(CX0, CX1 + 20, hl), CYv(5.1)); ctx.stroke(); ctx.setLineDash([]);
  if (hl > .9) { ctx.save(); ctx.globalAlpha = eo(seg(u, .7, .9)); text('EĞİTİMLİ İNSAN UZMAN · %5,1', CX0 + 6, CYv(5.1) - 18, F.b6(32), C.gold, 'left', 2, 'vh'); ctx.restore(); }
  // the line, one year per step
  const pts = []; let last = null;
  for (let i = 0; i < VD.length; i++) {
    const p = [CXi(i), CYv(VD[i][1])];
    if (i === 0) { if (t >= VT[0]) pts.push(p); continue; }
    const kk = seg(t, VT[i], VT[i] + (i === 5 ? .14 : .22)); if (kk <= 0) break;
    const a = [CXi(i - 1), CYv(VD[i - 1][1])]; pts.push([lerp(a[0], p[0], kk), lerp(a[1], p[1], kk)]);
  }
  if (pts.length) {
    if (pts.length > 1) {
      const ag = ctx.createLinearGradient(0, CY0, 0, CY1); ag.addColorStop(0, 'rgba(242,207,29,.14)'); ag.addColorStop(1, 'rgba(242,207,29,0)');
      ctx.fillStyle = ag; ctx.beginPath(); ctx.moveTo(pts[0][0], CY1); pts.forEach(p => ctx.lineTo(p[0], p[1])); ctx.lineTo(pts[pts.length - 1][0], CY1); ctx.fill();
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = C.paper; ctx.lineWidth = 6; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
      if (t >= CROSS) { const a = [CXi(4), CYv(6.7)], p = pts[pts.length - 1]; ctx.strokeStyle = C.lemon; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); }
    }
    pts.forEach((p, i) => { if (i < pts.length - 1 || t >= VT[i] + .2 || i === 0) { ctx.fillStyle = C.paper; ctx.beginPath(); ctx.arc(CXi(i), CYv(VD[i][1]), 9, 0, Math.PI * 2); ctx.fill(); } });
    VD.forEach(([y, v], i) => { if (i >= pts.length || t < VT[i] + .1) return; if (i === 5) return; ctx.save(); ctx.globalAlpha = eo(seg(t, VT[i] + .1, VT[i] + .3)); text(pc(v), CXi(i) + (i ? 0 : 14), CYv(v) - 26, F.b8(38), C.paper, i ? 'center' : 'left', 1, 'vv' + i); ctx.restore(); });
    last = pts[pts.length - 1];
    const blink = t > CROSS - .7 && t < CROSS ? (Math.floor(t * 8) % 2 ? 1 : .3) : 1;
    ctx.globalAlpha = blink; ctx.fillStyle = t >= CROSS ? C.lemon : C.paper; ctx.beginPath(); ctx.arc(last[0], last[1], 12, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  }
  // 2012 call-out
  const c12 = seg(t, VT[2] + .25, VT[2] + .5);
  if (c12 > 0) { ctx.save(); ctx.globalAlpha = eo(c12); const x = CXi(2) + 24, y = CYv(16.4) + 70; ctx.fillStyle = 'rgba(27,30,35,.96)'; const w = tw('SUPERVISION · TORONTO', F.b6(28), 2) + 40; ctx.fillRect(x, y - 36, w, 52); ctx.fillStyle = C.lemon; ctx.fillRect(x, y - 36, 6, 52); text('SUPERVISION · TORONTO', x + 22, y + 2, F.b6(28), C.paper, 'left', 2, 'v12c'); ctx.restore(); }
  const rb = seg(t, CROSS + .1, CROSS + .7); if (rb > 0 && rb < 1) { ctx.strokeStyle = `rgba(242,207,29,${1 - rb})`; ctx.lineWidth = 8 * (1 - rb) + 1; ctx.beginPath(); ctx.arc(CXi(5), CYv(3.57), 20 + rb * 260, 0, Math.PI * 2); ctx.stroke(); }
  ctx.restore();
  // readout
  const pa = eo(seg(t, CROSS + .1, CROSS + .4));
  if (pa > 0) {
    const Y = 1262 + (1 - pa) * 220; ctx.save(); ctx.beginPath(); ctx.rect(0, 1240, W, 210); ctx.clip();
    ctx.fillStyle = 'rgba(27,30,35,.97)'; ctx.fillRect(60, Y, 960, 176); ctx.fillStyle = C.lemon; ctx.fillRect(60, Y, 960, 6);
    text('2015 · RESNET (MICROSOFT)', 100, Y + 52, F.mono(22), C.gold, 'left', 2, 'vr0');
    text('%3,57', 96, Y + 150, F.b8(104), C.lemon, 'left', 0, 'vr1');
    text('İNSAN UZMAN', 990, Y + 100, F.b6(30), C.grey, 'right', 2, 'vr2'); text('%5,1', 990, Y + 152, F.b8(56), C.white, 'right', 0, 'vr3');
    ctx.restore();
  }
  stamp(CROSS + .9, t, 770, 600, 'EŞİK AŞILDI', -.08, 'fill', 60, 'vst');
}

// ⑤ DİL — the Transformer paper, the scale jump on one scale, ChatGPT's date
function shotTransformer(t) {
  const u = t - S.transformer; studioBg(t);
  docIn(t, S.transformer - .1, 540, 720, 840, 960, -200, 1500, -.4, -.015, id => {
    ctx.fillStyle = C.ink; ctx.fillRect(0, 0, 840, 104);
    text('ARXIV:1706.03762', 40, 66, F.mono(28), C.lemon, 'left', 2, id ? 'tr0' : null); text('12 HAZİRAN 2017', 800, 66, F.mono(24), C.paper, 'right', 2, id ? 'tr1' : null);
    text('Attention Is', 40, 236, F.b8(104), C.ink, 'left', 1, id ? 'tr2' : null);
    text('All You Need', 40, 344, F.b8(104), C.ink, 'left', 1, id ? 'tr3' : null);
    ctx.fillStyle = '#D9D4C5'; ctx.fillRect(40, 392, 760, 2);
    ['VASWANI · SHAZEER · PARMAR · USZKOREIT', 'JONES · GOMEZ · KAISER · POLOSUKHIN'].forEach((L, i) => text(L, 40, 446 + i * 38, F.mono(22), C.ink, 'left', 1, id ? 'tra' + i : null));
    text('GOOGLE BRAIN · GOOGLE RESEARCH', 40, 546, F.mono(22), C.olive, 'left', 2, id ? 'trg' : null);
    greyLines(40, 600, [740, 700, 760, 640, 720, 680, 600, 740, 520], seg(u, .5, 2), 30);
  });
  chip(vt('v15', .62), t, 60, 1310, 'YENİ MİMARİ: TRANSFORMER', C.lemon, 44, 'trc');
}
const SB = [['ALEXNET', '2012', 60e6, '60 MİLYON'], ['GPT-2', '2019', 1.5e9, '1,5 MİLYAR'], ['GPT-3', '2020', 175e9, '175 MİLYAR']];
function shotScale(t) {
  const u = t - S.scale;
  photo(IM.pleiades, 420, 270, 2.6, 0, 0, W, H, 'blur(5px) brightness(.6)');
  ctx.fillStyle = 'rgba(14,16,19,.55)'; ctx.fillRect(0, 0, W, H); grain(t, .05);
  eyebrow(-.1, u, 'PARAMETRE SAYISI · TEK ÖLÇEK', 60, 250, 24, 'sc0');
  push(360, 110, eo(seg(u, -.05, .3)), () => text('Modeller büyüyor', 54, 360, F.b8(110), C.white, 'left', 1, 'sc1'));
  const BW = 900, BX = 90, unit = BW / 175e9;
  const at = [vt('v16', .38), vt('v16', .6), vt('v16', .8)];
  SB.forEach(([n, yr, v, lab], i) => {
    const y = 520 + i * 230, a = at[i], la = eo(seg(t, a - .2, a + .05)); if (la <= 0) return;
    ctx.save(); ctx.globalAlpha = la; const w1 = text(n, BX, y, F.b8(58), C.white, 'left', 2, 'sbn' + i); text(yr, BX + w1 + 18, y - 2, F.mono(26), C.gold, 'left', 2); ctx.restore();
    ctx.fillStyle = 'rgba(34,38,44,.92)'; ctx.fillRect(BX, y + 26, BW, 76);
    const k = eio(seg(t, a, a + .6)), w = Math.max(3, v * unit * k);
    const g = ctx.createLinearGradient(BX, 0, BX + w, 0); g.addColorStop(0, i === 2 ? C.lemonD : '#B9B4A6'); g.addColorStop(1, i === 2 ? C.lemon : C.paper);
    ctx.fillStyle = g; ctx.fillRect(BX, y + 26, w, 76);
    if (i < 2) text(lab, BX + w + 22, y + 88, F.b8(56), C.paper, 'left', 1, k >= 1 ? 'sbv' + i : null);
    else if (k > .4) { ctx.save(); ctx.globalAlpha = seg(k, .4, .8); text(lab, BX + w - 24, y + 88, F.b8(60), C.ink, 'right', 1, k >= 1 ? 'sbv2' : null); ctx.restore(); }
  });
  chip(ve('v16') + .2, t, 90, 1250, 'ALEXNET\'İN ~2.900 KATI', C.gold, 44, 'sbx');
  ctx.save(); ctx.globalAlpha = eo(seg(t, at[2] + .7, at[2] + 1)); text('ÇUBUKLAR AYNI ÖLÇEKTE; EN KISALARI 3 PİKSEL GÖSTERİLDİ', 90, 1360, F.mono(17), C.grey, 'left', 1, 'sbf', true); ctx.restore();
}
function shotChatgpt(t) {
  const u = t - S.chatgpt; studioBg(t);
  eyebrow(-.15, u, 'OPENAI · CHATGPT', 60, 300, 28, 'cg0');
  const f0 = S.chatgpt + .05;
  flipTile(60, 360, 300, 400, null, '3', 0, t >= f0 ? 1 : -1, F.b8(330), C.white);
  flipTile(380, 360, 300, 400, null, '0', 0, t >= f0 + .12 ? 1 : -1, F.b8(330), C.white);
  if (t < f0) { ctx.fillStyle = '#262A31'; ctx.fillRect(60, 360, 300, 400); } if (t < f0 + .12) { ctx.fillStyle = '#262A31'; ctx.fillRect(380, 360, 300, 400); }
  if (t >= f0 + .12) TX.push({ id: 'cgd', text: '30', x0: 60, y0: 360, x1: 680, y1: 760 });
  push(930, 140, eo(seg(u, .35, .7)), () => text('KASIM 2022', 54, 930, F.b8(150), C.lemon, 'left', 3, 'cg1'));
  ctx.save(); ctx.globalAlpha = eo(seg(u, .7, 1.0)); text('Sohbet robotu herkesin kullanımına açılıyor', 60, 1010, F.b6(46), C.paper, 'left', .5, 'cg2'); ctx.restore();
  stamp(ve('v17') + .15, t, 560, 1240, 'HERKESE AÇIK', -.07, 'fill', 76, 'cgst');
}

// End card
function shotEnd(t) {
  const u = t - S.end;
  const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#1A1D22'); g.addColorStop(1, '#0E1013'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(244,241,232,.04)'; for (let x = 30 - (t * 10) % 48; x < W; x += 48) for (let y = 24; y < H; y += 48) ctx.fillRect(x, y, 2, 2);
  ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(900, 0); ctx.lineTo(930, 0); ctx.lineTo(800, 740); ctx.lineTo(770, 740); ctx.fill();
  ctx.fillStyle = C.gold; ctx.beginPath(); ctx.moveTo(940, 0); ctx.lineTo(946, 0); ctx.lineTo(816, 740); ctx.lineTo(810, 740); ctx.fill();
  const m = (a, b) => eo(seg(u, a, b)), x = 60;
  ctx.save(); ctx.globalAlpha = m(-.1, .1); text('YZ BÜLTENİ · ARŞİV ÖZEL', x, 260, F.mono(26), C.gold, 'left', 3, 'e0'); ctx.restore();
  push(420, 150, m(-.08, .22), () => text('Bir Sorudan', x - 4, 420, F.b8(150), C.white, 'left', 2, 'e1'));
  push(570, 150, m(.02, .32), () => text('Sohbete', x - 4, 570, F.b8(150), C.white, 'left', 2, 'e2'));
  push(666, 86, m(.15, .42), () => text('1950 – 2022', x, 666, F.b6i(84), C.lemon, 'left', 2, 'e3'));
  ctx.fillStyle = C.lemon; ctx.fillRect(x, 706, 560 * eio(seg(u, .3, .6)), 3);
  ctx.save(); ctx.globalAlpha = m(.2, .5); plate(540, 900, .8, seg(u, .9, 1.35) || -1, seg(u, .2, .7)); wordmark(540, 1070, 54, 'center', 'e8'); ctx.restore();
  const sm = m(.6, .9); ctx.save(); ctx.globalAlpha = sm; ctx.fillStyle = C.line; ctx.fillRect(x, 1170, 960, 1);
  const CR = ['Kaynaklar: Mind (1950) · AI Magazine 27(4) · Lighthill, SRC (1973) · IBM · Nature',
    'Russakovsky vd. (2015) · He vd. (2015) · arXiv 1706.03762 · CACM · OpenAI',
    'Fotoğraflar, Wikimedia Commons: ENIAC (ABD Ordusu), A. Turing, Pleiades (NASA) — kamu malı;',
    'Go taşları: Gary Todd (CC0) · Deep Blue: James the photographer (CC BY 2.0)',
    'Ses: Microsoft Azure Neural TTS (tr-TR-AhmetNeural) · Müzik örnekleri: VSCO 2 CE, VCSL (CC0)',
    'Yazı tipleri: Barlow Condensed, IBM Plex Mono (OFL)'];
  CR.forEach((s, i) => text(s, x, 1214 + i * 36, F.b6(24), i === 3 ? C.paper : C.grey, 'left', .3, 'ecr' + i, i !== 3));
  ctx.restore();
}

// ============ Compositing ============
function wipeBand(bx) { ctx.fillStyle = C.lemon; ctx.fillRect(bx - 64, 0, 64, H); ctx.fillStyle = C.ink; ctx.fillRect(bx, 0, 4, H); ctx.fillStyle = C.gold; ctx.fillRect(bx + 4, 0, 11, H); }
function layer(fn, t, tov) { fn(t); cornerTag(tov); credit(tov); strap(tov); }
function wipe(t, a, b, oldFn, newFn) {
  const bx = lerp(-100, W + 100, eio(seg(t, a, b)));
  const n0 = TX.length; layer(newFn, t, b + .001); const NEW = TX.splice(n0);
  ctx.save(); ctx.beginPath(); ctx.rect(bx, 0, W, H); ctx.clip(); layer(oldFn, t, a - .001); ctx.restore();
  const OLD = TX.splice(n0); TX.push(...(seg(t, a, b) < .5 ? OLD : NEW));
  wipeBand(bx);
}
const FN = {
  sting: shotSting, rundown: t => rundown(t, false), eniac: shotEniac, turing: shotTuring, quote: shotQuote, dart: shotDart,
  winter: shotWinter, deepblue: shotDeepBlue, chess: shotChess, go: shotGo, vision: shotVision, transformer: shotTransformer,
  scale: shotScale, chatgpt: shotChatgpt, recap: t => rundown(t, true), end: shotEnd,
};
function scene(t) {
  const ids = PLAN.map(p => p[0]);
  for (let i = 1; i < ids.length; i++) {
    const id = ids[i], a = S[id];
    if (TIN[id] === 'wipe' && t >= a - .3 && t < a) { wipe(t, a - .3, a, FN[ids[i - 1]], FN[id]); if (ids[i - 1] === 'sting') stingLogo(t); return; }
    if (TIN[id] === 'slant' && t >= a - .25 && t < a) {
      layer(FN[ids[i - 1]], t, a - .001);
      const k = eio(seg(t, a - .25, a)), x = W - k * (W + 400);
      ctx.save(); ctx.beginPath(); ctx.moveTo(x + 400, 0); ctx.lineTo(W + 400, 0); ctx.lineTo(W + 400, H); ctx.lineTo(x, H); ctx.closePath(); ctx.clip(); FN[id](t); ctx.restore();
      ctx.fillStyle = C.lemon; ctx.beginPath(); ctx.moveTo(x + 400, 0); ctx.lineTo(x + 440, 0); ctx.lineTo(x + 40, H); ctx.lineTo(x, H); ctx.fill();
      return;
    }
  }
  const id = shotAt(t); layer(FN[id], t, t); if (id === 'sting') stingLogo(t);
}
function render(t) {
  TX = []; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = 1; ctx.filter = 'none';
  scene(t); bug(t);
  if (t > DUR - .8) { ctx.fillStyle = `rgba(0,0,0,${seg(t, DUR - .8, DUR - .1)})`; ctx.fillRect(0, 0, W, H); }
}

// ============ Events (for mix.py) and subtitles ============
let EV = [];
function buildEvents(lines) {
  const E = [];
  const ev = (t, type, o = {}) => E.push({ t: Math.round(t * 1000) / 1000, type, ...o });
  ev(.04, 'swish'); ev(.4, 'stab'); ev(.9, 'glint');
  PLAN.forEach(([id]) => { if (TIN[id] === 'wipe') { ev(S[id] - .3, 'whoosh'); ev(S[id], 'hit'); } if (TIN[id] === 'cut') ev(S[id], 'card'); if (TIN[id] === 'slant') { ev(S[id] - .25, 'whoosh'); ev(S[id], 'end'); } });
  ROWS.forEach((_, i) => ev(S.rundown + .7 + i * .32, 'row', { i }));
  ev(S.rundown + D.rundown - .9, 'blip');
  ev(S.eniac + .05, 'slam'); ev(S.turing + .35, 'slam');
  ev(S.quote - .05, 'quote'); ev(vt('v4', .62), 'mark');
  ev(S.dart - .05, 'paper'); for (let i = 0; i < 4; i++) ev(vt('v5', .22) + i * .22, 'check', { i }); ev(vt('v5', .8), 'mark'); ev(ve('v5') + .25, 'stamp');
  ev(S.winter - .1, 'paper'); ev(S.winter + .5, 'type'); ev(ve('v7') + .2, 'stamp_big');
  ev(S.deepblue + .3, 'slam');
  const fl = vt('v9', .5); ev(fl, 'flap'); ev(fl + .15, 'flap'); ev(fl + .35, 'ding'); ev(vt('v10', .45), 'pop');
  const gf = vt('v11', .72); ev(gf, 'flap'); ev(gf + .15, 'flap'); ev(ve('v11') + .3, 'stamp');
  ev(S.vision + .3, 'draw'); VT.slice(0, 5).forEach((x, i) => ev(x, 'drop', { d: i + 1 })); ev(CROSS, 'boom');
  for (let i = 0; i < 10; i++) ev(CROSS + .1 + i * .04, 'roll'); ev(CROSS + .9, 'stamp');
  ev(VT[2] + .25, 'pop');
  ev(S.transformer - .1, 'paper'); ev(S.transformer + .5, 'type'); ev(vt('v15', .62), 'pop');
  [vt('v16', .38), vt('v16', .6), vt('v16', .8)].forEach(x => ev(x, 'fall')); ev(ve('v16') + .2, 'ding');
  ev(S.chatgpt + .05, 'flap'); ev(S.chatgpt + .17, 'flap'); ev(ve('v17') + .15, 'stamp');
  ROWS.forEach((_, i) => ev(S.recap + .55 + i * .35, 'tick_ok', { i }));
  // music cues and the timeline itself (mix.py reads them)
  ev(0, 'timeline', { S: { ...S }, D: { ...D }, cross: CROSS, dur: DUR });
  for (const l of lines) ev(V[l.id].a, 'vo', { id: l.id, d: V[l.id].d, text: l.text });
  EV = E.sort((a, b) => a.t - b.t);
}

window.render = render; window.TEXTS = t => { render(t); return TX; };
(async () => {
  makeGrain();
  let dur; try { dur = await fetch('vo/dur.json').then(r => { if (!r.ok) throw 0; return r.json(); }); } catch (e) { dur = await fetch('vo/dur.est.json').then(r => r.json()); }
  const lines = await fetch('vo/lines.json').then(r => r.json());
  buildTimeline(dur); visionTimes(); buildEvents(lines);
  window.DUR = DUR; window.EV = EV; window.TL = { S, D, V };
  const names = ['turing', 'eniac', 'deepblue', 'baduk', 'pleiades'];
  const imgs = await Promise.all(names.map(n => loadImg(`assets/plate_${n}.jpg`))); names.forEach((n, i) => IM[n] = imgs[i]);
  await Promise.all([F.b8(40), F.b6(40), F.b6i(40), F.mono(40)].map(f => document.fonts.load(f, 'Aa ĞğŞşİıÇçÖöÜü')));
  render(0); window.READY = true;
})();
