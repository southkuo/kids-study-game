#!/usr/bin/env node
/* 每日內容品質檢查（出題老師、教學老師交件前一定要跑）
   用法：node tools/check_daily.js            檢查全部日期
        node tools/check_daily.js 2026-11-09  只檢查某一天
   全部通過會印出「✅ 全部通過」並回傳 0；有問題會列出每一項錯誤並回傳 1。 */
'use strict';
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const errors = [];
const warns = [];
const err = (where, msg) => errors.push(`❌ ${where}：${msg}`);
const warn = (where, msg) => warns.push(`⚠️  ${where}：${msg}`);
const isStr = (x) => typeof x === 'string' && x.trim().length > 0;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const SUBJECTS = ['chinese', 'english', 'math', 'science'];

function unsafeHtml(html) {
  // 題目裡的 visual 只能是簡單的 HTML／SVG，不能有程式或外部資源
  return /<script|\son\w+\s*=|javascript:|<iframe|<link|(src|href)\s*=\s*["']?https?:/i.test(html);
}

function checkQuestions(where, hw) {
  if (!isStr(hw.title)) err(where, '缺少 title');
  if (hw.battle != null) {
    const b = hw.battle, THEMES = ['space', 'garden', 'underworld', 'jungle', 'deepsea'], ART = ['mantis-king', 'skeleton-general', 'steel-tiger', 'big-shark'];
    if (b.theme != null && !THEMES.includes(b.theme)) err(where, `battle.theme 只能是 ${THEMES.join('／')}（或不寫）`);
    if (b.foe != null) {
      if (!isStr(b.foe.name)) err(where, 'battle.foe 需要 name');
      if (!isStr(b.foe.icon)) err(where, 'battle.foe 需要 icon（一個 emoji，或 svg:圖名）');
      else if (b.foe.icon.startsWith('svg:') && !ART.includes(b.foe.icon.slice(4))) err(where, `battle.foe.icon 的內建圖只有：${ART.map((x) => 'svg:' + x).join('、')}`);
      else if (!b.foe.icon.startsWith('svg:') && b.foe.icon.length > 8) err(where, 'battle.foe.icon 應該是一個 emoji');
    }
    ['moves', 'foeMoves'].forEach((k) => { if (b[k] != null && (!Array.isArray(b[k]) || !b[k].length || b[k].some((m) => !Array.isArray(m) || !isStr(m[0]) || !isStr(m[1])))) err(where, `battle.${k} 要是 [["招式名稱", "emoji"], …]`); });
    if (b.fx != null && b.fx !== 'punch') err(where, 'battle.fx 只能是 "punch"（拳頭直直打出去）或不寫');
    if (b.special != null && (!Array.isArray(b.special) || !isStr(b.special[0]) || !isStr(b.special[1]))) err(where, 'battle.special 要是 ["必殺技名稱", "emoji"]');
  }
  if (!Array.isArray(hw.questions)) return err(where, 'questions 必須是陣列');
  if (hw.questions.length < 5 || hw.questions.length > 15) err(where, `題數 ${hw.questions.length}，應該在 5～15 題之間`);
  const seen = new Set();
  hw.questions.forEach((q, i) => {
    const w = `${where} 第 ${i + 1} 題`;
    if (!isStr(q.text)) err(w, '缺少題目 text');
    if (seen.has(q.text)) err(w, '題目重複');
    seen.add(q.text);
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 4) return err(w, '選項 options 要有 2～4 個');
    const opts = q.options.map(String);
    if (opts.some((o) => !o.trim())) err(w, '有空白選項');
    if (new Set(opts).size !== opts.length) err(w, `選項重複：${opts.join(' / ')}`);
    if (!opts.includes(String(q.answer))) err(w, `答案「${q.answer}」不在選項裡：${opts.join(' / ')}`);
    if (!isStr(q.explain)) err(w, '缺少解說 explain（答錯時要給小朋友看）');
    if (q.visual != null && typeof q.visual !== 'string') err(w, 'visual 必須是字串');
    if (q.visual && unsafeHtml(q.visual)) err(w, 'visual 不能有 script、事件屬性或外部網址');
    if (q.lang != null && q.lang !== 'en') err(w, 'lang 只能是 "en" 或不寫');
  });
}

function checkEnglish(where, dir, hw) {
  if (!Array.isArray(hw.items)) return err(where, 'items 必須是陣列');
  // 家長指定：2026-11-10 起每天英文口說固定 5 題（之前的日子不受影響）
  if (path.basename(dir) >= '2026-11-10') { if (hw.items.length !== 5) err(where, `題數 ${hw.items.length}，英文口說作業固定 5 題`); }
  else if (hw.items.length < 5 || hw.items.length > 15) err(where, `題數 ${hw.items.length}，應該在 5～15 題之間`);
  hw.items.forEach((it, i) => {
    const w = `${where} Q${i + 1}`;
    if (!isStr(it.q)) err(w, '缺少英文問題 q');
    if (!isStr(it.zh)) err(w, '缺少中文意思 zh');
    if (!Array.isArray(it.lines) || !it.lines.length) return err(w, 'lines 至少要有一句示範答案');
    it.lines.forEach((line, li) => {
      const lw = `${w} 第 ${li + 1} 句`;
      if (line.options) {
        if (!Array.isArray(line.options) || line.options.length < 2) return err(lw, 'options 至少要 2 個');
        line.options.forEach((o, oi) => { if (!isStr(o.pick) || !isStr(o.en) || !isStr(o.zh)) err(`${lw} 選項 ${oi + 1}`, '需要 pick、en、zh'); });
      } else if (!isStr(line.en) || !isStr(line.zh)) err(lw, '需要 en 和 zh');
    });
  });
  if (hw.questionAudio) {
    const rel = hw.questionAudio.replace(/\/?$/, '/');
    if (!rel.startsWith(`daily/${path.basename(dir)}/`)) err(where, `questionAudio 應該是 daily/${path.basename(dir)}/audio/`);
    hw.items.forEach((_, i) => { if (!fs.existsSync(path.join(ROOT, rel, `q${i + 1}.m4a`))) err(where, `找不到題目語音 ${rel}q${i + 1}.m4a`); });
  } else warn(where, '沒有 questionAudio（合併錄音時只能用爸媽錄的題目）');
}

function checkLesson(where, dir, ls) {
  if (!SUBJECTS.includes(ls.subject)) err(where, `subject 要是 ${SUBJECTS.join('／')}`);
  if (!isStr(ls.title)) err(where, '缺少 title');
  if (!isStr(ls.file)) return err(where, '缺少 file');
  const expect = `daily/${path.basename(dir)}/lessons/`;
  if (!ls.file.startsWith(expect)) err(where, `file 要放在 ${expect}`);
  const fp = path.join(ROOT, ls.file);
  if (!fs.existsSync(fp)) return err(where, `找不到 ${ls.file}`);
  const html = fs.readFileSync(fp, 'utf8');
  if (!/^<!doctype html>/i.test(html.trim())) err(where, '開頭要是 <!doctype html>');
  if (!/<meta[^>]+name=["']viewport/i.test(html)) err(where, '缺少 viewport meta（iPad 才會正常縮放）');
  if (!/<title>[^<]+<\/title>/i.test(html)) err(where, '缺少 <title>');
  if (/(src|href)\s*=\s*["']?https?:/i.test(html) || /@import|url\(\s*["']?https?:/i.test(html)) err(where, '不能載入外部網址（字型、圖片、程式都要寫在檔案裡）');
  if (Buffer.byteLength(html) > 300 * 1024) err(where, '檔案超過 300KB');
  if (!/<script/i.test(html)) warn(where, '沒有任何互動或動畫程式');
  if (!/speechSynthesis/.test(html)) warn(where, '沒有 🔊 朗讀功能');
}

function checkDay(date) {
  const dir = path.join(ROOT, 'daily', date);
  const where = `daily/${date}`;
  const fp = path.join(dir, 'day.json');
  if (!fs.existsSync(fp)) return err(where, '找不到 day.json');
  let day;
  try { day = JSON.parse(fs.readFileSync(fp, 'utf8')); } catch (e) { return err(where, `day.json 不是正確的 JSON：${e.message}`); }
  if (day.date !== date) err(where, `day.json 的 date（${day.date}）和資料夾名稱不一樣`);
  const hw = day.homework || {};
  if (hw.english) checkEnglish(`${where} 英文作業`, dir, hw.english);
  if (hw.chinese) checkQuestions(`${where} 國文作業`, hw.chinese);
  if (hw.math) checkQuestions(`${where} 數學作業`, hw.math);
  Object.keys(hw).forEach((k) => { if (!['english', 'chinese', 'math'].includes(k)) err(where, `不認得的作業科目「${k}」`); });
  if (!Array.isArray(day.lessons || [])) err(where, 'lessons 必須是陣列');
  const subs = new Set();
  (day.lessons || []).forEach((ls, i) => {
    checkLesson(`${where} 教材 ${i + 1}（${ls.subject}）`, dir, ls);
    if (subs.has(ls.subject)) err(where, `教材科目「${ls.subject}」重複`);
    subs.add(ls.subject);
  });
  if (!Object.keys(hw).length && !(day.lessons || []).length) warn(where, '這一天沒有作業也沒有教材');
}

const idxPath = path.join(ROOT, 'daily', 'index.json');
let idx = { days: [] };
try { idx = JSON.parse(fs.readFileSync(idxPath, 'utf8')); } catch (e) { err('daily/index.json', `讀不到或不是正確的 JSON：${e.message}`); }
const days = Array.isArray(idx.days) ? idx.days : (err('daily/index.json', 'days 必須是陣列'), []);
days.forEach((d) => { if (!DATE_RE.test(d)) err('daily/index.json', `日期格式錯誤：${d}`); });
if (new Set(days).size !== days.length) err('daily/index.json', '日期重複');
fs.readdirSync(path.join(ROOT, 'daily')).filter((d) => DATE_RE.test(d)).forEach((d) => { if (!days.includes(d)) err('daily/index.json', `資料夾 ${d} 沒有列在 days 裡（遊戲會看不到）`); });

const only = process.argv[2];
(only ? [only] : days).forEach(checkDay);

warns.forEach((w) => console.log(w));
if (errors.length) {
  errors.forEach((e) => console.log(e));
  console.log(`\n共 ${errors.length} 個錯誤，請修正後再跑一次。`);
  process.exit(1);
}
console.log(`✅ 全部通過（檢查了 ${only ? 1 : days.length} 天）`);
