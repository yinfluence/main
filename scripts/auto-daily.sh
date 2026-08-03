#!/bin/bash
# 颖响力网页每日自动更新 —— 北京 18:50 起进入扫描窗口，10 分钟一次重扫，发现新一期就全自动整理上线。
# 由 ~/Library/LaunchAgents/com.yingxiangli.daily-auto.plist 在登录时 + 每天英国本地
# 12:10/12:20/13:10/13:20/16:00/18:00 调用。前四个是用户要的北京 20:10 和 20:20 起扫，
# 冬夏各一套（12:xx 对应 GMT，13:xx 对应 BST）；16:00 和 18:00 是整理卡死后当天的补救通道。
# 打偏的那些会被窗口判断或锁挡掉，不会重复扫。
# 真正的密集扫描靠下面的窗口循环，不靠启动点个数：进了窗口就 10 分钟一轮扫到窗口结束。
#
# 设计（2026-07-23 与用户确认，2026-07-30 按实际发布数据修正窗口）：
#   - UP 发布规律：19 点档已成主流。最近 14 期（EP177 起）11 期是北京 19:00，
#     20 点档只剩 1 期，另有 EP188 的 20:50。原窗口 20:05 起系统性错过 19 点档，
#     7-29/7-30 连着漏掉就是这么来的（叠加 cookie 失效）
#   - 窗口模式：UTC 10:50–14:30（北京 18:50–22:30）内触发 → 每 10 分钟扫一次，发现新期整理后退出
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

# 状态一律落盘，不弹窗也不发通知横幅（用户 2026-07-30 决定）。
# 背景：display notification 的请求被系统静默丢掉，osascript 照样返回 0，
# 结果 7-29 和 7-30 连续三次扫描失败一声不响，两天后才发现 EP190 没上线；
# 换成 dialog 能看见但抢焦点太吵。所以改成写 logs/status.json（最近一次）
# 加 logs/status-history.jsonl（历史），要知道状态直接读文件。
# consecutive_failures 是关键字段：一眼看出"连续失败几次了"，别再靠人肉翻日志。
notify() {
  local title="$1" msg="$2" level="ok"
  [[ "$3" == "Basso" ]] && level="error"
  python3 - "$title" "$msg" "$level" "$LOG" <<'PY' 2>/dev/null || true
import json, os, sys, time
title, msg, level, logf = sys.argv[1:5]
d = os.path.dirname(os.path.abspath(logf))
cur = os.path.join(d, 'status.json')
try:
    with open(cur, encoding='utf-8') as f:
        streak = (json.load(f) or {}).get('consecutive_failures', 0)
except Exception:
    streak = 0
rec = {'at': time.strftime('%Y-%m-%dT%H:%M:%S%z'), 'level': level,
       'title': title, 'message': msg, 'log': os.path.basename(logf),
       'consecutive_failures': streak + 1 if level == 'error' else 0}
with open(cur, 'w', encoding='utf-8') as f:
    json.dump(rec, f, ensure_ascii=False, indent=2)
with open(os.path.join(d, 'status-history.jsonl'), 'a', encoding='utf-8') as f:
    f.write(json.dumps(rec, ensure_ascii=False) + '\n')
PY
}
log() { echo "$(date '+%H:%M:%S') $*" >> "$LOG"; }

# 全程锁：已经有实例在做（扫描循环中 / claude 整理中）就不再进来。
# 锁里记 PID 和出生时间：以前是纯目录锁靠 trap 清理，claude 被 kill -9 或者
# 休眠打断就会留下死锁，之后每一次 launchd 触发都被挡在门外，
# 整个自动化静默死亡且毫无迹象。现在进程没了或者超龄就当僵死锁清掉。
LOCK_MAX_AGE=7200   # 锁最多活 2 小时（整理硬上限 1 小时 + 余量）
if ! mkdir "$LOCK" 2>/dev/null; then
  OWNER=$(cat "$LOCK/pid" 2>/dev/null || echo "")
  BORN=$(cat "$LOCK/born" 2>/dev/null || echo 0)
  AGE=$(( $(date +%s) - BORN ))
  if [[ -n "$OWNER" ]] && kill -0 "$OWNER" 2>/dev/null && (( AGE < LOCK_MAX_AGE )); then
    exit 0   # 确实有实例在干活
  fi
  log "清理僵死锁（owner=${OWNER:-未知}，已存在 $((AGE/60)) 分钟，进程不在或超龄）"
  rm -rf "$LOCK"
  mkdir "$LOCK" 2>/dev/null || exit 0
fi
echo $$ > "$LOCK/pid"
date +%s > "$LOCK/born"
trap 'rm -rf "$LOCK" 2>/dev/null' EXIT

# 一天只有一期：库里最新一期的 publishedAt 已是今天（UTC）→ 节目当天收工，不再扫
# 注意这只管节目。直播由 scan_lives 独立判断，不受这个开关影响
#
# 草稿不算收工。整理失败留下的草稿要是带了 publishedAt，这里会误判"今天已经做完"，
# 于是当天剩下的触发点全部空转，那一期得等到明天 —— 卡死的补救通道就这么被堵掉了
today_done() {
  local latest pub
  latest=$(ls content/episodes/EP*.json 2>/dev/null | sort | tail -1)
  [[ -z "$latest" ]] && return 1
  pub=$(python3 -c "
import json, sys
d = json.load(open(sys.argv[1]))
draft = d.get('status') == 'draft' or (d.get('summary') or '').strip() in ('', '待整理')
print('' if draft else (d.get('publishedAt') or '')[:10])
" "$latest" 2>/dev/null)
  [[ "$pub" == "$(date -u +%Y-%m-%d)" ]]
}
# 收工只收节目那条线，不能直接 exit —— 那样直播当天一次都扫不到。
# 2026-08-01 就是这么漏的：注释早写着"直播不受这个开关影响"，代码却是裸 exit 0。
EPISODES_DONE=0
today_done && EPISODES_DONE=1

# 整理进程的看护参数。没有这层的话 claude 一挂住就是无限等，而且全程占着锁 ——
# 后面每次 launchd 触发都被挡掉，整个自动化静默死亡（2026-07-30 之前就是这样）。
AGENT_HARD_LIMIT=3600   # 整理最长 60 分钟（EP190 实测 24 分钟，留一倍余量）
AGENT_STALL_LIMIT=900   # 日志连续 15 分钟没有新字节就判卡死

# claude 自己会拉一堆子进程，只杀父进程的话子进程会继续跑并接着写文件
kill_tree() {
  local pid=$1
  pkill -TERM -P "$pid" 2>/dev/null
  kill -TERM "$pid" 2>/dev/null
  sleep 5
  pkill -KILL -P "$pid" 2>/dev/null
  kill -KILL "$pid" 2>/dev/null
}

# 盯着整理进程：日志停止增长太久，或者总时长超上限，就杀掉并记状态。
# 返回 0=正常结束，1=被我们杀掉
watch_agent() {
  local pid=$1 start last_size last_change now size mins
  start=$(date +%s)
  last_size=$(wc -c < "$LOG" 2>/dev/null || echo 0)
  last_change=$start
  while kill -0 "$pid" 2>/dev/null; do
    sleep 30
    now=$(date +%s)
    size=$(wc -c < "$LOG" 2>/dev/null || echo 0)
    if [[ "$size" != "$last_size" ]]; then
      last_size=$size
      last_change=$now
    fi
    if (( now - last_change >= AGENT_STALL_LIMIT )); then
      mins=$(( (now - last_change) / 60 ))
      log "整理卡死：日志 $mins 分钟没有新输出，杀掉 pid=$pid"
      kill_tree "$pid"
      notify "颖响力网页 ⚠️" "整理卡死已终止（日志 $mins 分钟无输出）。草稿留在 content/episodes/，下次扫描会重新拾起" "Basso"
      return 1
    fi
    if (( now - start >= AGENT_HARD_LIMIT )); then
      mins=$(( (now - start) / 60 ))
      log "整理超时：已跑 $mins 分钟超过上限，杀掉 pid=$pid"
      kill_tree "$pid"
      notify "颖响力网页 ⚠️" "整理超时已终止（跑了 $mins 分钟）。草稿留在 content/episodes/，下次扫描会重新拾起" "Basso"
      return 1
    fi
  done
  return 0
}

# 独立复核线上：yinfluence.org 的 site.json 必须与本地 HEAD 里 committed 的版本
# 逐字节一致（md5）。不信 agent 的任何输出。轮询 6 次给 CDN 传播时间。
# 用 git show 而不是工作区文件：agent 失败时工作区可能残留脏改动。
verify_online() {
  local LOCAL_MD5 ONLINE_MD5 i
  LOCAL_MD5=$(cd "$WEB" && git show HEAD:docs/data/site.json 2>/dev/null | md5 -q) || return 1
  for i in 1 2 3 4 5 6; do
    ONLINE_MD5=$(curl -s --max-time 15 "https://yinfluence.org/data/site.json?nc=$(date +%s)$RANDOM" | md5 -q)
    [[ "$ONLINE_MD5" == "$LOCAL_MD5" ]] && return 0
    sleep 20
  done
  log "线上复核失败：线上 md5 $ONLINE_MD5 != 本地 HEAD $LOCAL_MD5"
  return 1
}

# 一次扫描 + 发现新期则整理。
# 返回 0=已整理上线，10=无新期，20=整理失败但可以重试，其他=扫描出错
scan_once() {
  echo "$(date +%s)" > "$STAMP"
  log "=== 扫描新一期 ==="
  python3 scripts/scan-new-episodes.py --dry-run >> "$LOG" 2>&1
  local CODE=$?
  case $CODE in
    0)
      log "发现新一期，唤起 claude 整理上线"
      # 后台起 + watch_agent 看护，别裸调用。SUMMARY 只在本次输出里找：
      # grep 整个当天日志的话，同一天第二次整理失败会捡到上一次留下的 SUMMARY 而误判成功
      local BEFORE AGENT_PID ACODE
      BEFORE=$(wc -l < "$LOG" 2>/dev/null || echo 0)
      claude -p "$(cat "$WEB/scripts/daily-agent-prompt.md")" \
        --dangerously-skip-permissions >> "$LOG" 2>&1 &
      AGENT_PID=$!
      if watch_agent "$AGENT_PID"; then
        wait "$AGENT_PID"; ACODE=$?
      else
        wait "$AGENT_PID" 2>/dev/null; ACODE=124   # 被我们杀掉
      fi
      if [[ $ACODE -eq 0 ]] && tail -n +$((BEFORE + 1)) "$LOG" | grep -q "SUMMARY:"; then
        local SUM
        SUM=$(tail -n +$((BEFORE + 1)) "$LOG" | grep "SUMMARY:" | tail -1 | sed 's/^.*SUMMARY: *//')
        # SUMMARY 只是 LLM 的自我报告，不作数。2026-08-03 事故：Cloudflare 断链，
        # agent push 完就报"已上线"，线上其实还是旧版。上线判定只认独立复核：
        # 线上 site.json 内容必须与本地 committed 版本逐字节一致。
        if verify_online; then
          log "整理完成且线上复核通过：$SUM"
          notify "颖响力网页 ✅" "已自动上线：$SUM" "Glass"
          return 0
        fi
        log "agent 报告成功（${SUM}）但线上复核失败——按失败处理，走重试"
        notify "颖响力网页 ⚠️" "agent 自称上线但线上未更新，准备重试" "Basso"
        return 20
      fi
      if [[ $ACODE -ne 124 ]]; then
        # 124 是 watch_agent 杀的，那条路已经记过状态了，别重复记
        log "整理未确认成功（claude code=${ACODE}，本次输出里没有 SUMMARY 标记）"
        notify "颖响力网页 ⚠️" "整理未完成（code=${ACODE}），准备重试" "Basso"
      fi
      return 20   # 交给调用方决定要不要重试。草稿还在盘上，重扫会重新拾起
      ;;
    10) return 10 ;;
    *)
      log "扫描出错 code=${CODE}（cookie 过期 / 充电失效 / 风控 / 网络？）"
      notify "颖响力网页 ⚠️" "扫描失败 code=${CODE}，请看 logs/" "Basso"
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
        notify "颖响力直播 ⚠️" "直播扫描失败 code=${CODE}，请看 logs/" "Basso" ;;
  esac
  return 0
}

# 用 UTC 分钟数判断是否在发布窗口内（北京 18:50–22:30 = UTC 10:50–14:30）
UTC_MIN=$(( $(date -u +%H | sed 's/^0//') * 60 + $(date -u +%M | sed 's/^0//') ))
WIN_START=$(( 10 * 60 + 50 ))
WIN_END=$(( 14 * 60 + 30 ))

# 整理卡住/失败的预案：当场隔几分钟重试，不要干等下一次 launchd 触发。
# 卡在当天最后一个触发点的话，等下一次就是 24 小时后，那一期白白晚一天。
# 重试是安全的：草稿不算已收录（见 scan-new-episodes.py 的 local_eps），重扫会重新拾起。
# 上限压死，避免 claude 持续出问题时无限重跑烧钱。
RETRY_MAX=2
RETRY_GAP=300   # 5 分钟
RETRIES=0

# 整理失败就重试，直到成功、用完次数、或者跑出窗口。返回最后一次的 scan_once 码
scan_with_retry() {
  local code
  while :; do
    scan_once
    code=$?
    (( code != 20 )) && return $code
    if (( RETRIES >= RETRY_MAX )); then
      log "整理连续失败 $((RETRIES + 1)) 次，放弃本轮。草稿留在盘上，下次触发会重新拾起"
      notify "颖响力网页 ⚠️" "整理失败 $((RETRIES + 1)) 次已放弃，草稿留在 content/episodes/，下次触发重试" "Basso"
      return 20
    fi
    RETRIES=$((RETRIES + 1))
    log "整理失败，$((RETRY_GAP / 60)) 分钟后第 $RETRIES 次重试"
    sleep "$RETRY_GAP"
  done
}

# 节目当天已收工：跳过节目那条线，但直播还得扫（两条线独立，上传时段也不重叠）
if (( EPISODES_DONE )); then
  scan_lives
  exit 0
fi

if (( UTC_MIN >= WIN_START && UTC_MIN < WIN_END )); then
  # 窗口模式：10 分钟一轮，扫到新期（或出错）就停，最晚到窗口结束
  while :; do
    scan_with_retry
    CODE=$?
    (( CODE != 10 )) && break
    today_done && break
    sleep 600
    UTC_MIN=$(( $(date -u +%H | sed 's/^0//') * 60 + $(date -u +%M | sed 's/^0//') ))
    (( UTC_MIN >= WIN_END || UTC_MIN < WIN_START )) && break
  done
else
  # 窗口外（开机等）：防抖后单次补捞，整理失败一样走重试
  NOW=$(date +%s)
  if [[ -f "$STAMP" ]]; then
    LAST=$(cat "$STAMP" 2>/dev/null || echo 0)
    (( NOW - LAST < MIN_GAP )) && { scan_lives; exit 0; }
  fi
  scan_with_retry
fi

# 节目那边处理完（或没新期）之后，顺带扫一次直播
scan_lives
