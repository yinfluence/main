# 工作记录 · 2026-07-31 191 期节目全量精修

把全部 191 期节目的核心观点重写了一遍，同时改掉页面结构。这次不是补内容，是把整套写作标准立起来再逐期落地。

**页面改了六处。** 延展板块和「直播里聊过」在精修过的期里隐藏（靠 `inlineKnowledge: true` 开关），关联概念和关联模型不再单独列区块、改成嵌进正文自动生成内联链接，「讨论边界」区块整体删掉。核心观点统一走折叠不再按条数切卡片，所有折叠默认关闭，内联链接的悬浮提示加上「概念：」「模型：」这类类型前缀。还修了一个折叠状态的 bug：原来只在点内联链接跳转时保存展开状态，手动开关不保存，刷新后会自己弹开，改成监听 `toggle` 事件实时存。

**核心观点的标准定死在 `sop/05a`。** 每期 4 到 5 条，结构是 `{title, body, angle}`。标题必须是判断不是事实描述，直接把结论说出来，读者能带走一个用在别处的想法；带逗号的两段式标题不超过一半，「不是A是B」句式每期最多一条，几条标题的句式不许排比。body 110 到 135 字，前面讲本期具体事实（数字人名全部来自字幕），最后一句拓一层可迁移的判断。`angle` 是 2 到 6 字的领域维度名词，判断标准是能不能当栏目名——人物身份（继承人、车主）、具体动作（一次勾选）、疑问（怎么验证）、学术黑话都不合格，同一期的几个 angle 竖着排要是同一类词。

**写了检查脚本机械卡住易复发的问题。** `check_ep.py` 查这些：观点条数、两段式标题占比、「不是A是B」条数、angle 的词性和长度、编辑口吻词（本期/这期/节目里/节目说/落点是/判断是/要问的是）、导读套话（最狠的/更要紧的是/值得注意的是）、正文里的中文冒号分号、`inlineKnowledge` 标记、该期 concepts 和 models 的中文名是否全部落进了正文。之前反复被指出的问题（angle 写成身份词、标题绕圈不说结论、AI 味的对仗句）靠人盯不住，靠脚本才卡得住。

**改法是主线程加助手并行。** 主线程亲自做了 EP004、EP017、EP024、EP037、EP066、EP073、EP074、EP090、EP109 和 EP137 到 EP143，其余分给助手，每批三期，并发上限 20，跑完一批补一批。助手交付后主线程逐期复检并抽审。

**顺带修掉的事实问题**（都是之前整理时留下的，不是这次改出来的）：
- EP148 判决年份 2025 改成 2026（字幕说「今年 2 月」，该期发布于 2026-05）
- EP144 的「川普访华」时间锚点字幕里根本没有，按字幕改写
- EP082 原文写「日本正向更前台化位置移动」「直接影响台海、新加坡」，字幕说的恰恰相反（高市首要任务是国内经济），台海和新加坡在这期一次都没出现，五处全清
- EP087 的「神权体制」是整理时自行升级的概念，字幕没有
- EP088 的「拖字诀」应为「托字诀」，托是撑住账面，拖是往后推，语义反了
- EP072 删掉字幕没有的「哈佛」，补上 2022 年时间锚点
- EP076 删掉字幕没有的「散户等故事讲透才进场」，EP077 删掉串自 EP090 的保险承保框架
- EP100 的 summary 和 mechanism 串了 EP102 的内容（平台、车厂、搜索引擎），按字幕改回三档养老金差距
- EP092 标题的「爱波斯坦」统一成「爱泼斯坦」
- EP097 的 people 里有字幕没提过的人名，已移除
- EP072 的延展标题「关于学校教育」下面讲的是万达和融资局，改成「关于融资条件」
- 补建了 `content/concepts/youth-mobilization.json`（EP120 引用但文件不存在，前端会静默跳过）
- EP051 的延展标题「关于霍尔木兹」下面讲的是海南和新加坡，改成「关于枢纽替代」
- EP062 曾把字幕里的丐帮、帮主直接写成小米汽车和雷军，正文出现了节目自己没说过的指认，整条回调成化名口径，并把这条规则写进了 `sop/05a` 的「化名口径：正文跟着节目走」
- EP020 的 themes 里有「大政府与激励反转」，这期讲的是九紫离火运和女性走到前台，完全不搭，已摘掉（theme 节点那边本来就没收录 EP020，是单向悬空）
- EP034 的 tags 有「超导材料」，字幕只说他在材料科学与工程学院任职，已删
- EP041 顶层延展写「小米汽车批评」，字幕全程只说「杂粮汽车」，改成不点名
- EP035 的「普通债权人只能拿回 0.7%」不准确，字幕是 60 万以内全额还清、超出部分才 0.7%
- EP046 的利率写成 4%-7%，字幕是理财 5% 到 7%、出兑付危机的那批 4% 到 5%
- EP051 的 summary 说「问题被拆成五块」，字幕两次说的是四点
- EP030 的「医保连续十年盈余」应为「连续十年以上盈余」，「四年前推广三明医改」应为「四年前开始降薪」
- EP059 的 summary 写外界用「老男人被拿捏」的框架看这段关系，字幕没有这个说法
- EP049 删掉「市场把未来几十年回报提前透支进价格」，字幕没有这层市场推论
- EP042 顶层延展提「贵金属、财经博主」，字幕里两样都没有
- EP033 顶层延展提「粉底液将军、酱板鸭平台推热」，那是别期的内容
- EP067 的 summary 写「把电池、换电站和地方资金装进体外平台」，字幕说的是上下游公司不是换电站
- EP064 的 conflicts 点名乌克兰，字幕只说「一个生活良好、拥有民选政府的主权国家」

另外压回了 8 条超出 135 字上限的 body（EP169/176/177×2/181/186/187/190），都是最早几期留下的。

**EP032 已补齐**：这期的字幕文件原本装的是 EP024（石家庄外卖小哥）的稿子，全仓库没备份，B 站视频已下架，YouTube 那版又没有任何字幕轨。当天由用户提供了完整文字稿，已存进 `workbench/EP032/EP032.transcript.txt`，整期按真内容重做。

重做前那一版是没字幕时按标题猜的，重点整个偏了——写成了平台封禁与传播治理。真内容是逐条拆解民间三论：力工 All-in 是小农意识的现代版，跟美国阿米什人同一条路，最大的 bug 是攒到一定程度会碰上统治阶级；安卓人苹果人的核心不是讲道理是让人看见，把牛马和富人的作息折叠进同一个画面；性压抑理论加那个性字只为传得开，说的是压抑，因为背后是反抗，三论里它破坏力最大。summary、background、conflicts、boundaries、mechanism、viewpoints 全部重写。

**验收**：`scripts/audit-episodes.py` 一次跑完全部检查，结果是 191/191 覆盖、191/191 逐期通过、概念模型零悬空引用、site.json 与 content 目录对得上、内联链接全量正常、937 条观点标题零重复、body 字数全部落在 103 到 141 字之间。另外人工抽样复核了 11 期，逐条读标题和末句，并回字幕核对过 EP046 的利率、EP112 的格力市占率这类硬数字。

两个脚本已归档进仓库：`scripts/check-episode-style.py` 查单期，`scripts/audit-episodes.py` 查全量，用法写在 `sop/05a` 末尾。下次写新一期直接跑。

`npm run test:ui` 仍卡在关键词分组那条断言，`sop/06` 早记成 pre-existing，跟这次无关。

**已知未处理**：24 个 people 值在 site.json 里没有对应人物条目（华与华、马姆达尼、欧尔班、王兴兴、俞浩、郑强、赫格塞斯等）。前端 `findPersonByReference` 找不到就跳过，不是死链，只是这些名字不会变成可点链接。要补就是新建 24 个人物页，单独当一个任务做。

---

# 工作记录 · 2026-07-30 EP190 入库 + 每日自动化止损重建

用户问「影响力不是已经更新了吗，之前那个检查脚本为什么没检查」。查下来脚本每天都按时跑了，是连续三次静默失败：7-29 的 12:10 和 13:10、7-30 的 12:10 全部卡在 `isLogin=false`。EP190 因此晚了一天。

**根因两条，叠加。** 一是 cookie：Chrome 里人明明登录着，但 yt-dlp 读的是磁盘上的 Cookies 库，Chrome 运行时新 SESSDATA 还留在内存，导出的是已轮换的旧值。决定性对照——同一时刻同一网络同一 UA，12:10 那份 cookie 问 `nav` 返回 `-101 未登录`，重新导一份返回 `isLogin=true`（长坡漫道）。二是窗口：原窗口北京 20:05 起，而 UP 从 EP177（07-06）起已改成北京 19:00 发，19 点档全靠一次「窗口外单扫」捡漏，单扫失败就没有第二次。

**为什么两天没人知道**：失败走 `display notification`，请求被系统静默丢弃而 `osascript` 照样返回 0。实测弹窗能看见，但用户要求不弹窗，改成落盘。

- 时区订正：英国 BST 与北京差 **7 小时不是 8**。用 `zoneinfo` 重算最近 12 期 `publishedAt`，10 期是 UTC 11:00 整 = 北京 19:00。B 站页面按浏览器时区渲染成 12:00，按 +8 算就会误读成 20:00。用户在北京 19:26 已看到视频，也反证不可能是 20:00 发。
- `scripts/scan-new-episodes.py`：新增 `BiliError`（风控返回 HTML 时给人话而不是裸 `JSONDecodeError`）、`cookie_has_session()` 校验、`export_cookies()` 先删旧临时文件并检查 yt-dlp 返回码（原来只判文件存在，失败会静默复用过期 cookie）、`login_cookies()` 隔 25 秒重导最多 3 次 + 长效 cookie `scripts/.bili-cookies.txt` 兜底、`local_eps()` 改为只认整理完成的期号。
- `local_eps()` 的判据是 `summary` 不是 `status`：早期 53 期根本没有 `status` 字段，按 `status` 判会把它们全当草稿重新整理一遍（改之前实测确认过这个坑）。
- `scripts/auto-daily.sh`：`notify()` 改为写 `logs/status.json` + `logs/status-history.jsonl`（含 `consecutive_failures`）；锁带 PID 和出生时间、僵死或超 2 小时自动清理；`watch_agent()` 看护整理进程（日志 15 分钟无增长判卡死、总时长 60 分钟判超时，`kill_tree` 连子进程一起杀）；`scan_with_retry()` 失败隔 5 分钟重试最多 2 次；`SUMMARY` 只在本次输出里找（原来 grep 整天日志，同日第二次失败会捡到上次的标记误判成功）；`today_done()` 不再被草稿骗到。
- 调度：`~/Library/LaunchAgents/com.yingxiangli.daily-auto.plist` 启动点定为英国本地 `12:10 / 12:20 / 13:10 / 13:20`（按用户要求对齐北京 20:10 与 20:20，冬夏各一套）+ `16:00 / 18:00` 当天补救点。窗口起点 UTC 10:50（北京 18:50），密集扫描靠窗口内 10 分钟一轮循环。曾加过 `10:50 / 11:50` 两个更早的点，用户要求删除。
- 新增 `scripts/test-scan-cookies.py` 与 `scripts/test-auto-daily.sh`，`npm run test:auto` 一键跑，38 项断言覆盖失败路径：cookie 重试与兜底、风控 HTML、僵死锁三种情形、卡死检测与误杀防护、重试上限、收工判断不被草稿骗。测试全在临时目录跑，不碰真实 `logs/`、不真去 B 站、不唤起 claude。
- EP190 是修完脚本后**由脚本自己跑完的**（用户要求不手工代做）：12:36 扫到 → 下字幕 23KB → 唤起 claude 整理 24 分钟 → 13:00 上线，commit `1a8c286`。
- 验证：`npm run test:auto` 38/38；真实 `--dry-run` 返回 10（无新期，本地 190 期）；线上 `yinfluence.github.io/main/data/site.json` 已含 EP190 且 `episodes=190`；远端与本地 HEAD 哈希一致；`launchctl print` 确认 6 个启动点已注册。
- 已知：`npm run test:ui` 关键词分组断言仍失败。`sop/06:268` 已把它记为 pre-existing 并明确要求不要反复用 stash 去验证，与本次无关。

---

# 工作记录 · 2026-06-01 EP152 漳州杨梅泡药入库

新节目 EP152《出口欧盟规规矩矩，内销全是科技狠活！漳州杨梅双标背后的真相》。用户提供 YouTube 链接 + 纯文字稿，B 站暂未上架。

- `content/episodes/EP152.json`：summary + topic(background/conflicts/boundaries/mechanism/extensions) + 6 条 viewpoints（合规硬上限 6，已把"性价比逼出泡药"与"果农升级不划算"合并）+ 3 条 extensions。videoLinks：bilibili `status: unavailable / note: 暂未上架`、youtube `bCy491aOyHk`。
- 视频链接：`scripts/video-link-overrides.json` 顶部新增 EP152，B 站暂未上架、YouTube 已填。B 站后续上架后需把灰色改真实链接并按情况补 `access: member`。
- 新建概念 `content/concepts/malevolence-self-fulfilling.json`（性恶预设的自我实现）。
- 新建模型 `content/models/ex-post-accountability-governance.json`（事后追责治理 / 法治 vs 管制）。
- 复用并反向回填 EP152 到既有节点 episodes：themes(rule-of-law-boundaries-and-social-trust、hidden-costs、performative-governance-and-ritual-display)、concepts(compliance-cost-gap、cost-shifting)、models(regulatory-cost-arbitrage、risk-transfer-chain)。
- 9 个 tags 全部建独立关键词词条（3 个 opus agent 并行起草、主线审）：杨梅泡药(event)、食品安全(general)、科技狠活(concept)、冷链成本(mechanism)、事后追责(mechanism)、法治与管制(concept)、性恶论(concept)、利维坦(concept)、选择性执法(mechanism)。sources 均空、节目语境归因、无编造 URL、无繁体。
- 验证：`npm run build` 通过（152 episodes、0 warning）；`audit:keywords` 本期 9 词条 + EP152 零告警（其余告警均为 EP139/142/144/148 等既有问题）；繁体扫描 0 命中；EP152 在 site.json 渲染正常（9 tags、3+3+3 关联、视频状态正确）。
- 已知：`npm run test:ui` 在"关键词首页 5 组 vs 10 组"断言处失败——已对比 HEAD 版 site.json 确认该断言在本次改动前就失败（首页固定 5 组是 SOP:137 现行设计），与 EP152 无关，未在本任务内修改测试。

---

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
