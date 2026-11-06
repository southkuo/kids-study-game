/* 題目產生器：每次都隨機出新題目，依小學 2～4 年級課綱分成 9 個地區、每區 3 個難度。
   每題回傳 { text, answer, options, explain, visual }
   - text / options / explain 裡的 [3/5] 會被畫成分數
   - visual 是題目下方的圖（時鐘、錢幣、圓點、分數圖…），HTML 字串 */
(function (g) {
  'use strict';

  // ---------- 小工具 ----------
  const R = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
  const pick = (arr) => arr[R(0, arr.length - 1)];
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) { const j = R(0, i); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
  };
  const N = (n) => (Math.abs(n) >= 10000 ? n.toLocaleString('en-US') : String(n));
  const NAMES = ['小安', '小樂', '阿寶', '小米', '豆豆', '小宇', '樂樂', '小晴'];
  const CN = '零一二三四五六七八九';
  const PLACE = ['個位', '十位', '百位', '千位', '萬位', '十萬位'];

  // 4 個不重複的數字選項（含正確答案）
  function numOpts(ans, extra, min, count) {
    min = min == null ? 0 : min;
    count = count || 4;
    const set = new Set([ans]);
    for (const e of extra || []) {
      if (set.size >= count) break;
      if (Number.isInteger(e) && e >= min && e !== ans) set.add(e);
    }
    const spread = Math.max(3, Math.round(Math.abs(ans) * 0.12));
    let guard = 0;
    while (set.size < count && guard++ < 300) {
      const c = ans + R(-spread, spread);
      if (c >= min) set.add(c);
    }
    let k = 1;
    while (set.size < count) set.add(ans + k++);
    return shuffle([...set]).map(N);
  }
  // 字串選項：補足到 4 個不重複
  function strOpts(ans, cands, filler) {
    const set = new Set([ans]);
    for (const c of cands) { if (set.size >= 4) break; if (c && c !== ans) set.add(c); }
    let guard = 0;
    while (set.size < 4 && filler && guard++ < 200) { const c = filler(); if (c) set.add(c); }
    return shuffle([...set]);
  }
  const Q = (text, answer, options, explain, visual) =>
    ({ text, answer: String(answer), options: options.map(String), explain, visual: visual || '' });

  // 九九乘法口訣，例如 六七四十二
  function koujue(a, b) {
    const [x, y] = a <= b ? [a, b] : [b, a];
    const p = x * y;
    let s;
    if (p < 10) s = '得' + CN[p];
    else { const t = Math.floor(p / 10), u = p % 10; s = (t === 1 ? '一十' : CN[t] + '十') + (u ? CN[u] : ''); }
    return CN[x] + CN[y] + s;
  }

  // 直式加法解說
  function colAdd(a, b) {
    const da = String(a).split('').reverse(), db = String(b).split('').reverse();
    const len = Math.max(da.length, db.length);
    let carry = 0; const steps = [];
    for (let i = 0; i < len; i++) {
      const x = +(da[i] || 0), y = +(db[i] || 0), s = x + y + carry;
      steps.push(`${PLACE[i]}：${x} + ${y}${carry ? ' + 1（進位）' : ''} = ${s}${s >= 10 ? `，寫 ${s % 10}、進 1` : ''}`);
      carry = s >= 10 ? 1 : 0;
    }
    if (carry) steps.push(`進位的 1 寫在${PLACE[len]}`);
    return steps.join('<br>') + `<br>所以答案是 <b>${a + b}</b>`;
  }
  // 直式減法解說
  function colSub(a, b) {
    const da = String(a).split('').reverse(), db = String(b).split('').reverse();
    let borrow = 0; const steps = [];
    for (let i = 0; i < da.length; i++) {
      const x0 = +da[i], y = +(db[i] || 0), x = x0 - borrow;
      const note = borrow ? `（被借走 1，剩 ${x}）` : '';
      if (x < y) {
        steps.push(`${PLACE[i]}：${x0}${note} 不夠減 ${y}，向${PLACE[i + 1]}借 1 當 10 → ${x + 10} − ${y} = ${x + 10 - y}`);
        borrow = 1;
      } else {
        if (i < db.length || borrow) steps.push(`${PLACE[i]}：${x0}${note} − ${y} = ${x - y}`);
        borrow = 0;
      }
    }
    return steps.join('<br>') + `<br>所以答案是 <b>${a - b}</b>`;
  }

  // ---------- 圖 ----------
  function dots(groups, per, cls) {
    let h = `<div class="dots ${cls || ''}">`;
    for (let i = 0; i < groups; i++) {
      h += '<span class="grp">';
      for (let j = 0; j < per; j++) h += '<i></i>';
      h += '</span>';
    }
    return h + '</div>';
  }
  function clockSVG(h, m) {
    const ha = ((h % 12) + m / 60) * 30, ma = m * 6;
    let s = '<svg class="clock" viewBox="0 0 100 100" aria-hidden="true">' +
      '<circle cx="50" cy="50" r="47" fill="#fffdf5" stroke="#5b3b1a" stroke-width="3"/>';
    for (let i = 0; i < 60; i++) {
      const a = i * 6 * Math.PI / 180, r1 = i % 5 ? 43 : 40;
      s += `<line x1="${50 + 45 * Math.sin(a)}" y1="${50 - 45 * Math.cos(a)}" x2="${50 + r1 * Math.sin(a)}" y2="${50 - r1 * Math.cos(a)}" stroke="#5b3b1a" stroke-width="${i % 5 ? 0.6 : 1.6}"/>`;
    }
    for (let i = 1; i <= 12; i++) {
      const a = i * 30 * Math.PI / 180;
      s += `<text x="${50 + 33 * Math.sin(a)}" y="${50 - 33 * Math.cos(a) + 3.6}" text-anchor="middle" font-size="10" font-weight="700" fill="#3a2a14">${i}</text>`;
    }
    s += `<line x1="50" y1="50" x2="50" y2="27" stroke="#d2462f" stroke-width="4.5" stroke-linecap="round" transform="rotate(${ha} 50 50)"/>`;
    s += `<line x1="50" y1="50" x2="50" y2="13" stroke="#2f5fd2" stroke-width="2.6" stroke-linecap="round" transform="rotate(${ma} 50 50)"/>`;
    s += '<circle cx="50" cy="50" r="3" fill="#3a2a14"/></svg>';
    return s + '<div class="hint">🔴 短針＝時針　🔵 長針＝分針</div>';
  }
  function pieSVG(n, d) {
    let s = '<svg class="pie" viewBox="0 0 100 100" aria-hidden="true">';
    for (let i = 0; i < d; i++) {
      const a0 = (i / d) * 2 * Math.PI - Math.PI / 2, a1 = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
      const x0 = 50 + 44 * Math.cos(a0), y0 = 50 + 44 * Math.sin(a0), x1 = 50 + 44 * Math.cos(a1), y1 = 50 + 44 * Math.sin(a1);
      s += `<path d="M50 50 L${x0} ${y0} A44 44 0 0 1 ${x1} ${y1} Z" fill="${i < n ? '#ff9f43' : '#fff'}" stroke="#5b3b1a" stroke-width="1.6"/>`;
    }
    return s + '</svg>';
  }
  function barSVG(total, colored, colors) {
    const w = 100 / total;
    let s = `<svg class="bar" viewBox="0 0 100 16" preserveAspectRatio="none" aria-hidden="true">`;
    for (let i = 0; i < total; i++) {
      let fill = '#fff';
      let acc = 0;
      for (let k = 0; k < colored.length; k++) { acc += colored[k]; if (i < acc) { fill = colors[k]; break; } }
      s += `<rect x="${i * w}" y="1" width="${w}" height="14" fill="${fill}" stroke="#5b3b1a" stroke-width="0.5" vector-effect="non-scaling-stroke"/>`;
    }
    return s + '</svg>';
  }
  const COIN = { 1: 'c1', 5: 'c5', 10: 'c10', 50: 'c50', 100: 'b100', 500: 'b500', 1000: 'b1000' };
  function money(list) {
    return '<div class="money">' + list.slice().sort((a, b) => b - a)
      .map((v) => `<span class="${COIN[v]}">${v}</span>`).join('') + '</div>';
  }
  function rectSVG(l, w, square) {
    const W = 70, H = square ? 70 : Math.max(26, Math.round(70 * w / l));
    return `<svg class="rect" viewBox="0 0 120 ${H + 30}" aria-hidden="true">` +
      `<rect x="25" y="8" width="${W}" height="${H}" fill="#cdeccf" stroke="#2e7d32" stroke-width="2.5"/>` +
      `<text x="60" y="${H + 25}" text-anchor="middle" font-size="11" font-weight="700" fill="#2e4d1f">${l} 公分</text>` +
      `<text x="${25 + W + 5}" y="${8 + H / 2 + 4}" font-size="11" font-weight="700" fill="#2e4d1f">${w} 公分</text></svg>`;
  }

  // ---------- 1. 加減草原（二年級） ----------
  function genAdd(d) {
    const plus = Math.random() < 0.5;
    let a, b;
    if (d === 1) {
      if (plus) do { a = R(10, 79); b = R(10, 49); } while ((a % 10) + (b % 10) >= 10 || a + b > 99);
      else do { a = R(25, 99); b = R(10, a - 5); } while (a % 10 < b % 10);
    } else if (d === 2) {
      if (plus) do { a = R(15, 79); b = R(15, 59); } while ((a % 10) + (b % 10) < 10 || a + b > 99);
      else do { a = R(30, 99); b = R(11, a - 5); } while (a % 10 >= b % 10);
    } else {
      if (plus) { a = R(120, 650); b = R(105, 330); } else { a = R(350, 980); b = R(105, a - 60); }
    }
    const ans = plus ? a + b : a - b;
    let text;
    const name = pick(NAMES);
    if (Math.random() < 0.4) {
      text = plus ? pick([
        `${name}有 ${a} 張貼紙，又拿到 ${b} 張，現在共有幾張？`,
        `果園裡有 ${a} 顆蘋果和 ${b} 顆橘子，共有幾顆水果？`,
        `圖書館上午借出 ${a} 本書，下午借出 ${b} 本，一天共借出幾本？`,
      ]) : pick([
        `${name}有 ${a} 元，買文具花了 ${b} 元，還剩幾元？`,
        `書架上有 ${a} 本書，被借走 ${b} 本，還剩幾本？`,
        `池塘裡有 ${a} 隻小魚，游走了 ${b} 隻，還剩幾隻？`,
      ]);
    } else text = `${a} ${plus ? '+' : '−'} ${b} = ？`;
    // 常見錯誤：忘了進位／退位
    const noCarry = plus ? ans - 10 : ans + 10;
    const explain = (plus ? `用直式算 ${a} + ${b}：<br>` + colAdd(a, b) : `用直式算 ${a} − ${b}：<br>` + colSub(a, b));
    return Q(text, ans, numOpts(ans, [noCarry, ans + 1, ans - 1, ans + 100, ans - 100]), explain);
  }

  // ---------- 2. 乘法森林（二年級） ----------
  function genMul(d) {
    let a, b;
    if (d === 1) { a = pick([2, 3, 4, 5]); b = R(1, 9); }
    else if (d === 2) { a = R(6, 9); b = R(2, 9); }
    else { a = R(2, 9); b = R(2, 9); }
    const p = a * b;
    const extra = [p + a, p - a, p + b, p - b, a + b, p + 1];
    if (d === 3) {
      const t = R(0, 2);
      if (t === 0) {
        return Q(`□ × ${b} = ${p}，□ 是多少？`, a, numOpts(a, [a + 1, a - 1, b, p - b], 1),
          `想想看：幾乘以 ${b} 等於 ${p}？<br>口訣「${koujue(a, b)}」，所以 □ = <b>${a}</b>`);
      }
      if (t === 1) {
        const thing = pick([['盒', '顆巧克力'], ['包', '片餅乾'], ['袋', '顆彈珠'], ['排', '張椅子']]);
        return Q(`每${thing[0]}有 ${a} ${thing[1]}，${b} ${thing[0]}共有幾${thing[1][0]}？`, p, numOpts(p, extra, 1),
          `${b} ${thing[0]}，每${thing[0]} ${a} 個，就是 ${b} 個 ${a}：<br>${a} × ${b} = <b>${p}</b>（${koujue(a, b)}）`);
      }
      return Q(`${a} 的 ${b} 倍是多少？`, p, numOpts(p, extra, 1), `${a} 的 ${b} 倍就是 ${a} × ${b} = <b>${p}</b>（${koujue(a, b)}）`);
    }
    const visual = d === 1 && p <= 30 ? dots(b, a) : '';
    const explain = d === 1
      ? `${a} × ${b} 就是 ${b} 個 ${a} 加起來：<br>${Array(b).fill(a).join(' + ')} = <b>${p}</b>`
      : `九九乘法口訣：「${koujue(a, b)}」<br>${a} × ${b} = <b>${p}</b>`;
    return Q(`${a} × ${b} = ？`, p, numOpts(p, extra, 0), explain, visual);
  }

  // ---------- 3. 時鐘山谷（二年級） ----------
  const T = (h, m) => (m === 0 ? `${h} 時整` : `${h} 時 ${m} 分`);
  function genTime(d) {
    const h = R(1, 12);
    if (d <= 2) {
      const m = d === 1 ? pick([0, 30]) : R(1, 11) * 5;
      const ans = T(h, m);
      const nh = h % 12 + 1, ph = (h + 10) % 12 + 1;
      const cands = [T(nh, m), T(ph, m), T(h, m / 5 || 12), T((m / 5) || 12, h === 12 ? 0 : h * 5), T(h, (m + 30) % 60)];
      const explain = `🔴 短針是時針，指在 ${m === 0 ? h : `${h} 和 ${nh} 中間`}，所以是 ${h} 時${m ? '多' : ''}。<br>` +
        (m === 0 ? '🔵 長針指在 12，所以是「整點」。' : `🔵 長針是分針，指在 ${m / 5}，一大格 5 分鐘：${m / 5} × 5 = ${m} 分。`) +
        `<br>答案是 <b>${ans}</b>`;
      return Q('時鐘上是幾時幾分？', ans, strOpts(ans, shuffle(cands), () => T(R(1, 12), R(0, 11) * 5)), explain, clockSVG(h, m));
    }
    const m = R(0, 11) * 5, add = pick([10, 15, 20, 25, 30, 35, 40, 45, 50]);
    const total = m + add, eh = total >= 60 ? h % 12 + 1 : h, em = total % 60;
    const ans = T(eh, em);
    const cands = [T(h, em), T(eh % 12 + 1, em), T(eh, (em + 5) % 60), T(eh, (em + 55) % 60)];
    const explain = `現在是 ${T(h, m)}，再過 ${add} 分鐘：<br>${m} + ${add} = ${total} 分` +
      (total >= 60 ? `，超過 60 分鐘就進 1 小時：${total} − 60 = ${em} 分，${h} 時變成 ${eh} 時` : '') +
      `<br>答案是 <b>${ans}</b>`;
    return Q(`時鐘上是現在的時間。再過 ${add} 分鐘是幾時幾分？`, ans, strOpts(ans, cands, () => T(R(1, 12), R(0, 11) * 5)), explain, clockSVG(h, m));
  }

  // ---------- 4. 錢幣市集（二年級） ----------
  function genMoney(d) {
    if (d === 1 || (d === 2 && Math.random() < 0.5)) {
      const kinds = d === 1 ? [1, 5, 10] : [1, 5, 10, 50, 100];
      const list = []; const n = d === 1 ? R(3, 6) : R(4, 7);
      for (let i = 0; i < n; i++) list.push(pick(kinds));
      const sum = list.reduce((s, v) => s + v, 0);
      const counts = {};
      list.forEach((v) => (counts[v] = (counts[v] || 0) + 1));
      const parts = Object.keys(counts).map(Number).sort((a, b) => b - a);
      const explain = '大的錢先算：<br>' + parts.map((v) => `${counts[v]} 個 ${v} 元 = ${v * counts[v]} 元`).join('<br>') +
        `<br>合起來：${parts.map((v) => v * counts[v]).join(' + ')} = <b>${sum}</b> 元`;
      return Q('這些錢共有幾元？', sum, numOpts(sum, [sum + 5, sum - 5, sum + 10, sum - 1, list.length], 1), explain, money(list));
    }
    if (d === 2) {
      const price = R(11, 48), pay = 50, ch = pay - price;
      const item = pick(['一枝筆', '一本筆記本', '一盒色鉛筆', '一個麵包']);
      return Q(`${item} ${price} 元，付 ${pay} 元，要找回幾元？`, ch, numOpts(ch, [ch + 10, ch - 10, ch + 1, price], 1),
        `找回的錢 = 付的錢 − 價錢<br>${pay} − ${price} = <b>${ch}</b> 元`, money([50]));
    }
    const a = R(25, 180), b = R(15, 120), pay = a + b > 200 ? 500 : pick([200, 500]);
    const ia = pick(['鉛筆盒', '故事書', '水壺']), ib = pick(['橡皮擦', '貼紙', '尺']);
    const sum = a + b, ch = pay - sum;
    return Q(`${ia} ${a} 元、${ib} ${b} 元，付 ${pay} 元，要找回幾元？`, ch, numOpts(ch, [ch + 10, ch - 10, sum, ch + 100], 1),
      `先算共要付多少：${a} + ${b} = ${sum} 元<br>再算找回：${pay} − ${sum} = <b>${ch}</b> 元`, money([pay === 500 ? 500 : 100, ...(pay === 200 ? [100] : [])]));
  }

  // ---------- 5. 除法洞窟（三年級） ----------
  function genDiv(d) {
    const b = R(2, 9), q = R(2, 9);
    if (d === 1) {
      const a = b * q;
      return Q(`${a} ÷ ${b} = ？`, q, numOpts(q, [q + 1, q - 1, b, a - b], 1),
        `把 ${a} 平分成 ${b} 份，想想 ${b} × 幾 = ${a}？<br>口訣「${koujue(b, q)}」，所以 ${a} ÷ ${b} = <b>${q}</b>`,
        a <= 30 ? dots(b, q) : '');
    }
    if (d === 2) {
      const r = R(1, b - 1), a = b * q + r, ans = `${q} 餘 ${r}`;
      const cands = [`${q + 1} 餘 ${r}`, `${q - 1} 餘 ${r + b}`, `${q} 餘 ${r + 1 < b ? r + 1 : r - 1}`, `${q + 1} 餘 0`];
      return Q(`${a} ÷ ${b} = ？`, ans, strOpts(ans.replace(/ 餘 0$/, ''), cands, () => `${R(1, 9)} 餘 ${R(1, 8)}`),
        `${b} × ${q} = ${b * q}，${a} − ${b * q} = ${r}<br>餘數 ${r} 比除數 ${b} 小，所以答案是 <b>${ans}</b>`);
    }
    const r = R(1, b - 1);
    if (Math.random() < 0.5) {
      const a = b * q;
      return Q(`有 ${a} 顆糖果，平分給 ${b} 個小朋友，每人分到幾顆？`, q, numOpts(q, [q + 1, q - 1, a - b], 1),
        `平分就用除法：${a} ÷ ${b} = <b>${q}</b>（${koujue(b, q)}）`);
    }
    const a = b * q + r;
    return Q(`有 ${a} 個人要坐船，每艘船最多坐 ${b} 人，至少要幾艘船？`, q + 1, numOpts(q + 1, [q, q + 2, r], 1),
      `${a} ÷ ${b} = ${q} 餘 ${r}<br>${q} 艘船坐滿後還剩 ${r} 人，他們也要坐船，所以要再多 1 艘：${q} + 1 = <b>${q + 1}</b> 艘`);
  }

  // ---------- 6. 分數海灣（三～四年級） ----------
  const F = (n, d) => `[${n}/${d}]`;
  function genFrac(d) {
    if (d === 1) {
      const den = R(2, 8), n = R(1, den - 1);
      const ans = F(n, den);
      const vis = Math.random() < 0.5 ? pieSVG(n, den) : barSVG(den, [n], ['#ff9f43']);
      return Q('塗色的部分是全部的幾分之幾？', ans, strOpts(ans, [F(den - n, den), F(n, den + 1), F(den, n + den), F(1, den)], () => F(R(1, 7), R(2, 9))),
        `全部平分成 ${den} 份，塗色的有 ${n} 份，所以是 <b>${ans}</b>（讀作「${den} 分之 ${n}」）`, vis);
    }
    if (d === 2) {
      if (Math.random() < 0.5) {
        const den = R(4, 12); let a = R(1, den - 1), b; do { b = R(1, den - 1); } while (b === a);
        const big = Math.max(a, b);
        return Q(`${F(a, den)} 和 ${F(b, den)}，哪一個比較大？`, F(big, den), shuffle([F(a, den), F(b, den)]),
          `分母一樣（都分成 ${den} 份），分子越大，拿到的份數越多。<br>${Math.max(a, b)} 比 ${Math.min(a, b)} 大，所以 <b>${F(big, den)}</b> 比較大`);
      }
      const a = R(2, 9); let b; do { b = R(2, 9); } while (b === a);
      const big = Math.min(a, b);
      return Q(`${F(1, a)} 和 ${F(1, b)}，哪一個比較大？`, F(1, big), shuffle([F(1, a), F(1, b)]),
        `同樣一個蛋糕，分給越多人，每一塊就越小。<br>分成 ${big} 份比分成 ${Math.max(a, b)} 份的每一塊大，所以 <b>${F(1, big)}</b> 比較大`,
        `<div class="pies">${pieSVG(1, a)}${pieSVG(1, b)}</div>`);
    }
    const den = R(4, 12);
    if (Math.random() < 0.6) {
      let a, b; do { a = R(1, den - 2); b = R(1, den - 2); } while (a + b >= den);
      const ans = F(a + b, den);
      return Q(`${F(a, den)} + ${F(b, den)} = ？`, ans, strOpts(ans, [F(a + b, den * 2), F(a + b, den + 1), F(Math.abs(a - b) || 1, den), F(a + b + 1, den)], () => F(R(1, 11), den)),
        `分母一樣，分母不變，分子相加：<br>${a} + ${b} = ${a + b}，所以是 <b>${ans}</b>`, barSVG(den, [a, b], ['#4dabf7', '#ff9f43']));
    }
    const a = R(2, den - 1), b = R(1, a - 1);
    const ans = F(a - b, den);
    return Q(`${F(a, den)} − ${F(b, den)} = ？`, ans, strOpts(ans, [F(a - b, den - 1), F(a + b, den), F(a - b + 1, den), F(a - b, den * 2)], () => F(R(1, 11), den)),
      `分母一樣，分母不變，分子相減：<br>${a} − ${b} = ${a - b}，所以是 <b>${ans}</b>`);
  }

  // ---------- 7. 測量高原（二～三年級） ----------
  function genMeasure(d) {
    if (d === 1) {
      const m = R(1, 5), c = R(1, 19) * 5;
      if (Math.random() < 0.5) {
        const ans = m * 100 + c;
        return Q(`${m} 公尺 ${c} 公分 = ？公分`, ans, numOpts(ans, [m * 10 + c, m + c, m * 1000 + c, ans + 10]),
          `1 公尺 = 100 公分<br>${m} 公尺 = ${m * 100} 公分，再加 ${c} 公分：${m * 100} + ${c} = <b>${ans}</b> 公分`);
      }
      const total = m * 100 + c, ans = `${m} 公尺 ${c} 公分`;
      return Q(`${total} 公分 = 幾公尺幾公分？`, ans, strOpts(ans, [`${m * 10} 公尺 ${c} 公分`, `${m} 公尺 ${c * 10} 公分`, `${m + 1} 公尺 ${c} 公分`, `${Math.floor(total / 10)} 公尺 ${total % 10} 公分`], null),
        `100 公分 = 1 公尺<br>${total} 公分裡有 ${m} 個 100 公分，就是 ${m} 公尺，還剩 ${c} 公分<br>答案是 <b>${ans}</b>`);
    }
    if (d === 2) {
      const k = R(1, 6), gr = R(1, 19) * 50;
      const t = R(0, 2);
      if (t === 0) {
        const ans = k * 1000 + gr;
        return Q(`${k} 公斤 ${gr} 公克 = ？公克`, ans, numOpts(ans, [k * 100 + gr, k + gr, ans + 100, ans - 100]),
          `1 公斤 = 1000 公克<br>${k} 公斤 = ${k * 1000} 公克，再加 ${gr} 公克：<b>${ans}</b> 公克`);
      }
      if (t === 1) {
        const total = k * 1000 + gr, ans = `${k} 公斤 ${gr} 公克`;
        return Q(`${total} 公克 = 幾公斤幾公克？`, ans, strOpts(ans, [`${k * 10} 公斤 ${gr} 公克`, `${k} 公斤 ${gr * 10} 公克`, `${k + 1} 公斤 ${gr} 公克`, `${Math.floor(total / 100)} 公斤 ${total % 100} 公克`], null),
          `1000 公克 = 1 公斤<br>${total} 公克 = ${k} 個 1000 公克 + ${gr} 公克<br>答案是 <b>${ans}</b>`);
      }
      const ans = 1000 - gr;
      return Q(`一袋米重 1 公斤，用掉 ${gr} 公克，還剩幾公克？`, ans, numOpts(ans, [100 - gr % 100, ans + 100, ans - 100, gr]),
        `1 公斤 = 1000 公克<br>1000 − ${gr} = <b>${ans}</b> 公克`);
    }
    if (Math.random() < 0.5) {
      const L = R(1, 4), ml = R(1, 9) * 100, add = R(1, 9) * 100;
      const totalMl = L * 1000 + ml + add, ans = `${Math.floor(totalMl / 1000)} 公升 ${totalMl % 1000} 毫升`.replace(/ 0 毫升$/, '');
      const wrong = (l, m) => (m ? `${l} 公升 ${m} 毫升` : `${l} 公升`);
      return Q(`${L} 公升 ${ml} 毫升 + ${add} 毫升 = ？`, ans,
        strOpts(ans, [wrong(L + 1, (ml + add) % 1000), wrong(L, (ml + add) % 1000), wrong(L + 1, ((ml + add) % 1000 + 100) % 1000), wrong(L + 2, (ml + add) % 1000)], () => wrong(R(1, 6), R(1, 9) * 100)),
        `1 公升 = 1000 毫升<br>${ml} + ${add} = ${ml + add} 毫升` + (ml + add >= 1000 ? `，滿 1000 毫升就是 1 公升` : '') + `<br>答案是 <b>${ans}</b>`);
    }
    const sq = Math.random() < 0.5;
    const l = R(3, 12), w = sq ? l : R(2, l - 1), p = 2 * (l + w);
    return Q(`這個${sq ? '正方形' : '長方形'}的周長是幾公分？`, p, numOpts(p, [l * w, l + w, p + 2, p - 2], 1),
      sq ? `正方形 4 條邊一樣長：${l} × 4 = <b>${p}</b> 公分` : `長方形周長 = (長 + 寬) × 2<br>(${l} + ${w}) × 2 = ${l + w} × 2 = <b>${p}</b> 公分`,
      rectSVG(l, w, sq));
  }

  // ---------- 8. 大數火山（四年級） ----------
  function genBig(d) {
    if (d === 1) {
      const n = R(10000, 99999), s = String(n);
      if (Math.random() < 0.5) {
        const pos = R(0, 4), digit = +s[4 - pos];
        const opts = new Set([digit]); s.split('').forEach((c) => opts.size < 4 && opts.add(+c));
        while (opts.size < 4) opts.add(R(0, 9));
        return Q(`${N(n)} 的${PLACE[pos]}數字是多少？`, digit, shuffle([...opts]).map(String),
          `從右邊數過來：${s.split('').reverse().map((c, i) => `${PLACE[i]} ${c}`).join('、')}<br>${PLACE[pos]}是 <b>${digit}</b>`);
      }
      const ds = s.split('').map(Number);
      const words = ['萬', '千', '百', '十', '一'];
      const text = ds.map((x, i) => (x ? `${x} 個${words[i]}` : '')).filter(Boolean).join('、');
      const swapped = +(s[1] + s[0] + s.slice(2));
      return Q(`${text}，合起來是多少？`, N(n), numOpts(n, [swapped, n + 1000, n - 1000, n + 10000 < 100000 ? n + 10000 : n - 10000], 10000),
        `萬位寫 ${ds[0]}、千位寫 ${ds[1]}、百位寫 ${ds[2]}、十位寫 ${ds[3]}、個位寫 ${ds[4]}（沒有的位數寫 0）<br>答案是 <b>${N(n)}</b>`);
    }
    if (d === 2) {
      const a = Math.random() < 0.5 ? R(12, 98) : R(102, 499), b = R(2, 9), p = a * b;
      const hi = a - a % 10, lo = a % 10;
      return Q(`${a} × ${b} = ？`, p, numOpts(p, [p + b, p - b, hi * b + lo, p + 10, p - 10], 1),
        `把 ${a} 拆開：${hi} 和 ${lo}<br>${hi} × ${b} = ${hi * b}<br>${lo} × ${b} = ${lo * b}<br>${hi * b} + ${lo * b} = <b>${p}</b>`);
    }
    if (Math.random() < 0.5) {
      const a = R(12, 39), b = R(11, 29), p = a * b, bt = b - b % 10, bo = b % 10;
      return Q(`${a} × ${b} = ？`, p, numOpts(p, [a * bt + bo, p + a, p - a, p + 10, p - 10], 1),
        `把 ${b} 拆成 ${bt} 和 ${bo}：<br>${a} × ${bt} = ${a * bt}<br>${a} × ${bo} = ${a * bo}<br>${a * bt} + ${a * bo} = <b>${p}</b>`);
    }
    const b = R(2, 9), q = R(21, 99), a = b * q;
    return Q(`${a} ÷ ${b} = ？`, q, numOpts(q, [q + 1, q - 1, q + 10, q - 10], 1),
      `用直式從百位開始一位一位除。<br>驗算：${b} × ${q} = ${a}，所以答案是 <b>${q}</b>`);
  }

  // ---------- 9. 小數星空（四年級） ----------
  const D1 = (t) => (t % 10 === 0 ? String(t / 10) : (t / 10).toFixed(1));
  const D2 = (h) => (h % 100 === 0 ? String(h / 100) : h % 10 === 0 ? (h / 100).toFixed(1) : (h / 100).toFixed(2));
  function genDec(d) {
    if (d === 1) {
      if (Math.random() < 0.5) {
        const n = R(1, 9), ans = D1(n);
        return Q('把一條長條平分成 10 格，塗色的部分用小數表示是多少？', ans, strOpts(ans, [String(n), D2(n), D1(10 - n), D1(n + 1)], null),
          `每一格是 0.1，塗了 ${n} 格，就是 ${n} 個 0.1 = <b>${ans}</b>`, barSVG(10, [n], ['#9775fa']));
      }
      const n = R(11, 39), ans = D1(n);
      return Q(`${n} 個 0.1 是多少？`, ans, strOpts(ans, [String(n), D2(n), D1(n + 10), D1(n - 1)], null),
        `10 個 0.1 = 1<br>${n} 個 0.1 = ${Math.floor(n / 10)} 個 1 和 ${n % 10} 個 0.1 = <b>${ans}</b>`);
    }
    if (d === 2) {
      let a, b;
      if (Math.random() < 0.5) { a = R(1, 9) * 10; b = a - R(1, 9); } // 0.5 和 0.45
      else { a = R(101, 399); b = a + pick([-30, -9, 9, 30, 21]); }
      if (a === b || b <= 0) b = a + 1;
      const big = Math.max(a, b);
      return Q(`${D2(a)} 和 ${D2(b)}，哪一個比較大？`, D2(big), shuffle([D2(a), D2(b)]),
        `先比整數，再比小數第一位（十分位），再比第二位（百分位）。<br>把位數補齊：${(a / 100).toFixed(2)} 和 ${(b / 100).toFixed(2)}，所以 <b>${D2(big)}</b> 比較大`);
    }
    const plus = Math.random() < 0.5;
    let a = R(5, 89), b = R(5, 59);
    if (!plus && b > a) [a, b] = [b, a];
    if (!plus && a === b) a += 3;
    const ans = plus ? a + b : a - b;
    return Q(`${D1(a)} ${plus ? '+' : '−'} ${D1(b)} = ？`, D1(ans), strOpts(D1(ans), [D1(ans + 10), D1(ans - 10), D1(ans + 1), D1(ans - 1)].filter((x) => +x >= 0), null),
      `小數點要對齊，就像整數一樣算：<br>${a} 個 0.1 ${plus ? '+' : '−'} ${b} 個 0.1 = ${ans} 個 0.1 = <b>${D1(ans)}</b>`);
  }

  const REGIONS = [
    { id: 'add', name: '加減草原', grade: 2, icon: '🌼', color: '#43a047', levels: ['兩位數加減', '進位和退位', '三位數加減'], boss: { name: '糊塗草怪', icon: '🌵' }, treasure: '🥕', gen: genAdd },
    { id: 'mul', name: '乘法森林', grade: 2, icon: '🌳', color: '#2e7d32', levels: ['2、3、4、5 的乘法', '6、7、8、9 的乘法', '乘法應用題'], boss: { name: '倍倍樹精', icon: '🦉' }, treasure: '🍄', gen: genMul },
    { id: 'time', name: '時鐘山谷', grade: 2, icon: '⏰', color: '#ef6c00', levels: ['整點和半點', '幾時幾分', '經過多久'], boss: { name: '時間小偷', icon: '🦝' }, treasure: '⌛', gen: genTime },
    { id: 'money', name: '錢幣市集', grade: 2, icon: '🪙', color: '#f9a825', levels: ['數數錢幣', '買東西找錢', '購物大挑戰'], boss: { name: '貪吃招財貓', icon: '😼' }, treasure: '💰', gen: genMoney },
    { id: 'div', name: '除法洞窟', grade: 3, icon: '🪨', color: '#6d4c41', levels: ['平分', '有餘數的除法', '除法應用題'], boss: { name: '分分石怪', icon: '🗿' }, treasure: '💎', gen: genDiv },
    { id: 'frac', name: '分數海灣', grade: 3, icon: '🐚', color: '#0288d1', levels: ['認識分數', '分數比大小', '分數加減'], boss: { name: '切切章魚', icon: '🐙' }, treasure: '🐚', gen: genFrac },
    { id: 'measure', name: '測量高原', grade: 3, icon: '📏', color: '#00897b', levels: ['公尺和公分', '公斤和公克', '容量和周長'], boss: { name: '量尺巨人', icon: '🦒' }, treasure: '🧭', gen: genMeasure },
    { id: 'big', name: '大數火山', grade: 4, icon: '🌋', color: '#d84315', levels: ['認識萬位', '多位數乘法', '兩位數乘法和除法'], boss: { name: '烈焰數龍', icon: '🐉' }, treasure: '🔥', gen: genBig },
    { id: 'dec', name: '小數星空', grade: 4, icon: '🌙', color: '#5e35b1', levels: ['認識小數', '小數比大小', '小數加減'], boss: { name: '星點外星人', icon: '👾' }, treasure: '⭐', gen: genDec },
  ];

  const api = { REGIONS, R, pick, shuffle };
  g.MQ = api;
  if (typeof module !== 'undefined') module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
