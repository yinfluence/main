#!/bin/bash
# auto-daily.sh 的自我监督机制测试：状态落盘 / 僵死锁 / 整理卡死 / 失败重试 / 收工判断。
#
# 全部在临时目录里跑：把 auto-daily.sh 截断到函数定义结束、WEB 指到临时目录，
# 所以不碰真实 logs/、不真去 B 站、不真唤起 claude、不动 git。
#
# 跑法: bash scripts/test-auto-daily.sh   （约 40 秒，卡死那项要等一轮 30 秒轮询）
set -uo pipefail
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SRC="$HERE/auto-daily.sh"
T="$(mktemp -d -t auto-daily-test)"
trap 'rm -rf "$T"' EXIT
mkdir -p "$T/logs" "$T/content/episodes" "$T/scripts"
FAILS=0
ok() { echo "PASS  $1"; }
no() { echo "FAIL  $1  <- ${2:-}"; FAILS=$((FAILS+1)); }
chk() { [[ "$2" == "$3" ]] && ok "$1" || no "$1" "期望 [$3] 实得 [$2]"; }

# 两种切法：lib 到函数定义结束（含 scan_with_retry），gate 用来测 source 时的闸门逻辑
sed -e "s|^WEB=.*|WEB=\"$T\"|" -e '/^if (( UTC_MIN >= WIN_START/,$d' "$SRC" > "$T/lib.sh"
# popup 会真的弹一个 macOS 对话框，而第 4 节演的就是「整理连续失败 3 次」。
# 2026-08-07 跑 test:auto 时它真弹了，用户以为线上出事。假警报会把真警报稀释掉，
# 比不弹更糟——popup 是 08-06 才加的，加的时候漏了这里。后定义的函数覆盖先定义的。
printf '%s\n' 'popup() { :; }' >> "$T/lib.sh"
# lib.sh 顶层直接调 backfill_links（回补必须赶在窗口循环之前），所以每一次 source
# 都会真的执行它。这里先给个「没得补」的假脚本，否则 python3 找不到文件就报错，
# 往 status.json 写一条失败记录，把第 1 节的 consecutive_failures 断言污染掉。
printf '%s\n' 'import sys' 'print("链接都齐了（假脚本）")' 'sys.exit(10)' > "$T/scripts/backfill-video-links.py"
# 判据统一是"有没有被放行"：闸门（锁、today_done）拦住就 exit 0，标记不会打印
gate() { ( source "$T/lib.sh" >/dev/null 2>&1; echo GOT_THROUGH ); }
ST="$T/logs/status.json"

echo "===== 1. 状态落盘（不弹窗，全靠 status.json）====="
( source "$T/lib.sh"
  notify "颖响力网页 ⚠️" "扫描失败 code=1" "Basso"
  notify "颖响力网页 ⚠️" "又失败一次" "Basso" ) >/dev/null 2>&1
chk "连败两次 consecutive_failures=2" "$(python3 -c "import json;print(json.load(open('$ST'))['consecutive_failures'])")" "2"
chk "level=error" "$(python3 -c "import json;print(json.load(open('$ST'))['level'])")" "error"
( source "$T/lib.sh"; notify "颖响力网页 ✅" "EP999 已上线" "Glass" ) >/dev/null 2>&1
chk "成功后连败归零" "$(python3 -c "import json;print(json.load(open('$ST'))['consecutive_failures'])")" "0"
chk "历史累计 3 条" "$(wc -l < "$T/logs/status-history.jsonl" | tr -d ' ')" "3"

echo
echo "===== 2. 僵死锁：进程没了或超龄要清掉，活着的不许抢 ====="
LK="$T/logs/.auto-daily.lock"
mkdir -p "$LK"; echo 99999 > "$LK/pid"; echo "$(( $(date +%s) - 100 ))" > "$LK/born"
chk "死进程的锁放行" "$(gate)" "GOT_THROUGH"
grep -q "清理僵死锁" "$T/logs/"auto-daily-*.log 2>/dev/null && ok "清锁写进日志" || no "清锁写进日志"
sleep 600 & LIVE=$!
mkdir -p "$LK"; echo "$LIVE" > "$LK/pid"; date +%s > "$LK/born"
chk "活进程持锁时挡住" "$(gate)" ""
chk "挡住时不动别人的锁" "$(cat "$LK/pid")" "$LIVE"
kill $LIVE 2>/dev/null; wait $LIVE 2>/dev/null
sleep 600 & LIVE2=$!
mkdir -p "$LK"; echo "$LIVE2" > "$LK/pid"; echo "$(( $(date +%s) - 99999 ))" > "$LK/born"
chk "超龄锁放行（否则一次僵死永久堵死）" "$(gate)" "GOT_THROUGH"
kill $LIVE2 2>/dev/null; wait $LIVE2 2>/dev/null; rm -rf "$LK"

echo
echo "===== 3. 整理卡死要被发现并杀掉（stall 压到 1 秒，等一轮 30 秒轮询）====="
RES=$( source "$T/lib.sh"
  AGENT_STALL_LIMIT=1
  sleep 300 & P=$!
  if watch_agent "$P"; then echo returned0; else echo killed; fi
  kill -0 "$P" 2>/dev/null && echo 进程还活着 || echo 进程已死 )
echo "$RES" | grep -q killed && ok "判定卡死并返回 1" || no "判定卡死" "$RES"
echo "$RES" | grep -q 进程已死 && ok "卡死进程被杀掉" || no "卡死进程被杀掉" "$RES"
python3 -c "
import json,sys;d=json.load(open('$ST'))
sys.exit(0 if d['level']=='error' and '卡死' in d['message'] else 1)" \
  && ok "卡死写进 status.json" || no "卡死写进 status.json"
RES2=$( source "$T/lib.sh"; sleep 2 & P=$!
  if watch_agent "$P"; then echo returned0; else echo killed; fi )
echo "$RES2" | grep -q returned0 && ok "正常结束的进程不被误杀" || no "正常结束的进程不被误杀" "$RES2"

echo
echo "===== 4. 整理失败要当场重试，不干等下一次 launchd ====="
OUT=$( source "$T/lib.sh" >/dev/null 2>&1
  RETRY_GAP=0; CALLS=0
  scan_once() { CALLS=$((CALLS+1)); return 20; }
  scan_with_retry >/dev/null 2>&1; echo "code=$? calls=$CALLS retries=$RETRIES" )
chk "一直失败：1+2 次后放弃，返回 20" "$OUT" "code=20 calls=3 retries=2"
OUT=$( source "$T/lib.sh" >/dev/null 2>&1
  RETRY_GAP=0; CALLS=0
  scan_once() { CALLS=$((CALLS+1)); [[ $CALLS -ge 2 ]] && return 0 || return 20; }
  scan_with_retry >/dev/null 2>&1; echo "code=$? calls=$CALLS" )
chk "重试一次成功就收手" "$OUT" "code=0 calls=2"
for pair in "10:无新期" "1:扫描出错"; do
  WANT="${pair%%:*}"; NAME="${pair#*:}"
  # 注意别用 $1 传：那在 scan_once 里指的是函数自己的参数（空的），return 空值会直接崩
  OUT=$( source "$T/lib.sh" >/dev/null 2>&1
    RETRY_GAP=0; CALLS=0; WANT="$WANT"
    scan_once() { CALLS=$((CALLS+1)); return "$WANT"; }
    scan_with_retry >/dev/null 2>&1; echo "code=$? calls=$CALLS" )
  chk "$NAME($WANT) 不触发重试" "$OUT" "code=$WANT calls=1"
done

echo
echo "===== 5. 收工判断不能被草稿骗到 ====="
TODAY=$(date -u +%Y-%m-%d)
mk() { python3 -c "
import json,sys;json.dump(json.loads(sys.argv[2]),open(sys.argv[1],'w'),ensure_ascii=False)" \
  "$T/content/episodes/EP999.json" "$1"; }
# 收工场景会走到 scan_lives 和 backfill_links，两个都给假脚本（返回 10=没事可做），
# 别真去 B 站也别真 build/ship
mkdir -p "$T/scripts"
printf '%s\n' 'import sys' 'print("无新场次（假扫描器）")' 'sys.exit(10)' > "$T/scripts/scan-new-lives.py"
printf '%s\n' 'import sys' 'print("链接都齐了（假脚本）")' 'sys.exit(10)' > "$T/scripts/backfill-video-links.py"
mk "{\"status\":\"curated\",\"summary\":\"真内容\",\"publishedAt\":\"${TODAY}T11:00:00.000Z\"}"
rm -f "$T/logs/"auto-daily-*.log
chk "今天的完成品 -> 收工不再扫节目" "$(gate)" ""
# 2026-08-01 漏掉一场直播就是因为这里以前是裸 exit 0：节目收工当天直播一次都扫不到
grep -q "扫描新直播" "$T/logs/"auto-daily-*.log 2>/dev/null \
  && ok "节目收工当天仍然扫直播" || no "节目收工当天仍然扫直播"
mk "{\"status\":\"draft\",\"summary\":\"待整理\",\"publishedAt\":\"${TODAY}T11:00:00.000Z\"}"
chk "草稿带今天时间 -> 仍放行重试" "$(gate)" "GOT_THROUGH"
mk "{\"status\":\"curated\",\"summary\":\"\",\"publishedAt\":\"${TODAY}T11:00:00.000Z\"}"
chk "summary 空 -> 仍放行重试" "$(gate)" "GOT_THROUGH"
mk "{\"status\":\"curated\",\"summary\":\"真内容\",\"publishedAt\":\"2020-01-01T11:00:00.000Z\"}"
chk "旧日期 -> 继续扫今天的" "$(gate)" "GOT_THROUGH"

echo
echo "===== 6. 视频链接回补（EP195 的死法：EP 号已在本地，另一个平台的链接没人补）====="
FAKE_BACKFILL="$T/scripts/backfill-video-links.py"
mkbf() { printf '%s\n' "$@" > "$FAKE_BACKFILL"; }

mkbf 'import sys' 'print("链接都齐了（假脚本）")' 'sys.exit(10)'
rm -f "$T/logs/"auto-daily-*.log
OUT=$( source "$T/lib.sh" >/dev/null 2>&1; backfill_links; echo "code=$?" )
chk "链接齐全时返回 0" "$OUT" "code=0"
# 齐全还去 build/commit/ship 的话，每天都会推一个空提交上线
grep -q "开始上线" "$T/logs/"auto-daily-*.log 2>/dev/null \
  && no "链接齐全不该触发上线" || ok "链接齐全不该触发上线"

# 回补是第三条线，它失败不能连累节目和直播（B 站 cookie 过期时就会走这条）
mkbf 'import sys' 'sys.stderr.write("boom\n")' 'sys.exit(1)'
rm -f "$T/logs/"auto-daily-*.log
OUT=$( source "$T/lib.sh" >/dev/null 2>&1; backfill_links; echo "code=$?" )
chk "回补出错仍返回 0（不拖垮另外两条线）" "$OUT" "code=0"
python3 -c "
import json,sys;d=json.load(open('$ST'))
sys.exit(0 if d['level']=='error' and '回补' in d['message'] else 1)" \
  && ok "回补失败写进 status.json" || no "回补失败写进 status.json"

# 补到了链接但工作区还有别人的半成品：ship 传的是工作区文件，这时候不许上线
mkbf 'import sys' 'print("已补 1 期的链接: EP999")' 'sys.exit(0)'
rm -f "$T/logs/"auto-daily-*.log
OUT=$( source "$T/lib.sh" >/dev/null 2>&1
  git() { [[ "$1" == "status" ]] && echo " M src/app.js"; return 0; }
  backfill_links; echo "code=$?" )
chk "工作区不干净时返回 0" "$OUT" "code=0"
grep -q "不自动上线" "$T/logs/"auto-daily-*.log 2>/dev/null \
  && ok "工作区不干净则不上线" || no "工作区不干净则不上线"

# 收工分支必须也回补——EP195 正是死在这里：B 站版 11:03 收录后 today_done 就为真，
# 当天剩下的触发点全走这条路，而 YouTube 版 11:31 才上线。这条断言在旧代码下必然失败。
mkbf 'import sys' 'print("链接都齐了（假脚本）")' 'sys.exit(10)'
mk "{\"status\":\"curated\",\"summary\":\"真内容\",\"publishedAt\":\"${TODAY}T11:00:00.000Z\"}"
rm -f "$T/logs/"auto-daily-*.log
gate >/dev/null 2>&1
grep -q "回补缺失的视频链接" "$T/logs/"auto-daily-*.log 2>/dev/null \
  && ok "节目收工当天仍然回补链接" || no "节目收工当天仍然回补链接"

# 非收工日：回补必须在进窗口循环之前就跑完。
# lib.sh 正好截断在窗口判断那一行，所以这条断言等价于「回补的调用点在窗口之前」。
# 放在循环之后等于没跑：这台机器睡着时 sleep 600 不推进，2026-08-07 实测
# 12:13 进窗口后卡到 13:28，75 分钟里循环之后的代码一行都没轮到。
mk "{\"status\":\"curated\",\"summary\":\"真内容\",\"publishedAt\":\"2020-01-01T11:00:00.000Z\"}"
rm -f "$T/logs/"auto-daily-*.log
gate >/dev/null 2>&1
grep -q "回补缺失的视频链接" "$T/logs/"auto-daily-*.log 2>/dev/null \
  && ok "非收工日也在进窗口前回补" || no "非收工日也在进窗口前回补"

echo
[[ $FAILS -eq 0 ]] && echo "全部通过" || echo "$FAILS 项失败"
exit $FAILS
