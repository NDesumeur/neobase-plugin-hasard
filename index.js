// Hasard : ton appli d'origine (HTML et code inchangés), livrée en plugin.
// Ses données sont dans le dossier du plugin, que NeoDex sauvegarde (synchro cloud et sauvegardes) ; à la première ouverture elle reprend ce que tu avais dans NeoDex.
// Elle tourne dans le bac à sable de NeoDex, avec ses outils d'interface (ctx.host) et seulement les autorisations de son plugin.json.
const HTML = "<div class=\"appWrap\">\n      <div class=\"agHead\"><span class=\"label\">Hasard</span></div>\n      <div class=\"rdMain\">\n        <div class=\"sysCard px rdWheelCard\"><span class=\"label\">Roue</span><canvas id=\"rdWheel\" width=\"320\" height=\"320\" title=\"Clic : tourner\"></canvas><div class=\"rdResult\" id=\"rdResult\">Clique sur la roue</div><button class=\"btn main px\" id=\"rdSpinBtn\">Tourner</button></div>\n        <div class=\"sysCard px\"><span class=\"label\">Choix de la roue (un par ligne)</span><textarea class=\"f\" id=\"rdList\" rows=\"10\" spellcheck=\"false\"></textarea></div>\n      </div>\n      <div class=\"sysGrid\">\n        <div class=\"sysCard px\"><span class=\"label\">Dés</span><div class=\"bdPlan\"><select class=\"f\" id=\"rdCount\"><option>1</option><option selected>2</option><option>3</option><option>4</option><option>5</option><option>6</option></select> dé(s) à <select class=\"f\" id=\"rdFaces\"><option>4</option><option selected>6</option><option>8</option><option>10</option><option>12</option><option>20</option><option>100</option></select> faces</div><div id=\"rdDice\"></div><div class=\"hint\" id=\"rdDiceSum\"></div><button class=\"btn px\" id=\"rdRoll\">Lancer</button></div>\n        <div class=\"sysCard px\"><span class=\"label\">Pile ou face</span><div id=\"rdCoin\" class=\"rdCoin\">?</div><div class=\"rdResult\" id=\"rdCoinRes\"></div><button class=\"btn px\" id=\"rdFlip\">Lancer la pièce</button></div>\n        <div class=\"sysCard px\"><span class=\"label\">Nombre au hasard</span><div class=\"bdPlan\">De <input class=\"f\" id=\"rdMin\" value=\"1\" inputmode=\"numeric\"> à <input class=\"f\" id=\"rdMax\" value=\"100\" inputmode=\"numeric\"></div><div class=\"rdResult\" id=\"rdNumRes\">—</div><button class=\"btn px\" id=\"rdNum\">Tirer</button></div>\n      </div>\n    </div>";
/*CSS-MOVED*/ const CSS = `.rdMain{display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:start}
.rdWheelCard{align-items:center}
#rdWheel{cursor:var(--cp,pointer)}
.rdResult{font:16px var(--title);color:#fff;min-height:24px;text-align:center}
#rdList{font-size:16px;min-height:260px;resize:vertical}
#rdDice{display:flex;flex-wrap:wrap;gap:10px;min-height:56px}
.rdDie{width:52px;height:52px;background:#f3eaff;display:grid;place-items:center;font:16px var(--title);color:#130a20;box-shadow:0 0 0 3px var(--line2)}
.rdDie canvas{width:42px;height:42px;image-rendering:pixelated}
.rdCoin{width:80px;height:80px;margin:0 auto;border-radius:50%;background:radial-gradient(#ffe7a8,#e8a838);display:grid;place-items:center;font:24px var(--title);color:#7a3c10;box-shadow:0 0 0 4px #b8641c}
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
  for (const k of ["neoWheel"]) if (__ls[k] === undefined) { const v = legacy.local ? legacy.local(k) : null; if (v != null) { __ls[k] = v; __lsNew = true; } }  // première ouverture : tu retrouves ce que tu avais
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
  function rdWheel() {
    const cv = $('rdWheel'), g = cv.getContext('2d'), n = rdEntries.length || 1, r = cv.width / 2 - 8, cx = cv.width / 2;
    g.clearRect(0, 0, cv.width, cv.height);
    rdEntries.forEach((t, i) => {
      const a0 = rdAngle + i / n * Math.PI * 2, a1 = a0 + Math.PI * 2 / n;
      g.beginPath(); g.moveTo(cx, cx); g.arc(cx, cx, r, a0, a1); g.closePath(); g.fillStyle = RD_COLORS[i % RD_COLORS.length]; g.fill(); g.strokeStyle = '#130a20'; g.lineWidth = 3; g.stroke();
      const mid = (a0 + a1) / 2, left = Math.cos(mid) < 0;  // the left half is turned round so no text is upside down
      g.save(); g.translate(cx, cx); g.rotate(left ? mid + Math.PI : mid); g.fillStyle = '#130a20'; g.font = "600 15px 'Pixelify Sans', sans-serif"; g.textAlign = left ? 'left' : 'right'; g.fillText(t.slice(0, 16), left ? -(r - 12) : r - 12, 5); g.restore();
    });
    g.beginPath(); g.arc(cx, cx, 16, 0, 7); g.fillStyle = '#130a20'; g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(cv.width - 4, cx); g.lineTo(cv.width - 26, cx - 11); g.lineTo(cv.width - 26, cx + 11); g.fill();  // pointer on the right
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
