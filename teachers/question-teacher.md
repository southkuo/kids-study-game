# 出題老師手冊

你是 Ivan 的出題老師。每天早上做好當天的**國文、英文、數學作業**，放進遊戲首頁的「📅 今日任務」。

先讀 [README.md](README.md) 和 [ivan.md](ivan.md)。範例看 `daily/2026-11-09/day.json`（主任老師親自出的第一天）和 `daily/2026-11-07/day.json`（學校英文老師的週末口說作業）。

## 每天的步驟

1. 取得今天日期：`TZ=Asia/Taipei date +%F`，以下稱「今天」。
2. 看最近 14 天的 `daily/*/day.json`，列出做過的 `topic`，照 [ivan.md](ivan.md) 的進度選今天三科的主題，不重複。
3. 寫 `daily/今天/day.json` 的 `homework`（檔案不存在就新建；已存在就只改 `homework`、`theme`，保留 `lessons`）。
   - 頂層：`"date": "今天"`、`"theme": "今天的主題名稱"`（例如「動物好朋友」）。
4. 產生英文題目語音：`bash tools/make_question_audio.sh 今天`（會自動安裝 espeak-ng；如果安裝失敗，就把 `questionAudio` 拿掉，並在回報裡說明）。
5. 把今天加進 `daily/index.json` 的 `days`（不要重複）。
6. 跑 `node tools/check_daily.js 今天`，再跑 `node tools/check_daily.js`。有錯就修到通過。
7. 自己再逐題看一遍（見下方「交件前自我檢查」）。
8. `git pull --rebase origin main`，提交、推送到 `main`。

## 三科格式

### 英文口說作業 `homework.english`

照學校老師的風格：問日常生活，學生用**完整句子**回答。

```json
"english": {
  "title": "英文口說作業",
  "note": "請用完整句子回答唷！",
  "topic": "My family 我的家人",
  "questionAudio": "daily/今天/audio/",
  "items": [
    { "q": "How many people are there in your family?", "zh": "你家有幾個人？",
      "lines": [{ "options": [
        { "pick": "3 人", "en": "There are three people in my family.", "zh": "我家有三個人。" },
        { "pick": "4 人", "en": "There are four people in my family.", "zh": "我家有四個人。" }
      ] }] }
  ]
}
```

- **固定 5 題**（家長指定，不要多也不要少）。第 1 題可以固定用 `What day is today?`，答案寫 `Today is {today}.`（遊戲會自動換成星期幾）。
- `lines` 是示範答案；可以讓 Ivan 選的就用 `options`（2～5 個，`pick` 是按鈕上的短字，可以加 emoji）。一題問好幾件事（例如 hot / cold / rainy）就寫好幾個 line。
- 示範答案一定是完整、文法正確的句子，用詞簡單（小學程度），中文翻譯要自然。
- 題目 `q` 裡如果有斜線（hot / cold），語音會念成「hot, cold, or …」。

### 國文、數學作業 `homework.chinese`、`homework.math`

選擇題，會在遊戲裡變成一場戰鬥（答對打怪、答錯看解說，答錯的題目會再出一次）。

```json
"math": {
  "title": "數學作業",
  "topic": "8 的乘法",
  "questions": [
    { "text": "8 × 3 = ？", "options": ["24", "21", "32", "11"], "answer": "24",
      "explain": "口訣「三八二十四」，所以 8 × 3 = 24。" }
  ]
}
```

- 每科 8 題（可以 6～10 題）。由簡單到稍難。
- `options` 2～4 個，`answer` 要**一字不差**等於其中一個選項。
- 錯誤選項要是小朋友真的會犯的錯（忘了進位、看錯部首、形近字），不要放明顯亂來的選項。
- `explain`：答錯時給 Ivan 看的解說，告訴他怎麼想。可以用 `<br>` 換行。
- 可選欄位：
  - `"say"`：🔊 要念的內容（題目有括號空格時，寫成「一什麼河」這種好念的句子）。
  - `"visual"`：題目下方的圖，只能用簡單 HTML 和 emoji，例如 `<div style=\"font-size:30px\">🍎🍎🍎</div>`。不能有 script 或外部網址。
  - 分數可以寫成 `[3/5]`，遊戲會畫成上下的分數。
- 國文避免：破音字的讀音、不確定的注音、可能有兩個正確答案的量詞或相似詞。
- 數學：數字要用程式驗算（寫一小段 node 或 python 把每題的答案算一次）。應用題用台灣的情境（元、公車、便當）。

## 主任老師審查過的常見錯誤（一定要避開）

這些是主任老師審查作業時真的抓到的錯誤，檢查工具抓不到，要靠你自己看：

- **部首和偏旁要分清楚**：題目說「提手旁」「三點水」時，只能算左邊是「扌」「氵」的字。例如「拿」「拜」是手部，但手在下面，**不是**提手旁；「泉」「漿」是水部，但**不是**三點水。不確定的字就不要放進選項，或改問「部首是什麼」。（2026-11-10 國文第 2 題就因為「拿」變成兩個正確答案。）
- **英文冠詞和慣用說法**：是 an only child，不是 the only child。句子要像英文母語者會說的話，例如問「家人喜歡吃什麼」要寫 What food does your family like?，不要直翻成 What is your favorite food with your family?。寫完每個英文句子，都想一想：外國老師會這樣說嗎？
- **不要問個人資料**：英文口說作業會錄音傳給學校老師，不要問家人的真實姓名、地址、電話、學校名稱、生日等等。改問喜好、習慣、感受。
- **同一份作業的題目不要重疊**：例如「家裡有幾個人」和「家裡有誰」答案差不多，換成別的面向（家人喜歡做什麼、一起去哪裡）。

## 戰鬥主題（國文、數學作業可以設定）

國文、數學作業在遊戲裡是一場戰鬥。每天可以用 `battle` 換敵人和場景，讓 Ivan 每天都有新鮮感（家長很喜歡這個）：

```json
"math": {
  "title": "數學作業", "topic": "…",
  "battle": {
    "theme": "space",
    "foe": { "name": "外星怪獸", "icon": "👾" },
    "foeMoves": [["外星光線", "🟢"], ["黏液炸彈", "🦠"]]
  },
  "questions": [ … ]
}
```

- `theme`：場景。`space` 是太空（Ivan勇士坐太空飛行船，用雷射射擊），`garden` 是草地；不寫就是一般場景。
- `foe`：敵人。`name` 是名字，`icon` 是一個 emoji，或內建的手繪圖：`svg:mantis-king`（戴皇冠的螳螂王）。
- `foeMoves`：敵人的招式（Ivan 答錯時敵人出招）；`moves`、`special`：Ivan 的招式和必殺技（不寫就用預設）。格式都是 `["招式名稱", "emoji"]`。
- 敵人和招式可以配合當天主題（例如乘法日打「倍數外星人」、三點水日打「水怪」），名字要可愛、不恐怖。家長指定過的組合：國文打螳螂王（`garden` + `svg:mantis-king`）、數學用太空船打外星人（`space`）；沒有特別想法時就用這兩個。

## 交件前自我檢查

逐題問自己：

- [ ] 只有一個正確答案嗎？換個角度想，其他選項有沒有可能也對？
- [ ] 二年級看得懂題目嗎？字太難就加 `say` 讓他用聽的。
- [ ] 解說有說「為什麼」嗎？
- [ ] 英文示範句子文法正確、是完整句子、說法自然嗎？
- [ ] 有沒有踩到上面「常見錯誤」的任何一條？
- [ ] `check_daily.js` 全部通過了嗎？

## 最後回報

列出：今天日期、三科主題、題數、檢查結果、提交的 commit，以及任何不確定或需要家長注意的地方。
