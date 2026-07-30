#!/bin/bash
# 颖响力网页每日自动更新 —— 北京 20:10 起进入扫描窗口，10 分钟一次重扫，发现新一期就全自动整理上线。
# 由 ~/Library/LaunchAgents/com.yingxiangli.daily-auto.plist 在登录时 + 每天英国本地 12:10/13:10 调用
#（两个本地时间点是为了 BST/GMT 都能对准北京 20:10 = UTC 12:10；打偏的那个会被窗口判断或锁挡掉）。
#
# 设计（2026-07-23 与用户确认）：
#   - UP 发布规律：北京 19-21 点窗口为主（30 期实测 19 点档 10 期、20 点档 18 期、EP188 实际 20:50）
#   - 窗口模式：UTC 12:05–14:30（北京 20:05–22:30）内触发 → 每 10 分钟扫一次，发现新期整理后退出
#   - 窗口外触发（开机 RunAtLoad 等）→ 只扫一次，作为漏网补捞
#   - 全程持锁：已有实例在扫描或整理中，后来的触发直接退出，不重复扫、不重复整理

set -uo pipefail
export PATH="/opt/homebrew/bin:/Users/ziqiguo/.local/bin:/Library/Frameworks/Python.framework/Versions/3.13/bin:/usr/bin:/bin:/usr/sbin:/sbin"

WEB="/Users/ziqiguo/Documents/Diary/GoldenVault/md/topic/personal/sources/people/颖响力/网页"
cd "$WEB" || exit 1
mkdir -p logs
TODAY=$(date +%Y-%m-%d)
STAMP="logs/.last-scan-epoch"
LOCK="logs/.auto-daily.lock"
LOG="logs/auto-daily-$TODAY.log"
MIN_GAP=300   # 窗口外触发的防抖（5 分钟）

notify() { osascript -e "display notification \"$2\" with title \"$1\" sound name \"$3\"" 2>/dev/null || true; }
log() { echo "$(date '+%H:%M:%S') $*" >> "$LOG"; }

# 全程锁：已经有实例在做（扫描循环中 / claude 整理中）就不再进来
if ! mkdir "$LOCK" 2>/dev/null; then
  exit 0
fi
trap 'rmdir "$LOCK" 2>/dev/null' EXIT

# 一天只有一期：库里最新一期的 publishedAt 已是今天（UTC）→ 节目当天收工，不再扫
# 注意这只管节目。直播由 scan_lives 独立判断，不受这个开关影响
today_done() {
  local latest pub
  latest=$(ls content/episodes/EP*.json 2>/dev/null | sort | tail -1)
  [[ -z "$latest" ]] && return 1
  pub=$(python3 -c "import json,sys;print(json.load(open(sys.argv[1])).get('publishedAt','')[:10])" "$latest" 2>/dev/null)
  [[ "$pub" == "$(date -u +%Y-%m-%d)" ]]
}
if today_done; then
  exit 0
fi

# 一次扫描 + 发现新期则整理。返回 0=已处理新期，10=无新期，其他=出错
scan_once() {
  echo "$(date +%s)" > "$STAMP"
  log "=== 扫描新一期 ==="
  python3 scripts/scan-new-episodes.py --dry-run >> "$LOG" 2>&1
  local CODE=$?
  case $CODE in
    0)
      log "发现新一期，唤起 claude 整理上线"
      claude -p "$(cat "$WEB/scripts/daily-agent-prompt.md")" \
        --dangerously-skip-permissions >> "$LOG" 2>&1
      if [[ $? -eq 0 ]] && grep -q "SUMMARY:" "$LOG"; then
        local SUM
        SUM=$(grep "SUMMARY:" "$LOG" | tail -1 | sed 's/^.*SUMMARY: *//')
        log "整理完成：$SUM"
        notify "颖响力网页 ✅" "已自动上线：$SUM" "Glass"
      else
        log "整理未确认成功（无 SUMMARY 标记）"
        notify "颖响力网页 ⚠️" "整理可能未完成，请看 logs/auto-daily-$TODAY.log" "Basso"
      fi
      return 0
      ;;
    10) return 10 ;;
    *)
      log "扫描出错 code=$CODE（cookie 过期 / 充电失效 / 风控 / 网络？）"
      notify "颖响力网页 ⚠️" "扫描失败 code=$CODE，请看 logs/" "Basso"
      return $CODE
      ;;
  esac
}

# 直播回放的扫描。跟节目是两条独立的线：
#   - 节目在北京 19-21 点发，直播回放次日凌晨到清晨才传（28 场实测集中在 UTC 15-17 点，
#     即北京 23:00-01:00，另有少量 UTC 22-23 点）。所以节目那个窗口一场都扫不到
#   - 直播一周两场（周三、周六），不需要高频扫，每次 auto-daily 被唤起时顺带扫一次就够
#   - 只备料不整理：下字幕、生成转写稿、写 pending-lives.json，然后通知。
#     整理要逐句通读两三万字转写稿，按 sop/08 是主线程的活，不交给无人值守的 agent
scan_lives() {
  log "=== 扫描新直播 ==="
  python3 scripts/scan-new-lives.py >> "$LOG" 2>&1
  local CODE=$?
  case $CODE in
    0)
      local N
      N=$(python3 -c "import json;print(len(json.load(open('workbench/pending-lives.json'))))" 2>/dev/null || echo "?")
      log "发现 $N 场新直播，字幕与转写稿已备好，等待整理"
      notify "颖响力直播 🎙" "发现 $N 场新直播，转写稿已备好，等你来整理" "Glass"
      ;;
    10) log "无新直播" ;;
    *)  log "直播扫描出错 code=$CODE"
        notify "颖响力直播 ⚠️" "直播扫描失败 code=$CODE，请看 logs/" "Basso" ;;
  esac
  return 0
}

# 用 UTC 分钟数判断是否在发布窗口内（北京 20:05–22:30 = UTC 12:05–14:30）
UTC_MIN=$(( $(date -u +%H | sed 's/^0//') * 60 + $(date -u +%M | sed 's/^0//') ))
WIN_START=$(( 12 * 60 + 5 ))
WIN_END=$(( 14 * 60 + 30 ))

if (( UTC_MIN >= WIN_START && UTC_MIN < WIN_END )); then
  # 窗口模式：10 分钟一轮，扫到新期（或出错）就停，最晚到窗口结束
  while :; do
    scan_once
    CODE=$?
    (( CODE != 10 )) && break
    today_done && break
    sleep 600
    UTC_MIN=$(( $(date -u +%H | sed 's/^0//') * 60 + $(date -u +%M | sed 's/^0//') ))
    (( UTC_MIN >= WIN_END || UTC_MIN < WIN_START )) && break
  done
else
  # 窗口外（开机等）：防抖后单次补捞
  NOW=$(date +%s)
  if [[ -f "$STAMP" ]]; then
    LAST=$(cat "$STAMP" 2>/dev/null || echo 0)
    (( NOW - LAST < MIN_GAP )) && { scan_lives; exit 0; }
  fi
  scan_once
fi

# 节目那边处理完（或没新期）之后，顺带扫一次直播
scan_lives
