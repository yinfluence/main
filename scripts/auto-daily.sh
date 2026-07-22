#!/bin/bash
# 颖响力网页每日自动更新 —— 开机触发 + 电脑开着时定期轮询，发现新一期就全自动整理上线。
# 由 ~/Library/LaunchAgents/com.yingxiangli.daily-auto.plist 在登录时 + 每隔数小时调用。
#
# 设计（同时满足"别重复空转"和"尽快同步"）：
#   - 每次触发都查一次 B 站 UP 投稿有没有新 EP（很轻，无新增秒退、不花 token、不打扰）
#   - 有新增才唤起 claude 按 SOP 整理上线并通知；已整理的期天然幂等、不会重复处理
#   - 15 分钟最小间隔防抖，应对短时间多次开机/登录

set -uo pipefail
export PATH="/opt/homebrew/bin:/Users/ziqiguo/.local/bin:/Library/Frameworks/Python.framework/Versions/3.13/bin:/usr/bin:/bin:/usr/sbin:/sbin"

WEB="/Users/ziqiguo/Documents/Diary/GoldenVault/md/topic/personal/sources/people/颖响力/网页"
cd "$WEB" || exit 1
mkdir -p logs
TODAY=$(date +%Y-%m-%d)
STAMP="logs/.last-scan-epoch"
LOG="logs/auto-daily-$TODAY.log"
MIN_GAP=900   # 15 分钟防抖

notify() { osascript -e "display notification \"$2\" with title \"$1\" sound name \"$3\"" 2>/dev/null || true; }
log() { echo "$(date '+%H:%M:%S') $*" >> "$LOG"; }

# 防抖：距上次扫描不足 15 分钟就跳过（应对短时间多次触发）
NOW=$(date +%s)
if [[ -f "$STAMP" ]]; then
  LAST=$(cat "$STAMP" 2>/dev/null || echo 0)
  if (( NOW - LAST < MIN_GAP )); then
    exit 0
  fi
fi
echo "$NOW" > "$STAMP"

log "=== 扫描新一期 ==="
python3 scripts/scan-new-episodes.py --dry-run >> "$LOG" 2>&1
CODE=$?

case $CODE in
  0)
    log "发现新一期，唤起 claude 整理上线"
    claude -p "$(cat "$WEB/scripts/daily-agent-prompt.md")" \
      --dangerously-skip-permissions >> "$LOG" 2>&1
    if [[ $? -eq 0 ]] && grep -q "SUMMARY:" "$LOG"; then
      SUM=$(grep "SUMMARY:" "$LOG" | tail -1 | sed 's/^.*SUMMARY: *//')
      log "整理完成：$SUM"
      notify "颖响力网页 ✅" "已自动上线：$SUM" "Glass"
    else
      log "整理未确认成功（无 SUMMARY 标记）"
      notify "颖响力网页 ⚠️" "整理可能未完成，请看 logs/auto-daily-$TODAY.log" "Basso"
    fi
    ;;
  10)
    # 无新一期：秒退、静默，不打扰
    ;;
  *)
    log "扫描出错 code=$CODE（cookie 过期 / 充电失效 / 风控 / 网络？）"
    notify "颖响力网页 ⚠️" "扫描失败 code=$CODE，请看 logs/" "Basso"
    ;;
esac
