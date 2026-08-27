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
# launchd 不带 LANG，sed 会退化成按字节处理多字节字符。项目路径里有「颖响力」和「网页」
# 两段中文，按字节算出来的 session 目录名多出 10 个横线，指向一个不存在的目录，信号 4
# 因此从 2026-08-10 加上那天起就没生效过（在终端里核对当然是对的，终端有 LANG）。
# 2026-08-14 EP199 那次误杀就是这么来的：读 SOP 26 分钟不写盘，唯一能救它的信号是坏的。
export LC_ALL=en_US.UTF-8

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

# 用户 2026-08-06 要求：节目整理好并上线后要有弹窗，别再只靠翻 status.json。
# 只用 display dialog，不用 display notification——7-29 到 7-30 的教训是横幅被系统
# 静默丢掉而 osascript 照样返回 0。dialog 是这台机器上实测确定看得见的通道。
# 后台起（&）所以不阻塞脚本；giving up after 1800 保证没人在电脑前时半小时自动收掉，
# 不会留一个 osascript 进程和一块挡屏的窗一直挂着。
# 只在两个终局状态弹：上线复核通过、以及重试用尽彻底放弃。中间的重试仍然只落盘，
# 否则一轮失败会连弹好几次，回到"太吵"的老问题。
popup() {
  local title="$1" msg="$2" level="${3:-ok}"
  osascript - "$title" "$msg" "$level" >/dev/null 2>&1 <<'AS' &
on run argv
  set t to item 1 of argv
  set m to item 2 of argv
  activate
  if (item 3 of argv) is "error" then
    display dialog m with title t buttons {"知道了"} default button 1 with icon caution giving up after 1800
  else
    display dialog m with title t buttons {"知道了"} default button 1 with icon note giving up after 1800
  end if
end run
AS
  disown 2>/dev/null || true
}
log() { echo "$(date '+%H:%M:%S') $*" >> "$LOG"; }

# 全程锁：已经有实例在做（扫描循环中 / claude 整理中）就不再进来。
# 锁里记 PID 和出生时间：以前是纯目录锁靠 trap 清理，claude 被 kill -9 或者
# 休眠打断就会留下死锁，之后每一次 launchd 触发都被挡在门外，
# 整个自动化静默死亡且毫无迹象。现在进程没了或者超龄就当僵死锁清掉。
# 锁最多活 9 小时。2 小时是按「整理一次 1 小时加余量」算的，可实际最坏路径远不止：
# 窗口循环本身能转 3 小时 40 分，节目整理最多重试三次（3 × 60 分钟加两次 5 分钟间隔），
# 2026-08-27 加上直播整理之后又多一条同样长的路。超龄判定只在进程还活着时才误伤，
# 一旦误伤就是两个实例同时写同一批文件，比留着一把死锁更糟。agent 那头有
# AGENT_HARD_LIMIT 兜底，不会无限挂，所以这里放宽是安全的
LOCK_MAX_AGE=32400
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
# 2026-08-10 从 900 提到 1500：EP197 那次 agent 起了后台轮询下字幕、然后前台阻塞
# 等待，整整 8 分半钟四个监测目录一个字节都没写，叠上前面读 SOP 的时间正好踩满 15
# 分钟被杀。硬上限 3600 仍在，所以最坏情况只是多等 10 分钟，不会无限挂。
AGENT_STALL_LIMIT=1500  # 四个活性信号全停 25 分钟才判卡死

# claude 自己会拉一堆子进程，只杀父进程的话子进程会继续跑并接着写文件
kill_tree() {
  local pid=$1
  pkill -TERM -P "$pid" 2>/dev/null
  kill -TERM "$pid" 2>/dev/null
  sleep 5
  pkill -KILL -P "$pid" 2>/dev/null
  kill -KILL "$pid" 2>/dev/null
}

# 整理进程是不是还活着，看这些信号，任一在动就算活着：
#   1. 日志字节增长
#   2. content/、docs/ 下最新的文件改动时间（整理后半程）
#   3. workbench/ 和 ../bilibili/ 下最新的文件改动时间（备料期：下音频、转写、存字幕）
#   4. claude 自己的 session jsonl（它每一次工具调用都往里追加一行）
# 只看日志会必然误杀：claude -p 是 headless 模式，全程不往 stdout 写东西，只在
# 最后一次性输出，而整理一期实际要 20 到 40 分钟。2026-07-31、08-03、08-04 连着
# 三次都是这么被杀的，7-31 那次是靠人工每分钟往日志写一行心跳才兜过去的。
#
# 2026-08-10 EP197 又栽了一次，加了信号 3 和 4 才补上：那次 agent 从头到尾活着，
# 15 分钟里跑了 169 条记录、35 次 Bash、11 次 Read，但备料写的是 workbench/ 和
# ../bilibili/raw/，一个字节都不落在 content/ 和 docs/ 里，两个老信号同时是死线。
# 信号 4 是唯一能覆盖"纯读、不写盘"那段的：agent 在读 SOP、读转写稿时不产出任何
# 文件，jsonl 却一直在长（那次长到 743KB）。
#
# 取最大值而不是数文件个数：计数会随时间窗口滑动而变化，真卡死时反倒像是有活动。
# logs/ 不能进来 —— 本脚本自己一直在写它，加进去这个信号就永远是活的。

# Claude Code 用 cwd 的路径当 session 目录名，非字母数字字符全换成横线。
# 2026-08-10 在本机核对过，与 ~/.claude/projects/ 下的实际目录名逐字符一致。
AGENT_SESSION_DIR="$HOME/.claude/projects/$(printf '%s' "$WEB" | sed 's/[^a-zA-Z0-9]/-/g')"
# 算错了就当场说出来。信号 4 一旦悄悄指向不存在的目录，看门狗会把纯读不写盘的正常整理
# 判成卡死，而日志上只留一句"卡死"，看不出是检测坏了 —— 2026-08-10 到 08-14 就是这样。
if [[ ! -d "$AGENT_SESSION_DIR" ]]; then
  log "WARN: agent session 目录不存在（$AGENT_SESSION_DIR），信号 4 失效，卡死判定会偏严"
fi

agent_activity_stamp() {
  find "$WEB/content" "$WEB/docs" "$WEB/workbench" \
       "$(dirname "$WEB")/bilibili" "$AGENT_SESSION_DIR" \
       -type f -exec stat -f '%m' {} + 2>/dev/null \
    | sort -rn | head -1
}

# 盯着整理进程：两个活性信号都停太久，或者总时长超上限，就杀掉并记状态。
# 返回 0=正常结束，1=被我们杀掉
watch_agent() {
  local pid=$1 start last_size last_files last_change now size files mins
  start=$(date +%s)
  last_size=$(wc -c < "$LOG" 2>/dev/null || echo 0)
  last_files=$(agent_activity_stamp)
  last_change=$start
  while kill -0 "$pid" 2>/dev/null; do
    sleep 30
    now=$(date +%s)
    size=$(wc -c < "$LOG" 2>/dev/null || echo 0)
    files=$(agent_activity_stamp)
    if [[ "$size" != "$last_size" || "$files" != "$last_files" ]]; then
      last_size=$size
      last_files=$files
      last_change=$now
    fi
    if (( now - last_change >= AGENT_STALL_LIMIT )); then
      mins=$(( (now - last_change) / 60 ))
      log "整理卡死：日志和文件改动都停了 $mins 分钟，杀掉 pid=$pid"
      kill_tree "$pid"
      notify "颖响力网页 ⚠️" "整理卡死已终止（$mins 分钟没有任何写入）。草稿留在 content/episodes/，下次扫描会重新拾起" "Basso"
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
# 内容一致。不信 agent 的任何输出。轮询 6 次给 CDN 传播时间。
# 用 git show 而不是工作区文件：agent 失败时工作区可能残留脏改动。
# 比对前剔除 meta.updatedAt：每次 build 都会刷新它，线上那份由 Cloudflare 自己
# 构建，时间戳必然不同。除它以外所有字段照旧全比，严格程度不降。
verify_online() {
  local LOCAL_MD5 ONLINE_MD5 i
  LOCAL_MD5=$(cd "$WEB" && git show HEAD:docs/data/site.json 2>/dev/null | "$WEB/scripts/site-json-md5.py") || return 1
  [[ -n "$LOCAL_MD5" ]] || return 1
  for i in 1 2 3 4 5 6; do
    ONLINE_MD5=$(curl -s --max-time 15 "https://yinfluence.org/data/site.json?nc=$(date +%s)$RANDOM" | "$WEB/scripts/site-json-md5.py")
    [[ -n "$ONLINE_MD5" && "$ONLINE_MD5" == "$LOCAL_MD5" ]] && return 0
    sleep 20
  done
  log "线上复核失败：线上 $ONLINE_MD5 != 本地 HEAD $LOCAL_MD5（已忽略 updatedAt）"
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
          popup "颖响力网页 ✅ 新一期已上线" "$SUM

线上已复核一致，可以直接看网页。"
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
      # 这条路径不重试也不整理，直接返回，所以它就是终局，必须弹。
      # 7-29 静默失败两天没人发现，正是死在这里：cookie 过期扫不到，一声不响。
      popup "颖响力网页 ⚠️ 扫描失败" "扫不到新一期，code=${CODE}。

常见原因：B 站 cookie 过期、充电专属失效、风控、网络。
日志：logs/auto-daily-$TODAY.log" "error"
      return $CODE
      ;;
  esac
}

# 唤起 agent 整理直播，一轮做完清单里的所有场次。
# 跟节目那条线共用 watch_agent / verify_online，另外多一道 audit-lives 闸门：
# agent 的 SUMMARY 只是自我报告，机器检查和线上数据才作数。
# 返回 0=已上线，20=失败可重试
curate_lives_once() {
  local IDS="$1" BEFORE AGENT_PID ACODE SUM
  BEFORE=$(wc -l < "$LOG" 2>/dev/null || echo 0)
  claude -p "$(cat "$WEB/scripts/daily-live-prompt.md")" \
    --dangerously-skip-permissions >> "$LOG" 2>&1 &
  AGENT_PID=$!
  if watch_agent "$AGENT_PID"; then
    wait "$AGENT_PID"; ACODE=$?
  else
    wait "$AGENT_PID" 2>/dev/null; ACODE=124
  fi
  if [[ $ACODE -ne 0 ]] || ! tail -n +$((BEFORE + 1)) "$LOG" | grep -q "SUMMARY:"; then
    [[ $ACODE -ne 124 ]] && log "直播整理未确认成功（claude code=${ACODE}，本次输出里没有 SUMMARY）"
    return 20
  fi
  SUM=$(tail -n +$((BEFORE + 1)) "$LOG" | grep "SUMMARY:" | tail -1 | sed 's/^.*SUMMARY: *//')
  # 机器闸门：整理写坏了（缺链接、要点超 4 条、简介字数不对、tag 没词条）就不算成功。
  # 直播的字段规矩比节目细，光靠 agent 自查兜不住
  if ! node scripts/audit-lives.mjs >> "$LOG" 2>&1; then
    log "直播整理没过 audit-lives，按失败处理：$SUM"
    return 20
  fi
  if ! verify_online; then
    log "agent 报告成功（${SUM}）但线上复核失败，按失败处理"
    return 20
  fi
  log "直播整理完成且线上复核通过：$SUM"
  notify "颖响力直播 ✅" "已自动上线：$SUM" "Glass"
  popup "颖响力直播 ✅ 已上线" "$SUM

线上已复核一致，可以直接看网页。"
  return 0
}

# 失败就隔几分钟重试，草稿留在盘上，重扫会重新拾起。上限压死，别在出问题时无限烧钱
curate_lives() {
  local IDS="$1" tries=0 code
  while :; do
    curate_lives_once "$IDS"
    code=$?
    (( code == 0 )) && return 0
    if (( tries >= RETRY_MAX )); then
      log "直播整理连续失败 $((tries + 1)) 次，放弃本轮。待办留在 pending-lives.json，下次触发重试"
      notify "颖响力直播 ⚠️" "整理失败 $((tries + 1)) 次已放弃（${IDS}）" "Basso"
      popup "颖响力直播 ⚠️ 这几场没上线" "$IDS

连续失败 $((tries + 1)) 次，本轮放弃。待办还在 workbench/pending-lives.json，
下次触发会重新拾起。原因看 logs/auto-daily-$TODAY.log"  "error"
      return 20
    fi
    tries=$((tries + 1))
    log "直播整理失败，$((RETRY_GAP / 60)) 分钟后第 $tries 次重试"
    sleep "$RETRY_GAP"
  done
}

# 直播回放的扫描。跟节目是两条独立的线：
#   - 节目在北京 19-21 点发，直播回放次日凌晨到清晨才传（28 场实测集中在 UTC 15-17 点，
#     即北京 23:00-01:00，另有少量 UTC 22-23 点）。所以节目那个窗口一场都扫不到
#   - 直播一周两场（周三、周六），不需要高频扫，每次 auto-daily 被唤起时顺带扫一次就够
#   - 备料完接着整理上线（2026-08-27 改）。原来是只备料不整理，理由是通读两三万字
#     转写稿该由主线程做。代价是备好的料没人接：LIVE035 从 8-23 起报了 25 次全写进
#     status.json，LIVE036 跟着压上，两场搁了五天，网页上一场都看不到。现在照节目那条
#     线的样子唤起 agent，同样有 watch_agent 看护、失败重试和线上独立复核，
#     另外多一道闸门：agent 说完成之后外层再跑一次 audit-lives，不过就不算成功
scan_lives() {
  log "=== 扫描新直播 ==="
  python3 scripts/scan-new-lives.py >> "$LOG" 2>&1
  local CODE=$?
  case $CODE in
    0)
      local N IDS LAST
      N=$(python3 -c "import json;print(len(json.load(open('workbench/pending-lives.json'))))" 2>/dev/null || echo "?")
      IDS=$(python3 -c "import json;print(','.join(sorted(x['id'] for x in json.load(open('workbench/pending-lives.json')))))" 2>/dev/null || echo "?")
      log "发现 $N 场新直播（${IDS}），字幕与转写稿已备好，开始整理"
      notify "颖响力直播 🎙" "发现 $N 场新直播（${IDS}），开始整理" "Glass"
      LAST=$(cat "logs/.last-pending-lives" 2>/dev/null || echo "")
      echo "$IDS" > "logs/.last-pending-lives"
      curate_lives "$IDS"
      ;;
    10) log "无新直播" ;;
    *)  log "直播扫描出错 code=$CODE"
        notify "颖响力直播 ⚠️" "直播扫描失败 code=${CODE}，请看 logs/" "Basso"
        popup "颖响力直播 ⚠️ 扫描失败" "扫不到直播，code=${CODE}。

常见原因：B 站 cookie 过期、充电专属失效、风控、网络。
日志：logs/auto-daily-$TODAY.log" "error" ;;
  esac
  return 0
}

# 第三条线：给已收录的期回补另一个平台的链接（2026-08-07 加）。
# 跟节目、直播一样是独立的一条线，因为它问的是另一个问题：不是「有没有新的一期」，
# 而是「已有的一期全不全」。scan_once 只判 EP 号在不在本地，判完就再也不回头看，
# 所以 B 站先发、YouTube 晚 28 分钟上线的 EP195 那条链接永远没人补（EP189、EP194
# 同样的死法，前两次都是用户发现后人工补的）。
#
# 补链接是纯机械活，不需要 LLM，所以整条路径（补 → build → commit → ship → 复核）
# 全自动走完，不唤起 claude。
backfill_links() {
  log "=== 回补缺失的视频链接 ==="
  local BEFORE CODE EPS DIRTY
  BEFORE=$(wc -l < "$LOG" 2>/dev/null || echo 0)
  python3 scripts/backfill-video-links.py >> "$LOG" 2>&1
  CODE=$?
  (( CODE == 10 )) && return 0    # 链接都齐，正常情况下每天走的就是这条
  if (( CODE != 0 )); then
    log "链接回补出错 code=$CODE"
    notify "颖响力网页 ⚠️" "视频链接回补失败 code=${CODE}，请看 logs/" "Basso"
    return 0                      # 补不了不影响节目和直播那两条线
  fi

  EPS=$(tail -n +$((BEFORE + 1)) "$LOG" | sed -n 's/^已补 [0-9]* 期的链接: //p' | tail -1)
  log "补了链接：${EPS:-?}，开始上线"

  # 上线前先确认工作区里除了刚补的 episode JSON 没有别的脏东西。
  # ship 传的是工作区文件，别人没提交完的半成品会跟着一起推上线。
  DIRTY=$(git status --porcelain -- docs/ content/ src/ scripts/ package.json \
          | grep -v '^ M content/episodes/EP[0-9]*\.json$' || true)
  if [[ -n "$DIRTY" ]]; then
    log "工作区还有其他未提交改动，链接已补但不自动上线：$(echo "$DIRTY" | tr '\n' ' ')"
    notify "颖响力网页 ⚠️" "已补 ${EPS:-?} 的链接，但工作区不干净没自动上线，需要人工处理" "Basso"
    return 0
  fi

  if ! npm run build >> "$LOG" 2>&1; then
    log "链接补完 build 失败，改动留在工作区"
    notify "颖响力网页 ⚠️" "补了 ${EPS:-?} 的链接但 build 失败，改动留在工作区" "Basso"
    return 0
  fi
  git add content/episodes docs >> "$LOG" 2>&1
  git commit -q -m "自动回补 ${EPS:-视频} 的平台链接

由 scripts/backfill-video-links.py 在每日自动化里发现并补上：这些期收录时
另一个平台还没发布，scan-new-episodes 此后只认 EP 号不再回头看，链接就一直缺着。" >> "$LOG" 2>&1
  if ! npm run ship >> "$LOG" 2>&1; then
    log "链接已 commit 但 ship 失败，线上仍是旧版"
    notify "颖响力网页 ⚠️" "补了 ${EPS:-?} 的链接并已 commit，但 ship 失败，线上还是旧的" "Basso"
    popup "颖响力网页 ⚠️ 链接没推上线" "已补 ${EPS:-?} 的视频链接并 commit，但发布失败。

线上还是旧版。日志：logs/auto-daily-$TODAY.log" "error"
    return 0
  fi
  # ship 内部已经比过线上 md5，这里再独立复核一次（不信任何命令回执，同 scan_once）
  if verify_online; then
    log "链接回补已上线并复核通过：$EPS"
    notify "颖响力网页 ✅" "已自动补上 ${EPS:-?} 的视频链接并上线" "Glass"
    popup "颖响力网页 ✅ 视频链接已补上" "${EPS:-?} 缺的平台链接已自动补全并上线。

线上已复核一致。"
  else
    log "链接已 ship 但线上复核不通过"
    notify "颖响力网页 ⚠️" "补了 ${EPS:-?} 的链接，ship 报成功但线上复核不一致" "Basso"
  fi
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
      popup "颖响力网页 ⚠️ 这一期没上线" "连续失败 $((RETRIES + 1)) 次，本轮放弃。

草稿还在 content/episodes/，下次触发会重新拾起。要现在看原因：logs/auto-daily-$TODAY.log" "error"
      return 20
    fi
    RETRIES=$((RETRIES + 1))
    log "整理失败，$((RETRY_GAP / 60)) 分钟后第 $RETRIES 次重试"
    sleep "$RETRY_GAP"
  done
}

# 回补链接放在所有分支之前，每次被唤起都先跑一次。
#
# 为什么不能放在窗口循环后面（2026-08-07 实测）：这台机器绝大多数时间在 Deep Idle，
# 睡着时 sleep 600 不推进。当天 12:13:09 电脑 DarkWake 只醒了 11 秒，脚本扫完一轮就
# 卡在 sleep 里，直到 13:28 用户唤醒才继续 —— 那 75 分钟本该扫 7 次，实际一次没扫。
# 也就是说进了窗口循环之后的代码可能几小时都轮不到。链接回补很快（没得补时几秒），
# 又跟节目扫描没有依赖关系，放最前面才是每次触发都真的会跑。
#
# 收工的日子也要跑：EP195 正是死在收工之后 —— B 站版当天 11:03 收录，today_done
# 立刻变真，而 YouTube 版 11:31 才上线。「当天已更新就停」只该停节目扫描那条线。
backfill_links

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

# 节目那边处理完（或没新期）之后，顺带扫一次直播。
# 链接回补已经在最前面跑过了，这里不重复——窗口循环可能跑几个小时，
# 到这儿才补就等于没补（见上面那段 Deep Idle 的实测）。
scan_lives
