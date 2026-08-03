#!/bin/bash
# 发布唯一入口：push + deploy + 终点验证。
# 任一步失败 → 非零退出，最后一行永远是明确的 OK / FAILED。
# 背景：2026-08-03 Cloudflare 自动构建断链事故 + 历次"说上传了实际没有"。
# 原则：只信线上真实返回的物理量（期数），不信任何命令回执。
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

fail() { echo ""; echo "❌ PUBLISH FAILED: $1"; echo "线上状态未确认，不许对用户说'已上线'。"; exit 1; }

# 1. 工作区必须干净（docs/ 与提交内容一致，没有漏 commit 的东西）
if ! git diff --quiet -- docs/ content/ src/; then
  git status --short -- docs/ content/ src/
  fail "docs/ content/ src/ 有未提交改动，先按 SOP 显式 add + commit"
fi

LOCAL_HEAD=$(git rev-parse HEAD)

# 2. push（固定 remote，杜绝推错）
git push yinfluence-origin main || fail "git push 出错"

# 3. 远端哈希必须等于本地 HEAD（不信 push 的回执，独立核对）
REMOTE_HEAD=$(git ls-remote yinfluence-origin main | cut -f1)
[ "$REMOTE_HEAD" = "$LOCAL_HEAD" ] || fail "远端哈希 $REMOTE_HEAD != 本地 $LOCAL_HEAD"

# 4. 直推 Cloudflare（自动构建断链，deploy 是必做不是兜底）
npx wrangler deploy || fail "wrangler deploy 出错（若报 not authenticated，让用户跑: ! npx wrangler login）"

# 5. 终点验证：线上返回的期数必须等于本地 docs 的期数（物理量比对）
LOCAL_EPS=$(python3 -c "import json; print(len(json.load(open('docs/data/site.json'))['episodes']))") || fail "本地 site.json 读取失败"
for i in 1 2 3 4 5 6; do
  ONLINE_EPS=$(curl -s --max-time 15 "https://yinfluence.org/data/site.json?nc=$(date +%s)$RANDOM" \
    | python3 -c "import json,sys; print(len(json.load(sys.stdin)['episodes']))" 2>/dev/null)
  [ "${ONLINE_EPS:-0}" = "$LOCAL_EPS" ] && break
  echo "  第 $i 次检查：线上 ${ONLINE_EPS:-无响应} 期 != 本地 $LOCAL_EPS 期，20 秒后重试..."
  sleep 20
done
[ "${ONLINE_EPS:-0}" = "$LOCAL_EPS" ] || fail "等了 2 分钟，线上仍是 ${ONLINE_EPS:-无响应} 期（本地 $LOCAL_EPS 期）"

echo ""
echo "✅ PUBLISH OK: 线上 yinfluence.org 已确认 $LOCAL_EPS 期，commit $LOCAL_HEAD"
