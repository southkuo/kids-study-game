/* 數字島大冒險：地圖、關卡、魔王戰、存檔、家長設定 */
(function () {
  'use strict';
  const { REGIONS, R, shuffle } = window.MQ;
  const $app = document.getElementById('app');
  const SAVE_KEY = 'mathAdventure.v1';
  const AVATARS = ['🦊', '🐼', '🐯', '🐰', '🐨', '🦁', '🐸', '🐧'];
  const BOSS_HP = 6, HEARTS = 3;

  // ---------- 存檔 ----------
  const fresh = () => ({ player: null, stars: {}, bosses: {}, stats: {}, settings: { unlockAll: false, count: 6, autoRead: false, sound: true } });
  let S = fresh();
  try { const raw = localStorage.getItem(SAVE_KEY); if (raw) S = Object.assign(fresh(), JSON.parse(raw)); S.settings = Object.assign(fresh().settings, S.settings); } catch (e) { /* 沒有存檔也能玩 */ }
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 忽略 */ } };

  const regionOpen = (i) => S.settings.unlockAll || i === 0 || !!S.bosses[REGIONS[i - 1].id];
  const levelOpen = (r, lv) => S.settings.unlockAll || lv === 0 || (S.stars[`${r.id}-${lv - 1}`] || 0) > 0;
  const bossOpen = (r) => S.settings.unlockAll || [0, 1, 2].every((lv) => (S.stars[`${r.id}-${lv}`] || 0) > 0);
  const regionStars = (r) => [0, 1, 2, 'boss'].reduce((s, lv) => s + (S.stars[`${r.id}-${lv}`] || 0), 0);
  const totalStars = () => REGIONS.reduce((s, r) => s + regionStars(r), 0);
  const currentIdx = () => { let i = 0; while (i < REGIONS.length - 1 && S.bosses[REGIONS[i].id]) i++; return i; };

  // ---------- 小工具 ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (s) => String(s).replace(/\[(\d+)\/(\d+)\]/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
  const starStr = (n, max) => '★'.repeat(n) + '☆'.repeat(Math.max(0, (max || 3) - n));

  // 朗讀（二年級還在練習認字，可以聽題目）
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const t = String(text).replace(/<br>/g, '。').replace(/<[^>]+>/g, '')
      .replace(/\[(\d+)\/(\d+)\]/g, '$2分之$1').replace(/×/g, '乘以').replace(/÷/g, '除以').replace(/−/g, '減')
      .replace(/\+/g, '加').replace(/=/g, '等於').replace(/[？?□]/g, '多少').replace(/(\d),(\d)/g, '$1$2');
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'zh-TW'; u.rate = 0.9;
      const v = speechSynthesis.getVoices().find((x) => /zh[-_]TW/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* 忽略 */ }
  }

  // 音效
  let actx = null;
  function beep(kind) {
    if (!S.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { good: [660, 880], bad: [300, 220], win: [523, 659, 784, 1047], hit: [880, 440], tap: [600] }[kind] || [600];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), gn = actx.createGain(), t0 = actx.currentTime + i * 0.11;
        o.type = kind === 'bad' ? 'sawtooth' : 'triangle'; o.frequency.value = f;
        gn.gain.setValueAtTime(0.0001, t0); gn.gain.exponentialRampToValueAtTime(0.18, t0 + 0.02); gn.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.16);
        o.connect(gn).connect(actx.destination); o.start(t0); o.stop(t0 + 0.18);
      });
    } catch (e) { /* 忽略 */ }
  }

  function confetti(n) {
    const box = document.createElement('div'); box.className = 'confetti';
    const items = ['🎉', '⭐', '✨', '🎊', '💫'];
    for (let i = 0; i < (n || 24); i++) {
      const s = document.createElement('span'); s.textContent = items[i % items.length];
      s.style.left = R(0, 100) + '%'; s.style.animationDelay = (Math.random() * 0.6) + 's'; s.style.fontSize = R(18, 34) + 'px';
      box.appendChild(s);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 2600);
  }

  // ---------- 開始畫面：取名字、選角色 ----------
  function showStart() {
    let chosen = (S.player && S.player.avatar) || AVATARS[0];
    $app.innerHTML = `
      <section class="start">
        <div class="logo">🏝️</div>
        <h1>數字島大冒險</h1>
        <p class="sub">走遍 9 個地區，打敗魔王，收集寶物！</p>
        <label class="field">你叫什麼名字？<input id="nm" maxlength="8" value="${esc((S.player && S.player.name) || '')}" placeholder="輸入名字"></label>
        <div class="field">選一個夥伴：</div>
        <div class="avatars">${AVATARS.map((a) => `<button class="av ${a === chosen ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
        <button class="btn big gold" id="go">出發！ ▶</button>
      </section>`;
    $app.querySelectorAll('.av').forEach((b) => b.onclick = () => {
      chosen = b.dataset.a; beep('tap');
      $app.querySelectorAll('.av').forEach((x) => x.classList.toggle('on', x === b));
    });
    $app.querySelector('#go').onclick = () => {
      const name = $app.querySelector('#nm').value.trim() || '小勇士';
      S.player = { name, avatar: chosen }; save(); beep('win'); showMap(true);
    };
  }

  // ---------- 地圖 ----------
  const XS = [24, 64, 78, 44, 18, 40, 76, 60, 28];
  const GAP = 170, TOP = 120;
  function showMap(scrollToCurrent) {
    const H = TOP + (REGIONS.length - 1) * GAP + 160;
    const pts = REGIONS.map((r, i) => [XS[i], TOP + i * GAP]);
    let path = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], my = (y0 + y1) / 2;
      path += ` C ${x0} ${my} ${x1} ${my} ${x1} ${y1}`;
    }
    const cur = currentIdx();
    const deco = ['🌲', '☁️', '🌷', '🐦', '🌴', '🪨', '🐠', '⛰️', '🔥', '✨', '🌟', '🌿', '🦋', '🐚', '🌾', '🪐'];
    let decoHTML = '';
    for (let i = 0; i < 26; i++) {
      const y = 60 + i * (H - 120) / 26, x = (i * 37 + 11) % 100;
      decoHTML += `<span class="deco" style="top:${y}px;left:${x}%">${deco[(i * 7) % deco.length]}</span>`;
    }
    const nodes = REGIONS.map((r, i) => {
      const open = regionOpen(i), st = regionStars(r), done = !!S.bosses[r.id];
      return `<button class="node ${open ? '' : 'locked'} ${done ? 'done' : ''}" data-i="${i}" style="left:${XS[i]}%;top:${TOP + i * GAP}px;--c:${r.color}">
        <span class="ic">${open ? r.icon : '🔒'}</span>${done ? '<span class="crown">👑</span>' : ''}
        <span class="lbl"><b>${r.name}</b><small>${['', '', '二', '三', '四'][r.grade]}年級・★ ${st}/12</small></span>
        ${i === cur ? `<span class="me ${XS[i] > 55 ? 'l' : ''}">${esc(S.player.avatar)}</span>` : ''}
      </button>`;
    }).join('');
    $app.innerHTML = `
      <header class="top">
        <button class="chip" id="who">${esc(S.player.avatar)} ${esc(S.player.name)}</button>
        <span class="chip">⭐ ${totalStars()}</span>
        <span class="sp"></span>
        <button class="icon" id="bag" title="寶物箱">🎒</button>
        <button class="icon" id="snd" title="音效">${S.settings.sound ? '🔊' : '🔇'}</button>
        <button class="icon" id="par" title="家長設定">⚙️</button>
      </header>
      <section class="map" style="height:${H}px">
        <svg class="path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>
        ${decoHTML}${nodes}
      </section>`;
    $app.querySelectorAll('.node').forEach((b) => b.onclick = () => {
      const i = +b.dataset.i;
      if (!regionOpen(i)) { beep('bad'); toast(`先打敗「${REGIONS[i - 1].name}」的魔王，才能來這裡喔！`); return; }
      beep('tap'); showRegion(i);
    });
    $app.querySelector('#who').onclick = showStart;
    $app.querySelector('#bag').onclick = showBag;
    $app.querySelector('#snd').onclick = () => { S.settings.sound = !S.settings.sound; save(); showMap(); };
    $app.querySelector('#par').onclick = parentGate;
    if (scrollToCurrent) {
      const el = $app.querySelector(`.node[data-i="${cur}"]`);
      if (el) setTimeout(() => el.scrollIntoView({ block: 'center', behavior: 'smooth' }), 60);
    }
  }

  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2400);
  }

  function modal(html) {
    const m = document.createElement('div'); m.className = 'modal';
    m.innerHTML = `<div class="sheet">${html}</div>`;
    m.onclick = (e) => { if (e.target === m) m.remove(); };
    document.body.appendChild(m);
    return m;
  }

  // ---------- 地區：選關卡 ----------
  function showRegion(i) {
    const r = REGIONS[i];
    const rows = r.levels.map((name, lv) => {
      const open = levelOpen(r, lv), st = S.stars[`${r.id}-${lv}`] || 0;
      return `<button class="lv ${open ? '' : 'locked'}" data-lv="${lv}"><span class="n">${lv + 1}</span><span class="t">${name}</span><span class="s">${open ? starStr(st) : '🔒'}</span></button>`;
    }).join('');
    const bo = bossOpen(r), bst = S.stars[`${r.id}-boss`] || 0;
    const m = modal(`
      <div class="rhead" style="--c:${r.color}"><span class="ric">${r.icon}</span><div><h2>${r.name}</h2><small>${['', '', '二', '三', '四'][r.grade]}年級</small></div><button class="x">✕</button></div>
      <div class="lvs">${rows}
        <button class="lv boss ${bo ? '' : 'locked'}" data-lv="boss"><span class="n">${r.boss.icon}</span><span class="t">魔王：${r.boss.name}</span><span class="s">${bo ? starStr(bst) : '🔒'}</span></button>
      </div>
      <p class="note">${S.bosses[r.id] ? `已經拿到寶物 ${r.treasure}！` : '三關都過了，就能挑戰魔王，拿到寶物！'}</p>`);
    m.querySelector('.x').onclick = () => m.remove();
    m.querySelectorAll('.lv').forEach((b) => b.onclick = () => {
      const lv = b.dataset.lv === 'boss' ? 'boss' : +b.dataset.lv;
      const ok = lv === 'boss' ? bo : levelOpen(r, lv);
      if (!ok) { beep('bad'); toast(lv === 'boss' ? '先把三關都過了，再來挑戰魔王！' : '先過前一關喔！'); return; }
      m.remove(); beep('tap'); startLevel(i, lv);
    });
  }

  // ---------- 遊戲 ----------
  let P = null; // 正在玩的關卡
  function startLevel(i, lv) {
    const r = REGIONS[i];
    P = { i, r, lv, boss: lv === 'boss', n: 0, total: lv === 'boss' ? Infinity : S.settings.count, right: 0, wrong: 0, hearts: HEARTS, hp: BOSS_HP, seen: new Set(), q: null };
    nextQ();
  }
  function makeQ() {
    const d = P.boss ? [1, 2, 2, 3, 3][R(0, 4)] : P.lv + 1;
    let q, k = 0;
    do { q = P.r.gen(d); } while (P.seen.has(q.text + q.visual) && k++ < 12);
    P.seen.add(q.text + q.visual);
    return q;
  }
  function nextQ() {
    if (P.boss ? (P.hp <= 0 || P.hearts <= 0) : P.n >= P.total) return finish();
    P.q = makeQ(); P.n++; P.locked = false;
    const q = P.q, r = P.r;
    const bar = P.boss
      ? `<div class="bossbar"><span class="bic ${P.hp < BOSS_HP ? 'hurt' : ''}">${r.boss.icon}</span><div class="hp"><i style="width:${P.hp / BOSS_HP * 100}%"></i></div><span class="hearts">${'❤️'.repeat(P.hearts)}${'🤍'.repeat(HEARTS - P.hearts)}</span></div>`
      : `<div class="prog">${Array.from({ length: P.total }, (_, k) => `<i class="${k < P.n - 1 ? 'did' : k === P.n - 1 ? 'now' : ''}"></i>`).join('')}</div>`;
    $app.innerHTML = `
      <section class="play" style="--c:${r.color}">
        <header class="ptop"><button class="icon" id="quit" title="離開">✕</button><span class="pt">${r.icon} ${P.boss ? '魔王：' + r.boss.name : r.levels[P.lv]}</span><span class="pav">${esc(S.player.avatar)}</span></header>
        ${bar}
        <div class="card">
          <button class="icon read" id="read" title="念題目">🔊</button>
          <div class="qt">${fmt(q.text)}</div>
          ${q.visual ? `<div class="vis">${q.visual}</div>` : ''}
        </div>
        <div class="opts ${q.options.length === 2 ? 'two' : ''}">${q.options.map((o, k) => `<button class="opt ${o.replace(/\[.*?\]/g, '#').length > 7 ? 'long' : ''}" data-k="${k}">${fmt(o)}</button>`).join('')}</div>
        <div id="fb"></div>
      </section>`;
    $app.querySelector('#quit').onclick = () => { if (confirm('要離開這一關嗎？這一關的進度不會保存。')) { speechSynthesis && speechSynthesis.cancel && speechSynthesis.cancel(); showMap(); } };
    $app.querySelector('#read').onclick = () => speak(q.text);
    $app.querySelectorAll('.opt').forEach((b) => b.onclick = () => answer(b));
    if (S.settings.autoRead) speak(q.text);
  }
  function answer(btn) {
    if (P.locked) return; P.locked = true;
    const q = P.q, pickd = q.options[+btn.dataset.k], ok = pickd === q.answer;
    const st = S.stats[P.r.id] || (S.stats[P.r.id] = { right: 0, wrong: 0 });
    $app.querySelectorAll('.opt').forEach((b) => { if (q.options[+b.dataset.k] === q.answer) b.classList.add('right'); });
    if (ok) {
      st.right++; P.right++; beep(P.boss ? 'hit' : 'good');
      btn.classList.add('pop');
      if (P.boss) { P.hp--; const bi = $app.querySelector('.bic'); if (bi) { bi.classList.remove('hurt'); void bi.offsetWidth; bi.classList.add('hurt'); } const hp = $app.querySelector('.hp i'); if (hp) hp.style.width = (P.hp / BOSS_HP * 100) + '%'; }
      const cheer = ['答對了！', '太厲害了！', '好棒！', '完全正確！', '你好聰明！'][R(0, 4)];
      $app.querySelector('#fb').innerHTML = `<div class="fb good">🎉 ${cheer}${P.boss ? ` 打中${P.r.boss.name}！` : ''}</div>`;
      save();
      setTimeout(nextQ, 1100);
    } else {
      st.wrong++; P.wrong++; beep('bad');
      btn.classList.add('wrong');
      if (P.boss) P.hearts--;
      const fb = $app.querySelector('#fb');
      fb.innerHTML = `<div class="fb bad"><div class="fbh">😮 差一點！正確答案是 <b>${fmt(q.answer)}</b></div><div class="ex"><b>📖 解說</b><br>${fmt(q.explain)}</div><button class="btn gold" id="ok">知道了 ▶</button></div>`;
      save();
      fb.querySelector('#ok').onclick = nextQ;
      setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }
  }
  function finish() {
    const r = P.r, key = `${r.id}-${P.lv}`;
    let stars, title, extra = '';
    if (P.boss) {
      const win = P.hp <= 0;
      stars = win ? P.hearts : 0;
      if (win) {
        const first = !S.bosses[r.id];
        S.bosses[r.id] = true;
        title = `打敗${r.boss.name}了！`;
        extra = `<div class="treasure">${r.treasure}</div><p>拿到寶物！</p>` + (first && P.i < REGIONS.length - 1 ? `<p class="unlock">🗺️ 新地區開放：<b>${REGIONS[P.i + 1].name}</b></p>` : '') +
          (first && P.i === REGIONS.length - 1 ? '<p class="unlock">🏆 你走完整座數字島了！</p>' : '');
      } else {
        title = `${r.boss.name}逃走了…`;
        extra = `<div class="treasure sad">${r.boss.icon}</div><p>沒關係，再練習一下，一定可以打敗它！</p>`;
      }
    } else {
      const ratio = P.wrong / P.total;
      stars = P.wrong === 0 ? 3 : ratio <= 0.34 ? 2 : 1;
      title = ['', '過關了！', '做得很好！', '全部答對！'][stars];
      extra = `<p>答對 ${P.right} 題，共 ${P.total} 題</p>`;
    }
    if (stars > (S.stars[key] || 0)) S.stars[key] = stars;
    save();
    if (stars) { beep('win'); confetti(stars * 10); }
    $app.innerHTML = `
      <section class="result" style="--c:${r.color}">
        <div class="rstars">${[0, 1, 2].map((k) => `<span class="${k < stars ? 'on' : ''}" style="animation-delay:${k * 0.25}s">★</span>`).join('')}</div>
        <h2>${title}</h2>${extra}
        <div class="rbtns"><button class="btn" id="again">🔁 再玩一次</button><button class="btn gold" id="back">🗺️ 回地圖</button></div>
      </section>`;
    const { i, lv } = P;
    $app.querySelector('#again').onclick = () => startLevel(i, lv);
    $app.querySelector('#back').onclick = () => { showMap(true); if (!P.boss || !S.bosses[r.id]) showRegion(i); };
  }

  // ---------- 寶物箱 ----------
  function showBag() {
    const m = modal(`<div class="rhead" style="--c:#8d6e63"><span class="ric">🎒</span><div><h2>寶物箱</h2><small>打敗魔王就能拿到寶物</small></div><button class="x">✕</button></div>
      <div class="bag">${REGIONS.map((r) => `<div class="slot ${S.bosses[r.id] ? 'got' : ''}"><span>${S.bosses[r.id] ? r.treasure : '❔'}</span><small>${r.name}</small></div>`).join('')}</div>
      <p class="note">共 ${REGIONS.filter((r) => S.bosses[r.id]).length} / ${REGIONS.length} 個寶物・⭐ ${totalStars()} 顆星星</p>`);
    m.querySelector('.x').onclick = () => m.remove();
  }

  // ---------- 家長設定（先答一題乘法，避免小孩亂按） ----------
  function parentGate() {
    const a = R(12, 19), b = R(6, 9);
    const m = modal(`<div class="rhead" style="--c:#546e7a"><span class="ric">⚙️</span><div><h2>家長設定</h2><small>請家長回答：${a} × ${b} = ?</small></div><button class="x">✕</button></div>
      <div class="gate"><input id="gate" inputmode="numeric" autocomplete="off" placeholder="答案"><button class="btn gold" id="gok">確定</button></div>`);
    m.querySelector('.x').onclick = () => m.remove();
    const inp = m.querySelector('#gate'); setTimeout(() => inp.focus(), 50);
    const check = () => { if (+inp.value === a * b) { m.remove(); showParent(); } else { inp.value = ''; inp.placeholder = '答案不對喔'; } };
    m.querySelector('#gok').onclick = check;
    inp.onkeydown = (e) => { if (e.key === 'Enter') check(); };
  }
  function showParent() {
    const st = S.settings;
    const rows = REGIONS.map((r) => {
      const s = S.stats[r.id] || { right: 0, wrong: 0 }, t = s.right + s.wrong;
      return `<tr><td>${r.icon} ${r.name}</td><td>${t}</td><td>${t ? Math.round(s.right / t * 100) + '%' : '—'}</td><td>${regionStars(r)}/12</td></tr>`;
    }).join('');
    const m = modal(`<div class="rhead" style="--c:#546e7a"><span class="ric">⚙️</span><div><h2>家長設定</h2><small>${esc(S.player.name)} 的學習紀錄</small></div><button class="x">✕</button></div>
      <table class="stats"><thead><tr><th>地區</th><th>作答</th><th>答對率</th><th>星星</th></tr></thead><tbody>${rows}</tbody></table>
      <label class="set"><input type="checkbox" id="ua" ${st.unlockAll ? 'checked' : ''}> 開放全部地區和關卡（不用照順序）</label>
      <label class="set"><input type="checkbox" id="ar" ${st.autoRead ? 'checked' : ''}> 出題時自動念題目</label>
      <label class="set">每關題數 <select id="cnt">${[4, 6, 8, 10].map((n) => `<option ${n === st.count ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <div class="rbtns"><button class="btn danger" id="reset">清除全部進度</button><button class="btn gold" id="done">完成</button></div>`);
    const close = () => { m.remove(); showMap(); };
    m.querySelector('.x').onclick = close;
    m.querySelector('#done').onclick = close;
    m.querySelector('#ua').onchange = (e) => { st.unlockAll = e.target.checked; save(); };
    m.querySelector('#ar').onchange = (e) => { st.autoRead = e.target.checked; save(); };
    m.querySelector('#cnt').onchange = (e) => { st.count = +e.target.value; save(); };
    m.querySelector('#reset').onclick = () => {
      if (!confirm('確定要清除全部星星、寶物和學習紀錄嗎？')) return;
      const keep = { player: S.player, settings: S.settings }; S = Object.assign(fresh(), keep); save(); close();
    };
  }

  // 開始
  if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); } catch (e) { /* 忽略 */ } }
  if (S.player) showMap(true); else showStart();
  window.__game = { get P() { return P; }, get S() { return S; } }; // 方便測試
})();
