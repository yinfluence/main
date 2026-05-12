import { destroyGraphView, renderGraphView } from './graph-view.js';

const app = document.getElementById('app');
const sidebar = document.getElementById('sidebar');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');
const sidebarBody = document.getElementById('sidebar-body');
const menuButton = document.getElementById('menu-button');
const desktopMenuButton = document.getElementById('desktop-menu-button');
const sidebarClose = document.getElementById('sidebar-close');
const backToTopButton = document.getElementById('back-to-top');
const floatingEpisodeSearchButton = document.getElementById('floating-episode-search');
const floatingActions = document.getElementById('floating-actions');
const floatingActionsToggle = document.getElementById('floating-actions-toggle');
const sectionProgress = document.getElementById('section-progress');
const sectionProgressPanel = document.getElementById('section-progress-panel');
const viewportMeta = document.querySelector('meta[name="viewport"]');
const HOME_PLATFORM_LINKS = [
  {
    platform: 'bilibili',
    url: 'https://space.bilibili.com/91741174?spm_id_from=333.337.search-card.all.click'
  },
  {
    platform: 'youtube',
    url: 'https://www.youtube.com/@颖响力'
  }
];
const WEBSITE_LOG_ENTRIES = [
  {
    date: '2026-05-12',
    title: '知识图谱节点展开交互重做',
    items: [
      '知识图谱改为点击节点先锁定并慢慢展开相邻节点，再次点击同一节点才进入详情页，避免误跳转。',
      '高连接节点会按连接数扩大展开范围，相邻节点围绕中心节点形成更清晰的展开带，底图同步压暗，减少重叠和干扰。',
      '从展开节点进入详情页后，浏览器返回会恢复到刚才的图谱展开状态；拖拽节点时焦点也会保持在正在拖动的节点上。'
    ]
  },
  {
    date: '2026-05-12',
    title: '新增 EP138 五粮液业绩大洗澡整理',
    items: [
      '新增 EP138《五粮液的大洗澡，散户真的看得懂吗？三大核心乱象把A股玩的明明白白！【EP138】》，B 站入口按会员视频写入，并补齐 YouTube 入口。',
      '本期把五粮液整理为任期切割、渠道利润蓄水池和 A 股惩戒失效三条主线，延展话题接回 EP112、EP119、EP114、EP076、EP105 等节目。',
      '新增“业绩大洗澡”“渠道利润蓄水池”“市场惩戒失效”和对应模型，用来承接白酒经销商、上市公司报表与散户买单结构。'
    ]
  },
  {
    date: '2026-05-12',
    title: '关键词分类入口改为十种类型',
    items: [
      '关键词首页改为人物、地理位置、公司机构、产品技术、资产商品、事件、机制、概念、主题和通用类十个可展开入口。',
      '关键词详情页的类型标签现在可以点击返回关键词页，并自动展开对应类型。',
      '把一批高确定性错分词从通用类调整到更合适的类型，避免通用类变成未审核兜底。'
    ]
  },
  {
    date: '2026-05-12',
    title: '关键词体系全量重写与审计',
    items: [
      '完成 752 个关键词页面的类型归类、结构化介绍、节目关联和延展阅读整理，人物、地理位置、公司机构、产品技术、事件、机制、概念、主题、资产商品和通用类按统一标准展示。',
      '修复关键词页与相关节目区断裂问题，构建时会把节目关联里的 EP 自动同步到相关节目列表，并新增审计规则防止回退。',
      '清理旧模板口吻和后台维护语气，概念、模型和主题详情页改用“信息关联”“判断边界”等读者向栏目。'
    ]
  },
  {
    date: '2026-05-11',
    title: '新增 EP137 无人出租车安全整理',
    items: [
      '新增 EP137《你坐的无人出租车安全吗？武汉萝卜快跑事故，给所有人提了致命醒！【EP137】》，B 站入口已按用户提供链接写入普通视频，并补齐 YouTube 入口。',
      '本期把无人出租车整理为集中式云端控制、分布式车端自主、异常安全兜底和城市道路外溢风险四条主线，延展话题接回 EP013、EP084、EP091、EP103、EP113、EP129、EP135。',
      '新增“集中式控制反噬”“系统兜底”和“集中式控制反噬模型”知识节点，并把 EP137 接入新能源安全、汽车研发治理、大计划体制与 AI 替代主题。'
    ]
  },
  {
    date: '2026-05-10',
    title: '新增 EP136 影子舰队整理',
    items: [
      '新增 EP136《影子舰队凭什么构架全球灰色贸易网络？1.5亿运力，改写世界贸易与货币规则！【EP136】》，B 站入口已更新为普通视频链接，并写入 YouTube 入口。',
      '本期把影子舰队整理为灰色贸易的运输基础设施，延展话题接回 EP019、EP060、EP090、EP107、EP122、EP123、EP130、EP133、EP135 等节目。',
      '新增“影子舰队”“海上洗白”和“制裁平行市场模型”知识节点，并把 EP136 接入美元体系、海峡秩序、制裁遏制和东南亚裂变主题。'
    ]
  },
  {
    date: '2026-05-08',
    title: '首页节目轮播导航状态修复',
    items: [
      '修复从左侧导航点击“首页”返回后，首页节目区左右切换键被旧轮播状态锁住、只有刷新首页第一次可用的问题。',
      '首页轮播现在会在路由切换时清理自动播放计时器、动画计时器、事件绑定和滑动状态，重新进入首页后按钮会重新接管当前轮播。'
    ]
  },
  {
    date: '2026-05-08',
    title: '新增 EP135 俄乌未来战争预演整理',
    items: [
      '新增 EP135《红场阅兵取消重装备方阵！俄乌战争彻底反转，我们正在看未来战争预演。》，B 站入口按用户提供链接标记为会员视频，并写入 YouTube 入口。',
      '本期把俄乌战争整理为战略纵深反转、分布式战时工业和分布式战争系统三条主线，接回 EP095、EP098、EP107、EP113、EP120、EP123、EP133 等节目。',
      '新增“战略纵深反转”“分布式战时工业”和“分布式战争系统”知识节点，用来承接无人机、固定能源设施、战时生产和欧洲援助结构。'
    ]
  },
  {
    date: '2026-05-07',
    title: '新增 EP134 躺平国整理',
    items: [
      '新增 EP134《躺平不是摆烂，是当代年轻人最隐蔽的弱者武器！主动内移民到躺平国？》，B站入口按用户反馈标记为已下架，并写入 YouTube 入口。',
      '本期延展话题整理为 5 条主题线：关于躺平国、关于年轻人机会、关于稳定岗位、关于平台治理、关于蒙娜丽莎，串联 EP005、EP006、EP032、EP043、EP111、EP128、EP129、EP132。',
      '新增“内移民”“躺平国”“弱者的武器”和“不可读退出治理模型”等知识节点，并把 EP134 接入年轻人退出、平台治理和安全路径主题。'
    ]
  },
  {
    date: '2026-05-07',
    title: '全站延展话题多点修正',
    items: [
      'EP001 到 EP133 的节目详情页延展话题继续扩展为 426 条主题点：只有 EP081 保留 2 点，其余 106 期为 3 点、24 期为 4 点、2 期为 5 点。',
      '延展话题小标题继续按短句式“关于xxx”校正，修掉“关于西贝”套到始祖鸟、“关于电车研发”套到选美赛事这类不贴题标题，优先让读者一眼看懂涉及的人、事、行业或国家。',
      'SOP 和延展话题审查脚本同步加入“2 条不是默认模板”的规则：相关节目越多，审查会要求更多主题点，同时继续检查每点至少串联 2 个外部节目。'
    ]
  },
  {
    date: '2026-05-06',
    title: '节目详情正文 EP 内链修复',
    items: [
      '节目详情页的摘要、话题折叠项、核心观点和延展区统一接入 EP 内联链接渲染，正文里出现 EP132、EP057 这类节目编号时可以直接跳转到对应节目。',
      '网页日志条目和关键词分组说明也同步支持 EP 内链，继续保留整张节目卡片里的纯文本摘要，避免卡片链接里嵌套链接导致点击冲突。',
      'SOP 增加节目引用内链规范：所有非卡片正文里的 EPxxx 引用必须可点击，构建后要确认 docs 站点同步更新。'
    ]
  },
  {
    date: '2026-05-05',
    title: '首页搜索栏吸顶与显隐边界修正',
    items: [
      '首页搜索栏在自身原始位置进入视口、或仍处于搜索区域吸顶范围内时会强制保持可见，不再出现顶部区域搜索栏消失的问题。',
      '滚过搜索区域进入后续内容区后，搜索栏恢复原有行为：下滑和闲置会收起，上滑时临时显示。',
      '补充紧凑桌面视口与滚动边界 UI 回归，覆盖顶部可见、滚过搜索区隐藏、上滑显示后闲置再隐藏三类场景。'
    ]
  },
  {
    date: '2026-05-05',
    title: '全量节目 YouTube 发布时间校准',
    items: [
      '全量检查 133 集节目 YouTube 链接，并从 YouTube 页面元数据写入每集真实公开视频发布时间。',
      '“新”标识改为按节目 `publishedAt` 判断，不再依赖本地字幕或整理文件的修改时间。',
      '本地、GitHub Pages 和 yinfluence.org 后续只要使用同一份 repo 数据构建，就会得到一致的“新”标识。'
    ]
  },
  {
    date: '2026-05-05',
    title: '小轮盘章节菜单交互修正',
    items: [
      '点击小轮盘打开“页面章节”或“节目轮盘”后，章节菜单会保持打开等待选择，不再自动消失。',
      '章节菜单打开时小轮盘本体会立即隐藏，避免覆盖当前高亮项和菜单文字。',
      '从节目轮盘进入节目详情、或从章节菜单跳转内容后，菜单与小轮盘会一起收起，路由切换时也不会立刻闪回遮挡内容。'
    ]
  },
  {
    date: '2026-05-05',
    title: 'EP133 入库、首页推荐随机化与 Pages 发布修复',
    items: [
      '新增 EP133 节目页，把阿联酋退出欧佩克拆成“中东新加坡”路线：安全靠美国兜底，经济上承接港口、金融、航运、能源和人才。',
      '补齐 EP133 的 B 站与 YouTube 视频入口，并新增“阿联酋”“欧佩克”“沙特”关键词入口，接回霍尔木兹、沙特、伊朗和新加坡小国生存术等知识线。',
      '首页“概念入口”和“思想模型”不再固定显示排序前 3 个，改为和“推荐关键词”一样随机推荐；点击“换一换”会同步刷新关键词、概念和模型三组推荐。',
      '发布目录加入 .nojekyll，GitHub Pages 改为直接发布 docs 静态文件，避免 Jekyll 构建卡住后线上仍停在旧版本。'
    ]
  },
  {
    date: '2026-04-30',
    title: '全站节目标题与 B 站入口对照修正',
    items: [
      '按 YouTube 标题第一个“｜”之前的主标题统一校正节目标题，避免整理版短标题和公开视频标题不一致。',
      '用 B 站“颖响力”列表重新对照节目，补回 32 期此前误显示为“已下架”的 B 站入口，并写入人工覆盖表。',
      '首页节目卡片简介恢复固定行数截断，EP128、EP129 的摘要也按 SOP 收回到 2-3 句判断型摘要，避免新节目把首页卡片撑长。',
      '视频维护 SOP 增加标题基准和跨平台对照规则：标题以 YouTube 主标题为准，B 站匹配优先用官方列表和 EP 编号，不再只依赖网页现有标题搜索。'
    ]
  },
  {
    date: '2026-04-28',
    title: 'EP128 入库：系统回滚、泛体制中产与体制身份分层',
    items: [
      '新增 EP128 节目页，把广告审美变稳妥的问题接到系统回滚、泛体制中产、体制身份和三四线城市中产结构变化。',
      '补齐 EP125 的 B 站与 YouTube 视频入口，并写入人工覆盖表，避免后续自动同步漏掉这期。',
      '新增“系统回滚”“泛体制中产”“身份压倒财富”“转移支付依赖”等概念，以及“稳定替代增长陷阱”“身份型分层”两个模型。',
      '补齐“体制化中产与社会流动”主题和系统回滚、泛体制中产、体制身份、转移支付、三四线城市、广告审美等关键词入口。',
      'EP128 的 B 站会员入口已补齐，并同步写入视频链接人工覆盖表；YouTube 入口保持可用。'
    ]
  },
  {
    date: '2026-04-26',
    title: 'EP126 入库、会员视频入口和节目索引吸顶修复',
    items: [
      '新增 EP126 节目页与“三层杠杆”概念，把恒大、许家印和房地产系统性风险接回地产去杠杆、地方财政、强人治理等知识线。',
      'EP121 与 EP126 的 B 站入口均更新为会员节目链接，并写入人工覆盖表，避免后续自动同步把会员入口回退成灰色状态。',
      '视频链接 SOP 修正“暂未上架”和“已下架”的区别，并把纯文字稿导入规则从旧的伪造 .srt 时间轴改为直接保存 .md。',
      '节目索引顶部工具条恢复为页面流内 sticky：初始位置不再遮住“节目索引”标题，悬浮后按同方向累计滚动距离判断大幅下滑隐藏 / 大幅上滑出现，闲置 10 秒自动收起；区间按钮切换后会定位到该区间第一张节目卡，节目卡片去掉了多余的“查看”胶囊。',
      '修复 Chrome 浏览器里悬浮集数轮盘点了不切换的问题：横向轮盘不再在 pointerdown 时立即捕获 pointer，只有确认拖动后才捕获，避免真实鼠标 click 被外层轮盘吞掉。',
      '左侧导航品牌标题固定单行显示，窄屏下通过字号和头像尺寸收敛，不再把“颖响力知识库”折成两行。'
    ]
  },
  {
    date: '2026-04-24',
    title: '知识页模板、索引文案、头像与轻量切换继续校正',
    items: [
      '概念页先收成总览 / 分析 / 证据三层结构，再把同一套详情页模板推广到模型页和主题页；主题页如果只有“主题说明”，不再强行做成折叠项。',
      '知识页里的相关节目区重新按“节目卡主体”和“关键词入口”分层，默认计数改成“当前显示 x / 共 y 期”，避免默认只露出 3 张卡时误读成总数写错。',
      '正文里的 EP 内联说明浮窗改成全局浮层，不再被局部卡片或折叠容器裁切；相关卡片和正文里的可点击态也重新拉开层级。',
      '概念 / 思想模型 / 人物 / 主题索引页删掉“当前显示、按引用率排序、每类先显示 3 个”这类无效提示，并把头部说明改成更像导航导语的版本；关键词页也同步去掉页内搜索和统计提示，避免和右侧搜索入口重复。',
      '概念 / 模型 / 人物 / 主题索引页默认不再自动展开第一组，交给用户自己选择要先看哪一类。',
      '首页与侧栏头像显示方式改成完整可见，不再把头像顶部裁掉；知识页之间的切换也改回很轻的过渡，不再出现之前那种明显卡顿和二段跳闪。'
    ]
  },
  {
    date: '2026-04-24',
    title: '节目索引关键词可跳转、轮盘定位修正与可点击态强化',
    items: [
      '节目索引卡片改成和首页一致：整卡进入节目详情，关键词标签单独进入对应关键词页。',
      '节目索引卡片里删掉无意义的“关键词”提示字样，头部说明也收成更干净的标题区。',
      '节目索引右侧“节目轮盘”打开时会自动滚到当前节目，不再总是从顶部开始显示。',
      '首页右侧悬浮按钮补入节目搜索放大镜，顺序整理成“导航 / 搜索 / 首页 / 返回顶部”。',
      '从任意页面调起节目搜索后，如果没有真正进入结果，会回到原页面和原滚动位置，不再先跳到顶部再退回。',
      '节目索引顶部补上“返回前一页”，避免只剩“返回首页”这一条出口。',
      '节目索引里的最近三天节目现在也会显示和首页一致的红色“新”标识，三天后自动消失。',
      '右侧节目搜索空态补回“推荐关键词 + 换一换”，推荐词数量收成更短的一组，避免建议区无限下探。',
      '右侧节目搜索输入时，下面的节目结果会直接同步更新；顶部知识建议只保留知识条目，不再重复混入节目 EP 信息。',
      '人物搜索结果会优先落回对应的人物关键词页；如果“人物”和“关键词”最终指向同一个词条，只保留“人物”这一条。',
      '推荐关键词点击恢复成“把词带进搜索框并展示相关节目”，不再直接跳知识页；知识建议右侧类型标签也重新固定到卡片右边。',
      '首页移动端节目卡滑动手势继续调校，去掉达标翻页前先回弹一下再滑过去的抽搐感，让跟手感更顺。',
      '左侧导航重新打开时会回到顶部，不再保留上一次停留在中段的滚动位置。',
      '首页与节目索引里的关键词链接重新拉开默认态颜色，让用户更容易看出这些标签可以点击。',
      '关键词在深色卡片上的 hover 状态统一改回浅底高亮，避免悬停后和背景糊在一起看不清。',
      '节目搜索取消自动收起，改成由用户主动退出；同时补齐并更新这批首页 / 节目索引交互的桌面与移动 UI 冒烟检查。'
    ]
  },
  {
    date: '2026-04-23',
    title: '首页状态规则回收，折叠箭头修复，桌面轮播恢复多卡',
    items: [
      '修复移动端折叠态“向上”按钮图标异常：Safari 缩放下不再把箭头渲染成一个点。',
      '首页节目卡片状态文案恢复为“新 / 已整理 / 待整理”三态，不再把会员状态塞进首页卡片眉标。',
      'EP124 的 B 站链接继续保留会员数据，但会员标识只留在节目详情页视频入口，不再干扰首页状态判断。',
      '桌面首页节目区恢复按宽度显示 1-3 张，不再和移动端强行共用单卡布局。',
      '桌面节目切换改回更稳定的直接切换，先消掉卡顿和闪烁，再保留多卡可读性。',
      '补入项目内自动化 UI 回归命令，桌面与移动端统一纳入固定冒烟检查。'
    ]
  },
  {
    date: '2026-04-23',
    title: '移动端首页继续收紧，视频链接与交互问题修复',
    items: [
      '移动端首页 Hero 区继续反复校准：标题、头像、平台按钮的相对位置重新梳理，避免头像把标题和按钮布局拖坏。',
      '移动端首页节目卡片改成更紧凑的内容优先布局，删掉冗余按钮与提示，把更多可视空间留给节目简介本身。',
      '首页节目卡片的触摸点击判定放宽，减少手指轻微位移时“点了却没打开节目”的情况。',
      '移动端左侧导航打开时增加真实滚动锁，避免侧栏打开后背景页面继续跟着滑动。',
      '重新同步节目视频链接数据，修复大量节目页里 YouTube 显示“未找到”的问题。',
      '首页最新节目“新”标签增加兜底判断，避免部署数据异常时最新一期不亮新标。'
    ]
  },
  {
    date: '2026-04-22',
    title: '首页恢复可用并收敛轮播与搜索联动',
    items: [
      '修复首页脚本重复声明，解除“正在加载知识库...”卡死状态。',
      '节目索引轮播改为局部更新，按钮、手势与自动轮播统一按一次移动一个节目处理。',
      '首页节目卡片高度收敛到稳定区间，切换不同节目时下方模块不再被顶着跳动。',
      '手机版节目索引改成带前后页预览的滑动条，拖动时能看到上一张和下一张的边缘。',
      '移动端节目索引在拖动和按钮操作期间会暂停自动轮播，避免和用户操作打架。',
      '首页文字层级从“一套字体打到底”改成标题、卡片标题、正文、辅助说明四层语气，并拉开版块底色。',
      '自动轮播切换时不再把页面滚回上方，也不会异常带出首页搜索栏。',
      '首页搜索在输入时会把搜索栏和结果区一起带回可见区，离开原始区域后再自动收起。',
      '首页卡片与下半区不再延迟到滚动过深才显现，避免用户翻到中段还看到空白。'
    ]
  },
  {
    date: '2026-04-22',
    title: '首页、关键词页与轮盘交互重做',
    items: [
      '关键词页改成按内容类别浏览，不再按引用量堆成大块。',
      '右侧轮盘与章节面板多轮调整，标签来源、章节高亮和视觉层级重新梳理。',
      '首页节目卡片点击逻辑拆开：整卡跳节目，标签独立跳关键词。'
    ]
  },
  {
    date: '2026-04-22',
    title: '移动端节奏与排版继续打磨',
    items: [
      '首页与节目索引的搜索栏显隐边界重新校准。',
      '移动端首页、节目索引的留白、标题区、卡片节奏做了收紧。',
      '首页推荐关键词增加“换一换”，推荐区标题与按钮重新设计。',
      '首页统计卡片 hover 与小标签高亮做了更细的层次化处理。'
    ]
  },
  {
    date: '2026-04-22',
    title: '引用、导航与分组逻辑继续补齐',
    items: [
      '子页里的 EP 文案统一改成可跳转引用，减少“看到但点不了”的情况。',
      '轮盘标签优先取中文标题与分组标题，不再误读到英文壳文案或第一张卡片词。',
      '首页与知识图谱区域的小入口分别梳理主跳转与次级跳转逻辑。'
    ]
  },
  {
    date: '2026-04-22',
    title: '整体字体系与可读性升级',
    items: [
      '页面主标题、模块标题、卡片标题、正文、辅助说明重新拉开层级。',
      '深色 hover 卡片的标题与正文对比重新校准，避免深底棕字看不清。',
      '推荐关键词、统计卡片与侧栏目录的文字层次重新梳理。'
    ]
  },
  {
    date: '2026-04-21',
    title: '首页入口、视频链路与发布流打通',
    items: [
      '首页平台入口与节目视频入口统一上线。',
      '构建流程改成同步刷新 docs 发布目录，减少本地与发布版不一致。',
      'GitHub Pages 分支发布链路与 Workers 构建路径一起整理。'
    ]
  },
  {
    date: '2026-04-21',
    title: '侧栏与首页导航结构开始成型',
    items: [
      '侧栏头像、品牌区和首页节目标签固定到底部排布。',
      '首页搜索、人物入口、知识卡片和视频可用性做了首轮修复。',
      '知识图谱入口与侧栏身份区开始稳定到当前结构。'
    ]
  },
  {
    date: '2026-04-20',
    title: '知识库网页首轮可发布版本',
    items: [
      '知识卡片、引用关系和页面发布流程完成首轮稳定化。',
      '网站从 branch-backed GitHub Pages 源成功发布。',
      '内容引用修复和基础卡片结构开始在线可用。'
    ]
  }
];

if ('scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

let site = null;
let graphData = null;
let inlineKnowledgeReferenceCache = null;
const expandedKnowledgeEpisodeSections = new Set();
let homeKnowledgeQuery = '';
let homeRecommendationSeed = Math.floor(Math.random() * 1000000);
let homeConceptRecommendationSeed = Math.floor(Math.random() * 1000000);
let homeModelRecommendationSeed = Math.floor(Math.random() * 1000000);
let homeEpisodeCarouselIndex = 0;
let sidebarKeywordQuery = '';
let keywordIndexQuery = '';
let episodeIndexQuery = '';
let episodeIndexAppliedQuery = '';
let episodeIndexRangeStart = 0;
let episodeIndexSearchMode = false;
let episodeIndexFocusSearchOnRender = false;
let episodeIndexSearchOriginHash = '';
let episodeIndexSearchOriginScrollX = 0;
let episodeIndexSearchOriginScrollY = 0;
let pendingRouteRestore = null;
let isApplyingRouteState = false;
let conceptIndexQuery = '';
let modelIndexQuery = '';
let peopleIndexQuery = '';
let themeIndexQuery = '';
let episodeToolbarController = null;
let homeSearchToolbarController = null;
let episodeIndexSearchController = null;
let episodeIndexSearchAutoHideTimer = 0;
let sectionSnapTimer = 0;
let scrollDirection = 1;
let lastScrollY = 0;
let lastSnapAt = 0;
let pointerIsDown = false;
let floatingActionsExpanded = false;
let floatingActionsIdleTimer = 0;
let homeEpisodeCarouselTimer = 0;
let homeEpisodeCarouselAnimationTimer = 0;
let homeEpisodeAutoAdvancePausedUntil = 0;
let homeEpisodeSwipeStartX = 0;
let homeEpisodeSwipeStartY = 0;
let homeEpisodeSwipePointerId = null;
let homeEpisodeSwipeTracking = false;
let homeEpisodeCarouselBindingsController = null;
let homeEpisodeCarouselAnimating = false;
let contentRevealObserver = null;
let suspendSnapUntil = 0;
let snapAnimationFrame = 0;
let snapPreviousScrollBehavior = '';
let lastSnapTargetTop = -1;
let lastUserReleaseAt = 0;
let sectionProgressHideTimer = 0;
let sectionProgressBlurTimer = 0;
let lastScrollSampleAt = performance.now();
let lastScrollSpeed = 0;
let sectionProgressPanelOpen = false;
let sectionProgressActiveIndex = -1;
let sectionProgressPulseTimer = 0;
let sectionProgressSuppressUntil = 0;
let sectionProgressFastScrollBurst = 0;
let sectionProgressFastScrollDirection = 0;
let sectionProgressFastScrollLastAt = performance.now();
let lastHomeEpisodeVisibleCount = 3;
let lastHomeMobileLayout = false;
let mobileViewportResetTimer = 0;
let hasRenderedRoute = false;
let lastRenderedHash = window.location.hash || '#/';
let sidebarLockedScrollY = 0;
let activeInlineEpisodeRef = null;
let inlineEpisodePopupElement = null;
let inlinePopupTimer = 0;
let pendingInlinePopupRef = null;
const PERSON_NAV_MIN_REFERENCES = 2;
const HOME_EPISODE_AUTO_ADVANCE_MS = 7000;
const HOME_EPISODE_DESKTOP_AUTO_ADVANCE_MS = 11000;
const HOME_EPISODE_ANIMATION_MS = 644;
const HOME_EPISODE_DESKTOP_ANIMATION_MS = 520;
const INLINE_POPUP_DELAY_MS = 300;
const DESKTOP_SIDEBAR_STORAGE_KEY = 'yinfluence-sidebar-collapsed';
const SNAP_SECTION_SELECTOR = '.hero, .home-search-toolbar, .home-search-section, .section, .detail-header, .detail-section';
const PROGRESS_SECTION_SELECTOR = '.hero, .home-search-section, .section, .detail-header, .detail-section';
const REVEAL_SELECTOR = '.hero, .home-search-toolbar, .home-search-section, .section, .detail-header, .detail-section, .card, .list-item';
const DEFAULT_VIEWPORT_CONTENT = 'width=device-width, initial-scale=1.0, viewport-fit=cover';

function isDesktopViewport() {
  return window.matchMedia('(min-width: 981px)').matches;
}

function isMobileViewport() {
  return window.matchMedia('(max-width: 720px)').matches;
}

function useMobileHomeLayout() {
  return window.matchMedia('(max-width: 768px)').matches;
}

function isTextEntryElement(element) {
  return (
    element instanceof HTMLInputElement
    || element instanceof HTMLTextAreaElement
    || element instanceof HTMLSelectElement
  );
}

function blurSearchInputs() {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement)) return false;
  if (!activeElement.closest('.sidebar-search-wrap, .home-search-toolbar, .episode-index-toolbar, .keyword-toolbar')) {
    return false;
  }
  if (!isTextEntryElement(activeElement)) return false;
  activeElement.blur();
  return true;
}

function normalizeMobileViewport({ force = false } = {}) {
  if (!isMobileViewport()) return;

  const didBlurSearchInput = blurSearchInputs();
  const currentScale = window.visualViewport?.scale || 1;
  if (!force && !didBlurSearchInput && currentScale <= 1.01) return;
  if (!(viewportMeta instanceof HTMLMetaElement)) return;

  window.clearTimeout(mobileViewportResetTimer);
  viewportMeta.setAttribute('content', `${DEFAULT_VIEWPORT_CONTENT}, maximum-scale=1`);

  window.requestAnimationFrame(() => {
    scrollWindowInstantly(window.scrollY, window.scrollX);
    mobileViewportResetTimer = window.setTimeout(() => {
      viewportMeta.setAttribute('content', DEFAULT_VIEWPORT_CONTENT);
    }, 220);
  });
}

function parseHashRoute(hashValue) {
  const hash = String(hashValue || '').replace(/^#\/?/, '');
  const [pathPart = '', queryString = ''] = hash.split('?');
  const parts = pathPart ? pathPart.split('/').map(decodeRoutePart) : [];
  const [section = '', id = ''] = parts;

  return {
    section,
    id,
    query: Object.fromEntries(new URLSearchParams(queryString)),
    episodeNumber: section === 'episodes' && id ? episodeNumberFromId(id) : NaN
  };
}

function getRouteTransitionKind(previousHash, nextHash) {
  const previousRoute = parseHashRoute(previousHash);
  const nextRoute = parseHashRoute(nextHash);
  const knowledgeSections = new Set(['concepts', 'models', 'themes', 'keywords']);

  if (previousRoute.section === 'episodes' && previousRoute.id && nextRoute.section === 'episodes' && nextRoute.id) {
    return 'content-static';
  }

  if (nextRoute.section === 'episodes' && nextRoute.id) {
    return 'episode-detail';
  }

  if (
    nextRoute.id &&
    knowledgeSections.has(nextRoute.section) &&
    (
      !previousRoute.id ||
      knowledgeSections.has(previousRoute.section)
    )
  ) {
    return 'knowledge-detail';
  }

  return nextRoute.section ? 'content-forward' : 'content-home';
}

function getDesktopSidebarCollapsedPreference() {
  try {
    return window.localStorage.getItem(DESKTOP_SIDEBAR_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

function applyDesktopSidebarState() {
  const collapsed = isDesktopViewport() && getDesktopSidebarCollapsedPreference();
  document.body.classList.toggle('sidebar-collapsed', collapsed);
  desktopMenuButton?.setAttribute('aria-expanded', String(!collapsed));
  syncFloatingActionLabels();
}

function setDesktopSidebarCollapsed(collapsed) {
  try {
    window.localStorage.setItem(DESKTOP_SIDEBAR_STORAGE_KEY, collapsed ? 'true' : 'false');
  } catch {
    // Ignore storage failures and still apply the UI state.
  }
  applyDesktopSidebarState();
}

function toggleDesktopSidebar() {
  setDesktopSidebarCollapsed(!getDesktopSidebarCollapsedPreference());
}

function isHomeRoute() {
  return window.location.hash === '' || window.location.hash === '#' || window.location.hash === '#/' || window.location.hash === '#';
}

function syncFloatingActionLabels() {
  if (menuButton) {
    const menuLabel = isDesktopViewport()
      ? (getDesktopSidebarCollapsedPreference() ? '展开导航' : '收起导航')
      : (document.body.classList.contains('sidebar-open') ? '关闭导航' : '打开导航');
    menuButton.setAttribute('aria-label', menuLabel);
    menuButton.setAttribute('title', menuLabel);
  }

  const floatingHomeButton = document.getElementById('floating-home');
  if (floatingHomeButton) {
    const homeLabel = isHomeRoute() ? '返回顶部' : '返回首页';
    floatingHomeButton.setAttribute('aria-label', homeLabel);
    floatingHomeButton.setAttribute('title', homeLabel);
  }

  if (backToTopButton) {
    backToTopButton.setAttribute('title', '柔和返回顶部');
  }
}

function setFloatingActionsExpanded(expanded) {
  floatingActionsExpanded = expanded;
  floatingActions?.classList.toggle('is-collapsed', !expanded);
  document.body.classList.toggle('floating-actions-expanded', expanded);
  floatingActionsToggle?.setAttribute('aria-expanded', String(expanded));
  floatingActionsToggle?.setAttribute('aria-label', expanded ? '收起快捷操作' : '展开快捷操作');
}

function scheduleFloatingActionsAutoCollapse() {
  window.clearTimeout(floatingActionsIdleTimer);
  if (!floatingActionsExpanded) return;
  if (isHomeRoute() && window.scrollY < 96) return;
  const collapseDelay = 1400;
  floatingActionsIdleTimer = window.setTimeout(() => {
    if (!floatingActionsExpanded) return;
    if (document.body.classList.contains('section-progress-panel-open')) return;
    setFloatingActionsExpanded(false);
  }, collapseDelay);
}

function syncBackToTopVisibility() {
  const shouldShow = true;
  backToTopButton?.classList.toggle('visible', shouldShow);
}

function syncFloatingActionsByScroll(currentScrollY) {
  if (document.body.classList.contains('section-progress-panel-open')) {
    setFloatingActionsExpanded(false);
    return;
  }

  const delta = currentScrollY - lastScrollY;
  if (currentScrollY < 72 || delta < -18) {
    setFloatingActionsExpanded(true);
    scheduleFloatingActionsAutoCollapse();
    return;
  }

  const collapseThreshold = isMobileViewport() ? 180 : 140;
  if (currentScrollY > collapseThreshold && delta > 18) {
    setFloatingActionsExpanded(false);
  }
}

function clearEpisodeIndexSearchOrigin() {
  episodeIndexSearchOriginHash = '';
  episodeIndexSearchOriginScrollX = 0;
  episodeIndexSearchOriginScrollY = 0;
}

function restoreEpisodeIndexSearchOrigin() {
  const originHash = episodeIndexSearchOriginHash || '#/';
  const originScrollX = episodeIndexSearchOriginScrollX || 0;
  const originScrollY = episodeIndexSearchOriginScrollY || 0;
  clearEpisodeIndexSearchOrigin();

  if (originHash === '#/episodes') {
    episodeIndexQuery = '';
    episodeIndexAppliedQuery = '';
    episodeIndexSearchMode = false;
    renderEpisodeIndex();
    window.requestAnimationFrame(() => {
      scrollWindowInstantly(originScrollY, originScrollX);
    });
    return;
  }

  pendingRouteRestore = {
    hash: originHash,
    scrollX: originScrollX,
    scrollY: originScrollY
  };
  window.location.hash = originHash;
}

function getCurrentHash() {
  return window.location.hash || '#/';
}

function accordionStateLabel(details) {
  if (!(details instanceof HTMLDetailsElement)) return '';
  return details.dataset.progressLabel || details.querySelector(':scope > summary')?.textContent?.trim() || '';
}

function collectOpenAccordionLabels() {
  return [...document.querySelectorAll('details.accordion-item')]
    .filter((details) => details.open)
    .map(accordionStateLabel)
    .filter(Boolean);
}

function collectRouteViewState(hash = getCurrentHash()) {
  return {
    hash,
    scrollX: window.scrollX || 0,
    scrollY: window.scrollY || 0,
    openAccordions: collectOpenAccordionLabels()
  };
}

function saveCurrentRouteViewState() {
  if (isApplyingRouteState || !hasRenderedRoute) return;
  const state = collectRouteViewState();
  try {
    window.history.replaceState({
      ...(window.history.state || {}),
      yinfluenceViewState: state
    }, '', window.location.href);
  } catch {
    // Hash navigation should keep working even when history state is unavailable.
  }
}

function restoreRouteViewState(state) {
  if (!state?.openAccordions?.length) return;
  const openLabels = new Set(state.openAccordions);
  document.querySelectorAll('details.accordion-item').forEach((details) => {
    const label = accordionStateLabel(details);
    if (label) {
      details.open = openLabels.has(label);
    }
  });
}

function openEpisodeIndexSearch() {
  normalizeMobileViewport({ force: true });
  closeSidebar();
  episodeIndexSearchOriginHash = window.location.hash || '#/';
  episodeIndexSearchOriginScrollX = window.scrollX;
  episodeIndexSearchOriginScrollY = window.scrollY;
  episodeIndexQuery = '';
  episodeIndexAppliedQuery = '';
  episodeIndexSearchMode = true;
  episodeIndexFocusSearchOnRender = true;
  if (window.location.hash === '#/episodes') {
    renderEpisodeIndex();
    window.requestAnimationFrame(() => {
      scrollWindowInstantly(0, window.scrollX);
    });
    return;
  }
  window.location.hash = '#/episodes';
}

function getProgressSections() {
  const explicitSections = [...app.querySelectorAll('[data-progress-section="true"]')].filter((section) => {
    if (!(section instanceof HTMLElement)) return false;
    const rect = section.getBoundingClientRect();
    return rect.height > 0;
  });

  if (explicitSections.length) {
    if (
      document.body.classList.contains('page-episode-index')
        || document.body.classList.contains('page-updates')
        || document.body.classList.contains('page-keyword-index')
    ) {
      return explicitSections;
    }
    const headerSections = [...app.querySelectorAll('.hero, .detail-header')].filter((section) => {
      if (!(section instanceof HTMLElement)) return false;
      const rect = section.getBoundingClientRect();
      return rect.height > 0;
    });
    return [...headerSections, ...explicitSections];
  }

  return [...app.querySelectorAll(PROGRESS_SECTION_SELECTOR)].filter((section) => {
    if (!(section instanceof HTMLElement)) return false;
    const rect = section.getBoundingClientRect();
    return rect.height > 0;
  });
}

function getSectionProgressLabel(section) {
  if (!(section instanceof HTMLElement)) return '';
  if (section.classList.contains('hero')) return '首页';
  const explicitLabel = section.dataset.progressLabel?.trim();
  if (explicitLabel) {
    if (
      document.body.classList.contains('page-episode-index')
        || document.body.classList.contains('page-keyword-index')
    ) {
      return explicitLabel;
    }
    return explicitLabel.length > 8 ? `${explicitLabel.slice(0, 8)}…` : explicitLabel;
  }
  const selectorPriority = ['.detail-title', '.section-title', 'h1', 'h2', 'h3', '.search-subtitle', '.detail-eyebrow'];
  const genericEnglishLabels = new Set(['keywords', 'keyword node', 'mental model', 'concept card', 'theme node']);
  const candidates = selectorPriority.flatMap((selector) => (
    [...section.querySelectorAll(selector)]
      .map((node) => node.textContent?.trim() || '')
      .filter(Boolean)
  ));

  const preferredLabel = candidates.find((label) => /[\u3400-\u9fff]/.test(label))
    || candidates.find((label) => !genericEnglishLabels.has(label.toLowerCase()))
    || '';

  const label = preferredLabel
    .replace(/\bEP\d+\b/gi, '')
    .replace(/[A-Za-z]+/g, '')
    .replace(/[|｜:：•·]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return label.length > 8 ? `${label.slice(0, 8)}…` : label;
}

function pulseSectionProgressWheel() {
  if (!sectionProgress) return;
  sectionProgress.classList.remove('is-pulsing');
  void sectionProgress.offsetWidth;
  sectionProgress.classList.add('is-pulsing');
  window.clearTimeout(sectionProgressPulseTimer);
  sectionProgressPulseTimer = window.setTimeout(() => {
    sectionProgress.classList.remove('is-pulsing');
  }, 420);
}

function renderSectionProgress() {
  const sections = getProgressSections();
  if (!sectionProgress) return;

  if (sections.length < 2 || window.location.hash.replace(/^#\/?/, '').startsWith('graph')) {
    sectionProgress.hidden = true;
    sectionProgress.innerHTML = '';
    return;
  }

  sectionProgress.hidden = false;
  sectionProgress.innerHTML = `
    <span class="section-progress-wheel">
      <span class="section-progress-item prev">
        <span class="section-progress-label" data-role="prev"></span>
      </span>
      <span class="section-progress-item current">
        <span class="section-progress-label" data-role="current"></span>
      </span>
      <span class="section-progress-item next">
        <span class="section-progress-label" data-role="next"></span>
      </span>
    </span>
  `;
  renderSectionProgressPanel();
}

function renderSectionProgressPanel() {
  if (!sectionProgressPanel) return;
  const sections = getProgressSections();
  if (sections.length < 2) {
    sectionProgressPanel.hidden = true;
    sectionProgressPanel.innerHTML = '';
    return;
  }

  sectionProgressPanel.innerHTML = `
    <div class="section-progress-panel-card">
      <p class="section-progress-panel-title">${getSectionProgressPanelTitle()}</p>
      <div class="section-progress-panel-list">
        ${sections.map((section, index) => `
          <button class="section-progress-panel-item" type="button" data-section-progress-target="${index}">
            <span class="section-progress-panel-index">${String(index + 1).padStart(2, '0')}</span>
            <span class="section-progress-panel-text">${getSectionProgressLabel(section)}</span>
          </button>
        `).join('')}
      </div>
    </div>
  `;
}

function getSectionProgressPanelTitle() {
  if (document.body.classList.contains('page-episode-index')) return '节目轮盘';
  if (document.body.classList.contains('page-updates')) return '日志日期';
  if (document.body.classList.contains('page-keyword-index')) return '关键词目录';
  return '页面章节';
}

function scrollActiveSectionProgressItemIntoView({ behavior = 'auto' } = {}) {
  if (!sectionProgressPanelOpen || !(sectionProgressPanel instanceof HTMLElement)) return;
  const list = sectionProgressPanel.querySelector('.section-progress-panel-list');
  const activeItem = sectionProgressPanel.querySelector('.section-progress-panel-item.is-active');
  if (!(list instanceof HTMLElement) || !(activeItem instanceof HTMLElement)) return;

  const listRect = list.getBoundingClientRect();
  const activeRect = activeItem.getBoundingClientRect();
  const currentScrollTop = list.scrollTop;
  const targetScrollTop = currentScrollTop + (activeRect.top - listRect.top) - (listRect.height - activeRect.height) / 2;
  const maxScrollTop = Math.max(list.scrollHeight - list.clientHeight, 0);

  list.scrollTo({
    top: Math.min(Math.max(targetScrollTop, 0), maxScrollTop),
    behavior
  });
}

function syncSectionProgress({ reveal = false, blur = false } = {}) {
  if (!sectionProgress || sectionProgress.hidden) return;

  const sections = getProgressSections();
  if (sections.length < 2) return;

  const probeY = window.innerHeight * 0.28;
  let activeIndex = sections.findIndex((section) => {
    const rect = section.getBoundingClientRect();
    return rect.top <= probeY && rect.bottom > probeY;
  });

  if (activeIndex < 0) {
    activeIndex = sections.findIndex((section) => section.getBoundingClientRect().top > 0);
    if (activeIndex < 0) activeIndex = sections.length - 1;
  }

  const previousLabel = getSectionProgressLabel(sections[activeIndex - 1]);
  const currentLabel = getSectionProgressLabel(sections[activeIndex]);
  const nextLabel = getSectionProgressLabel(sections[activeIndex + 1]);
  const prevNode = sectionProgress.querySelector('[data-role="prev"]');
  const currentNode = sectionProgress.querySelector('[data-role="current"]');
  const nextNode = sectionProgress.querySelector('[data-role="next"]');

  if (prevNode) prevNode.textContent = previousLabel;
  if (currentNode) currentNode.textContent = currentLabel;
  if (nextNode) nextNode.textContent = nextLabel;

  sectionProgress.querySelector('.section-progress-item.prev')?.classList.toggle('is-empty', !previousLabel);
  sectionProgress.querySelector('.section-progress-item.current')?.classList.toggle('is-empty', !currentLabel);
  sectionProgress.querySelector('.section-progress-item.next')?.classList.toggle('is-empty', !nextLabel);
  sectionProgressPanel?.querySelectorAll('.section-progress-panel-item').forEach((item, index) => {
    item.classList.toggle('is-active', index === activeIndex);
  });

  if (reveal && !sectionProgressPanelOpen) {
    showSectionProgressTemporarily({ blur });
  }

  if (activeIndex !== sectionProgressActiveIndex) {
    sectionProgressActiveIndex = activeIndex;
    pulseSectionProgressWheel();
    if (sectionProgressPanelOpen) {
      window.requestAnimationFrame(() => {
        scrollActiveSectionProgressItemIntoView({ behavior: 'smooth' });
      });
    }
  }
}

function showSectionProgressTemporarily({ blur = false } = {}) {
  if (!sectionProgress || sectionProgress.hidden) return;
  if (performance.now() < sectionProgressSuppressUntil) {
    sectionProgress.classList.remove('is-visible');
    document.body.classList.remove('section-progress-fast');
    return;
  }
  if (isHomeRoute()) {
    const homeEpisodesSection = document.getElementById('home-episodes');
    if (homeEpisodesSection instanceof HTMLElement) {
      const revealThreshold = Math.max(window.scrollY + homeEpisodesSection.getBoundingClientRect().top - window.innerHeight * 0.42, 96);
      if (window.scrollY < revealThreshold) {
        sectionProgress.classList.remove('is-visible');
        return;
      }
    }
  }
  sectionProgress.classList.add('is-visible');
  if (blur && !sectionProgressPanelOpen) {
    document.body.classList.add('section-progress-fast');
    window.clearTimeout(sectionProgressBlurTimer);
    sectionProgressBlurTimer = window.setTimeout(() => {
      if (sectionProgressPanelOpen) return;
      document.body.classList.remove('section-progress-fast');
    }, 140);
  }
  window.clearTimeout(sectionProgressHideTimer);
  sectionProgressHideTimer = window.setTimeout(() => {
    if (sectionProgressPanelOpen) return;
    sectionProgress.classList.remove('is-visible');
    sectionProgressFastScrollBurst = 0;
    sectionProgressFastScrollDirection = 0;
    sectionProgressFastScrollLastAt = performance.now();
  }, blur ? 1280 : 980);
}

function clearSectionProgressEffects() {
  window.clearTimeout(sectionProgressHideTimer);
  window.clearTimeout(sectionProgressBlurTimer);
  window.clearTimeout(sectionProgressPulseTimer);
  sectionProgress?.classList.remove('is-visible');
  sectionProgress?.classList.remove('is-pulsing');
  sectionProgressFastScrollBurst = 0;
  sectionProgressFastScrollDirection = 0;
  sectionProgressFastScrollLastAt = performance.now();
  document.body.classList.remove('section-progress-fast');
}

function suppressSectionProgressTemporarily(durationMs = 900) {
  sectionProgressSuppressUntil = Math.max(sectionProgressSuppressUntil, performance.now() + durationMs);
  clearSectionProgressEffects();
}

function closeSectionProgressPanel({ keepWheelVisible = false } = {}) {
  sectionProgressPanelOpen = false;
  document.body.classList.remove('section-progress-panel-open');
  if (sectionProgressPanel) {
    sectionProgressPanel.hidden = true;
  }
  if (keepWheelVisible) {
    showSectionProgressTemporarily({ blur: false });
    return;
  }
  clearSectionProgressEffects();
}

function setSectionProgressPanelOpen(open) {
  sectionProgressPanelOpen = open;
  document.body.classList.toggle('section-progress-panel-open', open);
  if (!sectionProgressPanel) return;
  sectionProgressPanel.hidden = !open;
  if (open) {
    sectionProgressSuppressUntil = 0;
    clearSectionProgressEffects();
    window.requestAnimationFrame(() => {
      syncSectionProgress();
      scrollActiveSectionProgressItemIntoView({ behavior: 'auto' });
    });
  } else {
    closeSectionProgressPanel();
  }
}

function shouldAssistSectionSnap() {
  if (!document.body.classList.contains('has-assisted-snap')) return false;
  if (document.body.classList.contains('sidebar-open')) return false;
  if (document.body.classList.contains('page-episode-index')) return false;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
  if (window.location.hash.replace(/^#\/?/, '').startsWith('graph')) return false;
  if (Date.now() < suspendSnapUntil) return false;
  if (Date.now() - lastUserReleaseAt < 220) return false;
  const recentScrollSpeed = performance.now() - lastScrollSampleAt > 180 ? 0 : lastScrollSpeed;
  if (recentScrollSpeed > 1.1) return false;
  const activeElement = document.activeElement;
  return !(
    activeElement instanceof HTMLInputElement ||
    activeElement instanceof HTMLTextAreaElement ||
    activeElement instanceof HTMLSelectElement
  );
}

function cancelSnapAnimation() {
  if (!snapAnimationFrame) return;
  window.cancelAnimationFrame(snapAnimationFrame);
  snapAnimationFrame = 0;
  document.documentElement.style.scrollBehavior = snapPreviousScrollBehavior;
}

function scrollWindowInstantly(top = 0, left = 0) {
  cancelSnapAnimation();
  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  root.style.scrollBehavior = 'auto';
  window.scrollTo(left, top);
  window.requestAnimationFrame(() => {
    root.style.scrollBehavior = previousScrollBehavior;
  });
}

function animateWindowScrollTo(targetTop, options = {}) {
  cancelSnapAnimation();

  const startTop = window.scrollY;
  const distance = targetTop - startTop;
  if (Math.abs(distance) < 3) return;

  const root = document.documentElement;
  const previousScrollBehavior = root.style.scrollBehavior;
  snapPreviousScrollBehavior = previousScrollBehavior;
  root.style.scrollBehavior = 'auto';

  const { durationScale = 1 } = options;
  const duration = Math.max(400, Math.min(680, Math.abs(distance) * 1.02)) * durationScale;
  const startTime = performance.now();
  suspendSnapUntil = Date.now() + duration + 140;

  const easeInOutCubic = (progress) => (
    progress < 0.5
      ? 4 * progress * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 3) / 2
  );

  const step = (now) => {
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = easeInOutCubic(progress);
    window.scrollTo(0, startTop + distance * eased);

    if (progress < 1) {
      snapAnimationFrame = window.requestAnimationFrame(step);
      return;
    }

    window.scrollTo(0, targetTop);
    root.style.scrollBehavior = previousScrollBehavior;
    snapAnimationFrame = 0;
    snapPreviousScrollBehavior = '';
  };

  snapAnimationFrame = window.requestAnimationFrame(step);
}

function getSnapSections() {
  const sectionNodes = [...app.querySelectorAll(SNAP_SECTION_SELECTOR)];
  const episodeCardNodes = document.body.classList.contains('page-episode-index') && isMobileViewport()
    ? [...app.querySelectorAll('#episode-index-results .list-item')]
    : [];

  return [...new Set([...sectionNodes, ...episodeCardNodes])].filter((section) => {
    if (!(section instanceof HTMLElement)) return false;
    const rect = section.getBoundingClientRect();
    return rect.height > 0;
  });
}

function snapTowardsAdjacentSection() {
  if (!shouldAssistSectionSnap()) return;
  if (pointerIsDown) return;

  const now = Date.now();
  if (now - lastSnapAt < 280) return;
  const maxScrollTop = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0);
  const nearDocumentBottom = maxScrollTop - window.scrollY < Math.max(54, window.innerHeight * 0.06);
  if (nearDocumentBottom && scrollDirection >= 0) return;

  const maxSnapDistance = isMobileViewport() ? 168 : 132;
  const directionPenalty = isMobileViewport() ? 16 : 12;
  const sections = getSnapSections().map((section) => {
    const rect = section.getBoundingClientRect();
    const visiblePixels = Math.max(Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 20), 0);
    const visibleRatio = visiblePixels / Math.max(Math.min(rect.height, window.innerHeight), 1);
    return {
      section,
      rect,
      targetTop: window.scrollY + rect.top - 20,
      visibleRatio
    };
  });

  if (sections.length < 2) return;

  const target = sections
    .map((entry) => {
      const distance = Math.abs(entry.targetTop - window.scrollY);
      const anchorDistance = Math.abs(entry.rect.top - 20);
      const directionalBias = scrollDirection >= 0
        ? (entry.targetTop < window.scrollY ? directionPenalty : 0)
        : (entry.targetTop > window.scrollY ? directionPenalty : 0);
      const interstitialBonus = entry.rect.top < window.innerHeight * 0.42 && entry.rect.bottom > window.innerHeight * 0.58 ? 16 : 0;
      const coverageBonus = Math.min(entry.visibleRatio * 28, 18) + interstitialBonus;

      return {
        ...entry,
        distance,
        score: anchorDistance + directionalBias - coverageBonus
      };
    })
    .filter((entry) => entry.distance >= 10 && entry.distance <= maxSnapDistance && entry.targetTop < maxScrollTop - 4)
    .sort((a, b) => a.score - b.score || a.distance - b.distance)[0];

  if (!target) return;
  if (Math.abs(target.targetTop - lastSnapTargetTop) < 10) return;

  lastSnapAt = now;
  lastSnapTargetTop = target.targetTop;
  animateWindowScrollTo(Math.max(target.targetTop, 0), { durationScale: 0.9 });
}

function scheduleSectionSnap() {
  window.clearTimeout(sectionSnapTimer);
  if (!shouldAssistSectionSnap()) return;
  sectionSnapTimer = window.setTimeout(() => {
    snapTowardsAdjacentSection();
  }, 140);
}

function teardownRevealAnimations() {
  contentRevealObserver?.disconnect();
  contentRevealObserver = null;
}

function setupRevealAnimations() {
  teardownRevealAnimations();
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (document.body.classList.contains('page-reference-detail')) return;

  const revealTargets = [...document.querySelectorAll(REVEAL_SELECTOR)]
    .filter((node) => node instanceof HTMLElement)
    .filter((node) => {
      if (!(node instanceof HTMLElement)) return false;
      if (!document.body.classList.contains('page-episode-index')) return true;
      if (!isMobileViewport()) return true;
      return !node.matches('#episode-index-results .list-item, .episode-index-toolbar-shell, .episode-index-toolbar');
    });
  if (!revealTargets.length) return;

  if (isHomeRoute()) {
    revealTargets.forEach((node, index) => {
      node.classList.add('reveal-ready', 'is-visible');
      node.style.setProperty('--reveal-delay', `${Math.min(index * 24, 120)}ms`);
    });
    return;
  }

  const initialViewportBottom = window.innerHeight * 1.2;

  revealTargets.forEach((node, index) => {
    const rect = node.getBoundingClientRect();
    const isInitiallyVisible = rect.top < initialViewportBottom && rect.bottom > 0;
    if (isInitiallyVisible) {
      node.classList.add('is-visible');
      return;
    }
    node.classList.add('reveal-ready');
    node.style.setProperty('--reveal-delay', `${Math.min(index * 36, 220)}ms`);
  });

  const deferredTargets = revealTargets.filter((node) => node.classList.contains('reveal-ready'));
  if (!deferredTargets.length) return;

  contentRevealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      contentRevealObserver?.unobserve(entry.target);
    });
  }, {
    threshold: 0.03,
    rootMargin: '0px 0px 18% 0px'
  });

  window.requestAnimationFrame(() => {
    deferredTargets.forEach((node) => {
      contentRevealObserver?.observe(node);
    });
  });
}

function refreshViewportBehaviors({ resetDock = false } = {}) {
  applyDesktopSidebarState();
  syncBackToTopVisibility();
  if (!isMobileViewport()) {
    setFloatingActionsExpanded(true);
  } else if (isHomeRoute() && window.scrollY < 72) {
    setFloatingActionsExpanded(false);
  } else if (resetDock) {
    setFloatingActionsExpanded(true);
  }
  if (!isMobileViewport()) {
    floatingActions?.classList.remove('is-collapsed');
  }
  syncFloatingActionLabels();
}

function openSidebar() {
  sidebarLockedScrollY = window.scrollY;
  sidebar.scrollTop = 0;
  sidebar.classList.add('open');
  document.body.classList.add('sidebar-open');
  document.body.style.top = `-${sidebarLockedScrollY}px`;
  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = false;
  }
  syncFloatingActionLabels();
}

function closeSidebar() {
  sidebar.classList.remove('open');
  document.body.classList.remove('sidebar-open');
  document.body.style.removeProperty('top');
  if (sidebarBackdrop) {
    sidebarBackdrop.hidden = true;
  }
  scrollWindowInstantly(sidebarLockedScrollY, window.scrollX);
  normalizeMobileViewport();
  syncFloatingActionLabels();
}

menuButton.addEventListener('click', () => {
  if (isDesktopViewport()) {
    toggleDesktopSidebar();
    return;
  }
  if (document.body.classList.contains('sidebar-open')) {
    closeSidebar();
    return;
  }
  openSidebar();
});
desktopMenuButton?.addEventListener('click', () => {
  if (!isDesktopViewport()) return;
  setDesktopSidebarCollapsed(false);
});
sidebarClose.addEventListener('click', closeSidebar);
sidebarBackdrop?.addEventListener('click', closeSidebar);
backToTopButton?.addEventListener('click', () => {
  if (window.scrollY <= 8) {
    setFloatingActionsExpanded(true);
    scheduleFloatingActionsAutoCollapse();
    return;
  }
  animateWindowScrollTo(0, { durationScale: 1.25 });
});
floatingEpisodeSearchButton?.addEventListener('click', (event) => {
  event.preventDefault();
  event.stopPropagation();
  openEpisodeIndexSearch();
});
function bindHomeSurfaceToTop(selector) {
  document.querySelectorAll(selector).forEach((node) => {
    node.addEventListener('click', (event) => {
      if (!isHomeRoute()) return;
      event.preventDefault();
      animateWindowScrollTo(0, { durationScale: 1.25 });
    });
  });
}

bindHomeSurfaceToTop('#floating-home');
bindHomeSurfaceToTop('.brand-home, .brand-avatar-link');
function renderRouteWithTransition() {
  const nextHash = window.location.hash || '#/';
  const transitionKind = getRouteTransitionKind(lastRenderedHash, nextHash);

  if (
    hasRenderedRoute &&
    transitionKind !== 'content-static' &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ) {
    document.documentElement.dataset.routeTransition = transitionKind;
    const transition = document.startViewTransition(() => {
      renderRoute();
    });
    transition.finished.finally(() => {
      delete document.documentElement.dataset.routeTransition;
    });
    return;
  }

  renderRoute();
}

window.addEventListener('hashchange', renderRouteWithTransition);
window.addEventListener('resize', () => {
  closeInlineEpisodePopup();
  refreshViewportBehaviors();
  scheduleSectionSnap();
  if (isHomeRoute()) {
    const nextVisibleCount = homeEpisodeVisibleCount();
    const nextMobileLayout = useMobileHomeLayout();
    if (nextVisibleCount !== lastHomeEpisodeVisibleCount || nextMobileLayout !== lastHomeMobileLayout) {
      renderHome('home-episodes');
    }
  }
});
window.addEventListener('scroll', () => {
  closeInlineEpisodePopup();
  const currentScrollY = window.scrollY;
  const now = performance.now();
  const elapsed = Math.max(now - lastScrollSampleAt, 16);
  const scrollDelta = Math.abs(currentScrollY - lastScrollY);
  const scrollIntent = currentScrollY > lastScrollY ? 1 : currentScrollY < lastScrollY ? -1 : 0;
  if (scrollIntent) scrollDirection = scrollIntent;
  const speed = scrollDelta / elapsed;
  lastScrollSpeed = speed;
  const isProgrammaticSnapScroll = Boolean(snapAnimationFrame) || (lastSnapTargetTop >= 0 && Date.now() < suspendSnapUntil);
  const sectionProgressFastSampleMinDelta = isMobileViewport() ? 20 : 24;
  const sectionProgressFastSampleMinSpeed = isMobileViewport() ? 2.4 : 2.6;
  const sectionProgressFastBurstThreshold = isMobileViewport() ? 220 : 280;
  const isFastSectionProgressSample = Boolean(
    scrollIntent &&
      !isProgrammaticSnapScroll &&
      scrollDelta >= sectionProgressFastSampleMinDelta &&
      speed >= sectionProgressFastSampleMinSpeed
  );
  if (
    !isFastSectionProgressSample ||
    now - sectionProgressFastScrollLastAt > 220 ||
    (scrollIntent && scrollIntent !== sectionProgressFastScrollDirection)
  ) {
    sectionProgressFastScrollBurst = 0;
  }
  if (isFastSectionProgressSample) {
    sectionProgressFastScrollDirection = scrollIntent;
    sectionProgressFastScrollBurst += scrollDelta;
    sectionProgressFastScrollLastAt = now;
  }
  const hasFastSectionProgressGesture = sectionProgressFastScrollBurst >= sectionProgressFastBurstThreshold;
  const shouldRevealSectionProgress = Boolean(
    sectionProgressPanelOpen
      || hasFastSectionProgressGesture
  );
  if (lastSnapTargetTop >= 0 && Math.abs(currentScrollY - lastSnapTargetTop) > window.innerHeight * 0.7) {
    lastSnapTargetTop = -1;
  }
  syncFloatingActionsByScroll(currentScrollY);
  syncBackToTopVisibility();
  syncSectionProgress({
    reveal: shouldRevealSectionProgress,
    blur: hasFastSectionProgressGesture
  });
  if (shouldRevealSectionProgress && !sectionProgressPanelOpen) {
    sectionProgressFastScrollBurst = 0;
    sectionProgressFastScrollDirection = 0;
    sectionProgressFastScrollLastAt = now;
  }
  scheduleSectionSnap();
  lastScrollY = currentScrollY;
  lastScrollSampleAt = now;
}, { passive: true });
window.addEventListener('pointerdown', () => {
  pointerIsDown = true;
  cancelSnapAnimation();
}, { passive: true });
window.addEventListener('pointerup', () => {
  pointerIsDown = false;
  lastUserReleaseAt = Date.now();
  scheduleSectionSnap();
}, { passive: true });
window.addEventListener('touchstart', () => {
  pointerIsDown = true;
  cancelSnapAnimation();
}, { passive: true });
window.addEventListener('touchend', () => {
  pointerIsDown = false;
  lastUserReleaseAt = Date.now();
  scheduleSectionSnap();
}, { passive: true });
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeSidebar();
  }
});
window.addEventListener('resize', () => {
  renderSectionProgress();
  syncSectionProgress();
}, { passive: true });
document.addEventListener('toggle', (event) => {
  if (!(event.target instanceof HTMLDetailsElement)) return;
  if (!app.contains(event.target)) return;
  window.requestAnimationFrame(() => {
    renderSectionProgress();
    syncSectionProgress();
  });
}, true);
floatingActionsToggle?.addEventListener('click', () => {
  setFloatingActionsExpanded(!floatingActionsExpanded);
  if (floatingActionsExpanded) {
    scheduleFloatingActionsAutoCollapse();
  } else {
    window.clearTimeout(floatingActionsIdleTimer);
  }
});
document.addEventListener('pointerenter', handleInlinePopupEnter, true);
document.addEventListener('mouseenter', handleInlinePopupEnter, true);
document.addEventListener('pointerleave', handleInlinePopupLeave, true);
document.addEventListener('mouseleave', handleInlinePopupLeave, true);
document.addEventListener('focusin', (event) => {
  const reference = findInlinePopupReference(event.target, true);
  if (!(reference instanceof HTMLElement)) return;
  positionInlineEpisodePopup(reference);
});
document.addEventListener('focusout', (event) => {
  const reference = findInlinePopupReference(event.target, true);
  if (!(reference instanceof HTMLElement)) return;
  window.requestAnimationFrame(() => {
    if (reference.contains(document.activeElement)) return;
    closeInlineEpisodePopup(reference);
  });
});
app.addEventListener('click', handleListItemNavigationClick);
app.addEventListener('click', handleInlineKnowledgeNavigationState, { capture: true });
sectionProgress?.addEventListener('click', () => {
  if (sectionProgress.hidden) return;
  setSectionProgressPanelOpen(!sectionProgressPanelOpen);
});
sectionProgressPanel?.addEventListener('click', (event) => {
  const target = event.target.closest('[data-section-progress-target]');
  if (!(target instanceof HTMLElement)) return;
  event.preventDefault();
  const index = Number(target.dataset.sectionProgressTarget);
  const sections = getProgressSections();
  const section = sections[index];
  if (!(section instanceof HTMLElement)) return;
  closeSectionProgressPanel();
  suppressSectionProgressTemporarily();
  if (document.body.classList.contains('page-episode-index')) {
    const href = section.dataset.progressHref || section.getAttribute('href');
    if (href) {
      suppressSectionProgressTemporarily(1200);
      window.location.hash = href;
      return;
    }
  }
  const top = Math.max(window.scrollY + section.getBoundingClientRect().top - 20, 0);
  animateWindowScrollTo(top, { durationScale: 1.05 });
});
document.addEventListener('click', (event) => {
  if (
    sectionProgressPanelOpen &&
    !sectionProgress?.contains(event.target) &&
    !sectionProgressPanel?.contains(event.target)
  ) {
    closeSectionProgressPanel();
  }
  const trigger = event.target.closest('[data-nav-back]');
  if (!trigger) return;
  event.preventDefault();
  if (window.history.length > 1) {
    window.history.back();
    return;
  }
  window.location.hash = '#/';
});

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function normalizeValue(value) {
  return String(value || '').trim().toLowerCase();
}

function decodeRoutePart(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function routeTo(path) {
  const encodedPath = String(path || '')
    .split('/')
    .map((part) => encodeURIComponent(part))
    .join('/');
  return `#/${encodedPath}`;
}

function routeWithQuery(path, params = {}) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    query.set(key, String(value));
  }
  const queryString = query.toString();
  return queryString ? `${routeTo(path)}?${queryString}` : routeTo(path);
}

function dataUrl(file) {
  const version = window.__BUILD_VERSION__;
  return version ? `./data/${file}?v=${encodeURIComponent(version)}` : `./data/${file}`;
}

function episodeById(id) {
  return site?.episodes?.find((episode) => episode.id === id) || null;
}

function orderedEpisodes() {
  return [...(site?.episodes || [])].sort((a, b) => episodeNumberFromId(a.id) - episodeNumberFromId(b.id));
}

function displayEpisodeTitle(title) {
  return String(title || '')
    .split(/｜|\|/)[0]
    .replace(/\s*[【\[]\s*EP\d{1,4}\s*[】\]]\s*$/i, '')
    .trim();
}

function inlineReferenceRouteKey(route) {
  return String(route || '').replace(/^#\/?/, '').split('/').map(decodeRoutePart).join(':').toLowerCase();
}

function currentInlineReferenceRouteKey() {
  const { section, id } = parseHashRoute(window.location.hash);
  return section && id ? `${section}:${id}`.toLowerCase() : '';
}

function countInlineReferenceChars(value) {
  return [...String(value || '').trim()].length;
}

function hasRichInlineReferenceContent(item = {}) {
  return Boolean(
    item.kind ||
    item.entryType ||
    item.sourcePersonId ||
    item.basicIntro ||
    item.programRole ||
    item.nodeRole ||
    item.positionNotes ||
    item.objectRole ||
    item.conflictNotes ||
    item.mechanismNotes ||
    item.assetRole ||
    item.programAssociations?.length ||
    item.extensionNotes?.length
  );
}

function isHighConfidenceShortInlineReference(item = {}) {
  const kind = item.kind || item.entryType || '';
  const episodeCount = Array.isArray(item.episodes) ? item.episodes.length : 0;
  return Boolean(
    item.sourcePersonId ||
    ['person', 'geography', 'organization', 'product', 'event', 'asset', 'theme'].includes(kind) ||
    episodeCount > 1
  );
}

function isReadableReferenceAlias(value, source = 'name', item = null) {
  const text = String(value || '').trim();
  const charCount = countInlineReferenceChars(text);
  const isNonAscii = /[^\x00-\x7F]/.test(text);
  const allowShortCuratedName = source === 'name'
    && isNonAscii
    && charCount >= 2
    && hasRichInlineReferenceContent(item || {})
    && isHighConfidenceShortInlineReference(item || {});
  if ((!allowShortCuratedName && charCount < 3) || charCount > 36) return false;
  if (/^EP\d{3}$/i.test(text)) return false;
  if (/^[a-z0-9]+(?:-[a-z0-9]+)+$/i.test(text)) return false;
  if (/^[\d\s._-]+$/.test(text)) return false;
  if (source === 'alias' && charCount < 4 && /[^\x00-\x7F]/.test(text)) return false;
  return !/[\n\r]/.test(text);
}

function trimInlineReferencePopupText(text, maxChars = 132) {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const boundary = Math.max(slice.lastIndexOf('。'), slice.lastIndexOf('，'), slice.lastIndexOf('、'), slice.lastIndexOf(' '));
  const trimmed = boundary > maxChars * 0.55 ? slice.slice(0, boundary + 1) : slice;
  return `${trimmed.trim()}…`;
}

function getInlineReferencePopupSummary(item = {}) {
  const text = String(
    item.summary ||
    item.description ||
    item.definition ||
    item.application ||
    item.context ||
    ''
  ).replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return trimInlineReferencePopupText(text);
}

function inlineReferenceCandidatePriority(candidate) {
  if (candidate.source === 'name') return 100;
  if (candidate.type === 'keywords') return 80;
  if (candidate.type === 'models') return 70;
  if (candidate.type === 'concepts') return 60;
  if (candidate.type === 'themes') return 50;
  return 0;
}

function addInlineReferenceCandidate(candidates, labelIndex, label, route, type, source = 'name', item = null) {
  const text = String(label || '').trim();
  if (!isReadableReferenceAlias(text, source, item)) return;
  if (!/[^\x00-\x7F]/.test(text) && text.length < 3) return;
  const labelKey = text.toLowerCase();
  const routeKey = inlineReferenceRouteKey(route);
  if (!labelKey || !routeKey) return;
  const candidate = {
    label: text,
    labelLower: labelKey,
    route,
    routeKey,
    type,
    source,
    title: item?.name || item?.title || text,
    summary: getInlineReferencePopupSummary(item || {})
  };
  const existingIndex = labelIndex.get(labelKey);
  if (typeof existingIndex === 'number') {
    const existing = candidates[existingIndex];
    if (inlineReferenceCandidatePriority(existing) >= inlineReferenceCandidatePriority(candidate)) return;
    candidates[existingIndex] = candidate;
    return;
  }
  labelIndex.set(labelKey, candidates.length);
  candidates.push(candidate);
}

function getInlineKnowledgeReferenceCandidates() {
  if (!site) return [];
  if (inlineKnowledgeReferenceCache) return inlineKnowledgeReferenceCache;
  const candidates = [];
  const labelIndex = new Map();
  const addCollection = (collection = [], type, routeType = type) => {
    for (const item of collection || []) {
      const route = routeTo(`${routeType}/${item.id}`);
      addInlineReferenceCandidate(candidates, labelIndex, item.name || item.title, route, type, 'name', item);
      for (const alias of item.aliases || []) {
        addInlineReferenceCandidate(candidates, labelIndex, alias, route, type, 'alias', item);
      }
    }
  };

  addCollection(site?.concepts, 'concepts');
  addCollection(site?.models, 'models');
  addCollection(site?.themes, 'themes');
  addCollection(site?.keywords, 'keywords');

  inlineKnowledgeReferenceCache = candidates.sort((a, b) => b.label.length - a.label.length || a.label.localeCompare(b.label, 'zh-Hans-CN'));
  return inlineKnowledgeReferenceCache;
}

function isAsciiAlphaNumeric(value) {
  return /^[a-z0-9]$/i.test(value || '');
}

function hasInlineAsciiBoundaries(raw, start, end) {
  return !isAsciiAlphaNumeric(raw[start - 1]) && !isAsciiAlphaNumeric(raw[end]);
}

function hasInlineMatchOverlap(match, selected) {
  return selected.some((item) => match.start < item.end && match.end > item.start);
}

function inlineMatchPriority(match) {
  if (match.kind === 'episode') return 4;
  if (match.source === 'name') return 3;
  if (match.type === 'models' || match.type === 'concepts') return 2;
  return 1;
}

function collectInlineTextMatches(raw) {
  const matches = [];
  const currentRouteKey = currentInlineReferenceRouteKey();
  raw.replace(/\bEP\d{3}\b/g, (match, offset) => {
    const episode = episodeById(match);
    if (episode) {
      matches.push({
        start: offset,
        end: offset + match.length,
        label: match,
        kind: 'episode',
        route: routeTo(`episodes/${match}`),
        title: `${match}｜${displayEpisodeTitle(episode.title)}`,
        summary: episode.summary || ''
      });
    }
    return match;
  });

  const lowerRaw = raw.toLowerCase();
  for (const candidate of getInlineKnowledgeReferenceCandidates()) {
    if (candidate.routeKey === currentRouteKey) continue;
    const isAsciiLabel = !/[^\x00-\x7F]/.test(candidate.label);
    let index = lowerRaw.indexOf(candidate.labelLower);
    while (index >= 0) {
      const end = index + candidate.label.length;
      if (isAsciiLabel && !hasInlineAsciiBoundaries(raw, index, end)) {
        index = lowerRaw.indexOf(candidate.labelLower, index + 1);
        continue;
      }
      matches.push({
        start: index,
        end,
        label: raw.slice(index, index + candidate.label.length),
        kind: 'knowledge',
        route: candidate.route,
        type: candidate.type,
        routeKey: candidate.routeKey,
        source: candidate.source,
        title: candidate.title,
        summary: candidate.summary
      });
      index = lowerRaw.indexOf(candidate.labelLower, index + Math.max(1, candidate.label.length));
    }
  }

  const selected = [];
  const selectedReferenceRoutes = new Set();
  const bySpecificity = (a, b) => {
    const lengthDelta = (b.end - b.start) - (a.end - a.start);
    if (lengthDelta) return lengthDelta;
    const priorityDelta = inlineMatchPriority(b) - inlineMatchPriority(a);
    if (priorityDelta) return priorityDelta;
    return a.start - b.start;
  };
  for (const match of matches.sort(bySpecificity)) {
    if (match.kind === 'knowledge' && selectedReferenceRoutes.has(match.routeKey)) continue;
    if (hasInlineMatchOverlap(match, selected)) continue;
    selected.push(match);
    if (match.kind === 'knowledge') selectedReferenceRoutes.add(match.routeKey);
  }
  return selected.sort((a, b) => a.start - b.start);
}

function trimHomeEpisodeSummary(text, maxChars) {
  if (text.length <= maxChars) return text;
  const slice = text.slice(0, maxChars);
  const boundary = Math.max(slice.lastIndexOf('，'), slice.lastIndexOf('、'), slice.lastIndexOf(' '));
  const trimmed = boundary > maxChars * 0.55 ? slice.slice(0, boundary) : slice;
  return `${trimmed.trim()}…`;
}

function summarizeHomeEpisodeSummary(value, { mobile = false } = {}) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '待整理';
  if (!mobile) return text;

  const sentences = text.match(/[^。！？!?]+[。！？!?]?/g)?.map((item) => item.trim()).filter(Boolean) || [text];
  let summary = sentences[0] || text;
  const targetChars = Math.round(text.length * 0.75);
  const maxChars = Math.max(140, Math.min(260, targetChars));
  const minChars = Math.min(maxChars - 24, Math.max(96, Math.round(maxChars * 0.72)));

  let index = 1;
  while (summary.length < minChars && index < sentences.length) {
    summary = `${summary}${sentences[index]}`;
    index += 1;
  }

  return trimHomeEpisodeSummary(summary, maxChars);
}

function renderLinkedEpisodeText(value) {
  const raw = String(value || '');
  if (!raw) return '';

  let cursor = 0;
  let html = '';

  for (const match of collectInlineTextMatches(raw)) {
    html += escapeHtml(raw.slice(cursor, match.start));
    if (match.kind === 'episode') {
      html += `<span class="inline-episode-ref" data-popup-title="${escapeHtml(match.title)}" data-popup-summary="${escapeHtml(match.summary)}"><a class="inline-episode-link" href="${match.route}">${escapeHtml(match.label)}</a></span>`;
    } else {
      const popupAttrs = match.summary
        ? ` data-popup-title="${escapeHtml(match.title || match.label)}" data-popup-summary="${escapeHtml(match.summary)}"`
        : '';
      html += `<a class="inline-knowledge-link" data-ref-type="${escapeHtml(match.type)}" href="${match.route}"${popupAttrs}>${escapeHtml(match.label)}</a>`;
    }
    cursor = match.end;
  }

  html += escapeHtml(raw.slice(cursor));
  return html;
}

function getInlineEpisodePopupElement() {
  if (inlineEpisodePopupElement instanceof HTMLElement) return inlineEpisodePopupElement;
  const popup = document.createElement('div');
  popup.className = 'inline-episode-global-popup';
  popup.setAttribute('aria-hidden', 'true');
  popup.innerHTML = '<strong></strong><span></span>';
  document.body.appendChild(popup);
  inlineEpisodePopupElement = popup;
  return popup;
}

function findInlinePopupReference(target, includeKnowledge = false) {
  if (!(target instanceof Element)) return null;
  const selector = includeKnowledge
    ? '.inline-episode-ref, .inline-knowledge-link[data-popup-summary]'
    : '.inline-episode-ref';
  const reference = target.closest(selector);
  return reference instanceof HTMLElement ? reference : null;
}

function handleInlinePopupEnter(event) {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  const reference = findInlinePopupReference(event.target, true);
  if (!(reference instanceof HTMLElement)) return;
  scheduleInlinePopup(reference);
}

function handleInlinePopupLeave(event) {
  if (window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
  const reference = findInlinePopupReference(event.target, true);
  if (!(reference instanceof HTMLElement)) return;
  clearInlinePopupTimer();
  window.requestAnimationFrame(() => {
    if (reference.matches(':hover')) return;
    closeInlineEpisodePopup(reference);
  });
}

function clearInlinePopupTimer() {
  window.clearTimeout(inlinePopupTimer);
  inlinePopupTimer = 0;
  pendingInlinePopupRef = null;
}

function scheduleInlinePopup(reference) {
  clearInlinePopupTimer();
  pendingInlinePopupRef = reference;
  inlinePopupTimer = window.setTimeout(() => {
    inlinePopupTimer = 0;
    if (!(reference instanceof HTMLElement) || pendingInlinePopupRef !== reference) return;
    pendingInlinePopupRef = null;
    positionInlineEpisodePopup(reference);
  }, INLINE_POPUP_DELAY_MS);
}

function closeInlineEpisodePopup(reference = activeInlineEpisodeRef) {
  clearInlinePopupTimer();
  if (!(reference instanceof HTMLElement)) return;
  reference.classList.remove('is-popup-open');
  const popup = getInlineEpisodePopupElement();
  popup.classList.remove('is-visible');
  popup.classList.remove('is-placed');
  popup.style.visibility = '';
  popup.style.left = '';
  popup.style.top = '';
  if (activeInlineEpisodeRef === reference) {
    activeInlineEpisodeRef = null;
  }
}

function positionInlineEpisodePopup(reference) {
  if (!(reference instanceof HTMLElement)) return;
  const popup = getInlineEpisodePopupElement();
  const title = reference.dataset.popupTitle || '';
  const summary = reference.dataset.popupSummary || '';
  const titleNode = popup.querySelector('strong');
  const summaryNode = popup.querySelector('span');
  if (!(titleNode instanceof HTMLElement) || !(summaryNode instanceof HTMLElement)) return;
  titleNode.textContent = title;
  summaryNode.textContent = summary;
  popup.classList.remove('is-placed');

  closeInlineEpisodePopup(activeInlineEpisodeRef);
  reference.classList.add('is-popup-open');

  const margin = 12;
  const gap = 10;
  const referenceRect = reference.getBoundingClientRect();
  popup.classList.add('is-visible');
  popup.style.visibility = 'hidden';
  popup.style.left = '0px';
  popup.style.top = '0px';

  const popupRect = popup.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const candidates = [
    { left: referenceRect.left, top: referenceRect.bottom + gap },
    { left: referenceRect.left, top: referenceRect.top - gap - popupRect.height },
    { left: referenceRect.right - popupRect.width, top: referenceRect.bottom + gap },
    { left: referenceRect.right - popupRect.width, top: referenceRect.top - gap - popupRect.height }
  ];

  const fitsViewport = (candidate) => (
    candidate.left >= margin &&
    candidate.top >= margin &&
    candidate.left + popupRect.width <= viewportWidth - margin &&
    candidate.top + popupRect.height <= viewportHeight - margin
  );

  const visibleArea = (candidate) => {
    const left = Math.max(candidate.left, margin);
    const top = Math.max(candidate.top, margin);
    const right = Math.min(candidate.left + popupRect.width, viewportWidth - margin);
    const bottom = Math.min(candidate.top + popupRect.height, viewportHeight - margin);
    return Math.max(0, right - left) * Math.max(0, bottom - top);
  };

  const bestCandidate = candidates.find(fitsViewport) || [...candidates].sort((a, b) => visibleArea(b) - visibleArea(a))[0];
  const resolvedLeft = Math.min(Math.max(bestCandidate.left, margin), viewportWidth - popupRect.width - margin);
  const resolvedTop = Math.min(Math.max(bestCandidate.top, margin), viewportHeight - popupRect.height - margin);

  popup.style.left = `${Math.round(resolvedLeft)}px`;
  popup.style.top = `${Math.round(resolvedTop)}px`;
  popup.style.visibility = '';

  activeInlineEpisodeRef = reference;
  window.requestAnimationFrame(() => {
    if (activeInlineEpisodeRef === reference) {
      popup.classList.add('is-placed');
    }
  });
}

function graphStatValue() {
  return graphData?.meta?.nodeCount || 0;
}

function graphLinkedChipList(items = []) {
  if (!items.length) return '';
  const chipMap = {
    [`节目 ${site.stats.episodes}`]: '#/episodes',
    [`概念 ${site.stats.concepts}`]: '#/concepts',
    [`模型 ${site.stats.models}`]: '#/models',
    [`人物 ${site.stats.people}`]: '#/people',
    [`主题 ${site.stats.themes}`]: '#/themes',
    '点击节点展开': '#/graph',
    '再次点击进详情': '#/graph',
    '返回恢复展开': '#/graph',
    '滚轮缩放': '#/graph'
  };
  return `
    <div class="chip-row">
      ${items.map((item) => {
        const href = chipMap[item];
        return href
          ? `<a class="chip" href="${href}">${escapeHtml(item)}</a>`
          : `<span class="chip">${escapeHtml(item)}</span>`;
      }).join('')}
    </div>
  `;
}

function keywordCount(keyword) {
  return keyword.episodes?.length || 0;
}

function keywordLatestEpisodeNumber(keyword) {
  const episodeRefs = Array.isArray(keyword?.episodes) ? keyword.episodes : [];
  const latest = episodeRefs
    .map((entry) => episodeNumberFromId(typeof entry === 'string' ? entry : entry?.id))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];
  return latest || 0;
}

function pickWeightedKeywords(keywords = [], limit = 3) {
  const pool = [...keywords];
  const picked = [];
  const maxEpisodeNumber = Math.max(...pool.map((keyword) => keywordLatestEpisodeNumber(keyword)), 1);

  while (pool.length && picked.length < limit) {
    const weights = pool.map((keyword) => {
      const referenceWeight = Math.pow(keywordCount(keyword) + 1, 1.18);
      const recencyWeight = 1 + (keywordLatestEpisodeNumber(keyword) / maxEpisodeNumber) * 2.8;
      return referenceWeight * recencyWeight;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let threshold = Math.random() * totalWeight;
    let chosenIndex = 0;

    for (let index = 0; index < pool.length; index += 1) {
      threshold -= weights[index];
      if (threshold <= 0) {
        chosenIndex = index;
        break;
      }
    }

    picked.push(pool.splice(chosenIndex, 1)[0]);
  }

  return picked;
}

function getRecommendedKeywords(limit = 3) {
  if (!site?.keywords?.length) return [];
  const offset = Math.abs(homeRecommendationSeed) % Math.max(site.keywords.length, 1);
  const rotated = [...site.keywords.slice(offset), ...site.keywords.slice(0, offset)];
  return pickWeightedKeywords(rotated, limit);
}

function referenceCount(item) {
  return item.episodes?.length || 0;
}

function referenceLatestEpisodeNumber(item) {
  const episodeRefs = Array.isArray(item?.episodes) ? item.episodes : [];
  const latest = episodeRefs
    .map((entry) => episodeNumberFromId(typeof entry === 'string' ? entry : entry?.id))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => b - a)[0];
  return latest || 0;
}

function seededHomeRandom(seedValue = homeRecommendationSeed, salt = 0) {
  let seed = (Math.abs(seedValue) + salt) % 2147483647;
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

function pickRecommendedReferences(items = [], limit = 3, salt = 0, seedValue = homeRecommendationSeed) {
  const pool = [...items].filter((item) => item?.id && item?.name && item?.summary);
  const picked = [];
  const random = seededHomeRandom(seedValue, salt + pool.length * 37);
  const maxEpisodeNumber = Math.max(...pool.map((item) => referenceLatestEpisodeNumber(item)), 1);

  while (pool.length && picked.length < limit) {
    const weights = pool.map((item) => {
      const referenceWeight = Math.pow(referenceCount(item) + 1, 1.12);
      const recencyWeight = 1 + (referenceLatestEpisodeNumber(item) / maxEpisodeNumber) * 1.8;
      return referenceWeight * recencyWeight;
    });
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let threshold = random() * totalWeight;
    let chosenIndex = 0;

    for (let index = 0; index < pool.length; index += 1) {
      threshold -= weights[index];
      if (threshold <= 0) {
        chosenIndex = index;
        break;
      }
    }

    picked.push(pool.splice(chosenIndex, 1)[0]);
  }

  return picked;
}

function getRecommendedConcepts(limit = 3) {
  return pickRecommendedReferences(site?.concepts || [], limit, 101, homeConceptRecommendationSeed);
}

function getRecommendedModels(limit = 3) {
  return pickRecommendedReferences(site?.models || [], limit, 307, homeModelRecommendationSeed);
}

function renderHomeReferenceCards(type, items = []) {
  return items.map((item) => `
    <a class="list-item" href="${routeTo(`${type}/${item.id}`)}">
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.summary)}</p>
    </a>
  `).join('');
}

function updateHomeReferenceRecommendations(target = 'all') {
  const conceptContainer = document.getElementById('home-recommended-concepts');
  if (conceptContainer && (target === 'all' || target === 'concepts')) {
    conceptContainer.innerHTML = renderHomeReferenceCards('concepts', getRecommendedConcepts(3));
  }

  const modelContainer = document.getElementById('home-recommended-models');
  if (modelContainer && (target === 'all' || target === 'models')) {
    modelContainer.innerHTML = renderHomeReferenceCards('models', getRecommendedModels(3));
  }
}

function isPersonKeyword(keyword) {
  return keyword?.entryType === 'person';
}

const KEYWORD_KIND_ORDER = [
  'person',
  'geography',
  'organization',
  'product',
  'asset',
  'event',
  'mechanism',
  'concept',
  'theme',
  'general'
];

const KEYWORD_KIND_LABELS = {
  person: '人物',
  geography: '地理位置',
  organization: '公司机构',
  product: '产品技术',
  event: '事件',
  mechanism: '机制',
  concept: '概念',
  theme: '主题',
  asset: '资产商品',
  general: '通用类'
};

function compactKeywordKindKey(value) {
  return normalizeValue(value).replace(/[\s·•・／/\\()（）\-—_]+/g, '');
}

const KEYWORD_KIND_OVERRIDES = new Map(Object.entries({
  房地产: 'asset',
  地价: 'asset',
  工业用地: 'asset',
  美元基金: 'asset',
  能源设施: 'asset',
  茶票: 'mechanism',
  跨境电商: 'mechanism',
  跨境贸易: 'mechanism',
  航运: 'mechanism',
  垃圾焚烧: 'mechanism',
  资源回收: 'mechanism',
  公务员理财: 'mechanism',
  买房: 'mechanism',
  卖房: 'mechanism',
  涨薪: 'mechanism',
  美国政治: 'concept',
  商学院: 'concept',
  二代企业: 'concept',
  大学生: 'concept',
  唇腭裂: 'concept',
  校长: 'concept',
  张老师: 'concept',
  散户: 'concept',
  五色旗: 'concept',
  AI基建: 'product',
  古偶: 'product',
  纪录片: 'product',
  外卖: 'product',
  直播平台: 'organization',
  杭州学校: 'organization',
  广深地铁: 'organization',
  故宫南迁文物: 'event',
  国际模特大赛: 'event',
  欢乐跑: 'event',
  马拉松: 'event',
  选美: 'event',
  选美冠军: 'event',
  自燃: 'event',
  重装备方阵: 'event',
  C级赛事: 'event'
}).map(([name, kind]) => [compactKeywordKindKey(name), kind]));

function keywordKindOverride(keyword) {
  const refs = [keyword?.name, keyword?.id, ...(keyword?.aliases || [])]
    .map(compactKeywordKindKey)
    .filter(Boolean);
  for (const ref of refs) {
    const kind = KEYWORD_KIND_OVERRIDES.get(ref);
    if (kind) return kind;
  }
  return '';
}

function normalizeKeywordKind(kind) {
  const normalized = String(kind || '').trim();
  return KEYWORD_KIND_ORDER.includes(normalized) ? normalized : '';
}

function getPeopleKeywords(minReferences = 0) {
  return [...(site?.keywords || [])]
    .filter((keyword) => isPersonKeyword(keyword) && keywordCount(keyword) >= minReferences)
    .sort((a, b) => keywordCount(b) - keywordCount(a) || (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN'));
}

function keywordKindRoute(kind) {
  return routeWithQuery('keywords', { kind });
}

function keywordTypeBadge(keyword, options = {}) {
  const kind = inferKeywordKind(keyword);
  const label = keywordKindConfig(kind).badge;
  if (options.link) {
    return `<a class="chip keyword-kind-chip" href="${keywordKindRoute(kind)}" aria-label="查看${escapeHtml(label)}分类">${escapeHtml(label)}</a>`;
  }
  return `<span class="chip keyword-kind-chip">${escapeHtml(label)}</span>`;
}

function episodeNumberFromId(id) {
  const match = String(id || '').match(/EP(\d+)/i);
  return match ? Number(match[1]) : null;
}

function newestEpisodeNumber() {
  return Math.max(
    0,
    ...(site?.episodes || [])
      .map((episode) => episodeNumberFromId(episode?.id))
      .filter((value) => Number.isFinite(value))
  );
}

function parseChineseEpisodeNumber(raw) {
  const text = String(raw || '')
    .replace(/[第集期回]/g, '')
    .trim();
  if (!text) return NaN;

  const digitMap = {
    '零': 0,
    '〇': 0,
    '一': 1,
    '二': 2,
    '两': 2,
    '三': 3,
    '四': 4,
    '五': 5,
    '六': 6,
    '七': 7,
    '八': 8,
    '九': 9
  };
  const unitMap = {
    '十': 10,
    '百': 100
  };

  let total = 0;
  let current = 0;

  for (const char of text) {
    if (char in digitMap) {
      current = digitMap[char];
      continue;
    }
    if (char in unitMap) {
      const unit = unitMap[char];
      total += (current || 1) * unit;
      current = 0;
      continue;
    }
    return NaN;
  }

  return total + current;
}

function normalizeEpisodeIdQuery(query) {
  const compact = String(query || '').trim().toUpperCase().replace(/\s+/g, '');
  const digitMatch = compact.match(/^(?:第)?EP?0*(\d{1,3})(?:[集期回])?$/);
  if (digitMatch) {
    return `EP${digitMatch[1].padStart(3, '0')}`;
  }

  const chineseMatch = compact.match(/^第?([零〇一二两三四五六七八九十百]+)(?:[集期回])?$/);
  if (!chineseMatch) return '';

  const number = parseChineseEpisodeNumber(chineseMatch[1]);
  if (!Number.isFinite(number) || number <= 0 || number > 999) return '';
  return `EP${String(number).padStart(3, '0')}`;
}

function buildEpisodeRanges(episodes = [], step = 10) {
  const numbers = episodes
    .map((episode) => episodeNumberFromId(episode.id))
    .filter((value) => Number.isFinite(value));
  const max = numbers.length ? Math.max(...numbers) : 0;
  const ranges = [];

  for (let start = 1; start <= max; start += step) {
    const end = Math.min(start + step - 1, max);
    ranges.push({
      start,
      end,
      label: `${start}-${end}`
    });
  }

  return ranges.reverse();
}

function getEpisodeNeighbors(id) {
  const episodes = orderedEpisodes();
  const index = episodes.findIndex((episode) => episode.id === id);
  if (index < 0) {
    return {
      previousEpisode: null,
      nextEpisode: null
    };
  }

  return {
    previousEpisode: index > 0 ? episodes[index - 1] : null,
    nextEpisode: index < episodes.length - 1 ? episodes[index + 1] : null
  };
}

function rerenderWithPreservedViewport(renderFn, options = {}) {
  const { focusId = '' } = options;
  const activeElement = document.activeElement;
  const shouldRestoreFocus = focusId && activeElement?.id === focusId;
  const selectionStart = shouldRestoreFocus && typeof activeElement.selectionStart === 'number'
    ? activeElement.selectionStart
    : null;
  const selectionEnd = shouldRestoreFocus && typeof activeElement.selectionEnd === 'number'
    ? activeElement.selectionEnd
    : null;
  const scrollX = window.scrollX;
  const scrollY = window.scrollY;

  renderFn();

  window.requestAnimationFrame(() => {
    window.scrollTo(scrollX, scrollY);

    if (!shouldRestoreFocus) return;

    const nextInput = document.getElementById(focusId);
    if (!(nextInput instanceof HTMLInputElement)) return;

    nextInput.focus({ preventScroll: true });
    if (selectionStart !== null && selectionEnd !== null) {
      nextInput.setSelectionRange(selectionStart, selectionEnd);
    }
  });
}

function episodeMatchesQuery(episode, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return false;

  const exactEpisodeId = normalizeEpisodeIdQuery(normalizedQuery);
  if (exactEpisodeId && episode.id === exactEpisodeId) {
    return true;
  }

  const haystack = [
    episode.id,
    episode.title,
    episode.summary || '',
    ...(episode.tags || []),
    ...(episode.people || []),
    ...(episode.themes || []),
    ...(episode.concepts || []),
    ...(episode.models || [])
  ].join(' ').toLowerCase();

  return haystack.includes(normalizedQuery);
}

function keywordMatchesQuery(keyword, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return false;

  const haystack = [
    keyword.id,
    keyword.name,
    keyword.summary || '',
    keyword.description || '',
    ...(keyword.aliases || [])
  ].join(' ').toLowerCase();

  return haystack.includes(normalizedQuery);
}

function referenceItemSuggestionMatches(item, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return false;

  const nameFields = [
    item?.id,
    item?.name || '',
    item?.title || '',
    ...(item?.aliases || [])
  ].map((value) => String(value || '').toLowerCase());

  return nameFields.some((value) => value.includes(normalizedQuery));
}

function suggestionMatchScore(item, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  const fields = [
    item?.name || '',
    item?.title || '',
    item?.id || '',
    ...(item?.aliases || [])
  ].map((value) => String(value || '').toLowerCase());

  const exactIndex = fields.findIndex((value) => value === normalizedQuery);
  if (exactIndex >= 0) return 400 - exactIndex;

  const prefixIndex = fields.findIndex((value) => value.startsWith(normalizedQuery));
  if (prefixIndex >= 0) return 300 - prefixIndex;

  const wordIndex = fields.findIndex((value) => value.includes(normalizedQuery));
  if (wordIndex >= 0) return 200 - wordIndex;

  return 0;
}

function referenceItemMatchesQuery(item, query) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (!normalizedQuery) return false;

  const haystack = [
    item?.id,
    item?.name || '',
    item?.title || '',
    item?.summary || '',
    item?.definition || '',
    item?.description || '',
    ...(item?.aliases || [])
  ].join(' ').toLowerCase();

  return haystack.includes(normalizedQuery);
}

function getEpisodeIndexSuggestionMatches(query) {
  const trimmedQuery = String(query || '').trim();
  if (!trimmedQuery || !site) return [];
  const suggestionPriority = {
    person: 5,
    keyword: 4,
    concept: 3,
    model: 3,
    theme: 2,
    episode: 1
  };

  const buildReferenceSuggestions = (collection = [], options = {}) => {
    const {
      type,
      badge,
      limit = 4,
      nameFrom = (item) => item.name || item.title || item.id,
      valueFrom = (item) => item.name || item.title || item.id
    } = options;

    return collection
      .filter((item) => referenceItemSuggestionMatches(item, trimmedQuery))
      .sort((a, b) => {
        const scoreDelta = suggestionMatchScore(b, trimmedQuery) - suggestionMatchScore(a, trimmedQuery);
        if (scoreDelta !== 0) return scoreDelta;
        const countDelta = referenceCount(b) - referenceCount(a);
        if (countDelta !== 0) return countDelta;
        return String(nameFrom(a)).localeCompare(String(nameFrom(b)), 'zh-Hans-CN');
      })
      .slice(0, limit)
      .map((item) => ({
        type,
        id: item.id,
        name: nameFrom(item),
        value: valueFrom(item),
        badge,
        route: routeForSearchMatch({
          type,
          id: item.id
        })
      }));
  };

  const matches = [
    ...buildReferenceSuggestions(site.keywords, { type: 'keyword', badge: '关键词', limit: 3, valueFrom: (item) => item.name || item.id }),
    ...buildReferenceSuggestions(site.people, { type: 'person', badge: '人物', limit: 2, valueFrom: (item) => item.name || item.id }),
    ...buildReferenceSuggestions(site.themes, { type: 'theme', badge: '主题', limit: 2, valueFrom: (item) => item.name || item.id }),
    ...buildReferenceSuggestions(site.concepts, { type: 'concept', badge: '概念', limit: 2, valueFrom: (item) => item.name || item.id }),
    ...buildReferenceSuggestions(site.models, { type: 'model', badge: '模型', limit: 2, valueFrom: (item) => item.name || item.id })
  ];

  const deduped = new Map();
  for (const match of matches) {
    const key = match.route || `${match.type}:${match.id}`;
    const existing = deduped.get(key);
    if (!existing) {
      deduped.set(key, match);
      continue;
    }
    const nextPriority = suggestionPriority[match.type] || 0;
    const existingPriority = suggestionPriority[existing.type] || 0;
    if (nextPriority > existingPriority) {
      deduped.set(key, match);
    }
  }

  return [...deduped.values()].slice(0, 5);
}

function renderEpisodeIndexSuggestions(query) {
  const container = document.getElementById('episode-index-suggestions');
  if (!(container instanceof HTMLElement)) return;

  if (!String(query || '').trim()) {
    const recommendedKeywords = getRecommendedKeywords(3);
    if (!recommendedKeywords.length) {
      container.innerHTML = '';
      container.classList.add('hidden');
      return;
    }

    container.innerHTML = `
      <div class="search-subtitle-row episode-search-subtitle-row">
        <p class="search-subtitle episode-search-subtitle">推荐关键词</p>
        <button id="episode-index-reroll" class="search-reroll episode-search-reroll" type="button" aria-label="换一换推荐关键词">
          <span class="search-reroll-icon" aria-hidden="true">↻</span>
          <span>换一换</span>
        </button>
      </div>
      <div class="episode-index-recommendations">
        ${recommendedKeywords.map((keyword) => `
          <button
            class="sidebar-suggestion search-suggestion episode-index-suggestion"
            type="button"
            data-episode-index-suggestion="${escapeHtml(keyword.name || keyword.id)}"
            data-episode-index-action="apply-query"
          >
            <span class="episode-index-suggestion-label">${escapeHtml(keyword.name)}</span>
            <span class="count-badge">关键词</span>
          </button>
        `).join('')}
      </div>
    `;
    container.classList.remove('hidden');
    return;
  }

  const matches = getEpisodeIndexSuggestionMatches(query);
  if (!matches.length) {
    container.innerHTML = '';
    container.classList.add('hidden');
    return;
  }

  container.innerHTML = matches.map((match) => `
    <button
      class="sidebar-suggestion search-suggestion episode-index-suggestion"
      type="button"
      data-episode-index-route="${escapeHtml(match.route)}"
    >
      <span class="episode-index-suggestion-label">${escapeHtml(match.name)}</span>
      <span class="count-badge">${escapeHtml(match.badge)}</span>
    </button>
  `).join('');
  container.classList.remove('hidden');
}

function getEpisodeIndexSearchState(episodesByNumber, selectedRange, query) {
  const trimmedQuery = String(query || '').trim();
  const exactEpisodeId = normalizeEpisodeIdQuery(trimmedQuery);
  const visibleEpisodes = episodesByNumber.filter((episode) => {
    const number = episodeNumberFromId(episode.id);
    return number >= selectedRange.start && number <= selectedRange.end;
  });

  const filteredEpisodes = trimmedQuery
    ? episodesByNumber
      .filter((episode) => episodeMatchesQuery(episode, trimmedQuery))
      .sort((a, b) => {
        const aExact = a.id === exactEpisodeId;
        const bExact = b.id === exactEpisodeId;
        if (aExact !== bExact) return aExact ? -1 : 1;
        return episodeNumberFromId(b.id) - episodeNumberFromId(a.id);
      })
    : visibleEpisodes;

  return {
    query: trimmedQuery,
    filteredEpisodes
  };
}

function renderEpisodeIndexEpisodeList(episodes = []) {
  if (!episodes.length) {
    return '<div class="empty-state">没有匹配到节目。试试 EP031、标题片段，或回到区间浏览。</div>';
  }

  return `
    <div class="list">
      ${episodes.map((episode) => {
        const episodeHref = routeTo(`episodes/${episode.id}`);
        return `
        <article
          class="list-item episode-index-card"
          data-episode-href="${episodeHref}"
          data-progress-href="${episodeHref}"
          data-progress-section="true"
          data-progress-label="${escapeHtml(`${episode.id.replace(/^EP/i, '')}集 ${displayEpisodeTitle(episode.title).replace(/\s+/g, '').slice(0, 12)}`)}"
        >
          <div class="episode-index-card-head">
            <p class="card-kicker episode-index-kicker">${escapeHtml(episode.id)}${renderEpisodeFreshBadge(episode, { compact: true })}</p>
          </div>
          <a class="card-primary-link" href="${episodeHref}">
            <h3>${escapeHtml(displayEpisodeTitle(episode.title))}</h3>
          </a>
          <p class="episode-index-summary">${escapeHtml(episode.summary || '待整理')}</p>
          ${linkedChipList('keywords', (episode.tags || []).slice(0, 6), site.keywords)}
        </article>
      `;
      }).join('')}
    </div>
  `;
}

function scrollEpisodeResultsIntoView() {
  window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
    const toolbar = document.querySelector('.episode-index-toolbar');
    const firstEpisodeCard = document.querySelector('#episode-index-results .list-item');
    if (!firstEpisodeCard) return;
    const toolbarHeight = toolbar ? toolbar.getBoundingClientRect().height : 0;
    const top = window.scrollY + firstEpisodeCard.getBoundingClientRect().top - toolbarHeight - 16;
    scrollWindowInstantly(Math.max(top, 0), window.scrollX);
  }));
}

function centerActiveEpisodeRangeButton(button, behavior = 'auto') {
  if (!(button instanceof HTMLElement)) return;
  const rail = button.closest('.episode-range-wheel');
  if (!(rail instanceof HTMLElement)) return;

  const railWidth = rail.clientWidth;
  if (railWidth <= 0) return;

  const targetLeft = button.offsetLeft - Math.max((railWidth - button.offsetWidth) / 2, 0);
  const maxScrollLeft = Math.max(rail.scrollWidth - railWidth, 0);
  rail.scrollTo({
    left: Math.min(Math.max(targetLeft, 0), maxScrollLeft),
    behavior
  });
}

function clearEpisodeIndexSearchAutoHideTimer() {
  window.clearTimeout(episodeIndexSearchAutoHideTimer);
  episodeIndexSearchAutoHideTimer = 0;
}

function setupEpisodeRangeWheelDrag(wheel) {
  if (!(wheel instanceof HTMLElement)) return;

  let pointerId = null;
  let startX = 0;
  let startY = 0;
  let startScrollLeft = 0;
  let lastMoveX = 0;
  let lastMoveAt = 0;
  let velocityX = 0;
  let isDragging = false;
  let suppressClick = false;
  let momentumFrame = 0;

  const cancelMomentum = () => {
    if (!momentumFrame) return;
    window.cancelAnimationFrame(momentumFrame);
    momentumFrame = 0;
  };

  const releasePointer = () => {
    if (pointerId !== null && wheel.hasPointerCapture?.(pointerId)) {
      wheel.releasePointerCapture(pointerId);
    }
    pointerId = null;
  };

  const clearDragging = () => {
    releasePointer();
    wheel.classList.remove('is-dragging');
    isDragging = false;
  };

  const startMomentum = () => {
    cancelMomentum();
    if (Math.abs(velocityX) < 0.12) return;

    let currentVelocity = velocityX * 18;
    let previousAt = performance.now();

    const step = (now) => {
      const elapsed = Math.min(now - previousAt, 24);
      previousAt = now;
      wheel.scrollLeft += currentVelocity * elapsed;
      currentVelocity *= 0.92;
      if (Math.abs(currentVelocity) < 0.08) {
        momentumFrame = 0;
        return;
      }
      momentumFrame = window.requestAnimationFrame(step);
    };

    momentumFrame = window.requestAnimationFrame(step);
  };

  wheel.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    cancelMomentum();
    pointerId = event.pointerId;
    startX = event.clientX;
    startY = event.clientY;
    startScrollLeft = wheel.scrollLeft;
    lastMoveX = event.clientX;
    lastMoveAt = event.timeStamp || performance.now();
    velocityX = 0;
    isDragging = false;
    suppressClick = false;
  });

  wheel.addEventListener('pointermove', (event) => {
    if (event.pointerId !== pointerId) return;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;

    if (!isDragging) {
      if (Math.abs(deltaX) < 6) return;
      if (Math.abs(deltaX) <= Math.abs(deltaY)) {
        clearDragging();
        return;
      }
      isDragging = true;
      suppressClick = true;
      wheel.classList.add('is-dragging');
      wheel.setPointerCapture?.(pointerId);
    }

    event.preventDefault();
    wheel.scrollLeft = startScrollLeft - deltaX * 1.16;
    const now = event.timeStamp || performance.now();
    const deltaTime = Math.max(now - lastMoveAt, 1);
    velocityX = (lastMoveX - event.clientX) / deltaTime;
    lastMoveX = event.clientX;
    lastMoveAt = now;
  });

  const finishDrag = (event) => {
    if (pointerId !== null && event.pointerId !== pointerId) return;
    const shouldStartMomentum = isDragging;
    clearDragging();
    if (shouldStartMomentum) {
      startMomentum();
    }
    if (!suppressClick) return;
    wheel.dataset.dragSuppressClick = 'true';
    window.setTimeout(() => {
      delete wheel.dataset.dragSuppressClick;
    }, 220);
  };

  wheel.addEventListener('pointerup', finishDrag);
  wheel.addEventListener('pointercancel', finishDrag);
  wheel.addEventListener('lostpointercapture', finishDrag);
  wheel.addEventListener('click', (event) => {
    if (wheel.dataset.dragSuppressClick !== 'true') return;
    event.preventDefault();
    event.stopPropagation();
  }, true);
}

function setupStickyToolbarBehavior(toolbar, config) {
  config.abortController?.abort();
  const controller = new AbortController();
  config.assignController(controller);
  const { signal } = controller;
  const {
    opacityVariable,
    minimumHideY = isMobileViewport() ? 48 : 72,
    idleHideDelay = isMobileViewport() ? 1050 : 1200,
    anchorBoundarySelector = '',
    revealAfterSelector = '',
    revealOffset = 0,
    fixedOverlay = false,
    keepVisibleWhenPinned = false
  } = config;
  let lastObservedScrollY = window.scrollY;
  let idleHideTimer = 0;
  let anchorScrollY = 0;
  let anchorVisibleBottom = 0;
  let revealAfterScrollY = 0;
  let fixedOverlayActivated = false;
  let naturalAnchorScrollY = 0;

  const isEngaged = () => toolbar.dataset.engaged === 'true' || toolbar.matches(':focus-within');

  const getTranslateY = (transform) => {
    if (!transform || transform === 'none') return 0;
    const matrix3d = transform.match(/^matrix3d\((.+)\)$/);
    if (matrix3d) {
      const values = matrix3d[1].split(',').map((value) => Number.parseFloat(value.trim()));
      return Number.isFinite(values[13]) ? values[13] : 0;
    }
    const matrix = transform.match(/^matrix\((.+)\)$/);
    if (matrix) {
      const values = matrix[1].split(',').map((value) => Number.parseFloat(value.trim()));
      return Number.isFinite(values[5]) ? values[5] : 0;
    }
    return 0;
  };

  const getToolbarMetrics = () => {
    const rect = toolbar.getBoundingClientRect();
    const style = getComputedStyle(toolbar);
    return {
      rect,
      style,
      layoutTop: rect.top - getTranslateY(style.transform)
    };
  };

  const getAnchorVisibleBottom = (rect) => {
    const boundary = anchorBoundarySelector ? document.querySelector(anchorBoundarySelector) : null;
    if (boundary instanceof HTMLElement) {
      const boundaryRect = boundary.getBoundingClientRect();
      const boundaryPadding = isMobileViewport() ? 28 : 42;
      return window.scrollY + boundaryRect.bottom - boundaryPadding;
    }
    return fixedOverlay ? 0 : naturalAnchorScrollY + rect.height + (isMobileViewport() ? 44 : 56);
  };

  const refreshNaturalAnchorScrollY = () => {
    if (fixedOverlay) {
      naturalAnchorScrollY = 0;
      return;
    }
    const { style, layoutTop } = getToolbarMetrics();
    const stickyTop = Number.parseFloat(style.top) || 0;
    if (!naturalAnchorScrollY || window.scrollY <= minimumHideY || layoutTop > stickyTop + 2) {
      naturalAnchorScrollY = Math.max(window.scrollY + layoutTop, 0);
    }
  };

  const measureAnchorScrollY = () => {
    const { rect } = getToolbarMetrics();
    refreshNaturalAnchorScrollY();
    anchorScrollY = naturalAnchorScrollY;
    anchorVisibleBottom = getAnchorVisibleBottom(rect);
    const revealTarget = revealAfterSelector ? document.querySelector(revealAfterSelector) : null;
    if (revealTarget instanceof HTMLElement) {
      const revealRect = revealTarget.getBoundingClientRect();
      const fixedRevealOffset = fixedOverlay
        ? Math.max(revealOffset, window.innerHeight - rect.height - 96)
        : revealOffset;
      revealAfterScrollY = Math.max(window.scrollY + revealRect.top - fixedRevealOffset, 0);
      return;
    }
    revealAfterScrollY = 0;
  };

  const clearIdleHideTimer = () => {
    window.clearTimeout(idleHideTimer);
    idleHideTimer = 0;
  };

  const isProtectedVisiblePosition = () => {
    if (!keepVisibleWhenPinned) return false;
    const { rect, style } = getToolbarMetrics();
    const stickyTop = Number.parseFloat(style.top) || 0;
    const toolbarHeight = toolbar.offsetHeight || rect.height;
    refreshNaturalAnchorScrollY();
    const naturalTop = naturalAnchorScrollY;
    const naturalBottom = naturalTop + toolbarHeight;
    const boundaryBottom = getAnchorVisibleBottom(rect);
    const naturalSlotVisible = naturalBottom > window.scrollY && naturalTop < window.scrollY + window.innerHeight;
    const pinnedWithinSearchBoundary = window.scrollY > minimumHideY
      && window.scrollY >= naturalTop - stickyTop - 2
      && window.scrollY <= boundaryBottom;
    return naturalSlotVisible || pinnedWithinSearchBoundary;
  };

  const scheduleIdleHide = () => {
    clearIdleHideTimer();
    if (isEngaged()) return;
    if (isProtectedVisiblePosition()) return;
    if (toolbar.classList.contains('is-hidden-by-scroll')) return;
    if (window.scrollY <= minimumHideY) return;
    if (window.scrollY < revealAfterScrollY) return;
    if (window.scrollY <= anchorVisibleBottom) return;
    idleHideTimer = window.setTimeout(() => {
      if (isEngaged()) return;
      if (isProtectedVisiblePosition()) return;
      if (window.scrollY <= minimumHideY) return;
      if (window.scrollY < revealAfterScrollY) return;
      if (window.scrollY <= anchorVisibleBottom) return;
      toolbar.classList.add('is-hidden-by-scroll');
      toolbar.classList.remove('is-ghost');
      toolbar.style.setProperty(opacityVariable, '0');
    }, idleHideDelay);
  };

  const syncToolbarState = () => {
    measureAnchorScrollY();
    const currentScrollY = window.scrollY;
    const beforeRevealGate = !isEngaged() && currentScrollY < revealAfterScrollY;

    if (fixedOverlay) {
      if (isEngaged() || currentScrollY > 24) {
        fixedOverlayActivated = true;
      }
      const shouldHide = !fixedOverlayActivated && !isEngaged();
      if (!shouldHide) {
        clearIdleHideTimer();
      }
      toolbar.classList.remove('is-hidden-by-scroll', 'is-ghost');
      toolbar.classList.toggle('is-engaged', isEngaged());
      toolbar.style.setProperty(opacityVariable, shouldHide ? '0' : '1');
      toolbar.style.pointerEvents = shouldHide ? 'none' : 'auto';
      lastObservedScrollY = currentScrollY;
      return;
    }

    const delta = currentScrollY - lastObservedScrollY;
    const hideThreshold = isMobileViewport() ? 18 : 22;
    const revealThreshold = isMobileViewport() ? 10 : 14;
    const returnToAnchorThreshold = isMobileViewport() ? 28 : 36;
    const canHide = currentScrollY > minimumHideY && !isEngaged();
    const isProtectedVisible = isProtectedVisiblePosition();
    let shouldHide = toolbar.classList.contains('is-hidden-by-scroll');

    if (isProtectedVisible) {
      shouldHide = false;
    } else if (beforeRevealGate) {
      shouldHide = true;
    } else if (currentScrollY <= Math.max(anchorVisibleBottom, anchorScrollY - returnToAnchorThreshold)) {
      shouldHide = false;
    } else if (!canHide) {
      shouldHide = false;
    } else if (delta > hideThreshold) {
      shouldHide = true;
    } else if (delta < -revealThreshold) {
      shouldHide = false;
    }

    if (shouldHide || isProtectedVisible || isEngaged() || currentScrollY <= minimumHideY) {
      clearIdleHideTimer();
    }

    toolbar.classList.toggle('is-hidden-by-scroll', shouldHide);
    toolbar.classList.toggle('is-engaged', isEngaged());
    toolbar.classList.toggle('is-ghost', !beforeRevealGate && !shouldHide && !isEngaged() && currentScrollY > minimumHideY);
    toolbar.style.setProperty(opacityVariable, shouldHide ? '0' : (isEngaged() || currentScrollY <= minimumHideY ? '1' : '0.86'));

    if (!shouldHide && !isProtectedVisible && !isEngaged() && currentScrollY > minimumHideY) {
      scheduleIdleHide();
    }

    lastObservedScrollY = currentScrollY;
  };

  const engageToolbar = () => {
    clearIdleHideTimer();
    toolbar.dataset.engaged = 'true';
    toolbar.classList.add('is-engaged');
    toolbar.classList.remove('is-hidden-by-scroll', 'is-ghost');
    toolbar.style.setProperty(opacityVariable, '1');
  };

  const releaseToolbar = () => {
    delete toolbar.dataset.engaged;
    toolbar.classList.remove('is-engaged');
    syncToolbarState();
  };

  toolbar.addEventListener('pointerdown', engageToolbar, { signal });
  toolbar.addEventListener('focusin', engageToolbar, { signal });

  document.addEventListener('click', (event) => {
    if (toolbar.contains(event.target)) return;
    if (toolbar.matches(':focus-within')) return;
    releaseToolbar();
  }, { signal });

  window.addEventListener('scroll', syncToolbarState, { passive: true, signal });
  window.addEventListener('resize', () => {
    clearIdleHideTimer();
    measureAnchorScrollY();
    toolbar.classList.remove('is-hidden-by-scroll');
    lastObservedScrollY = window.scrollY;
    syncToolbarState();
  }, { passive: true, signal });

  measureAnchorScrollY();
  syncToolbarState();
  signal.addEventListener('abort', () => {
    clearIdleHideTimer();
  });
}

function setupEpisodeToolbarBehavior(toolbar) {
  episodeToolbarController?.abort();
  const controller = new AbortController();
  episodeToolbarController = controller;
  const { signal } = controller;
  const shell = toolbar.closest('.episode-index-toolbar-shell') || toolbar;
  const idleHideDelay = 10000;
  let lastScrollY = window.scrollY;
  let idleHideTimer = 0;
  let anchorScrollY = 0;
  let stickyTop = 0;
  let accumulatedScroll = 0;
  let lastScrollIntent = 0;

  const isEngaged = () => toolbar.classList.contains('is-engaged') || toolbar.matches(':focus-within');

  const clearIdleHideTimer = () => {
    window.clearTimeout(idleHideTimer);
    idleHideTimer = 0;
  };

  const measureAnchor = () => {
    const shellStyle = getComputedStyle(shell);
    stickyTop = Number.parseFloat(shellStyle.top) || (isMobileViewport() ? 8 : 14);
    const wasHidden = shell.classList.contains('is-hidden-by-scroll');
    if (wasHidden) shell.classList.remove('is-hidden-by-scroll');
    const rect = shell.getBoundingClientRect();
    anchorScrollY = Math.max(window.scrollY + rect.top, 0);
    if (wasHidden && window.scrollY > Math.max(anchorScrollY - stickyTop + 4, 0)) {
      shell.classList.add('is-hidden-by-scroll');
    }
  };

  const isAtStaticPosition = () => {
    const rect = shell.getBoundingClientRect();
    if (rect.top > stickyTop + 2) return true;
    return window.scrollY <= Math.max(anchorScrollY - stickyTop + 2, 0);
  };

  const showToolbar = () => {
    shell.classList.remove('is-hidden-by-scroll');
    toolbar.classList.remove('is-hidden-by-scroll');
    toolbar.style.setProperty('--episode-toolbar-opacity', '1');
  };

  const hideToolbar = () => {
    if (isAtStaticPosition() || isEngaged()) return;
    shell.classList.add('is-hidden-by-scroll');
    toolbar.classList.remove('is-hidden-by-scroll');
  };

  const scheduleIdleHide = () => {
    clearIdleHideTimer();
    if (isAtStaticPosition() || isEngaged()) return;
    idleHideTimer = window.setTimeout(() => {
      hideToolbar();
    }, idleHideDelay);
  };

  const syncVisibility = () => {
    const currentScrollY = window.scrollY;
    const delta = currentScrollY - lastScrollY;
    const hideThreshold = isMobileViewport() ? 64 : 84;
    const revealThreshold = isMobileViewport() ? 42 : 56;
    const intent = Math.abs(delta) < 1 ? 0 : (delta > 0 ? 1 : -1);

    if (intent === 0) {
      accumulatedScroll = 0;
    } else if (intent === lastScrollIntent) {
      accumulatedScroll += Math.abs(delta);
    } else {
      accumulatedScroll = Math.abs(delta);
      lastScrollIntent = intent;
    }

    if (isAtStaticPosition()) {
      showToolbar();
      clearIdleHideTimer();
      accumulatedScroll = 0;
    } else if (intent > 0 && accumulatedScroll > hideThreshold && !isEngaged()) {
      hideToolbar();
      clearIdleHideTimer();
      accumulatedScroll = 0;
    } else if (intent < 0 && accumulatedScroll > revealThreshold) {
      showToolbar();
      scheduleIdleHide();
      accumulatedScroll = 0;
    } else if (!shell.classList.contains('is-hidden-by-scroll')) {
      scheduleIdleHide();
    }

    lastScrollY = currentScrollY;
  };

  const engageToolbar = () => {
    clearIdleHideTimer();
    showToolbar();
    toolbar.classList.add('is-engaged');
    toolbar.style.setProperty('--episode-toolbar-opacity', '1');
  };

  const releaseToolbar = () => {
    toolbar.classList.remove('is-engaged');
    toolbar.style.setProperty('--episode-toolbar-opacity', '1');
    scheduleIdleHide();
  };

  toolbar.classList.remove('is-floating', 'is-hidden-by-scroll', 'is-ghost');
  shell.classList.remove('is-hidden-by-scroll');
  toolbar.style.setProperty('--episode-toolbar-opacity', '1');
  toolbar.style.removeProperty('position');
  toolbar.style.removeProperty('top');
  toolbar.style.removeProperty('left');
  toolbar.style.removeProperty('width');
  toolbar.style.removeProperty('--episode-toolbar-left');
  toolbar.style.removeProperty('--episode-toolbar-width');

  toolbar.addEventListener('pointerdown', engageToolbar, { signal });
  toolbar.addEventListener('focusin', engageToolbar, { signal });
  document.addEventListener('click', (event) => {
    if (toolbar.contains(event.target)) return;
    if (toolbar.matches(':focus-within')) return;
    releaseToolbar();
  }, { signal });

  window.addEventListener('scroll', () => {
    syncVisibility();
  }, { passive: true, signal });
  window.addEventListener('resize', () => {
    showToolbar();
    measureAnchor();
    lastScrollY = window.scrollY;
    accumulatedScroll = 0;
    lastScrollIntent = 0;
    syncVisibility();
  }, { passive: true, signal });

  measureAnchor();
  syncVisibility();
}

function setupHomeSearchToolbarBehavior(toolbar) {
  const useFloatOnlyMobileSearch = toolbar.classList.contains('home-search-toolbar-float-only');
  setupStickyToolbarBehavior(toolbar, {
    abortController: homeSearchToolbarController,
    opacityVariable: '--home-search-toolbar-opacity',
    minimumHideY: useFloatOnlyMobileSearch ? 0 : (isMobileViewport() ? 34 : 68),
    anchorBoundarySelector: useFloatOnlyMobileSearch ? '' : '.home-search-section',
    revealAfterSelector: useFloatOnlyMobileSearch ? '.home-search-section' : '',
    revealOffset: useFloatOnlyMobileSearch ? 72 : 0,
    fixedOverlay: useFloatOnlyMobileSearch,
    keepVisibleWhenPinned: true,
    assignController(controller) {
      homeSearchToolbarController = controller;
    }
  });
}

function linkedChipList(type, items = [], collection = []) {
  if (!items.length) return '';
  const rendered = renderLinkedChipItems(type, items, collection);
  if (!rendered) return '';
  return `
    <div class="chip-row">
      ${rendered}
    </div>
  `;
}

function findKeywordByReference(value) {
  const normalized = normalizeValue(value);
  return (site?.keywords || []).find((item) => {
    const aliases = item.aliases || [];
    return (
      normalizeValue(item.id) === normalized ||
      normalizeValue(item.name) === normalized ||
      aliases.some((alias) => normalizeValue(alias) === normalized)
    );
  }) || null;
}

function findPersonByReference(value) {
  const normalized = normalizeValue(value);
  return (site?.people || []).find((item) => {
    const aliases = item.aliases || [];
    return (
      normalizeValue(item.id) === normalized ||
      normalizeValue(item.name) === normalized ||
      aliases.some((alias) => normalizeValue(alias) === normalized)
    );
  }) || null;
}

function renderLinkedChipItems(type, items = [], collection = []) {
  return items.map((item) => {
    const found = collection.find((entry) => {
      const aliases = entry.aliases || [];
      return (
        normalizeValue(entry.id) === normalizeValue(item) ||
        normalizeValue(entry.name) === normalizeValue(item) ||
        aliases.some((alias) => normalizeValue(alias) === normalizeValue(item))
      );
    });
    if (!found) return '';
    const targetType = type === 'people' ? 'keywords' : type;
    const target = type === 'people'
      ? findKeywordByReference(found.id) || findKeywordByReference(found.name)
      : found;
    if (!target) {
      return '';
    }
    return `<a class="chip" href="${routeTo(`${targetType}/${target.id}`)}">${escapeHtml(found.name || found.title || found.id)}</a>`;
  }).filter(Boolean).join('');
}

function renderVideoLinkIcon(link) {
  const platform = normalizeValue(link?.platform);
  const url = String(link?.url || '').trim();
  const isMemberOnly = normalizeValue(link?.access) === 'member' || link?.memberOnly === true;
  const isUnavailable = normalizeValue(link?.status) === 'unavailable' || !url;
  const unavailableText = String(link?.note || '已下架').trim();

  const platforms = {
    bilibili: {
      label: isMemberOnly ? 'Bilibili 会员' : 'Bilibili',
      className: 'bilibili',
      content: `<span class="media-chip-text media-chip-text-bilibili">bilibili</span>`
    },
    youtube: {
      label: 'YouTube',
      className: 'youtube',
      content: `
        <span class="media-chip-youtube-play" aria-hidden="true">
          <svg viewBox="0 0 24 24" class="media-chip-youtube-icon">
            <path d="M9 7.8L16.2 12L9 16.2Z"></path>
          </svg>
        </span>
        <span class="media-chip-text media-chip-text-youtube">YouTube</span>
      `
    }
  };

  const config = platforms[platform];
  if (!config) return '';

  if (isUnavailable) {
    return `
      <span class="media-chip ${config.className} unavailable" title="${escapeHtml(unavailableText)}" aria-label="${escapeHtml(unavailableText)}">
        ${config.content}
        <span class="media-chip-unavailable-text">${escapeHtml(unavailableText)}</span>
      </span>
    `;
  }

  return `
    <a class="media-chip ${config.className}${isMemberOnly ? ' member-only' : ''}" href="${escapeHtml(url)}" target="_blank" rel="noreferrer" aria-label="${config.label}" title="${config.label}">
      ${config.content}
      ${isMemberOnly ? `
        <span class="media-chip-badge" aria-hidden="true">会员</span>
      ` : ''}
    </a>
  `;
}

function renderEpisodeHeaderMeta(episode) {
  const videoLinks = Array.isArray(episode.videoLinks) ? episode.videoLinks : [];
  const tags = episode.tags || [];
  if (!videoLinks.length && !tags.length) return '';

  return `
    ${tags.length ? `
      <div class="chip-row episode-header-meta">
        ${renderLinkedChipItems('keywords', tags, site.keywords)}
      </div>
    ` : ''}
    ${videoLinks.length ? `
      <div class="chip-row episode-video-links">
        ${videoLinks.map((link) => renderVideoLinkIcon(link)).join('')}
      </div>
    ` : ''}
  `;
}

function accordionItem(title, content, open = false, extraAttrs = '') {
  return `
    <details class="accordion-item"${open ? ' open' : ''}${extraAttrs ? ` ${extraAttrs}` : ''}>
      <summary class="accordion-summary">${escapeHtml(title)}</summary>
      <div class="accordion-content">${content}</div>
    </details>
  `;
}

function renderKeywordList(keywords = []) {
  if (!keywords.length) {
    return '<div class="empty-state">当前没有可显示的关键词。</div>';
  }

  return `
    <div class="list">
      ${keywords.map((keyword) => `
        <article class="list-item keyword-list-item" data-list-item-href="${routeTo(`keywords/${keyword.id}`)}">
          <div class="keyword-item-head">
            <a class="card-primary-link" href="${routeTo(`keywords/${keyword.id}`)}">
              <h3>${escapeHtml(keyword.name)}</h3>
            </a>
            <span class="keyword-count-badge">${keywordCount(keyword)} 期</span>
          </div>
          <p>${escapeHtml(keyword.summary)}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function renderNodeList(items = [], type, descriptionKey = 'summary', routeType = type) {
  if (!items.length) {
    return '<div class="empty-state">当前没有可显示的条目。</div>';
  }

  return `
    <div class="list">
      ${items.map((item) => `
        <article class="list-item" data-list-item-href="${routeTo(`${routeType}/${item.id}`)}">
          <div class="keyword-item-head">
            <a class="card-primary-link" href="${routeTo(`${routeType}/${item.id}`)}">
              <h3>${escapeHtml(item.name || item.title || item.id)}</h3>
            </a>
            <span class="keyword-count-badge">${referenceCount(item)} 次引用</span>
          </div>
          <p>${escapeHtml(item[descriptionKey] || item.summary || item.definition || item.description || '')}</p>
        </article>
      `).join('')}
    </div>
  `;
}

function chunkItems(items = [], size = 6) {
  const chunks = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
}

function renderChunkedSection(title, items, type, descriptionKey = 'summary', open = false) {
  if (!items.length) return '';

  const chunks = chunkItems(items, 6);
  return `
    <details class="accordion-item keyword-group"${open ? ' open' : ''}>
      <summary class="accordion-summary">
        <span>${escapeHtml(title)}</span>
        <span class="keyword-group-count">${items.length}</span>
      </summary>
      <div class="accordion-content">
        ${chunks.map((chunk, chunkIndex) => `
          <details class="accordion-item nested-accordion"${chunkIndex === 0 ? ' open' : ''}>
            <summary class="accordion-summary">
              <span>${escapeHtml(`${title} ${chunkIndex * 6 + 1}-${chunkIndex * 6 + chunk.length}`)}</span>
              <span class="keyword-group-count">${chunk.length}</span>
            </summary>
            <div class="accordion-content">
              ${renderNodeList(chunk, type, descriptionKey)}
            </div>
          </details>
        `).join('')}
      </div>
    </details>
  `;
}

function renderReferenceIndex(config) {
  const {
    type,
    title,
    eyebrow,
    summary,
    collection,
    queryValue,
    setQuery,
    placeholder,
    descriptionKey = 'summary'
  } = config;

  const sortedItems = [...collection].sort((a, b) => referenceCount(b) - referenceCount(a) || (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN'));
  const query = queryValue.trim().toLowerCase();
  const matches = query
    ? sortedItems.filter((item) => {
        const haystack = [
          item.name || '',
          item.summary || '',
          item.description || '',
          item.definition || '',
          item.application || ''
        ].join(' ').toLowerCase();
        return haystack.includes(query);
      })
    : [];

  const highItems = sortedItems.filter((item) => referenceCount(item) >= 4);
  const midItems = sortedItems.filter((item) => referenceCount(item) >= 2 && referenceCount(item) <= 3);
  const lowItems = sortedItems.filter((item) => referenceCount(item) === 1);

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">${escapeHtml(eyebrow)}</p>
        <h1 class="detail-title">${escapeHtml(title)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(summary)}</p>
      </div>
      <section class="detail-section">
        <div class="keyword-toolbar">
          <div class="search-box keyword-search-box">
            <input id="${type}-index-search" type="text" placeholder="${escapeHtml(placeholder)}">
          </div>
          <div class="keyword-stats">
            <span class="chip">总数 ${sortedItems.length}</span>
            <span class="chip">按引用率排序</span>
            <span class="chip">每层最多 6 个</span>
          </div>
        </div>
        ${query ? `
          <div class="keyword-search-results">
            <p class="detail-copy">当前显示与 “${escapeHtml(queryValue)}” 匹配的条目。</p>
            ${matches.length ? renderNodeList(matches, type, descriptionKey) : '<div class="empty-state">没有匹配到相关条目。</div>'}
          </div>
        ` : `
          ${renderChunkedSection('高频节点（4 次及以上）', highItems, type, descriptionKey, true)}
          ${renderChunkedSection('中频节点（2-3 次）', midItems, type, descriptionKey)}
          ${renderChunkedSection('长尾节点（1 次）', lowItems, type, descriptionKey)}
        `}
      </section>
    </section>
  `;

  const searchInput = document.getElementById(`${type}-index-search`);
  if (searchInput) {
    searchInput.value = queryValue;
    searchInput.addEventListener('input', (event) => {
      setQuery(event.target.value);
      renderRoute();
    });
  }
}

function classifyReferenceItem(type, item) {
  const text = [
    item.name || '',
    item.summary || '',
    item.description || '',
    item.definition || '',
    item.application || ''
  ].join(' ');

  const generalRules = [
    { name: '地产金融', pattern: /房|地产|楼市|房价|地价|债|财政|资产|资本|金融|税|票据|信托|断供|清算|银行/ },
    { name: '科技产业', pattern: /AI|人工智能|新能源|电车|电池|汽车|芯片|科技|研发|制造|平台|算法|模型|创新/ },
    { name: '国际地缘', pattern: /美国|日本|新加坡|伊朗|俄罗斯|欧洲|东亚|东南亚|中东|台海|南海|制裁|战争|外交|地缘|小国|海峡|航线/ },
    { name: '教育文化', pattern: /教育|学校|考试|大学|学术|历史|文化|文明|语言|电影|文艺|选美|模因|春晚/ },
    { name: '社会组织', pattern: /品牌|顾问|组织|创始人|治理|平台劳动|中产|家庭|代际|权威|秩序|信任|婚姻|社交|人物/ }
  ];

  const peopleRules = [
    { name: '国家领导人', pattern: /总理|总统|领导人|首相|国家|外交|执政|政权/ },
    { name: '地缘政治人物', pattern: /地缘|战争|东亚|欧洲|中东|新加坡|日本|美国|俄罗斯|伊朗|台海|海峡/ },
    { name: '企业家与资本人物', pattern: /创始人|企业|商业|资本|地产|房企|品牌|投资|平台|白酒|董事长/ },
    { name: '科技产业人物', pattern: /AI|汽车|电池|新能源|技术|科研|工程师|科技|制造/ },
    { name: '教育学术人物', pattern: /教育|大学|教授|院士|学术|老师/ },
    { name: '媒体文化人物', pattern: /演员|主播|博主|作家|选美|电影|文化|历史|网红/ }
  ];

  const peopleCategoryOverrides = {
    'donald-trump': '国家领导人',
    'vladimir-putin': '国家领导人',
    'lawrence-wong': '国家领导人',
    'lee-hsien-loong': '国家领导人',
    'lee-kuan-yew': '国家领导人',
    'ali-khamenei': '国家领导人',
    'mujtaba-khamenei': '国家领导人',
    'to-lam': '国家领导人',
    'ho-chi-minh': '国家领导人',
    'le-duan': '国家领导人',
    'sanae-takaichi': '国家领导人',
    'vivian-balakrishnan': '地缘政治人物',
    'mahsa-amini': '地缘政治人物',
    'zhang-xuefeng': '媒体文化人物',
    'hu-chenfeng': '媒体文化人物',
    'elon-musk': '科技产业人物'
  };

  const modelRules = [
    { name: '风险与杠杆', pattern: /风险|杠杆|清算|退出|资产负债表|分配|转移|危机|筛选|崩塌/ },
    { name: '组织与治理', pattern: /治理|反馈|权威|委托|代理|守门|组织|继承|制度形式主义|平台可读性/ },
    { name: '市场与资本', pattern: /市场|价格|资本|价值捕获|飞轮|资产化|叙事杠杆|时间套利|财富/ },
    { name: '技术与创新', pattern: /技术|创新|路径|样机|量产|分布式|新能源|AI|模型|科技/ },
    { name: '国际与地缘', pattern: /区域拒止|小国|海峡|秩序|围堵|国际|地缘|规则|战争|国家信用/ },
    { name: '人成长与社会', pattern: /创伤|个体化|梦想|人机|学习|教育|边界|共振|善意/ }
  ];

  const keywordRules = [
    { name: '国家与地缘', pattern: /美国|日本|新加坡|伊朗|俄罗斯|欧洲|东亚|东南亚|中东|台海|南海|制裁|战争|外交|地缘|小国|海峡|航线|门罗/ },
    { name: '房地产与金融', pattern: /房|地产|楼市|房价|地价|债|财政|资产|资本|金融|税|票据|信托|断供|清算|银行|养老金|保险|美元|黄金/ },
    { name: '科技与产业', pattern: /AI|人工智能|新能源|电车|电池|汽车|芯片|科技|研发|制造|算法|模型|创新|机器人|算力|云|电商/ },
    { name: '品牌与公司', pattern: /品牌|公司|企业|顾问|创始人|平台|连锁|商业|产品|供应链|营销|带货|主播|零售/ },
    { name: '教育与学术', pattern: /教育|学校|考试|大学|学术|教授|院士|课堂|学生|举报|课程/ },
    { name: '文化与媒体', pattern: /文化|文明|语言|电影|文艺|选美|模因|春晚|体育|超级碗|流量|影视|历史叙事/ },
    { name: '家庭与社会', pattern: /家庭|婚恋|代际|亲密关系|中产|断亲|审美|养老|孩子|故乡|社交|体面|尊严/ },
    { name: '制度与治理', pattern: /治理|秩序|规则|权威|共同体|组织|信任|协商|制度|合法性|平台治理|官僚/ }
  ];

  const personOverrideKey = item.sourcePersonId || item.id;
  if (type === 'people' && peopleCategoryOverrides[personOverrideKey]) {
    return peopleCategoryOverrides[personOverrideKey];
  }

  if (type === 'keywords' && isPersonKeyword(item)) {
    return '人物';
  }

  const rules = type === 'people'
    ? peopleRules
    : type === 'models'
      ? modelRules
      : type === 'keywords'
        ? keywordRules
        : generalRules;
  const matched = rules.find((rule) => rule.pattern.test(text));
  return matched ? matched.name : '其他';
}

function renderCategorizedReferenceSection(title, items, type, descriptionKey = 'summary', open = false, routeType = type) {
  if (!items.length) return '';

  const topItems = items.slice(0, 3);
  const remainingItems = items.slice(3);

  return `
    <details class="accordion-item keyword-group" data-progress-section="true" data-progress-label="${escapeHtml(title)}"${open ? ' open' : ''}>
      <summary class="accordion-summary">
        <span>${escapeHtml(title)}</span>
        <span class="keyword-group-count">${items.length}</span>
      </summary>
      <div class="accordion-content">
        ${renderNodeList(topItems, type, descriptionKey, routeType)}
        ${remainingItems.length ? `
          <details class="accordion-item nested-accordion">
            <summary class="accordion-summary">
              <span>更多</span>
              <span class="keyword-group-count">${remainingItems.length}</span>
            </summary>
            <div class="accordion-content">
              ${renderNodeList(remainingItems, type, descriptionKey, routeType)}
            </div>
          </details>
        ` : ''}
      </div>
    </details>
  `;
}

function handleListItemNavigationClick(event) {
  const item = event.target.closest('.list-item[data-list-item-href]');
  if (!(item instanceof HTMLElement) || !app.contains(item)) return;
  if (event.target.closest('a, button, input, textarea, select, summary, label')) return;
  const href = item.getAttribute('data-list-item-href');
  if (!href) return;
  event.preventDefault();
  saveCurrentRouteViewState();
  window.location.hash = href;
}

function handleInlineKnowledgeNavigationState(event) {
  const link = event.target.closest('.inline-knowledge-link, .inline-episode-link, a.chip, .card-primary-link');
  if (!(link instanceof HTMLAnchorElement) || !app.contains(link)) return;
  const href = link.getAttribute('href') || '';
  if (!href.startsWith('#/')) return;
  saveCurrentRouteViewState();
}

function renderCategorizedReferenceIndex(config) {
  const {
    type,
    title,
    eyebrow,
    summary,
    collection,
    descriptionKey = 'summary',
    minimumReferences = 2,
    routeType = type
  } = config;

  const sortedItems = [...collection]
    .filter((item) => referenceCount(item) >= minimumReferences)
    .sort((a, b) => referenceCount(b) - referenceCount(a) || (a.name || '').localeCompare(b.name || '', 'zh-Hans-CN'));

  const categoryOrder = [
    '地产金融',
    '科技产业',
    '国际地缘',
    '教育文化',
    '社会组织',
    '国家领导人',
    '地缘政治人物',
    '企业家与资本人物',
    '科技产业人物',
    '教育学术人物',
    '媒体文化人物',
    '其他'
  ];
  const grouped = new Map(categoryOrder.map((name) => [name, []]));

  for (const item of sortedItems) {
    const category = classifyReferenceItem(type, item);
    if (!grouped.has(category)) grouped.set(category, []);
    grouped.get(category).push(item);
  }

  const sections = [...grouped.entries()]
    .filter(([, items]) => items.length)
    .sort((a, b) => {
      const aMax = Math.max(...a[1].map((item) => referenceCount(item)));
      const bMax = Math.max(...b[1].map((item) => referenceCount(item)));
      if (bMax !== aMax) return bMax - aMax;
      if (b[1].length !== a[1].length) return b[1].length - a[1].length;
      return a[0].localeCompare(b[0], 'zh-Hans-CN');
    })
    .map(([category, items]) => renderCategorizedReferenceSection(category, items, type, descriptionKey, false, routeType))
    .join('');

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">${escapeHtml(eyebrow)}</p>
        <h1 class="detail-title">${escapeHtml(title)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(summary)}</p>
      </div>
      <section class="detail-section">
        ${sections || '<div class="empty-state">当前没有满足条件的条目。</div>'}
      </section>
    </section>
  `;

}

const KEYWORD_INDEX_LEAF_LIMIT = 8;

function renderKeywordTopGroup(title, kindEntries, options = {}) {
  const { open = false, selectedKind = '' } = options;
  const totalCount = kindEntries.reduce((sum, [, items]) => sum + items.length, 0);

  return `
    <details class="accordion-item keyword-group keyword-top-group" data-progress-section="true" data-progress-label="${escapeHtml(title)}"${open ? ' open' : ''}>
      <summary class="accordion-summary">
        <span>${escapeHtml(title)}</span>
        <span class="keyword-group-count">${totalCount}</span>
      </summary>
      <div class="accordion-content">
        <div class="keyword-kind-list">
          ${kindEntries.map(([kind, keywords]) => renderKeywordGroup(keywordKindConfig(kind).badge, keywords, {
            kind,
            open: selectedKind ? kind === selectedKind : false
          })).join('')}
        </div>
      </div>
    </details>
  `;
}

function renderKeywordGroup(title, keywords, options = {}) {
  const { note = '', open = false, kind = '' } = options;
  if (!keywords.length) return '';
  const subgroupEntries = groupKeywordsForIndex(kind, keywords);

  return `
    <details class="accordion-item nested-accordion keyword-kind-group" data-progress-section="true" data-progress-label="${escapeHtml(title)}"${kind ? ` data-keyword-kind-group="${escapeHtml(kind)}"` : ''}${open ? ' open' : ''}>
      <summary class="accordion-summary">
        <span>${escapeHtml(title)}</span>
        <span class="keyword-group-count">${keywords.length}</span>
      </summary>
      <div class="accordion-content">
        ${note ? `<p class="detail-copy">${renderLinkedEpisodeText(note)}</p>` : ''}
        <div class="keyword-subgroup-list">
          ${subgroupEntries.map(([subgroupTitle, subgroupKeywords]) => renderKeywordSubgroup(subgroupTitle, subgroupKeywords, kind)).join('')}
        </div>
      </div>
    </details>
  `;
}

function renderKeywordSubgroup(title, keywords = [], kind = '') {
  const shouldSplit = keywords.length > KEYWORD_INDEX_LEAF_LIMIT;

  return `
    <details class="accordion-item nested-accordion keyword-subgroup" data-progress-section="true" data-progress-label="${escapeHtml(title)}">
      <summary class="accordion-summary">
        <span>${escapeHtml(title)}</span>
        <span class="keyword-group-count">${keywords.length}</span>
      </summary>
      <div class="accordion-content">
        ${shouldSplit ? `
          <div class="keyword-leaf-list">
            ${splitKeywordLeafGroups(title, keywords, kind).map(([leafTitle, leafKeywords]) => `
              <details class="accordion-item nested-accordion keyword-leaf-group" data-progress-section="true" data-progress-label="${escapeHtml(leafTitle)}">
                <summary class="accordion-summary">
                  <span>${escapeHtml(leafTitle)}</span>
                  <span class="keyword-group-count">${leafKeywords.length}</span>
                </summary>
                <div class="accordion-content">
                  ${renderKeywordList(leafKeywords)}
                </div>
              </details>
            `).join('')}
          </div>
        ` : renderKeywordList(keywords)}
      </div>
    </details>
  `;
}

function splitKeywordLeafGroups(parentTitle, keywords = [], kind = '') {
  if (keywords.length <= KEYWORD_INDEX_LEAF_LIMIT) return [['全部', keywords]];

  const rules = keywordLeafGroupRules(parentTitle, kind);
  const fallbackTitle = keywordLeafFallbackTitle(parentTitle, kind);
  const grouped = new Map([...rules.map((rule) => rule.name), fallbackTitle].map((name) => [name, []]));

  for (const keyword of keywords) {
    const text = keywordIndexText(keyword);
    const matched = rules.find((rule) => keywordIndexRuleMatches(rule, keyword, text));
    grouped.get(matched?.name || fallbackTitle).push(keyword);
  }

  return [...grouped.entries()]
    .filter(([, items]) => items.length)
    .flatMap(([title, items]) => splitOversizedKeywordLeafGroup(title, items, kind));
}

function splitOversizedKeywordLeafGroup(title, keywords = [], kind = '') {
  if (keywords.length <= KEYWORD_INDEX_LEAF_LIMIT) return [[title, keywords]];

  const refinements = keywordLeafRefinementRules(title, kind);
  if (refinements.length) {
    const fallbackTitle = `${title}其他`;
    const grouped = new Map([...refinements.map((rule) => rule.name), fallbackTitle].map((name) => [name, []]));
    for (const keyword of keywords) {
      const text = keywordIndexText(keyword);
      const matched = refinements.find((rule) => keywordIndexRuleMatches(rule, keyword, text));
      grouped.get(matched?.name || fallbackTitle).push(keyword);
    }
    const refined = [...grouped.entries()].filter(([, items]) => items.length);
    if (refined.length > 1) {
      return refined.flatMap(([refinedTitle, items]) => splitOversizedKeywordLeafGroup(refinedTitle, items, kind));
    }
  }

  return [[title, keywords]];
}

function keywordIndexText(keyword) {
  return [
    keyword?.name || '',
    keyword?.summary || '',
    keyword?.description || '',
    ...(keyword?.aliases || []),
    ...(keyword?.episodes || []).map((episode) => episode?.note || '')
  ].join(' ');
}

function keywordIndexNameText(keyword) {
  return [
    keyword?.name || '',
    ...(keyword?.aliases || [])
  ].join(' ');
}

function keywordIndexRuleMatches(rule, keyword, text = keywordIndexText(keyword)) {
  const target = rule.scope === 'name' ? keywordIndexNameText(keyword) : text;
  return rule.pattern.test(target);
}

function keywordLeafFallbackTitle(parentTitle, kind = '') {
  const fallbacks = {
    person: '其他人物',
    geography: '其他地理节点',
    organization: '其他组织节点',
    product: '其他产品技术',
    asset: '其他资产',
    event: '其他事件',
    mechanism: '其他机制',
    concept: '其他概念',
    theme: '其他主题',
    general: '其他入口'
  };
  return fallbacks[kind] || `${parentTitle}其他`;
}

function keywordLeafGroupRules(parentTitle, kind = '') {
  const byParent = {
    国家机构与公共部门: [
      { name: '地方政府与财政', pattern: /地方|财政|城投|债|转移支付|土地|税|公共成本/ },
      { name: '国资与公共平台', pattern: /国资|国企|国有|平台|地铁|轨道|公共资产|托底/ },
      { name: '监管司法与规则', pattern: /监管|法院|司法|法律|规则|处罚|审计|问责|合规/ },
      { name: '公共服务现场', pattern: /学校|医院|午餐|教育|医疗|公共服务|民生|养老/ }
    ],
    金融杠杆与资产机制: [
      { name: '债务融资', pattern: /债|融资|城投|贷款|利息|偿付|债券|隐性债务|地方债/ },
      { name: '地产土地', pattern: /房|地产|土地|地价|楼市|住房|按揭|首付/ },
      { name: '保险信托', pattern: /保险|信托|保单|承保|赔付|家族信托/ },
      { name: '价格交易', pattern: /价格|股|散户|交易|市场|惩戒|点差|K线|投机/ },
      { name: '报表利润', pattern: /报表|利润|业绩|会计|开票|发票|确认|大洗澡|蓄水池/ },
      { name: '库存渠道', pattern: /库存|经销|渠道|压货|销量|零公里|回款|白条/ },
      { name: '货币结算', pattern: /美元|货币|结算|石油美元|信用|储备|比特币/ },
      { name: '清算退出', pattern: /清算|退出|破产|断供|出清|风险转移|损失/ }
    ],
    产业生产与渠道机制: [
      { name: '汽车销量渠道', pattern: /汽车|电车|销量|经销|零公里|4S|渠道|库存/ },
      { name: '研发量产验证', pattern: /研发|量产|样机|测试|验证|安全|设计|技术路线/ },
      { name: '供应链制造', pattern: /供应链|制造|生产|工厂|代工|芯片|电池|产业链/ },
      { name: '补贴与地方招商', pattern: /补贴|地方|招商|产业基金|政府|园区|项目/ },
      { name: '回收污染与外部成本', pattern: /回收|污染|外部成本|环保|废料|转移/ }
    ],
    制度财政与公共概念: [
      { name: '国资与公有资产', pattern: /国资|国有|国企|公共资产|国有资产流失|国家出资/ },
      { name: '地方财政与债务', pattern: /地方|财政|债务|城投|转移支付|土地财政|隐性债务/ },
      { name: '税费与公共成本', pattern: /税|税负|费用|罚款|收费|公共成本|民生/ },
      { name: '体制身份与稳定', pattern: /体制|编制|身份|稳定|泛体制|公务员|中产/ },
      { name: '法律监管与合法性', pattern: /法律|监管|合法性|规则|国际法|问责|权威/ },
      { name: '公共服务与教育', pattern: /公共|学校|教育|学生|午餐|大学|课堂|课程/ }
    ],
    资产金融与交易概念: [
      { name: '散户交易', pattern: /散户|交易|平台|K线|追涨|点差|投机/ },
      { name: '价格信用', pattern: /价格|信用|信仰|预期|估值|市场|繁荣/ },
      { name: '资产负债', pattern: /资产|负债|房|地价|抵押|财富|家庭资产/ },
      { name: '货币美元', pattern: /美元|货币|结算|石油美元|储备|黄金|白银/ },
      { name: '报表利润', pattern: /报表|利润|业绩|开票|财务|数字|粉饰/ }
    ],
    海峡港口与航线: [
      { name: '关键海峡', pattern: /海峡|马六甲|霍尔木兹|台海|南海|咽喉/ },
      { name: '港口中转', pattern: /港口|富查伊拉|港\b|中转|转运|补给/ },
      { name: '航运保险', pattern: /航线|航运|保险|护航|运费|通行|船|舰队/ },
      { name: '岛链海域', pattern: /岛链|海域|东亚|第一岛链|区域拒止/ }
    ],
    国际秩序与大国博弈: [
      { name: '大国竞争', pattern: /大国|美国|中国|俄罗斯|欧洲|竞争|博弈/ },
      { name: '小国生存', pattern: /小国|新加坡|阿联酋|中立|主权|规则/ },
      { name: '战争制裁', pattern: /战争|制裁|安全|围堵|区域拒止|冲突/ },
      { name: '通道秩序', pattern: /海峡|航线|能源|石油|港口|通道|秩序/ }
    ],
    企业家与资本人物: [
      { name: '地产企业家', pattern: /地产|房企|万科|万达|许家印|王石|潘石屹|宝能/ },
      { name: '消费品牌人物', pattern: /西贝|娃哈哈|白酒|餐饮|品牌|宗|贾国龙|罗永浩/ },
      { name: '科技创业者', pattern: /科技|AI|汽车|小米|雷军|马斯克|李斌|王传福/ },
      { name: '资本与投资人物', pattern: /资本|投资|股权|接班|董事长|控制权/ }
    ],
    汽车与交通产品: [
      { name: '整车产品', pattern: /汽车|小米汽车|新能源汽车|电车|出租车|无人车/ },
      { name: '补能电池', pattern: /电池|换电|充电|锂电|电源|充电宝/ },
      { name: '智能安全部件', pattern: /智驾|电控门|云端|安全|传感器|算法/ }
    ],
    教育文化与认知概念: [
      { name: '教育课堂', pattern: /教育|学校|大学|课堂|课程|考试|学生|学术/ },
      { name: '文化审美', pattern: /文化|审美|文明|艺术|电影|选美|历史/ },
      { name: '认知权威', pattern: /认知|权威|自由|语言|判断|标准答案|人格/ }
    ],
    平台治理与组织机制: [
      { name: '平台流量', pattern: /平台|流量|算法|推荐|内容|直播|短剧|分发/ },
      { name: '监管可读性', pattern: /治理|监管|网格|数据|可读|控制|规则|审查/ },
      { name: '组织反馈', pattern: /组织|反馈|权威|沉默|代理|创始人|管理/ }
    ],
    地方政府与财政: [
      { name: '地方财政债务', pattern: /地方债|隐性债|财政|城投|债务|偿付|土地财政|转移支付/ },
      { name: '国资平台托底', pattern: /国资|国企|国有|地铁|轨道|万科|房企|托底|平台|公共资产/ },
      { name: '产业补贴招商', pattern: /补贴|招商|产业|项目|园区|新能源|汽车|哪吒|基金|投资/ },
      { name: '税费公共支出', pattern: /税|税负|收费|罚款|公共服务|午餐|养老|民生|支出/ },
      { name: '地方金融通道', pattern: /金交所|金融|票据|信托|银行|融资|贷款|交易所/ }
    ],
    地方财政债务: [
      { name: '政府城投平台', pattern: /地方政府|金交所|深圳地铁|城投公司|地方国资|浙金中心/, scope: 'name' },
      { name: '房企债务主体', pattern: /万科|恒大|均和集团/, scope: 'name' },
      { name: '新能源融资主体', pattern: /哪吒汽车|蔚来/, scope: 'name' }
    ],
    金融资产: [
      { name: '地方债务资金', pattern: /地方债|隐性债|隐形债务|地方资金|土地财政|补贴杠杆|地方财政补贴负面清单|体外平台/, scope: 'name' },
      { name: '地产交易压力', pattern: /买房|断供|法拍房|零首付|七年贷款/, scope: 'name' },
      { name: '清算退出', pattern: /清算|清盘|破产|硬着陆|崩塌/, scope: 'name' },
      { name: '房企财务工具', pattern: /房企假盈利|国资接盘|资产包|证券化/, scope: 'name' },
      { name: '汽车渠道库存', pattern: /零公里二手车|售后|维修|虚假销售/, scope: 'name' },
      { name: '补贴产能项目', pattern: /补贴|国资造车|过剩产能|产业基金|产业园骗局|海外出口|虚假贸易/, scope: 'name' },
      { name: '价格交易机制', pattern: /价格发现|价格战|对赌|良币劣币|收费站/, scope: 'name' },
      { name: '风险现金流', pattern: /杠杆|安全冗余|系统性风险|现金流|身份背书|中产转换/, scope: 'name' },
      { name: '航运制裁金融', pattern: /航运|国家制裁/, scope: 'name' }
    ],
    关键海峡: [
      { name: '海峡与港口', pattern: /马六甲海峡|霍尔木兹海峡|台海|洋浦港/, scope: 'name' },
      { name: '沿岸与中转国家', pattern: /新加坡|伊朗|阿联酋|马来西亚|沙特|越南|印尼/, scope: 'name' },
      { name: '大国与岛链', pattern: /美国|东亚|日本|第一岛链|格陵兰/, scope: 'name' },
      { name: '地缘参照节点', pattern: /荆州|瑞士/, scope: 'name' }
    ],
    制度公共: [
      { name: '公共财政', pattern: /财政|税|债务|转移支付|公共成本|地方|政府|收费/ },
      { name: '国资制度', pattern: /国资|国有|国企|公有|国家|资产|公共资产/ },
      { name: '法律规则', pattern: /法律|国际法|规则|监管|合法性|边界|主权|权威/ },
      { name: '公共服务', pattern: /公共服务|教育|学校|午餐|养老|医疗|民生|学生/ },
      { name: '身份秩序', pattern: /体制|编制|身份|稳定|中产|权威|大政府/ }
    ],
    国资与公有资产: [
      { name: '国资债务清偿', pattern: /隐性债务|国有资产|清偿率|现金就是权力/, scope: 'name' },
      { name: '创业继承资本', pattern: /资本逻辑|草根创业|二代企业|继承人/, scope: 'name' },
      { name: '技术市场预期', pattern: /烂尾车|散户|预期|技术泡沫/, scope: 'name' },
      { name: '体制中产身份', pattern: /泛体制中产|体制身份/, scope: 'name' }
    ],
    保险信托: [
      { name: '风险与制裁', pattern: /区域拒止|灰色贸易|影子舰队|制裁|灰色石油/, scope: 'name' },
      { name: '保险信托财富', pattern: /保险|家族信托|家族治理|财富保全|离岸架构/, scope: 'name' },
      { name: '产业回收风险', pattern: /电池回收/, scope: 'name' }
    ],
    价格交易: [
      { name: '流量平台交易', pattern: /抖音流量|跨境电商|流量霸权|流量治理|直播带货/, scope: 'name' },
      { name: '价格品牌信号', pattern: /激励反转|分红|价格信号|品牌失速|白酒金融化|品牌神话|造神/, scope: 'name' },
      { name: '投资持股博弈', pattern: /志愿填报|创投|国有资产流失|时间价值|投机情绪|员工持股|资本博弈/, scope: 'name' }
    ],
    价格交易信号: [
      { name: '流量直播交易', pattern: /抖音流量|跨境电商|流量霸权|流量治理|直播带货/, scope: 'name' },
      { name: '品牌资本信号', pattern: /分红|价格信号|品牌失速|品牌神话|造神/, scope: 'name' },
      { name: '投资持股选择', pattern: /志愿填报|创投|国有资产流失|时间价值|投机情绪|员工持股|资本博弈/, scope: 'name' }
    ],
    制度公共: [
      { name: '财政公共服务', pattern: /大政府|公共服务|税负|基建神话|医生降薪/, scope: 'name' },
      { name: '阶层中产', pattern: /阶层差异|中产|中产阶级|中位数|财富|资本|新钱|阶层固化|自选故乡/, scope: 'name' },
      { name: '规则权威', pattern: /国际法|避险港|权威|法律边界|公共规则/, scope: 'name' },
      { name: '文化个体叙事', pattern: /广告审美|谎言|认祖归宗|社会实验|虚假繁荣|文化与文明|自发能动性|自我|尊严|父母角色/, scope: 'name' }
    ]
  };

  if (byParent[parentTitle]) return byParent[parentTitle];

  const byKind = {
    organization: [
      { name: '公共部门', pattern: /政府|国资|监管|法院|财政|公共|地铁|学校|医院/ },
      { name: '商业公司', pattern: /公司|集团|企业|品牌|万科|西贝|娃哈哈|比亚迪|万达/ },
      { name: '平台渠道', pattern: /平台|经销|渠道|电商|直播|供应链|外卖/ },
      { name: '国际组织', pattern: /东盟|欧盟|联盟|OPEC|欧佩克|海合会/ }
    ],
    mechanism: [
      { name: '金融资产', pattern: /债|资产|金融|价格|保险|信托|报表|利润|货币|市场/ },
      { name: '产业渠道', pattern: /产业|生产|制造|经销|渠道|供应链|研发|销量/ },
      { name: '治理组织', pattern: /治理|组织|平台|监管|权威|控制|数据|规则/ },
      { name: '社会文化', pattern: /家庭|教育|年轻人|文化|审美|身份|叙事/ },
      { name: '地缘安全', pattern: /地缘|制裁|战争|海峡|航运|安全|能源/ }
    ],
    concept: [
      { name: '制度公共', pattern: /制度|财政|国资|税|债务|公共|体制|监管|法律/ },
      { name: '资产交易', pattern: /资产|金融|散户|价格|市场|美元|报表|信用/ },
      { name: '社会家庭', pattern: /家庭|中产|阶层|年轻人|身份|代际|亲密/ },
      { name: '教育文化', pattern: /教育|文化|认知|审美|历史|语言|学术/ },
      { name: '国际规则', pattern: /国际|地缘|主权|小国|海峡|秩序|战争/ }
    ],
    theme: [
      { name: '国际安全', pattern: /国际|地缘|战争|制裁|小国|大国|海峡/ },
      { name: '地产财政', pattern: /地产|地方|财政|债|土地|税|风险/ },
      { name: '产业技术', pattern: /产业|技术|AI|电车|制造|电池|研发/ },
      { name: '社会成长', pattern: /家庭|成长|年轻人|教育|中产|养老|个人/ },
      { name: '平台文化', pattern: /平台|媒体|文化|流量|内容|审美|叙事/ }
    ]
  };

  return byKind[kind] || [];
}

function keywordLeafRefinementRules(title, kind = '') {
  if (/其他/.test(title)) return keywordLeafGroupRules('', kind);
  return keywordLeafGroupRules(title, kind);
}

function groupKeywordsForIndex(kind, keywords = []) {
  const normalizedKind = normalizeKeywordKind(kind) || 'general';
  const order = keywordIndexSubgroupOrder(normalizedKind);
  const grouped = new Map(order.map((label) => [label, []]));

  for (const keyword of keywords) {
    const group = classifyKeywordIndexSubgroup(normalizedKind, keyword);
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group).push(keyword);
  }

  return [...grouped.entries()]
    .filter(([, items]) => items.length)
    .sort((a, b) => {
      const aOrder = order.indexOf(a[0]);
      const bOrder = order.indexOf(b[0]);
      if (aOrder !== -1 || bOrder !== -1) {
        if (aOrder === -1) return 1;
        if (bOrder === -1) return -1;
        return aOrder - bOrder;
      }
      const countDelta = b[1].length - a[1].length;
      if (countDelta) return countDelta;
      return a[0].localeCompare(b[0], 'zh-Hans-CN');
    });
}

function classifyKeywordIndexSubgroup(kind, keyword) {
  if (kind === 'person') return classifyReferenceItem('people', keyword);

  const text = [
    keyword?.name || '',
    keyword?.summary || '',
    keyword?.description || '',
    ...(keyword?.aliases || []),
    ...(keyword?.episodes || []).map((episode) => episode?.note || '')
  ].join(' ');

  const rules = keywordIndexSubgroupRules(kind);
  const matched = rules.find((rule) => keywordIndexRuleMatches(rule, keyword, text));
  return matched?.name || keywordIndexFallbackSubgroup(kind);
}

function keywordIndexSubgroupOrder(kind) {
  const orders = {
    person: ['国家领导人', '地缘政治人物', '企业家与资本人物', '科技产业人物', '教育学术人物', '媒体文化人物', '其他'],
    geography: ['国家与地区', '海峡港口与航线', '城市与地方节点', '地缘文明与区域', '其他地理节点'],
    organization: ['国家机构与公共部门', '公司与商业组织', '平台与渠道组织', '区域组织与联盟', '学校与文化机构', '其他组织'],
    product: ['汽车与交通产品', '能源与电池技术', 'AI 与数字内容', '消费品与餐饮产品', '住房与城市产品', '其他产品技术'],
    asset: ['地产与土地资产', '贵金属与大宗商品', '货币与结算资产', '文化与替代资产', '其他资产'],
    event: ['战争与地缘冲突', '政策与制度节点', '企业与资本风波', '教育文化争议', '市场异动', '其他事件'],
    mechanism: ['金融杠杆与资产机制', '产业生产与渠道机制', '平台治理与组织机制', '地缘安全与制裁机制', '社会家庭与教育机制', '认知叙事与文化机制', '其他机制'],
    concept: ['制度财政与公共概念', '资产金融与交易概念', '社会阶层与家庭概念', '教育文化与认知概念', '地缘规则与国际概念', '技术产业与平台概念', '其他概念'],
    theme: ['国际秩序与大国博弈', '地方财政与地产退潮', '产业技术与制造业', '社会家庭与个人成长', '平台媒体与文化生产', '教育与年轻人路径', '其他主题'],
    general: ['劳动与公共服务', '地方消费与文旅', '教育生活场景', '其他通用词']
  };
  return orders[kind] || orders.general;
}

function keywordIndexFallbackSubgroup(kind) {
  const fallbacks = {
    geography: '其他地理节点',
    organization: '其他组织',
    product: '其他产品技术',
    asset: '其他资产',
    event: '其他事件',
    mechanism: '其他机制',
    concept: '其他概念',
    theme: '其他主题',
    general: '其他通用词'
  };
  return fallbacks[kind] || '其他';
}

function keywordIndexSubgroupRules(kind) {
  const rules = {
    geography: [
      { name: '海峡港口与航线', pattern: /海峡|港口|航线|通道|咽喉|海运|马六甲|霍尔木兹|富查伊拉|南海|台海/ },
      { name: '城市与地方节点', pattern: /城市|地方|佛山|海南|深圳|武汉|三四线|珠三角|县城|小镇|港\b/ },
      { name: '地缘文明与区域', pattern: /东亚|东南亚|中东|欧洲|海湾|波斯|区域|文明|半岛|岛链/ },
      { name: '国家与地区', pattern: /国家|美国|日本|新加坡|伊朗|俄罗斯|乌克兰|阿联酋|沙特|马来西亚|中国|台湾|越南|匈牙利/ }
    ],
    organization: [
      { name: '国家机构与公共部门', pattern: /政府|地方政府|国资|监管|法院|央行|财政|公共|地铁|医院|部委|公立/ },
      { name: '区域组织与联盟', pattern: /东盟|欧盟|联盟|OPEC|欧佩克|海合会|组织|共同体|集团国家/ },
      { name: '平台与渠道组织', pattern: /平台|经销商|渠道|直播|电商|拼多多|B站|YouTube|爱奇艺|外卖|4S|供应链/ },
      { name: '学校与文化机构', pattern: /大学|学校|学院|故宫|博物馆|赛事|选美|教育机构/ },
      { name: '公司与商业组织', pattern: /公司|集团|企业|品牌|咨询|万科|西贝|娃哈哈|比亚迪|万达|华与华|OpenAI|小米/ }
    ],
    product: [
      { name: '汽车与交通产品', pattern: /汽车|出租车|车门|换电|智驾|无人车|萝卜快跑|小米汽车|新能源车|电控门|车/ },
      { name: '能源与电池技术', pattern: /电池|锂电|充电|能源|光伏|芯片|算力|回收|电源/ },
      { name: 'AI 与数字内容', pattern: /AI|大模型|短剧|云端|算法|数字|机器人|纪录片|直播|平台|古偶/ },
      { name: '住房与城市产品', pattern: /组屋|住房|地产|公共住房|城市|楼盘/ },
      { name: '消费品与餐饮产品', pattern: /白酒|年份酒|预制菜|餐饮|充电宝|消费品|外卖|酒/ }
    ],
    asset: [
      { name: '地产与土地资产', pattern: /房|地产|地价|土地|楼市|住房/ },
      { name: '贵金属与大宗商品', pattern: /黄金|白银|铜|石油|原油|贵金属|大宗商品/ },
      { name: '货币与结算资产', pattern: /美元|石油美元|比特币|货币|结算|储备|信用/ },
      { name: '文化与替代资产', pattern: /蒙娜丽莎|艺术|文化|藏品|作品/ }
    ],
    event: [
      { name: '战争与地缘冲突', pattern: /战争|冲突|太平洋|俄乌|阅兵|重装备|入侵|战场/ },
      { name: '政策与制度节点', pattern: /封关|政策|制度|改革|试点|自由贸易港/ },
      { name: '企业与资本风波', pattern: /宝万|辞职|股债|债|股|控制权|资本|危机|风波/ },
      { name: '教育文化争议', pattern: /北大|神课|选美|赛事|冠军|马拉松|欢乐跑|野孩|举报|文化/ },
      { name: '市场异动', pattern: /双杀|暴跌|上涨|行情|价格|交易|股债/ }
    ],
    mechanism: [
      { name: '金融杠杆与资产机制', pattern: /债|杠杆|保险|信托|资产|金融|价格|首付|银行|清算|收益|货币|资本|库存|利润|报表|市场惩戒/ },
      { name: '产业生产与渠道机制', pattern: /产业|生产|制造|经销|渠道|供应链|销量|零公里|研发|量产|回收|电池|技术|补贴/ },
      { name: '平台治理与组织机制', pattern: /平台|治理|组织|网格|数据|监管|权威|反馈|控制|集中式|分布式|算法|流量|规则/ },
      { name: '地缘安全与制裁机制', pattern: /制裁|海峡|航运|区域拒止|战争|地缘|灰色贸易|影子|能源|通道|安全|主权/ },
      { name: '社会家庭与教育机制', pattern: /家庭|教育|学校|孩子|年轻人|中产|代际|婚姻|亲密|躺平|午餐|劳动|养老/ },
      { name: '认知叙事与文化机制', pattern: /叙事|文化|审美|模因|历史|语言|认知|身份|体面|尊严|信任|道德|意义/ }
    ],
    concept: [
      { name: '制度财政与公共概念', pattern: /国有|财政|税|债务|公共|制度|政府|监管|合法性|权威|体制|编制|转移支付/ },
      { name: '资产金融与交易概念', pattern: /资产|金融|散户|交易|价格|市场|繁荣|税负|美元|保险|地价|利润|报表|信用/ },
      { name: '社会阶层与家庭概念', pattern: /家庭|亲属|断亲|中产|阶层|年轻人|小镇|婆罗门|代际|婚恋|故乡|身份|稳定/ },
      { name: '教育文化与认知概念', pattern: /教育|学校|学术|文化|文明|历史|语言|审美|认知|自由|权威|课程|学生/ },
      { name: '地缘规则与国际概念', pattern: /国际|地缘|主权|中立|门罗|法律|国家|海峡|通行|小国|秩序|战争/ },
      { name: '技术产业与平台概念', pattern: /技术|AI|平台|产业|制造|电车|算法|数据|创新|云|内容|流量/ }
    ],
    theme: [
      { name: '国际秩序与大国博弈', pattern: /大国|国际|地缘|战争|制裁|小国|新加坡|中东|东亚|海峡|安全|秩序/ },
      { name: '地方财政与地产退潮', pattern: /地方|财政|地产|房|债|土地|万科|公共|城市|风险|税/ },
      { name: '产业技术与制造业', pattern: /制造|产业|技术|AI|电车|电池|研发|汽车|新能源|算力|创新/ },
      { name: '社会家庭与个人成长', pattern: /家庭|个人|成长|亲密|代际|女性|养老|中产|身份|故乡|关系/ },
      { name: '平台媒体与文化生产', pattern: /平台|媒体|文化|流量|内容|短剧|电影|审美|模因|叙事|传播/ },
      { name: '教育与年轻人路径', pattern: /教育|年轻人|学校|考试|学术|学生|稳定|路径|职业|大学/ }
    ],
    general: [
      { name: '劳动与公共服务', pattern: /外卖|劳动|配送|公共|服务|午餐|供餐/ },
      { name: '地方消费与文旅', pattern: /文旅|旅游|地方|消费|城市|包装/ },
      { name: '教育生活场景', pattern: /学生|学校|午餐|生活|教育/ }
    ]
  };
  return rules[kind] || [];
}

function getSidebarKeywordMatches() {
  const query = sidebarKeywordQuery.trim().toLowerCase();
  const keywords = site?.keywords || [];
  const keywordResults = (!query ? keywords.slice(0, 3) : keywords
    .filter((keyword) => {
      const haystack = `${keyword.name} ${keyword.summary || ''} ${(keyword.aliases || []).join(' ')}`.toLowerCase();
      return haystack.includes(query);
    })
    .slice(0, 8));
  return keywordResults.slice(0, query ? 8 : 3);
}

function getKnowledgeSearchMatches(query) {
  const trimmedQuery = String(query || '').trim();
  const normalizedQuery = trimmedQuery.toLowerCase();
  const keywords = (site?.keywords || []);
  const keywordMatches = (!trimmedQuery ? getRecommendedKeywords(3) : keywords
    .filter((keyword) => {
      const haystack = `${keyword.name} ${keyword.summary || ''} ${(keyword.aliases || []).join(' ')}`.toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, 8))
    .map((keyword) => ({
      type: 'keyword',
      id: keyword.id,
      name: keyword.name,
      badge: '关键词'
    }));

  if (!trimmedQuery) return keywordMatches;

  const episodes = (site?.episodes || [])
    .filter((episode) => episodeMatchesQuery(episode, trimmedQuery))
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id))
    .slice(0, 8)
    .map((episode) => ({
      type: 'episode',
      id: episode.id,
      name: `${episode.id}｜${displayEpisodeTitle(episode.title)}`,
      badge: '节目'
    }));

  const concepts = getSidebarReferenceMatches('concept', site?.concepts || [], trimmedQuery, '概念');
  const models = getSidebarReferenceMatches('model', site?.models || [], trimmedQuery, '模型');
  const themes = getSidebarReferenceMatches('theme', site?.themes || [], trimmedQuery, '主题');

  const exactEpisodeId = normalizeEpisodeIdQuery(trimmedQuery);
  if (exactEpisodeId) {
    const exact = episodes.find((item) => item.id === exactEpisodeId);
    if (exact) {
      return [exact, ...keywordMatches, ...concepts, ...models, ...themes, ...episodes.filter((item) => item.id !== exactEpisodeId)].slice(0, 10);
    }
  }

  return [...keywordMatches, ...concepts, ...models, ...themes, ...episodes].slice(0, 10);
}

function getSidebarReferenceMatches(type, collection = [], query, badge) {
  if (!query) return [];
  const normalizedQuery = query.trim().toLowerCase();

  return collection
    .filter((item) => {
      const haystack = [
        item.id,
        item.name || '',
        item.title || '',
        item.summary || '',
        item.definition || '',
        item.description || '',
        ...(item.aliases || [])
      ].join(' ').toLowerCase();
      return haystack.includes(normalizedQuery);
    })
    .slice(0, 6)
    .map((item) => ({
      type,
      id: item.id,
      name: item.name || item.title || item.id,
      badge
    }));
}

function getSidebarSearchMatches() {
  return getKnowledgeSearchMatches(sidebarKeywordQuery);
}

function routeForSearchMatch(match) {
  if (match.type === 'person') {
    const personKeyword = findKeywordByReference(match.id) || findKeywordByReference(match.name);
    return personKeyword ? routeTo(`keywords/${personKeyword.id}`) : routeTo(`people/${match.id}`);
  }
  return match.type === 'episode' ? routeTo(`episodes/${match.id}`)
    : match.type === 'keyword' ? routeTo(`keywords/${match.id}`)
    : match.type === 'concept' ? routeTo(`concepts/${match.id}`)
    : match.type === 'model' ? routeTo(`models/${match.id}`)
    : routeTo(`themes/${match.id}`);
}

function openFirstSearchMatch(query) {
  const [firstMatch] = getKnowledgeSearchMatches(query);
  if (!firstMatch) return;
  normalizeMobileViewport({ force: true });
  window.location.hash = routeForSearchMatch(firstMatch);
}

function renderKnowledgeSuggestions({ containerId, titleId, query, emptyMessage, idleTitle = '推荐关键词' }) {
  const container = document.getElementById(containerId);
  const heading = document.getElementById(titleId);
  if (!container || !site) return;

  const matches = getKnowledgeSearchMatches(query);
  if (heading) {
    heading.textContent = String(query || '').trim() ? '匹配结果' : idleTitle;
  }

  if (!matches.length) {
    container.innerHTML = `<div class="sidebar-empty">${escapeHtml(emptyMessage)}</div>`;
    return;
  }

  container.innerHTML = matches.map((match) => `
    <a class="sidebar-suggestion search-suggestion" href="${routeForSearchMatch(match)}">
      <span>${escapeHtml(match.name)}</span>
      <span class="count-badge">${escapeHtml(match.badge)}</span>
    </a>
  `).join('');
}

function rerollHomeRecommendations() {
  homeRecommendationSeed = Math.floor(Math.random() * 1000000);
  renderKnowledgeSuggestions({
    containerId: 'home-search-results',
    titleId: 'home-search-title',
    query: homeKnowledgeQuery,
    emptyMessage: '没有匹配的节目、概念、模型、人物或主题',
    idleTitle: '推荐关键词'
  });
}

function rerollHomeReferenceRecommendations(type) {
  if (type === 'concepts') {
    homeConceptRecommendationSeed = Math.floor(Math.random() * 1000000);
    updateHomeReferenceRecommendations('concepts');
    return;
  }
  if (type === 'models') {
    homeModelRecommendationSeed = Math.floor(Math.random() * 1000000);
    updateHomeReferenceRecommendations('models');
  }
}

function homeEpisodeVisibleCount() {
  if (useMobileHomeLayout()) return 1;
  const shell = document.querySelector('.home-episode-carousel-shell');
  const viewport = shell?.querySelector?.('.home-episode-carousel-viewport');
  const homeSection = document.getElementById('home-episodes');
  const availableWidth = viewport instanceof HTMLElement
    ? viewport.getBoundingClientRect().width
    : shell instanceof HTMLElement
      ? shell.getBoundingClientRect().width
      : homeSection instanceof HTMLElement
        ? homeSection.getBoundingClientRect().width
        : Math.max(app?.getBoundingClientRect?.().width || 0, 0);

  if (availableWidth >= 1040) return 3;
  if (availableWidth >= 690) return 2;
  return 1;
}

function homeEpisodeCarouselState(episodes = [], visibleCount = homeEpisodeVisibleCount()) {
  const maxIndex = Math.max(episodes.length - visibleCount, 0);
  const currentIndex = Math.min(homeEpisodeCarouselIndex, maxIndex);
  const start = currentIndex;
  return {
    visibleCount,
    maxIndex,
    currentIndex,
    visibleEpisodes: episodes.slice(start, start + visibleCount)
  };
}

function visibleEpisodeWindow(episodes = [], start = 0, visibleCount = homeEpisodeVisibleCount()) {
  return episodes.slice(start, start + visibleCount);
}

function scheduleHomeEpisodeAutoAdvance(maxIndex) {
  window.clearTimeout(homeEpisodeCarouselTimer);
  if (maxIndex <= 0) return;
  if (useMobileHomeLayout()) return;
  const waitMs = Math.max(homeEpisodeAutoAdvancePausedUntil - Date.now(), 0);
  homeEpisodeCarouselTimer = window.setTimeout(() => {
    advanceHomeEpisodeCarousel(1, maxIndex);
  }, Math.max(HOME_EPISODE_DESKTOP_AUTO_ADVANCE_MS, waitMs));
}

function pauseHomeEpisodeAutoAdvance(durationMs = 6500) {
  homeEpisodeAutoAdvancePausedUntil = Date.now() + durationMs;
  window.clearTimeout(homeEpisodeCarouselTimer);
}

function resetHomeEpisodeCarouselRuntime() {
  window.clearTimeout(homeEpisodeCarouselTimer);
  window.clearTimeout(homeEpisodeCarouselAnimationTimer);
  homeEpisodeCarouselTimer = 0;
  homeEpisodeCarouselAnimationTimer = 0;
  homeEpisodeCarouselBindingsController?.abort();
  homeEpisodeCarouselBindingsController = null;
  homeEpisodeCarouselAnimating = false;
  homeEpisodeSwipeTracking = false;
  homeEpisodeSwipePointerId = null;
}

function advanceHomeEpisodeCarousel(direction, maxIndex) {
  if (homeEpisodeCarouselAnimating) return;
  if (maxIndex <= 0) return;
  homeEpisodeCarouselAnimating = true;
  if (direction < 0) {
    homeEpisodeCarouselIndex = homeEpisodeCarouselIndex <= 0 ? maxIndex : homeEpisodeCarouselIndex - 1;
  } else {
    homeEpisodeCarouselIndex = homeEpisodeCarouselIndex >= maxIndex ? 0 : homeEpisodeCarouselIndex + 1;
  }
  renderHomeEpisodeCarousel({ direction });
}

function renderSidebarKeywordSuggestions() {
  const title = document.getElementById('keyword-suggestions-title');
  const container = document.getElementById('keyword-suggestions');
  const query = sidebarKeywordQuery.trim();
  if (!title || !container) return;
  if (!query) {
    title.textContent = '输入后显示匹配结果';
    container.innerHTML = '';
    return;
  }
  renderKnowledgeSuggestions({
    containerId: 'keyword-suggestions',
    titleId: 'keyword-suggestions-title',
    query: sidebarKeywordQuery,
    emptyMessage: '没有匹配的关键词、节目或知识条目',
    idleTitle: '匹配结果'
  });
}

function navigateToEpisodeFromElement(element) {
  const episodeCard = element?.closest?.('[data-episode-href]');
  const href = episodeCard?.dataset?.episodeHref;
  if (!href) return false;
  closeSectionProgressPanel();
  suppressSectionProgressTemporarily(1200);
  window.location.hash = href;
  return true;
}

function renderSidebar() {
  const peopleCount = getPeopleKeywords(PERSON_NAV_MIN_REFERENCES).length;
  sidebarBody.innerHTML = `
    <div class="sidebar-section">
      <div class="sidebar-title-row">
        <p class="sidebar-title">导航</p>
        <button class="sidebar-toggle-inline" id="sidebar-toggle-inline" type="button" aria-label="收起导航">☰</button>
      </div>
      <a class="sidebar-link" href="#/">首页 <span class="count-badge">Home</span></a>
      <a class="sidebar-link" href="#/episodes">节目 <span class="count-badge">${site.stats.episodes}</span></a>
      <a class="sidebar-link" href="#/concepts">概念 <span class="count-badge">${site.stats.concepts}</span></a>
      <a class="sidebar-link" href="#/models">模型 <span class="count-badge">${site.stats.models}</span></a>
      <a class="sidebar-link" href="#/people">人物 <span class="count-badge">${peopleCount}</span></a>
      <a class="sidebar-link" href="#/themes">主题 <span class="count-badge">${site.stats.themes}</span></a>
      <a class="sidebar-link" href="#/keywords">关键词 <span class="count-badge">${site.stats.keywords}</span></a>
    </div>
    <div class="sidebar-section">
      <p class="sidebar-title">搜索知识库</p>
      <div class="sidebar-search-wrap">
        <input id="keyword-search-input" class="sidebar-search-input" type="text" placeholder="搜索关键词、节目、概念、模型，如 咽喉杠杆 / 西贝 / EP031">
        <p id="keyword-suggestions-title" class="sidebar-subtitle">输入后显示匹配结果</p>
        <div id="keyword-suggestions" class="sidebar-suggestions"></div>
      </div>
    </div>
    <div class="sidebar-section">
      <a class="sidebar-link" href="#/graph">知识图谱 <span class="count-badge">${graphStatValue()}</span></a>
      <a class="sidebar-link sidebar-link-log" href="#/updates">网页日志 <span class="count-badge">${WEBSITE_LOG_ENTRIES.length}</span></a>
    </div>
  `;

  const keywordInput = document.getElementById('keyword-search-input');
  keywordInput.value = sidebarKeywordQuery;
  keywordInput.addEventListener('input', (event) => {
    sidebarKeywordQuery = event.target.value;
    renderSidebarKeywordSuggestions();
  });
  keywordInput.addEventListener('focus', () => {
    renderSidebarKeywordSuggestions();
  });
    keywordInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;
      const [firstMatch] = getSidebarSearchMatches();
      if (firstMatch) {
        normalizeMobileViewport({ force: true });
        window.location.hash = firstMatch.type === 'episode'
          ? routeTo(`episodes/${firstMatch.id}`)
          : firstMatch.type === 'keyword'
            ? routeTo(`keywords/${firstMatch.id}`)
            : firstMatch.type === 'concept'
              ? routeTo(`concepts/${firstMatch.id}`)
              : firstMatch.type === 'model'
                ? routeTo(`models/${firstMatch.id}`)
            : routeTo(`themes/${firstMatch.id}`);
      }
    });
  document.getElementById('sidebar-toggle-inline')?.addEventListener('click', () => {
    if (!isDesktopViewport()) return;
    toggleDesktopSidebar();
  });
  sidebarBody.addEventListener('click', (event) => {
    const link = event.target.closest('a[href^="#/"]');
    if (!link) return;
    normalizeMobileViewport({ force: true });
  });
}

function renderWebsiteLog() {
  const groups = groupWebsiteLogEntriesByMonth(WEBSITE_LOG_ENTRIES);
  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">Website Log</p>
        <h1 class="detail-title">网页日志</h1>
      </div>
      <section class="detail-section">
        <div class="website-log-list">
          ${groups.map((monthGroup, monthIndex) => `
            <details class="website-log-month">
              <summary>
                <span class="website-log-month-title">${escapeHtml(monthGroup.monthLabel)}</span>
                <span class="website-log-month-count">${monthGroup.entriesCount} 条更新</span>
              </summary>
              <div class="website-log-month-body">
                ${monthGroup.dates.map((dateGroup, dateIndex) => `
                  <details
                    class="website-log-date-group"
                    data-progress-section="true"
                    data-progress-label="${escapeHtml(formatWebsiteLogProgressDate(dateGroup.date))}"
                  >
                    <summary>
                      <span class="website-log-date-title">${escapeHtml(dateGroup.dateLabel)}</span>
                      <span class="website-log-date-count">${dateGroup.entries.length} 条</span>
                    </summary>
                    <div class="website-log-date-body">
                      ${dateGroup.entries.map((entry) => `
                        <article class="list-item website-log-entry">
                          <h3>${escapeHtml(entry.title)}</h3>
                          <ul>
                            ${(entry.items || []).map((item) => `<li>${escapeHtml(item)}</li>`).join('')}
                          </ul>
                        </article>
                      `).join('')}
                    </div>
                  </details>
                `).join('')}
              </div>
            </details>
          `).join('')}
        </div>
      </section>
    </section>
  `;
}

function groupWebsiteLogEntriesByMonth(entries = []) {
  return entries.reduce((monthGroups, entry) => {
    const date = String(entry?.date || '').trim();
    const monthKey = date.match(/^(\d{4})-(\d{2})-/)?.slice(1, 3).join('-') || date || 'unknown';
    const lastMonth = monthGroups[monthGroups.length - 1];
    const currentMonth = lastMonth?.monthKey === monthKey
      ? lastMonth
      : {
          monthKey,
          monthLabel: formatWebsiteLogMonth(date),
          entriesCount: 0,
          dates: []
        };

    if (currentMonth !== lastMonth) {
      monthGroups.push(currentMonth);
    }

    const lastDate = currentMonth.dates[currentMonth.dates.length - 1];
    if (lastDate?.date === date) {
      lastDate.entries.push(entry);
    } else {
      currentMonth.dates.push({
        date,
        dateLabel: formatWebsiteLogDateHeading(date),
        entries: [entry]
      });
    }

    currentMonth.entriesCount += 1;
    return monthGroups;
  }, []);
}

function formatWebsiteLogProgressDate(date) {
  const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(date || '').trim();
  const [, , month, day] = match;
  return `${Number(month)}月${Number(day)}日`;
}

function formatWebsiteLogMonth(date) {
  const match = String(date || '').match(/^(\d{4})-(\d{2})-/);
  if (!match) return String(date || '未标日期').trim();
  const [, year, month] = match;
  return `${year}年${Number(month)}月`;
}

function formatWebsiteLogDateHeading(date) {
  const match = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return String(date || '未标日期').trim();
  const [, , month, day] = match;
  return `${Number(month)}月${Number(day)}日`;
}

function scrollToSection(id) {
  if (!id) return;
  requestAnimationFrame(() => {
    const target = document.getElementById(id);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
}

function revealHomeSearchForQuery() {
  const toolbar = document.querySelector('.home-search-toolbar');
  const resultsSection = document.querySelector('.home-search-section');
  if (!(toolbar instanceof HTMLElement)) return;
  toolbar.classList.remove('is-hidden-by-scroll', 'is-ghost');
  toolbar.style.setProperty('--home-search-toolbar-opacity', '1');
  const toolbarHeight = toolbar.getBoundingClientRect().height;
  const sectionTop = resultsSection instanceof HTMLElement
    ? window.scrollY + resultsSection.getBoundingClientRect().top - toolbarHeight - (isMobileViewport() ? 10 : 16)
    : window.scrollY + toolbar.getBoundingClientRect().top - 18;
  const top = Math.max(sectionTop, 0);
  window.clearTimeout(sectionSnapTimer);
  suspendSnapUntil = Date.now() + 960;
  scrollWindowInstantly(top, window.scrollX);
  window.requestAnimationFrame(() => {
    scrollWindowInstantly(top, window.scrollX);
    window.dispatchEvent(new Event('scroll'));
  });
}

function getHomeFeaturedEpisodes() {
  return [...site.episodes].sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));
}

function getWrappedHomeEpisodeIndex(index, maxIndex) {
  if (maxIndex <= 0) return 0;
  if (index < 0) return maxIndex;
  if (index > maxIndex) return 0;
  return index;
}

function getHomeEpisodeOutgoingIndex(currentIndex, direction, maxIndex) {
  return direction > 0
    ? getWrappedHomeEpisodeIndex(currentIndex - 1, maxIndex)
    : getWrappedHomeEpisodeIndex(currentIndex + 1, maxIndex);
}

function getHomeEpisodePositionLabel(episode, totalEpisodes) {
  if (!episode) return `第 1 / ${totalEpisodes} 集`;
  const episodeNumber = episodeNumberFromId(episode.id);
  return `第 ${Number.isFinite(episodeNumber) ? episodeNumber : 1} / ${totalEpisodes} 集`;
}

function getHomeEpisodeRangeLabel(episodes = [], totalEpisodes) {
  const numbers = episodes
    .map((episode) => episodeNumberFromId(episode?.id))
    .filter((value) => Number.isFinite(value))
    .sort((a, b) => a - b);

  if (!numbers.length) return `第 1 / ${totalEpisodes} 集`;
  if (numbers.length === 1) return `第 ${numbers[0]} / ${totalEpisodes} 集`;
  return `第 ${numbers[0]}-${numbers[numbers.length - 1]} / ${totalEpisodes} 集`;
}

function isEpisodeFresh(episode) {
  if (episode?.recent) return true;
  const publishedTime = episode?.publishedAt ? new Date(episode.publishedAt).getTime() : NaN;
  if (Number.isFinite(publishedTime)) {
    return (Date.now() - publishedTime) <= (3 * 24 * 60 * 60 * 1000);
  }
  const currentEpisodeNumber = episodeNumberFromId(episode?.id);
  const latestEpisodeNumber = newestEpisodeNumber();
  return Number.isFinite(currentEpisodeNumber)
    && Number.isFinite(latestEpisodeNumber)
    && currentEpisodeNumber === latestEpisodeNumber;
}

function renderEpisodeFreshBadge(episode, { compact = false } = {}) {
  if (!isEpisodeFresh(episode)) return '';
  return `<span class="episode-fresh-badge${compact ? ' compact' : ''}">新</span>`;
}

function renderHomeEpisodeKickerMeta(episode) {
  if (isEpisodeFresh(episode)) {
    return renderEpisodeFreshBadge(episode, { compact: true });
  }
  return episode.curated ? '· 已整理' : '· 待整理';
}

function renderHomeEpisodeCardMarkup(episode, { preview = false, mobileAction = false } = {}) {
  const summary = summarizeHomeEpisodeSummary(episode.summary, { mobile: mobileAction });
  const visibleTags = mobileAction ? (episode.tags || []).slice(0, 3) : (episode.tags || []);
  return `
    <article class="card home-episode-card${preview ? ' is-preview' : ''}" data-episode-href="${routeTo(`episodes/${episode.id}`)}">
      <p class="card-kicker">${escapeHtml(episode.id)} ${renderHomeEpisodeKickerMeta(episode)}</p>
      <a class="card-primary-link" href="${routeTo(`episodes/${episode.id}`)}">
        <h3>${escapeHtml(displayEpisodeTitle(episode.title))}</h3>
      </a>
      <p>${escapeHtml(summary)}</p>
      ${linkedChipList('keywords', visibleTags, site.keywords)}
    </article>
  `;
}

function renderHomeEpisodePreviewPaneMarkup(episode, direction) {
  return `
    <article class="home-episode-preview-card" aria-hidden="true" data-preview-direction="${direction}">
      <span class="home-episode-preview-kicker">${escapeHtml(episode.id)}</span>
      <span class="home-episode-preview-title">${escapeHtml(displayEpisodeTitle(episode.title))}</span>
      <span class="home-episode-preview-line short"></span>
      <span class="home-episode-preview-line"></span>
      <span class="home-episode-preview-line"></span>
    </article>
  `;
}

function renderHomeEpisodeMobileFooterMarkup(episode, totalEpisodes) {
  return `
    <div class="home-episodes-footer-mobile">
      <span class="home-episode-mobile-index">${getHomeEpisodePositionLabel(episode, totalEpisodes)}</span>
      <a class="home-episodes-more-link" href="#/episodes">更多节目</a>
    </div>
  `;
}

function renderHomeEpisodeDesktopFooterMarkup(visibleEpisodes, totalEpisodes) {
  return `
    <div class="home-episodes-footer-desktop">
      <span class="home-episode-desktop-index">${getHomeEpisodeRangeLabel(visibleEpisodes, totalEpisodes)}</span>
      <a class="home-episodes-more-link" href="#/episodes">更多节目</a>
    </div>
  `;
}

function renderHomeEpisodeCarouselMarkup(homeEpisodeCarousel, featuredEpisodes, { mobilePreview = false } = {}) {
  const showMobilePreview = mobilePreview && homeEpisodeCarousel.visibleCount === 1;
  const currentEpisode = showMobilePreview
    ? featuredEpisodes[homeEpisodeCarousel.currentIndex]
    : null;

  return `
    ${showMobilePreview ? `
      <div class="home-episode-carousel-viewport">
        <div class="home-episode-carousel-track is-mobile-single">
          <div class="home-episode-mobile-single">
            ${renderHomeEpisodeCardMarkup(currentEpisode, { mobileAction: true })}
          </div>
        </div>
      </div>
      ${renderHomeEpisodeMobileFooterMarkup(currentEpisode, featuredEpisodes.length)}
    ` : `
      <button
        id="home-episodes-prev"
        class="home-episode-side-button${homeEpisodeCarousel.maxIndex > 0 ? '' : ' is-disabled'}"
        type="button"
        aria-label="显示更新一个节目"
        ${homeEpisodeCarousel.maxIndex > 0 ? '' : 'disabled'}
      >‹</button>
      <div class="home-episode-carousel-viewport">
        <div class="home-episode-carousel-track">
          <div class="home-episode-grid home-episode-grid-${homeEpisodeCarousel.visibleCount}">
            ${homeEpisodeCarousel.visibleEpisodes.map((episode) => renderHomeEpisodeCardMarkup(episode)).join('')}
          </div>
        </div>
      </div>
      <button
        id="home-episodes-next"
        class="home-episode-side-button${homeEpisodeCarousel.maxIndex > 0 ? '' : ' is-disabled'}"
        type="button"
        aria-label="显示更早一个节目"
        ${homeEpisodeCarousel.maxIndex > 0 ? '' : 'disabled'}
      >›</button>
      ${renderHomeEpisodeDesktopFooterMarkup(homeEpisodeCarousel.visibleEpisodes, featuredEpisodes.length)}
    `}
  `;
}

function renderHomeEpisodeMobileTransitionMarkup(outgoingEpisode, incomingEpisode, direction) {
  const orderedEpisodes = direction > 0
    ? [outgoingEpisode, incomingEpisode]
    : [incomingEpisode, outgoingEpisode];
  const initialShift = direction > 0 ? '0%' : '-50%';

  return `
    <div class="home-episode-carousel-viewport is-mobile-transition">
      <div class="home-episode-mobile-transition-strip" style="transform: translate3d(${initialShift}, 0, 0);">
        ${orderedEpisodes.map((episode) => `
          <div class="home-episode-mobile-transition-pane">
            ${renderHomeEpisodeCardMarkup(episode, { mobileAction: true })}
          </div>
        `).join('')}
      </div>
    </div>
    ${renderHomeEpisodeMobileFooterMarkup(incomingEpisode, getHomeFeaturedEpisodes().length)}
  `;
}

function renderHomeEpisodeDesktopTransitionMarkup(outgoingEpisodes, incomingEpisodes, visibleCount, direction, totalEpisodes) {
  const orderedWindows = direction > 0
    ? [outgoingEpisodes, incomingEpisodes]
    : [incomingEpisodes, outgoingEpisodes];
  const initialShift = direction > 0 ? '0%' : '-50%';

  return `
    <div class="home-episode-carousel-viewport is-desktop-transition">
      <div class="home-episode-desktop-transition-strip" style="transform: translate3d(${initialShift}, 0, 0);">
        ${orderedWindows.map((episodes) => `
          <div class="home-episode-desktop-transition-pane">
            <div class="home-episode-grid home-episode-grid-${visibleCount}">
              ${episodes.map((episode) => renderHomeEpisodeCardMarkup(episode)).join('')}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
    ${renderHomeEpisodeDesktopFooterMarkup(direction > 0 ? orderedWindows[1] : orderedWindows[0], totalEpisodes)}
  `;
}

function bindHomeEpisodeCarousel(homeEpisodeCarouselShell, homeEpisodeCarousel, isMobile) {
  homeEpisodeCarouselBindingsController?.abort();
  homeEpisodeCarouselBindingsController = new AbortController();
  const { signal } = homeEpisodeCarouselBindingsController;
  const mobileSwipeAxisThreshold = 6;
  const mobileSwipeAxisRatio = 1.04;
  const mobileSwipeCommitThreshold = 30;
  const mobileSwipePreviewLimit = 136;
  const mobileSwipeCommitOffset = 152;

  document.getElementById('home-episodes-prev')?.addEventListener('click', () => {
    pauseHomeEpisodeAutoAdvance(6000);
    advanceHomeEpisodeCarousel(-1, homeEpisodeCarousel.maxIndex);
  }, { signal });
  document.getElementById('home-episodes-next')?.addEventListener('click', () => {
    pauseHomeEpisodeAutoAdvance(6000);
    advanceHomeEpisodeCarousel(1, homeEpisodeCarousel.maxIndex);
  }, { signal });

  const homeEpisodeCarouselTrack = homeEpisodeCarouselShell.querySelector('.home-episode-carousel-track');
  const hasMobilePreview = isMobile
    && homeEpisodeCarousel.visibleCount === 1
    && homeEpisodeCarousel.maxIndex > 0;

  homeEpisodeCarouselShell.addEventListener('click', (event) => {
    const directEpisodeLink = event.target.closest('.card-primary-link, .home-episode-open-link');
    if (directEpisodeLink && homeEpisodeCarouselShell.contains(directEpisodeLink)) {
      event.preventDefault();
      navigateToEpisodeFromElement(directEpisodeLink);
      return;
    }

    const episodeCard = event.target.closest('.card[data-episode-href]');
    if (!episodeCard || !homeEpisodeCarouselShell.contains(episodeCard)) return;
    if (event.target.closest('.chip, button, input, textarea, select, summary, a')) return;
    navigateToEpisodeFromElement(episodeCard);
  }, { signal });

  if (homeEpisodeCarousel.maxIndex > 0) {
    let swipeAxis = '';
    const resetSwipeState = () => {
      homeEpisodeSwipeTracking = false;
      homeEpisodeSwipePointerId = null;
      swipeAxis = '';
      homeEpisodeCarouselTrack?.classList.remove('is-dragging');
      homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', '0px');
      scheduleHomeEpisodeAutoAdvance(homeEpisodeCarousel.maxIndex);
    };

    const clampPreviewOffset = (deltaX) => Math.max(Math.min(deltaX * 1.08, mobileSwipePreviewLimit), -mobileSwipePreviewLimit);
    const commitSwipeAdvance = (direction) => {
      homeEpisodeSwipeTracking = false;
      homeEpisodeSwipePointerId = null;
      swipeAxis = '';
      homeEpisodeCarouselTrack?.classList.remove('is-dragging');
      homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', `${direction < 0 ? mobileSwipeCommitOffset : -mobileSwipeCommitOffset}px`);
      window.setTimeout(() => {
        pauseHomeEpisodeAutoAdvance(6500);
        advanceHomeEpisodeCarousel(direction, homeEpisodeCarousel.maxIndex);
      }, 92);
    };

    homeEpisodeCarouselShell.addEventListener('pointerdown', (event) => {
      if (hasMobilePreview && event.pointerType === 'touch') return;
      if (event.target.closest('a, button, input, textarea, select, summary, .chip')) return;
      if (!hasMobilePreview && event.target.closest('a')) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      pauseHomeEpisodeAutoAdvance(7000);
      homeEpisodeSwipeTracking = true;
      homeEpisodeSwipePointerId = event.pointerId;
      homeEpisodeSwipeStartX = event.clientX;
      homeEpisodeSwipeStartY = event.clientY;
      swipeAxis = '';
      if (hasMobilePreview) {
        homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', '0px');
        homeEpisodeCarouselTrack?.classList.add('is-dragging');
        homeEpisodeCarouselShell.setPointerCapture?.(event.pointerId);
      }
    }, { signal });
    homeEpisodeCarouselShell.addEventListener('pointermove', (event) => {
      if (hasMobilePreview && event.pointerType === 'touch') return;
      if (!homeEpisodeSwipeTracking || (homeEpisodeSwipePointerId !== null && event.pointerId !== homeEpisodeSwipePointerId)) return;
      const deltaX = event.clientX - homeEpisodeSwipeStartX;
      const deltaY = event.clientY - homeEpisodeSwipeStartY;
      if (!swipeAxis && (Math.abs(deltaX) > mobileSwipeAxisThreshold || Math.abs(deltaY) > mobileSwipeAxisThreshold)) {
        swipeAxis = Math.abs(deltaX) > Math.abs(deltaY) * mobileSwipeAxisRatio ? 'x' : 'y';
      }
      if (!hasMobilePreview || swipeAxis !== 'x') return;
      event.preventDefault();
      const dragOffset = clampPreviewOffset(deltaX);
      homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', `${dragOffset}px`);
    }, { signal });
    homeEpisodeCarouselShell.addEventListener('pointerup', (event) => {
      if (hasMobilePreview && event.pointerType === 'touch') return;
      if (!homeEpisodeSwipeTracking || (homeEpisodeSwipePointerId !== null && event.pointerId !== homeEpisodeSwipePointerId)) return;
      const deltaX = event.clientX - homeEpisodeSwipeStartX;
      const deltaY = event.clientY - homeEpisodeSwipeStartY;
      const activeAxis = swipeAxis || (Math.abs(deltaX) > Math.abs(deltaY) * mobileSwipeAxisRatio ? 'x' : 'y');
      if (hasMobilePreview && activeAxis === 'x') {
        const selection = window.getSelection?.()?.toString()?.trim() || '';
        if (!selection && Math.abs(deltaX) >= mobileSwipeCommitThreshold) {
          commitSwipeAdvance(deltaX > 0 ? -1 : 1);
          return;
        }
      }
      resetSwipeState();
      if (Math.abs(deltaX) < (isMobile ? 24 : 42)) return;
      if (activeAxis !== 'x' || Math.abs(deltaX) <= Math.abs(deltaY) * 1.15) return;
      const selection = window.getSelection?.()?.toString()?.trim() || '';
      if (selection && !hasMobilePreview) return;
      advanceHomeEpisodeCarousel(deltaX > 0 ? -1 : 1, homeEpisodeCarousel.maxIndex);
    }, { signal });
    homeEpisodeCarouselShell.addEventListener('pointerleave', () => {
      if (!hasMobilePreview) {
        homeEpisodeSwipeTracking = false;
        homeEpisodeSwipePointerId = null;
      }
    }, { signal });
    homeEpisodeCarouselShell.addEventListener('pointercancel', () => {
      resetSwipeState();
    }, { signal });

    if (hasMobilePreview) {
      homeEpisodeCarouselShell.addEventListener('touchstart', (event) => {
        if (event.touches.length !== 1) return;
        if (event.target.closest('a, button, input, textarea, select, summary, .chip')) return;
        const touch = event.touches[0];
        pauseHomeEpisodeAutoAdvance(7000);
        homeEpisodeSwipeTracking = true;
        homeEpisodeSwipeStartX = touch.clientX;
        homeEpisodeSwipeStartY = touch.clientY;
        swipeAxis = '';
        homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', '0px');
        homeEpisodeCarouselTrack?.classList.add('is-dragging');
      }, { passive: true, signal });

      homeEpisodeCarouselShell.addEventListener('touchmove', (event) => {
        if (!homeEpisodeSwipeTracking || event.touches.length !== 1) return;
        const touch = event.touches[0];
        const deltaX = touch.clientX - homeEpisodeSwipeStartX;
        const deltaY = touch.clientY - homeEpisodeSwipeStartY;
        if (!swipeAxis && (Math.abs(deltaX) > mobileSwipeAxisThreshold || Math.abs(deltaY) > mobileSwipeAxisThreshold)) {
          swipeAxis = Math.abs(deltaX) > Math.abs(deltaY) * mobileSwipeAxisRatio ? 'x' : 'y';
        }
        if (swipeAxis !== 'x') return;
        event.preventDefault();
        const dragOffset = clampPreviewOffset(deltaX);
        homeEpisodeCarouselTrack?.style.setProperty('--home-episode-drag-offset', `${dragOffset}px`);
      }, { passive: false, signal });

      homeEpisodeCarouselShell.addEventListener('touchend', (event) => {
        if (!homeEpisodeSwipeTracking) return;
        const touch = event.changedTouches[0];
        const deltaX = touch.clientX - homeEpisodeSwipeStartX;
        const deltaY = touch.clientY - homeEpisodeSwipeStartY;
        const tapSlop = 18;
        const activeAxis = swipeAxis || (Math.abs(deltaX) > Math.abs(deltaY) * mobileSwipeAxisRatio ? 'x' : 'y');
        if (activeAxis === 'x' && Math.abs(deltaX) >= mobileSwipeCommitThreshold) {
          commitSwipeAdvance(deltaX > 0 ? -1 : 1);
          return;
        }
        resetSwipeState();
        if (Math.abs(deltaX) < tapSlop && Math.abs(deltaY) < tapSlop && !event.target.closest('a, button, input, textarea, select, summary, .chip')) {
          navigateToEpisodeFromElement(event.target);
        }
      }, { passive: true, signal });

      homeEpisodeCarouselShell.addEventListener('touchcancel', () => {
        resetSwipeState();
      }, { passive: true, signal });
    }
  }

  scheduleHomeEpisodeAutoAdvance(homeEpisodeCarousel.maxIndex);
}

function renderHomeEpisodeCarousel({ direction = 0 } = {}) {
  const homeEpisodeCarouselShell = document.querySelector('.home-episode-carousel-shell');
  if (!(homeEpisodeCarouselShell instanceof HTMLElement)) {
    resetHomeEpisodeCarouselRuntime();
    return;
  }
  const featuredEpisodes = getHomeFeaturedEpisodes();
  const homeEpisodeCarousel = homeEpisodeCarouselState(featuredEpisodes);
  const isMobile = useMobileHomeLayout();
  lastHomeEpisodeVisibleCount = homeEpisodeCarousel.visibleCount;

  const mount = () => {
    homeEpisodeCarouselShell.innerHTML = renderHomeEpisodeCarouselMarkup(homeEpisodeCarousel, featuredEpisodes, {
      mobilePreview: isMobile
    });
    bindHomeEpisodeCarousel(homeEpisodeCarouselShell, homeEpisodeCarousel, isMobile);
  };

  if (!direction) {
    window.clearTimeout(homeEpisodeCarouselAnimationTimer);
    homeEpisodeCarouselAnimationTimer = 0;
    homeEpisodeCarouselAnimating = false;
    mount();
    return;
  }

  window.clearTimeout(homeEpisodeCarouselAnimationTimer);
  homeEpisodeCarouselAnimationTimer = 0;

  if (isMobile) {
    const currentScrollY = window.scrollY;
    const currentScrollX = window.scrollX;
    const outgoingIndex = getHomeEpisodeOutgoingIndex(homeEpisodeCarousel.currentIndex, direction, homeEpisodeCarousel.maxIndex);
    const outgoingEpisode = featuredEpisodes[outgoingIndex];
    const incomingEpisode = featuredEpisodes[homeEpisodeCarousel.currentIndex];
    const animationDuration = HOME_EPISODE_ANIMATION_MS;

    homeEpisodeCarouselShell.innerHTML = renderHomeEpisodeMobileTransitionMarkup(outgoingEpisode, incomingEpisode, direction);
    const mobileViewport = homeEpisodeCarouselShell.querySelector('.home-episode-carousel-viewport');
    const mobileStrip = homeEpisodeCarouselShell.querySelector('.home-episode-mobile-transition-strip');
    if (!(mobileViewport instanceof HTMLElement) || !(mobileStrip instanceof HTMLElement)) {
      mount();
      homeEpisodeCarouselAnimating = false;
      return;
    }

    const lockedHeight = mobileViewport.getBoundingClientRect().height;
    if (lockedHeight > 0) {
      mobileViewport.style.height = `${lockedHeight}px`;
    }

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        mobileStrip.classList.add('is-animating');
        mobileStrip.style.transform = direction > 0
          ? 'translate3d(-50%, 0, 0)'
          : 'translate3d(0, 0, 0)';
      });
    });

    homeEpisodeCarouselAnimationTimer = window.setTimeout(() => {
      mount();
      scrollWindowInstantly(currentScrollY, currentScrollX);
      homeEpisodeCarouselAnimating = false;
      homeEpisodeCarouselAnimationTimer = 0;
    }, animationDuration);
    return;
  }

  const currentScrollY = window.scrollY;
  const currentScrollX = window.scrollX;
  const animationDuration = HOME_EPISODE_DESKTOP_ANIMATION_MS;
  const outgoingIndex = getHomeEpisodeOutgoingIndex(homeEpisodeCarousel.currentIndex, direction, homeEpisodeCarousel.maxIndex);
  const outgoingEpisodes = visibleEpisodeWindow(featuredEpisodes, outgoingIndex, homeEpisodeCarousel.visibleCount);
  const incomingEpisodes = homeEpisodeCarousel.visibleEpisodes;

  homeEpisodeCarouselShell.innerHTML = renderHomeEpisodeCarouselMarkup(homeEpisodeCarousel, featuredEpisodes, {
    mobilePreview: false
  });

  const liveViewport = homeEpisodeCarouselShell.querySelector('.home-episode-carousel-viewport');
  const lockedHeight = liveViewport instanceof HTMLElement ? liveViewport.getBoundingClientRect().height : 0;

  homeEpisodeCarouselShell.innerHTML = renderHomeEpisodeDesktopTransitionMarkup(
    outgoingEpisodes,
    incomingEpisodes,
    homeEpisodeCarousel.visibleCount,
    direction,
    featuredEpisodes.length
  );

  const desktopViewport = homeEpisodeCarouselShell.querySelector('.home-episode-carousel-viewport');
  const desktopStrip = homeEpisodeCarouselShell.querySelector('.home-episode-desktop-transition-strip');
  if (!(desktopViewport instanceof HTMLElement) || !(desktopStrip instanceof HTMLElement)) {
    mount();
    scrollWindowInstantly(currentScrollY, currentScrollX);
    homeEpisodeCarouselAnimating = false;
    return;
  }

  if (lockedHeight > 0) {
    desktopViewport.style.height = `${lockedHeight}px`;
  }

  window.requestAnimationFrame(() => {
    desktopStrip.classList.add('is-animating');
    desktopStrip.style.transform = direction > 0
      ? 'translate3d(-50%, 0, 0)'
      : 'translate3d(0, 0, 0)';
  });

  homeEpisodeCarouselAnimationTimer = window.setTimeout(() => {
    mount();
    scrollWindowInstantly(currentScrollY, currentScrollX);
    homeEpisodeCarouselAnimating = false;
    homeEpisodeCarouselAnimationTimer = 0;
  }, animationDuration);
}

function renderHome(focusSectionId = '') {
  const isMobile = useMobileHomeLayout();
  homeEpisodeCarouselIndex = 0;
  const featuredEpisodes = getHomeFeaturedEpisodes();
  lastHomeMobileLayout = isMobile;
  const peopleCount = getPeopleKeywords(PERSON_NAV_MIN_REFERENCES).length;
  const statCards = [
    {
      href: '#/episodes',
      value: site.stats.episodes,
      label: '节目索引',
      tone: 'episodes'
    },
    {
      href: '#/concepts',
      value: site.stats.concepts,
      label: '概念卡片',
      tone: 'concepts'
    },
    {
      href: '#/models',
      value: site.stats.models,
      label: '思想模型',
      tone: 'models'
    },
    {
      href: '#/people',
      value: peopleCount,
      label: '人物',
      tone: 'people'
    }
  ];
  const visibleStatCards = isMobile
    ? []
    : statCards;
  const heroFireworksMarkup = !isMobile ? `
    <div class="hero-fireworks" id="hero-fireworks" aria-hidden="true">
      <div class="hero-firework-burst burst-center">
        ${Array.from({ length: 14 }, (_, index) => `<span class="hero-firework-particle center-${index + 1}"></span>`).join('')}
      </div>
    </div>
  ` : '';
  const heroMobileAvatarMarkup = isMobile ? `
    <a class="hero-mobile-avatar-link" href="#/" aria-label="返回首页">
      <img
        class="hero-mobile-avatar"
        src="./assets/yinfluence-avatar.png"
        alt="颖响力头像"
        width="54"
        height="54"
        loading="eager"
        decoding="async"
      >
    </a>
  ` : '';
  const homeSearchToolbarMarkup = `
    <div class="home-search-toolbar${isMobile ? ' mobile' : ''}">
      <div class="search-row">
        <input id="search-input" type="text" placeholder="搜索知识库：节目、概念、模型、人物、主题，如 EP019 / 特朗普 / 安全阀治理">
        <button id="search-submit" class="search-submit" type="button">搜索</button>
      </div>
    </div>
  `;
  const homeSearchSectionMarkup = `
    <section class="home-search-section${isMobile ? ' home-search-section-after-episodes' : ''}">
      <div class="home-search-results-panel">
        <div class="search-subtitle-row">
          <p id="home-search-title" class="search-subtitle">推荐关键词</p>
          <button id="home-search-reroll" class="search-reroll" type="button" aria-label="换一换首页推荐">
            <span class="search-reroll-icon" aria-hidden="true">↻</span>
            <span>换一换</span>
          </button>
        </div>
        <div id="home-search-results" class="search-results"></div>
      </div>
    </section>
  `;
  const episodeSectionMarkup = `
    <section id="home-episodes" class="section${isMobile ? ' home-episodes-priority' : ''}">
      <div class="home-episode-carousel-shell${isMobile ? ' mobile' : ''}"></div>
    </section>
  `;
  const homeTopSectionsMarkup = isMobile
    ? `${episodeSectionMarkup}${homeSearchSectionMarkup}`
    : `${homeSearchSectionMarkup}${episodeSectionMarkup}`;
  const desktopReferenceSectionsMarkup = `
    <section class="section split">
      <div>
        <div class="section-header">
          <h2 class="section-title">概念入口</h2>
          <a class="section-note" href="#/concepts">查看全部概念</a>
        </div>
        <div id="home-recommended-concepts" class="list">
          ${renderHomeReferenceCards('concepts', getRecommendedConcepts(3))}
        </div>
        <div class="home-reference-footer">
          <button class="search-reroll home-reference-reroll" type="button" data-home-reference-reroll="concepts" aria-label="换一换概念推荐">
            <span class="search-reroll-icon" aria-hidden="true">↻</span>
            <span>换一换</span>
          </button>
        </div>
      </div>
      <div>
        <div class="section-header">
          <h2 class="section-title">思想模型</h2>
          <a class="section-note" href="#/models">查看全部模型</a>
        </div>
        <div id="home-recommended-models" class="list">
          ${renderHomeReferenceCards('models', getRecommendedModels(3))}
        </div>
        <div class="home-reference-footer">
          <button class="search-reroll home-reference-reroll" type="button" data-home-reference-reroll="models" aria-label="换一换模型推荐">
            <span class="search-reroll-icon" aria-hidden="true">↻</span>
            <span>换一换</span>
          </button>
        </div>
      </div>
    </section>

    <section class="section">
      <div class="section-header">
        <h2 class="section-title">知识图谱</h2>
        <a class="section-note" href="#/graph">进入图谱视图</a>
      </div>
      <div class="grid cards-2">
        <article class="card graph-preview-card" data-card-href="#/graph">
          <p class="card-kicker">Graph View · ${graphData?.meta?.linkCount || 0} 条连接</p>
          <a class="card-primary-link" href="#/graph">
            <h3>从节目跳到概念，再跳到人物与主题</h3>
          </a>
          <p>这张图把五类核心节点放进同一个可视化网络里，适合先看结构密度，再回到单条目做细读。</p>
          ${graphLinkedChipList([
            `节目 ${site.stats.episodes}`,
            `概念 ${site.stats.concepts}`,
            `模型 ${site.stats.models}`,
            `人物 ${site.stats.people}`,
            `主题 ${site.stats.themes}`
          ])}
        </article>
        <article class="card graph-guide-card" data-card-href="#/graph">
          <p class="card-kicker">How To Read</p>
          <a class="card-primary-link" href="#/graph">
            <h3>先找高连接节点，再顺着局部关系钻进去</h3>
          </a>
          <p>图谱适合回答两个问题：哪些主题经常和哪些节目一起出现，以及某个人物或模型究竟被放在什么语境里讲。</p>
        ${graphLinkedChipList(['点击节点展开', '再次点击进详情', '返回恢复展开'])}
        </article>
      </div>
    </section>
  `;

  app.innerHTML = `
    <section class="hero">
      <div class="hero-title-row${isMobile ? ' has-mobile-avatar' : ''}">
        <h1>
          <button id="hero-title-trigger" class="hero-title-trigger" type="button">
            <span class="hero-title-primary">颖响力</span>
            <span class="hero-title-secondary">知识库</span>
          </button>
        </h1>
        ${heroMobileAvatarMarkup}
        ${heroFireworksMarkup}
      </div>
      <div class="hero-platform-links">
        ${HOME_PLATFORM_LINKS.map((link) => renderVideoLinkIcon(link)).join('')}
      </div>
      ${visibleStatCards.length ? `
        <div class="stats">
          ${visibleStatCards.map((item) => `
            <a class="stat-card" href="${item.href}" data-stat-tone="${item.tone}">
              <div class="stat-value">${item.value}</div>
              <div class="stat-label">${item.label}</div>
            </a>
          `).join('')}
        </div>
      ` : ''}
    </section>

    ${homeSearchToolbarMarkup}
    ${homeTopSectionsMarkup}
    ${isMobile ? '' : desktopReferenceSectionsMarkup}
  `;

  const searchInput = document.getElementById('search-input');
  const searchSubmit = document.getElementById('search-submit');
  const homeSearchToolbar = document.querySelector('.home-search-toolbar');
  searchInput.value = homeKnowledgeQuery;
  searchInput.addEventListener('input', (event) => {
    homeKnowledgeQuery = event.target.value;
    if (homeKnowledgeQuery.trim()) {
      revealHomeSearchForQuery();
    }
    renderKnowledgeSuggestions({
      containerId: 'home-search-results',
      titleId: 'home-search-title',
      query: homeKnowledgeQuery,
      emptyMessage: '没有匹配的节目、概念、模型、人物或主题',
      idleTitle: '推荐关键词'
    });
  });
  searchInput.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    openFirstSearchMatch(homeKnowledgeQuery);
  });
  searchSubmit.addEventListener('click', () => {
    openFirstSearchMatch(homeKnowledgeQuery);
  });
  renderKnowledgeSuggestions({
    containerId: 'home-search-results',
    titleId: 'home-search-title',
    query: homeKnowledgeQuery,
    emptyMessage: '没有匹配的节目、概念、模型、人物或主题',
    idleTitle: '推荐关键词'
  });
  document.getElementById('home-search-reroll')?.addEventListener('click', () => {
    rerollHomeRecommendations();
  });
  app.querySelectorAll('[data-home-reference-reroll]').forEach((button) => {
    button.addEventListener('click', () => {
      rerollHomeReferenceRecommendations(button.dataset.homeReferenceReroll);
    });
  });

  const heroTitleTrigger = document.getElementById('hero-title-trigger');
  const heroFireworks = document.getElementById('hero-fireworks');
  if (heroTitleTrigger && heroFireworks && !isMobile) {
    heroTitleTrigger.addEventListener('click', () => {
      heroFireworks.classList.remove('is-bursting');
      void heroFireworks.offsetWidth;
      heroFireworks.classList.add('is-bursting');
      window.setTimeout(() => {
        heroFireworks.classList.remove('is-bursting');
      }, 1100);
    });
  }

  if (homeSearchToolbar && !isMobile) {
    setupHomeSearchToolbarBehavior(homeSearchToolbar);
  }

  renderHomeEpisodeCarousel();

  if (floatingActionsExpanded) {
    scheduleFloatingActionsAutoCollapse();
  }
  app.querySelectorAll('.card[data-card-href]').forEach((card) => {
    card.addEventListener('click', (event) => {
      if (event.target.closest('a, button, input, textarea, select, summary')) return;
      const href = card.dataset.cardHref;
      if (!href) return;
      window.location.hash = href;
    });
  });

  scrollToSection(focusSectionId);
}

function renderGraphPage() {
  if (!graphData) {
    renderNotFound('知识图谱数据尚未生成，请先执行构建。');
    return;
  }

  renderGraphView({
    container: app,
    graph: graphData,
    toHash: routeTo
  });
}

function renderEpisodeIndex() {
  const isMobile = window.matchMedia('(max-width: 768px)').matches;
  const searchPlaceholder = isMobile ? '搜 EP031 / 伊朗 / 西贝' : '搜索节目：EP031 / 伊朗 / 西贝为什么这么贵';
  const episodesByNumber = [...site.episodes].sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));
  const episodeRanges = buildEpisodeRanges(episodesByNumber);
  const selectedRange = episodeRanges.find((range) => range.start === episodeIndexRangeStart) || episodeRanges[0];
  const selectedIndex = Math.max(0, episodeRanges.findIndex((range) => range.start === selectedRange.start));
  const previousRange = selectedIndex > 0 ? episodeRanges[selectedIndex - 1] : episodeRanges[episodeRanges.length - 1] || null;
  const nextRange = selectedIndex < episodeRanges.length - 1 ? episodeRanges[selectedIndex + 1] : episodeRanges[0] || null;
  const isSearchOpen = episodeIndexSearchMode;
  const liveEpisodeQuery = String(episodeIndexAppliedQuery || '').trim() || String(episodeIndexQuery || '').trim();
  const initialSearchState = getEpisodeIndexSearchState(episodesByNumber, selectedRange, liveEpisodeQuery);
  const shouldHideEpisodeResults = isSearchOpen && !liveEpisodeQuery;
  const shouldShowFooterNav = !String(episodeIndexAppliedQuery || '').trim();
  const rangeControlsMarkup = `
    <div class="episode-range-wheel${isMobile ? ' mobile' : ''}" aria-label="节目分组轮盘">
      ${episodeRanges.map((range, index) => `
        <button
          class="episode-range-wheel-option${index === selectedIndex ? ' active' : ''}"
          type="button"
          data-episode-range="${range.start}"
          data-range-wheel-item="true"
          aria-label="切换到区间 ${range.label}"
          aria-pressed="${index === selectedIndex ? 'true' : 'false'}"
        >${escapeHtml(`${range.label}集`)}</button>
      `).join('')}
    </div>
  `;
  const searchToggleMarkup = `
    <button
      id="episode-index-search-toggle"
      class="episode-search-toggle"
      type="button"
      aria-label="打开节目搜索"
    >
      <span class="episode-search-toggle-icon" aria-hidden="true">
        <svg class="episode-search-toggle-svg" viewBox="0 0 24 24" focusable="false" aria-hidden="true">
          <circle cx="10.5" cy="10.5" r="5.75"></circle>
          <path d="M14.8 14.8L19.6 19.6"></path>
        </svg>
      </span>
    </button>
  `;
  const footerNavMarkup = `
    <div class="episode-range-footer-nav">
      <button class="range-nav-button range-footer-button" type="button" data-episode-range="${previousRange?.start ?? ''}">${escapeHtml(previousRange ? `${previousRange.label}集` : '—')}</button>
      <button class="range-nav-button range-footer-button" type="button" data-episode-range="${nextRange?.start ?? ''}">${escapeHtml(nextRange ? `${nextRange.label}集` : '—')}</button>
    </div>
  `;
  const toolbarMarkup = `
    <div class="episode-index-toolbar-shell">
      <div class="episode-index-toolbar${isMobile ? ' mobile' : ''}${isSearchOpen ? ' is-search-open' : ''}">
        <div class="episode-toolbar-main${isSearchOpen ? ' is-search-open' : ' is-search-collapsed'}">
          ${isSearchOpen
            ? `
              <div class="episode-search-panel${isMobile ? ' mobile' : ''}">
                <div class="search-row episode-search-row${isMobile ? ' mobile' : ''}">
                  <input id="episode-index-search" type="text" placeholder="${escapeHtml(searchPlaceholder)}">
                  <button id="episode-index-search-clear" class="search-clear${isMobile ? ' mobile' : ''}${episodeIndexQuery ? '' : ' hidden'}" type="button">清空</button>
                </div>
                <div id="episode-index-suggestions" class="episode-index-suggestions hidden"></div>
              </div>
            `
            : `
              <div class="episode-range-wheel-wrap">
                ${rangeControlsMarkup}
              </div>
              ${searchToggleMarkup}
            `}
        </div>
      </div>
    </div>
  `;
  const episodeSectionMarkup = `
    <section class="detail-section episode-index-section${shouldHideEpisodeResults ? ' hidden' : ''}">
      <div id="episode-index-results">${renderEpisodeIndexEpisodeList(initialSearchState.filteredEpisodes)}</div>
      ${shouldShowFooterNav ? footerNavMarkup : ''}
    </section>
  `;

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header${isSearchOpen ? ' hidden' : ''}">
        <div class="detail-back-row">
          <button type="button" class="back-link back-button" data-nav-back="true">← 返回前一页</button>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <h1 class="detail-title">节目索引</h1>
      </div>
      ${toolbarMarkup}
      ${episodeSectionMarkup}
    </section>
  `;

  const searchInput = document.getElementById('episode-index-search');
  const episodeSection = document.querySelector('.episode-index-section');
  const resultsContainer = document.getElementById('episode-index-results');
  const clearButton = document.getElementById('episode-index-search-clear');
  const suggestionsContainer = document.getElementById('episode-index-suggestions');
  const toolbar = document.querySelector('.episode-index-toolbar');
  const rangeWheel = document.querySelector('.episode-range-wheel');
  const searchToggle = document.getElementById('episode-index-search-toggle');
  const activeRangeButton = document.querySelector('.episode-range-wheel [data-range-wheel-item].active');
  let isComposing = false;

  const scheduleSearchAutoHide = () => {
    clearEpisodeIndexSearchAutoHideTimer();
  };

  const updateEpisodeSearchResults = () => {
    const scrollY = window.scrollY;
    const effectiveQuery = String(episodeIndexAppliedQuery || '').trim() || String(episodeIndexQuery || '').trim();
    const hasAppliedQuery = Boolean(effectiveQuery);
    const nextState = getEpisodeIndexSearchState(episodesByNumber, selectedRange, effectiveQuery);
    if (clearButton) {
      clearButton.classList.toggle('hidden', !String(episodeIndexQuery || '').trim());
    }
    if (episodeSection) {
      episodeSection.classList.toggle('hidden', episodeIndexSearchMode && !hasAppliedQuery);
    }
    if (resultsContainer) {
      resultsContainer.innerHTML = renderEpisodeIndexEpisodeList(nextState.filteredEpisodes);
    }
    renderEpisodeIndexSuggestions(episodeIndexQuery);
    renderSectionProgress();

    window.requestAnimationFrame(() => {
      window.scrollTo(window.scrollX, scrollY);
      syncSectionProgress();
    });

    scheduleSearchAutoHide();
  };

  resultsContainer?.addEventListener('click', (event) => {
    const directEpisodeLink = event.target.closest('.card-primary-link');
    if (directEpisodeLink && resultsContainer.contains(directEpisodeLink)) {
      event.preventDefault();
      navigateToEpisodeFromElement(directEpisodeLink);
      return;
    }

    const episodeCard = event.target.closest('.episode-index-card[data-episode-href]');
    if (!episodeCard || !resultsContainer.contains(episodeCard)) return;
    if (event.target.closest('.chip, button, input, textarea, select, summary, a')) return;
    navigateToEpisodeFromElement(episodeCard);
  });

  if (searchInput) {
    searchInput.value = episodeIndexQuery;
    searchInput.addEventListener('focus', () => {
      renderEpisodeIndexSuggestions(episodeIndexQuery);
      scheduleSearchAutoHide();
    });
    searchInput.addEventListener('compositionstart', () => {
      isComposing = true;
    });
    searchInput.addEventListener('compositionend', (event) => {
      isComposing = false;
      episodeIndexQuery = event.target.value;
      episodeIndexAppliedQuery = '';
      updateEpisodeSearchResults();
    });
    searchInput.addEventListener('input', (event) => {
      episodeIndexQuery = event.target.value;
      episodeIndexAppliedQuery = '';
      if (isComposing || event.isComposing) return;
      updateEpisodeSearchResults();
    });
    searchInput.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') return;

      const directEpisodeId = normalizeEpisodeIdQuery(episodeIndexQuery);
      if (directEpisodeId) {
        const foundEpisode = site.episodes.find((episode) => episode.id === directEpisodeId);
        if (!foundEpisode) return;
        clearEpisodeIndexSearchOrigin();
        window.location.hash = routeTo(`episodes/${foundEpisode.id}`);
        return;
      }

      const [firstSuggestion] = getEpisodeIndexSuggestionMatches(episodeIndexQuery);
      if (!firstSuggestion) return;
      event.preventDefault();
      clearEpisodeIndexSearchOrigin();
      window.location.hash = firstSuggestion.route;
    });
  }

  clearButton?.addEventListener('click', () => {
    episodeIndexQuery = '';
    episodeIndexAppliedQuery = '';
    if (searchInput) {
      searchInput.value = '';
      searchInput.focus({ preventScroll: true });
    }
    updateEpisodeSearchResults();
  });

  suggestionsContainer?.addEventListener('click', (event) => {
    const rerollButton = event.target.closest('#episode-index-reroll');
    if (rerollButton) {
      event.preventDefault();
      event.stopPropagation();
      homeRecommendationSeed = Math.floor(Math.random() * 1000000);
      renderEpisodeIndexSuggestions(episodeIndexQuery);
      return;
    }
    const applyQueryButton = event.target.closest('[data-episode-index-action="apply-query"]');
    if (applyQueryButton instanceof HTMLElement) {
      event.preventDefault();
      event.stopPropagation();
      const nextQuery = applyQueryButton.dataset.episodeIndexSuggestion || '';
      if (!nextQuery) return;
      episodeIndexQuery = nextQuery;
      episodeIndexAppliedQuery = nextQuery;
      episodeIndexSearchMode = true;
      clearEpisodeIndexSearchOrigin();
      renderEpisodeIndex();
      window.requestAnimationFrame(() => {
        scrollEpisodeResultsIntoView();
      });
      return;
    }
    const button = event.target.closest('[data-episode-index-route]');
    if (!(button instanceof HTMLElement)) return;
    event.preventDefault();
    event.stopPropagation();
    const nextRoute = button.dataset.episodeIndexRoute || '';
    if (!nextRoute) return;
    clearEpisodeIndexSearchOrigin();
    window.location.hash = nextRoute;
  });

  document.querySelectorAll('[data-episode-range]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!button.dataset.episodeRange) return;
      episodeIndexRangeStart = Number(button.dataset.episodeRange);
      renderEpisodeIndex();
      renderSectionProgress();
      window.requestAnimationFrame(() => {
        syncSectionProgress();
      });
      scrollEpisodeResultsIntoView();
    });
  });

  if (activeRangeButton instanceof HTMLElement) {
    window.requestAnimationFrame(() => {
      centerActiveEpisodeRangeButton(activeRangeButton);
    });
  }

  if (isSearchOpen) {
    renderEpisodeIndexSuggestions(episodeIndexQuery);
  }

  searchToggle?.addEventListener('click', (event) => {
    event.preventDefault();
    event.stopPropagation();
    episodeIndexSearchOriginHash = '#/episodes';
    episodeIndexSearchOriginScrollY = window.scrollY;
    episodeIndexSearchMode = true;
    episodeIndexFocusSearchOnRender = true;
    renderEpisodeIndex();
  });

  if (rangeWheel instanceof HTMLElement) {
    setupEpisodeRangeWheelDrag(rangeWheel);
  }

  if (toolbar) {
    setupEpisodeToolbarBehavior(toolbar);
  }

  if (isSearchOpen) {
    clearEpisodeIndexSearchAutoHideTimer();
  } else {
    clearEpisodeIndexSearchAutoHideTimer();
  }

  episodeIndexSearchController?.abort();
  if (isSearchOpen) {
    const controller = new AbortController();
    episodeIndexSearchController = controller;
    const { signal } = controller;

    document.addEventListener('click', (event) => {
      if (toolbar?.contains(event.target)) return;
      if (!episodeIndexSearchMode) return;
      const shouldRestoreOrigin = Boolean(episodeIndexSearchOriginHash && !String(episodeIndexAppliedQuery || '').trim());
      if (!String(episodeIndexAppliedQuery || '').trim()) {
        episodeIndexQuery = '';
      } else {
        episodeIndexQuery = episodeIndexAppliedQuery;
        clearEpisodeIndexSearchOrigin();
      }
      episodeIndexSearchMode = false;
      if (shouldRestoreOrigin) {
        restoreEpisodeIndexSearchOrigin();
        return;
      }
      renderEpisodeIndex();
    }, { signal });
  } else {
    episodeIndexSearchController = null;
  }

  if (searchInput && episodeIndexFocusSearchOnRender) {
    episodeIndexFocusSearchOnRender = false;
    window.requestAnimationFrame(() => {
      searchInput.focus({ preventScroll: true });
    });
  }
}

function renderConceptIndex() {
  renderCategorizedReferenceIndex({
    type: 'concepts',
    title: '概念',
    eyebrow: 'Concept Cards',
    summary: '按概念聚合分散在不同节目里的同类现象，适合在已知问题、但暂时想不起具体节目的情况下快速回看相关讨论。',
    collection: site.concepts
  });
}

function renderKeywordIndex() {
  const sortedKeywords = [...site.keywords].sort((a, b) => keywordCount(b) - keywordCount(a) || a.name.localeCompare(b.name, 'zh-Hans-CN'));
  const visibleKeywords = sortedKeywords.filter((keyword) => keywordCount(keyword) >= 2);
  const selectedKind = normalizeKeywordKind(parseHashRoute(window.location.hash).query.kind);
  const groupedKeywords = new Map(KEYWORD_KIND_ORDER.map((kind) => [kind, []]));
  visibleKeywords.forEach((keyword) => {
    const kind = normalizeKeywordKind(inferKeywordKind(keyword)) || 'general';
    if (!groupedKeywords.has(kind)) groupedKeywords.set(kind, []);
    groupedKeywords.get(kind).push(keyword);
  });
  const keywordSections = keywordIndexTopGroups()
    .map((group) => {
      const kindEntries = group.kinds
        .map((kind) => [kind, groupedKeywords.get(kind) || []])
        .filter(([, items]) => items.length);
      if (!kindEntries.length) return '';
      return renderKeywordTopGroup(group.title, kindEntries, {
        open: selectedKind ? group.kinds.includes(selectedKind) : false,
        selectedKind
      });
    })
    .filter(Boolean)
    .join('');

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        <a class="back-link" href="#/">← 返回首页</a>
        <p class="detail-eyebrow">Keywords</p>
        <h1 class="detail-title">关键词</h1>
        <p class="detail-summary">这里整理的是已经形成稳定讨论线的关键词入口。先按人物机构、地区事件、产业资产、概念机制和长期主题收起，展开后再进入更细的关键词分组。</p>
      </div>
      <section class="detail-section">
        ${keywordSections}
      </section>
    </section>
  `;

  if (selectedKind) {
    window.requestAnimationFrame(() => {
      const group = app.querySelector(`[data-keyword-kind-group="${selectedKind}"]`);
      if (!(group instanceof HTMLDetailsElement)) return;
      group.open = true;
      const top = Math.max(window.scrollY + group.getBoundingClientRect().top - 24, 0);
      scrollWindowInstantly(top, 0);
    });
  }
}

function keywordIndexTopGroups() {
  return [
    { title: '人物机构', kinds: ['person', 'organization'] },
    { title: '地区事件', kinds: ['geography', 'event'] },
    { title: '产业资产', kinds: ['product', 'asset'] },
    { title: '概念机制', kinds: ['mechanism', 'concept'] },
    { title: '长期主题', kinds: ['theme', 'general'] }
  ];
}

function renderModelIndex() {
  renderCategorizedReferenceIndex({
    type: 'models',
    title: '思想模型',
    eyebrow: 'Mental Models',
    summary: '按思想模型整理节目中的判断框架，适合从具体议题回到更底层的结构、机制与判断逻辑。',
    collection: site.models
  });
}

function renderEpisodeDetail(id) {
  const episode = site.episodes.find((item) => item.id === id);
  if (!episode) {
    renderNotFound('节目不存在');
    return;
  }

  if (!episode.curated) {
    app.innerHTML = `
      <section class="detail">
        <div class="detail-header">
          ${renderEpisodeTopNavigation(episode.id)}
          <div class="back-row">
            <button type="button" class="back-link back-button" data-nav-back="true">← 返回前一页</button>
            <a class="back-link secondary" href="#/">返回首页</a>
          </div>
          <h1 class="detail-title">${escapeHtml(episode.id)}｜${escapeHtml(displayEpisodeTitle(episode.title))}${renderEpisodeFreshBadge(episode)}</h1>
          <p class="detail-summary">这条节目已经进入网页索引，但还没有整理成结构化知识条目。</p>
        </div>
        <section class="detail-section">
          <p>当前状态：待整理。</p>
          <p class="subtle">你后续可以按同样的 episodes / concepts / models 结构继续扩充。</p>
        </section>
      </section>
    `;
    return;
  }

  const relatedConcepts = (episode.concepts || [])
    .map((conceptId) => site.concepts.find((item) => item.id === conceptId))
    .filter(Boolean);
  const relatedModels = (episode.models || [])
    .map((modelId) => site.models.find((item) => item.id === modelId))
    .filter(Boolean);
  const relatedEpisodes = (episode.relatedEpisodes || [])
    .map((episodeId) => site.episodes.find((item) => item.id === episodeId))
    .filter(Boolean)
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));
  const relatedPeopleChips = linkedChipList('keywords', episode.people, site.keywords);
  const relatedThemeChips = linkedChipList('themes', episode.themes, site.themes);
  const hasKnowledgeLinks = relatedConcepts.length || relatedModels.length;
  const hasTailLinks = (episode.people || []).length || (episode.themes || []).length || relatedEpisodes.length;

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header">
        ${renderEpisodeTopNavigation(episode.id)}
        <div class="back-row">
          <button type="button" class="back-link back-button" data-nav-back="true">← 返回前一页</button>
          <a class="back-link secondary" href="#/">返回首页</a>
        </div>
        <h1 class="detail-title">${escapeHtml(episode.id)}｜${escapeHtml(displayEpisodeTitle(episode.title))}${renderEpisodeFreshBadge(episode)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(episode.summary)}</p>
        ${renderEpisodeHeaderMeta(episode)}
      </div>

      <section class="detail-section">
        <h2>话题</h2>
        ${accordionItem('事件背景', renderParagraphText(episode.topic.background), true)}
        ${accordionItem('核心矛盾', renderLinkedEpisodeList(episode.topic.conflicts))}
        ${accordionItem('讨论边界', renderLinkedEpisodeList(episode.topic.boundaries))}
        ${accordionItem('机制推演', renderParagraphText(episode.topic.mechanism))}
        ${accordionItem('延展话题', renderLinkedEpisodeList(episode.topic.extensions))}
      </section>

      <section class="detail-section">
        <h2>核心观点</h2>
        ${episode.viewpoints.map((viewpoint, index) => accordionItem(
          viewpoint.title,
          renderParagraphText(viewpoint.body),
          index === 0
        )).join('')}
      </section>

      ${hasKnowledgeLinks ? `
        <section class="detail-section split">
          ${relatedConcepts.length ? `
            <div>
              <h2>关联概念</h2>
              <div class="list">
                ${relatedConcepts.map((concept) => `
                  <a class="list-item" href="${routeTo(`concepts/${concept.id}`)}">
                    <h3>${escapeHtml(concept.name)}</h3>
                    <p>${escapeHtml(concept.summary)}</p>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
          ${relatedModels.length ? `
            <div>
              <h2>关联模型</h2>
              <div class="list">
                ${relatedModels.map((model) => `
                  <a class="list-item" href="${routeTo(`models/${model.id}`)}">
                    <h3>${escapeHtml(model.name)}</h3>
                    <p>${escapeHtml(model.summary)}</p>
                  </a>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </section>
      ` : ''}

      <section class="detail-section">
        <h2>延展</h2>
        ${renderLinkedEpisodeList(episode.extensions)}
        ${hasTailLinks ? `
          ${(episode.people || []).length ? `<h3>关联人物</h3>${relatedPeopleChips}` : ''}
          ${(episode.themes || []).length ? `<h3>关联主题</h3>${relatedThemeChips}` : ''}
          ${relatedEpisodes.length ? `
            <h3>关联节目</h3>
            <div class="list">
              ${relatedEpisodes.map((item) => `
                <a class="list-item" href="${routeTo(`episodes/${item.id}`)}">
                  <h3>${escapeHtml(item.id)}｜${escapeHtml(displayEpisodeTitle(item.title))}</h3>
                  <p>${escapeHtml(item.summary || '待整理')}</p>
                </a>
              `).join('')}
            </div>
          ` : ''}
        ` : ''}
      </section>
    </section>
  `;
}

function renderPeopleIndex() {
  renderCategorizedReferenceIndex({
    type: 'people',
    routeType: 'keywords',
    title: '人物',
    eyebrow: 'People In Keywords',
    summary: '按人物聚合其在知识库中的相关节目与议题，适合快速回看某个人物是在什么语境里被反复讨论的。',
    collection: getPeopleKeywords(PERSON_NAV_MIN_REFERENCES),
    minimumReferences: PERSON_NAV_MIN_REFERENCES
  });
}

function renderThemesIndex() {
  renderCategorizedReferenceIndex({
    type: 'themes',
    title: '关联主题',
    eyebrow: 'Themes',
    summary: '按主题串联多期节目，适合从一条长期问题线出发，连续查看相关节目及其延伸讨论。',
    collection: site.themes
  });
}

function renderDetailList(items = []) {
  return renderLinkedEpisodeList(items);
}

function renderLinkedEpisodeList(items = []) {
  if (!items.length) return '';
  return `<ul>${items.map((item) => `<li>${renderLinkedEpisodeText(item)}</li>`).join('')}</ul>`;
}

function renderParagraphText(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  return raw
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${renderLinkedEpisodeText(paragraph.trim())}</p>`)
    .join('');
}

function renderHighlightCards(items = []) {
  if (!items.length) return '';
  return `
    <div class="list">
      ${items.map((item) => `
        <a class="list-item" href="${routeTo(`episodes/${item.id}`)}">
          <h3>${escapeHtml(item.id)}｜${escapeHtml(displayEpisodeTitle(item.title))}</h3>
          <p>${renderLinkedEpisodeText(item.note || item.summary || '')}</p>
          ${item.summary && item.summary !== item.note ? `<p class="subtle">${renderLinkedEpisodeText(item.summary)}</p>` : ''}
          ${item.mechanism ? `<p class="subtle">机制线：${escapeHtml(item.mechanism)}</p>` : ''}
        </a>
      `).join('')}
    </div>
  `;
}

function stripAnchorSentence(value) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  return text
    .replace(/\s*当前最直接的节目锚点是[^。！？]*[。！？]?/g, '')
    .replace(/\s*目前最直接的节目锚点是[^。！？]*[。！？]?/g, '')
    .replace(/\s*当前最直接的锚点是[^。！？]*[。！？]?/g, '')
    .replace(/\s*目前最直接的锚点是[^。！？]*[。！？]?/g, '')
    .trim();
}

function stripThemeBoilerplate(value) {
  const text = stripAnchorSentence(value);
  if (!text) return '';
  return text
    .replace(/\s*这类主题页的作用[^。！？]*[。！？]?/g, '')
    .trim();
}

function resolveConceptScenePatterns(concept) {
  if (Array.isArray(concept.scenePatterns) && concept.scenePatterns.length) {
    return concept.scenePatterns
      .map((pattern) => ({
        title: String(pattern?.title || '').trim(),
        body: String(pattern?.body || '').trim()
      }))
      .filter((pattern) => pattern.title && pattern.body);
  }

  const context = stripAnchorSentence(concept.context);
  return context
    ? [
      {
        title: '在颖响力里的常见场景',
        body: context
      }
    ]
    : [];
}

function resolveKnowledgeEpisodeRelations(entry) {
  if (Array.isArray(entry.episodeRelations) && entry.episodeRelations.length) {
    return entry.episodeRelations;
  }

  const highlightMap = new Map((entry.episodeHighlights || []).map((item) => [item.id, item]));
  return (entry.episodes || []).map((episode) => {
    const highlight = highlightMap.get(episode.id) || {};
    return {
      id: episode.id,
      angle: episode.angle || highlight.angle || '',
      relevance: episode.relevance || highlight.relevance || highlight.note || episode.note || '',
      summary: episode.summary || highlight.summary || '',
      mechanism: episode.mechanism || highlight.mechanism || ''
    };
  });
}

function buildRelatedEpisodeEntries(references = [], overrides = []) {
  const seen = new Set();
  const overrideMap = new Map((overrides || []).map((item) => [item.id, item]));
  return (references || [])
    .map((entry) => {
      if (seen.has(entry.id)) return null;
      seen.add(entry.id);
      const episode = site.episodes.find((item) => item.id === entry.id);
      if (!episode) return null;
      const override = overrideMap.get(entry.id) || {};
      return {
        ...episode,
        relationNote: override.relevance || override.note || entry.relevance || entry.note || '',
        relationSummary: override.summary || entry.summary || '',
        relationMechanism: override.mechanism || entry.mechanism || ''
      };
    })
    .filter(Boolean)
    .sort((a, b) => episodeNumberFromId(b.id) - episodeNumberFromId(a.id));
}

function collectReferencedItemsFromEpisodes(episodes = [], field, collection = [], options = {}) {
  const limit = options.limit || 6;
  const counts = new Map();
  const firstSeen = new Map();

  for (const episode of episodes || []) {
    const values = episode?.[field] || [];
    for (const value of values) {
      const found = options.resolve
        ? options.resolve(value)
        : collection.find((item) => normalizeValue(item.id) === normalizeValue(value) || normalizeValue(item.name) === normalizeValue(value));
      if (!found) continue;
      const id = found.id;
      counts.set(id, (counts.get(id) || 0) + 1);
      if (!firstSeen.has(id)) firstSeen.set(id, firstSeen.size);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || firstSeen.get(a[0]) - firstSeen.get(b[0]))
    .slice(0, limit)
    .map(([id]) => id);
}

function mergeReferenceIds(...groups) {
  const ids = [];
  const seen = new Set();
  for (const group of groups) {
    for (const value of group || []) {
      const id = String(value || '').trim();
      if (!id || seen.has(id)) continue;
      seen.add(id);
      ids.push(id);
    }
  }
  return ids;
}

function renderEpisodeAngleBlocks(episodes = [], emptyText = '') {
  const items = episodes
    .filter((episode) => episode?.id && episode.relationNote)
    .slice(0, 4);

  if (!items.length) return emptyText ? `<p class="subtle">${escapeHtml(emptyText)}</p>` : '';

  return items.map((episode) => `
    <div class="concept-scene-block">
      <h3>${escapeHtml(episode.id)}</h3>
      <p>${renderLinkedEpisodeText(episode.relationNote)}</p>
    </div>
  `).join('');
}

function renderDiscussionAngles(angles = []) {
  const items = (angles || [])
    .map((angle) => ({
      title: String(angle?.title || '').trim(),
      note: String(angle?.note || '').trim(),
      episodeIds: Array.isArray(angle?.episodeIds) ? angle.episodeIds : []
    }))
    .filter((angle) => angle.title && angle.note);

  if (!items.length) return '';

  return items.map((angle) => `
    <div class="concept-scene-block">
      <h3>${escapeHtml(angle.title)}</h3>
      <p>${renderLinkedEpisodeText(angle.note)}</p>
      ${angle.episodeIds.length ? `<p class="subtle">关联节目：${angle.episodeIds.map((id) => `<a class="inline-episode-link" href="${routeTo(`episodes/${id}`)}">${escapeHtml(id)}</a>`).join(' ')}</p>` : ''}
    </div>
  `).join('');
}

function buildKeywordReferenceGroups(keyword, relatedEpisodes = []) {
  const inferredConcepts = collectReferencedItemsFromEpisodes(relatedEpisodes, 'concepts', site.concepts);
  const inferredModels = collectReferencedItemsFromEpisodes(relatedEpisodes, 'models', site.models);
  const inferredThemes = collectReferencedItemsFromEpisodes(relatedEpisodes, 'themes', site.themes);
  const inferredPeople = collectReferencedItemsFromEpisodes(relatedEpisodes, 'people', site.keywords, {
    resolve: (value) => findKeywordByReference(value)
  });

  return [
    { title: '相关概念', type: 'concepts', items: mergeReferenceIds(keyword.relatedConcepts, keyword.canonicalRefs?.conceptId ? [keyword.canonicalRefs.conceptId] : [], inferredConcepts), collection: site.concepts },
    { title: '相关模型', type: 'models', items: mergeReferenceIds(keyword.relatedModels, keyword.canonicalRefs?.modelId ? [keyword.canonicalRefs.modelId] : [], inferredModels), collection: site.models },
    { title: '相关主题', type: 'themes', items: mergeReferenceIds(keyword.relatedThemes, keyword.canonicalRefs?.themeId ? [keyword.canonicalRefs.themeId] : [], inferredThemes), collection: site.themes },
    { title: isPersonKeyword(keyword) ? '相关对象' : '相关人物', type: 'keywords', items: mergeReferenceIds(keyword.relatedPeople, inferredPeople), collection: site.keywords }
  ];
}

function buildThemeReferenceGroups(theme, relatedEpisodes = []) {
  return [
    { title: '相关概念', type: 'concepts', items: mergeReferenceIds(theme.relatedConcepts, collectReferencedItemsFromEpisodes(relatedEpisodes, 'concepts', site.concepts)), collection: site.concepts },
    { title: '相关模型', type: 'models', items: mergeReferenceIds(theme.relatedModels, collectReferencedItemsFromEpisodes(relatedEpisodes, 'models', site.models)), collection: site.models },
    { title: '相关人物', type: 'keywords', items: mergeReferenceIds(theme.relatedPeople, collectReferencedItemsFromEpisodes(relatedEpisodes, 'people', site.keywords, { resolve: (value) => findKeywordByReference(value) })), collection: site.keywords },
    { title: '邻近主题', type: 'themes', items: theme.relatedThemes || [], collection: site.themes }
  ];
}

function referenceNamesForGroup(groups = [], title, limit = 4) {
  const group = groups.find((item) => item.title === title);
  if (!group?.items?.length) return [];
  return group.items
    .map((id) => {
      if (group.type === 'keywords') {
        return findKeywordByReference(id)?.name || '';
      }
      return group.collection?.find((item) => normalizeValue(item.id) === normalizeValue(id) || normalizeValue(item.name) === normalizeValue(id))?.name || '';
    })
    .filter(Boolean)
    .filter((name, index, list) => list.indexOf(name) === index)
    .slice(0, limit);
}

function formatNameSeries(names = []) {
  return names.map((name) => `「${name}」`).join('、');
}

function isReferenceInCollection(collection = [], value) {
  const normalized = normalizeValue(value);
  if (!normalized) return false;
  return collection.some((item) => {
    const aliases = item.aliases || [];
    return (
      normalizeValue(item.id) === normalized ||
      normalizeValue(item.name) === normalized ||
      aliases.some((alias) => normalizeValue(alias) === normalized)
    );
  });
}

function inferKeywordKind(keyword) {
  const overrideKind = keywordKindOverride(keyword);
  if (overrideKind) return overrideKind;

  const explicitKind = String(keyword?.kind || '').trim();
  const kindAliases = {
    person: 'person',
    people: 'person',
    人物: 'person',
    geography: 'geography',
    geo: 'geography',
    地缘: 'geography',
    地点: 'geography',
    地理位置: 'geography',
    organization: 'organization',
    institution: 'organization',
    company: 'organization',
    公司: 'organization',
    机构: 'organization',
    公司机构: 'organization',
    平台: 'organization',
    product: 'product',
    technology: 'product',
    tech: 'product',
    产品: 'product',
    技术: 'product',
    产品技术: 'product',
    event: 'event',
    事件: 'event',
    战事: 'event',
    风波: 'event',
    concept: 'concept',
    概念: 'concept',
    mechanism: 'mechanism',
    机制: 'mechanism',
    model: 'mechanism',
    模型: 'mechanism',
    '机制/概念词': 'mechanism',
    '机制/概念': 'mechanism',
    asset: 'asset',
    finance: 'asset',
    commodity: 'asset',
    金融资产: 'asset',
    大宗商品: 'asset',
    资产商品: 'asset',
    '金融资产/大宗商品': 'asset',
    theme: 'theme',
    主题: 'theme',
    general: 'general',
    常规: 'general',
    通用类: 'general'
  };
  if (kindAliases[explicitKind]) return kindAliases[explicitKind];

  const name = String(keyword?.name || keyword?.id || '').trim();
  const id = String(keyword?.id || '').trim();
  const text = [name, id, ...(keyword?.aliases || [])].join(' ');

  if (isPersonKeyword(keyword)) return 'person';
  if (keyword?.canonicalRefs?.conceptId || isReferenceInCollection(site?.concepts || [], name) || isReferenceInCollection(site?.concepts || [], id)) return 'concept';
  if (keyword?.canonicalRefs?.modelId || isReferenceInCollection(site?.models || [], name) || isReferenceInCollection(site?.models || [], id)) return 'mechanism';
  if (/(战争|危机|事件|大选|风波|事故|改革|阅兵|总动员|冲突|封关|起火|趴窝|退欧|收费站)/.test(text)) return 'event';
  if (/(海峡|航线|国家|地区|东南亚|中东|欧洲|美国|日本|伊朗|俄罗斯|新加坡|马来西亚|越南|匈牙利|台湾|海南|中国|乌克兰|阿联酋|富查伊拉|港口|港\b)/.test(text)) return 'geography';
  if (/(公司|集团|平台|银行|大学|学校|医院|政府|监管|法院|地铁|联盟|组织|海合会|爱奇艺|华谊|百度|西贝|万科|亚航|OpenAI|OPEC)/i.test(text)) return 'organization';
  if (/(汽车|出租车|短剧|L4|AI|无人机|产品|品牌|机器人|云端大脑|大模型|电池|芯片)/i.test(text)) return 'product';
  if (keyword?.canonicalRefs?.themeId || isReferenceInCollection(site?.themes || [], name) || isReferenceInCollection(site?.themes || [], id)) return 'theme';
  if (/(黄金|白银|比特币|石油美元|美元|货币|资产|大宗商品|贵金属|原油|股票|债券|ETF)/i.test(text)) return 'asset';
  if (/(模型|机制|逻辑|结构|系统|闭环|秩序|规则|冗余|控制|分布式|集中式|银行化|金融化|注水|灰色|制裁|库存|躺平|自由|公平|权威|风险|契约|治理)/.test(text)) return 'mechanism';
  return 'general';
}

function keywordKindConfig(kind) {
  const configs = {
    person: {
      badge: KEYWORD_KIND_LABELS.person,
      definitionTitle: '基础介绍',
      sceneTitle: '节目关联',
      signalTitle: '个人风格'
    },
    geography: {
      badge: KEYWORD_KIND_LABELS.geography,
      definitionTitle: '基础介绍',
      sceneTitle: '节目关联',
      signalTitle: '常见场景'
    },
    organization: {
      badge: KEYWORD_KIND_LABELS.organization,
      definitionTitle: '对象说明',
      sceneTitle: '节目关联',
      signalTitle: '常见场景'
    },
    product: {
      badge: KEYWORD_KIND_LABELS.product,
      definitionTitle: '对象说明',
      sceneTitle: '节目关联',
      signalTitle: '常见场景'
    },
    event: {
      badge: KEYWORD_KIND_LABELS.event,
      definitionTitle: '事件说明',
      sceneTitle: '节目关联',
      signalTitle: '常见场景'
    },
    concept: {
      badge: KEYWORD_KIND_LABELS.concept,
      definitionTitle: '概念说明',
      sceneTitle: '节目关联',
      signalTitle: '常见场景'
    },
    mechanism: {
      badge: KEYWORD_KIND_LABELS.mechanism,
      definitionTitle: '机制说明',
      sceneTitle: '节目关联',
      signalTitle: '常见场景'
    },
    theme: {
      badge: KEYWORD_KIND_LABELS.theme,
      definitionTitle: '主题说明',
      sceneTitle: '节目关联',
      signalTitle: '常见场景'
    },
    asset: {
      badge: KEYWORD_KIND_LABELS.asset,
      definitionTitle: '资产说明',
      sceneTitle: '节目关联',
      signalTitle: '常见场景'
    },
    general: {
      badge: KEYWORD_KIND_LABELS.general,
      definitionTitle: '基础介绍',
      sceneTitle: '节目关联',
      signalTitle: '常见场景'
    }
  };
  return configs[kind] || configs.general;
}

function renderKeywordDefinitionContent(keyword) {
  return `
    ${renderParagraphText(keyword.description)}
    ${keyword.scopeNote ? `<h3>站内用法</h3>${renderParagraphText(keyword.scopeNote)}` : ''}
  `;
}

function renderKeywordSceneContent(keyword, relatedEpisodes = []) {
  const discussionContent = renderDiscussionAngles(keyword.discussionAngles);
  if (discussionContent) return discussionContent;
  return renderEpisodeAngleBlocks(relatedEpisodes, '');
}

function renderKeywordSignalContent(keyword, referenceGroups = [], relatedEpisodes = [], kind = inferKeywordKind(keyword)) {
  const conceptNames = referenceNamesForGroup(referenceGroups, '相关概念');
  const modelNames = referenceNamesForGroup(referenceGroups, '相关模型');
  const themeNames = referenceNamesForGroup(referenceGroups, '相关主题');
  const personOrObjectNames = referenceNamesForGroup(referenceGroups, isPersonKeyword(keyword) ? '相关对象' : '相关人物');
  const relatedNames = (keyword.relatedKeywords || [])
    .map((reference) => findKeywordByReference(reference)?.name || '')
    .filter(Boolean)
    .filter((name, index, list) => list.indexOf(name) === index)
    .slice(0, 5);
  const signals = [];

  if (isPersonKeyword(keyword)) {
    signals.push(`节目提到${keyword.name}时，重点通常不在履历，而在这个人代表的权力风格、产业位置或秩序选择。`);
  } else if (kind === 'geography') {
    signals.push(`节目提到${keyword.name}时，常常是在讨论通道、边界、港口、海峡、资源或小国/大国之间的规则位置。`);
  } else if (kind === 'organization') {
    signals.push(`节目提到${keyword.name}时，通常要看它处在产业链、监管链或公共规则中的哪个位置。`);
  } else if (kind === 'product') {
    signals.push(`节目提到${keyword.name}时，重点通常在技术路线、运营系统、用户风险或规模化后的公共后果。`);
  } else if (kind === 'event') {
    signals.push(`节目提到${keyword.name}时，重点通常不在事件经过，而在它暴露了什么冲突结构和长期后果。`);
  } else if (kind === 'mechanism' || kind === 'concept') {
    signals.push(`节目提到${keyword.name}时，通常是在把具体案例提炼成一种现象、机制或判断工具。`);
  } else {
    signals.push(`当节目把${keyword.name}反复放进不同案例里讨论时，它通常已经不是普通标签，而是在承担一条稳定的理解线索。`);
  }
  if (relatedNames.length) {
    signals.push(`它经常和 ${formatNameSeries(relatedNames)} 同时出现，这些相邻词能帮助判断它落在哪个具体语境里。`);
  }
  if (conceptNames.length) {
    signals.push(`如果要看现象层解释，可以继续点 ${formatNameSeries(conceptNames)}。`);
  }
  if (modelNames.length) {
    signals.push(`如果节目用它解释机制或因果链，通常会靠近 ${formatNameSeries(modelNames)} 这些模型。`);
  }
  if (themeNames.length) {
    signals.push(`如果要按跨节目问题线阅读，可以接到 ${formatNameSeries(themeNames)}。`);
  }
  if (personOrObjectNames.length) {
    signals.push(`和它一起出现的人物或对象包括 ${formatNameSeries(personOrObjectNames)}，这些节点常常提供具体案例。`);
  }
  if (relatedEpisodes.length >= 2) {
    signals.push(`同一个词出现在 ${relatedEpisodes.map((episode) => episode.id).slice(0, 4).join('、')} 等节目里时，适合横向比较它在不同事件中的角色变化。`);
  }

  return renderDetailList(signals);
}

function shouldDisplayKeywordAlias(keyword, alias) {
  const text = String(alias || '').trim();
  if (!text) return false;
  if (normalizeValue(text) === normalizeValue(keyword.name)) return false;
  const looksLikeInternalSlug = /^[a-z0-9][a-z0-9-]+$/i.test(text) && /[a-z]/i.test(text);
  if (looksLikeInternalSlug && normalizeValue(text) === normalizeValue(keyword.id)) return false;
  return true;
}

function displayKeywordAliases(keyword) {
  if (isPersonKeyword(keyword)) return [];
  return (keyword.aliases || [])
    .filter((alias) => shouldDisplayKeywordAlias(keyword, alias))
    .filter((alias, index, list) => list.findIndex((item) => normalizeValue(item) === normalizeValue(alias)) === index);
}

function renderKeywordRelationContent(keyword, aliases = []) {
  const blocks = [];
  if (aliases.length) {
    blocks.push(`
      <div class="concept-scene-block">
        <h3>相关写法</h3>
        ${renderKeywordAliasLinks(aliases)}
      </div>
    `);
  }
  if (keyword.relatedKeywords?.length) {
    blocks.push(`
      <div class="concept-scene-block">
        <h3>相邻关键词</h3>
        ${renderRelatedKeywordLinks(keyword.relatedKeywords)}
      </div>
    `);
  }
  if (keyword.parents?.length) {
    blocks.push(`
      <div class="concept-scene-block">
        <h3>上位入口</h3>
        ${renderRelatedKeywordLinks(keyword.parents)}
      </div>
    `);
  }
  return blocks.join('');
}

function normalizeKeywordNoteBlocks(items = []) {
  return (items || [])
    .map((item) => {
      if (typeof item === 'string') {
        return {
          title: '',
          note: item.trim()
        };
      }
      return {
        title: String(item?.title || item?.line || '').trim(),
        note: String(item?.note || item?.body || '').trim(),
        episodes: Array.isArray(item?.episodes) ? item.episodes.filter(Boolean) : []
      };
    })
    .filter((item) => item.note);
}

function renderKeywordNoteBlocks(items = [], emptyText = '', options = {}) {
  const blocks = normalizeKeywordNoteBlocks(items);
  if (!blocks.length) {
    return emptyText ? `<p class="subtle">${escapeHtml(emptyText)}</p>` : '';
  }
  const showEpisodes = options.showEpisodes !== false;

  return blocks.map((block) => `
    <div class="concept-scene-block">
      ${block.title ? `<h3>${escapeHtml(block.title)}</h3>` : ''}
      <p>${renderLinkedEpisodeText(block.note)}</p>
      ${showEpisodes && block.episodes?.length ? `<p class="subtle">关联节目：${block.episodes.map((id) => `<a class="inline-episode-link" href="${routeTo(`episodes/${id}`)}">${escapeHtml(id)}</a>`).join(' ')}</p>` : ''}
    </div>
  `).join('');
}

function renderKeywordFieldContent(value) {
  if (Array.isArray(value)) return renderDetailList(value);
  return renderParagraphText(value);
}

function hasKeywordFieldContent(value) {
  if (Array.isArray(value)) {
    return value.some((item) => {
      if (typeof item === 'string') return item.trim();
      return String(item?.note || item?.body || item?.title || item?.line || '').trim();
    });
  }
  return String(value || '').trim();
}

function renderOptionalKeywordFieldContent(value) {
  if (!hasKeywordFieldContent(value)) return '';
  return renderKeywordFieldContent(value);
}

function renderKeywordDescriptionWithExtra(keyword, extraField) {
  const extra = keyword[extraField];
  const extraContent = extra ? renderKeywordFieldContent(extra) : '';
  return `${renderParagraphText(keyword.description)}${extraContent}`;
}

function renderKeywordProgramAssociations(keyword, relatedEpisodes = []) {
  const groupedAssociations = renderKeywordNoteBlocks(keyword.programAssociations, '', { showEpisodes: false });
  if (groupedAssociations) return groupedAssociations;
  return renderKeywordSceneContent(keyword, relatedEpisodes);
}

function renderKeywordSignalSection(keyword, fallbackContent) {
  if (keyword.signalNotes) return renderKeywordFieldContent(keyword.signalNotes);
  return fallbackContent;
}

function renderKeywordExtensionSection(keyword, aliases = []) {
  const extensionBlocks = renderKeywordNoteBlocks(keyword.extensionNotes, '');
  if (extensionBlocks) return extensionBlocks;
  const relationContent = renderKeywordRelationContent(keyword, aliases);
  return relationContent || '';
}

function renderPersonKeywordBasicIntro(keyword) {
  return renderParagraphText(keyword.basicIntro || keyword.description);
}

function renderPersonKeywordProgramContent(keyword, relatedEpisodes = []) {
  const intro = keyword.programRole ? renderParagraphText(keyword.programRole) : '';
  const groupedAssociations = renderKeywordNoteBlocks(keyword.programAssociations, '', { showEpisodes: false });
  const episodeAssociations = groupedAssociations || renderEpisodeAngleBlocks(relatedEpisodes, '');
  return `${intro}${episodeAssociations}`;
}

function renderPersonKeywordExtensionContent(keyword) {
  const extensionBlocks = renderKeywordNoteBlocks(keyword.extensionNotes, '');
  if (extensionBlocks) return extensionBlocks;
  if (keyword.relatedKeywords?.length) return renderRelatedKeywordLinks(keyword.relatedKeywords);
  return '';
}

function buildKeywordAnalysisSections(keyword, relatedEpisodes = [], referenceGroups = [], keywordKind = inferKeywordKind(keyword), keywordConfig = keywordKindConfig(keywordKind), aliases = []) {
  if (keywordKind === 'person') {
    return [
      { title: '基础介绍', content: renderPersonKeywordBasicIntro(keyword) },
      { title: '节目关联', content: renderPersonKeywordProgramContent(keyword, relatedEpisodes) },
      { title: '个人风格', content: renderOptionalKeywordFieldContent(keyword.styleNotes) },
      { title: '做事方式', content: renderOptionalKeywordFieldContent(keyword.methodNotes) },
      { title: '延展阅读', content: renderPersonKeywordExtensionContent(keyword) }
    ];
  }

  const fallbackSignals = renderKeywordSignalContent(keyword, referenceGroups, relatedEpisodes, keywordKind);
  const commonProgramSection = { title: keywordConfig.sceneTitle, content: renderKeywordProgramAssociations(keyword, relatedEpisodes) };
  const commonExtensionSection = { title: '延展阅读', content: renderKeywordExtensionSection(keyword, aliases) };

  if (keywordKind === 'geography') {
    return [
      { title: '基础介绍', content: renderKeywordDescriptionWithExtra(keyword, 'nodeRole') },
      commonProgramSection,
      { title: '影响方式', content: renderOptionalKeywordFieldContent(keyword.impactNotes) },
      { title: '常见场景', content: renderKeywordSignalSection(keyword, fallbackSignals) },
      commonExtensionSection
    ];
  }

  if (keywordKind === 'organization') {
    return [
      { title: '对象说明', content: renderKeywordDescriptionWithExtra(keyword, 'positionNotes') },
      commonProgramSection,
      { title: '暴露问题', content: renderOptionalKeywordFieldContent(keyword.exposureNotes) },
      { title: '常见场景', content: renderKeywordSignalSection(keyword, fallbackSignals) },
      commonExtensionSection
    ];
  }

  if (keywordKind === 'product') {
    return [
      { title: '对象说明', content: renderKeywordDescriptionWithExtra(keyword, 'objectRole') },
      commonProgramSection,
      { title: '现实后果', content: renderOptionalKeywordFieldContent(keyword.consequenceNotes) },
      { title: '常见场景', content: renderKeywordSignalSection(keyword, fallbackSignals) },
      commonExtensionSection
    ];
  }

  if (keywordKind === 'event') {
    return [
      { title: '事件说明', content: renderParagraphText(keyword.description) },
      { title: '冲突结构', content: renderOptionalKeywordFieldContent(keyword.conflictNotes) },
      commonProgramSection,
      { title: '后续影响', content: renderOptionalKeywordFieldContent(keyword.aftermathNotes) },
      { title: '常见场景', content: renderKeywordSignalSection(keyword, fallbackSignals) },
      commonExtensionSection
    ];
  }

  if (keywordKind === 'concept' || keywordKind === 'mechanism' || keywordKind === 'theme') {
    return [
      { title: keywordConfig.definitionTitle, content: renderKeywordDescriptionWithExtra(keyword, 'mechanismNotes') },
      commonProgramSection,
      { title: '常见场景', content: renderKeywordSignalSection(keyword, fallbackSignals) },
      commonExtensionSection
    ];
  }

  if (keywordKind === 'asset') {
    return [
      { title: '资产说明', content: renderKeywordDescriptionWithExtra(keyword, 'assetRole') },
      commonProgramSection,
      { title: '风险结构', content: renderOptionalKeywordFieldContent(keyword.riskNotes) },
      { title: '常见场景', content: renderKeywordSignalSection(keyword, fallbackSignals) },
      commonExtensionSection
    ];
  }

  return [
    { title: keywordConfig.definitionTitle, content: renderKeywordDefinitionContent(keyword) },
    commonProgramSection,
    { title: keywordConfig.signalTitle, content: renderKeywordSignalSection(keyword, fallbackSignals) },
    commonExtensionSection
  ];
}

function makeDefaultThemeWhy(theme, relatedEpisodes = []) {
  if (relatedEpisodes.length >= 2) {
    return `${theme.name}之所以值得作为主题保留，是因为它把 ${relatedEpisodes.map((episode) => episode.id).slice(0, 4).join('、')} 这些节目放进同一条问题线里。读者从这里进入，不是看单期推荐，而是看同一种现实结构怎样在不同案例里反复出现。`;
  }
  if (relatedEpisodes.length === 1) {
    return `${theme.name}目前先由 ${relatedEpisodes[0].id} 提供主锚点。这个主题页用于保留一条可继续扩展的问题线，后续出现同类节目时可以继续累积到这里。`;
  }
  return `${theme.name}用于承接一组长期问题，而不是替代单个概念或模型。它的作用是把分散节目组织成一条更容易继续阅读的主题线。`;
}

function makeDefaultThemeObservationLenses(theme, referenceGroups = [], relatedEpisodes = []) {
  const conceptNames = referenceNamesForGroup(referenceGroups, '相关概念');
  const modelNames = referenceNamesForGroup(referenceGroups, '相关模型');
  const personNames = referenceNamesForGroup(referenceGroups, '相关人物');
  const lenses = [];

  if (conceptNames.length) {
    lenses.push(`先看 ${formatNameSeries(conceptNames)}，它们说明这个主题里反复出现的现象和判断。`);
  }
  if (modelNames.length) {
    lenses.push(`再看 ${formatNameSeries(modelNames)}，它们负责解释这些现象背后的机制和因果链。`);
  }
  if (personNames.length) {
    lenses.push(`人物入口 ${formatNameSeries(personNames)} 可以帮助读者把抽象主题落回具体行动者和案例。`);
  }
  if (relatedEpisodes.length) {
    lenses.push(`最后回到相关节目，比较同一问题在不同场景里怎样变形、重复或升级。`);
  }

  return renderDetailList(lenses.length ? lenses : [
    `把它当作一条跨节目阅读线：先看具体案例，再回到概念、模型和人物节点判断它为什么会反复出现。`
  ]);
}

function makeDefaultThemeBoundary(theme) {
  return [
    `${theme.name}不是百科式总论，也不负责替代单个概念、模型或人物页。`,
    `当页面上方已经出现更精确的概念或模型时，机制解释应优先进入那些节点；主题页只负责把节目放进同一条问题线。`
  ];
}

function buildProgressAccordionAttrs(label) {
  return `data-progress-section="true" data-progress-label="${escapeHtml(label)}"`;
}

function renderRelatedEpisodeCards(episodes = []) {
  if (!episodes.length) return '';
  return `
    <div class="list">
      ${episodes.map((episode) => {
        const episodeHref = routeTo(`episodes/${episode.id}`);
        return `
          <div
            class="related-episode-item"
            data-progress-section="true"
            data-progress-label="${escapeHtml(`${episode.id} ${displayEpisodeTitle(episode.title)}`)}"
          >
            ${episode.relationNote ? `
              <div class="related-episode-context">
                <p class="episode-relation-note">
                  <span class="episode-relation-note-label">关联切口</span>
                  ${renderLinkedEpisodeText(episode.relationNote)}
                </p>
              </div>
            ` : ''}
            <article
              class="list-item episode-index-card"
              data-episode-href="${episodeHref}"
            >
              <div class="episode-index-card-head">
                <p class="card-kicker episode-index-kicker">${escapeHtml(episode.id)}${renderEpisodeFreshBadge(episode, { compact: true })}</p>
              </div>
              <a class="card-primary-link" href="${episodeHref}">
                <h3>${escapeHtml(displayEpisodeTitle(episode.title))}</h3>
              </a>
              <p class="episode-index-summary">${escapeHtml(episode.summary || '待整理')}</p>
              ${linkedChipList('keywords', (episode.tags || []).slice(0, 6), site.keywords)}
            </article>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function getKnowledgeEpisodeExpansionKey(type, id) {
  return `${type}:${id}`;
}

function renderKnowledgeRelatedEpisodesSection(type, id, episodes = []) {
  if (!episodes.length) return '';
  const expanded = expandedKnowledgeEpisodeSections.has(getKnowledgeEpisodeExpansionKey(type, id));
  const visibleEpisodes = expanded ? episodes : episodes.slice(0, 3);
  const hasMore = episodes.length > 3;
  const toggleLabel = expanded ? '收起' : '展开';
  const toggleIcon = expanded ? '▴' : '▾';
  const metaLabel = hasMore && !expanded
    ? `当前显示 ${visibleEpisodes.length} / 共 ${episodes.length} 期`
    : `共 ${episodes.length} 期`;

  return `
    <section class="detail-section detail-episode-list knowledge-evidence">
      <div class="detail-section-title-inline">
        <h2>相关节目</h2>
        <span class="detail-section-meta">${metaLabel}</span>
        ${hasMore ? `
          <button
            id="knowledge-related-toggle"
            class="detail-section-action"
            type="button"
            aria-expanded="${String(expanded)}"
            aria-label="${toggleLabel}相关节目"
            data-has-more="true"
          >
            <span class="detail-section-action-icon" aria-hidden="true">${toggleIcon}</span>
            <span data-role="label">${escapeHtml(toggleLabel)}</span>
          </button>
        ` : `
          <button
            class="detail-section-action is-disabled"
            type="button"
            aria-disabled="true"
            tabindex="-1"
          >
            <span>无需展开</span>
          </button>
        `}
      </div>
      ${renderRelatedEpisodeCards(visibleEpisodes)}
    </section>
  `;
}

function bindKnowledgeEpisodeSection(type, id, rerender) {
  document.getElementById('knowledge-related-toggle')?.addEventListener('click', (event) => {
    event.preventDefault();
    const button = event.currentTarget;
    if (!(button instanceof HTMLButtonElement)) return;
    const expansionKey = getKnowledgeEpisodeExpansionKey(type, id);
    if (expandedKnowledgeEpisodeSections.has(expansionKey)) {
      expandedKnowledgeEpisodeSections.delete(expansionKey);
    } else {
      expandedKnowledgeEpisodeSections.add(expansionKey);
    }
    rerenderWithPreservedViewport(rerender);
  });

  const relatedEpisodesSection = document.querySelector('.detail-episode-list');
  relatedEpisodesSection?.addEventListener('click', (event) => {
    const directEpisodeLink = event.target.closest('.card-primary-link');
    if (directEpisodeLink && relatedEpisodesSection.contains(directEpisodeLink)) {
      event.preventDefault();
      navigateToEpisodeFromElement(directEpisodeLink);
      return;
    }

    const episodeCard = event.target.closest('.episode-index-card[data-episode-href]');
    if (!episodeCard || !relatedEpisodesSection.contains(episodeCard)) return;
    if (event.target.closest('.chip, button, input, textarea, select, summary, a')) return;
    navigateToEpisodeFromElement(episodeCard);
  });
}

function renderCompactReferenceGroup(title, type, items, collection) {
  if (!items?.length) return '';
  return `
    <div class="detail-compact-reference-group">
      <span class="detail-compact-reference-label">${escapeHtml(title)}</span>
      ${linkedChipList(type, items, collection)}
    </div>
  `;
}

function renderKnowledgeReferenceHeaderSection(groups = []) {
  const markup = groups
    .map(({ title, type, items, collection }) => renderCompactReferenceGroup(title, type, items, collection))
    .filter(Boolean)
    .join('');

  if (!markup) return '';

  return `
    <details class="detail-header-meta detail-reference-disclosure">
      <summary class="detail-reference-summary">相关内容</summary>
      <div class="detail-compact-reference-grid">
        ${markup}
      </div>
    </details>
  `;
}

function renderKnowledgeAnalysisSection(sections = []) {
  const markup = sections
    .filter((section) => section && section.content)
    .map((section) => accordionItem(section.title, section.content, false, buildProgressAccordionAttrs(section.progressLabel || section.title)))
    .join('');

  return `
    <section class="detail-section knowledge-analysis">
      ${markup}
    </section>
  `;
}

function renderKnowledgeStaticSection(title, content, progressLabel = title) {
  if (!content) return '';
  return `
    <section class="detail-section knowledge-analysis" data-progress-section="true" data-progress-label="${escapeHtml(progressLabel)}">
      <h2>${escapeHtml(title)}</h2>
      ${content}
    </section>
  `;
}

function renderDetailBackRow(sectionHref, sectionLabel) {
  return `
    <div class="back-row">
      <button type="button" class="back-link back-button" data-nav-back="true">← 返回前一页</button>
      <a class="back-link secondary" href="${sectionHref}">返回${escapeHtml(sectionLabel)}页</a>
      <a class="back-link secondary" href="#/">返回首页</a>
    </div>
  `;
}

function renderKeywordAliasLinks(aliases = []) {
  if (!aliases.length) return '';
  return `
    <div class="chip-row">
      ${aliases.map((alias) => `<a class="chip" href="${routeTo(`keywords/${alias}`)}">${escapeHtml(alias)}</a>`).join('')}
    </div>
  `;
}

function renderRelatedKeywordLinks(references = []) {
  const resolved = references
    .map((reference) => findKeywordByReference(reference))
    .filter(Boolean)
    .filter((keyword, index, list) => list.findIndex((item) => item.id === keyword.id) === index);

  if (!resolved.length) return '';

  return `
    <div class="chip-row">
      ${resolved.map((keyword) => `<a class="chip" href="${routeTo(`keywords/${keyword.id}`)}">${escapeHtml(keyword.name)}</a>`).join('')}
    </div>
  `;
}

function renderEpisodeTopNavigation(episodeId) {
  const { previousEpisode, nextEpisode } = getEpisodeNeighbors(episodeId);

  return `
    <div class="episode-neighbor-row">
      ${previousEpisode
        ? `<a class="back-link secondary episode-neighbor-link" href="${routeTo(`episodes/${previousEpisode.id}`)}">← 上一集 ${escapeHtml(previousEpisode.id)}</a>`
        : '<span class="episode-neighbor-spacer" aria-hidden="true"></span>'}
      ${nextEpisode
        ? `<a class="back-link secondary episode-neighbor-link next" href="${routeTo(`episodes/${nextEpisode.id}`)}">下一集 ${escapeHtml(nextEpisode.id)} →</a>`
        : '<span class="episode-neighbor-spacer" aria-hidden="true"></span>'}
    </div>
  `;
}

function renderConceptDetail(id) {
  const concept = site.concepts.find((item) => item.id === id);
  if (!concept) {
    renderNotFound('概念不存在');
    return;
  }

  const scenePatterns = resolveConceptScenePatterns(concept);
  const relatedEpisodes = buildRelatedEpisodeEntries(resolveKnowledgeEpisodeRelations(concept));
  const sceneContent = scenePatterns.length
    ? scenePatterns.map((pattern) => `
      <div class="concept-scene-block">
        <h3>${escapeHtml(pattern.title)}</h3>
        <p>${renderLinkedEpisodeText(pattern.body)}</p>
      </div>
    `).join('')
    : '';

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header knowledge-overview">
        ${renderDetailBackRow('#/concepts', '概念')}
        <p class="detail-eyebrow">Concept Card</p>
        <h1 class="detail-title">${escapeHtml(concept.name)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(concept.summary)}</p>
        ${renderKnowledgeReferenceHeaderSection([
          { title: '共现模型', type: 'models', items: concept.relatedModels, collection: site.models },
          { title: '共现主题', type: 'themes', items: concept.relatedThemes, collection: site.themes },
          { title: '共现人物', type: 'keywords', items: concept.relatedPeople, collection: site.keywords },
          { title: '相关概念', type: 'concepts', items: concept.relatedConcepts, collection: site.concepts }
        ])}
      </div>
      ${renderKnowledgeAnalysisSection([
        {
          title: '定义',
          content: `
          ${renderParagraphText(concept.definition)}
          <h3>节目里的作用</h3>
          ${renderParagraphText(concept.importance)}
        `
        },
        { title: '常见场景', content: sceneContent },
        { title: '信息关联', content: renderDetailList(concept.signals) },
        { title: '判断边界', content: renderDetailList(concept.boundaries) }
      ])}
      ${renderKnowledgeRelatedEpisodesSection('concepts', concept.id, relatedEpisodes)}
    </section>
  `;

  bindKnowledgeEpisodeSection('concepts', concept.id, () => renderConceptDetail(concept.id));
}

function renderModelDetail(id) {
  const model = site.models.find((item) => item.id === id);
  if (!model) {
    renderNotFound('模型不存在');
    return;
  }

  const relatedEpisodes = buildRelatedEpisodeEntries(resolveKnowledgeEpisodeRelations(model));
  const modelContext = stripAnchorSentence(model.context);

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header knowledge-overview">
        ${renderDetailBackRow('#/models', '模型')}
        <p class="detail-eyebrow">Mental Model</p>
        <h1 class="detail-title">${escapeHtml(model.name)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(model.summary)}</p>
        ${renderKnowledgeReferenceHeaderSection([
          { title: '共现概念', type: 'concepts', items: model.relatedConcepts, collection: site.concepts },
          { title: '共现主题', type: 'themes', items: model.relatedThemes, collection: site.themes },
          { title: '共现人物', type: 'keywords', items: model.relatedPeople, collection: site.keywords },
          { title: '邻近模型', type: 'models', items: model.relatedModels, collection: site.models }
        ])}
      </div>
      ${renderKnowledgeAnalysisSection([
        {
          title: '机制定义',
          content: `
            ${renderParagraphText(model.definition)}
            ${modelContext ? `<h3>节目里的作用</h3>${renderParagraphText(modelContext)}` : ''}
          `
        },
        { title: '在颖响力里的用法', content: renderParagraphText(model.application) },
        { title: '信息关联', content: renderDetailList(model.signals) },
        { title: '判断边界', content: renderDetailList(model.boundaries) }
      ])}
      ${renderKnowledgeRelatedEpisodesSection('models', model.id, relatedEpisodes)}
    </section>
  `;

  bindKnowledgeEpisodeSection('models', model.id, () => renderModelDetail(model.id));
}

function renderPersonDetail(id) {
  const person = findPersonByReference(id);
  const keyword = findKeywordByReference(id) || findKeywordByReference(person?.id) || findKeywordByReference(person?.name);
  if (keyword) {
    window.location.hash = routeTo(`keywords/${keyword.id}`);
    return;
  }
  if (!person) {
    renderNotFound('人物不存在');
    return;
  }
  renderNotFound('人物已并入关键词，请从关键词入口访问。');
}

function renderThemeDetail(id) {
  const theme = site.themes.find((item) => item.id === id);
  if (!theme) {
    renderNotFound('主题不存在');
    return;
  }

  const relatedEpisodes = buildRelatedEpisodeEntries(resolveKnowledgeEpisodeRelations(theme));
  const referenceGroups = buildThemeReferenceGroups(theme, relatedEpisodes);
  const themeDescription = stripThemeBoilerplate(theme.description) || stripAnchorSentence(theme.description) || String(theme.description || '').trim();
  const observationContent = Array.isArray(theme.observationLenses)
    ? renderDetailList(theme.observationLenses)
    : renderParagraphText(theme.observationLenses);
  const themeWhyContent = theme.whyThisThemeMatters
    ? renderParagraphText(theme.whyThisThemeMatters)
    : `
      ${renderParagraphText(makeDefaultThemeWhy(theme, relatedEpisodes))}
      ${renderEpisodeAngleBlocks(relatedEpisodes, '')}
    `;
  const themeAnalysisSections = [
    { title: '主题说明', content: renderParagraphText(themeDescription) },
    { title: '归线依据', content: themeWhyContent },
    { title: '观察维度', content: theme.observationLenses ? observationContent : makeDefaultThemeObservationLenses(theme, referenceGroups, relatedEpisodes) },
    { title: '判断边界', content: theme.boundaries ? renderDetailList(theme.boundaries) : renderDetailList(makeDefaultThemeBoundary(theme)) }
  ].filter(Boolean);

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header knowledge-overview">
        ${renderDetailBackRow('#/themes', '主题')}
        <p class="detail-eyebrow">Theme Node</p>
        <h1 class="detail-title">${escapeHtml(theme.name)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(theme.summary)}</p>
        ${renderKnowledgeReferenceHeaderSection(referenceGroups)}
      </div>
      ${renderKnowledgeAnalysisSection(themeAnalysisSections)}
      ${renderKnowledgeRelatedEpisodesSection('themes', theme.id, relatedEpisodes)}
    </section>
  `;

  bindKnowledgeEpisodeSection('themes', theme.id, () => renderThemeDetail(theme.id));
}

function renderKeywordDetail(id) {
  const keyword = site.keywords.find((item) => {
    const aliases = item.aliases || [];
    return (
      normalizeValue(item.id) === normalizeValue(id) ||
      normalizeValue(item.name) === normalizeValue(id) ||
      aliases.some((alias) => normalizeValue(alias) === normalizeValue(id))
    );
  });
  if (!keyword) {
    renderNotFound('关键词不存在');
    return;
  }

  const relatedEpisodes = buildRelatedEpisodeEntries(keyword.episodes || []);
  const referenceGroups = buildKeywordReferenceGroups(keyword, relatedEpisodes);
  const keywordKind = inferKeywordKind(keyword);
  const keywordConfig = keywordKindConfig(keywordKind);
  const aliases = displayKeywordAliases(keyword);

  app.innerHTML = `
    <section class="detail">
      <div class="detail-header knowledge-overview">
        ${renderDetailBackRow('#/keywords', '关键词')}
        <h1 class="detail-title">${escapeHtml(keyword.name)}</h1>
        <p class="detail-summary">${renderLinkedEpisodeText(keyword.summary)}</p>
        ${renderKnowledgeReferenceHeaderSection(referenceGroups)}
      </div>
      ${renderKnowledgeAnalysisSection(buildKeywordAnalysisSections(keyword, relatedEpisodes, referenceGroups, keywordKind, keywordConfig, aliases))}
      ${renderKnowledgeRelatedEpisodesSection('keywords', keyword.id, relatedEpisodes)}
    </section>
  `;

  bindKnowledgeEpisodeSection('keywords', keyword.id, () => renderKeywordDetail(keyword.id));
}

function renderNotFound(message) {
  app.innerHTML = `
    <section class="detail">
      <div class="empty-state">${escapeHtml(message)}</div>
    </section>
  `;
}

function renderRoute() {
  if (!site) return;
  closeInlineEpisodePopup();
  const previousRoute = parseHashRoute(lastRenderedHash);
  episodeToolbarController?.abort();
  episodeToolbarController = null;
  episodeIndexSearchController?.abort();
  episodeIndexSearchController = null;
  clearEpisodeIndexSearchAutoHideTimer();
  homeSearchToolbarController?.abort();
  homeSearchToolbarController = null;
  resetHomeEpisodeCarouselRuntime();
  teardownRevealAnimations();
  cancelSnapAnimation();
  closeSectionProgressPanel();
  clearSectionProgressEffects();
  destroyGraphView();
  const currentRoute = parseHashRoute(window.location.hash);
  const { section, id } = currentRoute;
  const currentHash = window.location.hash || '#/';
  const transitionKind = getRouteTransitionKind(lastRenderedHash, currentHash);
  const historyRestore = window.history.state?.yinfluenceViewState;
  const routeRestore = pendingRouteRestore && pendingRouteRestore.hash === currentHash
    ? pendingRouteRestore
    : historyRestore?.hash === currentHash
      ? historyRestore
    : null;
  const usesViewTransition = (
    hasRenderedRoute &&
    transitionKind !== 'content-static' &&
    typeof document.startViewTransition === 'function' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  const preRenderTopReset = !routeRestore && Boolean(id) && !usesViewTransition;
  document.body.classList.toggle('has-assisted-snap', section !== 'graph');
  document.body.classList.toggle('page-home', !section);
  document.body.classList.toggle('page-episode-index', section === 'episodes' && !id);
  document.body.classList.toggle('page-keyword-index', section === 'keywords' && !id);
  document.body.classList.toggle('page-knowledge-detail', ['concepts', 'models', 'themes', 'keywords'].includes(section) && !!id);
  document.body.classList.toggle('page-reference-detail', ['concepts', 'models', 'themes', 'keywords', 'people'].includes(section) && !!id);
  document.body.classList.toggle('page-updates', section === 'updates');
  document.body.classList.toggle('page-graph', section === 'graph');

  if (preRenderTopReset) {
    scrollWindowInstantly(0, 0);
  }

  document.title = `${site.meta.title}`;

  if (!section) {
    renderHome();
  } else if (section === 'graph') {
    renderGraphPage();
  } else if (section === 'updates') {
    renderWebsiteLog();
  } else if (section === 'home' && id === 'episodes') {
    renderHome('home-episodes');
  } else if (section === 'episodes' && !id) {
    if (!(previousRoute.section === 'episodes' && !previousRoute.id) && !episodeIndexFocusSearchOnRender) {
      episodeIndexQuery = '';
      episodeIndexAppliedQuery = '';
      episodeIndexSearchMode = false;
      episodeIndexRangeStart = 0;
    }
    renderEpisodeIndex();
  } else if (section === 'concepts' && !id) {
    renderConceptIndex();
  } else if (section === 'models' && !id) {
    renderModelIndex();
  } else if (section === 'people' && !id) {
    renderPeopleIndex();
  } else if (section === 'themes' && !id) {
    renderThemesIndex();
  } else if (section === 'keywords' && !id) {
    renderKeywordIndex();
  } else if (section === 'episodes' && id) {
    renderEpisodeDetail(id);
  } else if (section === 'concepts' && id) {
    renderConceptDetail(id);
  } else if (section === 'models' && id) {
    renderModelDetail(id);
  } else if (section === 'people' && id) {
    renderPersonDetail(id);
  } else if (section === 'themes' && id) {
    renderThemeDetail(id);
  } else if (section === 'keywords' && id) {
    renderKeywordDetail(id);
  } else {
    renderNotFound('页面不存在');
  }

  if (routeRestore) {
    isApplyingRouteState = true;
    restoreRouteViewState(routeRestore);
    window.requestAnimationFrame(() => {
      isApplyingRouteState = false;
    });
  }

  if (!preRenderTopReset && !routeRestore) {
    scrollWindowInstantly(0, 0);
  }
  setupRevealAnimations();
  renderSectionProgress();
  closeSidebar();
  window.clearTimeout(sectionSnapTimer);
  suspendSnapUntil = Date.now() + 420;
  lastSnapTargetTop = -1;
  if (!preRenderTopReset && routeRestore) {
    scrollWindowInstantly(0, 0);
  }
  lastScrollY = 0;
  lastScrollSampleAt = performance.now();
  refreshViewportBehaviors({ resetDock: true });
  lastRenderedHash = currentHash;
  hasRenderedRoute = true;
  if (routeRestore) {
    pendingRouteRestore = null;
  }
  window.requestAnimationFrame(() => {
    normalizeMobileViewport();
  });
  if (section === 'episodes' && !id && !routeRestore) {
    window.requestAnimationFrame(() => {
      scrollWindowInstantly(0, 0);
    });
    window.setTimeout(() => {
      scrollWindowInstantly(0, 0);
    }, 140);
  }
  window.requestAnimationFrame(() => {
    syncSectionProgress();
  });
  if (routeRestore) {
    window.requestAnimationFrame(() => {
      scrollWindowInstantly(routeRestore.scrollY, routeRestore.scrollX);
    });
    window.setTimeout(() => {
      scrollWindowInstantly(routeRestore.scrollY, routeRestore.scrollX);
    }, 120);
  }
}

async function init() {
  const [siteResponse, graphResponse] = await Promise.all([
    fetch(dataUrl('site.json')),
    fetch(dataUrl('graph.json'))
  ]);
  site = await siteResponse.json();
  graphData = await graphResponse.json();
  refreshViewportBehaviors({ resetDock: true });
  renderSidebar();
  renderRouteWithTransition();
}

init().catch((error) => {
  app.innerHTML = `<div class="empty-state">加载失败：${escapeHtml(error.message)}</div>`;
});
