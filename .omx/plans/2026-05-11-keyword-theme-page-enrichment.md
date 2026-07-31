---

authored_by: external
content_role: reference
trust_level: primary
authoring_mode: human
last_verified: 2026-05-17
---
# 关键词、主题与知识详情页升级执行计划

## 目标

把关键词、主题、概念、模型统一成一套稳定的知识入口体验，同时修复深色相关节目区域的可读性问题。最终用户应该能做到：

- 在关键词、主题、概念、模型页都看到足够清楚的解释、关联节点和相关节目证据。
- 点正文里的知识链接后，浏览器返回能回到原页面、原滚动位置、原展开状态。
- 深色背景里的关键词链接、节目卡片、标签 hover 状态都清楚可读。
- 关键词内容不再只是自动 tag，而是按分层制度逐步补成高质量入口。

## 当前问题

1. 关键词详情页仍是旧模板，只显示 `summary / description / relatedKeywords / relatedEpisodes`，没有像概念和模型一样的知识详情结构。
2. 主题页大多只有“主题说明”和相关节目，缺少归线依据、观察维度、边界说明和关联节点。
3. 深色“相关节目”区域里，自动知识链接使用浅色页面的暗蓝样式，导致几乎看不见。
4. 相关节目卡片 hover 后背景变深，和父级深色背景接近，标题、正文、chip 的联动对比度不稳定。
5. 详情页跳转返回时，只恢复滚动位置的机制不完整，未保存 accordion 展开状态。
6. 753 个关键词不是全部人工词条，大部分来自 `episode.tags` 自动聚合；需要制度化分层，而不是盲目全量手写。

## 范围

本计划包含四条工作线：

1. 页面体验修复：深色区链接、卡片 hover、chip 联动。
2. 详情页结构升级：关键词页和主题页对齐概念/模型的知识详情体验。
3. 路由返回状态恢复：返回后恢复原滚动位置和展开项。
4. 关键词内容治理：按 A/B/C 三层生产和高标准 QA 批量丰富关键词。

不在本计划内：

- 不重写全部 753 个关键词。
- 不把关键词页做成第二套概念页。
- 不新增依赖。
- 不改节目内容事实，除非该词条本身需要补证据。

## 内容架构决策

关键词是入口层，不是分析层。

- `关键词`：回答“这个词在颖响力里主要指什么，应该从哪里继续读”。
- `概念`：回答“这是一种什么现象”。
- `模型`：回答“这套机制怎么反复运作”。
- `主题`：回答“多期节目共同在讨论哪条议题线”。
- `人物`：后台保留 `content/people`，前台统一进入关键词页。

关键词分三档：

- `A 类 standalone`：国家、公司、品牌、人物、地理节点、事件、产品。做完整关键词入口页。
- `B 类 route-*`：用户会搜这个词，但主分析应进入概念/模型/主题。关键词页只做入口和导向。
- `C 类 light`：长尾 tag，只保留简要说明和相关节目，不做厚页。

## 数据结构计划

逐步给关键词补充以下字段，不一次性强制全量：

```json
{
  "nodeType": "person | entity | geography | event | term | route",
  "landingMode": "standalone | route-to-concept | route-to-model | route-to-theme | person-entry | light",
  "canonicalRefs": {
    "conceptId": "",
    "modelId": "",
    "themeId": "",
    "personId": ""
  },
  "scopeNote": "",
  "boundaryNote": "",
  "whyKeep": "",
  "discussionAngles": [
    {
      "title": "",
      "note": "",
      "episodeIds": []
    }
  ],
  "relatedConcepts": [],
  "relatedModels": [],
  "relatedThemes": [],
  "relatedPeople": [],
  "contentStatus": "seed | curated | route | complete"
}
```

主题页可补充：

```json
{
  "whyThisThemeMatters": "",
  "observationLenses": [],
  "boundaries": [],
  "questions": [],
  "relatedConcepts": [],
  "relatedModels": [],
  "relatedThemes": [],
  "relatedPeople": []
}
```

## 执行阶段

### Phase 1：马上修复可读性

文件：

- `src/style.css`
- 构建生成的 `docs/assets/style.css`

任务：

1. 给 `.knowledge-evidence .inline-knowledge-link` 和深色卡片中的 `.inline-knowledge-link` 增加高对比浅金样式。
2. 覆盖 `article.list-item[data-list-item-href]:hover` 内的 inline link 颜色，避免关键词索引卡片 hover 后链接变暗。
3. 相关节目卡片 hover 不再变成接近父背景的深蓝，改成浅色强化态或高对比深色态，必须保证标题、摘要、EP 编号都清楚。
4. chip 默认、卡片 hover、chip 自身 hover 三种状态分别定义，不能依赖全局 hover 规则。

验收：

- 截图中“营销费用”“零公里二手车”“开票经济”等内链必须肉眼清楚。
- 卡片 hover 后标题、摘要和 chip 均可读。
- `npm run test:ui` 通过。

### Phase 2：关键词详情页升级

文件：

- `src/app.js`
- `src/style.css`
- `scripts/ui-smoke.mjs`

任务：

1. `renderKeywordDetail` 改为使用 `knowledge-overview` header。
2. 增加关键词页关联头部：
   - 相关概念
   - 相关模型
   - 相关主题
   - 相关人物或相关关键词
3. 如果关键词有 `scopeNote / whyKeep / boundaryNote / discussionAngles`，显示为知识分析 accordion。
4. 如果没有新字段，基于现有 `description / relatedKeywords / episodes` 生成保守版：
   - `这个词指什么`
   - `为什么保留这个入口`
   - `相关写法 / 相关关键词`
5. 人物关键词继续隐藏内部 slug alias，例如 `donald-trump`。
6. 关键词相关节目继续使用和主题一致的深色证据区。

验收：

- `#/keywords/singapore` 有知识详情样式、关联节点和相关节目证据。
- `#/keywords/trump` 不显示 `donald-trump / Donald Trump` 这类内部写法。
- `#/keywords/数字注水` 不再像旧式普通 section，而是知识详情页。
- 旧字段缺失时页面不空、不报错。

### Phase 3：主题详情页升级

文件：

- `src/app.js`
- `content/themes/*.json` 或 `scripts/keyword-definitions.d` 相关补充文件
- `scripts/ui-smoke.mjs`

任务：

1. `renderThemeDetail` 保持和概念/模型一致的 `knowledge-overview`。
2. 对只有 `description` 的主题页，自动拆出更有用的显示结构：
   - `主题说明`
   - `归线依据`
   - `观察维度`
   - `边界说明`
3. 如果主题已有新字段，优先展示新字段。
4. 主题页相关节目保留深色证据层，但修复可读性。

验收：

- `#/themes/platform-labor-and-lived-reality` 不再只有一段普通说明。
- `#/themes/maritime-chokepoints-and-route-order` 能清楚看到该主题为什么把这些节目归在一起。
- 主题页和关键词页风格一致，但不重复概念/模型分析。

### Phase 4：返回状态恢复

文件：

- `src/app.js`
- `scripts/ui-smoke.mjs`

任务：

1. 在点击 `.inline-knowledge-link` 前保存当前 route state：
   - `hash`
   - `scrollX`
   - `scrollY`
   - 当前打开的 accordion 标识
2. accordion 增加稳定标识，可用 `data-progress-label` 或标题生成。
3. 返回原 hash 时恢复：
   - 已展开 accordion
   - 滚动位置
   - section progress 状态
4. 不影响普通前进跳转和首页跳转。

验收：

- 在概念页展开“定义”，滚动到段落中间，点击正文关键词，再按浏览器返回，页面回到原位置，且“定义”仍展开。
- 主题页、关键词页同样成立。
- 不破坏 episode index 的现有返回恢复逻辑。

### Phase 5：关键词内容治理第一批

文件：

- `scripts/keyword-definitions.d/*.json`
- 必要时新增或修改 `content/keywords/*.json`
- `scripts/audit-keywords.mjs`

第一批不做 753 全量，只清当前薄弱 backlog。

步骤：

1. 跑 `node scripts/audit-keywords.mjs`。
2. 将输出的 `auto/meta/thin` 词分为：
   - A：升格为 `content/keywords/*.json`
   - B：补入 `scripts/keyword-definitions.d/*.json`
   - C：并入 alias 或维持 light
3. 每批只处理 8-12 个词。
4. 优先按节目簇：
   - `EP137 + EP135`
   - `EP133 + EP130`
   - `EP124 + EP131`
   - `EP125 + EP127`
   - `EP129 + EP134`
5. 每批完成后重新跑 audit。

验收：

- 薄弱词数量下降。
- 新增词条无自动模板痕迹。
- 每条词有明确对象定义、站内意义、相关节目证据。

## Agent 执行制度

### 角色

1. `Architect Agent`
   - 判定 keyword / concept / model / theme / alias。
   - 负责边界，不写正文。

2. `Writer Agent`
   - 每个 agent 只负责一个节目簇。
   - 产出 `summary / description / discussionAngles / episode notes`。
   - 不改全局关系网。

3. `Relation QA Agent`
   - 检查 `aliases / relatedKeywords / parents / canonicalRefs`。
   - 防止同义词误拆、相关词乱连。

4. `Critic Agent`
   - 按质量清单逐条打回。
   - 不写内容，只判合格与否。

5. `Lead Reviewer`
   - 由主 agent 负责。
   - 合并修改、跑 build、跑 UI smoke、看页面。

### 并行规则

- 同时最多 3 个 Writer。
- Writer 不允许互相改同一文件。
- QA 和 Critic 必须在 Writer 之后。
- 最终是否通过由 Lead Reviewer 决定。

## 质量标准

每条关键词必须满足：

1. 首句先说它是什么对象。
2. `summary` 有对象定义和站内讨论功能。
3. `description` 先讲现实对象，再讲知识库意义。
4. `episodes[].note` 解释为什么这一期和它有关，不能复读节目 summary。
5. `aliases` 只放同义、别称、英文名、旧写法。
6. `relatedKeywords` 只放真相关，不放同义词。
7. 抽象现象优先转 concept。
8. 机制框架优先转 model。
9. 多期共同问题线优先转 theme。
10. 页面上必须能指导用户下一步点击哪里。

必须返工：

- “围绕 X 的讨论入口”“值得保留”“当前锚定”这类空话。
- 读完仍不知道它是什么。
- 关键词和概念/模型重复解释。
- 同义词拆成多个页面。
- 相关节目 note 没有解释关联理由。
- 页面视觉上不可读。

## 验证命令

每个阶段至少运行：

```bash
npm run build
npm run test:ui
node scripts/audit-keywords.mjs
```

视觉阶段额外要求：

- 本地打开 `http://127.0.0.1:4310/#/keywords`
- 本地打开 `http://127.0.0.1:4310/#/keywords/singapore`
- 本地打开 `http://127.0.0.1:4310/#/themes/platform-labor-and-lived-reality`
- 手动 hover 深色卡片和关键词索引卡片。
- 截图确认正文链接、卡片标题、摘要、chip 都清楚。

## 完成定义

本计划完成时必须满足：

- 关键词页、主题页、概念页、模型页视觉和结构一致。
- 关键词和主题不再是旧式薄页面。
- 深色区域没有看不清的链接。
- hover 状态下文字和 chip 都可读。
- 点击正文知识链接再返回，能回到原展开位置。
- 第一批薄弱关键词完成补全，并通过 audit。
- `npm run test:ui` 通过。

