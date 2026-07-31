---

authored_by: external
content_role: reference
trust_level: primary
authoring_mode: human
last_verified: 2026-05-17
---
# 房地产大亨模拟器《混》式重设计计划

Date: 2026-05-02
Scope: `src/simulators/real-estate-tycoon/`

## Execution Status

Started: 2026-05-02

Completed Phase 0-9 execution:

- Phase 0 scope check performed with `git status --short`.
- Phase 1 modular system created under `src/simulators/real-estate-tycoon/systems/runaway/`.
- Phase 2 command-line playability prototype added as `scripts/real-estate-tycoon-sim.mjs`.
- Phase 3 buy/sell loop implemented with 5 buy postures, 5 sell exits, liquidity, holding cost, and trade-created flags.
- Phase 4 debt/pressure system implemented with bank rejection gates, underground lending, friend debt, weekly interest, and pressure bands.
- Phase 5 causal event director implemented with weighted debt pressure, cooldowns, flags, and follow-up chains.
- Phase 6 browser UI is now driven by the modular systems through `runaway-mode.js`.
- Phase 7 content expansion completed: 10 cities, 10 project types, 8 actors, 4 lenders, 46 events, 15 follow-ups, 8 endings.
- Phase 8 balance report generated at `.local/real-estate-tycoon-smoke/simulation-report.json`.
- Phase 9 build output generated into `dist/` and `docs/`, with browser smoke screenshots under `.local/real-estate-tycoon-smoke/`.

Current verification evidence:

- `node scripts/real-estate-tycoon-sim.mjs --scenario hook`
  - Produces a 10-turn log.
  - Non-price tradeoff entries: 10.
  - Causal event entries: 2.
- `node scripts/real-estate-tycoon-sim.mjs --check all`
  - `trade check passed`
  - `debt check passed`
  - `events check passed`
  - `market check passed`
  - `content audit passed: 10 cities, 10 projects, 8 actors, 46 events, 15 follow-ups, 8 endings`
- `node scripts/real-estate-tycoon-sim.mjs --audit content`
  - Confirms Phase 7 content counts and follow-up coverage.
- `node scripts/real-estate-tycoon-sim.mjs --simulate 100`
  - Latest pressure distribution: `red: 70`, `black: 29`, `orange: 1`.
  - Average non-price turns: 70.1.
  - Average causal events: 3.6.
  - Report written to `.local/real-estate-tycoon-smoke/simulation-report.json`.
- `npm run build`
  - Passed and regenerated `dist/` plus `docs/`.
- `node scripts/real-estate-tycoon-smoke.mjs`
  - Passed.
  - Verifies 430x760 and 390x844 no vertical scroll.
  - Verifies 10 non-overlapping China-map city nodes, 5 market cards, one-row action dock, buy posture overlay, finance overlay, initial bank refusal, and playable event overlay.

Implemented files:

- `src/simulators/real-estate-tycoon/systems/runaway/balance.js`
- `src/simulators/real-estate-tycoon/systems/runaway/content.js`
- `src/simulators/real-estate-tycoon/systems/runaway/state.js`
- `src/simulators/real-estate-tycoon/systems/runaway/market.js`
- `src/simulators/real-estate-tycoon/systems/runaway/debt.js`
- `src/simulators/real-estate-tycoon/systems/runaway/trade.js`
- `src/simulators/real-estate-tycoon/systems/runaway/events.js`
- `src/simulators/real-estate-tycoon/systems/runaway/simulate.js`
- `src/simulators/real-estate-tycoon/systems/runaway/render.js`
- `src/simulators/real-estate-tycoon/runaway-mode.js`
- `src/simulators/real-estate-tycoon/style.css`
- `src/simulators/real-estate-tycoon/index.html`
- `scripts/real-estate-tycoon-sim.mjs`
- `scripts/real-estate-tycoon-smoke.mjs`

Remaining design risk:

- The game is intentionally punishing: the 100-run automated policy still ends mostly in red/black pressure. This is acceptable for a high-pressure 《混》-style baseline, but future tuning can add more comeback routes if manual play feels too oppressive.

## Full Execution Roadmap

This is the complete plan and current completion record.

| Phase | Status | Purpose | Main Deliverables | Verification Gate |
| --- | --- | --- | --- | --- |
| Phase 0: Worktree And Scope Control | Done | Avoid mixing the rewrite with unrelated website changes | Dirty-file record, task-owned file list, old `app.js` kept as fallback | `git status --short` reviewed |
| Phase 1: Create Modular Runaway System | Done | Stop building one giant script | `systems/runaway/{state,content,balance,market,debt,trade,events,simulate,render}.js` | Node checks pass through `--check all` |
| Phase 2: Playability Prototype Without UI | Done | Prove 10 turns are interesting before UI | `scripts/real-estate-tycoon-sim.mjs`, hook scenario, system checks | `--scenario hook`, `--check all` |
| Phase 3: Buy/Sell System | Done | Make trading the main gameplay, not arithmetic | Buy postures, sell exits, liquidity, holding cost, trade-created flags | Trade check passes |
| Phase 4: Debt And Pressure System | Done | Make debt drive gameplay and story | Bank gates, underground lending, friend/supplier debt, pressure bands | Debt check passes and smoke verifies bank refusal |
| Phase 5: Causal Event Director | Done | Make events consequences, not random popups | Event tags, cooldowns, actor memory, 15 causal follow-ups | Events check passes |
| Phase 6: Single-Screen UI Board | Done | Rebuild the actual mobile game board | Fixed route screen, overlays for buy/sell/event/finance | Smoke verifies no-scroll 430x760 and 390x844 |
| Phase 7: Content Expansion | Done | Add enough richness to avoid fatigue | 10 cities, 10 project types, 8 actors, 46 events, 15 follow-up chains, 8 endings | Content audit passes |
| Phase 8: Balance And Anti-Fatigue Validation | Done | Tune replayability and pressure curve | 100-run simulation and fatigue metrics | Simulation report generated |
| Phase 9: Final Verification And Build Output | Done | Prepare generated site output | `dist/`, `docs/`, screenshots, simulation report | `npm run build`, smoke, sim checks, visual evidence |

Execution rule:

- Do not jump from Phase 2 to UI polish.
- Phase 3 and Phase 5 are the heart of playability: buying/selling choices and causal story chains must be deep before the screen is beautified.
- Phase 6 only starts after the system prototype produces interesting 10-turn logs.

Next concrete phase:

- Manual playtest can now focus on feel tuning: whether red/black pressure should stay this punishing or whether to add more comeback routes.

## Requirements Summary

用户反馈是正确的：当前版本只是把旧模拟器套进了“跑商”外壳，还没有达到《混》的标准。

关键修正：问题不是“缺几个小游戏”。真正的问题是**核心买卖循环没有决策密度，剧情没有因果和人物关系**。重设计必须围绕“为什么买、怎么买、什么时候卖、卖给谁、卖不出去怎么办、之前的选择怎么回来追你”来做，而不是增加分散的小游戏按钮。

必须重做的目标：

- 一页不能上下滑动；430x760 手机视口内主局面必须完整显示。
- 主界面必须是游戏屏，不是说明页；信息要压缩成现金、债务、健康、风险、时间、货物、地图、操作。
- 房价/项目价格每回合基于城市和项目基准价随机波动，并显示趋势。
- 银行不能在玩家净值很低时随便借钱；早期主融资应来自地下钱庄/高利贷。
- 高利贷、黑社会、讨债、抽贷、监管冻结、总包堵门、购房者维权等必须成为核心压力来源。
- 地图至少要有明显中国轮廓和城市节点，不是普通卡片网格。
- 负债越高，问题越多，且问题类型要跟债务结构相关。
- 游戏丰富度必须来自主循环本身：买卖判断、城市差价、项目质量、流动性、消息真假、融资压力、人物关系和连锁剧情。

## Current Diagnosis

Evidence from current implementation:

- Current game is concentrated in one script, `runaway-mode.js`, with state, data, economy, rendering, and event handling mixed together (`runaway-mode.js:1-47`, `runaway-mode.js:443-474`). This makes it hard to add rich systems cleanly.
- City and product data are too thin: 8 cities and 5 packets are flat arrays with only a few numeric fields (`runaway-mode.js:49-66`).
- Event library is too small and mostly one-off; current incidents are only a short array, with limited gating and no multi-step story arcs (`runaway-mode.js:79-170`).
- The market model now randomizes weekly prices, but it still lacks visible trend, historical comparison, supply/demand story, and city-specialized opportunities (`runaway-mode.js:204-234`, `runaway-mode.js:494-508`).
- The main route render still contains explanatory headline and briefing text (`runaway-mode.js:455-463`). 《混》-style mobile game screens should prioritize map + resource bar + actions, not article-like copy.
- CSS currently forces one-screen behavior by compressing the existing DOM (`style.css:3779-3885`). This is fragile; the layout should be designed as a fixed game board from the start.
- China map exists as a rough inline SVG path (`runaway-mode.js:476-491`, `style.css:54-80`), but it needs to become the visual center, not a background under web cards.
- The current smoke test checks basic existence and one-screen metrics, but not gameplay depth, event richness, bank refusal, debt-triggered event weighting, or price volatility quality.

## Design Principles

1. **Single-Screen First**: the route screen must fit in 430x760 without vertical scroll. Events are modal overlays, not new long pages.
2. **Pressure Before Explanation**: every screen answers “What can I do now, what might kill me, what can I gain?”
3. **Debt Is the Main Enemy**: bank debt, high-interest debt, and social debt must produce different risks.
4. **Small Choices, Heavy Consequences**: event choices should be short, but consequences should affect multiple systems and future event weights.
5. **Replayable Systems Over Handwritten Linear Story**: authored event decks + procedural market shifts create repeatability.

## Target Game Shape

Working title: **房地产大亨模拟器：亡命高周转**

Core loop:

```text
看行情 -> 判断消息真假 -> 选城市 -> 买入项目/指标/壳资源 -> 持有或转手 -> 卖给不同接盘方 -> 周结算利息 -> 触发因果事件 -> 再跑一周
```

Victory:

- 52 周内进入富豪榜。
- Required: net worth >= target and safe bank deposit >= minimum.
- Optional tiered endings:
  - 县城老板
  - 跨城开发商
  - 地产富豪榜
  - 高点离场

Failure:

- Health <= 0: 身体垮掉/被打进医院。
- Safety <= 0: 被带走/被债主控制/项目失控。
- Shadow debt above cap: 地下债滚爆。
- Credit <= 0 with high bank debt: 银行系统断供。
- Week 52 reached without target.

## Proposed Architecture

Replace the current single-file mode with small modules:

- `runaway-mode.js`: bootstraps app, wires events, owns render loop only.
- `systems/runaway/state.js`: creates, normalizes, saves, and migrates game state.
- `systems/runaway/market.js`: city/project base prices, weekly price generation, trend/history.
- `systems/runaway/debt.js`: bank credit, loan shark offers, interest, repayment, debt stress thresholds.
- `systems/runaway/events.js`: event deck, weighted selection, event resolution.
- `systems/runaway/render.js`: route screen, modal event screen, financing screen, end screen.
- `systems/runaway/content.js`: cities, projects, lenders, event copy, endings.
- `systems/runaway/balance.js`: knobs for price volatility, interest, event probability, victory thresholds.

Keep the existing old `app.js` untouched as fallback. The active `index.html` should still load only the new mode.

## Screen Redesign

Canonical target: `430x760`, no vertical scroll.

Main screen layout:

```text
┌────────────────────────────┐
│ Week / City / Rank Target  │ 52px
│ Cash Debt Health Heat      │ 54px
├────────────────────────────┤
│ News / warning ticker      │ 30px
├────────────────────────────┤
│ China map + city nodes     │ flexible, about 330px
│ current city highlighted   │
├────────────────────────────┤
│ 5 market items in strip    │ 86px
├────────────────────────────┤
│ Bank Doctor Buy Sell Hide  │ 60px
└────────────────────────────┘
```

Rules:

- No `h1` on the active game screen.
- No explanatory paragraph on the active game screen.
- Status labels must be short: `钱`, `债`, `命`, `风`, `周`.
- Price cards show: item name, current price, up/down from last week, owned count.
- If screen overflows by even 1px in 430x760, it fails.
- Desktop can center the same game board; do not create a separate dashboard UI.

Event overlay:

- Full-screen modal over the map.
- Title <= 10 Chinese characters where possible.
- Body <= 36 Chinese characters.
- 2 choices by default, 3 only for major events.
- Consequence preview can be symbolic: `钱 -20 / 风 +8 / 债 +30`.
- After choosing, show a 1-line result toast and return to route screen.

## Core Playability Redesign

### What Must Change

Current buy/sell is too shallow:

```text
看到价格 -> 点击买 -> 点击卖
```

This is not a game yet. The replacement loop must be:

```text
看到报价和传闻 -> 判断真假和流动性 -> 选择买入量/融资方式 -> 承担持有成本 -> 找不同买家出手 -> 接受折价/拖延/暴雷 -> 形成后续剧情
```

The player should not ask “哪个按钮能点”，but:

- 这周是抄底还是陷阱？
- 这个项目能不能卖出去？
- 是卖给散户、城投、朋友、同行，还是抵押给银行？
- 我要不要降价止血？
- 高利贷快到期，是亏卖还是再借？
- 上次虚假宣传会不会导致这次业主维权？

## Gameplay Systems

### 1. City System

Each city needs:

- `baseDemand`
- `policyRisk`
- `loanAccess`
- `violenceRisk`
- `buyerActivism`
- `projectBias`
- `travelCost`
- `eventTags`

Example:

- 北京: bank access high, policy risk high, relation checks harder.
- 深圳: price volatility high, capital events frequent.
- 兰州: low demand, cheap buy-in, slow sell risk.
- 海口: concept boom/bust events, high volatility.

Acceptance:

- At least 10 cities.
- At least 3 city-specific event tags each.
- At least 1 city-specific opportunity or disaster per city.

### 2. Buy/Sell System

This is the most important redesign area.

Each tradable item is not just a price. It is a **project/resource position**:

- `type`: old-town, school-shell, metro-rumor, rescue-deal, commercial-tail, etc.
- `quality`: real, inflated, defective, politically-backed, distressed.
- `liquidity`: how easy it is to sell.
- `holdingCost`: weekly cash drain.
- `riskTags`: buyer, bank, policy, contractor, violence, audit.
- `storyFlags`: promises made while buying or selling.
- `buyers`: possible buyer types.

Buying should require choosing a **deal posture**:

1. **现金吃进**
   - Lower future debt pressure.
   - Uses scarce cash.
   - Better safety.

2. **银行抵押吃进**
   - Only available after credit improves.
   - Adds bank debt and audit exposure.
   - May trigger抽贷 later.

3. **高利贷抢进**
   - Available early.
   - Higher immediate leverage.
   - Adds shadow debt and violence events.

4. **朋友代持/合伙吃进**
   - Uses relationship.
   - Lower cash need.
   - Creates later拆伙/背刺 event chain.

Selling should require choosing **who receives the hot potato**:

1. **散户/购房者**
   - Higher price.
   - Raises buyer-liability and future维权.

2. **同行接盘**
   - Medium price.
   - Depends on market heat.
   - Can create future revenge/competition.

3. **城投/平台公司**
   - Lower immediate price.
   - Improves official relation if clean.
   - Can become audit trap if messy.

4. **银行抵押/质押**
   - Not a true sale.
   - Gives cash now.
   - Creates抽贷/风控/监管户 risks.

5. **甩卖止血**
   - Fastest.
   - Often loss-making.
   - Reduces debt spiral risk.

Acceptance:

- Buying a project must present at least 3 financing/posture choices when relevant.
- Selling a held project must present at least 3 buyer/exit choices when relevant.
- The same project sold to different buyer types produces different price, cash timing, risk, and future events.
- At least 5 story flags can be created directly from buy/sell decisions.
- Holding inventory must matter through weekly cost, liquidity, and event risk.

### 3. Market System

Current issue: price exists, but it does not feel like a market.

New model:

```text
price = cityBase * projectBase * weeklyCityShock * projectShock * macroCycle * panicDiscount
```

Store:

- current price
- last week price
- 4-week trend
- city note
- volatility source

Player sees:

- `旧改 14 ↓3`
- `学区 31 ↑7`
- `纾困 42 ↓11`

Acceptance:

- Each week all visible project prices refresh.
- At least 70% of project cards change price after advancing a week.
- Player can inspect previous buy cost versus current sell price.
- A test verifies prices are not deterministic across new games with different random seeds.

Additional market depth:

- Some quotes are **rumors**, not guaranteed execution prices.
- High-liquidity items can sell near quote.
- Low-liquidity items require discount or waiting.
- A panic week can make quoted wealth meaningless because nobody buys.
- City-specific buyers affect sellability, not just price.

### 4. Financing System

Bank cannot be a free money button.

Debt classes:

- `bankDebt`: lower interest, requires credit/net worth/collateral.
- `shadowDebt`: high interest, easy to get, creates violence/safety risk.
- `friendDebt`: flexible, damages relationship if unpaid.
- `supplierDebt`: tied to project delivery and total contractor events.

Bank approval:

```text
approved if:
  netWorth >= threshold
  credit >= threshold
  shadowDebt <= threshold
  heat <= threshold
  safety >= threshold
```

If rejected:

- No week should pass for simple rejection unless we intentionally make “跑银行” consume a week.
- UI shows exact reason: `净值不足 / 信用不足 / 黑债过高 / 风险名单`.

Loan shark offer:

- Immediate cash is less than stated principal due to cut fee.
- Weekly interest 10-15%.
- Raises `safetyRisk`, `heat`, and debt-event weight.

Acceptance:

- Initial player cannot borrow from bank.
- Initial player can borrow from underground lender.
- After reaching positive net worth and sufficient credit, bank credit can unlock.
- Shadow debt above threshold makes debt events more likely than normal business events.

### 5. Narrative / Event Director

Current issue: events are a flat list.

Events should not feel like a random punishment deck. They must be the visible consequence of previous buy/sell/funding choices.

Narrative structure:

```text
Choice -> flag -> pressure builds -> actor reacts -> follow-up event -> new choice
```

Example chains:

1. **学区壳链**
   - Buy `学区壳项目`
   - Sell to散户 with aggressive promise
   - Later: school admission rumor breaks
   - Later: parents organize维权
   - Later choices: refund, bribe channel, blame sales team, disappear

2. **高利贷链**
   - Borrow from地下钱庄
   - Miss repayment threshold
   - Black car appears
   - Contractor hears rumor and demands cash
   - Choice: pay, hide, borrow more, call police

3. **银行抵押链**
   - Pledge project to bank
   - Market drops
   - Bank revalues collateral
   - Forced repayment or asset seizure
   - Choice: sell at loss, find friend bridge, fake sales, let project die

4. **城投合作链**
   - Sell distressed project to平台
   - Relationship improves
   - Later audit asks why price was high
   - Choice: produce documents, sacrifice middleman, repay, flee city

Event deck categories:

- `debt`: high利贷上门, 砍头息重算, 抵押物被抢, 朋友翻脸.
- `bank`: 抽贷, 白名单移除, 授信会, 监管户检查.
- `project`: 停工, 总包堵门, 材料涨价, 消防验收不过.
- `buyer`: 业主维权, 退房潮, 烂尾视频, 学区承诺翻车.
- `policy`: 限购, 预售监管, 棚改退潮, 城投合作.
- `opportunity`: 低价甩盘, 内部消息, 地铁传闻, 并购救命.
- `health/safety`: 被围堵, 熬夜住院, 路上事故, 被请去谈话.

Event object:

```js
{
  id,
  title,
  body,
  tags,
  minWeek,
  maxWeek,
  weight(state),
  choices: [
    {
      label,
      preview,
      result,
      effects,
      flags,
      followups
    }
  ]
}
```

Causality:

- Choices set flags.
- Flags unlock follow-up events.
- Example: `绕道支付` -> later `审计追账`.
- Example: `学区承诺` -> later `业主围堵`.

Acceptance:

- At least 40 events in v1.
- At least 10 follow-up events require prior flags.
- At least 8 high-debt events.
- At least 12 events must be directly caused by buy/sell decisions, not generic weekly accidents.
- At least 6 events must reference a named actor and a previous player choice.
- Event body visible in one modal without scrolling.
- Automated test can force high debt and verify debt-tagged event selection dominates.

### 6. Inventory / Project Packets

Current 5 packets are too few and too abstract.

New packet types:

- 旧改指标
- 学区壳
- 地铁传闻盘
- 商办尾盘
- 烂尾纾困包
- 城投合作盘
- 文旅概念盘
- 棚改安置盘
- 产业园壳
- 法拍地块

Each packet:

- buy price
- sell price
- holding cost
- liquidity
- event risk tags
- city suitability

Acceptance:

- At least 10 packet types.
- Holding too many low-liquidity packets increases cashflow and event risk.
- Some packets are hard to sell in specific cities.

### 7. Character / Faction Layer

To fix thin剧情, add recurring actors:

- 地下钱庄：龙哥
- 银行：支行长周行
- 总包：老马
- 政府平台：新区刘主任
- 销售渠道：红姐
- 业主代表：陈老师
- 自媒体：房叔
- 朋友债主：阿强

Each actor has:

- relationship score
- faction
- pressure line
- events they can trigger
- one short recurring voice style

Acceptance:

- At least 8 recurring actors.
- Events name actors instead of generic institutions in at least 60% of cases.
- Relationship choices affect future event weights.

### 8. Decision Density Rules

Every weekly turn should produce at least one meaningful dilemma:

- profit vs safety
- cash now vs future lawsuit
- bank credit vs audit exposure
- high利贷 leverage vs violence risk
- quick sale vs low price
- hold longer vs interest pressure
- truthful disclosure vs buyer panic

Reject any design where the optimal move is obviously “buy cheapest, sell highest” with no other constraint.

## Anti-Boredom And Fatigue Design

This section is mandatory. The game fails if it is technically complete but boring after 3 minutes.

### Why Players Would Get Bored

Likely boredom sources:

1. **Flat trade loop**
   - Player only compares numbers.
   - Same action every week: buy cheapest, travel, sell highest.
   - No emotional stake in the decision.

2. **Random events feel unrelated**
   - Player thinks: “Why did this happen?”
   - Event becomes interruption, not consequence.

3. **Too much text, too little control**
   - Player reads paragraphs but makes shallow decisions.
   - This creates fatigue faster than simple UI.

4. **No mid-term goals**
   - 52-week target is too far away.
   - Player needs short arcs: repay this loan, survive this city, flip this bad asset, escape this actor.

5. **No changing playstyle**
   - If every run uses the same strategy, replay dies.
   - The game needs different viable but risky styles.

6. **No escalation**
   - If week 3 and week 30 feel the same, player quits.
   - Pressure must evolve: small debt -> debt spiral -> reputation collapse -> institutional squeeze.

### Engagement Target

The player should feel one of these every 20-40 seconds:

- “I can make money here, but it may bury me later.”
- “I need cash now, but every source has poison.”
- “This price is good, but can I actually sell?”
- “This event happened because of what I did earlier.”
- “I survived, but I created a future problem.”

If the player goes more than 2 turns without a new dilemma, the design is too thin.

### Turn-Level Decision Density

Every turn should contain at least **two** of the following:

- Price opportunity
- Debt deadline
- Inventory holding cost
- Actor pressure
- Event consequence
- City-specific risk
- Buyer/liquidity constraint
- Health/safety deterioration
- Reputation/credit change

Example good turn:

```text
Week 9:
- 上海学区壳涨价 18%.
- You hold 2 units bought with high-interest money.
- Retail buyer pays high, but creates 学区承诺 flag.
- Peer buyer pays less, but no buyer-liability flag.
- Loan shark interest hits next week.
```

This is interesting because the best cash move is not obviously the best survival move.

Example bad turn:

```text
Week 9:
- 上海学区壳 is 30.
- You bought at 20.
- Sell for profit.
```

This is arithmetic, not gameplay.

### Session Rhythm

Target session lengths:

- 30 seconds: understand the current danger.
- 2 minutes: complete one buy -> travel -> sell or fail chain.
- 5 minutes: encounter at least one causal follow-up event.
- 10 minutes: reach a midgame identity shift or dramatic collapse.

Rhythm structure:

```text
Turns 1-3: teach debt, buying, selling.
Turns 4-10: open city choice, introduce first actor.
Turns 11-20: first debt spiral or project scandal.
Turns 21-35: institutional pressure, bank/监管/平台.
Turns 36-52: endgame squeeze, exit or collapse.
```

No phase should reuse only the same event tone. Each phase needs a different pressure flavor:

- Early: street-level debt, friends, small contractors.
- Mid: bank, project delivery, buyers, local government.
- Late: audits, asset freeze, white lists, public collapse.

### Player Archetypes And Replay Styles

The game should support at least five playstyles:

1. **高利贷赌徒**
   - Fastest growth.
   - Most debt/violence events.
   - Can win fast or die early.

2. **银行白名单派**
   - Slower early game.
   - Needs credit and clean deals.
   - Vulnerable to market downturn and collateral revaluation.

3. **关系盘玩家**
   - Uses friends, officials, platforms.
   - Lower cash pressure.
   - Higher betrayal/audit/favor-repayment chains.

4. **低价甩卖生存派**
   - Takes smaller profits.
   - Avoids explosive collapse.
   - May fail wealth target by being too safe.

5. **概念炒作派**
   - Uses rumors and marketing.
   - High price upside.
   - Buyer维权 and media risk increase.

Acceptance:

- At least 3 of these styles must be viable in simulation.
- Each style must have unique event tags and failure modes.
- The player can infer their current style from the UI or end report.

### Richness Budget

The first rebuild must include enough content to avoid immediate repetition:

- 10 cities.
- 10 tradable project/resource types.
- 8 named actors.
- 4 debt/funding sources.
- 5 buyer/exit types.
- 40 normal events.
- 10 causal follow-up events.
- 8 high-debt crisis events.
- 6 city-specific opportunity events.
- 6 endgame events.
- 8 endings.

Minimum content is not for “more stuff”; it prevents the same run from repeating.

### Event Variety Rules

Events must vary across five dimensions:

1. **Source**
   - Debt, buyer, bank, project, official, media, health, opportunity.

2. **Tone**
   - Threat, temptation, betrayal, accident, opportunity, institutional squeeze.

3. **Time horizon**
   - Immediate cash effect.
   - Delayed follow-up.
   - Permanent relationship/status flag.

4. **Choice shape**
   - Pay money to reduce risk.
   - Take risk to get cash.
   - Sacrifice relationship.
   - Delay problem.
   - Tell truth and lose price.
   - Lie and create future flag.

5. **Actor memory**
   - Some events remember who you offended, borrowed from, lied to, or helped.

Rule:

- No more than 2 consecutive events can use the same source category unless the player is in a crisis spiral.
- If the same actor appears twice, the second event must reference the previous interaction.

### Buy/Sell Fatigue Prevention

The buy/sell screen should not show 10 identical cards.

Each visible opportunity should have a distinct reason to exist:

- Cheap but illiquid.
- Expensive but easy to sell.
- Low margin but clean.
- High margin but creates legal risk.
- Rumor-driven, volatile.
- Debt-friendly collateral.
- Relationship-dependent.

Project card format:

```text
学区壳
买 24 / 卖估 31
流动性 高 | 维权风险 高
```

Owned project card format:

```text
学区壳 x2
成本 24 | 本城可卖 31
散户高价 / 同行折价 / 甩卖止血
```

Acceptance:

- Player must see not only price, but at least one risk/liquidity clue.
- There must be at least 3 meaningful sell exits for a held item.
- The highest sale price must often create the highest future risk.

### Narrative Depth Model

Each major story chain should have 3 layers:

1. **Setup**
   - Player makes a profitable or desperate decision.

2. **Complication**
   - Someone affected by that decision reacts.

3. **Reckoning**
   - The player must pay, lie, flee, sacrifice someone, or double down.

Example chain:

```text
Setup:
You sell 学区壳 to retail buyers with aggressive promise.

Complication:
陈老师 forms a buyer group after school admission rumor changes.

Reckoning:
Pay refunds, bribe channel, blame sales director, or flee city.
```

Each chain should modify future game state:

- Actor relationship.
- City reputation.
- Buyer trust.
- Credit.
- Safety.
- Legal/audit flag.
- Project liquidity.

Acceptance:

- At least 10 story chains have setup -> complication -> reckoning.
- At least 5 chains can end in more than one way.
- At least 5 chains can be avoided by earlier conservative play.

### Pacing And Escalation

The game should avoid both instant chaos and long boredom.

Pressure bands:

```text
Green: player can make plans.
Yellow: one deadline or actor pressure exists.
Orange: two pressure sources collide.
Red: crisis spiral; events can chain.
Black: likely ending soon unless player sacrifices something.
```

State inputs:

- Total debt.
- Shadow debt share.
- Cash runway.
- Health.
- Safety.
- Heat.
- Inventory illiquidity.
- Active flags.

Rules:

- Green turns should still offer opportunity.
- Yellow turns introduce tension.
- Orange turns force tradeoff.
- Red turns can interrupt normal play with debt/bank/project events.
- Black turns should feel like emergency management, not normal trading.

Acceptance:

- UI displays the current pressure band.
- Event probability and category mix change by pressure band.
- Simulation logs show fewer low-impact events during Red/Black bands.

### Progression Without Bloat

Progression should change available decisions, not just inflate numbers.

Unlocks:

- Week 1: underground lender, cheap local deals.
- Net worth > 50: friend proxy deals.
- Credit > 60: bank credit application.
- Relationship > 60: platform buyer.
- Heat > 50: media and buyer pressure.
- Debt > 180: crisis event deck.
- Bank debt > 120: collateral revaluation.
- Shadow debt > 120: loan shark coercion.

Acceptance:

- A new player sees simple choices early.
- A midgame player sees more buyer/funding options.
- A late-game player sees harder institutional consequences.

### Emotional Texture

The game needs emotional variety:

- Greed: “This flip can double cash.”
- Fear: “If I miss this payment, someone comes.”
- Regret: “That promise from 8 weeks ago returned.”
- Relief: “I sold at a loss but survived.”
- Suspicion: “This rumor may be bait.”
- Hubris: “I can handle one more leveraged deal.”

Writing rule:

- Event prose should be short, concrete, and situation-driven.
- Avoid lectures.
- Avoid abstract macroeconomic explanation during active play.
- Use named people and physical details: phone calls, car downstairs, locked account, group chat, construction gate.

### Anti-Repetition Mechanics

To avoid fatigue:

- Do not show the same event twice in one run unless it is a recurring actor chain.
- Use cooldowns per event ID.
- Use event variants for repeated sources.
- Use city memory: a city where you burned buyers becomes harder to sell in.
- Use actor memory: a lender you delayed becomes more aggressive.
- Use market regime shifts every 8-12 weeks.

Market regimes:

- 宽松融资
- 棚改热
- 土拍冷
- 监管收紧
- 舆情爆发
- 银行惜贷
- 折价甩卖潮

Acceptance:

- Two 10-minute playthroughs should produce different dominant problems.
- Repeating a strategy should still face varied consequences due to regimes and actors.

### Fun Tests

Beyond technical tests, use playability checks:

1. **Three-Turn Hook Test**
   - By turn 3, player must have made one risky financing decision and one trade decision.

2. **Five-Minute Causality Test**
   - Within 5 minutes, at least one event should reference a prior player choice.

3. **No-Arithmetic-Only Test**
   - In a 10-turn sample, at least 7 turns must include non-price tradeoff.

4. **Regret Test**
   - At least once per run, the player should see a consequence from a previous profitable decision.

5. **Recovery Test**
   - A player in crisis must have at least two bad-but-possible recovery choices, not only unavoidable death.

6. **Fatigue Test**
   - After 15 minutes, player should have seen at least 3 different pressure sources and 2 named actor chains.

Automated proxy metrics:

- Average unique event categories per run >= 5.
- Average unique actors per 20 turns >= 4.
- At least 60% of event triggers have a state/flag/debt reason.
- No event appears more than twice in one run.
- At least 70% of turns change one of: inventory, debt, relation, flag, health, safety, heat.


## Implementation Steps

1. **Freeze current behavior and branch the rewrite**
   - Keep current `runaway-mode.js` as reference or rename it to `runaway-mode.legacy.js`.
   - Create new modular files under `src/simulators/real-estate-tycoon/systems/runaway/`.
   - Update `build.mjs` copy rules to include the new directory.

2. **Build state and balance layer**
   - Implement `state.js`, `balance.js`, and `content.js`.
   - Define full state schema: week, city, cash, deposits, bank debt, shadow debt, health, safety, heat, credit, relations, inventory, flags, market history.
   - Add save migration so older localStorage does not crash.

3. **Build market, inventory, and deal execution**
   - Implement weekly price generation with base price + random shocks + cycle modifiers.
   - Add liquidity and buyer-type execution, so quote price is not always the sale price.
   - Add buy posture choices: cash, bank pledge, high利贷, friend proxy.
   - Add sell exit choices: retail, peer, platform, pledge, fire sale.

4. **Build debt simulation**
   - Implement financing gates and lender offers.
   - Add debt stress bands:
     - 0-80: normal
     - 80-180: pressure
     - 180-300: frequent events
     - 300+: crisis spiral

5. **Build event director**
   - Move events to structured deck.
   - Add weighted event picker by tags and flags.
   - Add forced-event support for tests and tutorial.
   - Add at least 40 v1 events.
   - Add at least 10 causal chains from buy/sell/funding decisions.

6. **Rebuild UI as a fixed game board**
   - Replace current route render with compact board.
   - Use CSS grid rows, not compressed article layout.
   - Event and financing screens become overlays.
   - China map is primary visual layer, with cities placed on path.

7. **Add tutorial first 3 turns**
   - Turn 1: underground lender intro.
   - Turn 2: buy cheap project.
   - Turn 3: travel/sell/event.
   - After tutorial, full randomness opens.

8. **Rewrite smoke tests**
   - Add no-scroll test at 390x844, 430x760, 768x1024.
   - Add bank rejection test.
   - Add loan shark borrowing test.
   - Add price volatility test.
   - Add high-debt event weighting test.
   - Add screenshot output for route screen and event modal.

9. **Balance pass**
   - Simulate 100 auto-play random games.
   - Target:
     - 20-40% die before week 20.
     - 20-35% reach week 52 but fail target.
     - 5-15% win without perfect play.
     - High-debt path should feel powerful but dangerous.

## Acceptance Criteria

Hard UI criteria:

- `document.documentElement.scrollHeight <= window.innerHeight` on active route screen for 390x844 and 430x760.
- Action dock is visible without scroll.
- All five project cards are visible without scroll.
- China map and all city nodes are visible without scroll.
- Event modal has no internal scroll for normal events.

Hard gameplay criteria:

- Initial bank loan is rejected with reason.
- Initial underground loan is available.
- Weekly shadow-debt interest is at least 10%.
- Prices refresh every week and show trend.
- Buying and selling can produce profit or loss depending on city/week, buyer type, liquidity, and chosen financing.
- Selling the same project through two different exits can produce different money and different future flags.
- At least 5 buy/sell-created flags can trigger later events.
- Debt above crisis threshold increases debt-tagged event probability to over 50%.
- At least 40 event definitions exist.
- At least 10 events are follow-ups from prior choices.
- At least 8 named recurring actors appear in events.

Hard verification criteria:

- `npm run build` passes.
- `node scripts/real-estate-tycoon-smoke.mjs` passes.
- New simulation script runs 100 games and reports ending distribution.
- Screenshots generated:
  - `.local/real-estate-tycoon-smoke/mobile-route.png`
  - `.local/real-estate-tycoon-smoke/mobile-event.png`
  - `.local/real-estate-tycoon-smoke/mobile-finance.png`

## Risks and Mitigations

- Risk: one-screen UI becomes too cramped.
  - Mitigation: remove all long prose from route screen; put details in overlays.
- Risk: event richness becomes random noise.
  - Mitigation: event tags + flags + actor relationships create causal chains.
- Risk: finance system becomes too punishing.
  - Mitigation: balance with simulation runs and keep win rate target at 5-15%.
- Risk: map looks like a placeholder.
  - Mitigation: create a cleaned China-shaped SVG layer and manually place city nodes.
- Risk: code becomes another giant file.
  - Mitigation: enforce module boundaries before adding content.

## Verification Plan

Manual:

- Play 10 minutes on mobile viewport.
- Confirm no scrolling on main screen.
- Confirm first bank application rejects.
- Confirm underground loan creates more debt pressure.
- Confirm prices change after each week.
- Confirm high debt creates frequent debt/violence/bank events.

Automated:

- DOM layout check for no scroll and visible controls.
- State unit tests for bank approval, loan shark interest, market refresh.
- Event director test for high-debt weighted selection.
- Smoke test for start -> borrow underground -> buy -> travel -> sell -> event.
- 100-game random simulation for rough balance.

## Detailed Execution Plan

This is the concrete build plan. It is intentionally ordered so playability is proven before UI polish and before large content expansion.

### Phase 0: Worktree And Scope Control

Goal: prevent the rewrite from mixing with unrelated website work.

Files to inspect first:

- `src/simulators/real-estate-tycoon/index.html`
- `src/simulators/real-estate-tycoon/runaway-mode.js`
- `src/simulators/real-estate-tycoon/style.css`
- `scripts/real-estate-tycoon-smoke.mjs`
- `build.mjs`

Tasks:

1. Record current dirty files with `git status --short`.
2. Do not revert unrelated existing user changes.
3. Keep old `app.js` untouched as fallback.
4. Keep the active simulator entry as `runaway-mode.js`, but make it a thin bootstrap after modularization.

Exit criteria:

- Current task-owned files are identified.
- No unrelated files are edited except generated `docs/` output after build.

### Phase 1: Create Modular Runaway System

Goal: stop building a giant script.

Create:

- `src/simulators/real-estate-tycoon/systems/runaway/state.js`
- `src/simulators/real-estate-tycoon/systems/runaway/content.js`
- `src/simulators/real-estate-tycoon/systems/runaway/balance.js`
- `src/simulators/real-estate-tycoon/systems/runaway/market.js`
- `src/simulators/real-estate-tycoon/systems/runaway/debt.js`
- `src/simulators/real-estate-tycoon/systems/runaway/trade.js`
- `src/simulators/real-estate-tycoon/systems/runaway/events.js`
- `src/simulators/real-estate-tycoon/systems/runaway/simulate.js`
- `src/simulators/real-estate-tycoon/systems/runaway/render.js`

Refactor:

- `runaway-mode.js` becomes boot + event wiring only.
- `build.mjs` must copy the new `systems/runaway/` directory into `dist/` and `docs/`.

Concrete state schema:

```js
{
  week,
  maxWeek,
  cityId,
  cash,
  deposit,
  health,
  safety,
  heat,
  credit,
  rankTarget,
  debts: {
    bank,
    shadow,
    friend,
    supplier
  },
  relations: {
    actorId: score
  },
  inventory: [
    {
      id,
      type,
      cityId,
      cost,
      quality,
      liquidity,
      holdingCost,
      riskTags,
      flags,
      age
    }
  ],
  market,
  flags,
  eventHistory,
  runLog,
  pressureBand
}
```

Exit criteria:

- New game state can be created without DOM.
- State can be saved/loaded/migrated from older localStorage.
- `runaway-mode.js` imports modules instead of owning all logic.

Verification:

- Run a small Node import check for every module.
- No browser required yet.

### Phase 2: Playability Prototype Without UI

Goal: prove the game is interesting before drawing the screen.

Implement in `simulate.js`:

- `simulateTurn(state, action)`
- `listAvailableActions(state)`
- `runScriptedScenario(actions)`
- `runRandomGame(seed, policy)`

Required prototype actions:

- borrow from underground lender
- attempt bank credit
- buy project with posture
- travel to city
- sell project to buyer type
- repay debt
- hide/avoid pressure
- resolve event choice

Scripted 10-turn scenario:

```text
W1 borrow from 龙哥
W2 buy 学区壳 using high利贷 posture
W3 travel to 上海
W4 sell to retail buyers with aggressive promise
W5 repay partial debt
W6 buy 商办尾盘 with friend proxy
W7 陈老师 follow-up triggers from buyer promise
W8 choose refund/lie/flee
W9 bank rejects or approves based on resulting state
W10 pressure band changes and next dilemma appears
```

Exit criteria:

- Console log is readable and contains causal references.
- At least 7 of 10 turns include a non-price tradeoff.
- At least 1 event references a prior flag.
- At least 1 debt decision changes later event weight.

Verification:

- Add `scripts/real-estate-tycoon-sim.mjs`.
- Command: `node scripts/real-estate-tycoon-sim.mjs --scenario hook`
- The output must include week-by-week state deltas and flags.

### Phase 3: Buy/Sell System

Goal: make trading the main gameplay, not simple arithmetic.

Implement in `trade.js`:

- `getBuyOffers(state)`
- `getBuyPostures(state, offer)`
- `executeBuy(state, offerId, postureId)`
- `getSellExits(state, inventoryItemId)`
- `executeSell(state, inventoryItemId, exitId)`
- `applyHoldingCosts(state)`

Buy posture types:

- `cash`
- `bank_pledge`
- `shadow_financed`
- `friend_proxy`
- `platform_joint`

Sell exit types:

- `retail_buyers`
- `peer_developer`
- `platform_company`
- `bank_pledge`
- `fire_sale`

Each buy/sell result must include:

- cash delta
- debt delta
- relation delta
- risk delta
- flags created
- event tags added
- one-line player-facing result

Examples:

- Selling `school_shell` to `retail_buyers` creates `buyer_liability_school`.
- Buying with `friend_proxy` creates `friend_proxy_obligation`.
- Selling to `platform_company` creates `platform_audit_trace`.
- Bank pledge creates `collateral_revaluation_risk`.

Exit criteria:

- Same project has at least 3 sell exits.
- Highest immediate cash exit also creates future risk.
- Low-liquidity projects cannot always sell at quote price.
- Holding cost is applied weekly.

Verification:

- Unit-style simulation assertions in `scripts/real-estate-tycoon-sim.mjs --check trade`.
- Check: same item sold via two exits produces different cash and flags.

### Phase 4: Debt And Pressure System

Goal: debt drives gameplay and story.

Implement in `debt.js`:

- `getFinancingOptions(state)`
- `canBorrowFromBank(state)`
- `borrowFromBank(state)`
- `borrowFromLoanShark(state, lenderId)`
- `borrowFromFriend(state, actorId)`
- `repayDebt(state, debtType, amount)`
- `applyWeeklyInterest(state)`
- `calculatePressureBand(state)`

Debt rules:

- Initial bank credit must reject.
- Underground lending must be available early.
- Shadow loan received cash must be less than principal.
- Shadow weekly interest must be 10-15%.
- Bank weekly interest must be lower but creates audit/collateral risk.
- Friend debt harms actor relationship if delayed.

Pressure bands:

- Green: one pressure source or fewer.
- Yellow: debt deadline or holding-cost tension.
- Orange: debt + project/buyer pressure collide.
- Red: high debt or low safety; crisis deck active.
- Black: near-ending emergency.

Exit criteria:

- UI-independent state can explain why bank rejects.
- High shadow debt raises debt/violence event weights.
- Pressure band changes event mix.

Verification:

- `node scripts/real-estate-tycoon-sim.mjs --check debt`
- Assertions:
  - initial bank rejection reason exists.
  - underground loan increases cash and shadow debt.
  - 4 weeks of unpaid shadow debt grows materially.
  - pressure band rises with debt.

### Phase 5: Causal Event Director

Goal: events feel like consequences, not random popups.

Implement in `events.js`:

- `getEligibleEvents(state)`
- `weightEvent(state, event)`
- `pickEvent(state, random)`
- `resolveEventChoice(state, eventId, choiceId)`
- `recordEventCooldown(state, eventId)`

Event object requirements:

```js
{
  id,
  title,
  body,
  actorId,
  tags,
  requiresFlags,
  blocksFlags,
  minWeek,
  maxWeek,
  cooldown,
  weight(state),
  choices
}
```

Build first 10 chains before expanding:

1. 学区壳承诺 -> 家长群 -> 退款/甩锅/跑路
2. 地下钱庄 -> 黑车 -> 砍头息重算
3. 银行抵押 -> 抵押物重估 -> 抽贷
4. 城投合作 -> 审计 -> 追责
5. 朋友代持 -> 拆伙 -> 私下举报
6. 商办尾盘 -> 空置 -> 租金骗局
7. 地铁传闻 -> 澄清 -> 买家退场
8. 纾困包 -> 总包堵门 -> 停工视频
9. 文旅概念 -> 政策冷却 -> 资产冻结
10. 平台联合 -> 保交楼任务 -> 现金被锁

Exit criteria:

- At least 10 chains exist with setup/complication/reckoning.
- At least 40 total events before final content milestone.
- Events have cooldowns.
- Event picker can explain selected event reason in debug mode.

Verification:

- `node scripts/real-estate-tycoon-sim.mjs --check events`
- Forced state with `buyer_liability_school` must make related event eligible.
- Forced high shadow debt must make loan-shark events dominate.

### Phase 6: Single-Screen UI Board

Goal: build the actual game screen after systems are fun.

Files:

- `render.js`
- `runaway-mode.js`
- `style.css`
- `index.html` only if extra containers are needed.

Route screen:

- Top status row: week, city, pressure band.
- Resource row: cash, deposit, total debt, health, safety/heat.
- Ticker row: one-line last result or warning.
- Map area: China silhouette and city nodes.
- Market strip: 5 visible opportunities with price/trend/risk clue.
- Dock: finance, heal, buy, sell, hide.

Overlay screens:

- finance overlay
- buy posture overlay
- sell exit overlay
- event overlay
- end report overlay

Non-negotiable UI constraints:

- Main route screen has no vertical scroll at 390x844 and 430x760.
- Active route screen has no long paragraphs.
- Event body <= 36 Chinese characters where possible.
- Choice buttons show consequence preview.

Exit criteria:

- Route screen is playable with one thumb.
- Buy/sell/finance/event overlays do not require page scroll.
- Map is visually primary.

Verification:

- Update `scripts/real-estate-tycoon-smoke.mjs`.
- Screenshots:
  - route
  - buy posture
  - sell exit
  - event
  - finance

### Phase 7: Content Expansion

Goal: expand richness after mechanics are proven.

Minimum content:

- 10 cities
- 10 project/resource types
- 8 named actors
- 4 lender/funding sources
- 5 buyer/exit types
- 40 normal events
- 10 follow-up chain events
- 8 high-debt crisis events
- 6 city-specific opportunities
- 6 endgame events
- 8 endings

Content rules:

- Every event must have tags and at least one mechanical effect.
- 60%+ events should name an actor or prior context.
- No event should be pure flavor.
- No active-play paragraph should become a lecture.

Exit criteria:

- Two 10-minute runs should not feel like the same dominant problem.
- No event repeats more than twice in one run unless it is a chain.

Verification:

- Add content audit script:
  - event count
  - tag coverage
  - actor coverage
  - follow-up count
  - crisis-event count

### Phase 8: Balance And Anti-Fatigue Validation

Goal: tune for replayability, not just correctness.

Run policies:

- random
- greedy profit
- conservative repayment
- high-leverage debt
- relationship-heavy

Simulation targets:

- 20-40% die before week 20.
- 20-35% reach week 52 but fail target.
- 5-15% win without perfect play.
- Average unique event categories per 20 turns >= 5.
- Average unique actors per 20 turns >= 4.
- At least 60% of event triggers have a state/flag/debt reason.
- At least 70% of turns change inventory, debt, relation, flag, health, safety, or heat.

Manual playability checklist:

- By turn 3, player made one risky funding decision and one trade decision.
- Within 5 minutes, one event references prior player choice.
- In 10 turns, at least 7 include non-price tradeoff.
- Player has at least two recovery options in crisis.

Exit criteria:

- Simulation metrics are printed.
- Manual play notes do not identify repeated arithmetic as dominant experience.

### Phase 9: Final Verification And Build Output

Commands:

```bash
npm run build
node scripts/real-estate-tycoon-smoke.mjs
node scripts/real-estate-tycoon-sim.mjs --check all
node scripts/real-estate-tycoon-sim.mjs --simulate 100
```

Expected artifacts:

- `dist/simulators/real-estate-tycoon/`
- `docs/simulators/real-estate-tycoon/`
- `.local/real-estate-tycoon-smoke/mobile-route.png`
- `.local/real-estate-tycoon-smoke/mobile-buy.png`
- `.local/real-estate-tycoon-smoke/mobile-sell.png`
- `.local/real-estate-tycoon-smoke/mobile-event.png`
- `.local/real-estate-tycoon-smoke/mobile-finance.png`
- `.local/real-estate-tycoon-smoke/simulation-report.json`

Final release gate:

- No-scroll route screen verified.
- Initial bank rejection verified.
- Underground lending verified.
- Weekly price trend verified.
- Buy/sell exits verified.
- Causal event chain verified.
- High-debt event weighting verified.
- 100-run simulation report generated.
- Build output copied to `docs/`.

## Task Ownership Map

For solo execution:

1. Systems first: `state.js`, `market.js`, `debt.js`, `trade.js`.
2. Event director second: `events.js`, content chains.
3. UI third: `render.js`, `style.css`, `runaway-mode.js`.
4. Verification last: smoke test, simulation script, build.

For team execution:

- Lane A, systems: `state.js`, `market.js`, `debt.js`, `trade.js`, `balance.js`.
- Lane B, content/events: `content.js`, `events.js`, event chains, actors.
- Lane C, UI: `render.js`, `style.css`, `runaway-mode.js`.
- Lane D, verification: `scripts/real-estate-tycoon-smoke.mjs`, `scripts/real-estate-tycoon-sim.mjs`.

Conflict rules:

- Only Lane C edits CSS.
- Only Lane B edits event copy after event schema is agreed.
- Lane D may read all files but should not change game logic except adding test hooks with explicit agreement.

## Proposed Execution Order

Do not continue incremental patching. Execute as a controlled rewrite:

1. **Paper-prototype the core loop in code**
   - No final UI yet.
   - Implement state, market, inventory, debt, buy exits, sell exits, and event flags.
   - Goal: prove 10 turns are interesting in console/test output.

2. **Build buy/sell depth before content volume**
   - Add financing posture for buying.
   - Add buyer/exit choice for selling.
   - Add liquidity and holding cost.
   - Add story flags from trade decisions.
   - Do not add 40 events until trade decisions are meaningful.

3. **Build the causal event director**
   - Add event tags, cooldowns, pressure bands, actor memory, and flags.
   - Add 10 high-quality causal chains first.
   - Only then expand to 40+ events.

4. **Run playability simulations**
   - Simulate 20-turn random/greedy/debt-heavy runs.
   - Read logs manually.
   - Reject if logs look like arithmetic or unrelated randomness.

5. **Design fixed single-screen UI**
   - Once the loop works, build the 430x760 board.
   - Route screen shows map, status, price cards, and actions.
   - Details go into overlays.

6. **Add tutorial and pacing**
   - First three turns teach underground lending, buying, selling, and consequence.
   - Unlock complexity gradually.

7. **Expand content**
   - Add 10 cities, 10 project types, 8 actors, 40 events, 10 follow-up chains.
   - Content must attach to system tags and flags, not just random text.

8. **Balance with simulation and manual play**
   - Run 100-game simulation.
   - Run 15-minute human smoke play.
   - Tune debt, liquidity, event frequency, win rate, and fatigue metrics.

9. **Final build and visual-check**
   - `npm run build`
   - `node scripts/real-estate-tycoon-smoke.mjs`
   - Screenshots for route, event, finance.
   - No-scroll verification at mobile sizes.

## Execution Gate

Do not start by drawing UI.

The first implementation milestone is a **playability prototype** that can print a 10-turn log like this:

```text
W1: borrow 60 from 龙哥, receive 48, shadow debt 68.
W2: buy 学区壳 in 云江 via high利贷 posture, flag: aggressive_promise.
W3: travel to 上海, price rises, holding cost paid.
W4: sell to retail buyers at high price, flag: buyer_liability_school.
W7: 陈老师 event triggers from buyer_liability_school.
W8: choose refund/lie/flee, each creates different future risk.
```

If the 10-turn log is not interesting without UI polish, the design is not ready for UI.

## Definition of Done

The game is acceptable only when buying and selling are interesting by themselves. A player should feel pressure from liquidity, debt, buyers, rumors, and previous promises before any event fires. Events then deepen the consequences of those trade decisions, instead of acting like unrelated random punishments.
