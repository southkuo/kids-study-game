#!/usr/bin/env bash
# 產生英文作業的題目語音：daily/日期/audio/q1.m4a ～ qN.m4a
# 用法：bash tools/make_question_audio.sh 2026-11-09
# 會讀 daily/日期/day.json 裡 homework.english.items[].q，念成「Question N. 問題」。
# 需要 espeak-ng、mbrola-us2、ffmpeg；沒有的話會用 apt-get 安裝。
set -euo pipefail
DATE="${1:?請給日期，例如 2026-11-09}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DAY="$ROOT/daily/$DATE/day.json"
OUT="$ROOT/daily/$DATE/audio"
[ -f "$DAY" ] || { echo "找不到 $DAY"; exit 1; }

if ! command -v espeak-ng >/dev/null || [ ! -d /usr/share/mbrola/us2 ] || ! command -v ffmpeg >/dev/null; then
  echo "安裝 espeak-ng、mbrola-us2、ffmpeg…"
  (apt-get install -y -q espeak-ng mbrola mbrola-us2 ffmpeg >/dev/null 2>&1) || (apt-get update -q >/dev/null 2>&1 && apt-get install -y -q espeak-ng mbrola mbrola-us2 ffmpeg >/dev/null 2>&1)
fi

mkdir -p "$OUT"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
# 斜線（hot / cold / rainy）念成「hot, cold, or rainy」比較自然
node -e '
const d = JSON.parse(require("fs").readFileSync(process.argv[1], "utf8"));
const items = (d.homework && d.homework.english && d.homework.english.items) || [];
items.forEach((it, i) => {
  const parts = it.q.split(/\s*\/\s*/);
  const q = parts.length > 1 ? parts.slice(0, -1).join(", ") + ", or " + parts[parts.length - 1] : it.q;
  console.log(`Question ${i + 1}. ${q}`);
});' "$DAY" > "$TMP/qs.txt"

N=0
while IFS= read -r LINE; do
  N=$((N + 1))
  # </dev/null：避免 espeak-ng 偷讀下一行
  espeak-ng -v mb-us2 -s 135 -a 170 -w "$TMP/q$N.wav" "$LINE" </dev/null 2>/dev/null
  ffmpeg -nostdin -v error -y -i "$TMP/q$N.wav" -af "loudnorm=I=-18:TP=-2,aresample=22050" -ac 1 -c:a aac -b:a 64k "$OUT/q$N.m4a"
  printf 'q%s.m4a  %ss  %s\n' "$N" "$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$OUT/q$N.m4a")" "$LINE"
done < "$TMP/qs.txt"
echo "完成：$N 個題目語音放在 daily/$DATE/audio/"
