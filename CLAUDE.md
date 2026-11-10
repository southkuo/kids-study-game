# 學習大冒險（給 Ivan 的學習遊戲）

純靜態網站（HTML／CSS／JS，沒有建置步驟），放在 GitHub Pages：https://southkuo.github.io/kids-study-game/

- 遊戲程式：`index.html`、`css/style.css`、`js/*.js`（`game.js` 是主程式，題庫在 `questions.js`、`chinese.js`、`english.js`）。
- 每日內容：`daily/`（作業和教材），格式和規則在 `teachers/`。
- 自動上工的 AI 老師：出題老師讀 `teachers/question-teacher.md`，教學老師讀 `teachers/teaching-teacher.md`，兩位都要先讀 `teachers/README.md` 和 `teachers/ivan.md`。
- 每日內容交件前必跑：`node tools/check_daily.js`。
- 英文題目語音：`bash tools/make_question_audio.sh 日期`。
- 本機測試：在專案根目錄跑 `python3 -m http.server 8765`，再用 Playwright 打開 `http://localhost:8765/`（`fetch` 在 `file://` 下不能用）。
- 所有給人看的文字用繁體中文、台灣用語；提交訊息用英文。
