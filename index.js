// Hasard : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap\">\n      <div class=\"agHead\"><span class=\"label\">Hasard</span></div>\n      <div class=\"rdMain\">\n        <div class=\"sysCard px rdWheelCard\"><span class=\"label\">Roue</span><canvas id=\"rdWheel\" width=\"320\" height=\"320\" title=\"Clic : tourner\"></canvas><div class=\"rdResult\" id=\"rdResult\">Clique sur la roue</div><button class=\"btn main px\" id=\"rdSpinBtn\">Tourner</button></div>\n        <div class=\"sysCard px\"><span class=\"label\">Choix de la roue (un par ligne)</span><textarea class=\"f\" id=\"rdList\" rows=\"10\" spellcheck=\"false\"></textarea></div>\n      </div>\n      <div class=\"sysGrid\">\n        <div class=\"sysCard px\"><span class=\"label\">Dés</span><div class=\"bdPlan\"><select class=\"f\" id=\"rdCount\"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select> dé(s) à <select class=\"f\" id=\"rdFaces\"><option>4</option><option selected>6</option><option>8</option><option>10</option><option>12</option><option>20</option><option>100</option></select> faces</div><div id=\"rdDice\"></div><div class=\"hint\" id=\"rdDiceSum\"></div><button class=\"btn px\" id=\"rdRoll\">Lancer</button></div>\n        <div class=\"sysCard px\"><span class=\"label\">Pile ou face</span><div id=\"rdCoin\" class=\"rdCoin\">?</div><div class=\"rdResult\" id=\"rdCoinRes\"></div><button class=\"btn px\" id=\"rdFlip\">Lancer la pièce</button></div>\n        <div class=\"sysCard px\"><span class=\"label\">Nombre au hasard</span><div class=\"bdPlan\">De <input class=\"f\" id=\"rdMin\" value=\"1\" inputmode=\"numeric\"> à <input class=\"f\" id=\"rdMax\" value=\"100\" inputmode=\"numeric\"></div><div class=\"rdResult\" id=\"rdNumRes\">—</div><button class=\"btn px\" id=\"rdNum\">Tirer</button></div>\n      </div>\n    </div>";
/*CSS-MOVED*/ const CSS = `.rdMain{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start}
.rdWheelCard{align-items:center}
#rdWheel{cursor:var(--cp,pointer)}
.rdResult{font:16px var(--title);color:#fff;min-height:24px;text-align:center;text-shadow:3px 3px 0 #000}
#rdWheel{image-rendering:pixelated;width:320px;height:320px}
.rdDie{box-shadow:0 0 0 3px #130a20,inset -4px -4px 0 #c9bdf0,4px 4px 0 3px rgba(0,0,0,.4)}
#rdList{font-size:17px;line-height:28px;min-height:260px;resize:vertical;color:#2b2350;padding:4px 12px 4px 40px;border:0;box-shadow:0 0 0 3px #1b1230,6px 6px 0 3px rgba(0,0,0,.4);background:linear-gradient(90deg,transparent 28px,#e0707f 28px 30px,transparent 30px),repeating-linear-gradient(to bottom,transparent 0 26px,#a9bde0 26px 28px),#f3e9cf;background-attachment:local}
#rdDice{display:flex;flex-wrap:wrap;gap:10px;min-height:56px}
.rdDie{width:52px;height:52px;background:#f3eaff;display:grid;place-items:center;font:16px var(--title);color:#130a20;box-shadow:0 0 0 3px var(--line2)}
.rdDie canvas{width:42px;height:42px;image-rendering:pixelated}
.rdCoin{width:80px;height:80px;margin:0 auto;display:grid;place-items:center;font:22px var(--title);color:#7a3c10;text-shadow:2px 2px 0 #ffe7a8;image-rendering:pixelated;background:no-repeat center/100% url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' shape-rendering='crispEdges'%3E%3Cpath fill='%237a3c10' d='M6 0h8v2h2v2h2v2h2v8h-2v2h-2v2h-2v2H6v-2H4v-2H2v-2H0V6h2V4h2V2h2z'/%3E%3Cpath fill='%23e8a838' d='M6 2h8v2h2v2h2v8h-2v2h-2v2H6v-2H4v-2H2V6h2V4h2z'/%3E%3Cpath fill='%23ffd07a' d='M6 3h8v1h1v1h1v2h-1V6h-1V5h-1V4H6v1H5v1H4v2H3V6h1V5h1V4h1z'/%3E%3Cpath fill='%23b8641c' d='M16 12h1v2h-1v1h-1v1h-1v1H6v-1h8v-1h1v-1h1z'/%3E%3C/svg%3E")}
.rdCoin.spin{animation:coin .9s steps(12)}
.bdPlan input.f#rdMin,.bdPlan input.f#rdMax{width:90px}
.bdPlan{display:flex;align-items:center;gap:10px;flex-wrap:wrap;font-size:16px;color:var(--lilac)}
.bdPlan .f{width:110px;font-size:15px;padding:7px 10px}
.bdPlan select.f{width:160px}
`;  // le style de ce plugin (il utilise les variables du thème de NeoDex)
export default async function (ctx) {
  const view = ctx.view;
  if (!ctx.host) { view.textContent = "Ce plugin doit être approuvé par NeoDex pour s'ouvrir."; return; }
  const { el, toast, sfx, ask, newTab, pixIcon, PIX, WX } = ctx.host;
  const folder = ctx.folder, legacy = ctx.legacy || {};
  ctx.host.addStyle(CSS);
  view.innerHTML = HTML;
  const $ = id => id === "randomApp" ? view : view.querySelector('#' + id);  // les identifiants de ta vue, sans toucher à ceux du reste de NeoDex
  const doc = async n => { try { return await folder.read(n); } catch { return null; } };
  const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const money = s => { const v = parseFloat(String(s).replace(/[\s  €]/g, '').replace(',', '.')); return isFinite(v) ? Math.round(v * 100) / 100 : NaN; };
  let prefs = await doc('prefs');
  if (prefs == null) {  // première ouverture : tu retrouves tes réglages d'avant
    prefs = {}; const old = legacy.settings ? await legacy.settings().catch(() => ({})) : {};
    for (const k of ["wheel"]) if (old[k] !== undefined && old[k] !== '' && !(Array.isArray(old[k]) && !old[k].length)) prefs[k] = old[k];
    if (Object.keys(prefs).length) await folder.write('prefs', prefs);
  }
  const neo = { win: a => ctx.host.win?.(a), getSettings: async () => prefs, setSettings: async s => { Object.assign(prefs, s); await folder.write('prefs', prefs); return prefs; } };
  const __ls = (await doc('local')) || {}; let __lsT = null, __lsNew = false;
  for (const k of ["neoWheel"]) if (__ls[k] === undefined) { const v = legacy.local ? await legacy.local(k) : null; if (v != null) { __ls[k] = v; __lsNew = true; } }  // première ouverture : tu retrouves ce que tu avais
  const __lsSave = () => { clearTimeout(__lsT); __lsT = setTimeout(() => folder.write('local', __ls).catch(() => {}), 400); };
  if (__lsNew) __lsSave();
  const localStorage = new Proxy(__ls, { get: (t, k) => k === 'getItem' ? (x => t[x] ?? null) : k === 'setItem' ? ((x, v) => { t[x] = String(v); __lsSave(); }) : t[k], set: (t, k, v) => { t[k] = String(v); __lsSave(); return true; } });
  // ---- ton code d'origine ----
  /* ---------- Hasard app: a wheel with your own entries, dice, coin, number and draw ---------- */
  // the wheel's choices are in the settings (synced); the ones kept on this PC before come along the first time
  const RD_DEFAULT = ['Pizza', 'Sushis', 'Burger', 'Pâtes', 'Tacos', 'Salade'];
  let rdEntries = (() => { try { return JSON.parse(localStorage.neoWheel); } catch { return null; } })() || RD_DEFAULT;
  let rdAngle = 0, rdSpinning = false;
  const RD_COLORS = ['#8a5cf0', '#e01ec8', '#7fe0ee', '#ffd07a', '#8ee8a0', '#ff9a3c', '#ff5ad9', '#3b5bdb'];
  const RD_PX = 80, rdBuf = document.createElement('canvas'), RD_RGB = RD_COLORS.map(c => [1, 3, 5].map(i => parseInt(c.slice(i, i + 2), 16)));
  rdBuf.width = rdBuf.height = RD_PX;
  function rdWheel() {
    const cv = $('rdWheel'), g = cv.getContext('2d'), n = rdEntries.length || 1, S = cv.width / RD_PX, R = RD_PX / 2 - 2, c0 = RD_PX / 2, TAU = Math.PI * 2;
    // pixel by pixel on an 80 px canvas, then enlarged without smoothing: hard edges, a 1 px dark outline between parts
    const b = rdBuf.getContext('2d'), img = b.createImageData(RD_PX, RD_PX), d = img.data;
    for (let y = 0; y < RD_PX; y++) for (let x = 0; x < RD_PX; x++) {
      const dx = x + .5 - c0, dy = y + .5 - c0, dist = Math.hypot(dx, dy), o = (y * RD_PX + x) * 4;
      if (dist > R + 1) continue;
      let col = [19, 10, 32];
      if (dist <= R && dist > 6) {
        const a = ((Math.atan2(dy, dx) - rdAngle) % TAU + TAU) % TAU, f = a / TAU * n, i = Math.floor(f) % n, edge = Math.min(f - Math.floor(f), Math.ceil(f) - f) * TAU / n * dist;
        if (edge > .7) { col = RD_RGB[i % RD_RGB.length]; if (dist > R - 2) col = col.map(v => v * .72); else if (dist < 12) col = col.map(v => Math.min(255, v * 1.12)); }
      } else if (dist <= 4) col = [243, 234, 255];
      d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; d[o + 3] = 255;
    }
    b.putImageData(img, 0, 0);
    g.clearRect(0, 0, cv.width, cv.height); g.imageSmoothingEnabled = false; g.drawImage(rdBuf, 0, 0, cv.width, cv.height);
    rdEntries.forEach((t, i) => {
      const mid = rdAngle + (i + .5) / n * TAU, left = Math.cos(mid) < 0;  // the left half is turned round so no text is upside down
      g.save(); g.translate(cv.width / 2, cv.width / 2); g.rotate(left ? mid + Math.PI : mid); g.font = "600 15px 'Pixelify Sans', sans-serif"; g.textAlign = left ? 'left' : 'right';
      const tx = left ? -(R * S - 14) : R * S - 14; g.fillStyle = 'rgba(255,255,255,.55)'; g.fillText(t.slice(0, 16), tx + 1, 6); g.fillStyle = '#130a20'; g.fillText(t.slice(0, 16), tx, 5); g.restore();
    });
    // the pointer on the right, in pixels
    const P = ['#.....', '###...', '#####.', '######', '#####.', '###...', '#.....'], px0 = cv.width - 6 * 4 - 2, py0 = cv.width / 2 - 14;
    P.forEach((row, j) => [...row].forEach((ch, k) => { if (ch === '#') { g.fillStyle = '#130a20'; g.fillRect(px0 + (5 - k) * 4 - 2, py0 + j * 4 - 2, 8, 8); } }));
    P.forEach((row, j) => [...row].forEach((ch, k) => { if (ch === '#') { g.fillStyle = j === 3 || k === 0 ? '#ffd07a' : '#fff'; g.fillRect(px0 + (5 - k) * 4, py0 + j * 4, 4, 4); } }));
  }
  function rdSpin() {
    if (rdSpinning || !rdEntries.length) return;
    rdSpinning = true; $('rdResult').textContent = '…';
    const start = rdAngle, turn = Math.PI * 2 * (5 + Math.random() * 4), t0 = performance.now(), dur = 3800;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - (1 - k) ** 4; rdAngle = start + turn * e; rdWheel();
      if (k < 1) return requestAnimationFrame(step);
      rdSpinning = false;
      const n = rdEntries.length, at = ((-rdAngle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2), i = Math.floor(at / (Math.PI * 2) * n) % n;  // slice under the pointer (angle 0)
      $('rdResult').textContent = rdEntries[i]; sfx('notify');
    };
    requestAnimationFrame(step); sfx('launch');
  }
  function rdOpen() {
    if (prefs.wheel?.length) rdEntries = prefs.wheel; else if (rdEntries !== RD_DEFAULT) neo.setSettings({wheel: rdEntries}).then(s => { prefs = s; });
    $('rdList').value = rdEntries.join('\n'); rdWheel();
  }
  $('rdList').oninput = () => { rdEntries = $('rdList').value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 24); clearTimeout(rdOpen.t); rdOpen.t = setTimeout(() => neo.setSettings({wheel: rdEntries}).then(s => { prefs = s; }), 600); rdWheel(); };
  $('rdSpinBtn').onclick = rdSpin; $('rdWheel').onclick = rdSpin;
  const DICE_DOTS = n => ({1: [[3, 3]], 2: [[1, 1], [5, 5]], 3: [[1, 1], [3, 3], [5, 5]], 4: [[1, 1], [5, 1], [1, 5], [5, 5]], 5: [[1, 1], [5, 1], [3, 3], [1, 5], [5, 5]], 6: [[1, 1], [5, 1], [1, 3], [5, 3], [1, 5], [5, 5]]})[n];
  function rdDie(n, faces) {
    const d = el('div', 'rdDie');
    if (faces === 6) { const c = document.createElement('canvas'); c.width = c.height = 7; const g = c.getContext('2d'); g.fillStyle = '#130a20'; for (const [x, y] of DICE_DOTS(n)) g.fillRect(x, y, 1, 1); d.append(c); }
    else d.textContent = n;
    return d;
  }
  $('rdRoll').onclick = () => {
    const count = +$('rdCount').value, faces = +$('rdFaces').value; let k = 0;
    const roll = () => { const v = Array.from({length: count}, () => 1 + Math.floor(Math.random() * faces)); $('rdDice').replaceChildren(...v.map(n => rdDie(n, faces))); $('rdDiceSum').textContent = count > 1 ? 'Total : ' + v.reduce((a, b) => a + b, 0) : ''; if (++k < 10) setTimeout(roll, 60 + k * 12); else sfx('notify'); };
    roll();
  };
  $('rdFlip').onclick = () => {
    const c = $('rdCoin'); c.classList.remove('spin'); void c.offsetWidth; c.classList.add('spin'); $('rdCoinRes').textContent = '…';
    setTimeout(() => { const pile = Math.random() < .5; c.textContent = pile ? 'P' : 'F'; $('rdCoinRes').textContent = pile ? 'Pile' : 'Face'; sfx('notify'); }, 900);
  };
  $('rdNum').onclick = () => { const a = Math.round(money($('rdMin').value)), b = Math.round(money($('rdMax').value)); if (!(b >= a)) return toast('Le maximum doit être plus grand que le minimum', true); $('rdNumRes').textContent = String(a + Math.floor(Math.random() * (b - a + 1))); sfx('notify'); };
  // ---- fin ----
  ctx.onOpen(() => { rdOpen(); });
}
