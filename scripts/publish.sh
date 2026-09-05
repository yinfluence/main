#!/bin/bash
# 发布唯一入口：build 校验 + push + deploy + 终点验证。
# 任一步失败 → 非零退出，最后一行永远是明确的 OK / FAILED。
# 背景：2026-08-03 Cloudflare 自动构建断链事故 + 历次"说上传了实际没有"。
# 原则：只信线上真实返回的物理量（md5 + 期数），不信任何命令回执。
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

fail() { echo ""; echo "❌ PUBLISH FAILED: $1"; echo "线上状态未确认，不许对用户说'已上线'。"; exit 1; }

# 0. 必须在 main 分支（deploy 传的是工作区，分支不对会把别的分支内容推上线）
BRANCH=$(git rev-parse --abbrev-ref HEAD)
[ "$BRANCH" = "main" ] || fail "当前在 $BRANCH 分支，发布只允许在 main"

# 1. 工作区必须完全干净（含 staged 和 untracked——deploy 上传的是工作区文件，
#    没 commit 的东西也会被推上线，造成线上与 GitHub 漂移）
if [ -n "$(git status --porcelain -- docs/ content/ src/ scripts/ package.json)" ]; then
  git status --short -- docs/ content/ src/ scripts/ package.json
  fail "上列文件未提交（含新建/staged），先按 SOP 显式 add + commit"
fi

# 2. build 校验：重跑 build，若 docs/ 出现实质 diff，说明 commit 的 docs 是旧的。
#    build 每次都会更新 updatedAt 和 ?v= 缓存版本号，这类纯时间戳差异忽略并还原。
npm run build >/dev/null 2>&1 || fail "npm run build 出错"
REAL_DIFF=$(git diff -- docs/ | grep -E '^[+-]' | grep -vE '^[+-][+-]' \
  | grep -vE 'updatedAt|__BUILD_VERSION__|\?v=[0-9]+' || true)
if [ -n "$REAL_DIFF" ] || [ -n "$(git status --porcelain -- docs/ | grep '^??' || true)" ]; then
  git status --short -- docs/
  fail "build 后 docs/ 有实质变化，说明 commit 前忘了 build。把上列文件 add + commit 后重跑"
fi
git checkout -- docs/ 2>/dev/null   # 还原纯时间戳噪音，保持工作区与 HEAD 一致

LOCAL_HEAD=$(git rev-parse HEAD)

# 3. push（固定 remote，杜绝推错）
git push yinfluence-origin main || fail "git push 出错"

# 4. 远端哈希必须等于本地 HEAD（不信 push 的回执，独立核对）
REMOTE_HEAD=$(git ls-remote yinfluence-origin main | cut -f1)
[ "$REMOTE_HEAD" = "$LOCAL_HEAD" ] || fail "远端哈希 $REMOTE_HEAD != 本地 $LOCAL_HEAD"

# 5. 直推 Cloudflare（自动构建断链，deploy 是必做不是兜底）
npx wrangler deploy || fail "wrangler deploy 出错（若报 not authenticated，让用户跑: ! npx wrangler login）"

# 6. 终点验证：线上 site.json 的内容必须等于本地文件（期数只是展示）
#    比对走 site-json-md5.py，它会先剔除 meta.updatedAt 再算 md5。线上那份由
#    Cloudflare 拿到 commit 后自己构建，时间戳必然比本地晚，裸 md5 永远对不上。
#    除这一个字段外所有内容照旧全比。
LOCAL_MD5=$(./scripts/site-json-md5.py < docs/data/site.json) \
  || fail "本地 site.json 读取或解析失败"
LOCAL_EPS=$(python3 -c "import json; print(len(json.load(open('docs/data/site.json'))['episodes']))") \
  || fail "本地 site.json 解析失败"
#    --max-time 原来是 15 秒。site.json 到 2026-09-05 已经 10.8 MB，一次拉取
#    正好卡在 15 秒上下，于是内容明明一致也会被判成「拉取失败」，LIVE039 上线
#    时连着两次栽在这。放宽到 90 秒，比对逻辑一个字没动。
ONLINE_MD5=""
for i in 1 2 3 4 5 6; do
  ONLINE_MD5=$(curl -s --max-time 90 "https://yinfluence.org/data/site.json?nc=$(date +%s)$RANDOM" \
    | ./scripts/site-json-md5.py || true)
  [ -n "$ONLINE_MD5" ] && [ "$ONLINE_MD5" = "$LOCAL_MD5" ] && break
  echo "  第 $i 次检查：线上内容与本地不一致，20 秒后重试..."
  sleep 20
done
[ -n "$ONLINE_MD5" ] && [ "$ONLINE_MD5" = "$LOCAL_MD5" ] \
  || fail "等了 2 分钟，线上 site.json 内容仍与本地不一致（${ONLINE_MD5:-拉取失败} != ${LOCAL_MD5}）"

echo ""
echo "✅ PUBLISH OK: 线上 yinfluence.org 已确认 $LOCAL_EPS 期（内容一致），commit $LOCAL_HEAD"
