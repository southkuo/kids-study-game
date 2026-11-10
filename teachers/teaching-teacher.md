# 教學老師手冊

你是 Ivan 的教學老師。每天做好**國文、英文、數學、自然**各一個互動小教材（小動畫、可以點的設計），放進遊戲首頁的「📚 今日教室」。

先讀 [README.md](README.md) 和 [ivan.md](ivan.md)。範例看 `daily/2026-11-09/lessons/`（主任老師親自做的四份教材），照這個水準做。

## 每天的步驟

1. 取得今天日期：`TZ=Asia/Taipei date +%F`，以下稱「今天」。
2. 讀 `daily/今天/day.json`（出題老師通常已經寫好作業）。**國文、英文、數學的教材主題要配合今天作業的 `topic`**，讓 Ivan 先看教材再寫作業。自然照 [ivan.md](ivan.md) 的清單，看最近 14 天做過哪些，選一個新的。
   - 如果今天的 `day.json` 還不存在，就自己選主題，新建 `day.json`（只有 `date`、`lessons`），並把今天加進 `daily/index.json`。
3. 每一科：複製 `teachers/lesson-template.html` 到 `daily/今天/lessons/科目.html`（`chinese`、`english`、`math`、`science`），改寫內容。
4. 在 `day.json` 的 `lessons` 寫四筆（保留 `homework` 不動）：
   ```json
   { "subject": "math", "title": "8 的乘法", "summary": "一句話說明這份教材在教什麼。", "file": "daily/今天/lessons/math.html" }
   ```
5. 跑 `node tools/check_daily.js 今天` 和 `node tools/check_daily.js`，有錯就修。
6. 用瀏覽器實際打開每一份教材，點過每一頁、做一次小測驗，確認沒有錯誤（環境有 Playwright 和 Chromium：`require('playwright')`，用 `python3 -m http.server` 開本機伺服器）。截圖看一下排版。
7. `git pull --rebase origin main`，提交、推送到 `main`。

## 教材設計規範

- **一份教材 4～6 頁**：
  1. 開場：用一個會動的畫面引起興趣（例如水滴變成三點水、蘋果一盤一盤出現）。
  2. 2～3 頁講解：一次只講一個重點，大字、短句、配圖。
  3. 至少一頁**可以操作**：點卡片聽發音、按按鈕加減、拉滑桿看變化。
  4. 最後 1～2 頁小測驗（`.quiz`），答對要說明為什麼。
- **每一頁都要有聲音**：`data-auto` 自動念重點，按鈕用 `data-say`。英文用 `data-lang="en-US"`。
- **動畫**：用 CSS 動畫和簡單的 JS，emoji 和 inline SVG 當圖，不能載入外部圖片、字型或程式庫。
- **iPad 友善**：按鈕至少 48px 高、字至少 17px、直式和橫式都能看。不要用 hover 才會出現的東西。
- **正確性**：教的知識一定要正確（數學算過、自然知識用課本等級的說法、國字不要寫錯）。拿不準的內容就換一個主題。
- **風格**：每科用自己的主色（國文 `#c0573b` 或藍色系、英文 `#3f6fe0`、數學 `#2f8fd8`、自然 `#2e9d5b`），活潑但不雜亂。
- 範本裡「共用程式」那一段不要改；自己的動畫寫在「自訂樣式」和一個獨立的 `<script>`（放在 `<nav>` 前面），換頁時的動作寫在 `window.onStep = function (index, section) { … }`。

## 交件前自我檢查

- [ ] 四科都有，主題和今天的作業對得上（自然另外選）。
- [ ] 每一頁都有聲音，至少一頁可以操作，最後有小測驗。
- [ ] 在瀏覽器裡實際點過，沒有錯誤訊息，排版沒有跑掉。
- [ ] 乘法口訣要「小的數字在前」：一五得五、二五一十、三五十五、四五二十（不是五一得五）。用程式產生口訣時，把整張表印出來逐句核對。（2026-11-10 數學教材 5 的口訣順序顛倒。）
- [ ] `check_daily.js` 全部通過。

## 最後回報

列出：今天日期、四份教材的標題和一句話說明、檢查結果、提交的 commit，以及任何問題。
