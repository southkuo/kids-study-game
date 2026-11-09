/* 學習大冒險：選擇國度、劇情、地圖、戰鬥關卡、魔王戰、存檔、家長設定 */
(function () {
  'use strict';
  const { R, pick, shuffle } = window.MQ;
  const SUBJECTS = window.SUBJECTS;
  const $app = document.getElementById('app');
  const SAVE_KEY = 'mathAdventure.v1';
  // 主角固定是 Ivan勇士；avatar 是自己畫的小勇士（頭盔、披風、劍和盾）
  const HERO = { name: 'Ivan勇士', avatar: '<svg class="hero-svg" viewBox="0 0 100 100" aria-hidden="true"><path d="M30 52 Q50 45 70 52 L77 89 Q50 95 23 89 Z" fill="#d84343"/><path d="M30 52 Q50 45 70 52 L72 60 Q50 54 28 60 Z" fill="#b52f2f"/><rect x="38" y="80" width="9" height="11" rx="3" fill="#6d4c2f"/><rect x="53" y="80" width="9" height="11" rx="3" fill="#6d4c2f"/><path d="M34 58 Q50 52 66 58 L68 83 Q50 87 32 83 Z" fill="#3f7ee8"/><path d="M44 55 L50 64 L56 55" fill="none" stroke="#f2c14e" stroke-width="2.5" stroke-linejoin="round"/><rect x="33" y="71" width="34" height="5" fill="#8a5a2b"/><rect x="46.5" y="70" width="7" height="7" rx="1.5" fill="#f2c14e"/><g transform="rotate(28 72 67)"><rect x="70" y="22" width="5.5" height="38" rx="2.5" fill="#e8eef5" stroke="#8a97a6" stroke-width="1.2"/><line x1="72.75" y1="26" x2="72.75" y2="56" stroke="#b8c4d1" stroke-width="1"/><rect x="63.5" y="58" width="18.5" height="4.5" rx="2.2" fill="#f2c14e" stroke="#b9821f" stroke-width="1"/><rect x="70.8" y="62.5" width="4" height="8" rx="1.5" fill="#8a5a2b"/><circle cx="72.8" cy="72" r="2.2" fill="#f2c14e"/></g><circle cx="69" cy="68" r="5.2" fill="#ffd2ad" stroke="#e8b48c" stroke-width="1"/><circle cx="30" cy="70" r="12" fill="#a06a35" stroke="#f2c14e" stroke-width="3.2"/><path d="M30 62.5 L32.2 67.6 L37.6 67.9 L33.4 71.3 L34.8 76.6 L30 73.6 L25.2 76.6 L26.6 71.3 L22.4 67.9 L27.8 67.6 Z" fill="#ffe08a"/><circle cx="50" cy="37" r="20" fill="#ffd9b8"/><path d="M30.5 37 Q31 25 50 24 Q69 25 69.5 37 Q66 33 60 33.5 Q56 30 50 32 Q44 30 40 33.5 Q34 33 30.5 37 Z" fill="#6b3f1f"/><path d="M27.5 31 Q29 11 50 10 Q71 11 72.5 31 Z" fill="#cfd8e2" stroke="#8a97a6" stroke-width="1.5"/><path d="M37 16 Q42 13 46 13" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" opacity=".8"/><rect x="26" y="28.5" width="48" height="6.5" rx="3.2" fill="#aab6c3" stroke="#8a97a6" stroke-width="1"/><path d="M50 10.5 Q45 1 54 -1 Q52 5 59 3 Q56 10 50 10.5 Z" fill="#e53935"/><ellipse cx="42.5" cy="42" rx="3.2" ry="3.9" fill="#2b1d0e"/><ellipse cx="57.5" cy="42" rx="3.2" ry="3.9" fill="#2b1d0e"/><circle cx="43.6" cy="40.6" r="1.2" fill="#fff"/><circle cx="58.6" cy="40.6" r="1.2" fill="#fff"/><ellipse cx="37" cy="48" rx="3.6" ry="2.2" fill="#ff9e9e" opacity=".7"/><ellipse cx="63" cy="48" rx="3.6" ry="2.2" fill="#ff9e9e" opacity=".7"/><path d="M45 48.5 Q50 53.5 55 48.5" fill="none" stroke="#8a3b1f" stroke-width="2.2" stroke-linecap="round"/></svg>' };
  const BOSS_HP = 6, HEARTS = 3, FINAL_HP = 10, FINAL_HEARTS = 5;
  const GRADE = ['', '', '二', '三', '四', '五', '六'];
  const gradeName = (g) => (g >= 7 ? '國' + ['一', '二', '三'][g - 7] : GRADE[g] + '年級');

  // 目前的國度（數學／國文／英文）。最終關要打敗全部魔王才會出現
  let SUB, REGIONS, STORY, FINAL, ALL;
  function setSub(id) {
    SUB = SUBJECTS.find((x) => x.id === id) || SUBJECTS[0];
    REGIONS = SUB.regions; STORY = SUB.story;
    FINAL = Object.assign({}, SUB.final, {
      final: true, boss: { name: STORY.villain.name, icon: STORY.villain.icon }, treasure: '🏆',
      gen: () => pick(REGIONS).gen(pick([1, 1, 2, 2, 3])),
    });
    ALL = [...REGIONS, FINAL];
  }
  setSub('math');

  // ---------- 存檔 ----------
  const fresh = () => ({ player: null, stars: {}, bosses: {}, stats: {}, seen: {}, settings: { showLands: false, count: 6, autoRead: false, sound: true } });
  let S = fresh();
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (raw) S = Object.assign(fresh(), JSON.parse(raw));
    S.settings = Object.assign(fresh().settings, S.settings);
    S.seen = S.seen || {};
  } catch (e) { /* 沒有存檔也能玩 */ }
  S.player = Object.assign({}, HERO);
  const save = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* 忽略 */ } };

  const allBosses = () => REGIONS.every((r) => S.bosses[r.id]);
  // 全部地區、關卡、魔王和最終城堡一開始就開放，想玩哪一關就玩哪一關
  const regionOpen = () => true;
  const levelOpen = () => true;
  const bossOpen = () => true;
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
  function speak(text, lang, rate) {
    if (!('speechSynthesis' in window)) return;
    if (lang === 'en') {
      try {
        speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(String(text).replace(/<[^>]+>/g, ' ').replace(/___/g, 'blank').replace(/[\u{1F000}-\u{1FFFF}\u2600-\u27BF]/gu, ''));
        u.lang = 'en-US'; u.rate = rate || 0.85;
        const v = speechSynthesis.getVoices().find((x) => /^en[-_]US/i.test(x.lang)) || speechSynthesis.getVoices().find((x) => /^en/i.test(x.lang));
        if (v) u.voice = v;
        speechSynthesis.speak(u);
      } catch (e) { /* 忽略 */ }
      return;
    }
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
      return { name: '', icon: (r && r.icon) || SUB.scene || '🏝️', side: 'n' };
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
      $actor.innerHTML = p.icon;
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

  // ---------- 開始畫面：這個遊戲是給 Ivan 玩的，名字和角色固定 ----------
  function showStart() {
    $app.innerHTML = `
      <section class="start">
        <div class="logo">🏝️</div>
        <h1>學習大冒險</h1>
        <div class="hero-big">${HERO.avatar}</div>
        <p class="sub big">${HERO.name}，準備好了嗎？</p>
        <p class="sub">數學、國文、英文三個國度，等你去拯救！</p>
        <button class="btn big gold" id="go">出發！ ▶</button>
      </section>`;
    $app.querySelector('#go').onclick = () => { beep('win'); showHome(); };
  }


  // ---------- 每日內容（出題老師、教學老師每天放在 daily/日期/ 資料夾） ----------
  const SUBJ = {
    chinese: { name: '國文', icon: '📜', color: '#c0573b', hw: '✏️' },
    english: { name: '英文', icon: '🔤', color: '#3f6fe0', hw: '🗣️' },
    math: { name: '數學', icon: '🔢', color: '#2f8fd8', hw: '🧮' },
    science: { name: '自然', icon: '🔬', color: '#2e9d5b', hw: '🔬' },
  };
  const DAILY_FOES = {
    chinese: { foe: { name: '作業墨水怪', icon: '🦑' }, region: 'zh-word', subject: 'zh' },
    math: { foe: { name: '作業數字怪', icon: '👾' }, region: 'add', subject: 'math' },
  };
  const todayStr = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  const WK = '日一二三四五六';
  const dateLabel = (ds) => { const [y, m, d] = ds.split('-').map(Number); return `${m}/${d}（${WK[new Date(y, m - 1, d).getDay()]}）`; };
  const dailyState = (date) => { S.daily = S.daily || {}; return S.daily[date] || (S.daily[date] = { lessons: {} }); };
  let DAY_LIST = [], DAY = null, dailyErr = '';
  async function loadDaily(date) {
    try {
      if (!DAY_LIST.length) {
        const idx = await (await fetch('daily/index.json', { cache: 'no-cache' })).json();
        DAY_LIST = (idx.days || []).slice().sort().reverse();
      }
      const today = todayStr();
      const pickDate = date || (DAY_LIST.includes(today) ? today : DAY_LIST.find((x) => x <= today) || DAY_LIST[0]);
      if (!pickDate) return;
      const data = await (await fetch(`daily/${pickDate}/day.json`, { cache: 'no-cache' })).json();
      DAY = { date: pickDate, data };
      const en = data.homework && data.homework.english;
      window.HOMEWORK = en ? Object.assign({ title: '英文口說作業', note: '請用完整句子回答唷！' }, en, { date: pickDate }) : null;
      dailyErr = '';
    } catch (e) { dailyErr = '今日任務讀取失敗，請確認網路，再重新整理一次。'; }
  }
  function startDailyHomework(subject) {
    const hw = DAY.data.homework[subject], cfg = DAILY_FOES[subject], sb = SUBJECTS.find((x) => x.id === cfg.subject);
    setSub(cfg.subject);
    const base = sb.story.regions[cfg.region];
    startLevel(null, 0, {
      date: DAY.date, subject, title: hw.title || `${SUBJ[subject].name}作業`, questions: hw.questions,
      r: { id: `daily-${DAY.date}-${subject}`, name: hw.title, icon: SUBJ[subject].hw, color: SUBJ[subject].color, levels: [`${hw.title || SUBJ[subject].name + '作業'}・${dateLabel(DAY.date)}`] },
      st: { moves: base.moves, special: base.special, foeMoves: base.foeMoves }, foe: cfg.foe,
    });
  }
  function showLesson(ls) {
    hush(); P = null;
    dailyState(DAY.date).lessons[ls.subject] = true; save();
    const sj = SUBJ[ls.subject] || SUBJ.science;
    $app.innerHTML = `
      <section class="lesson" style="--c:${sj.color}">
        <header class="ptop"><button class="icon" id="lx" title="回今日任務">✕</button><span class="pt">${sj.icon} ${esc(ls.title)}</span><span class="cnt"></span></header>
        <iframe src="${esc(ls.file)}" title="${esc(ls.title)}" sandbox="allow-scripts" allow="autoplay"></iframe>
      </section>`;
    $app.querySelector('#lx').onclick = () => { hush(); showHome(); };
  }
  function todayPanel() {
    if (!DAY) return dailyErr ? `<div class="today"><p class="note">${dailyErr}</p></div>` : '<div class="today"><p class="note">📅 今日任務載入中…</p></div>';
    const d = DAY.data, st = dailyState(DAY.date), hw = d.homework || {}, isToday = DAY.date === todayStr();
    const tasks = [];
    if (hw.english) { const n = hw.english.items.length, done = hwDone(window.HOMEWORK); tasks.push(`<button class="task ${done >= n ? 'ok' : ''}" data-t="english" style="--c:${SUBJ.english.color}"><span>${SUBJ.english.hw}</span><b>英文口說</b><small>${done >= n ? '✅ 完成' : `${done}/${n} 題`}</small></button>`); }
    ['chinese', 'math'].forEach((k) => { if (hw[k]) tasks.push(`<button class="task ${st[k] ? 'ok' : ''}" data-t="${k}" style="--c:${SUBJ[k].color}"><span>${SUBJ[k].hw}</span><b>${SUBJ[k].name}作業</b><small>${st[k] ? '★'.repeat(st[k]) + '☆'.repeat(3 - st[k]) : `${hw[k].questions.length} 題`}</small></button>`); });
    const lessons = (d.lessons || []).map((ls, j) => { const sj = SUBJ[ls.subject] || SUBJ.science; return `<button class="lessonbtn ${st.lessons[ls.subject] ? 'ok' : ''}" data-l="${j}" style="--c:${sj.color}"><span>${sj.icon}</span><b>${sj.name}</b><small>${esc(ls.title)}</small>${st.lessons[ls.subject] ? '<i>✅</i>' : ''}</button>`; }).join('');
    return `<div class="today">
      <div class="th"><b>📅 ${isToday ? '今日任務' : DAY.date === DAY_LIST[0] ? '最新任務' : '以前的任務'}</b><span>${dateLabel(DAY.date)}${d.theme ? `・${esc(d.theme)}` : ''}</span>${DAY_LIST.length > 1 ? '<button class="hb" id="days">📆 以前的</button>' : ''}</div>
      ${tasks.length ? `<div class="tasks">${tasks.join('')}</div>` : ''}
      ${lessons ? `<div class="th2">📚 今日教室</div><div class="lessons">${lessons}</div>` : ''}
    </div>`;
  }
  function bindTodayPanel() {
    $app.querySelectorAll('.task').forEach((b) => b.onclick = () => { beep('tap'); if (b.dataset.t === 'english') { setSub('en'); showHomework(0); } else startDailyHomework(b.dataset.t); });
    $app.querySelectorAll('.lessonbtn').forEach((b) => b.onclick = () => { beep('tap'); showLesson(DAY.data.lessons[+b.dataset.l]); });
    const dy = $app.querySelector('#days');
    if (dy) dy.onclick = () => {
      const m = modal(`<div class="rhead" style="--c:#546e7a"><span class="ric">📆</span><div><h2>以前的任務</h2><small>點日期就能回去練習</small></div><button class="x">✕</button></div>
        <div class="lvs">${DAY_LIST.map((x) => `<button class="lv" data-d="${x}"><span class="n">📅</span><span class="t">${dateLabel(x)}${x === todayStr() ? '<small>今天</small>' : ''}</span><span class="s">${x === DAY.date ? '👀' : ''}</span></button>`).join('')}</div>`);
      m.querySelector('.x').onclick = () => m.remove();
      m.querySelectorAll('[data-d]').forEach((b) => b.onclick = async () => { m.remove(); await loadDaily(b.dataset.d); showHome(); });
    };
  }

  // ---------- 選擇國度 ----------
  function showHome() {
    hush(); P = null;
    const tiles = SUBJECTS.map((sb) => {
      const got = sb.regions.filter((r) => S.bosses[r.id]).length, beat = !!S.bosses[sb.final.id];
      return `<button class="land" data-id="${sb.id}" style="--c:${sb.color}">
        <span class="lic">${sb.icon}</span><span class="lname">${sb.name}</span><span class="lland">${sb.land}</span>
        <span class="ldesc">${sb.desc}<br>${sb.grades}</span>
        <span class="lprog">${beat ? '👑 全破！' : `寶物 ${got} / ${sb.regions.length}`}</span><span class="lgo">▶ 出發</span></button>`;
    }).join('');
    $app.innerHTML = `
      <section class="home">
        <header class="top">
          <button class="chip" id="who">${S.player.avatar} ${esc(S.player.name)}</button><span class="sp"></span>
          <button class="icon" id="snd" title="音效">${S.settings.sound ? '🔊' : '🔇'}</button>
          <button class="icon" id="par" title="家長設定">⚙️</button>
        </header>
        <div class="hhead"><h1>學習大冒險</h1></div>
        ${todayPanel()}
        ${S.settings.showLands ? `<div class="th2 lands-h">🗺️ 選擇國度：自由冒險</div>
        <div class="lands">${tiles}</div>` : ''}
      </section>`;
    $app.querySelectorAll('.land').forEach((b) => b.onclick = () => {
      beep('tap'); setSub(b.dataset.id); S.lastSub = SUB.id; save();
      storyOnce(SUB.introKey, STORY.intro, null, () => showMap(true));
    });
    bindTodayPanel();
    $app.querySelector('#who').onclick = showStart;
    $app.querySelector('#snd').onclick = () => { S.settings.sound = !S.settings.sound; save(); showHome(); };
    $app.querySelector('#par').onclick = parentGate;
  }

  // ---------- 地圖 ----------
  const XS = [24, 64, 78, 44, 18, 40, 76, 60, 28, 52];
  const GAP = 170, TOP = 120;
  function showMap(scrollToCurrent) {
    hush();
    const HW = SUB.id === 'en' && window.HOMEWORK ? window.HOMEWORK : null; // 英文地圖最下面多一站「今日作業」
    const H = TOP + (ALL.length - 1 + (HW ? 1 : 0)) * GAP + 170;
    const pts = ALL.map((r, i) => [XS[i], TOP + i * GAP]);
    if (HW) pts.push([50, TOP + ALL.length * GAP]);
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
      const sub = r.final ? (done ? `${r.boss.name}被打敗了！` : '最終決戰') : `${gradeName(r.grade)}・★ ${regionStars(r)}/12`;
      return `<button class="node ${open ? '' : 'locked'} ${done ? 'done' : ''} ${r.final ? 'final' : ''}" data-i="${i}" style="left:${XS[i]}%;top:${TOP + i * GAP}px;--c:${r.color}">
        <span class="ic">${open ? r.icon : '🔒'}</span>${done ? '<span class="crown">👑</span>' : ''}
        <span class="lbl"><b>${r.name}</b><small>${sub}</small></span>
        ${i === cur ? `<span class="me ${XS[i] > 55 ? 'l' : ''}">${S.player.avatar}</span>` : ''}
      </button>`;
    }).join('') + (HW ? (() => {
      const done = hwDone(HW), n = HW.items.length;
      return `<button class="node hwnode ${done === n ? 'done' : ''}" id="hwnode" style="left:50%;top:${TOP + ALL.length * GAP}px;--c:#ff7043">
        <span class="ic">📝</span>${done === n ? '<span class="crown">✅</span>' : ''}
        <span class="lbl"><b>${HW.title}</b><small>英文口說・${done}/${n} 題</small></span></button>`;
    })() : '');
    $app.innerHTML = `
      <header class="top">
        <button class="icon" id="home" title="選擇國度">🏠</button>
        <span class="chip">${SUB.icon} ⭐ ${totalStars()}</span>
        <span class="sp"></span>
        <button class="icon" id="tale" title="重看故事">📖</button>
        <button class="icon" id="bag" title="寶物箱">🎒</button>
        <button class="icon" id="par" title="家長設定">⚙️</button>
      </header>
      <section class="map" style="height:${H}px;background:linear-gradient(180deg, ${SUB.bg})">
        <svg class="path" viewBox="0 0 100 ${H}" preserveAspectRatio="none" aria-hidden="true"><path d="${path}"/></svg>
        ${decoHTML}${nodes}
      </section>`;
    $app.querySelectorAll('.node').forEach((b) => b.onclick = () => {
      const i = +b.dataset.i, r = ALL[i];
      if (!regionOpen(i)) {
        beep('bad');
        toast(r.final ? `把 ${REGIONS.length} 個地區的魔王都打敗，${r.name}才會打開！` : `先打敗「${ALL[i - 1].name}」的魔王，才能來這裡喔！`);
        return;
      }
      beep('tap');
      if (r.final) storyOnce(r.id, STORY.final.intro, r, () => startLevel(i, 'boss'));
      else storyOnce('r-' + r.id, STORY.regions[r.id].intro, r, () => { showMap(); showRegion(i); });
    });
    const hwn = $app.querySelector('#hwnode');
    if (hwn) hwn.onclick = () => { beep('tap'); showHomework(0); };
    $app.querySelector('#home').onclick = showHome;
    $app.querySelector('#tale').onclick = () => playStory(STORY.intro, null, () => showMap());
    $app.querySelector('#bag').onclick = showBag;
    $app.querySelector('#par').onclick = parentGate;
    if (scrollToCurrent) {
      const el = scrollToCurrent === 'hw' ? $app.querySelector('#hwnode') : $app.querySelector(`.node[data-i="${cur}"]`);
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
      <div class="rhead" style="--c:${r.color}"><span class="ric">${r.icon}</span><div><h2>${r.name}</h2><small>${gradeName(r.grade)}</small></div><button class="x">✕</button></div>
      <div class="lvs">${rows}
        <button class="lv boss ${bo ? '' : 'locked'}" data-lv="boss"><span class="n">${bo ? r.boss.icon : '🔒'}</span><span class="t">魔王：${r.boss.name}<small>打敗它就能拿回 ${r.treasure}</small></span><span class="s">${bo ? starStr(bst) : ''}</span></button>
      </div>
      <p class="note">${S.bosses[r.id] ? `已經拿回寶物 ${r.treasure}！` : '打敗魔王，就能拿回寶物！'}</p>`);
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
  // custom：每日作業的戰鬥（題目由出題老師提供，照順序出，答錯的題目會排到後面再考一次）
  function startLevel(i, lv, custom) {
    hush();
    const r = custom ? custom.r : ALL[i], boss = lv === 'boss', st = custom ? custom.st : r.final ? STORY.final : STORY.regions[r.id];
    const foe = custom ? custom.foe : boss ? r.boss : st.minions[lv];
    const hp = custom ? custom.questions.length : r.final ? FINAL_HP : boss ? BOSS_HP : S.settings.count;
    const hearts = r.final ? FINAL_HEARTS : HEARTS;
    P = { i, r, lv, boss, st, foe, maxHp: hp, hp, maxHearts: hearts, hearts, right: 0, wrong: 0, combo: 0, seen: new Set(), q: null, busy: false,
      custom: custom || null, queue: custom ? custom.questions.slice() : null };
    $app.innerHTML = `
      <section class="play ${boss ? 'is-boss' : ''}" style="--c:${r.color}">
        <header class="ptop"><button class="icon" id="quit" title="離開">✕</button><span class="pt">${r.icon} ${r.final ? '最終決戰' : boss ? '魔王戰' : r.levels[lv]}</span><span class="cnt" id="cnt"></span></header>
        <div class="arena" id="arena">
          <div class="fighter hero" id="hero">
            <div class="tag">${boss ? `<span class="hearts" id="hearts"></span>` : '<span class="shield">🛡️ 勇者</span>'}</div>
            <span class="body">${S.player.avatar}</span><b>${esc(S.player.name)}</b>
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
    $app.querySelector('#quit').onclick = () => { if (confirm('要離開這場戰鬥嗎？這一關的進度不會保存。')) { const c = P && P.custom; hush(); P = null; if (c) showHome(); else showMap(); } };
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
    if (P.custom) {
      const x = P.queue.shift();
      return { text: x.text, answer: String(x.answer), options: shuffle(x.options.map(String)), explain: x.explain || '', visual: x.visual || '', say: x.say || '', lang: x.lang || '' };
    }
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
      <div class="opts ${q.options.length === 2 ? 'two' : ''} ${q.options.some((o) => o.replace(/\[.*?\]/g, '#').length > 12) ? 'wide' : ''}">${q.options.map((o, k) => `<button class="opt ${o.replace(/\[.*?\]/g, '#').length > 7 ? 'long' : ''}" data-k="${k}">${fmt(o)}</button>`).join('')}</div>
      <div id="fb"></div>`;
    const read = () => speak(q.say || q.text, q.lang);
    qa.querySelector('#read').onclick = read;
    qa.querySelectorAll('.listen').forEach((b) => b.onclick = read);
    qa.querySelectorAll('.opt').forEach((b) => b.onclick = () => answer(b));
    if (q.visual.includes('class="listen"')) setTimeout(read, 300);
    else if (S.settings.autoRead) speak(q.lang === 'en' ? q.text.replace(/[A-Za-z]/g, '') : q.text);
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
      banner(special ? `🔥 ${P.combo} 連擊！必殺技<br><b>「${mv}」</b>` : `${S.player.avatar} ${esc(S.player.name)}使出<b>「${mv}」</b>！`, special ? 'special' : 'hero');
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
      if (P.custom) P.queue.push(P.custom.questions.find((x) => x.text === q.text && String(x.answer) === q.answer) || q); // 答錯的題目等一下再考一次
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
    if (P.custom) { const d = dailyState(P.custom.date); if (stars > (d[P.custom.subject] || 0)) d[P.custom.subject] = stars; }
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
      title = `打敗${r.boss.name}了！`;
      extra = `<div class="treasure">${r.treasure}</div><p>${r.final ? `你是${SUB.land}的${SUB.name}勇者！` : `拿回寶物 ${r.treasure}！`}</p>`;
      if (first && !r.final) {
        const next = ALL[P.i + 1];
        extra += `<p class="unlock">🗺️ 下一站：<b>${next.icon} ${next.name}</b></p>`;
      }
    } else if (P.boss) {
      title = `${r.boss.name}逃走了…`;
      extra = `<div class="treasure sad">${r.boss.icon}</div><p>沒關係，再練習一下，一定可以打敗它！</p>`;
    } else if (P.custom) {
      title = `${P.custom.title}完成了！`;
      extra = `<div class="treasure sad ko">${P.foe.icon}</div><p>${P.custom.questions.length} 題全部答對了！${P.wrong ? `（中間答錯 ${P.wrong} 次，都改過來了）` : '一次都沒錯，完美！'}</p>`;
    } else {
      title = `打敗了${P.foe.name}！`;
      extra = `<div class="treasure sad ko">${P.foe.icon}</div><p>答對 ${P.right} 題、答錯 ${P.wrong} 題${P.wrong === 0 ? '，完美！' : ''}</p>`;
    }
    if (stars) { beep('win'); confetti(stars * 10 + (r.final && win ? 30 : 0)); }
    $app.innerHTML = `
      <section class="result" style="--c:${r.color}">
        <div class="rstars">${[0, 1, 2].map((k) => `<span class="${k < stars ? 'on' : ''}" style="animation-delay:${k * 0.25}s">★</span>`).join('')}</div>
        <h2>${title}</h2>${extra}
        <div class="rbtns"><button class="btn" id="again">🔁 再玩一次</button><button class="btn gold" id="back">${P.custom ? '📅 回今日任務' : '🗺️ 回地圖'}</button></div>
      </section>`;
    const { i, lv, boss, custom } = P;
    $app.querySelector('#again').onclick = () => startLevel(i, lv, custom);
    $app.querySelector('#back').onclick = () => { P = null; if (custom) { showHome(); return; } showMap(true); if (!r.final && !(boss && win)) showRegion(i); };
  }


  // ---------- 今日作業（英文口說：先自己回答 → 看答案跟著念 → 錄音保存、分享給老師） ----------
  const DAYS = [['Sunday', '星期日'], ['Monday', '星期一'], ['Tuesday', '星期二'], ['Wednesday', '星期三'], ['Thursday', '星期四'], ['Friday', '星期五'], ['Saturday', '星期六']];
  const hwFill = (t) => { const [en, zh] = DAYS[new Date().getDay()]; return String(t).replace(/\{today\}/g, en).replace(/\{todayZh\}/g, zh); };
  const hwKey = (HW) => 'hw-' + HW.date;
  const hwState = (HW) => { S.hw = S.hw || {}; return S.hw[hwKey(HW)] || (S.hw[hwKey(HW)] = { done: [], pick: {} }); };
  const hwDone = (HW) => ((S.hw && S.hw[hwKey(HW)]) ? S.hw[hwKey(HW)].done.length : 0);

  // 錄音存在這台 iPad 的瀏覽器資料庫（IndexedDB），關掉再開都還在
  const recDB = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('ivan-recordings', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('rec');
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    }));
    const run = async (mode, fn) => {
      const db = await open();
      return new Promise((res, rej) => { const t = db.transaction('rec', mode), req = fn(t.objectStore('rec')); t.oncomplete = () => res(req.result); t.onerror = () => rej(t.error); });
    };
    return { get: (k) => run('readonly', (st) => st.get(k)), set: (k, v) => run('readwrite', (st) => st.put(v, k)), del: (k) => run('readwrite', (st) => st.delete(k)) };
  })();
  const recKey = (HW, k) => `${hwKey(HW)}-q${k + 1}`;
  const qvKey = (HW, k) => `${hwKey(HW)}-qv${k + 1}`; // 爸爸媽媽錄的題目
  const builtinQ = (HW, k) => (HW.questionAudio ? `${HW.questionAudio}q${k + 1}.m4a` : '');
  async function questionBlob(HW, k) { // 合併用的題目聲音：爸媽錄的優先，沒有就用內建的
    const mine = await recDB.get(qvKey(HW, k)).catch(() => null);
    if (mine) return mine.blob;
    const url = builtinQ(HW, k);
    if (!url) return null;
    try { const r = await fetch(url); return r.ok ? await r.blob() : null; } catch (e) { return null; }
  }
  const extOf = (type) => (/mp4|m4a|aac/.test(type) ? 'm4a' : /ogg/.test(type) ? 'ogg' : /wav/.test(type) ? 'wav' : 'webm');
  const recFile = (HW, k, r) => new File([r.blob], `Ivan-${HW.date}-Q${k + 1}.${extOf(r.type)}`, { type: r.type });
  async function shareFiles(files) {
    if (!files.length) return;
    try {
      if (navigator.canShare && navigator.canShare({ files })) { await navigator.share({ files, title: 'Ivan 的英文錄音作業' }); return; }
    } catch (e) { if (e && e.name === 'AbortError') return; }
    files.forEach((f, i) => setTimeout(() => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(f); a.download = f.name;
      document.body.appendChild(a); a.click(); a.remove();
    }, i * 400));
  }

  let recState = null;
  function stopRecording() {
    if (recState && recState.rec && recState.rec.state === 'recording') { try { recState.rec.stop(); } catch (e) { /* 忽略 */ } }
  }
  function showHomework(k, reveal) {
    hush(); stopRecording(); P = null;
    const HW = window.HOMEWORK, st = hwState(HW), n = HW.items.length;
    if (k >= n) return showHomeworkDone();
    const it = HW.items[k];
    const lineOpt = (li, line) => { const opts = line.options || [line]; const pi = Math.min(st.pick[`${k}-${li}`] || 0, opts.length - 1); return { opts, pi, o: opts[pi] }; };
    const linesHTML = it.lines.map((line, li) => {
      const { opts, pi, o } = lineOpt(li, line);
      return `<div class="hwline">
        ${opts.length > 1 ? `<div class="picks">${opts.map((x, j) => `<button class="pick ${j === pi ? 'on' : ''}" data-li="${li}" data-j="${j}">${x.pick}</button>`).join('')}</div>` : ''}
        <div class="say">${esc(hwFill(o.en))}</div><div class="zh">${esc(hwFill(o.zh))}</div>
        <div class="hwbtns"><button class="hb" data-say="${li}">🔊 聽</button><button class="hb" data-slow="${li}">🐢 慢慢念</button></div>
      </div>`;
    }).join('');
    const canRec = !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.indexedDB);
    $app.innerHTML = `
      <section class="hw" style="--c:#ff7043">
        <header class="ptop"><button class="icon" id="hwx" title="回地圖">✕</button><span class="pt">📝 ${HW.title}</span><span class="cnt">${k + 1}/${n}</span></header>
        <div class="hwprog">${HW.items.map((_, j) => `<i class="${st.done.includes(j) ? 'did' : ''} ${j === k ? 'now' : ''}" data-j="${j}"></i>`).join('')}</div>
        <div class="hwnote"><span class="hwhero">${S.player.avatar}</span><span>💡 ${HW.note}<br>先聽問題，自己想想怎麼回答，再看答案跟著念。</span></div>
        <div class="card hwq">
          <div class="hwnum">Q${k + 1}</div>
          <div class="qt en">${esc(it.q)}</div>
          <div class="zh">${esc(it.zh)}</div>
          <button class="listen" id="hwq">🔊 聽問題</button>
        </div>
        ${canRec ? `<div class="rec" id="rec"><div class="hwlbl">🎤 錄下我的回答（會自動保存）</div><button class="btn recb" id="recb">🎤 開始錄音</button><div id="recp"></div>
          <details class="qv"><summary>👨‍👩‍👦 合併用的題目聲音（爸爸媽媽可以自己錄）</summary>
            <p class="tip">合併錄音時，每題會先放題目，再放 Ivan 的回答。可以用內建的電腦語音，也可以由爸爸媽媽念題目錄下來（會優先使用）。</p>
            <div id="qvp"></div></details></div>` : '<p class="note">這個瀏覽器不能錄音，請用 iPad 的 Safari 打開。</p>'}
        <div class="hwa">
          ${reveal ? `<div class="hwlbl">🗣️ 示範答案（完整句子）${it.lines.length > 1 ? `・共 ${it.lines.length} 句` : ''}${it.lines.some((l) => l.options) ? '・可以點選自己的答案' : ''}</div>${linesHTML}
            <button class="hb hide" id="hide">🙈 把答案藏起來</button>`
            : `<button class="hwreveal" id="reveal"><span>🙈</span><b>答案藏起來了</b><small>先自己試著用完整句子回答，再按這裡看答案</small><em>👀 看答案</em></button>`}
        </div>
        <div class="hwnav">
          <button class="btn" id="prev" ${k === 0 ? 'disabled' : ''}>◀ 上一題</button>
          <button class="btn gold" id="next">${st.done.includes(k) ? '下一題 ▶' : '✅ 念好了！'}</button>
        </div>
      </section>`;
    if (!reveal) window.scrollTo(0, 0);
    const sayLine = (li, rate) => { const { o } = lineOpt(li, it.lines[li]); speak(hwFill(o.en), 'en', rate); };
    $app.querySelector('#hwq').onclick = () => speak(it.q.replace(/ \/ /g, ', or '), 'en');
    const rv = $app.querySelector('#reveal');
    if (rv) rv.onclick = () => { beep('tap'); showHomework(k, true); setTimeout(() => { const a = $app.querySelector('.hwa'); if (a) a.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60); };
    const hd = $app.querySelector('#hide');
    if (hd) hd.onclick = () => showHomework(k, false);
    $app.querySelectorAll('[data-say]').forEach((b) => b.onclick = () => sayLine(+b.dataset.say));
    $app.querySelectorAll('[data-slow]').forEach((b) => b.onclick = () => sayLine(+b.dataset.slow, 0.55));
    $app.querySelectorAll('.pick').forEach((b) => b.onclick = () => { st.pick[`${k}-${b.dataset.li}`] = +b.dataset.j; save(); beep('tap'); showHomework(k, true); setTimeout(() => sayLine(+b.dataset.li), 150); });
    $app.querySelectorAll('.hwprog i').forEach((b) => b.onclick = () => showHomework(+b.dataset.j));
    $app.querySelector('#hwx').onclick = () => { stopRecording(); showHome(); };
    $app.querySelector('#prev').onclick = () => showHomework(k - 1);
    $app.querySelector('#next').onclick = () => {
      if (!st.done.includes(k)) { st.done.push(k); save(); beep('good'); confetti(12); }
      const next = HW.items.findIndex((_, j) => j > k && !st.done.includes(j));
      setTimeout(() => showHomework(next >= 0 ? next : (st.done.length >= n ? n : k + 1)), 350);
    };
    if (!canRec) return;
    const recb = $app.querySelector('#recb'), recp = $app.querySelector('#recp');
    const showSaved = (r) => {
      if (!document.body.contains(recp)) return;
      if (!r) { recp.innerHTML = ''; recb.textContent = '🎤 開始錄音'; return; }
      const url = URL.createObjectURL(r.blob);
      recb.textContent = '🎤 重新錄一次';
      recp.innerHTML = `<div class="saved">✅ 已保存 Q${k + 1} 的錄音</div><audio controls src="${url}"></audio>
        <div class="hwbtns"><button class="hb" id="shr">📤 傳給老師／存檔</button><button class="hb del" id="delr">🗑️ 刪除</button></div>`;
      recp.querySelector('#shr').onclick = () => shareFiles([recFile(HW, k, r)]);
      recp.querySelector('#delr').onclick = async () => { if (!confirm('要刪除這一題的錄音嗎？')) return; await recDB.del(recKey(HW, k)); showSaved(null); };
    };
    recDB.get(recKey(HW, k)).then(showSaved).catch(() => {});
    // 爸爸媽媽錄題目
    const qvp = $app.querySelector('#qvp');
    let qvRec = null;
    const showQv = async () => {
      if (!document.body.contains(qvp)) return;
      const mine = await recDB.get(qvKey(HW, k)).catch(() => null);
      const url = mine ? URL.createObjectURL(mine.blob) : builtinQ(HW, k);
      qvp.innerHTML = `<div class="saved">${mine ? '✅ 目前使用：爸爸媽媽的聲音' : url ? '目前使用：內建的電腦語音' : '還沒有題目聲音'}</div>
        ${url ? `<audio controls src="${url}"></audio>` : ''}
        <div class="hwbtns"><button class="hb" id="qvrec">🎤 ${mine ? '重錄' : '錄'}爸媽念的題目</button>${mine ? '<button class="hb del" id="qvdel">↩️ 改回內建語音</button>' : ''}</div>`;
      const dl = qvp.querySelector('#qvdel');
      if (dl) dl.onclick = async () => { await recDB.del(qvKey(HW, k)); showQv(); };
      const rb = qvp.querySelector('#qvrec');
      rb.onclick = async () => {
        if (qvRec && qvRec.state === 'recording') { qvRec.stop(); return; }
        try {
          hush(); stopRecording();
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          const rec = new MediaRecorder(stream), chunks = [];
          qvRec = rec; recState = { rec };
          rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
          rec.onstop = async () => {
            stream.getTracks().forEach((t) => t.stop());
            const type = (rec.mimeType || (chunks[0] && chunks[0].type) || 'audio/mp4').split(';')[0];
            try { await recDB.set(qvKey(HW, k), { blob: new Blob(chunks, { type }), type, time: Date.now() }); } catch (e) { toast('題目錄音沒辦法保存。'); }
            showQv();
          };
          rec.start();
          rb.textContent = `⏹️ 念完「Question ${k + 1}…」了，停止`; rb.classList.add('on');
        } catch (e) { toast('沒辦法使用麥克風，請在 iPad 的「設定 → Safari → 麥克風」允許使用。'); }
      };
    };
    showQv();
    recb.onclick = async () => {
      if (recState && recState.rec && recState.rec.state === 'recording') { stopRecording(); return; }
      try {
        hush();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const rec = new MediaRecorder(stream), chunks = [];
        recState = { rec };
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          recb.classList.remove('on');
          const type = (rec.mimeType || (chunks[0] && chunks[0].type) || 'audio/mp4').split(';')[0];
          const r = { blob: new Blob(chunks, { type }), type, time: Date.now() };
          try { await recDB.set(recKey(HW, k), r); } catch (e) { toast('錄音沒辦法保存，但還是可以先聽聽看。'); }
          showSaved(r);
          const a = recp.querySelector('audio'); if (a) a.play().catch(() => {});
        };
        rec.start();
        recb.textContent = '⏹️ 錄好了，停止'; recb.classList.add('on');
        recp.innerHTML = '<span class="recdot">● 錄音中…大聲用完整句子回答！</span>';
      } catch (e) { toast('沒辦法使用麥克風，請在 iPad 的「設定 → Safari → 麥克風」允許使用。'); }
    };
  }
  async function showHomeworkDone() {
    const HW = window.HOMEWORK, st = hwState(HW);
    beep('win'); confetti(36);
    const recs = await Promise.all(HW.items.map((_, k) => recDB.get(recKey(HW, k)).catch(() => null)));
    const recAll = await recDB.get(allKey(HW)).catch(() => null);
    const nrec = recs.filter(Boolean).length;
    const list = HW.items.map((it, k) => `<li><div class="lq">${k + 1}. ${esc(it.q)}</div><div class="ans">${it.lines.map((line, li) => {
      const opts = line.options || [line], o = opts[Math.min(st.pick[`${k}-${li}`] || 0, opts.length - 1)];
      return `<div class="la">→ ${esc(hwFill(o.en))}</div>`;
    }).join('')}</div></li>`).join('');
    const recList = HW.items.map((it, k) => `<div class="recrow"><b>Q${k + 1}</b>${recs[k] ? `<audio controls src="${URL.createObjectURL(recs[k].blob)}"></audio>` : '<span class="norec">還沒錄音</span>'}</div>`).join('')
      + `<div class="recrow all"><b>全部</b>${recAll ? `<audio controls src="${URL.createObjectURL(recAll.blob)}"></audio>` : '<span class="norec">還沒錄（按上面的「全部念一次」）</span>'}</div>`;
    $app.innerHTML = `
      <section class="result hwdone" style="--c:#ff7043">
        <div class="hero-big">${S.player.avatar}</div>
        <h2>今日作業完成！</h2>
        <p>Ivan勇士，Great job！</p>
        <button class="readall" id="readall"><span>📖</span><b>最後一步：10 題全部念一次</b><small>題目和答案從頭念到尾，可以錄成一個檔案交給老師${recAll ? '・✅ 已經錄好了' : ''}</small></button>
        <div class="hwlist"><b>🎧 我的錄音（${nrec} / ${HW.items.length} 題${recAll ? '＋全部念一次' : ''}）</b>
          <div class="recs">${recList}</div>
          ${nrec >= 1 ? `<div class="merge" id="merge"><button class="btn" id="mergeb">🔗 把 ${nrec} 題的錄音合併成一個檔案</button>
            <label class="set qset"><input type="checkbox" id="withq" checked> 每題先念題目，再接 Ivan 的回答</label><div id="mergep"></div></div>` : ''}
          ${nrec || recAll ? '<button class="btn gold" id="shareall">📤 一次傳送全部錄音給老師</button><small class="tip">會打開 iPad 的分享，可以選 LINE、AirDrop 或「儲存到檔案」。</small>' : '<small class="tip">回到題目按「🎤 開始錄音」，錄好的聲音會出現在這裡。</small>'}
        </div>
        <div class="hwlist hidden" id="qa"><b>📋 爸爸媽媽可以照著問，Ivan 用完整句子回答：</b>
          <button class="hb" id="showans">👀 顯示答案</button><ol>${list}</ol></div>
        <div class="rbtns"><button class="btn" id="again">🔁 從第 1 題再練一次</button><button class="btn gold" id="back">📅 回今日任務</button></div>
      </section>`;
    const sa = $app.querySelector('#shareall');
    const mb = $app.querySelector('#mergeb');
    if (mb) mb.onclick = async () => {
      const mp = $app.querySelector('#mergep');
      mb.disabled = true; mb.textContent = '⏳ 合併中，請稍等…';
      try {
        const have = recs.map((r, k) => (r ? { r, k } : null)).filter(Boolean);
        const withQ = $app.querySelector('#withq').checked;
        const segs = [];
        let nq = 0;
        for (const x of have) {
          if (withQ) { const qb = await questionBlob(HW, x.k); if (qb) { segs.push({ blob: qb, gap: 0.5 }); nq++; } }
          segs.push({ blob: x.r.blob, gap: 1.2 });
        }
        const wav = await mergeToWav(segs);
        const nums = have.map((x) => x.k + 1);
        const file = new File([wav], `Ivan-${HW.date}-Q${nums[0]}-Q${nums[nums.length - 1]}.wav`, { type: 'audio/wav' });
        mb.disabled = false; mb.textContent = '🔗 重新合併'; beep('good');
        mp.innerHTML = `<div class="saved">合併了 Q${nums.join('、Q')}（共 ${nums.length} 題${withQ ? `，${nq === nums.length ? '每題都' : `其中 ${nq} 題`}先念題目` : ''}）</div><audio controls src="${URL.createObjectURL(wav)}"></audio>
          <button class="btn gold" id="sharemerged">📤 傳送合併好的檔案</button>`;
        mp.querySelector('#sharemerged').onclick = () => shareFiles([file]);
      } catch (e) {
        mb.disabled = false; mb.textContent = '🔗 再試一次合併';
        mp.innerHTML = '<small class="tip">合併失敗了，可以改用下面的按鈕一次傳送全部錄音。</small>';
      }
    };
    if (sa) sa.onclick = () => shareFiles([...(recAll ? [allFile(HW, recAll)] : []), ...recs.map((r, k) => (r ? recFile(HW, k, r) : null)).filter(Boolean)]);
    $app.querySelector('#readall').onclick = () => { beep('tap'); showReadAll(); };
    $app.querySelector('#showans').onclick = (e) => { const qa = $app.querySelector('#qa'); qa.classList.toggle('hidden'); e.target.textContent = qa.classList.contains('hidden') ? '👀 顯示答案' : '🙈 隱藏答案'; };
    $app.querySelector('#again').onclick = () => showHomework(0);
    $app.querySelector('#back').onclick = () => showHome();
  }



  // ---------- 合併錄音：解碼每一題的錄音，中間留空白，接成一個 WAV 檔 ----------
  async function mergeToWav(segs, rate) { // segs: [{ blob, gap（這段後面空幾秒） }]
    rate = rate || 22050;
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const decode = (buf) => new Promise((res, rej) => { const pr = ctx.decodeAudioData(buf, res, rej); if (pr && pr.then) pr.then(res, rej); });
    const parts = [];
    for (const sg of segs) {
      const ab = await decode(await new Response(sg.blob).arrayBuffer());
      const n = ab.length, ch = ab.numberOfChannels, mono = new Float32Array(n);
      for (let c = 0; c < ch; c++) { const d = ab.getChannelData(c); for (let i = 0; i < n; i++) mono[i] += d[i] / ch; }
      const ratio = ab.sampleRate / rate, len = Math.floor(n / ratio), out = new Float32Array(len); // 線性重新取樣
      for (let i = 0; i < len; i++) { const x = i * ratio, i0 = Math.floor(x), f = x - i0; out[i] = mono[i0] * (1 - f) + (mono[Math.min(i0 + 1, n - 1)] || 0) * f; }
      parts.push({ pcm: out, gap: Math.round((sg.gap == null ? 0.8 : sg.gap) * rate) });
    }
    if (ctx.close) ctx.close();
    const total = parts.reduce((t, x, i) => t + x.pcm.length + (i < parts.length - 1 ? x.gap : 0), 0);
    const pcm = new Float32Array(total); let o = 0;
    parts.forEach((x) => { pcm.set(x.pcm, o); o += x.pcm.length + x.gap; });
    const buf = new ArrayBuffer(44 + total * 2), v = new DataView(buf);
    const str = (off, t) => { for (let i = 0; i < t.length; i++) v.setUint8(off + i, t.charCodeAt(i)); };
    str(0, 'RIFF'); v.setUint32(4, 36 + total * 2, true); str(8, 'WAVE'); str(12, 'fmt ');
    v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); str(36, 'data'); v.setUint32(40, total * 2, true);
    for (let i = 0; i < total; i++) { const x = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(44 + i * 2, x < 0 ? x * 0x8000 : x * 0x7fff, true); }
    return new Blob([buf], { type: 'audio/wav' });
  }

  // ---------- 全部念一次：10 題題目＋答案列在同一頁，錄成一個檔案 ----------
  const allKey = (HW) => `${hwKey(HW)}-all`;
  const allFile = (HW, r) => new File([r.blob], `Ivan-${HW.date}-all.${extOf(r.type)}`, { type: r.type });
  function speakQueue(texts) { // 依序念：題目、答案、題目、答案…
    if (!('speechSynthesis' in window)) return;
    try {
      speechSynthesis.cancel();
      const v = speechSynthesis.getVoices().find((x) => /^en[-_]US/i.test(x.lang)) || speechSynthesis.getVoices().find((x) => /^en/i.test(x.lang));
      texts.forEach((t) => { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-US'; u.rate = 0.8; if (v) u.voice = v; speechSynthesis.speak(u); });
    } catch (e) { /* 忽略 */ }
  }
  async function showReadAll() {
    hush(); stopRecording();
    const HW = window.HOMEWORK, st = hwState(HW);
    const items = HW.items.map((it, k) => ({ q: it.q, a: it.lines.map((line, li) => { const opts = line.options || [line]; return hwFill(opts[Math.min(st.pick[`${k}-${li}`] || 0, opts.length - 1)].en); }) }));
    const canRec = !!(window.MediaRecorder && navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.indexedDB);
    $app.innerHTML = `
      <section class="hw readpage" style="--c:#ff7043">
        <header class="ptop"><button class="icon" id="rax" title="返回">✕</button><span class="pt">📖 全部念一次</span><span class="cnt"></span></header>
        <div class="hwnote"><span class="hwhero">${S.player.avatar}</span><span>先念題目，再用完整句子念答案。<br>從第 1 題念到第 10 題，念完按「停止」就存好了！</span></div>
        <button class="hb demo" id="demo">🔊 先聽一遍示範</button>
        <ol class="readlist">${items.map((x, k) => `<li><div class="rq"><span>Q${k + 1}</span>${esc(x.q)}</div>${x.a.map((a) => `<div class="ra">${esc(a)}</div>`).join('')}</li>`).join('')}</ol>
        <div class="readend">🎉 念完了！記得按下面的「停止」</div>
        ${canRec ? `<div class="recbar"><div id="recp"></div><button class="btn recb" id="recb">🎤 開始錄音（從 Q1 念到 Q10）</button></div>` : '<p class="note">這個瀏覽器不能錄音，請用 iPad 的 Safari 打開。</p>'}
      </section>`;
    window.scrollTo(0, 0);
    $app.querySelector('#rax').onclick = () => { hush(); stopRecording(); showHomeworkDone(); };
    let demoOn = false;
    $app.querySelector('#demo').onclick = (e) => {
      if (demoOn) { hush(); demoOn = false; e.target.textContent = '🔊 先聽一遍示範'; return; }
      demoOn = true; e.target.textContent = '⏹️ 停止示範';
      speakQueue(items.flatMap((x, k) => [`Question ${k + 1}. ${x.q.replace(/ \/ /g, ', or ')}`, ...x.a]));
    };
    if (!canRec) return;
    const recb = $app.querySelector('#recb'), recp = $app.querySelector('#recp');
    const showSaved = (r) => {
      if (!document.body.contains(recp)) return;
      if (!r) { recp.innerHTML = ''; recb.textContent = '🎤 開始錄音（從 Q1 念到 Q10）'; return; }
      recb.textContent = '🎤 重新錄一次';
      recp.innerHTML = `<div class="saved">✅ 已保存「全部念一次」的錄音</div><audio controls src="${URL.createObjectURL(r.blob)}"></audio>
        <div class="hwbtns"><button class="hb" id="shr">📤 傳給老師／存檔</button><button class="hb del" id="delr">🗑️ 刪除</button></div>`;
      recp.querySelector('#shr').onclick = () => shareFiles([allFile(HW, r)]);
      recp.querySelector('#delr').onclick = async () => { if (!confirm('要刪除這段錄音嗎？')) return; await recDB.del(allKey(HW)); showSaved(null); };
    };
    recDB.get(allKey(HW)).then(showSaved).catch(() => {});
    let tick = null;
    recb.onclick = async () => {
      if (recState && recState.rec && recState.rec.state === 'recording') { stopRecording(); return; }
      try {
        hush();
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const rec = new MediaRecorder(stream), chunks = [], t0 = Date.now();
        recState = { rec };
        rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = async () => {
          clearInterval(tick);
          stream.getTracks().forEach((t) => t.stop());
          recb.classList.remove('on');
          const type = (rec.mimeType || (chunks[0] && chunks[0].type) || 'audio/mp4').split(';')[0];
          const r = { blob: new Blob(chunks, { type }), type, time: Date.now() };
          try { await recDB.set(allKey(HW), r); } catch (e) { toast('錄音沒辦法保存，但還是可以先聽聽看。'); }
          showSaved(r); beep('win'); confetti(20);
        };
        rec.start(1000);
        recb.textContent = '⏹️ 念完了，停止錄音'; recb.classList.add('on');
        const upd = () => { const sec = Math.floor((Date.now() - t0) / 1000); recp.innerHTML = `<span class="recdot">● 錄音中 ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}　從 Q1 開始大聲念！</span>`; };
        upd(); tick = setInterval(upd, 500);
      } catch (e) { toast('沒辦法使用麥克風，請在 iPad 的「設定 → Safari → 麥克風」允許使用。'); }
    };
  }

  // ---------- 寶物箱 ----------
  function showBag() {
    const m = modal(`<div class="rhead" style="--c:#8d6e63"><span class="ric">🎒</span><div><h2>寶物箱</h2><small>打敗魔王就能拿回寶物</small></div><button class="x">✕</button></div>
      <div class="bag">${REGIONS.map((r) => `<div class="slot ${S.bosses[r.id] ? 'got' : ''}"><span>${S.bosses[r.id] ? r.treasure : '❔'}</span><small>${r.name}</small></div>`).join('')}</div>
      ${S.bosses[FINAL.id] ? `<p class="note">🏆 你打敗了${STORY.villain.name}！</p>` : ''}
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
    const rows = SUBJECTS.map((sb) => `<tr class="grp"><td colspan="4">${sb.icon} ${sb.name}</td></tr>` + sb.regions.map((r) => {
      const s = S.stats[r.id] || { right: 0, wrong: 0 }, t = s.right + s.wrong;
      return `<tr><td>${r.icon} ${r.name}</td><td>${t}</td><td>${t ? Math.round(s.right / t * 100) + '%' : '—'}</td><td>${regionStars(r)}/12</td></tr>`;
    }).join('')).join('');
    const m = modal(`<div class="rhead" style="--c:#546e7a"><span class="ric">⚙️</span><div><h2>家長設定</h2><small>${esc(S.player.name)} 的學習紀錄</small></div><button class="x">✕</button></div>
      <table class="stats"><thead><tr><th>地區</th><th>作答</th><th>答對率</th><th>星星</th></tr></thead><tbody>${rows}</tbody></table>
      <label class="set"><input type="checkbox" id="ar" ${st.autoRead ? 'checked' : ''}> 自動念題目和劇情</label>
      <label class="set">每隻手下的血量（題數） <select id="cnt">${[4, 6, 8, 10].map((n) => `<option ${n === st.count ? 'selected' : ''}>${n}</option>`).join('')}</select></label>
      <label class="set"><input type="checkbox" id="sl" ${st.showLands ? 'checked' : ''}> 首頁顯示「選擇國度」自由冒險關卡</label>
      <label class="set"><input type="checkbox" id="rs"> 下次重新播放全部劇情</label>
      <div class="rbtns"><button class="btn danger" id="reset">清除全部進度</button><button class="btn gold" id="done">完成</button></div>`);
    const close = () => { m.remove(); if ($app.querySelector('.home')) showHome(); else showMap(); };
    m.querySelector('.x').onclick = close;
    m.querySelector('#done').onclick = close;
    m.querySelector('#ar').onchange = (e) => { st.autoRead = e.target.checked; save(); };
    m.querySelector('#cnt').onchange = (e) => { st.count = +e.target.value; save(); };
    m.querySelector('#sl').onchange = (e) => { st.showLands = e.target.checked; save(); };
    m.querySelector('#rs').onchange = (e) => { if (e.target.checked) { S.seen = {}; save(); } };
    m.querySelector('#reset').onclick = () => {
      if (!confirm('確定要清除全部星星、寶物、劇情和學習紀錄嗎？')) return;
      const keep = { player: S.player, settings: S.settings }; S = Object.assign(fresh(), keep); save(); close();
    };
  }

  // 開始
  if ('speechSynthesis' in window) { try { speechSynthesis.getVoices(); } catch (e) { /* 忽略 */ } }
  showStart();
  loadDaily().then(() => { if ($app.querySelector('.home')) showHome(); });
  window.__game = { get P() { return P; }, get S() { return S; } }; // 方便測試
})();
