# 工作记录 · 2026-05-26 viewpoints 数量收紧整合

用户反馈"核心观点不能太多"。修订 SOP-知识库整理.md:609：viewpoints 数量从 6-9 条、硬上限 10，收紧为 **4-6 条、硬上限 6**。要求超标节目按"整合不是删除"原则压缩——合并同方向判断、把 mechanism 切片回流、案例下沉到 topic 或单条 body 内部。

历史超标 21 期已全部整合到 4-6 条范围内（title 8-18 字、body 80-180 字）：
EP079 7→5、EP128 8→5、EP129 8→5、EP130 7→5、EP131 8→5、EP132 7→4、EP133 7→5、EP135 7→5、EP136 7→5、EP137 7→5、EP138 7→5、EP139 8→5、EP140 8→5、EP141 8→5、EP142 7→4、EP143 12→5、EP144 7→4、EP145 8→5、EP146 8→5、EP147 10→5、EP148 9→5。

合并示例：EP143 12 条原文 → 5 条（优速通商业逻辑 4 条合 1；产权归属 3 条合 1；事件主角孩子 + 巨婴算法合 1；合格家庭教育 + 真正勇敢合 1；商业社会底层逻辑独立保留为升华）。

验证：`grep` 整库 viewpoints 长度 = 0 期超标。`npm run build` 通过（148 episodes，0 warning）。

---

# 工作记录 · 2026-05-25 早期节目摘要升级

补一段 2026-05-25 当天工作:

- EP147 video-link-overrides.json + content/episodes/EP147.json 补 B 站链接 BV1diGE6CE59,build 验证后 push 一次(commit 96f693e)。
- 扫描 147 期 summary 长度,发现 45 期 < 100 字符(占 30%),最短 EP065 仅 34 字符,与 EP145/146/147 那种 200-360 字"丰摘要"质量差距明显。
- 派 5 个 opus subagent 并行(各 9 期)按 EP145/146/147 风格 anchor 重写 summary。硬约束:必须 ground in srt(raw 字幕在 ../bilibili/raw/)、简体中文、200-360 字、只改 summary 字段、不写"本期"开头元话语。
- 45 期全部完成。长度 285-363 字符全部合规、繁体扫描 0 命中、内容 ground 在 srt 原话(数字/人名/机构/事件细节都可在字幕找到锚点)。
- 受影响 EP 清单: EP001 EP002 EP003 EP004 EP007 EP008 EP009 EP010 EP012 EP016 EP020 EP027 EP029 EP030 EP036 EP042 EP046 EP047 EP049 EP052 EP053 EP054 EP055 EP059 EP065 EP069 EP070 EP071 EP072 EP075 EP076 EP078 EP081 EP088 EP092 EP098 EP099 EP100 EP102 EP105 EP106 EP107 EP108 EP112 EP113。
- npm run build 通过(147 episodes, 0 warning)。docs/data/site.json 已含新 summary。

# 车圈笑傲江湖工作记录 · 2026-05-22

下一次对话继续改时,直接读这个文件就能接上。

## 一、今天新建的 12 个江湖词条(content/keywords/)

每个是一个独立 keyword JSON,kind=concept,按"角色身份 + 节目讽刺映射 + 剧情对应"结构写。

**节目原话对照(7 个):**

| 文件 | 角色 | 对应车企 | 节目原话出处 |
|---|---|---|---|
| `yue-buqun.json` | 岳不群(华山派) | 华为/问界·余承东 | EP050 |
| `dongfang-bubai.json` | 东方不败/任我行(日月神教) | 理想·李想 | EP055 |
| `gaibang-bangzhu.json` | 丐帮帮主 | 小米·雷军 | EP062 |
| `zuo-lengchan.json` | 左冷禅(嵩山派) | 蔚来·李斌 | EP067 |
| `fuwei-biaoju.json` | 福威镖局 | 比亚迪·王传福 | EP080 |
| `liu-zhengfeng.json` | 刘正风(衡山派长老) | 观致 | EP066 |
| `hengshan-pai.json` | 恒山派 | 小鹏 | EP074 |

**金庸全集扩展推测对照(5 个):**

| 文件 | 角色 | 对应车企 | 节目相关 EP |
|---|---|---|---|
| `murong-fu.json` | 慕容复(姑苏慕容氏,天龙八部) | 哪吒·方运舟 | EP131 |
| `huang-yaoshi.json` | 黄药师(桃花岛·东邪,射雕) | 特斯拉 | 未明示 |
| `ouyang-feng.json` | 欧阳锋(白驼山·西毒,射雕) | 恒大·许家印 | EP015/EP035 |
| `ding-chunqiu.json` | 丁春秋(星宿派,天龙八部) | 宁德时代·曾毓群 | EP039 |
| `jiumozhi.json` | 鸠摩智(大轮明王,天龙八部) | 领克·吉利 | EP091 |

## 二、补足过的已有 JSON 文件(content/people/ + content/keywords/)

7 个文件的 `programRole`(人物)或 `description`(关键词)末尾追加了江湖对照评论段:

- `content/people/yu-chengdong.json`(余承东)
- `content/people/li-xiang.json`(李想)
- `content/people/lei-jun.json`(雷军)
- `content/people/li-bin.json`(李斌)
- `content/people/wang-chuanfu.json`(王传福)
- `content/people/xu-jiayin.json`(许家印)
- `content/keywords/xiaomi-qiche.json`(小米汽车)

每个文件的 programAssociations 数组里的每个子条目 note 末尾也追加了一句"武侠剧情对应"。

## 三、地图实验页(dist/experiments/jianghu-map.html)

- 底图:北宋王希孟《千里江山图》(Wikimedia 公版)
- 12 派人物图(主要是手游/动漫立绘 + 电视剧剧照),存在 `dist/experiments/assets/jianghu/`
- 点击节点从右侧抽屉弹出对应车企讽刺骨架 + EP 链接
- 点击外部 / 按 ESC 关抽屉

## 四、主站代码改动(src/app.js)

1. **网页日志条目**:加了 2026-05-22 "车圈笑傲江湖地图实验页"条目(WEBSITE_LOG_ENTRIES 顶部)
2. **节目页顶部**:涉及笑傲江湖讨论的 15 期节目(EP013/015/017/035/039/041/050/055/062/066/067/074/080/091/131)的关键词条带最前面加了朱红"笑傲江湖" chip,点跳地图页
3. **武侠词自动高亮**:`renderLinkedEpisodeText` 末尾接了 `highlightJianghuTerms`——节目正文里所有武侠词(22 个,见 JIANGHU_TERMS)自动变成朱红虚线下划线可点击,跳地图
4. **节目页导航顺序**:"返回前一页/返回首页" 和 "上一集/下一集" 上下位置对调(语义上的"上一级"在上面)

## 五、已知问题(下次要改的)

### 5.1 AI 套路句 — 优先级最高

11 个新词条(除 yue-buqun.json 我手写过)是助手批量写的,里面散布着典型 AI 痕迹:
- "金庸最狠的一笔" / "最深刻的一笔" 等评论家口吻
- 段落结尾的强行对仗金句(如"终点不是X,是在Y里失去现实感")
- "本网站推测这是最贴切的对照" 这种像广告词的话
- 节目里没明说但硬讲"虽然没用这个意象,但..." 的过度推测

**下次任务**:让助手或我自己审 11 个文件,把这些套路句改成更自然的散文。`yue-buqun.json` 可以作为"已经改顺过"的样板。

### 5.2 地图节点位置

12 派在《千里江山图》底图上的位置是按之前的空底图坐标(2:1 框架)摆的,现在底图是真山水画,节点和山水的对应关系是随机的——不是按地理逻辑(华山在北、桃花岛在东海等)摆的。下次可以按地理逻辑微调。

### 5.3 地图人物图不完美

下载的图里有 4 张不是干净单人立绘:
- `liangbi.jpg`(刘正风):双人画含曲洋
- `linke.jpg`(鸠摩智):三视图设定稿不是单人
- `hengshan.jpg`(恒山派):助手未 100% 确认是仪琳/尼姑
- `nezha.jpg`(慕容复):虽然换成黄海冰 TV 剧照已合格,但仍可考虑换更生动的图

### 5.4 没有独立 keyword 文件的 12 家车企

华为/问界/理想/蔚来/比亚迪/观致/小鹏/哪吒/特斯拉/恒大/宁德时代/领克 在 `content/keywords/` 下没有独立 JSON 文件,build 时从节目 tags 自动聚合 keyword 页,description 字段为空。这些页面打开看不到江湖对照——目前只能通过武侠词自动高亮跳地图。

**下次任务**:决定是否给这 12 家也建独立 keyword JSON 文件(按 SOP 规范)。

### 5.5 笑傲江湖搜索

主站搜索"笑傲江湖"目前找不到任何条目(因为 12 派关键词中文名都是角色名/门派名,不含"笑傲江湖"四字)。可以在搜索 pool 里加一个固定条目,搜"笑傲江湖"/"江湖"/"门派"等就出现地图入口。

## 六、跟金融相关的工作

今天没做和金融相关的内容。如果你说的"金融"指的是宁德时代/恒大/蔚来等"资产化/融资飞轮"那条讽刺线,那已经融在江湖词条里了(欧阳锋、丁春秋、左冷禅都涉及金融讽刺骨架)。

如果你指的是别的金融内容(比如新加专门的金融词条),需要下次再聊清楚。

## 七、地图入口

- 实验页:`http://127.0.0.1:4310/experiments/jianghu-map.html`
- 涉及节目页(15 期):顶部关键词条带左侧朱红"笑傲江湖" chip
- 12 江湖词条页:`/#/keywords/yue-buqun` 等 12 个

## 八、git 状态

今天的所有改动还**没有 commit + push 到 github**。下次可以一并处理。
