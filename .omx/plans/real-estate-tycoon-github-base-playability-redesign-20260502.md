---

authored_by: external
content_role: reference
trust_level: primary
authoring_mode: human
last_verified: 2026-05-17
---
# 房地产小游戏 GitHub 基线重设计审核计划

日期：2026-05-02
状态：已按本计划执行完成；已完成自审、critic/verifier 审核、构建和 smoke 验证
范围：`src/simulators/real-estate-tycoon/`、对应构建产物 `docs/simulators/real-estate-tycoon/`、必要验证脚本
基线：已换回 `yinfluence-origin/main` 上一次上传 GitHub 的版本；不以刚撤回的“亡命高周转/混式”改版为基础

## 0. 这份文档的目的

用户要求先不要动手做，先完整记录、自己审核、对比类似游戏，再给出详细规划。本文件就是执行前的审核版计划。

本计划解决四件事：

1. 可玩性：玩家每回合要有清晰目标、压力、选择和后果，而不是看一堆解释。
2. 丰富度：现有系统已经有土拍、融资、关系、项目、周期、事件、结局，应该把这些做成可感知的经营对象，而不是继续堆事件文字。
3. 长期留存：通过种子、路线、成就/图鉴、每日局、身份开局、遗产局，让玩家愿意重开、比较和收集。
4. UI：一页内显示全部核心内容，桌面和手机都不能依赖页面上下滑动；次级账本只在抽屉/底部弹层里出现。

### 0.1 自审后修订记录

本文件先写初版，再交给独立 critic 审核。critic 结论是 `REJECT`，理由是计划方向正确，但执行性不够。已修订以下问题：

- 把旧 smoke 与新目标冲突写成 Phase 0 必修项：现有“默认进入土拍地图”只是旧基线现象，不是产品目标，相关 smoke 断言必须废弃。
- 把验收拆成“自动可测”和“人工试玩审查”，避免用“愿意重开”“10 秒内知道”等不可自动证明的话当唯一验收。
- 补全 phase 文件边界：尤其是 `scripts/real-estate-tycoon-smoke.mjs`、`data.js`、`systems/auction/map-view.js`。
- 明确长期留存 UX：进入页面显示“继续上局 / 新开一局”，不再启动即删除存档。
- 补充竞品洞见落地表：每个参考游戏对应到本游戏机制、文件、phase、验收。

## 1. 明确不做什么

- 不继续使用已经撤回的 `systems/runaway/` 路线，不把游戏改成纯“跑商/亡命高周转”小游戏。
- 不大改主题，不丢掉现在“房地产经营桌面 + 节目机制复盘”的方向。
- 不把解决方案变成更多解释文字、更多卡片、更多事件库。
- 不做纯 Reigns 左右滑，不做纯 Cookie Clicker 放置点击，不做 Wall Street Raider 式早期金融终端。
- 不新增依赖，除非后面用户明确同意。
- 不先发布 GitHub；只有用户审核并要求执行/发布后再改源码、构建、提交、推送。

## 2. 当前基线记录

### 2.1 工作树状态

回退后，跟踪文件与 `yinfluence-origin/main` 保持一致。当前仍有与本任务无关的未跟踪文件：

- `.omx-keyword-audit.txt`
- `.omx/`
- `docs/assets/EP125-yinfluence-cover.png`
- `scripts/cover-tools/`
- `src/assets/EP125-yinfluence-cover.png`

这些不是小游戏源码改动。后续执行时只碰本计划列出的文件。

### 2.2 已有系统不是空白

当前 GitHub 基线不是“缺玩法”，而是“玩法藏在后台，前台不好玩”。

证据：

- `src/simulators/real-estate-tycoon/README.md:3` 要求新增机制放进 `systems/`，不要继续把大块逻辑塞进 `app.js`。
- `src/simulators/real-estate-tycoon/README.md:21-26` 已经明确事件不能是纯随机题库，必须保存来源、因果和权重。
- `src/simulators/real-estate-tycoon/app.js:1373-1453` 的 `createGame()` 已经有 `relations`、`riskLedger`、`stakeholderStress`、`goodwill`、`projectLedger`、`fundingLedger`、`districtMarket`、`landRegistry`、`competitorRoster`、`auctionDesk` 等长期系统。
- `src/simulators/real-estate-tycoon/data.js` 当前有 126 个事件、16 个结局、7 个规模、7 个阶段、60 个主线节点；数量不是第一瓶颈。
- `src/simulators/real-estate-tycoon/systems/auction/`、`systems/relation/` 已经有部分模块化文件；后续应该沿用这种拆分，而不是写一个新巨型脚本。

结论：优先保留基线的系统深度，改前台循环、单屏工作台、可解释随机和长期目标。

### 2.3 当前主要问题

#### 问题 A：事件选择被强行裁成两个

`src/simulators/real-estate-tycoon/app.js:2331`：

```js
const displayedChoices = event.choices.slice(0, 2);
```

如果数据里写了 3 个选择，前台也只显示 2 个。这会直接削弱策略空间和复玩差异。

修正方向：普通事件默认显示数据中的 3 个选择；只有明确标记为二选一的轻事件才显示 2 个。

#### 问题 B：办公室回合像菜单，不像经营局面

`src/simulators/real-estate-tycoon/app.js:6753-6989` 的 `renderOfficeTurn()` 会构建分类动作、动作 dock、土地、融资、关系、项目面板。这些系统很丰富，但前台感受偏“功能菜单”：

- 玩家先选分类，再选对象，再选动作，决策压力被 UI 层分散。
- `actionDock` 是 sticky bottom，像导航，不像“今天必须处理的经营问题”。
- 土拍、项目、融资、关系都在争夺屏幕空间，移动端容易像后台管理界面。

修正方向：前台每回合只呈现 1 个“老板桌面焦点”和 3 个高质量行动；分类入口降级成抽屉/底部 tab。

#### 问题 C：一页显示不稳

当前 DOM 是普通网页流：

- `src/simulators/real-estate-tycoon/index.html:25-113`：`game-shell` 里是左侧状态栏 + 主面板 + start/event/scale/debrief 的线性文档结构。
- `src/simulators/real-estate-tycoon/style.css:114-123`：`.game-shell` 是普通 grid，有外边距，不能保证视口锁定。
- `src/simulators/real-estate-tycoon/style.css:201-205`：`.main-panel` 有 `min-height` 和大 padding，容易在小屏制造滚动。
- `src/simulators/real-estate-tycoon/style.css:610-623`：`.action-dock` 用 sticky bottom，可能遮挡内容，也说明它没有被纳入稳定的 viewport layout。
- `src/simulators/real-estate-tycoon/style.css:2939-3071`：移动端通过隐藏 topbar、压缩 padding 来补救，而不是从一开始按单屏工作台设计。

修正方向：页面级 `100dvh` + `overflow:hidden`，核心区域内部用固定轨道；账本/历史/来源进入抽屉，不参与页面高度。

#### 问题 D：随机性不可复盘

`src/simulators/real-estate-tycoon/app.js` 多处直接使用 `Math.random()`，例如开局、土拍、竞品、价格、事件、风险、漂移、结局概率等。`randomizedEffect()` 在 `app.js:9855` 附近还会给效果增加抖动。

问题不是“不能随机”，而是玩家长期玩时需要：

- 同一局可复盘：为什么这次被抽贷/围标/维权？
- 同 seed 可重玩：我换一个策略结果是不是不同？
- 每日局可比较：大家面对同一市场周期。

修正方向：引入轻量 seed/PRNG，把宏观周期、城市/地块、竞品、事件、土拍分别拆 seed；先覆盖新循环关键随机，逐步替换旧的 `Math.random()`。

#### 问题 E：长期留存没有保存入口

`src/simulators/real-estate-tycoon/app.js:11377` 当前启动时直接：

```js
localStorage.removeItem(SAVE_KEY);
```

这对调试有用，但会破坏长期留存：玩家刷新后没有“继续一局”、也没有成就/图鉴/历史路线。

修正方向：保留“清空存档”按钮，但不要启动即删除；拆成 `run save` 和 `meta save` 两类。

#### 问题 F：当前 smoke 会锁死旧产品形态

`scripts/real-estate-tycoon-smoke.mjs:159-179` 现在开局后等待 `.land-market-map .lot-node`，并断言“Land map should be the default office screen”。这和本计划的“老板桌面焦点 + 3 个主动作”相冲突。

结论：现有“默认进入土拍地图”不是未来产品目标，只是 GitHub 基线的旧行为。Phase 0 必须先改验证护栏，不能让旧 smoke 迫使新 UI 保留旧入口。

## 3. 竞品对比记录

### 3.1 Cookie Clicker

来源：

- https://store.steampowered.com/app/1454400/
- https://orteil.dashnet.org/cookieclicker/

它解决的问题：

- 永远有下一个目标：升级、建筑、成就、永久升级、小游戏。
- 操作很简单，但成长线很长。
- Steam 版页面列出 600+ upgrades、500+ achievements、mini-games、heavenly perma-upgrades、cloud saving。

可借鉴：

- 本游戏需要“机制图鉴/结局图鉴/路线成就/永久记录”，让玩家重开有收集目标。
- 短期目标要永远在眼前：下一次利息、下一块地、下一栋楼、下一次交付、下一次抽贷。

不能照抄：

- 不能变成点击涨数字。房地产题材的吸引力是“资产、债务、关系、周期、交付”之间的结构性矛盾，不是产量指数爆炸。

### 3.2 Universal Paperclips

来源：

- https://www.decisionproblem.com/paperclips/index2.html
- https://www.franklantz.net/work

它解决的问题：

- 从一个极小动作开始，逐渐展开系统层级。
- 玩家最初只理解“做回形针”，后来才面对市场、资源、扩张、终局。

可借鉴：

- 本游戏第一回合不要展示所有系统。先给一个可懂的老板问题：现金够几回合、项目卡在哪里、今天抢不抢机会。
- 随规模展开新系统：县城阶段少系统，省会/全国阶段再打开资本市场、债委会、国资、司法冻结。

不能照抄：

- 不要做抽象数值吞噬世界；这里需要保留具体地块、楼盘、债主和关系人。

### 3.3 A Dark Room

来源：

- https://adarkroom.doublespeakgames.com/
- https://www.nintendo.com/us/store/products/a-dark-room-switch/

它解决的问题：

- 初始界面极简，复杂度逐步显露。
- Nintendo 页面描述它从有限互动选项发展成复杂故事和资源管理挑战。

可借鉴：

- 开局 UI 应该克制：只给核心状态和 3 个行动，不把所有账本摊开。
- 新系统通过事件和阶段自然解锁，不用在首页写说明。

不能照抄：

- 不能过度隐藏机制。房地产经营需要让玩家知道大致代价，否则会变成猜作者。

### 3.4 Reigns

来源：

- https://www.devolverdigital.com/games/reigns
- https://store.steampowered.com/app/474750/Reigns/

它解决的问题：

- 一屏一个请求，操作成本极低。
- 玩家在多个派系/资源之间平衡，每个决定都有后续风险。
- 官方介绍强调随机请求、四方平衡、长期王朝扩展、目标挑战。

可借鉴：

- “少按钮，高后果”：每回合最多 3 个主动作，每个动作影响多条线。
- “后果延迟”：今天压总包，几回合后可能变成停工、证据包、保全。
- “路线挑战”：开局给一个本局目标，如 24 回合内不爆雷完成首盘交付。

不能照抄：

- 不能只做左右二选一。房地产经营需要主动拿地、融资、推进、处置资产。

### 3.5 Game Dev Tycoon

来源：

- https://store.steampowered.com/app/239820/Game_Dev_Tycoon/
- https://www.greenheartgames.com/

它解决的问题：

- 生产管线很清楚：做游戏、研究技术、做引擎、搬办公室、招团队。
- 成长阶段自然：车库 -> 办公室 -> 团队 -> 实验室。
- Steam 页面强调研发、报告、技术、办公室、团队、成就、mod/workshop。

可借鉴：

- 房地产也需要“管线可视化”：拿地 -> 融资 -> 开工 -> 预售 -> 回款 -> 交付 -> 再扩张/退出。
- 结算不是只告诉成败，而要给“项目报告”：这次为什么卖得好/差、哪个动作埋雷。

不能照抄：

- 不要把每个项目做成复杂生产 minigame。我们要短局、高压、网页可玩。

### 3.6 Sim Companies

来源：

- https://guides.simcompanies.com/books/economy-model/page/economy-model
- https://guides.simcompanies.com/books/bonds-guide/page/bonds-guide
- https://www.simcompanies.com/articles/api/

它解决的问题：

- 经济不是随机背景，而是玩家可学习、可优化的系统。
- 官方经济模型说明它模拟大众购买行为，玩家通过理解模型提高利润。

可借鉴：

- 本游戏的城市市场、购房需求、融资环境应该有可读信号。
- 玩家可以看到“本周信号”：按揭慢、竞品降价、地方保交楼、供应商催款，而不是只看到随机事件。

不能照抄：

- 不做多人市场和真实交易所；当前网页小游戏不需要服务器经济。

### 3.7 Capitalism Lab

来源：

- https://www.capitalismlab.com/
- https://www.capitalismlab.com/new-features/

它解决的问题：

- 宏观经济、城市人口、租金、设施、通胀、利率会影响地产和商业。
- 新功能页描述了更细的房地产模拟、城市设施、人口/就业、宏观经济、央行、通胀对价格和成本的影响。

可借鉴：

- 本游戏需要“城市/周期/利率/政策”作为长期背景，解释为什么同一个动作在不同周期下结果不同。
- 土地价值不只是随机价格，还应受城市热度、配套、融资周期、竞品影响。

不能照抄：

- 不做完整商业帝国模拟。复杂宏观只服务房地产经营回合。

### 3.8 Wall Street Raider

来源：

- https://www.wallstreetraider.com/
- https://apps.apple.com/us/app/wall-street-raider-stock-sim/id6759681029

它解决的问题：

- 深金融模拟、AI rival、动态新闻、宏观经济、投资组合仪表盘、速度控制。

可借鉴：

- 后期阶段可增加“债委会/资产包/国资接盘/债券/股权质押/司法冻结”的资本工具。
- 竞品和债权人不能只是事件名字，要能在系统里主动行动。

不能照抄：

- 早期不能变成金融终端。县城包工头开局必须先可懂，金融深度只在中后期展开。

### 3.9 Landlord Tycoon / Landlord GO

来源：

- https://apps.apple.com/us/app/landlord-tycoon-own-the-world/id950949627
- https://landlord-go.com/

它解决的问题：

- 地图和真实地点制造资产幻想。
- App Store 评论里反复提到真实地理位置、按比例购买、每小时收益、可持续留在手机里。

可借鉴：

- 本游戏也需要“资产感”：地块、项目、楼盘、抵押、股权比例、接盘方，而不是抽象资产分。
- 地图/城市节点可以让玩家记住“我这一局从哪里起家、在哪块地爆雷”。

不能照抄：

- 不做 GPS 和真实地点购买；这会偏离颖响力网页知识游戏，也可能带来数据和合规复杂度。

### 3.10 Project Highrise / The Tenants

来源：

- https://store.steampowered.com/app/423580/Project_Highrise/
- https://store.steampowered.com/app/1009560/The_Tenants/

它们解决的问题：

- Project Highrise 把建筑/租户/设施/经济关系做成可视对象。
- The Tenants 强调房东经营、装修、租客和物业管理。

可借鉴：

- “项目对象”要可点、可维护、可处置。玩家不是只看总交付分，而是看到具体楼盘的进度、监管户、未售货值、总包压力。

不能照抄：

- 不做装修摆家具/楼层搭建；当前题材更像开发商资金链，不是室内装修经营。

### 3.11 竞品洞见落地表

| 参考对象 | 洞见 | 本游戏机制 | 目标文件 | Phase | 可测验收 |
| --- | --- | --- | --- | --- | --- |
| Reigns | 一屏一个高压决策，少按钮高后果 | 老板桌面焦点 + 3 个动作；每个动作影响多条账本线 | `app.js`、`systems/desk/focus.js`、`style.css` | Phase 1-2 | 办公室回合主区域最多 3 个主动作；按钮显示代价方向；普通事件可显示 3 选择 |
| A Dark Room | 复杂度逐步展开 | 县城开局只展示现金、项目、债务、关系的必要入口；中后期才展开资本/国资/司法 | `app.js`、`data.js`、`style.css` | Phase 1、Phase 6-7 | 新手首屏无长说明；开局 3 回合内不出现超过 4 个系统入口 |
| Universal Paperclips | 阶段性系统展开 | 规模/周期阶段解锁新工具，而不是首屏全量工具 | `data.js`、`app.js`、`systems/desk/focus.js` | Phase 2、Phase 6 | 县城/省会/全国阶段可用动作集合不同；scale transition 后出现新焦点类型 |
| Cookie Clicker | 长期收集和永久目标 | 结局图鉴、机制图鉴、路线统计、每日局记录 | `systems/meta/progression.js`、`app.js`、`index.html` | Phase 6 | 结束一局后 meta save 记录结局和机制；新开局不清 meta |
| Game Dev Tycoon | 清晰生产管线和项目报告 | 土地 -> 融资 -> 开工 -> 预售 -> 回款 -> 交付 -> 扩张/退出的项目状态线 | `systems/project/actions.js`、`app.js`、`data.js` | Phase 3-4 | 项目卡显示阶段、缺口、期限；结局证据能引用具体项目 |
| Sim Companies | 玩家可学习的经济信号 | 本周市场信号：按揭、库存、竞品降价、融资收紧 | `systems/desk/focus.js`、`data.js`、`app.js` | Phase 2、Phase 5 | 每回合显示至少 1 条 `whyNow` 或市场信号；事件来源可追溯 |
| Capitalism Lab | 宏观经济影响地产 | 周期、利率、政策、城市热度影响地价、销售、融资报价 | `app.js`、`systems/random/seeded-rng.js`、`data.js` | Phase 5、Phase 7 | 同 seed 下宏观信号固定；不同 macroSeed 影响地块和融资结果 |
| Wall Street Raider | AI rival 和动态新闻 | 竞品行动、债权人行动、债委会/国资/司法线作为中后期压力 | `systems/auction/competitors.js`、`app.js`、`data.js` | Phase 5、Phase 7 | 至少 3 类竞品行动能影响土拍/销售/银行/媒体之一 |
| Landlord Tycoon | 地图和资产幻想 | 地块、项目、抵押、股权比例、接盘方可见 | `systems/auction/map-view.js`、`systems/auction/holdings.js`、`app.js` | Phase 3 | 赢地后 landRegistry 状态可见；地图/抽屉能查看持有状态 |
| Project Highrise / The Tenants | 经营对象可视化 | 项目对象化，玩家处理具体楼盘而非总分 | `systems/project/actions.js`、`app.js`、`style.css` | Phase 4 | 两个项目并存时能分别选择和处理 |

## 4. 竞品对比后的设计结论

### 4.1 最核心判断

这个小游戏最应该成为：

> 一个单屏房地产老板桌面。每回合玩家面对一个可解释的经营压力，用 3 个高后果动作在现金、土地、项目、融资、关系、交付、老板安全之间做取舍。系统记录前因，几回合后把旧选择变成机会或债。

不是：

- 文字问答题库。
- 后台管理系统。
- 纯跑商涨价差。
- 纯事件抽卡。
- 纯金融模拟器。
- 纯 idle 点击。

### 4.2 三层循环

#### 30 秒循环：一回合一桌事

玩家进入回合后，必须马上知道：

- 现在最危险的是什么：现金、项目、土拍、关系、交付、老板安全。
- 还能撑几回合：现金 runway、项目期限、债务到期、土拍窗口。
- 今天能做哪 3 件事：每件事都有明确代价方向。

前台例子：

```text
第 9 回合｜现金还能撑 2 回合｜河湾 2 号楼 6 回合后交付

桌面焦点：总包要停工，银行也在等销售回款。

1. 把监管户补进去，保河湾 2 号楼不停工
   代价：自由现金下降；交付信用上升；短期拿地窗口错过

2. 提前开盘回款，给渠道高佣金
   代价：销售回款上升；业主预期和价格纪律下降

3. 找县支行展期，把抵押物重新评估
   代价：银行关系消耗；抵押空间变薄；抽贷风险后移
```

#### 3 分钟循环：一个资产窗口

几回合组成一个资产窗口：

- 看地/城市信号。
- 融资或找联合方。
- 土拍或放弃。
- 拿地后选择持有、抵押、开发、转手、联合开发。
- 项目进入开发/预售/交付压力。

玩家会形成“这局我是怎么拿第一块地、怎么滚第一笔钱、怎么被第一条债追上”的记忆。

#### 30 分钟循环：一条房企命运

一局完整体验：

```text
起盘 -> 首地 -> 首融 -> 首盘预售 -> 扩张/收缩 -> 周期收紧 -> 债务/交付/国资/退出结局
```

长期目标不是简单活到最后，而是形成可命名路线：

- 高周转爆冲型
- 稳交付小老板型
- 国资绑定续命型
- 财技滚债型
- 高点退出型
- 黑灰旧改翻车型
- 债委会接管型

## 5. UI 总规划：一页显示全部核心内容

### 5.1 桌面版目标

目标视口：1366x768，不发生页面级上下滚动。

建议结构：

```text
┌────────────────────────────────────────────────────────────┐
│  顶部状态条：回合 / 阶段 / 现金 runway / 项目期限 / 到期债  │ 48px
├──────────────┬─────────────────────────────────────────────┤
│ 左状态 rail  │ 主工作台：当前焦点对象 + 3 个行动           │
│ 248px        │                                             │
│              │ 土地/项目/融资/关系只显示当前焦点           │
│              │                                             │
├──────────────┴─────────────────────────────────────────────┤
│ 底部工具条：土地 / 项目 / 融资 / 关系 / 账本 / 图鉴         │ 64px
└────────────────────────────────────────────────────────────┘
```

规则：

- 页面级：`height: 100dvh; overflow: hidden;`
- 主工作台：只放当前要处理的东西，不同时铺满所有系统。
- 左状态 rail：只显示 6-8 个关键指标，不放长解释。
- 账本、历史、来源、模型标签：进入右抽屉，默认不占高度。
- 不使用大段说明文、营销式标题、嵌套卡片。

### 5.2 手机版目标

目标视口：390x844 和 430x760，不发生页面级上下滚动。

建议结构：

```text
┌────────────────────────────┐
│ 回合/阶段 + 4 个关键指标   │ 84-96px
├────────────────────────────┤
│ 当前焦点对象               │
│ 例如：河湾 2 号楼 / 土拍地 │
│                            │
│ 3 个行动                   │
│                            │
├────────────────────────────┤
│ 土地 项目 融资 关系 账本   │ 60-68px
└────────────────────────────┘
```

规则：

- 底部 tab 只切换焦点，不改变页面高度。
- 账本/图鉴/历史是底部 sheet，最多 `70dvh`，sheet 内部可以滚动，页面不滚。
- 中文按钮最长两行；超长项目名用短名 + sheet 详情。
- 开局页不能是大段说明，应该直接进入第一桌经营问题。

### 5.3 Start / Event / Office / Scale / Debrief 都要单屏

验收不能只看土拍页。以下状态都必须测：

- 新开局首页。
- 开局后办公室回合。
- 普通事件。
- 土拍选地/出价/联合竞标。
- 项目处理。
- 融资谈判。
- 规模晋级页。
- 结局复盘页。

## 6. 可玩性规划

### 6.1 恢复三选择

任务：

- 修改 `renderEvent()` 中 `event.choices.slice(0, 2)`。
- 默认显示最多 3 个选择。
- 支持事件级字段，例如 `choiceLayout: "binary"` 时显示 2 个。
- 更新 hover/focus hint，保证第 3 个选择也有提示。

验收：

- 数据中 3 个 choices 的事件前台显示 3 个按钮。
- 移动端 390x844 下 3 个按钮不溢出、不遮挡。
- smoke 脚本能断言至少一个三选事件显示 3 个选择。

### 6.2 把办公室菜单改成“老板桌面焦点”

任务：

- 保留 `buildOfficeActionCatalog()`，但新增一层 `buildDeskFocus(context, groups)`。
- 每回合从土地、项目、融资、关系、危机中选一个最紧急焦点。
- 焦点必须返回：
  - `title`
  - `objectType`
  - `objectId`
  - `pressureLine`
  - `nextDeadline`
  - `actions`，最多 3 个
  - `whyNow`，一句话解释为什么现在要处理
- 前台不再默认展示完整分类列表；分类入口放到底部工具条或抽屉。

焦点优先级建议：

1. 现金将在 2 回合内跌破安全线。
2. 项目将在 6 回合内交付/停工/监管户缺口。
3. 土拍/保证金/尾款窗口即将关闭。
4. 债务或利息到期。
5. 关系人/政府/银行/总包压力超过阈值。
6. 没有危机时，展示增长机会。

无危机降级策略：

1. 如果有土地窗口，展示“看地/尽调/放弃”的增长机会。
2. 如果有项目进入可预售或可清盘状态，展示“预售/回款/清盘”的经营机会。
3. 如果融资环境处于宽松周期，展示“低成本融资/提前置换高息债”的机会。
4. 如果关系或竞品压力长期低但未处理，展示“修复关系/侦查竞品”的软机会。
5. 如果所有机会都弱，展示“稳态整理桌面”：还款、补资料、巡项目、暂不扩张。这个动作不应是空过，而是降低未来坏事件权重。

验收：

- 玩家每回合第一眼能看到“现在为什么急”。
- 前台主区域最多 3 个主动作。
- 分类动作仍可在抽屉里查看，但不会撑高页面。

### 6.3 让选择后果更可解释

任务：

- 每个行动按钮显示代价方向，不显示精确公式。
- 选择后显示一行结果 toast：`现金紧了，但河湾 2 号楼没有停工。`
- 下回合如果触发因果事件，标题旁显示来源：`上次压总包留下的证据包发酵了。`
- 减少 `randomizedEffect()` 对关键指标的不可解释抖动，至少在新焦点动作中改为确定性或 seed 抖动。

验收：

- 玩家能从 UI 理解“为什么发生这件事”。
- 结局复盘里能追到 3-5 个关键前因，而不是只列数值。

## 7. 丰富度规划

### 7.1 土地持有层

当前有 `landRegistry` 和 `auctionDesk`，但前台的拿地后决策还不够有资产经营感。

新增土地状态：

- `watching`：关注地块。
- `due_diligence`：尽调中。
- `bid_won`：拍下但未完全转化。
- `held`：持有土地。
- `planned`：已做项目方案。
- `mortgaged`：已抵押。
- `joint_development`：联合开发。
- `distressed_sale`：压力处置。
- `frozen`：被保全/冻结。

新增拿地后动作：

- 暂缓开发，等规划/配套利好。
- 抵押融资，换现金但增加抵押折价风险。
- 找联合方，降低现金压力但损失控制权。
- 快速转手，获得现金但留下交易/税务/关系风险。
- 立刻转项目，进入预售和交付压力。

验收：

- 土拍赢了以后，玩家下一回合不是自动进入下一题，而是必须处理这块地。
- 每块地能在账本/地图中看到状态、成本、抵押、合作方、处置窗口。

### 7.2 项目对象化

当前已有 `projectLedger.projects`，但项目行动仍偏全局。

任务：

- 项目 tab 显示最多 3 个最重要项目。
- 每个项目显示：
  - 阶段：土地/开工/预售/交付/清盘/风险处置。
  - 现金缺口。
  - 监管户余额。
  - 未售货值。
  - 总包/业主/政府压力。
  - 下一期限。
- 项目动作必须绑定 `selectedProjectId`：
  - 补监管户。
  - 催按揭回款。
  - 加速施工。
  - 降价出货。
  - 停工保现金。
  - 卖项目股权。
  - 请求国资/专班接盘。

验收：

- 同一动作在不同项目上有不同后果。
- 结局能指出是哪个项目拖垮现金、交付或法律线。

### 7.3 融资和关系从“数值”变成“报价”

任务：

- 融资 tab 不只显示按钮，而显示 2-3 个报价：
  - 银行续贷：利率低，披露高，抽贷风险。
  - 信托/小贷：速度快，成本高。
  - 朋友/关系人：现金少，情分债重。
  - 地下短钱：立即解决现金，老板安全和黑灰风险恶化。
- 关系 tab 显示“可用人”和“立场”：
  - 银行行长：愿意展期，但要求抵押和销售数据。
  - 总包老板：愿意撑一周，但要付款承诺。
  - 地方口：可以协调，但会绑定保交楼任务。

验收：

- 玩家看到的是可比较报价，不是抽象“找银行/找朋友”。
- 关系高低影响报价质量、期限、后续事件权重。

### 7.4 竞品可见化

当前 `competitorRoster` 和土拍 competitors 已存在，但玩家感知有限。

任务：

- 在桌面焦点旁显示一个竞品动向：
  - 同城竞品降价。
  - 国企对手拿白名单。
  - 民企对手抢渠道。
  - 旧竞争对手匿名举报。
- 竞品行为影响土拍价格、销售、媒体、银行信心、地方态度。

验收：

- 玩家能感到市场不是只有自己和事件库。
- 至少 3 类竞品行为能跨系统影响后续回合。

## 8. 长期留存规划

### 8.1 Seed 和每日局

任务：

- 新增 `runSeed`，拆为：
  - `macroSeed`：周期/政策/利率。
  - `mapSeed`：城市、地块、供应。
  - `rivalSeed`：竞品画像。
  - `eventSeed`：事件和因果队列。
  - `auctionSeed`：土拍行为。
- 支持“随机开局”和“输入 seed 开局”。
- 支持“今日局”：日期生成固定 seed，例如 `2026-05-02`。

验收：

- 自动验收按 Phase 5 覆盖矩阵执行：同 seed + 同脚本化策略复现关键路径，不声称旧随机已全部可复现。
- 人工试玩审查不同 seed 的市场、地块、竞品、事件是否能被玩家感知为不同。
- 结局页显示 seed，玩家可以复制。

### 8.2 开局身份

当前只有一个 `DATA.origins[0]`。

建议新增 5 个开局：

- 县城包工头：施工关系强，银行弱，现金薄。
- 渠道销售出身：销售强，项目弱，容易高佣金依赖。
- 城投边缘白手套：政府强，控制权风险高。
- 总包转开发：工程强，融资弱，供应商关系复杂。
- 金融操盘手：融资强，交付弱，法律/披露风险高。

每个身份改变：

- 初始现金/债务/关系。
- 第一批可见行动。
- 事件权重。
- 可解锁成就/路线。

验收：

- 玩家重开时不是只换数值，而是换经营手感。
- 每个身份 10 回合内出现至少 2 个专属问题。

### 8.3 机制图鉴和结局图鉴

任务：

- 新增 `meta save`，不随单局清空。
- 记录：
  - 已见结局。
  - 已见机制标签。
  - 已完成路线。
  - 已触发关键事件链。
  - 最高资产/最短爆雷/最稳交付等统计。
- 图鉴不喧宾夺主，只在结局页和抽屉里出现。

验收：

- 刷新页面不会丢失图鉴。
- 新开局不会清掉长期记录。
- 结局页给玩家一个“下一局想试什么”的目标。

### 8.4 遗产局 / New Game+

不继承现金，避免破坏平衡；继承“声誉/旧账/审计影子/人脉印象”。

例子：

- 上局高点退出：下一局开局多一个投资人机会，但地方对你更警惕。
- 上局黑灰翻车：下一局旧改/土方相关事件更危险。
- 上局稳交付：下一局银行报价更好，但扩张速度慢。

验收：

- 遗产是新风险和新路线，不是纯奖励。
- 玩家愿意为了路线图鉴重开，而不是只追最高分。

## 9. 随机性规划

### 9.1 随机必须分层

必须拆开：

- 宏观随机：周期、利率、政策、棚改/保交楼。
- 地图随机：城市、地块、配套、库存。
- 对手随机：竞品风格、土拍策略、举报/降价倾向。
- 事件随机：突发事件权重、延迟回合。
- 结果随机：小范围波动和风险判定。

这样玩家会觉得“世界不同”，而不是“作者随机扣我分”。

### 9.2 随机必须可解释

每个突发事件展示一条来源：

- `周期收紧：三道红线阶段，银行风险偏好下降。`
- `旧选择发酵：你 3 回合前压了总包，现在证据包递到住建。`
- `竞品动作：国企对手低价开盘，银行重新看你的销售回款。`

### 9.3 随机不能取消策略

同样策略在不同 seed 下可以有差异，但不能让玩家觉得策略无效。

验收：

- 高风险动作不一定立刻炸，但会提高未来权重。
- 低风险动作不一定赚大钱，但能降低未来坏事件概率。
- 结局复盘能解释主要风险来源。

## 10. 分阶段实施计划

### Phase 0：冻结基线和测试保护

文件：

- `.omx/plans/real-estate-tycoon-github-base-playability-redesign-20260502.md`
- `scripts/real-estate-tycoon-smoke.mjs`
- `.local/planning-screens/*` 和 `.local/real-estate-tycoon-smoke/*`，作为验证产物

任务：

- 记录当前 GitHub 基线状态。
- 跑 `npm run build` 和 `node scripts/real-estate-tycoon-smoke.mjs`。
- 先重写 smoke 护栏的目标定义：旧的“默认进入土拍地图”断言必须废弃。
- 新 smoke 要覆盖 `start / office / event / scale / debrief`，并覆盖 1366x768、390x844、430x760。
- 新 smoke 的第一目标不是保住旧 DOM，而是证明页面级无滚动、关键按钮不重叠、主动作可见。
- Phase 0 只改验证脚本和计划，不改游戏源码行为。

验收：

- 构建通过。
- smoke 能在旧基线上跑出“当前问题基准”，并能为 Phase 1-2 的新目标提供断言。
- smoke 不再断言 land map 必须是默认办公室屏。
- 有桌面和手机截图作为改版前基准。
- 明确记录：现有 land-map-first 行为是旧基线现象，不是未来验收目标。

### Phase 1：单屏工作台骨架

文件：

- `src/simulators/real-estate-tycoon/index.html`
- `src/simulators/real-estate-tycoon/style.css`
- `src/simulators/real-estate-tycoon/app.js`
- `scripts/real-estate-tycoon-smoke.mjs`
- `docs/simulators/real-estate-tycoon/*`，由 build 生成

任务：

- 把 `game-shell` 改成 fixed viewport app shell。
- 把状态栏压成 `top summary` 或左 rail。
- 主面板改成 `workbench`，只放当前焦点。
- 账本、来源、历史、模型标签放进 drawer/sheet。
- 修 start screen：不再是长说明首页；开局页直接给“第一桌事”。
- 修 debrief：单屏摘要 + tabs/sheet，不再长页面滚动。

验收：

自动可测：

- 1366x768、390x844、430x760 都无页面级 vertical scroll。
- `start / office / event / scale / debrief` 五种状态都通过无滚动断言。
- 当前焦点、关键指标、主动作按钮同时可见。
- 按钮和底部工具条的 bounding boxes 不重叠。

人工试玩审查：

- 首屏不像文章说明页，像可操作游戏桌面。
- 不依赖 sticky dock 遮住内容。
- 中文按钮最长两行，移动端不挤压到不可读。

### Phase 2：三选择和老板桌面焦点

文件：

- `src/simulators/real-estate-tycoon/app.js`
- `src/simulators/real-estate-tycoon/data.js`
- `src/simulators/real-estate-tycoon/style.css`
- `scripts/real-estate-tycoon-smoke.mjs`
- 可能新增 `src/simulators/real-estate-tycoon/systems/desk/README.md`
- 可能新增 `src/simulators/real-estate-tycoon/systems/desk/focus.js`

任务：

- 事件恢复 3 选择。
- 如果要支持二选一轻事件，在 `data.js` 写入显式字段，例如 `choiceLayout: "binary"`；不得再用统一 `slice(0, 2)` 隐式裁剪。
- 新增 `buildDeskFocus()`，把后台动作池转成 1 个焦点 + 3 个动作。
- 行动按钮显示代价方向。
- 选择结果进入一行 toast，下一回合能显示因果来源。

验收：

自动可测：

- 至少一个普通事件显示 3 个选择。
- 标记 `choiceLayout: "binary"` 的事件只显示 2 个选择。
- 办公室回合主区域主动作数量为 1-3。
- 每个主动作 DOM 内有代价方向文案。
- 选择后出现一行结果反馈。

人工试玩审查：

- 办公室回合不再默认铺满分类菜单。
- 玩家能快速看懂“为什么现在要处理这件事”。
- 无危机回合展示增长机会或稳态整理，而不是空白菜单。

### Phase 3：土地持有层

文件：

- `src/simulators/real-estate-tycoon/app.js`
- `src/simulators/real-estate-tycoon/systems/auction/map-view.js`
- `src/simulators/real-estate-tycoon/systems/auction/README.md`
- `src/simulators/real-estate-tycoon/style.css`
- `scripts/real-estate-tycoon-smoke.mjs`
- 可能新增 `src/simulators/real-estate-tycoon/systems/auction/holdings.js`

任务：

- 土拍赢得地块后写入明确 `landRegistry` 状态。
- 新增拿地后动作：持有、抵押、联合开发、转手、立项。
- 地图/账本显示土地状态和窗口。
- 土地动作影响融资、项目、关系、后续事件。

验收：

自动可测：

- 脚本化赢地后，`landRegistry` 写入对应地块和状态。
- 下一回合 desk focus 能选中该地块或提示处理该地块。
- 地图或抽屉中能读到该地块状态文本。
- 至少 5 条后续动作/事件读取 `landRegistry` 状态。

人工试玩审查：

- 赢地后不是“自动进入下一题”，而是玩家明显感到多了一项资产责任。

### Phase 4：项目对象化

文件：

- `src/simulators/real-estate-tycoon/app.js`
- `src/simulators/real-estate-tycoon/style.css`
- `src/simulators/real-estate-tycoon/systems/project/README.md`
- `scripts/real-estate-tycoon-smoke.mjs`
- 可能新增 `src/simulators/real-estate-tycoon/systems/project/actions.js`

任务：

- 项目动作绑定具体 `projectId`。
- 项目卡显示缺口、监管户、未售货值、交付期、压力主体。
- 项目动作结果写回 `projectLedger.projects[]`。
- 结局证据指向具体项目。

验收：

自动可测：

- 两个项目同时存在时，DOM 中能分别选择不同项目。
- 选择项目动作后，变化写回对应 `projectId`，不误改其他项目。
- 结局/复盘数据能引用具体项目名称。

人工试玩审查：

- 玩家能理解每个项目的现金缺口、期限和压力主体。

### Phase 5：可解释 seed 随机

文件：

- 可能新增 `src/simulators/real-estate-tycoon/systems/random/seeded-rng.js`
- `src/simulators/real-estate-tycoon/app.js`
- `scripts/real-estate-tycoon-smoke.mjs`
- 可能新增 `scripts/real-estate-tycoon-seed-check.mjs`

任务：

- 创建轻量 PRNG，不加依赖。
- `createGame()` 写入 `runSeed` 和子 seed。
- 先覆盖新 desk focus、土地、项目、事件权重的关键随机。
- 结局页显示 seed。
- 支持手动 seed 和今日局。

验收：

自动可测覆盖矩阵：

| 覆盖项 | Phase 5 必须复现 | Phase 5 不强求 |
| --- | --- | --- |
| 开局 | `runSeed`、`macroSeed`、`mapSeed`、`rivalSeed`、`eventSeed`、`auctionSeed` 相同 | 旧存档迁移后的全部历史随机 |
| 地块 | 同 seed 下初始地块 id、城市、起拍价、基础标签相同 | 旧系统中所有价格漂移完全一致 |
| desk focus | 同 seed + 同脚本化 15 步操作，焦点类型和焦点对象相同 | 人工自由操作路径完全相同 |
| 事件 | 同 seed + 同脚本化 15 步操作，触发事件 id 和来源类型相同 | 所有旧 `Math.random()` 调用都已替换 |
| 竞品/土拍 | 同 seed 下竞品画像、首轮土拍关键行为一致 | 所有竞价微抖动都完全一致 |
| 结局 | 同 seed + 同脚本化策略，结局 id 相同 | 任意非脚本化玩法都完全可复现 |

人工试玩审查：

- 今日局每一天固定，结局页显示 seed，玩家可以复制。
- 随机事件显示来源，玩家能理解主要坏事来自周期、旧选择、竞品还是外部冲击。

### Phase 6：长期留存和图鉴

文件：

- `src/simulators/real-estate-tycoon/index.html`
- `src/simulators/real-estate-tycoon/app.js`
- `src/simulators/real-estate-tycoon/data.js`
- `src/simulators/real-estate-tycoon/style.css`
- `scripts/real-estate-tycoon-smoke.mjs`
- 可能新增 `src/simulators/real-estate-tycoon/systems/meta/progression.js`

任务：

- 删除启动即 `localStorage.removeItem(SAVE_KEY)` 的行为。
- 拆 `SAVE_KEY` 和 `META_SAVE_KEY`。
- 进入页面时采用显式双入口：
  - 有未结束存档：显示“继续上局”和“新开一局”。
  - 没有存档：主按钮为“开始新局”。
  - “回到首页”仍保留，但不能再叫 `continue` 或误导玩家。
  - “清空当前局”和“清空全部记录”分开，后者必须清 meta。
- 旧 `SAVE_KEY` 迁移策略：保留当前 key 读取；新增 schema version；如果版本过旧无法迁移，只清 run save，不清 meta save。
- 新增结局图鉴、机制图鉴、路线统计。
- 新增 3-5 个开局身份。
- 结局页给出下一局目标。

验收：

自动可测：

- 刷新后可以继续当前局。
- 单局重开不清长期图鉴。
- “清空当前局”不清 `META_SAVE_KEY`。
- “清空全部记录”同时清 run save 和 meta save。
- 至少 5 个结局、10 个机制标签可被记录展示。

人工试玩审查：

- 首页按钮语义清楚，不再把“回到首页”叫成继续。
- 结局页能给出下一局目标，而不是只有失败复盘。

### Phase 7：内容扩展和调平

文件：

- `src/simulators/real-estate-tycoon/data.js`
- 可能新增系统内容文件，视 Phase 2-6 的拆分结果而定

任务：

- 不盲目加事件，优先加事件链。
- 每个新增身份至少 6 个专属事件/动作。
- 每类土地状态至少 2 个后续钩子。
- 每类债务至少 2 个正/负后续。
- 调整结果概率，避免“随机秒杀”和“唯一正确菜单”。

验收：

自动可测：

- 一局 15 回合脚本路径内至少出现 3 次前因后果回声。
- 固定 3 条策略各跑 20 个 seed，记录胜率、平均回合、主要结局；任一策略如果胜率超过其他策略 35 个百分点以上，需要重新平衡或解释。
- 每个新增身份至少能触发 2 个专属早期问题。

人工试玩审查：

- 10 局不同 seed 出现能被玩家感知的不同路线。
- 没有一个固定动作序列在多数 seed 下无脑最优。

## 11. 验证计划

验收分两类：

- 自动可测：必须写进 smoke、seed check 或脚本化验证，失败就不能交付。
- 人工试玩审查：用于判断“是否好玩/是否清楚”，必须截图或记录试玩路径，但不伪装成完全自动的测试。

每个 phase 都要至少运行：

```bash
npm run build
node scripts/real-estate-tycoon-smoke.mjs
```

UI phase 自动可测：

- 截图：1366x768 desktop。
- 截图：390x844 mobile。
- 截图：430x760 mobile。
- 检查 `document.documentElement.scrollHeight <= window.innerHeight + 1`。
- 检查关键按钮矩形不重叠。
- 检查 action rail/drawer 不遮挡主按钮。
- 检查 `start / office / event / scale / debrief` 五类状态。

UI phase 人工试玩审查：

- 第一屏是否像游戏桌面，而不是文章页。
- 主要状态是否足够少，且能解释当前压力。
- 移动端按钮是否可读、可点、无遮挡。

玩法 phase 自动可测：

- 三选择事件断言。
- 10 回合脚本化路径：每回合都有焦点和 1-3 个动作。
- 因果来源断言：至少一个后续事件包含前因。
- seed 复现断言按 Phase 5 覆盖矩阵执行，不声称未迁移的旧随机完全复现。

玩法 phase 人工试玩审查：

- 每回合是否真的需要取舍，而不是照菜单点最佳按钮。
- 3-5 回合后是否能感到旧选择回来影响局面。
- 失败复盘是否解释了关键前因。

长期留存 phase 自动可测：

- 刷新后继续当前局。
- 结束一局后图鉴保留。
- 清空当前局不清 meta，除非点“清空全部记录”。

长期留存 phase 人工试玩审查：

- 首页继续/新开/回首页/清空的语义是否清楚。
- 图鉴和下一局目标是否增加重开动机，而不是打断主流程。

## 12. 自我审查记录

### 12.1 初始冲动：重写成更“刺激”的跑商游戏

审查结果：否决。

原因：

- 用户已经明确觉得刚才的房地产小游戏设计不好，并要求回到 GitHub 版本。
- GitHub 基线已经有更丰富的房地产系统：融资、项目、土拍、关系、事件因果和结局。
- 重新做“亡命高周转”会丢掉这些系统，也和用户“从上次上传 GitHub 的版本作基础”冲突。

保留的只有一个经验：单屏 smoke 和移动端不滚动是有价值的，应迁移为验证标准，而不是迁移那套玩法。

### 12.2 初始冲动：多加事件，显得丰富

审查结果：否决。

原因：

- 当前已有 126 个事件和 16 个结局，问题不是内容数量。
- 如果前台循环还是菜单/长文/二选一，多加事件只会让疲劳更重。

修订：

- 先做“事件如何被玩家看见、选择如何留下后果、后果如何回声”。
- 新内容优先做链条，不做孤立段子。

### 12.3 初始冲动：照 Reigns 做极简二选一

审查结果：部分否决。

原因：

- Reigns 的强项是少按钮和后果，但房地产经营需要主动行为和资产对象。
- 当前代码已经有土地、项目、融资对象；纯二选一会浪费题材。

修订：

- 采用“一桌事 + 3 动作”的结构，而不是左右滑二选一。

### 12.4 初始冲动：照 Wall Street Raider 做深金融面板

审查结果：阶段性否决。

原因：

- 早期玩家不是来读金融终端。
- 手机单屏会被仪表盘压垮。

修订：

- 深金融只在中后期作为系统背景和结局证据出现。
- 前台表达为报价、期限、抵押、抽贷、债委会，而不是复杂交易屏。

### 12.5 初始冲动：把所有按钮放在底部 tab

审查结果：否决。

原因：

- 底部 tab 能解决入口，但不能创造决策压力。
- 如果土地/融资/项目/关系常驻平铺，玩家还是像操作后台。

修订：

- 底部 tab 只做切换/查看。
- 主回合必须由系统挑出“当前焦点”，推动玩家做决定。

### 12.6 初始冲动：把 UI 先完全重做

审查结果：修订。

原因：

- UI 是用户显性不满意点，但如果只重排页面，游戏仍不长期好玩。
- 反过来，如果先做复杂机制，现有 UI 装不下。

修订：

- Phase 1 先建单屏工作台骨架。
- Phase 2 立刻把核心回合变成“焦点 + 三动作”。
- 后续丰富度全部围绕这个工作台接入。

### 12.7 critic 审核：初版计划不够可执行

审查结果：接受并修订。

critic 指出的硬问题：

- 旧 smoke 会把“默认土拍地图”锁成必须保留的行为。
- seed 验收说得太满，但当前仍有大量旧 `Math.random()`。
- phase 文件边界不完整，会让执行者猜要改哪些文件。
- 长期留存没有定义“继续一局”的入口。
- 竞品对比还缺“洞见 -> 文件 -> phase -> 验收”的落地表。

已修订：

- Phase 0 改成先处理 smoke 护栏。
- 验收全部拆成自动可测和人工试玩审查。
- Phase 1-6 补充必改文件。
- Phase 5 增加 seed 覆盖矩阵。
- Phase 6 增加显式继续/新开 UX。
- Section 3.11 增加竞品洞见落地表。

## 13. 推荐执行顺序

推荐先做 Phase 0-2，形成可评审 MVP：

1. 基线验证、截图、重写 smoke 护栏，废弃“默认土拍地图”断言。
2. 单屏工作台骨架。
3. 三选择 + 老板桌面焦点。

这三步完成后，用户就能直接判断“这是不是比现在好玩”。如果这个基本手感不对，后面的土地持有、项目对象化、长期留存都不该继续堆。

第二批做 Phase 3-5：

4. 土地持有层。
5. 项目对象化。
6. seed/每日局。

第三批做 Phase 6-7：

7. 长期图鉴/身份/遗产局。
8. 内容链扩展和调平。

## 14. 最小可交付版本

如果只允许一次小改，最低限度应该交付：

- 新 smoke 不再锁死旧土拍默认入口。
- 无页面级滚动的单屏工作台。
- 普通事件恢复 3 个选择。
- 办公室回合显示一个焦点和 3 个动作。
- 选择后有一行结果反馈。
- build + smoke 通过。

这不会解决长期留存，但会先解决“设计不好、像网页、不可玩”的第一层问题。

## 15. 完整可交付版本

完整版本应该交付：

- 单屏桌面/手机 UI。
- 3 层循环：回合、资产窗口、整局命运。
- 土地持有层。
- 项目对象化。
- 融资报价和关系报价。
- 可见竞品行为。
- seed 和每日局。
- 结局/机制/路线图鉴。
- 多身份开局。
- 遗产局。
- 完整 smoke、截图、seed 复现验证。

## 16. 风险和应对

风险：单屏 UI 过度压缩，信息看不懂。

应对：主屏只放当前焦点；详细账本放 drawer/sheet；按钮文案控制两行。

风险：3 个动作仍像菜单。

应对：动作必须具体到对象，例如“给河湾 2 号楼补监管户”，禁止只写“融资”“关系”“项目”。

风险：seed 改造范围太大。

应对：先用 PRNG 覆盖新系统，旧 `Math.random()` 逐步迁移，不在一个 phase 里大清洗。

风险：长期留存污染当前调试流程。

应对：保留“清空当前局”和“清空全部记录”两个明确按钮，测试脚本用参数或测试环境清理。

风险：内容越来越多，文件继续膨胀。

应对：新增机制放 `systems/` 子目录，并更新对应 README；`app.js` 只做调度。

风险：过度学习竞品导致风格混乱。

应对：只借机制，不借表皮。核心仍是“颖响力房地产经营知识游戏”。

## 17. 执行时文件边界

优先可改：

- `src/simulators/real-estate-tycoon/index.html`
- `src/simulators/real-estate-tycoon/style.css`
- `src/simulators/real-estate-tycoon/app.js`
- `src/simulators/real-estate-tycoon/data.js`
- `src/simulators/real-estate-tycoon/systems/*/README.md`
- 必要新增 `src/simulators/real-estate-tycoon/systems/desk/`
- 必要新增 `src/simulators/real-estate-tycoon/systems/random/`
- 必要新增 `src/simulators/real-estate-tycoon/systems/meta/`
- `scripts/real-estate-tycoon-smoke.mjs`

由构建生成：

- `docs/simulators/real-estate-tycoon/index.html`
- `docs/simulators/real-estate-tycoon/style.css`
- `docs/simulators/real-estate-tycoon/app.js`
- `docs/data/site.json` 如 build 更新版本/时间，需要审查是否任务相关

不应碰：

- EP125 图片和 cover tools。
- 其他 episode 内容。
- 旧的 `.omx/plans/real-estate-hun-redesign-plan-20260502.md`，除非用户要求归档/标记废弃。

## 18. 最终验收定义

这次改版成功，不是因为页面更漂亮，而是满足以下条件：

1. 玩家开局 10 秒内知道自己是谁、现在最危险的事、可以做哪 3 件事。
2. 一回合选择后，玩家能感到现金、项目、关系、土地或风险真的改变了。
3. 3-5 回合后，之前的选择能以事件/报价/限制的方式回来。
4. 手机和桌面都不需要页面上下滚动才能玩核心回合。
5. 一局失败后，结局能解释“哪几个决定把你带到这里”。
6. 玩家有理由重开：不同 seed、不同身份、不同路线、未解锁结局/机制。
7. 构建和 smoke 通过，有截图证据。

## 19. 审核后建议

用户审核时建议重点看三件事：

- 是否同意“保留 GitHub 基线后台系统，不再走刚撤回的跑商重写”。
- 是否同意“先做单屏工作台 + 三选择 + 老板桌面焦点”，再做土地/项目/seed/长期留存。
- 是否同意“按钮必须是具体经营动作，不是功能分类”。

只有这三点通过，后续源码修改才值得开始。

## 20. 执行完成记录

完成时间：2026-05-02

实际执行范围：

- 完成 Phase 0-7。
- 保留 GitHub 基线的房地产经营系统，不再使用已撤回的“亡命高周转/跑商”路线。
- 首屏、经营回合、升阶、结算页都纳入单屏视口验证。
- 普通事件恢复三选项；办公室回合改为老板桌面焦点和 1-3 个高优先级行动。
- 土地竞得后形成“持有/抵押/转项目”状态闭环。
- 项目页改为具体项目对象操作，可在多个项目间切换目标。
- 引入 seed/daily PRNG、运行签名和可复盘 smoke。
- 启用继续上局、清空记录、多身份开局和 meta 长期记录。
- 加入 3 策略 x 20 seed 的平衡性 probe。

最终验证：

- `npm run build`
- `node scripts/real-estate-tycoon-smoke.mjs`
- `git diff --check`
- smoke 产物位于 `.local/real-estate-tycoon-smoke/`

审核结论：

- 独立 verifier 结论：PASS，无 blocker。
- verifier 提到的 scale/debrief 视口覆盖缺口已补入 smoke，并据此修复了移动端升阶页页面级滚动。
- seed 当前采用运行级 `runSeed + rngState`，未拆成 macro/map/rival/event/auction 多子 seed；复盘和同 seed 重放目标已经满足，后续若要做更强的“同城同盘分系统复盘”，再拆子 seed。
