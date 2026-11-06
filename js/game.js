/* 數字島大冒險：劇情、地圖、戰鬥關卡、魔王戰、存檔、家長設定 */
(function () {
  'use strict';
  const { REGIONS, R, pick } = window.MQ;
  const STORY = window.STORY;
  const $app = document.getElementById('app');
  const SAVE_KEY = 'mathAdventure.v1';
  const AVATARS = ['🦊', '🐼', '🐯', '🐰', '🐨', '🦁', '🐸', '🐧'];
  const BOSS_HP = 6, HEARTS = 3, FINAL_HP = 10, FINAL_HEARTS = 5;
  const GRADE = ['', '', '二', '三', '四'];

  // 最終關：混沌城堡（9 個魔王都打敗才會出現）
  const FINAL = {
    id: 'final', name: '混沌城堡', icon: '🏰', color: '#6a1b9a', final: true,
    boss: { name: STORY.villain.name, icon: STORY.villain.icon }, treasure: '🏆',
    gen: () => pick(REGIONS).gen(pick([1, 1, 2, 2, 3])),
  };
  const ALL = [...REGIONS, FINAL];

  // ---------- 存檔 ----------
  const fresh = () => ({ player: null, stars: {}, bosses: {}, stats: {}, seen: {}, settings: { unlockAll: false, count: 6, autoRead: false, sound: true } });
  let S = fresh();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) S = Object.assign(fresh(), JSON.parse(raw));
    S.settings = Object.assign(fresh().settings, S.settings);
    S.seen = S.seen || {};
  } catch (e) { /* 沒有存檔也能玩 */ }
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 忽略 */ } };

  const allBosses = () => REGIONS.every((r) => S.bosses[r.id]);
  const regionOpen = (i) => S.settings.unlockAll || i === 0 || (i === REGIONS.length ? allBosses() : !!S.bosses[REGIONS[i - 1].id]);
  const levelOpen = (r, lv) => S.settings.unlockAll || lv === 0 || (S.stars[`${r.id}-${lv - 1}`] || 0) > 0;
  const bossOpen = (r) => S.settings.unlockAll || [0, 1, 2].every((lv) => (S.stars[`${r.id}-${lv}`] || 0) > 0);
  const regionStars = (r) => [0, 1, 2, 'boss'].reduce((s, lv) => s + (S.stars[`${r.id}-${lv}`] || 0), 0);
  const totalStars = () => ALL.reduce((s, r) => s + regionStars(r), 0);
  const currentIdx = () => { let i = 0; while (i < ALL.length - 1 && S.bosses[ALL[i].id]) i++; return i; };

  // ---------- 小工具 ----------
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const fmt = (s) => String(s).replace(/\[(\d+)\/(\d+)\]/g, '<span class="frac"><span>$1</span><span>$2</span></span>');
  const starStr = (n, max) => '★'.repeat(n) + '☆'.repeat(Math.max(0, (max || 3) - n));
  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const fill = (t, r) => String(t).replace(/\{name\}/g, S.player ? S.player.name : '勇者')
    .replace(/\{treasure\}/g, r ? r.treasure : '').replace(/\{region\}/g, r ? r.name : '').replace(/\{boss\}/g, r ? r.boss.name : '');

  // 朗讀（二年級還在練習認字，可以聽題目）
  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const t = String(text).replace(/<br>/g, '。').replace(/<[^>]+>/g, '')
      .replace(/\[(\d+)\/(\d+)\]/g, '$2分之$1').replace(/×/g, '乘以').replace(/÷/g, '除以').replace(/−/g, '減')
      .replace(/\+/g, '加').replace(/=/g, '等於').replace(/[？?□]/g, '多少').replace(/(\d),(\d)/g, '$1$2')
      .replace(/[\u{1F000}-\u{1FFFF}☀-➿]/gu, '');
    try {
      speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(t);
      u.lang = 'zh-TW'; u.rate = 0.9;
      const v = speechSynthesis.getVoices().find((x) => /zh[-_]TW/i.test(x.lang));
      if (v) u.voice = v;
      speechSynthesis.speak(u);
    } catch (e) { /* 忽略 */ }
  }
  const hush = () => { try { speechSynthesis.cancel(); } catch (e) { /* 忽略 */ } };

  // 音效
  let actx = null;
  function beep(kind) {
    if (!S.settings.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = { good: [660, 880], bad: [300, 220], win: [523, 659, 784, 1047], hit: [880, 440], tap: [600], swoosh: [400, 700, 1000], special: [523, 784, 1047, 1319, 1568], ko: [784, 523, 330] }[kind] || [600];
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), gn = actx.createGain(), t0 = actx.currentTime + i * (kind === 'swoosh' ? 0.05 : 0.11);
        o.type = kind === 'bad' ? 'sawtooth' : kind === 'swoosh' ? 'sine' : 'triangle'; o.frequency.value = f;
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

  // ---------- 劇情播放器 ----------
  // lines: [[說話的人, 內容], ...]；r: 這一區（決定魔王是誰、背景顏色）
  function playStory(lines, r, done) {
    hush();
    const who = (w) => {
      if (w === 'e') return { name: STORY.elder.name, icon: STORY.elder.icon, side: 'l' };
      if (w === 'h') return { name: S.player.name, icon: S.player.avatar, side: 'r' };
      if (w === 'x') return { name: STORY.villain.name, icon: STORY.villain.icon, side: 'r', bad: true };
      if (w === 'b') return { name: r.boss.name, icon: r.boss.icon, side: 'r', bad: true };
      return { name: '', icon: (r && r.icon) || '🏝️', side: 'n' };
    };
    let k = 0, timer = null, typing = false, full = '';
    $app.innerHTML = `
      <section class="story" style="--c:${r ? r.color : '#3f51b5'}">
        <button class="skip" id="skip">跳過 ⏭</button>
        <div class="stage"><span class="actor" id="actor"></span></div>
        <div class="dlg" id="dlg">
          <div class="who" id="who"></div>
          <div class="say" id="say"></div>
          <div class="more">點一下繼續 ▼</div>
        </div>
        <button class="icon sread" id="sread" title="念出來">🔊</button>
      </section>`;
    const $sec = $app.querySelector('.story'), $actor = $app.querySelector('#actor'), $who = $app.querySelector('#who'), $say = $app.querySelector('#say');
    const finish = () => { clearInterval(timer); hush(); done(); };
    function show() {
      if (k >= lines.length) return finish();
      const [w, raw] = lines[k], p = who(w);
      full = fill(raw, r);
      $sec.classList.toggle('dark', !!p.bad);
      $sec.classList.toggle('narr', p.side === 'n');
      $actor.className = `actor ${p.side} ${p.bad ? 'bad' : ''}`;
      $actor.textContent = p.icon;
      void $actor.offsetWidth; $actor.classList.add('in');
      $who.textContent = p.name; $who.style.display = p.name ? '' : 'none';
      $say.textContent = '';
      typing = true; let n = 0; const chars = [...full];
      clearInterval(timer);
      timer = setInterval(() => { n++; $say.textContent = chars.slice(0, n).join(''); if (n >= chars.length) { clearInterval(timer); typing = false; } }, 40);
      if (S.settings.autoRead) speak(full);
    }
    $sec.onclick = (e) => {
      if (e.target.closest('#skip') || e.target.closest('#sread')) return;
      if (typing) { clearInterval(timer); $say.textContent = full; typing = false; return; }
      beep('tap'); k++; show();
    };
    $app.querySelector('#skip').onclick = finish;
    $app.querySelector('#sread').onclick = () => speak(full);
    show();
  }
  // 只在第一次播放
  function storyOnce(key, lines, r, done) {
    if (S.seen[key]) return done();
    S.seen[key] = true; save();
    playStory(lines, r, done);
  }

  // ---------- 開始畫面：取名字、選角色 ----------
  function showStart() {
    let chosen = (S.player && S.player.avatar) || AVATARS[0];
    $app.innerHTML = `
      <section class="start">
        <div class="logo">🏝️</div>
        <h1>數字島大冒險</h1>
        <p class="sub">打敗亂數魔王，把島上的寶物拿回來！</p>
        <label class="field">勇者，你叫什麼名字？<input id="nm" maxlength="8" value="${esc((S.player && S.player.name) || '')}" placeholder="輸入名字"></label>
        <div class="field">選一個角色：</div>
        <div class="avatars">${AVATARS.map((a) => `<button class="av ${a === chosen ? 'on' : ''}" data-a="${a}">${a}</button>`).join('')}</div>
        <button class="btn big gold" id="go">出發！ ▶</button>
      </section>`;
    $app.querySelectorAll('.av').forEach((b) => b.onclick = () => {
      chosen = b.dataset.a; beep('tap');
      $app.querySelectorAll('.av').forEach((x) => x.classList.toggle('on', x === b));
    });
    $app.querySelector('#go').onclick = () => {
      const name = $app.querySelector('#nm').value.trim() || '小勇士';
      S.player = { name, avatar: chosen }; save(); beep('win');
      storyOnce('intro', STORY.intro, null, () => showMap(true));
    };
  }

  // ---------- 地圖 ----------
  const XS = [24, 64, 78, 44, 18, 40, 76, 60, 28, 52];
  const GAP = 170, TOP = 120;
  function showMap(scrollToCurrent) {
    hush();
    const H = TOP + (ALL.length - 1) * GAP + 170;
    const pts = ALL.map((r, i) => [XS[i], TOP + i * GAP]);
    let path = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], my = (y0 + y1) / 2;
      path += ` C ${x0} ${my} ${x1} ${my} ${x1} ${y1}`;
    }
    const cur = currentIdx();
    const deco = ['🌲', '☁️', '🌷', '🐦', '🌴', '🪨', '🐠', '⛰️', '🔥', '✨', '🌟', '🌿', '🦋', '🐚', '🌾', '🪐'];
    let decoHTML = '';
    for (let i = 0; i < 28; i++) {
      const y = 60 + i * (H - 120) / 28, x = (i * 37 + 11) % 100;
      decoHTML += `<span class="deco" style="top:${y}px;left:${x}%">${deco[(i * 7) % deco.length]}</span>`;
    }
    const nodes = ALL.map((r, i) => {
      const open = regionOpen(i), done = !!S.bosses[r.id];
      const sub = r.final ? (done ? '亂數魔王被打敗了！' : '最終決戰') : `${GRADE[r.grade]}年級・★ ${regionStars(r)}/12`;
      return `<button class="node ${open ? '' : 'locked'} ${done ? 'done' : ''} ${r.final ? 'final' : ''}" data-i="${i}" style="left:${XS[i]}%;top:${TOP + i * GAP}px;--c:${r.color}">
        <span class="ic">${open ? r.icon : '🔒'}</span>${done ? '<span class="crown">👑</span>' : ''}
        <span class="lbl"><b>${r.name}</b><small>${sub}</small></span>
        ${i === cur ? `<span class="me ${XS[i] > 55 ? 'l' : ''}">${esc(S.player.avatar)}</span>` : ''}
      </button>`;
    }).join('');
    $app.innerHTML = `
      <header class="top">
        <button class="chip" id="who">${esc(S.player.avatar)} ${esc(S.player.name)}</button>
        <span class="chip">⭐ ${totalStars()}</span>
        <span class="sp"></span>
        <button class="icon" id="tale" title="重看故事">📜</button>
        <button class="icon" id="bag" title="寶物箱">🎒</button>
        <button class="icon" id="snd" title="音效">${S.settings.sound ? '🔊' : '🔇'}</button>
        <button class="icon" id="par" title="家長設定">⚙️</button>
      </header>
      <section class="map" style="height:${H}px">
        <svg class="path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>
        ${decoHTML}${nodes}
      </section>`;
    $app.querySelectorAll('.node').forEach((b) => b.onclick = () => {
      const i = +b.dataset.i, r = ALL[i];
      if (!regionOpen(i)) {
        beep('bad');
        toast(r.final ? '把 9 個地區的魔王都打敗，混沌城堡才會打開！' : `先打敗「${ALL[i - 1].name}」的魔王，才能來這裡喔！`);
        return;
      }
      beep('tap');
      if (r.final) storyOnce('final', STORY.final.intro, r, () => startLevel(i, 'boss'));
      else storyOnce('r-' + r.id, STORY.regions[r.id].intro, r, () => { showMap(); showRegion(i); });
    });
    $app.querySelector('#who').onclick = showStart;
    $app.querySelector('#tale').onclick = () => playStory(STORY.intro, null, () => showMap());
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
    const r = ALL[i], st = STORY.regions[r.id];
    const rows = r.levels.map((name, lv) => {
      const open = levelOpen(r, lv), s = S.stars[`${r.id}-${lv}`] || 0, m = st.minions[lv];
      return `<button class="lv ${open ? '' : 'locked'}" data-lv="${lv}"><span class="n">${open ? m.icon : '🔒'}</span><span class="t">${name}<small>對手：${m.name}</small></span><span class="s">${open ? starStr(s) : ''}</span></button>`;
    }).join('');
    const bo = bossOpen(r), bst = S.stars[`${r.id}-boss`] || 0;
    const m = modal(`
      <div class="rhead" style="--c:${r.color}"><span class="ric">${r.icon}</span><div><h2>${r.name}</h2><small>${GRADE[r.grade]}年級</small></div><button class="x">✕</button></div>
      <div class="lvs">${rows}
        <button class="lv boss ${bo ? '' : 'locked'}" data-lv="boss"><span class="n">${bo ? r.boss.icon : '🔒'}</span><span class="t">魔王：${r.boss.name}<small>打敗它就能拿回 ${r.treasure}</small></span><span class="s">${bo ? starStr(bst) : ''}</span></button>
      </div>
      <p class="note">${S.bosses[r.id] ? `已經拿回寶物 ${r.treasure}！` : '打敗三隻手下，魔王就會出現！'}</p>`);
    m.querySelector('.x').onclick = () => m.remove();
    m.querySelectorAll('.lv').forEach((b) => b.onclick = () => {
      const lv = b.dataset.lv === 'boss' ? 'boss' : +b.dataset.lv;
      const ok = lv === 'boss' ? bo : levelOpen(r, lv);
      if (!ok) { beep('bad'); toast(lv === 'boss' ? '先打敗三隻手下，再來挑戰魔王！' : '先打敗前一隻手下喔！'); return; }
      m.remove(); beep('tap'); startLevel(i, lv);
    });
  }

  // ---------- 戰鬥 ----------
  let P = null; // 正在進行的戰鬥
  function startLevel(i, lv) {
    hush();
    const r = ALL[i], boss = lv === 'boss', st = r.final ? STORY.final : STORY.regions[r.id];
    const foe = boss ? r.boss : st.minions[lv];
    const hp = r.final ? FINAL_HP : boss ? BOSS_HP : S.settings.count;
    const hearts = r.final ? FINAL_HEARTS : HEARTS;
    P = { i, r, lv, boss, st, foe, maxHp: hp, hp, maxHearts: hearts, hearts, right: 0, wrong: 0, combo: 0, seen: new Set(), q: null, busy: false };
    $app.innerHTML = `
      <section class="play ${boss ? 'is-boss' : ''}" style="--c:${r.color}">
        <header class="ptop"><button class="icon" id="quit" title="離開">✕</button><span class="pt">${r.icon} ${r.final ? '最終決戰' : boss ? '魔王戰' : r.levels[lv]}</span><span class="cnt" id="cnt"></span></header>
        <div class="arena" id="arena">
          <div class="fighter hero" id="hero">
            <div class="tag">${boss ? `<span class="hearts" id="hearts"></span>` : '<span class="shield">🛡️ 勇者</span>'}</div>
            <span class="body">${esc(S.player.avatar)}</span><b>${esc(S.player.name)}</b>
          </div>
          <div class="fighter foe enter" id="foe">
            <div class="tag"><div class="hp"><i id="hpbar"></i></div><small id="hptxt"></small></div>
            <span class="body">${foe.icon}</span><b>${foe.name}</b>
          </div>
          <div class="banner" id="banner"></div>
          <div class="combo" id="combo"></div>
          <div class="flash" id="flash"></div>
        </div>
        <div id="qa"></div>
      </section>`;
    $app.querySelector('#quit').onclick = () => { if (confirm('要離開這場戰鬥嗎？這一關的進度不會保存。')) { hush(); P = null; showMap(); } };
    updateBars();
    banner(boss ? `⚠️ ${r.final ? '大魔王' : '魔王'}「${foe.name}」出現了！` : `${foe.icon} ${foe.name}出現了！`, boss ? 'warn' : '');
    beep(boss ? 'bad' : 'tap');
    setTimeout(nextQ, 900);
  }
  function updateBars() {
    const hb = $app.querySelector('#hpbar'); if (hb) hb.style.width = (P.hp / P.maxHp * 100) + '%';
    const ht = $app.querySelector('#hptxt'); if (ht) ht.textContent = `HP ${P.hp}/${P.maxHp}`;
    const hs = $app.querySelector('#hearts'); if (hs) hs.textContent = '❤️'.repeat(P.hearts) + '🤍'.repeat(P.maxHearts - P.hearts);
    const c = $app.querySelector('#cnt'); if (c) c.textContent = P.combo >= 2 ? `🔥${P.combo}` : '';
  }
  function banner(text, cls) {
    const b = $app.querySelector('#banner'); if (!b) return;
    b.className = 'banner'; b.innerHTML = text; void b.offsetWidth; b.className = 'banner show ' + (cls || '');
  }
  // 招式動畫：from 'hero' 或 'foe'
  async function strike(from, fx, big) {
    const arena = $app.querySelector('#arena'); if (!arena) return;
    const att = arena.querySelector(from === 'hero' ? '#hero' : '#foe'), def = arena.querySelector(from === 'hero' ? '#foe' : '#hero');
    att.classList.remove('lunge'); void att.offsetWidth; att.classList.add('lunge');
    beep('swoosh');
    const p = document.createElement('span');
    p.className = `proj ${from === 'hero' ? 'to-r' : 'to-l'} ${big ? 'big' : ''}`; p.textContent = fx;
    arena.appendChild(p);
    if (big) { const f = arena.querySelector('#flash'); f.classList.remove('on'); void f.offsetWidth; f.classList.add('on'); }
    await wait(520);
    p.remove();
    def.classList.remove('hit'); void def.offsetWidth; def.classList.add('hit');
    const dmg = document.createElement('span'); dmg.className = `dmg ${from === 'hero' ? 'r' : 'l'}`;
    dmg.textContent = from === 'hero' ? (big ? '必殺！' : '-1') : (P.boss ? '-❤️' : '😵');
    arena.appendChild(dmg); setTimeout(() => dmg.remove(), 900);
    beep(from === 'hero' ? (big ? 'special' : 'hit') : 'bad');
  }

  function makeQ() {
    const d = P.r.final ? null : P.boss ? [1, 2, 2, 3, 3][R(0, 4)] : P.lv + 1;
    let q, k = 0;
    do { q = P.r.final ? P.r.gen() : P.r.gen(d); } while (P.seen.has(q.text + q.visual) && k++ < 12);
    P.seen.add(q.text + q.visual);
    return q;
  }
  function nextQ() {
    if (!P) return;
    P.q = makeQ(); P.busy = false;
    const q = P.q;
    const qa = $app.querySelector('#qa'); if (!qa) return;
    qa.innerHTML = `
      <div class="card">
        <button class="icon read" id="read" title="念題目">🔊</button>
        <div class="qt">${fmt(q.text)}</div>
        ${q.visual ? `<div class="vis">${q.visual}</div>` : ''}
      </div>
      <div class="opts ${q.options.length === 2 ? 'two' : ''}">${q.options.map((o, k) => `<button class="opt ${o.replace(/\[.*?\]/g, '#').length > 7 ? 'long' : ''}" data-k="${k}">${fmt(o)}</button>`).join('')}</div>
      <div id="fb"></div>`;
    qa.querySelector('#read').onclick = () => speak(q.text);
    qa.querySelectorAll('.opt').forEach((b) => b.onclick = () => answer(b));
    if (S.settings.autoRead) speak(q.text);
  }
  async function answer(btn) {
    if (P.busy) return; P.busy = true;
    const me = P, q = P.q, ok = q.options[+btn.dataset.k] === q.answer;
    const st = S.stats[P.r.id] || (S.stats[P.r.id] = { right: 0, wrong: 0 });
    $app.querySelectorAll('.opt').forEach((b) => { b.disabled = true; if (q.options[+b.dataset.k] === q.answer) b.classList.add('right'); });
    const fb = $app.querySelector('#fb');
    if (ok) {
      st.right++; P.right++; P.combo++; save();
      btn.classList.add('pop');
      const special = P.combo > 0 && P.combo % 3 === 0;
      const [mv, fx] = special ? P.st.special : pick(P.st.moves);
      banner(special ? `🔥 ${P.combo} 連擊！必殺技<br><b>「${mv}」</b>` : `${esc(S.player.avatar)} ${esc(S.player.name)}使出<b>「${mv}」</b>！`, special ? 'special' : 'hero');
      fb.innerHTML = `<div class="fb good">🎉 ${pick(['答對了！', '太厲害了！', '好棒！', '完全正確！', '你好聰明！'])}</div>`;
      await wait(250);
      await strike('hero', fx, special);
      if (P !== me) return;
      P.hp = Math.max(0, P.hp - 1); updateBars();
      await wait(special ? 700 : 450);
      if (P !== me) return;
      if (P.hp <= 0) return ko();
      nextQ();
    } else {
      st.wrong++; P.wrong++; P.combo = 0; save();
      btn.classList.add('wrong');
      const [mv, fx] = pick(P.st.foeMoves || [['反擊', '💢']]);
      banner(`${P.foe.icon} ${P.foe.name}使出<b>「${mv}」</b>！`, 'foe');
      await wait(200);
      await strike('foe', fx, false);
      if (P !== me) return;
      if (P.boss) P.hearts--;
      updateBars();
      const lost = P.boss && P.hearts <= 0;
      fb.innerHTML = `<div class="fb bad"><div class="fbh">😮 差一點！正確答案是 <b>${fmt(q.answer)}</b></div><div class="ex"><b>📖 解說</b><br>${fmt(q.explain)}</div><button class="btn gold" id="ok">${lost ? '結束戰鬥' : '看懂了，再來一招 ▶'}</button></div>`;
      fb.querySelector('#ok').onclick = () => (lost ? finish(false) : nextQ());
      setTimeout(() => fb.scrollIntoView({ behavior: 'smooth', block: 'end' }), 50);
    }
  }
  async function ko() {
    const me = P;
    const foe = $app.querySelector('#foe');
    if (!foe) return;
    foe.classList.add('ko'); beep('ko');
    banner(`✨ 打敗了${P.foe.name}！`, 'win');
    $app.querySelector('#qa').innerHTML = '';
    await wait(1300);
    if (P === me) finish(true);
  }

  function finish(win) {
    hush();
    const r = P.r, key = `${r.id}-${P.lv}`, first = win && P.boss && !S.bosses[r.id];
    let stars = 0;
    if (P.boss) stars = win ? Math.max(1, Math.ceil(P.hearts / P.maxHearts * 3)) : 0;
    else stars = P.wrong === 0 ? 3 : P.wrong <= Math.ceil(P.maxHp / 3) ? 2 : 1;
    if (stars > (S.stars[key] || 0)) S.stars[key] = stars;
    if (win && P.boss) S.bosses[r.id] = true;
    save();
    const show = () => showResult(win, stars, first);
    if (first) {
      const lines = r.final ? STORY.final.ending : STORY.regions[r.id].outro;
      playStory(lines, r, show);
    } else show();
  }
  function showResult(win, stars, first) {
    const r = P.r;
    let title, extra = '';
    if (P.boss && win) {
      title = r.final ? '你打敗了亂數魔王！' : `打敗${r.boss.name}了！`;
      extra = `<div class="treasure">${r.treasure}</div><p>${r.final ? '你是數字島的數學勇者！' : `拿回寶物 ${r.treasure}！`}</p>`;
      if (first && !r.final) {
        const next = ALL[P.i + 1];
        extra += next.final ? '<p class="unlock">🏰 混沌城堡的大門打開了！</p>' : `<p class="unlock">🗺️ 新地區開放：<b>${next.name}</b></p>`;
      }
    } else if (P.boss) {
      title = `${r.boss.name}逃走了…`;
      extra = `<div class="treasure sad">${r.boss.icon}</div><p>沒關係，再練習一下，一定可以打敗它！</p>`;
    } else {
      title = `打敗了${P.foe.name}！`;
      extra = `<div class="treasure sad ko">${P.foe.icon}</div><p>答對 ${P.right} 題、答錯 ${P.wrong} 題${P.wrong === 0 ? '，完美！' : ''}</p>`;
    }
    if (stars) { beep('win'); confetti(stars * 10 + (r.final && win ? 30 : 0)); }
    $app.innerHTML = `
      <section class="result" style="--c:${r.color}">
        <div class="rstars">${[0, 1, 2].map((k) => `<span class="${k < stars ? 'on' : ''}" style="animation-delay:${k * 0.25}s">★</span>`).join('')}</div>
        <h2>${title}</h2>${extra}
        <div class="rbtns"><button class="btn" id="again">🔁 再玩一次</button><button class="btn gold" id="back">🗺️ 回地圖</button></div>
      </section>`;
    const { i, lv, boss } = P;
    $app.querySelector('#again').onclick = () => startLevel(i, lv);
    $app.querySelector('#back').onclick = () => { P = null; showMap(true); if (!r.final && !(boss && win)) showRegion(i); };
  }

  // ---------- 寶物箱 ----------
  function showBag() {
    const m = modal(`<div class="rhead" style="--c:#8d6e63"><span class="ric">🎒</span><div><h2>寶物箱</h2><small>打敗魔王就能拿回寶物</small></div><button class="x">✕</button></div>
      <div class="bag">${REGIONS.map((r) => `<div class="slot ${S.bosses[r.id] ? 'got' : ''}"><span>${S.bosses[r.id] ? r.treasure : '❔'}</span><small>${r.name}</small></div>`).join('')}</div>
      ${S.bosses.final ? '<p class="note">🏆 你打敗了亂數魔王！</p>' : ''}
      <p class="note">共 ${REGIONS.filter((r) => S.bosses[r.id]).length} / ${REGIONS.length} 件寶物・⭐ ${totalStars()} 顆星星</p>`);
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
      <label class="set"><input type="checkbox" id="ar" ${st.autoRead ? 'checked' : ''}> 自動念題目和劇情</label>
      <label class="set">每隻手下的血量（題數） <select id="cnt">${[4, 6, 8, 10].map((n) => `<option ${n === st.count ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="set"><input type="checkbox" id="rs"> 下次重新播放全部劇情</label>
      <div class="rbtns"><button class="btn danger" id="reset">清除全部進度</button><button class="btn gold" id="done">完成</button></div>`);
    const close = () => { m.remove(); showMap(); };
    m.querySelector('.x').onclick = close;
    m.querySelector('#done').onclick = close;
    m.querySelector('#ua').onchange = (e) => { st.unlockAll = e.target.checked; save(); };
    m.querySelector('#ar').onchange = (e) => { st.autoRead = e.target.checked; save(); };
    m.querySelector('#cnt').onchange = (e) => { st.count = +e.target.value; save(); };
    m.querySelector('#rs').onchange = (e) => { if (e.target.checked) { S.seen = {}; save(); } };
    m.querySelector('#reset').onclick = () => {
      if (!confirm('確定要清除全部星星、寶物、劇情和學習紀錄嗎？')) return;
      const keep = { player: S.player, settings: S.settings }; S = Object.assign(fresh(), keep); save(); close();
    };
  }

  // 開始
  if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); } catch (e) { /* 忽略 */ } }
  if (S.player) showMap(true); else showStart();
  window.__game = { get P() { return P; }, get S() { return S; } }; // 方便測試
})();
