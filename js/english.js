/* 英文題庫（小學 2～5 年級）：字母、單字、發音、句型、文法、閱讀
   say / lang='en'：按 🔊 用英文語音念 */
(function (g) {
  'use strict';
  const { R, pick, shuffle, strOpts, Q } = g.MQ;
  const others = (arr, not, n) => shuffle(arr.filter((x) => !not.includes(x))).slice(0, n);
  const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  const em = (e) => `<div class="bigemoji">${e}</div>`;

  // 單字（emoji、中文）
  const ANIMALS = [['cat', '🐱', '貓'], ['dog', '🐶', '狗'], ['pig', '🐷', '豬'], ['cow', '🐮', '牛'], ['duck', '🦆', '鴨子'], ['fish', '🐟', '魚'], ['bird', '🐦', '鳥'],
    ['bear', '🐻', '熊'], ['lion', '🦁', '獅子'], ['tiger', '🐯', '老虎'], ['monkey', '🐒', '猴子'], ['rabbit', '🐰', '兔子'], ['horse', '🐴', '馬'], ['frog', '🐸', '青蛙'],
    ['elephant', '🐘', '大象'], ['snake', '🐍', '蛇'], ['sheep', '🐑', '綿羊'], ['chicken', '🐔', '雞'], ['panda', '🐼', '熊貓'], ['zebra', '🦓', '斑馬']];
  const FOODS = [['apple', '🍎', '蘋果'], ['banana', '🍌', '香蕉'], ['grapes', '🍇', '葡萄'], ['lemon', '🍋', '檸檬'], ['peach', '🍑', '桃子'], ['cake', '🍰', '蛋糕'],
    ['egg', '🥚', '蛋'], ['milk', '🥛', '牛奶'], ['bread', '🍞', '麵包'], ['pizza', '🍕', '披薩'], ['candy', '🍬', '糖果'], ['rice', '🍚', '飯'], ['watermelon', '🍉', '西瓜'], ['carrot', '🥕', '紅蘿蔔']];
  const THINGS = [['book', '📖', '書'], ['bag', '🎒', '書包'], ['ball', '⚽', '球'], ['car', '🚗', '汽車'], ['bus', '🚌', '公車'], ['bike', '🚲', '腳踏車'], ['hat', '🎩', '帽子'],
    ['cup', '☕', '杯子'], ['clock', '⏰', '時鐘'], ['bed', '🛏️', '床'], ['kite', '🪁', '風箏'], ['box', '📦', '箱子'], ['key', '🔑', '鑰匙'], ['sun', '☀️', '太陽'],
    ['moon', '🌙', '月亮'], ['star', '⭐', '星星'], ['tree', '🌳', '樹'], ['flower', '🌸', '花'], ['house', '🏠', '房子'], ['boat', '⛵', '船'], ['train', '🚆', '火車'],
    ['umbrella', '☂️', '雨傘'], ['door', '🚪', '門'], ['pen', '🖊️', '筆']];
  const PICS = [...ANIMALS, ...FOODS, ...THINGS];
  const COLORS = [['red', '#e53935', '紅色'], ['blue', '#1e88e5', '藍色'], ['yellow', '#fdd835', '黃色'], ['green', '#43a047', '綠色'], ['orange', '#fb8c00', '橘色'],
    ['purple', '#8e24aa', '紫色'], ['pink', '#f48fb1', '粉紅色'], ['black', '#212121', '黑色'], ['white', '#ffffff', '白色'], ['brown', '#795548', '咖啡色']];
  const ONES = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const TENS = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
  const numWord = (n) => (n < 20 ? ONES[n] : n === 100 ? 'one hundred' : TENS[Math.floor(n / 10)] + (n % 10 ? '-' + ONES[n % 10] : ''));

  // ---------- 1. 字母海港 ----------
  function genLetters(d) {
    if (d === 1) {
      const L = pick(ABC), up = Math.random() < 0.5;
      const ans = up ? L : L.toLowerCase(), q = up ? L.toLowerCase() : L;
      const look = { b: 'd', d: 'b', p: 'q', q: 'p', m: 'n', n: 'm', u: 'n', i: 'j', j: 'i' };
      const near = [look[L.toLowerCase()], ABC[(ABC.indexOf(L) + 1) % 26].toLowerCase()].filter(Boolean).map((x) => (up ? x.toUpperCase() : x));
      return Q(`「${q}」的${up ? '大寫' : '小寫'}是哪一個？`, ans, strOpts(ans, near, () => (up ? pick(ABC) : pick(ABC).toLowerCase())),
        `大寫 ${L}、小寫 ${L.toLowerCase()}，是同一個字母。`, '', L, 'en');
    }
    if (d === 2) {
      const [w, e, zh] = pick(PICS), ans = w[0].toUpperCase();
      return Q('這個單字的第一個字母是什麼？', ans, strOpts(ans, [], () => pick(ABC)),
        `${e} ${zh}是 <b>${w}</b>，第一個字母是 <b>${ans}</b>。`, em(e) + `<div class="hint">${zh}</div>`, w, 'en');
    }
    if (Math.random() < 0.5) {
      const i = R(0, 24), ans = ABC[i + 1];
      return Q(`字母順序：「${ABC[i]}」的後面是哪一個字母？`, ans, strOpts(ans, [ABC[i + 2], ABC[Math.max(0, i - 1)]].filter(Boolean), () => pick(ABC)),
        `字母歌：…${ABC.slice(Math.max(0, i - 2), i + 3).join(' ')}…<br>${ABC[i]} 的後面是 <b>${ans}</b>`, '', ABC[i], 'en');
    }
    const i = R(1, 23), ans = ABC[i];
    return Q(`缺了哪一個字母？　${ABC[i - 1]}　□　${ABC[i + 1]}　${ABC[i + 2]}`, ans, strOpts(ans, [ABC[i + 3], ABC[i - 1]].filter((x) => x && x !== ans), () => pick(ABC)),
      `${ABC[i - 1]}、<b>${ans}</b>、${ABC[i + 1]}、${ABC[i + 2]}`, '', '', 'en');
  }

  // ---------- 2. 單字叢林 ----------
  function genWords(d) {
    if (d === 1) {
      const pool = Math.random() < 0.5 ? ANIMALS : FOODS, [w, e, zh] = pick(pool);
      return Q('這是什麼？選出正確的英文單字。', w, shuffle([w, ...others(pool.map((x) => x[0]), [w], 3)]),
        `${e} ${zh}的英文是 <b>${w}</b>。`, em(e), w, 'en');
    }
    if (d === 2) {
      if (Math.random() < 0.5) {
        const [w, hex, zh] = pick(COLORS);
        return Q('這是什麼顏色？', w, shuffle([w, ...others(COLORS.map((x) => x[0]), [w], 3)]),
          `${zh}的英文是 <b>${w}</b>。`, `<div class="swatch" style="background:${hex}"></div>`, w, 'en');
      }
      const n = R(1, 20), ans = numWord(n);
      const near = [numWord(n === 20 ? 19 : n + 1), numWord(Math.max(1, n - 1)), n < 10 ? ONES[n + 10] : n < 20 ? ONES[n - 10] || 'ten' : 'twelve'];
      return Q(`數字 ${n} 的英文是？`, ans, strOpts(ans, near, () => numWord(R(1, 20))),
        `${n} 是 <b>${ans}</b>。`, '', ans, 'en');
    }
    const [w, e, zh] = pick(PICS.filter((x) => x[0].length >= 3 && x[0].length <= 6));
    const i = R(0, w.length - 1), ans = w[i];
    const blank = [...w].map((c, k) => (k === i ? '_' : c)).join(' ');
    const vowels = 'aeiou', cons = 'bcdfghklmnprstw';
    const pool = vowels.includes(ans) ? vowels : cons;
    return Q(`${zh}：${blank}<br>空格要填哪個字母？`, ans, strOpts(ans, others([...pool], [ans], 3), () => pick([...pool])),
      `${e} ${zh}拼作 <b>${w}</b>：${[...w].join('-')}`, em(e), w, 'en');
  }

  // ---------- 3. 發音小島 ----------
  const FAM = { at: ['cat', 'hat', 'bat', 'rat', 'mat'], og: ['dog', 'log', 'frog', 'fog'], ig: ['pig', 'big', 'dig', 'wig'], un: ['sun', 'run', 'fun', 'bun'],
    ake: ['cake', 'lake', 'snake', 'make'], ee: ['tree', 'bee', 'see', 'three'], ar: ['car', 'star', 'jar', 'far'], ing: ['king', 'ring', 'sing', 'wing'],
    ook: ['book', 'look', 'cook', 'hook'], en: ['pen', 'ten', 'hen', 'men'], ox: ['box', 'fox'], ug: ['bug', 'rug', 'mug', 'hug'] };
  const CVC = [['cat', '🐱'], ['hat', '👒'], ['bag', '👜'], ['map', '🗺️'], ['bed', '🛏️'], ['pen', '🖊️'], ['ten', '🔟'], ['red', '🟥'], ['pig', '🐷'], ['six', '6️⃣'],
    ['dog', '🐶'], ['box', '📦'], ['fox', '🦊'], ['sun', '☀️'], ['bus', '🚌'], ['cup', '☕'], ['bug', '🐛'], ['net', '🥅'], ['web', '🕸️'], ['jam', '🍓']];
  function genPhonics(d) {
    if (d === 1) {
      const pool = PICS.filter((x) => x[0].length <= 6), [w] = pick(pool);
      const opts = [w, ...others(pool.map((x) => x[0]), [w], 3)];
      return Q('🎧 聽聽看，你聽到的是哪一個單字？', w, shuffle(opts),
        `你聽到的是 <b>${w}</b>。`, '<button class="listen" data-say="1">🔊 再聽一次</button>', w, 'en');
    }
    if (d === 2) {
      const keys = Object.keys(FAM), k = pick(keys), [w, ans] = shuffle(FAM[k]);
      const wrong = others(keys, [k], 3).map((x) => pick(FAM[x]));
      return Q(`哪一個單字和「${w}」押韻？`, ans, shuffle([ans, ...wrong]),
        `${w} 和 <b>${ans}</b> 的結尾都是「-${k}」，念起來很像，就是押韻。`, '', w, 'en');
    }
    const [w, e] = pick(CVC), v = w[1], blank = w[0] + ' _ ' + w[2];
    return Q(`${blank}<br>中間要填哪一個母音？`, v, shuffle([v, ...others([...'aeiou'], [v], 3)]),
      `${e} 是 <b>${w}</b>，中間的母音是 ${v}。`, em(e), w, 'en');
  }

  // ---------- 4. 句型小鎮 ----------
  const PHRASES = [['Good morning.', '早安'], ['Good night.', '晚安'], ['Thank you.', '謝謝你'], ['I\'m sorry.', '對不起'], ['Goodbye.', '再見'], ['Happy birthday!', '生日快樂'],
    ['Let\'s go!', '我們走吧'], ['Sit down, please.', '請坐下'], ['Stand up.', '起立'], ['Be quiet.', '安靜'], ['Open the door.', '打開門'], ['Wash your hands.', '洗手'],
    ['I\'m hungry.', '我肚子餓了'], ['I\'m tired.', '我累了'], ['Look!', '你看！'], ['Hurry up!', '快一點！'], ['Good job!', '做得好！'], ['Welcome!', '歡迎！']];
  const QA = [['How are you?', 'I\'m fine, thank you.'], ['What\'s your name?', 'My name is Amy.'], ['How old are you?', 'I\'m nine years old.'],
    ['What color is it?', 'It\'s red.'], ['What\'s this?', 'It\'s a book.'], ['Do you like apples?', 'Yes, I do.'], ['Can you swim?', 'Yes, I can.'],
    ['Where is the cat?', 'It\'s under the table.'], ['What time is it?', 'It\'s seven o\'clock.'], ['What day is today?', 'It\'s Monday.'],
    ['Who is she?', 'She is my mother.'], ['Is it a dog?', 'No, it isn\'t.'], ['Nice to meet you.', 'Nice to meet you, too.'],
    ['What\'s the weather like?', 'It\'s sunny.'], ['What are you doing?', 'I\'m reading a book.'], ['Thank you.', 'You\'re welcome.']];
  const BE = [['I', 'am'], ['You', 'are'], ['We', 'are'], ['They', 'are'], ['He', 'is'], ['She', 'is'], ['It', 'is'], ['Tom', 'is'], ['My mom', 'is'], ['Amy and I', 'are']];
  const BE_TAIL = { am: ['happy.', 'a student.', 'ten years old.', 'in the park.'], are: ['happy.', 'in the park.', 'good friends.', 'at home.'], is: ['happy.', 'in the park.', 'very cute.', 'at school.'] };
  function genSentence(d) {
    if (d === 1) {
      const [en, zh] = pick(PHRASES);
      return Q(`「${en}」是什麼意思？`, zh, shuffle([zh, ...others(PHRASES.map((x) => x[1]), [zh], 3)]), `${en} 的意思是 <b>${zh}</b>。`, '', en, 'en');
    }
    if (d === 2) {
      const [q, a] = pick(QA);
      return Q(`別人說：「${q}」<br>你要怎麼回答？`, a, shuffle([a, ...others(QA.map((x) => x[1]), [a], 3)]),
        `${q}<br>→ <b>${a}</b>`, '', q, 'en');
    }
    const [s, be] = pick(BE), tail = pick(BE_TAIL[be]);
    return Q(`${s} ___ ${tail}`, be, ['am', 'is', 'are'],
      `I 用 am；you、we、they 和兩個人以上用 are；he、she、it 和一個人用 is。<br>${s} <b>${be}</b> ${tail}`, '', `${s} ${be} ${tail}`, 'en');
  }

  // ---------- 5. 文法高塔（五年級） ----------
  const PLURAL = [['cat', 'cats'], ['dog', 'dogs'], ['apple', 'apples'], ['box', 'boxes'], ['bus', 'buses'], ['peach', 'peaches'], ['watch', 'watches'], ['fox', 'foxes'],
    ['dish', 'dishes'], ['baby', 'babies'], ['strawberry', 'strawberries'], ['man', 'men'], ['foot', 'feet'], ['tooth', 'teeth'], ['mouse', 'mice'], ['child', 'children'], ['sheep', 'sheep']];
  const AAN = ['apple', 'egg', 'orange', 'umbrella', 'ice cream', 'elephant', 'owl', 'hour', 'book', 'cat', 'banana', 'dog', 'pen', 'uniform', 'house'];
  const ING = [['run', 'running'], ['swim', 'swimming'], ['dance', 'dancing'], ['read', 'reading'], ['eat', 'eating'], ['sing', 'singing'], ['write', 'writing'], ['sit', 'sitting'], ['play', 'playing'], ['ride', 'riding']];
  const PAST = [['go', 'went', 'Yesterday I ___ to the zoo.'], ['eat', 'ate', 'Last night we ___ pizza.'], ['see', 'saw', 'I ___ a rainbow yesterday.'],
    ['play', 'played', 'They ___ basketball last Sunday.'], ['watch', 'watched', 'She ___ TV last night.'], ['buy', 'bought', 'Mom ___ a new bag yesterday.'],
    ['have', 'had', 'We ___ a party last week.'], ['make', 'made', 'He ___ a cake yesterday.'], ['swim', 'swam', 'I ___ in the sea last summer.'],
    ['drink', 'drank', 'The cat ___ some milk this morning.'], ['run', 'ran', 'Tom ___ to school yesterday.'], ['visit', 'visited', 'We ___ Grandma last weekend.']];
  const WH = [['___ is your birthday? — It\'s in May.', 'When'], ['___ is my pencil? — It\'s on the desk.', 'Where'], ['___ is that boy? — He is my brother.', 'Who'],
    ['___ do you go to school? — By bus.', 'How'], ['___ is this? — It\'s a ruler.', 'What'], ['___ apples do you have? — Five.', 'How many'],
    ['___ is the T-shirt? — It\'s 100 dollars.', 'How much'], ['___ are you sad? — Because I lost my dog.', 'Why'], ['___ book is this? — It\'s Amy\'s.', 'Whose'],
    ['___ animal do you like? — I like pandas.', 'What'], ['___ do you live? — I live in Taipei.', 'Where']];
  const WH_ALL = ['What', 'Where', 'When', 'Who', 'Why', 'How', 'Whose', 'How many', 'How much'];
  const WH_ZH = { What: '什麼', Where: '哪裡', When: '什麼時候', Who: '誰', Why: '為什麼', How: '怎麼、如何', Whose: '誰的', 'How many': '多少個（數量）', 'How much': '多少錢' };
  function genGrammar(d) {
    if (d === 1) {
      if (Math.random() < 0.5) {
        const [s, p] = pick(PLURAL), n = pick(['two', 'three', 'five', 'many']);
        const cands = [s + 's', s + 'es', s.replace(/y$/, 'ies'), s, p + 's'].filter((x) => x !== p);
        return Q(`${n} ___（${s}）`, p, strOpts(p, cands, null),
          `${s} 的複數是 <b>${p}</b>。` + (p === s + 's' ? '<br>大部分的名詞直接加 s。' : /(s|x|sh|ch)es$/.test(p) ? '<br>字尾是 s、x、sh、ch 要加 es。' : /ies$/.test(p) ? '<br>子音 + y 結尾，要把 y 改成 i 再加 es。' : '<br>這是不規則變化，要背起來喔！'),
          '', `${n} ${p}`, 'en');
      }
      const w = pick(AAN), ans = /^[aeiou]/.test(w) && w !== 'uniform' || w === 'hour' ? 'an' : 'a';
      const why = w === 'hour' ? 'hour 的 h 不發音，開頭是母音的音' : w === 'uniform' ? 'uniform 開頭念 /ju/，是子音的音' : ans === 'an' ? `${w} 開頭是母音的音` : `${w} 開頭是子音的音`;
      return Q(`___ ${w}`, ans, ['a', 'an'], `${why}，所以用 <b>${ans}</b>：${ans} ${w}`, '', `${ans} ${w}`, 'en');
    }
    if (d === 2) {
      if (Math.random() < 0.5) {
        const [b, ing] = pick(ING), who = pick(['The boy is', 'Look! My sister is', 'The dog is', 'We are']);
        const cands = [b + 'ing', b, b + 's', b.replace(/e$/, '') + 'ing', b + b.slice(-1) + 'ing'].filter((x) => x !== ing);
        return Q(`${who} ___ .（${b}）`, ing, strOpts(ing, cands, null),
          `現在進行式：be 動詞 + 動詞ing。<br>${b} → <b>${ing}</b>` + (ing === b + b.slice(-1) + 'ing' ? '（短母音結尾，重複最後一個字母）' : b.endsWith('e') ? '（去 e 加 ing）' : ''),
          '', `${who} ${ing}.`, 'en');
      }
      const [b, past, s] = pick(PAST);
      const cands = [b + 'ed', b, b + 'ing', b + 's', b.replace(/e$/, '') + 'ed'].filter((x) => x !== past);
      return Q(`${s}（${b}）`, past, strOpts(past, cands, null),
        `句子裡有 yesterday、last… 等過去的時間，要用過去式。<br>${b} → <b>${past}</b>` + (past === b + 'ed' ? '（規則變化，加 ed）' : '（不規則變化）'), '', s.replace('___', past), 'en');
    }
    const [s, ans] = pick(WH);
    return Q(s, ans, shuffle([ans, ...others(WH_ALL, [ans], 3)]),
      `<b>${ans}</b> 是「${WH_ZH[ans]}」的意思。<br>${s.replace('___', ans)}`, '', s.replace('___', ans), 'en');
  }

  // ---------- 6. 閱讀天空（五年級） ----------
  const VOCAB = [['doctor', '醫生'], ['teacher', '老師'], ['nurse', '護理師'], ['farmer', '農夫'], ['cook', '廚師'], ['police officer', '警察'], ['library', '圖書館'],
    ['hospital', '醫院'], ['park', '公園'], ['zoo', '動物園'], ['supermarket', '超市'], ['sunny', '晴朗的'], ['rainy', '下雨的'], ['cloudy', '多雲的'], ['windy', '風很大的'],
    ['Monday', '星期一'], ['Wednesday', '星期三'], ['Friday', '星期五'], ['Sunday', '星期日'], ['January', '一月'], ['March', '三月'], ['July', '七月'], ['December', '十二月'],
    ['breakfast', '早餐'], ['lunch', '午餐'], ['dinner', '晚餐'], ['kitchen', '廚房'], ['bathroom', '浴室'], ['bedroom', '臥室'], ['classroom', '教室']];
  const SENT = [['I like apples.', '我喜歡蘋果。'], ['She is my sister.', '她是我的姊妹。'], ['We go to school by bus.', '我們搭公車上學。'], ['It is cold today.', '今天很冷。'],
    ['My dog is under the bed.', '我的狗在床底下。'], ['He can play the piano.', '他會彈鋼琴。'], ['There are three birds in the tree.', '樹上有三隻鳥。'],
    ['I get up at seven every day.', '我每天七點起床。'], ['Don\'t run in the classroom.', '不要在教室裡跑。'], ['What do you want for lunch?', '你午餐想吃什麼？'],
    ['They are playing in the park.', '他們正在公園裡玩。'], ['I went to the beach yesterday.', '我昨天去了海邊。']];
  const READ = [
    { p: 'Hi, I\'m Tina. I am eleven years old. I have a little brother. His name is Ben. He likes cars. I like books.',
      q: [['How old is Tina?', 'eleven', ['ten', 'twelve', 'nine']], ['What does Ben like?', 'cars', ['books', 'dogs', 'cakes']], ['Who is Ben?', 'Tina\'s brother', ['Tina\'s father', 'Tina\'s friend', 'Tina\'s teacher']]] },
    { p: 'Today is Saturday. It is sunny. Mike and his dad go to the park. They fly a kite. Then they eat ice cream.',
      q: [['What day is it today?', 'Saturday', ['Sunday', 'Monday', 'Friday']], ['What do they eat?', 'ice cream', ['pizza', 'noodles', 'rice']], ['What is the weather like?', 'It is sunny.', ['It is rainy.', 'It is windy.', 'It is snowy.']]] },
    { p: 'Lucy has a cat. The cat is white and fat. It sleeps on the sofa every afternoon. At night, it plays with a ball.',
      q: [['Where does the cat sleep?', 'on the sofa', ['under the bed', 'in the box', 'on the desk']], ['What color is the cat?', 'white', ['black', 'brown', 'orange']], ['What does the cat do at night?', 'It plays with a ball.', ['It eats fish.', 'It sleeps.', 'It runs outside.']]] },
    { p: 'Ken gets up at seven. He brushes his teeth and eats breakfast. He goes to school by bus. School starts at eight.',
      q: [['How does Ken go to school?', 'by bus', ['by bike', 'on foot', 'by car']], ['When does school start?', 'at eight', ['at seven', 'at nine', 'at six']]] },
    { p: 'It is raining. Amy can\'t play outside. She stays home and draws a picture of a rainbow. Her mom says, "It\'s beautiful!"',
      q: [['Why can\'t Amy play outside?', 'Because it is raining.', ['Because she is sick.', 'Because it is hot.', 'Because she is tired.']], ['What does Amy draw?', 'a rainbow', ['a cat', 'a house', 'a tree']]] },
    { p: 'There are four people in my family: my father, my mother, my sister and me. My father is a doctor. My mother is a teacher.',
      q: [['What does the father do?', 'He is a doctor.', ['He is a teacher.', 'He is a cook.', 'He is a farmer.']], ['How many people are in the family?', 'four', ['three', 'five', 'six']]] },
  ];
  function genReading(d) {
    if (d === 1) {
      const [en, zh] = pick(VOCAB);
      return Q(`「${en}」是什麼意思？`, zh, shuffle([zh, ...others(VOCAB.map((x) => x[1]), [zh], 3)]), `${en} 的意思是 <b>${zh}</b>。`, '', en, 'en');
    }
    if (d === 2) {
      const [en, zh] = pick(SENT);
      if (Math.random() < 0.5) return Q(`「${en}」是什麼意思？`, zh, shuffle([zh, ...others(SENT.map((x) => x[1]), [zh], 3)]), `${en}<br>→ <b>${zh}</b>`, '', en, 'en');
      return Q(`「${zh}」的英文是哪一句？`, en, shuffle([en, ...others(SENT.map((x) => x[0]), [en], 3)]), `${zh}<br>→ <b>${en}</b>`, '', en, 'en');
    }
    const P = pick(READ), [q, ans, wrong] = pick(P.q);
    return Q(q, ans, shuffle([ans, ...wrong]), `文章裡有寫到答案：<b>${ans}</b>`, `<div class="passage en">${P.p}</div>`, P.p + ' ' + q, 'en');
  }

  const REGIONS = [
    { id: 'en-abc', name: '字母海港', grade: 2, icon: '⚓', color: '#1e88e5', levels: ['大寫和小寫', '開頭字母', '字母順序'], boss: { name: '字母海盜', icon: '🏴‍☠️' }, treasure: '🧭', gen: genLetters },
    { id: 'en-word', name: '單字叢林', grade: 3, icon: '🌴', color: '#2e7d32', levels: ['動物和食物', '顏色和數字', '拼字'], boss: { name: '吞字大猩猩', icon: '🦍' }, treasure: '🍌', gen: genWords },
    { id: 'en-phon', name: '發音小島', grade: 3, icon: '🎵', color: '#00acc1', levels: ['聽音選字', '押韻', '短母音'], boss: { name: '走音海妖', icon: '🧜' }, treasure: '🎺', gen: genPhonics },
    { id: 'en-sent', name: '句型小鎮', grade: 4, icon: '🏪', color: '#f4511e', levels: ['日常用語', '問答', 'am、is、are'], boss: { name: '答非所問鸚鵡', icon: '🦜' }, treasure: '🎤', gen: genSentence },
    { id: 'en-gram', name: '文法高塔', grade: 5, icon: '🗼', color: '#6d4c41', levels: ['複數和 a／an', '進行式和過去式', '疑問詞'], boss: { name: '文法石像鬼', icon: '🗿' }, treasure: '🔮', gen: genGrammar },
    { id: 'en-read', name: '閱讀天空', grade: 5, icon: '🎈', color: '#5e35b1', levels: ['生活單字', '句子翻譯', '短文閱讀'], boss: { name: '亂碼飛龍', icon: '🐲' }, treasure: '📚', gen: genReading },
  ];
  g.EN = { REGIONS };
})(window);
