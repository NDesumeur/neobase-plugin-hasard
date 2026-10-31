// Hasard, plugin NeoBase autonome (permission « storage » pour garder les choix de la roue, synchronisés).
const RD_DEFAULT = ['Pizza', 'Sushis', 'Burger', 'Pâtes', 'Tacos', 'Salade'];
const COLORS = ['#8a5cf0', '#e01ec8', '#7fe0ee', '#ffd07a', '#8ee8a0', '#ff9a3c', '#ff5ad9', '#3b5bdb'];
export default function (ctx) {
  const el = ctx.el;
  let entries = RD_DEFAULT.slice(), angle = 0, spinning = false, saveT = null;

  const S = el('style');
  S.textContent = `
    .rd{padding:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:14px;align-items:start}
    .rd .card{background:color-mix(in srgb,var(--line,#2a1d52) 35%,var(--bg0,#0b031c));padding:14px;box-shadow:inset 0 0 0 2px var(--line2,#3a2a6e)}
    .rd .label{font:10px var(--title,monospace);color:var(--muted,#8f7bb8);display:block;margin-bottom:8px}
    .rd canvas{display:block;margin:0 auto;max-width:100%}
    .rd textarea{width:100%;min-height:150px;background:color-mix(in srgb,var(--bg0,#0b031c) 70%,#000);color:var(--shell,#fff);border:2px solid var(--line2,#3a2a6e);font:14px var(--text,sans-serif);padding:8px;box-sizing:border-box;outline:0}
    .rd .res{font:30px var(--title,monospace);color:#fff;text-align:center;margin:8px 0;min-height:30px}
    .rd button{font:12px var(--title,monospace);color:#fff;border:0;padding:10px 14px;cursor:pointer;background:color-mix(in srgb,var(--violet,#8a5cf0) 70%,#000);box-shadow:inset 0 2px 0 rgba(255,255,255,.2),inset 0 -3px 0 rgba(0,0,0,.35)}
    .rd button.main{background:color-mix(in srgb,var(--magenta,#e01ec8) 80%,#000)}
    .rd .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:8px}
    .rd input,.rd select{font:15px var(--text,sans-serif);padding:7px 9px;background:color-mix(in srgb,var(--bg0,#0b031c) 70%,#000);color:#fff;border:2px solid var(--line2,#3a2a6e);width:80px;outline:0}
    .rd .dice{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:8px 0;min-height:44px}
    .rd .die{width:44px;height:44px;display:grid;place-items:center;background:#f3eaff;color:#130a20;font:20px var(--title,monospace);box-shadow:0 2px 0 rgba(0,0,0,.4)}
    .rd .coin{width:70px;height:70px;border-radius:50%;background:radial-gradient(#ffe08a,#e0a800);color:#5a3a00;display:grid;place-items:center;font:28px var(--title,monospace);margin:8px auto}`;

  // --- roue ---
  const cv = el('canvas'); cv.width = cv.height = 260;
  const pick = el('div', 'res');
  const list = el('textarea'); list.spellcheck = false;
  const spinBtn = el('button', 'main', 'TOURNER');
  const wheelCard = el('div', 'card'); wheelCard.append(el('span', 'label', 'ROUE'), cv, pick, el('span', 'label', 'Tes choix (une ligne chacun)'), list);
  const wrow = el('div', 'row'); wrow.append(spinBtn); wheelCard.append(wrow);
  function drawWheel() {
    const g = cv.getContext('2d'), n = entries.length || 1, r = cv.width / 2 - 8, cx = cv.width / 2;
    g.clearRect(0, 0, cv.width, cv.height);
    entries.forEach((t, i) => {
      const a0 = angle + i / n * Math.PI * 2, a1 = a0 + Math.PI * 2 / n;
      g.beginPath(); g.moveTo(cx, cx); g.arc(cx, cx, r, a0, a1); g.closePath(); g.fillStyle = COLORS[i % COLORS.length]; g.fill(); g.strokeStyle = '#130a20'; g.lineWidth = 3; g.stroke();
      const mid = (a0 + a1) / 2, left = Math.cos(mid) < 0;
      g.save(); g.translate(cx, cx); g.rotate(left ? mid + Math.PI : mid); g.fillStyle = '#130a20'; g.font = "600 15px 'Pixelify Sans',sans-serif"; g.textAlign = left ? 'left' : 'right'; g.fillText(t.slice(0, 16), left ? -(r - 12) : r - 12, 5); g.restore();
    });
    g.beginPath(); g.arc(cx, cx, 16, 0, 7); g.fillStyle = '#130a20'; g.fill();
    g.beginPath(); g.moveTo(cx + r, cx - 10); g.lineTo(cx + r + 14, cx); g.lineTo(cx + r, cx + 10); g.fillStyle = '#fff'; g.fill();  // repère à droite
  }
  function spin() {
    if (spinning || !entries.length) return; spinning = true; pick.textContent = '';
    const target = angle + Math.PI * 2 * (4 + Math.random() * 3), t0 = performance.now(), dur = 3200, from = angle;
    const step = t => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      angle = from + (target - from) * e; drawWheel();
      if (k < 1) requestAnimationFrame(step);
      else { spinning = false; const n = entries.length, norm = ((-angle) % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2); pick.textContent = entries[Math.floor(norm / (Math.PI * 2 / n)) % n]; }
    };
    requestAnimationFrame(step);
  }
  spinBtn.onclick = spin; cv.onclick = spin;
  list.oninput = () => { entries = list.value.split('\n').map(s => s.trim()).filter(Boolean).slice(0, 24); drawWheel(); clearTimeout(saveT); saveT = setTimeout(() => ctx.storage.set({entries}), 600); };

  // --- dés ---
  const dice = el('div', 'dice'), diceSum = el('div', 'hint'); diceSum.style.textAlign = 'center';
  const dCount = el('input'); dCount.type = 'number'; dCount.value = '2'; dCount.min = '1'; dCount.max = '10';
  const dFaces = el('select'); for (const f of [4, 6, 8, 10, 12, 20]) { const o = el('option', '', 'd' + f); o.value = f; dFaces.append(o); } dFaces.value = '6';
  const dBtn = el('button', 'main', 'LANCER');
  const diceCard = el('div', 'card'); const dr = el('div', 'row'); dr.append(dCount, dFaces, dBtn);
  diceCard.append(el('span', 'label', 'DÉS'), dice, diceSum, dr);
  dBtn.onclick = () => {
    const count = Math.max(1, Math.min(10, +dCount.value || 1)), faces = +dFaces.value; let k = 0;
    const roll = () => { const v = Array.from({length: count}, () => 1 + Math.floor(Math.random() * faces)); dice.replaceChildren(...v.map(n => el('div', 'die', String(n)))); diceSum.textContent = count > 1 ? 'Total : ' + v.reduce((a, b) => a + b, 0) : ''; if (++k < 10) setTimeout(roll, 60 + k * 12); };
    roll();
  };

  // --- pile ou face + nombre ---
  const coin = el('div', 'coin', '?'), coinRes = el('div', 'res'), flip = el('button', 'main', 'LANCER');
  const coinCard = el('div', 'card'); const cr = el('div', 'row'); cr.append(flip);
  coinCard.append(el('span', 'label', 'PILE OU FACE'), coin, coinRes, cr);
  flip.onclick = () => { coin.textContent = '…'; coinRes.textContent = ''; setTimeout(() => { const p = Math.random() < .5; coin.textContent = p ? 'P' : 'F'; coinRes.textContent = p ? 'Pile' : 'Face'; }, 700); };
  const nMin = el('input'); nMin.type = 'number'; nMin.value = '1'; const nMax = el('input'); nMax.type = 'number'; nMax.value = '100';
  const nRes = el('div', 'res'), nBtn = el('button', 'main', 'TIRER');
  const numCard = el('div', 'card'); const nr = el('div', 'row'); nr.append(nMin, el('span', '', '→'), nMax, nBtn);
  numCard.append(el('span', 'label', 'NOMBRE AU HASARD'), nRes, nr);
  nBtn.onclick = () => { const a = Math.round(+nMin.value), b = Math.round(+nMax.value); if (!(b >= a)) return ctx.ui.toast('Le max doit être ≥ au min', true); nRes.textContent = String(a + Math.floor(Math.random() * (b - a + 1))); };

  const wrap = el('div', 'rd'); wrap.append(wheelCard, diceCard, coinCard, numCard);
  ctx.view.append(S, wrap);
  ctx.onOpen(async () => { const d = await ctx.storage.get(); if (d && d.entries?.length) entries = d.entries; list.value = entries.join('\n'); drawWheel(); });
}
