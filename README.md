<div align="center">

# Auto-Video 🎬

### 一个想法 → 32 条成片管线 · 11 个工位 · 一部能发的片

Auto-Video 是一套**把想法变成成片的工程**：原创口播稿、本地克隆音色配音、32 条成片管线出片，外加 1 个配音前端（[peiyin](peiyin/SKILL.md)）。每条管线是一套**画法 + 镜头语法 + 交付门禁**，参数写死在 `pipeline.json` 里可复现，画面由代码、模板或本机模型确定性渲染，不依赖云端生图 / 生视频 API，也没有按次调用费用。

[![stars](https://img.shields.io/github/stars/DaBaoAgent/Auto-Video?style=flat-square)](https://github.com/DaBaoAgent/Auto-Video/stargazers)
[![last commit](https://img.shields.io/github/last-commit/DaBaoAgent/Auto-Video?style=flat-square)](https://github.com/DaBaoAgent/Auto-Video/commits/main)
![pipelines](https://img.shields.io/badge/pipelines-32%20films%20%2B%201%20frontend-111111?style=flat-square)
![stations](https://img.shields.io/badge/stations-11-111111?style=flat-square)
![samples](https://img.shields.io/badge/samples-83%20clips-e9b47c?style=flat-square)
![roadmap](https://img.shields.io/badge/roadmap-99%20styles-c43b32?style=flat-square)
![license](https://img.shields.io/badge/license-MIT-blue?style=flat-square)

**[▶ 在线样片站](https://dabaoagent.github.io/Auto-Video/)** —— 悬停即播、按工位分组、按横屏/竖屏和时长筛，点开有声播放。

</div>

**目录**：[三张入场券](#start) · [工位地图](#stations) · [统一契约](#contract) · [样片](#showcase) · [怎么生产一条片](#flow) · [快速开始](#quickstart) · [仓库结构](#layout) · [技术栈](#stack) · [常见问题](#faq) · [路线图](#roadmap) · [鸣谢与许可](#credits)

<a id="start"></a>
## 三张入场券 🎟️

| 你想干什么 | 从哪儿进 | 一句话说明 |
| --- | --- | --- |
| 先看看长什么样 | [在线样片站](https://dabaoagent.github.io/Auto-Video/) | 86 段样片，按工位排开；鼠标停住就播，点开插入灯箱有声播放 |
| 想做一条片 | 下面的[工位地图](#stations) → 点管线 → 读 `SKILL.md` | 每条 SKILL.md 是完整流程：入口脚本、参数、验收条件、已知坑 |
| 想加 / 改一条管线 | [统一契约](#contract) | `catalog/pipelines.json` 是唯一事实来源，`tools/validate.py` 负责不许走样 |

<a id="stations"></a>
## 工位地图 🗺️ 32 条成片 + 1 个前端

管线按**工位**分组：工位是「同一套画法血统」的一族，编号即站点与文档中的排序。

### 01 · 纸本叙事　*Paper & Chronicle*

<sub>绢本、纸本、剪影，用卡片的运动语法讲历史：一镜 2–4 秒，字幕贴着真实语音走。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [jianying](jianying/SKILL.md) | 《刘秀·位面之子》 3:31 | 绢本纸本美术 + 卡片运动语法，2–4 秒一镜，字幕贴着从句走。 | Remotion |
| [lishi](lishi/SKILL.md) | 《朱元璋·碽妃疑案》 2:25 | AI 静帧底图 + 代码运镜，句级全量字幕与纸色衬底常驻。 | Remotion |
| [zhidiao](zhidiao/SKILL.md) | 样片待补 | 词级转写与拼音 DP 对齐，HyperFrames 渲一张会动的纸雕灯箱。 | HyperFrames |

### 02 · 手绘笔触　*Hand & Pencil*

<sub>一笔一笔画出来的画面：逐帧手绘、铅笔测试、彩铅排线、平板速写。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [shouhui](shouhui/SKILL.md) | 《商纣王》 3:26 | 纸纹、墨线 boil、墨字书写，cel 火焰与火星，24 fps 线条沸腾。 | Canvas 逐帧 · 浏览器渲染 |
| [pencil](pencil/SKILL.md) | 《阿努纳奇》 0:30 | 蓝线起稿、石墨勾线、橡皮修改，画与画之间 morph。 | Canvas · Chrome 逐帧 |
| [caiqian](caiqian/SKILL.md) | 《鳕鱼》 0:27 | 四张 G-buffer 由后处理叠成彩铅排线，锚定坐标防漂移。 | G-buffer + 后处理 |
| [pingban](pingban/SKILL.md) | 《关羽》 0:39 | 六格手卷，铅笔一笔一笔现场画，镜头跟着笔尖走。 | 纯 Canvas · 零依赖 |

### 03 · 传统工艺　*Traditional Crafts*

<sub>老手艺的样子和节奏：皮影、水墨、灯影、刺绣、上美影手绘赛璐璐。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [piying](piying/SKILL.md) | 《波斯湾伊甸园》 4:32 | 皮影剪影配卡片式讲解，分镜生成与四查门禁。 | Playwright + Canvas 逐帧 |
| [shuimo](shuimo/SKILL.md) | 《羽人》 0:30 | 宣纸底、生成式 SVG 山水、墨渗转场、竖排题记与朱砂印。 | SVG + Canvas |
| [shadow](shadow/SKILL.md) | 《玄奘》 3:23 | 素白幕、木质台框、透光牛皮影人，灯暗换场。 | Canvas · Chrome 逐帧 |
| [tapestry](tapestry/SKILL.md) | 《阿努纳奇》 0:30 | 亚麻底、羊毛绣线、茎针绣与铺线，长卷滚动推进。 | Canvas · Chrome 逐帧 |
| [laolang](laolang/SKILL.md) | 《玄奘》 1:02 | 1980 上美影式手绘赛璐璐，4:3 圆角片门，定稿 toon 人物 24 动作。 | Canvas · Chrome 逐帧 |

### 04 · 卡通动画　*Cartoons*

<sub>经典卡通的角色与节奏：美式黄金卡通、漫画分格、像素、天书奇谭式的民间志怪。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [goldenage](goldenage/SKILL.md) | 《阿努纳奇》 0:30 | 手绘城市背景 + 墨线赛璐璐角色，15 张/秒的抽搐墨线。 | Canvas · Chrome 逐帧 |
| [manga](manga/SKILL.md) | 《阿努纳奇》 0:30 | 黑墨线、网点、分格、拟声词，镜头按阅读顺序读页。 | Canvas · Chrome 逐帧 |
| [xiangsu](xiangsu/SKILL.md) | 《曹操》 0:29 | 640×360 索引色帧缓冲逐像素绘制，×3 最近邻放大并在输出分辨率做 CRT。 | Canvas · Puppeteer 逐帧 |
| [tianshu](tianshu/SKILL.md) | 《镇魔塔》 0:41 | 本地 ComfyUI 出定帧、Wan2.2 出氛围动态，逐镜锚定原片亮度与饱和。 | ComfyUI + Wan2.2 |

### 05 · 平面图形　*Graphic & Motion*

<sub>图形和字当主角：扁平矢量、剪影律动、回形针式图表、尺度漫游。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [shiliang](shiliang/SKILL.md) | 《扁平矢量》 0:30 | 纯色几何世界、弹性入场、元素驱动转场，纯标准库合成 MG-pop 配乐。 | SVG 单页 · 逐帧确定性渲染 |
| [lvdong](lvdong/SKILL.md) | 样片待补 | 纯黑剪影站在落日与水面前，姿势落在 90 BPM 的拍上，关键一拍拍冻结。 | Canvas + 着色器 · 代码合成配乐 |
| [huixingzhen](huixingzhen/SKILL.md) | 《羽人》 9:57 | 实拍照片贴纸化、精确图表、大画布连续运镜。 | HTML 逐帧 · 确定性渲染 |
| [bianping](bianping/SKILL.md) | 《僵尸地球》 0:36 | 从彗星撞木星连续推到黑洞事件视界，Orbi 小眼睛角色做引导。 | SVG 代码绘制 · lemo-opuscar core/render |

### 06 · 屏幕赛博　*Screens & Neon*

<sub>屏幕本身的质感：深青霓虹的 HUD 界面，与合成波 / VHS / Y2K 的年代噪点。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [xianshiqi](xianshiqi/SKILL.md) | 《UAP · 赛博》 0:30 | 深青黑底、青色霓虹线框、雷达扫掠与目标锁定。 | Three.js + Canvas FUI 覆盖层 |
| [xuni](xuni/SKILL.md) | 《朊病毒》 0:30 | 霓虹网格、日落、铬字、扫描线、Y2K 窗口。 | Three.js + Canvas + VHS 后处理 |

### 07 · 三维推演　*3D & Diorama*

<sub>真三维与微缩模型：兵棋推演的战场、生长的城市、等轴正交的粉彩世界。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [tuiyan](tuiyan/SKILL.md) | 《赤壁之战》 9:00 | 全 3D 兵棋推演，稳帧 1080p，音效与 BGM 按关键镜挂。 | 3D 兵棋引擎 · 逐帧稳帧渲染 |
| [chengshi](chengshi/SKILL.md) | 《苏州 · 城长》 2:41 | OSM/Esri/SRTM 真实数据驱动的白模 3D 城市，确定性生长。 | Three.js + Remotion |
| [dengju](dengju/SKILL.md) | 《羽人》 0:30 | 粉彩微缩模型、真正等轴正交相机、地面瓦片波浪与滑轨运镜。 | Three.js 正交场景 |
| [isometric](isometric/SKILL.md) | 《阿努纳奇》 0:30 | 45° 等距微缩世界，带厚底座的方形地块组成系统，镜头连续滑行、讲到哪块就抬起哪块。 | Canvas · Chrome 逐帧 |

### 08 · 地图地理　*Maps & Terrain*

<sub>真实地理数据：Natural Earth 贴纸地图，与卫星地形上按高程起伏的水面。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [map](map/SKILL.md) | 《张骞寻路》 9:04 | Natural Earth 真实底图上，人物贴纸与标注卡锚定经纬度。 | Chrome 逐帧 + ffmpeg |
| [ditu](ditu/SKILL.md) | 《关羽》 0:39 | 卫星地形 + terrarium 高程，按高程起伏的三维水面从 84 km 推到 26 km。 | WebGL · 高程驱动水面 |

### 09 · 图纸说明　*Diagram & Blueprint*

<sub>用图纸讲原理：蓝晒工程图的构造线与标注，黑虚空里的火柴人对比寓言。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [blueprint](blueprint/SKILL.md) | 《玄奘 · 前 10 秒》 0:12 | 蓝晒图纸、白色细线，构造线先出、尺寸与 leader 标注跟进，红铅笔唯一强调。 | Canvas · Chrome 逐帧 |
| [parable](parable/SKILL.md) | 《阿努纳奇》 2:58 | 黑虚空里的白色火柴人，两个角色同一堆材料，一个红色物件承载意义，无切镜。 | Three.js · 固定广角 |

### 10 · 实拍混剪　*Live Footage*

<sub>真画面进场：Pixabay 素材按 id 拼接的竖屏口播，与片源 URL 清单驱动的纪录片解说。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [shipai](shipai/SKILL.md) | 《玛雅》 0:18 | Pixabay 按 id 下载、固定顺序拼接，MoneyPrinterTurbo 出底片，一行式字幕烧入。 | MoneyPrinterTurbo + ffmpeg |
| [jilupian](jilupian/SKILL.md) | 《一口气看完日本3000年》 13:38 | 给一份片源 URL 清单，核验、下载、口播、配音、影子匹配、自动剪辑到发布资料。 | S1–S9 流水线 |

### 11 · 前端工位　*Front of House*

<sub>不成片，但决定片子的前半程：选题、口播稿审计、批量克隆配音与时间轴。</sub>

| 管线 | 样片 | 适合的内容 | 视觉与生产方法 |
| --- | --- | --- | --- |
| [peiyin](peiyin/SKILL.md) | 配音模块 · 无样片 | 选题、口播稿审计、批量克隆配音与时间轴，成片之前的两个阶段。 | GPT-SoVITS · 长稿分段合成 |

<a id="contract"></a>
## 统一契约 📐

过去每条管线的 `pipeline.json` 各写各的：有的 13 个键，有的 19 个键带 `locked` 段落，有的干脆没有这个文件。现在统一成**一份加性契约**：老键一个不动（脚本还在读），只补两块新东西。

```jsonc
{
  "schema": "auto-video/pipeline@2",     // 新增：契约版本
  "meta": {                               // 新增：登记信息，与 catalog 逐字段相等
    "id": "lishi",
    "no": "02",
    "station": "paper",
    "name_zh": "纸本史话",
    "aspect": "16:9", "fps": 30, "status": "live",
    "entry": "scripts/lishi.py"
  },
  "paths": { ... },                       // 历史扁平键：原地保留，一个没动
}
```

| 文件 | 作用 |
| --- | --- |
| [`catalog/pipelines.json`](catalog/pipelines.json) | 33 条管线的登记表：id / 工位 / 中英名 / 一句话 / 引擎 / 画幅 / 帧率 / 入口 / 状态 / 样片。站点的数据从它生成 |
| [`catalog/stations.json`](catalog/stations.json) | 11 个工位：编号、中英名、说明、段末诗意句 |
| [`schema/pipeline.schema.json`](schema/pipeline.schema.json) | JSON Schema（draft 2020-12）：`schema` + `meta` 必填；顶层 `additionalProperties: true`，历史扁平键合法 |
| `*/pipeline.json` | 每条管线自己的定版参数：新增 `schema` + `meta`，其余键原样保留 |

### 工具链（纯标准库 + 本机 ffmpeg）

| 命令 | 干什么 |
| --- | --- |
| `python tools/validate.py` | 查契约：id 唯一、工位存在、`SKILL.md` frontmatter 对得上目录、`meta` 与 catalog 逐字段相等、入口文件真实存在、仓库里的目录与 catalog 双向不脱漏 |
| `python tools/validate.py --samples-dir "<样片目录>"` | 顺带核对 catalog 里登记的样片文件是否都在 |
| `python tools/normalize_pipelines.py` | 幂等补齐：给缺 `pipeline.json` 的管线建骨架、给已有文件补 `schema` + `meta`（保持原键顺序）、给缺 frontmatter 的 SKILL.md 补头 |
| `python tools/build_samples.py` | 把原始样片压成网页用短片（管线 1280 长边 / 10 s / crf 30，风格 640 / 8 s / crf 32）+ 抽封面，写 `site/assets/samples.json` |
| `python tools/build_site.py` | catalog + samples → `site/assets/data.js` |
| `python tools/build_fonts.py` | 按站点实际用字子集化思源宋 / 黑，出 woff2（约 600 KB，站点离线也有中文字形） |

### 单一入口：一条管线一个命令

33 条管线里 33 条都有 `entry`，`tools/validate.py` 会验证它真实存在。约定是 `python <管线>/scripts/<管线>.py <阶段>`，任何一条都能先 `check` 再 `--plan` 看命令：

| 管线 | 入口 | 最常用的三步 |
| --- | --- | --- |
| [piying](piying/SKILL.md) | `scripts/piying.py` | `check` → `plan full` → `full`（六步 node 串成一条） |
| [xiangsu](xiangsu/SKILL.md) | `scripts/xiangsu.py` | `check` → `plan demo` → `demo`（bash 缺失会明确报错） |
| [tuiyan](tuiyan/SKILL.md) | `scripts/tuiyan.py` | `check` → `plan all` → `all --out <目录>` |
| [jilupian](jilupian/SKILL.md) | `scripts/jilupian.py` | `check` → `--batch <批> --manifest <清单>`（转发给 `autoup.run`） |

这四条原先各自散着：皮影是六条 node 命令、像素是两条 bash 链、推演要在 `vendor/battlefield-editor` 里换目录跑、纪录片只能 `python -m autoup.run`。现在入口只做三件事——找对解释器/工作目录、按顺序串联、缺依赖时把缺什么说清楚；渲染参数与定版数值一个没改。

### 加一条新管线要做的四件事

1. 建目录 `mynew/`，写 `SKILL.md`（开头 YAML frontmatter：`name` 必须等于目录名）与 `mynew/pipeline.json`；
2. 在 `catalog/pipelines.json` 登记一条，指定 `station`（没有合适工位就新开一个并写进 `catalog/stations.json`）；
3. `python tools/normalize_pipelines.py` 让 `pipeline.json` 的 `meta` 与登记表对齐；
4. `python tools/validate.py` 过一遍，把样片丢进源目录后 `python tools/build_samples.py && python tools/build_site.py`，推上去站点自动更新。

<a id="flow"></a>
## 一条片怎么生产 🔄

```mermaid
flowchart LR
    A[选题 / 对标视频链接] --> B[原创口播稿]
    B --> C[本地配音 · 克隆音色]
    C --> D[分镜与素材]
    D --> E[画面组装]
    E --> F[视频渲染]
    F --> G[质量检查]
    G --> H[封面与发布包]
```

| 阶段 | 输入 | 产出 | 通过条件 |
| --- | --- | --- | --- |
| 选题与口播稿 | 选题 / 对标链接、内容规约 | 原创口播稿 | 过 AI 味审计，多音字 / 外文人名读音校正 |
| 本地配音 | 口播稿、克隆音色 | 分句配音、时间轴 | 审查门禁通过（呼吸、幕间停顿、崩词） |
| 配音对齐 | 口播稿、配音 | 词级或句级时间轴 | 字幕切点贴着真实语音 |
| 分镜 | 时间轴、分镜表 | 镜头计划与素材映射 | 镜数、场景数、时长一致 |
| 组装渲染 | 分镜、模板、字体、素材 | 分段视频或完整成片 | 参数可复现，画面无结构性错误 |
| 质检 | 成片、时间轴、渲染数据 | 检查结果 | 字幕、频闪、补间、抽帧、响度通过 |
| 交付 | 成片、封面、发布信息 | 可直接发布的目录 | 文件结构、尺寸、元信息符合规则 |

<a id="showcase"></a>
## 样片 🖼️ 86 段，全部可在站点播

`site/media/` 里是压过的网页短片（管线样片 1280 长边 × 10 s，风格样片 640 × 8 s，共 29.4 MB），原片不动，仍留在作者的同步盘里。

**管线样片 30 条**（点管线看文档，点片名去站点看）：

| 工位 | 管线 | 样片 | 原片时长 |
| --- | --- | --- | --- |
| 01 纸本叙事 | [jianying](jianying/SKILL.md) | 《刘秀·位面之子》 | 3:31（1920×1080） |
| 01 纸本叙事 | [lishi](lishi/SKILL.md) | 《朱元璋·碽妃疑案》 | 2:25（1920×1080） |
| 02 手绘笔触 | [shouhui](shouhui/SKILL.md) | 《商纣王》 | 3:26（1920×1080） |
| 02 手绘笔触 | [pencil](pencil/SKILL.md) | 《阿努纳奇》 | 0:30（1920×1080） |
| 02 手绘笔触 | [caiqian](caiqian/SKILL.md) | 《鳕鱼》 | 0:27（1920×1080） |
| 02 手绘笔触 | [pingban](pingban/SKILL.md) | 《关羽》 | 0:39（1920×1080） |
| 03 传统工艺 | [piying](piying/SKILL.md) | 《波斯湾伊甸园》 | 4:32（1920×1080） |
| 03 传统工艺 | [shuimo](shuimo/SKILL.md) | 《羽人》 | 0:30（1920×1080） |
| 03 传统工艺 | [shadow](shadow/SKILL.md) | 《玄奘》 | 3:23（960×540） |
| 03 传统工艺 | [tapestry](tapestry/SKILL.md) | 《阿努纳奇》 | 0:30（1920×1080） |
| 03 传统工艺 | [laolang](laolang/SKILL.md) | 《玄奘》 | 1:02（1920×1080） |
| 04 卡通动画 | [goldenage](goldenage/SKILL.md) | 《阿努纳奇》 | 0:30（1920×1080） |
| 04 卡通动画 | [manga](manga/SKILL.md) | 《阿努纳奇》 | 0:30（1920×1080） |
| 04 卡通动画 | [xiangsu](xiangsu/SKILL.md) | 《曹操》 | 0:29（1920×1080） |
| 04 卡通动画 | [tianshu](tianshu/SKILL.md) | 《镇魔塔》 | 0:41（960×720） |
| 05 平面图形 | [shiliang](shiliang/SKILL.md) | 《扁平矢量》 | 0:30（1920×1080） |
| 05 平面图形 | [huixingzhen](huixingzhen/SKILL.md) | 《羽人》 | 9:57（1920×1080） |
| 05 平面图形 | [bianping](bianping/SKILL.md) | 《僵尸地球》 | 0:36（1920×1080） |
| 06 屏幕赛博 | [xianshiqi](xianshiqi/SKILL.md) | 《UAP · 赛博》 | 0:30（1920×1080） |
| 06 屏幕赛博 | [xuni](xuni/SKILL.md) | 《朊病毒》 | 0:30（1920×1080） |
| 07 三维推演 | [tuiyan](tuiyan/SKILL.md) | 《赤壁之战》 | 9:00（1920×1080） |
| 07 三维推演 | [chengshi](chengshi/SKILL.md) | 《苏州 · 城长》 | 2:41（1920×1080） |
| 07 三维推演 | [dengju](dengju/SKILL.md) | 《羽人》 | 0:30（1920×1080） |
| 07 三维推演 | [isometric](isometric/SKILL.md) | 《阿努纳奇》 | 0:30（1920×1080） |
| 08 地图地理 | [map](map/SKILL.md) | 《张骞寻路》 | 9:04（1280×720） |
| 08 地图地理 | [ditu](ditu/SKILL.md) | 《关羽》 | 0:39（1920×1080） |
| 09 图纸说明 | [blueprint](blueprint/SKILL.md) | 《玄奘 · 前 10 秒》 | 0:12（1920×1080） |
| 09 图纸说明 | [parable](parable/SKILL.md) | 《阿努纳奇》 | 2:58（1280×720） |
| 10 实拍混剪 | [shipai](shipai/SKILL.md) | 《玛雅》 | 0:18（1080×1920） |
| 10 实拍混剪 | [jilupian](jilupian/SKILL.md) | 《一口气看完日本3000年》 | 13:38（1920×1080） |

**暂无样片 2 条**：[`zhidiao`](zhidiao/SKILL.md)、[`lvdong`](lvdong/SKILL.md)。

另有一条 [`peiyin`](peiyin/SKILL.md) **不算缺样片**：它是配音前端，只出口播稿与配音，不出片，所以本来就不该有片子可播；站点上它的卡片标「配音模块 · 无样片」并直接指向文档。

另有 56 段**风格样片**（`BB-Video` 风格库与年代命名为主的横向抽样：1930s 橡皮管、50s 扁平卡通、浮世绘、钢笔淡彩、蜡笔绘本、孟菲斯微缩、皮影戏、纸雕灯影、中国水墨、装饰艺术、HD-2D，以及 ascii / bauhaus / collage / cutout / riso / swiss / pixel / pop 等英文风格线），它们不进管线的元数据，只在站点的「样片库」里作为风格参考。

### 完整成片（本地归档，未入库）

本批 9 部完整成片共约 2.3 GB，存于作者本地同步盘（`1 MG 动画/管线样片/`），不随仓库提交；片名与时长取自交付文件。

| 管线 | 成片 | 时长 | 画面 |
| --- | --- | --- | --- |
| [jianying](jianying/SKILL.md) | 刘秀·位面之子 | 211.0 s | 1920×1080 / 30 fps |
| [lishi](lishi/SKILL.md) | 朱元璋·碽妃疑案 | 144.9 s | 1920×1080 / 30 fps |
| [piying](piying/SKILL.md) | 波斯湾伊甸园 | 272.2 s | 1920×1080 / 30 fps |
| [shouhui](shouhui/SKILL.md) | 商纣王 | 205.7 s | 1920×1080 / 24 fps |
| [tuiyan](tuiyan/SKILL.md) | 3D 赤壁之战 | 539.8 s | 1920×1080 / 30 fps |
| [huixingzhen](huixingzhen/SKILL.md) | 羽人 | 597.3 s | 1920×1080 / 30 fps |
| [chengshi](chengshi/SKILL.md) | 苏州·城长 | 160.7 s | 1920×1080 / 30 fps |
| [jilupian](jilupian/SKILL.md) | 一口气看完日本3000年 | 818.4 s | 1920×1080 / 30 fps |
| youxi（待封装） | 仁德天皇陵 | 192.7 s | 1920×1080 / 30 fps |

### 更多画面

![lishi 历史科普短片画面](showcase/frames/lishi-jianan13.png)

<sub>`lishi` 的纸本视觉系统：楷体纪年、绢本底图、代码运镜与句级字幕（《建安十三年 · 我五十三岁》）。</sub>
<a id="quickstart"></a>
## 快速开始 🚀

```bash
git clone https://github.com/DaBaoAgent/Auto-Video.git
cd Auto-Video
```

仓库保存管线、模板、契约文件与 86 段网页样片（约 40 MB）；模型权重、外部渲染运行时与完整成片不在仓库内（见 [效果展示](#showcase)）。

<details>
<summary>环境与外部依赖总表（按管线）</summary>

| 管线 | Python | Node | 浏览器 | ffmpeg | 外部引擎与其他 |
| --- | --- | --- | --- | --- | --- |
| jianying | 3.11+ | 18+ | — | ffmpeg、ffprobe、numpy | Remotion、GPT-SoVITS |
| lishi | 3.11+ | 18+ | — | ffmpeg、ffprobe | Remotion、GPT-SoVITS |
| piying | — | 20+ | Edge 或 Chrome | ffmpeg、ffprobe | Playwright |
| shouhui | 3.10+ | 18+ | Edge | ffmpeg | mg-styles-15 |
| zhidiao | 3.10+ | 见 MIGRATION | 无头浏览器 | ffmpeg | HyperFrames、GPT-SoVITS、Faster-Whisper |
| tuiyan | 3.10+ | 18+ | Edge 或 Chrome | ffmpeg | battlefield-editor（仓库自带） |
| jilupian | 3.11+ | — | — | ffmpeg、ffprobe | uv、OpenAI 兼容模型、GPT-SoVITS 或 Edge TTS |
| xuni · shiliang · xianshiqi · dengju · shuimo | 3.11+ | 18+ | Edge | ffmpeg | mg-styles-15 |
| huixingzhen | 3.11+ | 18+ | Edge | ffmpeg | mg-styles-15、`shouhui/node_modules` |
| xiangsu | 3.10+（numpy） | 18+ | Chrome | ffmpeg、ffprobe | mg-styles-15、bash（Git Bash / WSL） |
| chengshi | numpy、Pillow | 18+ | Edge（ANGLE） | ffmpeg | Remotion、GPT-SoVITS、OSM / Esri / SRTM 数据 |
| peiyin | 3.10+ | — | — | ffmpeg | GPT-SoVITS（权重由 `setup.ps1` 拉取） |
| shipai | 3.11+（复用 MoneyPrinterTurbo 的 `.venv`） | — | — | ffmpeg、ffprobe | MoneyPrinterTurbo（本地部署）、faster-whisper、Pillow、Pixabay key |
| goldenage · manga · tapestry · pencil · isometric · parable · shadow · blueprint | 3.9+（只用标准库） | 18+ | Chrome 或 Edge | ffmpeg、ffprobe | BB-Video 浏览器运行时（仓库自带）；isometric / parable 需 Three.js import map（CDN） |

</details>

### jianying

需要 Python 3.11+、Node.js 18+、ffmpeg、numpy 和 ffprobe。新选题从 `new` 开始，`init` 会把模板和依赖链接到选题目录：

```bash
python jianying/scripts/jianying_shotcraft.py new myfilm --title "标题"
python jianying/scripts/jianying_shotcraft.py init --project myfilm
python jianying/scripts/jianying_shotcraft.py all --project myfilm
```

逐行配音还需要 GPT-SoVITS。完整入口、镜头卡和验收规则见 [jianying/SKILL.md](jianying/SKILL.md)。

### lishi

需要 Python 3.11+、Node.js 18+、ffmpeg 和 ffprobe。选题目录准备好 `film.json`、分镜表和底图后，可从探针与整链开始：

```bash
python lishi/scripts/lishi.py probe --project <slug>
python lishi/scripts/lishi.py all --project <slug>
```

完整入口与参数见 [lishi/SKILL.md](lishi/SKILL.md) 和 [lishi/pipeline.json](lishi/pipeline.json)。

### shouhui

需要 Python 3.10+、Node.js 18+、Edge 和 ffmpeg。仓库带有完整的商纣王示例工程；渲染前还要按迁移说明安装 `mg-styles-15` 渲染引擎：

```bash
python shouhui/scripts/shouhui.py probe 012_shangzhouwang
python shouhui/scripts/shouhui.py stills 012_shangzhouwang --times 1,3,5,7,9
python shouhui/scripts/shouhui.py render 012_shangzhouwang
```

完整环境和外部依赖见 [shouhui/MIGRATION.md](shouhui/MIGRATION.md)，手绘管线规则见 [shouhui/SKILL.md](shouhui/SKILL.md)。

### piying

需要 Node.js 20+、Edge 或 Chrome、ffmpeg 和 ffprobe。渲染示例页前先安装 Playwright：

```bash
cd piying
npm ci
cd render/piying
node gen_full_yandi.js
node qc_full_yandi.js
node audit_yandi.js full
```

迁移后的素材路径已经改为模块内相对路径。完整规格与门禁说明见 [piying/SKILL.md](piying/SKILL.md) 和 [piying/MIGRATION.md](piying/MIGRATION.md)。

### zhidiao

首次运行前要先准备 GPT-SoVITS、Faster-Whisper、HyperFrames，以及单片 composition 使用的共享样式、GSAP 和字体。迁移与依赖说明见 [zhidiao/MIGRATION.md](zhidiao/MIGRATION.md)。

```bash
cd zhidiao
python scripts/zhidiao_make_audio.py
python scripts/zhidiao_assemble.py --slug <slug>
```

封面、分镜素材和交付打包工具都在 `zhidiao/tools/`。完整七阶段流程见 [zhidiao/references/pipeline.md](zhidiao/references/pipeline.md)。

### tuiyan

需要 Node.js 18+、Python 3.10+、ffmpeg 和 Edge/Chrome。渲染引擎与赤壁之战 46 幕完整包在 `vendor/battlefield-editor/`（迁移自 alannew 项目，只保留最终成片管线），首次运行先装节点依赖：

```powershell
Set-Location tuiyan/vendor/battlefield-editor
npm ci
node tools/validate-data.mjs --pkg packages/chibi-full/battlefield.json   # 数据校验
$env:PROXY = "1"
node tools/verify-zh.mjs                                                  # 中文残留门禁（errors: 0）
node tools/render-film.mjs --pkg packages/chibi-full/battlefield.json --out <输出目录>  # 全片稳帧渲染
```

TTS 配音、影视原声 OST 为本机自备项；完整说明与依赖见 [tuiyan/SKILL.md](tuiyan/SKILL.md)、[tuiyan/MIGRATION.md](tuiyan/MIGRATION.md)。

### jilupian

需要 Python 3.11+、uv、ffmpeg/ffprobe，以及一个 OpenAI 兼容模型服务（默认智谱 GLM）。给一份片源 URL 清单即可自动出片：

```powershell
Set-Location jilupian
uv sync --all-extras --locked
$env:GLM_API_KEY = "你的 API Key"
uv run python -m autoup.run --manifest urls.txt --batch 202611-A
```

配音默认走 GPT-SoVITS 本地服务（可自备，或 `--set voice.engine=edge_tts` 切免费方案）。配音模块、模型、字体等外部依赖一律引导下载，见 [jilupian/MIGRATION.md](jilupian/MIGRATION.md)；完整规则见 [jilupian/SKILL.md](jilupian/SKILL.md)。

### xuni / shiliang / xianshiqi / dengju / huixingzhen / shuimo

六条 MG 风格短片管线（合成波、扁平矢量、赛博 HUD、等轴 2.5D、回形针科普、纸本水墨），从 `AutoJY` 迁移，名字不变。需要 Node.js 18+、Python 3.11+、ffmpeg 和 Edge；渲染引擎 `mg-styles-15` 未随仓库提交（与 shouhui 共用），首次先安装：

```powershell
git clone --depth 1 https://github.com/Vincentwei1021/mg-styles-15.git vendor/mg-styles-15
Set-Location vendor/mg-styles-15; npm install; Set-Location ../..
New-Item -ItemType Junction -Path 'xuni/node_modules' -Target 'vendor/mg-styles-15/node_modules'   # 各管线各自建联接
```

以 xuni 为例（其余管线入口同名，见各自 README）：

```bash
python xuni/scripts/xuni.py probe 009_prion30
python xuni/scripts/xuni.py stills 009_prion30 --times 0.3,7.7,13.5,27.8
python xuni/scripts/xuni.py audio 009_prion30
python xuni/scripts/xuni.py render 009_prion30
python xuni/scripts/xuni.py mux 009_prion30
python xuni/scripts/xuni.py qa 009_prion30
python xuni/scripts/xuni.py publish 009_prion30
```

- `shuimo` 走 `shuimo.py` 编排（new/cues/audio/stills/render/sheet/mux/qa/publish），示例工程 `projects/yuren30`（013《羽人》30 秒样片）；`shuimo/node_modules` 同样建联接（只用到 puppeteer-core）。
- `huixingzhen` 走 `render_frames.mjs` + 素材/音效脚本，参考实现 `projects/paperclip_zhou`（商纣王 20 秒，**未随仓库提交**，需自备）；渲染器复用 `shouhui/scripts/render.mjs` 的 puppeteer-core，依赖 `shouhui/node_modules` 联接。

MG 组 5 条自带示例工程（xuni=009_prion30、shiliang=010_shengming30、xianshiqi=UAP30、dengju=yuren30、shuimo=yuren30）与 `pipeline.json` 定版参数；`huixingzhen` 的定稿参数在 `theme/dark.css`，参考工程需自备。完整说明见各管线 [SKILL.md](xuni/SKILL.md)。

### xiangsu

像素风管线：画面在 640×360 索引色帧缓冲里逐像素决定，×3 整数最近邻放大到 1920×1080，CRT 在输出分辨率上做。需要 Node.js 18+、Chrome、ffmpeg/ffprobe、Python+numpy 和 bash（Windows 用 Git Bash 或 WSL），渲染复用上一条的 `mg-styles-15` harness（`harness/render.mjs`、`tools/density.mjs`、像素字体）：

```bash
cd xiangsu
# 脚本内默认路径仍是迁移前的 yandi 目录，运行前必须覆盖（见 SKILL.md「环境变量」）
export XIANGSU_REPO="$PWD/../vendor/mg-styles-15"
export XIANGSU_PROJ="<本片项目目录>"
export XIANGSU_PY="<本机 python.exe，需 numpy>"
bash build.sh                # 10 秒样片：音轨 → 渲染 1920×1080 → 4 项验收
bash build.sh --no-audio     # 复用 audio.wav，只重渲画面
```

全片链路在 `xiangsu/full/`（先 `cd xiangsu/full`）：`node assemble.mjs`（拼装 `demo/film.js` 片头 + `parts/*.js`）→ `bash build_full.sh`（音轨 → 渲染 → 验收）→ `node make_covers.mjs --final`（4:3 / 3:4 双封面）。片级参数 `XIANGSU_PROJ/FILM/DUR/COVER_OUT` 不给默认值，缺省直接报错。完整参数、冻结基线与验收口径见 [xiangsu/SKILL.md](xiangsu/SKILL.md) 与 [xiangsu/README.md](xiangsu/README.md)。

### chengshi

城市年轮管线：用 OSM 建筑/道路/水系、Esri 卫星影像与 SRTM 地形确定性渲染一座城市的年代演进（Three.js + Remotion），从 `AutoJY` 迁移，名字统一为 chengshi（无 sz 别名）。需要 Python（numpy/Pillow）、Node 18+、Edge（ANGLE）与 ffmpeg；逐句配音走本机 GPT-SoVITS（API 9880）。

渲染工程两个目录：`chengshi/render`（苏州 v2 分镜，原名 `template_v2` → `sz` → 现归一到 `render`，`render_cut_v2.py` 用它）与 `chengshi/template`（通用 v1，`render_cut.py` 用它，`make_city.py` 默认走这条）。**运行时依赖不在仓库里**：`.venv/`、Remotion 的 `node_modules`、Edge、ffmpeg、GPT-SoVITS 都需本机自备，缺依赖时先在渲染工程目录 `npm install`。

```powershell
# 建骨架（bbox 顺序：南,西,北,东）；仓库根目录先建好 .venv（numpy / Pillow）
$env:PYTHONIOENCODING = "utf-8"
.\.venv\Scripts\python.exe chengshi/scripts/chengshi.py new --project <slug> --title "成都·一座城的年轮" --bbox 30.6,104.0,30.8,104.2

# 一键出片：抓 OSM/SRTM/Esri → 白模 → TTS → 混音（-15 LUFS）→ 1080p 审片
.\.venv\Scripts\python.exe chengshi/scripts/make_city.py --project <slug>

# 单帧预览与交付（母版 + 封面 + 裁切 + 发布信息）
.\.venv\Scripts\python.exe chengshi/scripts/chengshi.py still --project <slug> --frame 300
.\.venv\Scripts\python.exe chengshi/scripts/chengshi.py publish --project <slug>
```

示例工程在仓库根目录的 `projects/suzhou`（苏州《城长》160.7 s，完整成片见 [效果展示](#showcase)）；4K 母版需 `--allow-4k`。六个叙事数据文件、运行手册与质量硬约束见 [chengshi/USAGE.md](chengshi/USAGE.md)，完整规则见 [chengshi/SKILL.md](chengshi/SKILL.md)。

### shipai

实拍素材口播竖屏短片：**一个人的声音 + 一堆真实拍到的画面 + 一行一行跟着语音出现的字幕**，1080×1920 / 30 fps。画面不生成也不绘制，全部来自 Pixabay 实拍；管线只负责把「配音切段 → 素材挑选排序 → 底片 → 字幕」接顺。需要 Python 3.11（可直接复用 MoneyPrinterTurbo 的 `.venv`，`faster-whisper` 与 `Pillow` 都在里面）、ffmpeg/ffprobe、本地部署好的 [MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) 与 Pixabay key：

```powershell
$py = "D:\@kaifa\MoneyPrinterTurbo\.venv\Scripts\python.exe"   # 或 SHIPAI_PY 指定

# 建工程 → 切段与逐句时间 → 检索素材 → 按 id 下载（顺序即拼接顺序）
& $py shipai\scripts\shipai.py new 004_玛雅巨人文明 --text 口播稿.md --wav 配音.wav --paragraph 1
& $py shipai\scripts\shipai.py vo       004_玛雅巨人文明 --paragraph 1
& $py shipai\scripts\shipai.py terms    004_玛雅巨人文明 --terms "mayan ruins|jungle temple"
& $py shipai\scripts\shipai.py material 004_玛雅巨人文明 --ids 35423,144043,144042,22200,281134

# 出无字幕底片 → 烧一行式字幕 → 校验
& $py shipai\scripts\shipai.py base    004_玛雅巨人文明
& $py shipai\scripts\shipai.py caption 004_玛雅巨人文明
& $py shipai\scripts\shipai.py probe   004_玛雅巨人文明
```

首个实例 `shipai/projects/004_玛雅巨人文明/`：玛雅巨人文明第一大段，17.9 s，12 条字幕，5 段 Pixabay 实拍（危地马拉丛林金字塔、特奥蒂瓦坎太阳金字塔）；音频与成片不入库。已知坑（MPT 的 `--video-source` 默认 pexels、拼接默认 shuffle、自定义音频下字幕链失效）与字幕定版参数见 [shipai/SKILL.md](shipai/SKILL.md)、[shipai/references/](shipai/references/)。

### goldenage / manga / tapestry / pencil / isometric / parable / shadow / blueprint / laolang

九条从 BB-Video 33 种风格里迁出的成片管线，都用同一套「口播稿 → 配音 → 时间轴 → 纯函数画面 → Chrome 逐帧 → ffmpeg」链路；运行时代码随管线 vendored（MIT），不依赖外部渲染引擎。九条都带完整样片工程、`--check`、抽帧和 QA（其中 `laolang` 带玄奘 60 秒样片）：

```bash
# 以 goldenage 为例；其余八条把 goldenage 换成 manga / tapestry / pencil / isometric / parable / shadow / blueprint / laolang
python goldenage/scripts/goldenage.py new projects/<名字> --title "片名"
python goldenage/scripts/goldenage.py vo projects/<名字> --src 配音.wav --text 口播稿.txt
python goldenage/scripts/goldenage.py check  projects/<名字>
python goldenage/scripts/goldenage.py stills projects/<名字> --times 2,8,15,25
python goldenage/scripts/goldenage.py render projects/<名字> --scale 0.6667
python goldenage/scripts/goldenage.py deliver projects/<名字> --chugao 出稿/<编号>_<选题> --name "goldenage_片名_样片_1080p"
```

- `template/` 是各自完整样片的做法（不是空白模板）：`index.html` 逐幕画面、`brief.md` 事实表、`storyboard.md` 分镜、`score.js` / `sound.js` 配乐音效；`laolang` 用的是玄奘 60 秒样片。
- 九条管线各自的风格规则、逐幕做法与已知坑见 [goldenage/SKILL.md](goldenage/SKILL.md)、[manga/SKILL.md](manga/SKILL.md)、[tapestry/SKILL.md](tapestry/SKILL.md)、[pencil/SKILL.md](pencil/SKILL.md)、[isometric/SKILL.md](isometric/SKILL.md)、[parable/SKILL.md](parable/SKILL.md)、[shadow/SKILL.md](shadow/SKILL.md)、[blueprint/SKILL.md](blueprint/SKILL.md)、[laolang/SKILL.md](laolang/SKILL.md)。
- `isometric` 与已有的 `dengju`（mg-styles-15 等轴 2.5D）都画等距世界，但实现不同：`isometric` 是 BB-Video 的地块/路线/连续镜头运行时，`dengju` 是 mg-styles-15 的瓦片波浪运镜；按项目需要选。
- `shadow` 与已有的 `piying` 都做皮影，但 `piying` 是 Playwright/Canvas 的剪影+卡片式讲解，`shadow` 是 BB-Video 的透光牛皮影人、操纵杆道具、红纸签与灯暗换场；按项目需要选。
- `blueprint` 是蓝晒工程图，适合机构/机器/系统原理；它和 `swiss`（瑞士排版）、`launch`（产品发布）不是一类，按「要把原理画成图纸」的需求选。
- `laolang` 是 1980 上美影手绘赛璐璐（老狼请客式）：4:3 片门、装饰绘景、定稿 toon 人物、24 动作、30 fps 稳定版；和 `goldenage`（美式橡皮管卡通）不是一类，按「要中国、手作、慢」的气质选。

### peiyin

前端模块：选题 → 出稿 → 配音。需要 Python 3.10+、PowerShell 和本地 GPT-SoVITS 环境；权重与音色约 2.4 GB，由 `setup.ps1` 引导下载，不入库：

```powershell
# 一键初始化：校验/拉取权重、建 venv、装 torch、健康检查
pwsh -File .\peiyin\scripts\setup.ps1
# 已有 GPT-SoVITS 安装时，直接复制缺失资源
pwsh -File .\peiyin\scripts\setup.ps1 -WeightsFrom <旧 GPT-SoVITS 安装目录>

# 批量配音（自然段合成，默认 dabao 音色）
& '.\peiyin\GPT-SoVITS\.venv\Scripts\python.exe' `
  '.\peiyin\scripts\synthesize_dabao_paragraphs.py' `
  --text-file <口播稿定稿.txt> --out <输出目录\配音.wav> --paragraph-gap-ms 200

# 审查门禁（small 全片回听，疑似漏点用 medium 回到对应自然段复听）
.\peiyin\scripts\check_dabao_audio.ps1 -TopicDir <输出目录> -ExpectedParagraphGapMs 220
```

门禁产物为 `配音审查报告.md`（人工复核）与 `配音审查.json`（机器结果），规格、全文覆盖或收尾任一失败都不得交付。完整规约见 [peiyin/SKILL.md](peiyin/SKILL.md) 与 [peiyin/README.md](peiyin/README.md)。

<a id="layout"></a>
## 仓库结构 🗂️

```text
Auto-Video/
├── README.md                 # 本文件
├── .gitignore
├── .github/workflows/
│   └── pages.yml             # 校验 + 建站 + 部署 GitHub Pages
├── catalog/
│   ├── pipelines.json        # 33 条管线的登记表（唯一事实来源）
│   └── stations.json         # 11 个工位
├── schema/
│   └── pipeline.schema.json  # pipeline.json 的 JSON Schema（schema + meta 必填）
├── tools/
│   ├── av/                   # 共用小工具（读 JSON、探片、跑命令、解析 frontmatter）
│   ├── validate.py           # 契约校验 + 反向目录检查（可带 --samples-dir）
│   ├── normalize_pipelines.py# 幂等补齐 schema + meta 与 SKILL.md frontmatter
│   ├── build_samples.py      # 压网页样片 + 抽封面 → site/media + samples.json
│   ├── build_site.py         # catalog + samples → site/assets/data.js
│   └── build_fonts.py        # 字体子集化 → site/fonts/*.woff2
├── docs/
│   └── AUDIT.md              # 仓库审查记录：不统一点、改了什么、还剩什么
├── site/                     # 样片站（静态，无构建依赖）
│   ├── index.html
│   ├── assets/               # app.css / app.js / data.js / samples.json
│   ├── fonts/                # 思源宋 600 + 思源黑 400 子集
│   └── media/                # 86 段网页短片 + 86 张封面
├── projects/
│   └── suzhou/               # chengshi 示例工程：苏州《城长》160.7 s（data/ + film.json）
├── showcase/
│   ├── showcase-grid.gif     # 9 条管线样片九宫格
│   ├── showcase-poster.jpg   # 样片拼图封面
│   └── *_30s.mp4             # 早先的 30 秒原片（站点已改用 site/media/ 的压片）
│   └── frames/               # 样片抽帧与 README 配图
├── map/
│   ├── SKILL.md              # 地图动画管线入口
│   ├── pipeline.json         # 定版参数
│   ├── runtime/              # 浏览器运行时 + 渲染器（BB-Video MIT）
│   ├── scripts/              # 建工程、配音对齐、渲染、交付
│   ├── references/           # 贴纸规范、分镜、QA
│   ├── template/             # 8 s 可运行模板
│   └── projects/zhangqian/   # 张骞全片实例（代码/文案/44 张贴纸）
├── jianying/
│   ├── SKILL.md              # 纸本历史短片入口
│   ├── MIGRATION.md
│   ├── scripts/              # 七阶段编排与制作脚本
│   ├── cards/                # 镜头运动语法
│   ├── references/           # 流程、主题、声音与验收规则
│   └── template/             # Remotion 画面工程
├── lishi/
│   ├── SKILL.md              # 纸本历史科普短片入口
│   ├── pipeline.json         # 定版参数
│   ├── references/           # 分镜、QA 与发布规则
│   ├── scripts/              # 对齐、分镜、音轨、渲染、封装
│   └── template/             # Remotion 画面工程
├── piying/
│   ├── SKILL.md              # 皮影剪影管线入口
│   ├── MIGRATION.md
│   ├── docs/ · references/   # 成片规则、段落分配与生产规格
│   ├── render/piying/        # 分镜、渲染、QC 与交付门禁
│   ├── output/               # 炎帝示例输入与素材
│   └── tools/                # 配音、转写与素材处理
├── shouhui/
│   ├── SKILL.md              # 逐帧手绘短片入口
│   ├── MIGRATION.md
│   ├── scripts/              # 编排、逐帧渲染与音效
│   └── projects/             # 示例工程与可直接查看的样片
├── zhidiao/
│   ├── SKILL.md              # 纸雕剪影长视频入口
│   ├── MIGRATION.md
│   ├── references/           # 目录契约、渲染、质检与交付规则
│   ├── scripts/              # 配音对齐、组装、审计、抽帧
│   └── tools/                # TTS、分镜素材、封面与交付打包
├── tuiyan/
│   ├── SKILL.md              # 历史战争推演视频入口（全 3D 战场重现）
│   ├── MIGRATION.md
│   ├── pipeline/laorou/      # 口播稿子管线（机检 + 中文去味）
│   ├── scripts/              # 封面、试听、抽帧审核、发布校验
│   ├── references/           # 开发报告总纲
│   └── vendor/battlefield-editor/  # 3D 兵棋引擎 + 赤壁之战 46 幕完整包
├── jilupian/
│   ├── SKILL.md              # 纪录片解说流水线入口（S1–S9）
│   ├── MIGRATION.md
│   ├── autoup/               # 主包：阶段、TTS 适配器、配置
│   ├── references/           # 内容风格、下载规则、流程规格
│   ├── docs/                 # 产品规则、剪辑策略、开发记录
│   └── tests/                # 测试与 CI 门禁
├── goldenage/ · manga/ · tapestry/ · pencil/ · isometric/ · parable/ · shadow/ · blueprint/ · laolang/
│                            # 九条 BB-Video 风格管线：SKILL.md + runtime/ + scripts/ + references/ + template/
│                            # 完整样片工程随各自 template/ 入库（无音频与成片；laolang 是玄奘 60 秒样片）
├── shipai/
│   ├── SKILL.md              # 实拍素材口播竖屏短片入口
│   ├── pipeline.json         # 定版参数（画幅 / 引擎 / 素材 / 字幕 / 校验）
│   ├── scripts/              # 编排、切段对齐、素材检索下载、字幕烧录
│   ├── references/           # MPT CLI 契约、素材规则、字幕规范、交付
│   └── projects/             # 004 玛雅巨人文明实例（口播稿 / 时间轴 / 素材 id，无音频与成片）
├── xuni/
│   ├── SKILL.md              # 合成波 / VHS / Y2K 短片入口
│   ├── README.md · CREDITS.md · pipeline.json
│   ├── scripts/              # 编排、配乐、混音、逐帧渲染
│   └── projects/             # 009 朊病毒样片工程
├── shiliang/
│   ├── SKILL.md              # 扁平矢量 2D MG 短片入口
│   ├── README.md · CREDITS.md · pipeline.json
│   ├── scripts/              # 编排、配乐、混音、逐帧渲染
│   └── projects/             # 010 生命 3.0 样片工程
├── xianshiqi/
│   ├── SKILL.md              # 赛博朋克 HUD / FUI 短片入口
│   ├── README.md · CREDITS.md · pipeline.json
│   ├── scripts/              # 编排、配乐、混音、逐帧渲染
│   └── projects/             # UAP 样片工程
├── dengju/
│   ├── SKILL.md              # 等轴 2.5D 短片入口
│   ├── README.md · CREDITS.md · pipeline.json
│   ├── scripts/              # 编排、配乐、混音、逐帧渲染
│   └── projects/             # 013 羽人样片工程
├── huixingzhen/
│   ├── SKILL.md              # 回形针风科普短片入口
│   ├── README.md
│   ├── scripts/              # 渲染、音效合成、贴纸/卡片/小帧素材
│   └── theme/                # 深色主题定稿参数
├── shuimo/
│   ├── SKILL.md              # 纸本水墨山水样片入口
│   ├── README.md · CREDITS.md · pipeline.json
│   ├── scripts/              # 编排、配乐、混音、逐帧渲染
│   └── projects/             # 013 羽人水墨样片工程
├── chengshi/
│   ├── SKILL.md              # 城市年轮短片管线入口
│   ├── USAGE.md              # 运行手册（环境 / 建城 / 出片 / 硬约束）
│   ├── pipeline.json         # 定版参数
│   ├── scripts/              # 抓数据、建城、配音、混音、渲染
│   ├── render/               # Remotion 渲染工程（苏州 v2 分镜，原名 template_v2 → sz）
│   └── template/             # 通用渲染工程（v1，render_cut.py 用它）
├── xiangsu/
│   ├── SKILL.md              # 像素风管线入口
│   ├── README.md             # 冻结参数、复现、验收与历史记录
│   ├── MIGRATION.md          # 从 yandi 落地的来源、哈希校验与路径说明
│   ├── demo/                 # 前 10 秒样片源文件真身（film.js / sprites.js / cues.json / audio.py）
│   └── full/                 # 全片链路（assemble / parts / 音轨 / 封面 / 验收）
├── ditu/
│   ├── SKILL.md              # 立体地图解说管线入口
│   ├── README.md · MIGRATION.md · CREDITS.md · pipeline.json
│   ├── scripts/              # 编排 CLI + 逐帧渲染器（playwright-core + ffmpeg）
│   └── projects/             # 038 关羽水淹七军工程（真实地形 / 高程水面 / 贴地标注）
├── pingban/
│   ├── SKILL.md              # 平板速写讲解管线入口
│   ├── README.md · MIGRATION.md · CREDITS.md · pipeline.json
│   ├── scripts/              # 编排 CLI + 逐帧渲染器
│   └── projects/             # 038 关羽水淹七军手卷工程（六格 / 逐笔画 / 手写字幕）
├── caiqian/
│   ├── SKILL.md              # 彩铅科普插画管线入口
│   ├── README.md · MIGRATION.md · CREDITS.md · pipeline.json
│   ├── scripts/              # 编排 CLI + 逐帧渲染器
│   └── projects/             # 029 假鳕鱼段（四张 G-buffer / 分层排线 / 手写标签与字幕）
├── tianshu/
│   ├── SKILL.md              # 天书本地大模型出片管线入口（Qwen-Image + Wan2.2）
│   ├── README.md · CREDITS.md · pipeline.json
│   ├── template/             # 提示词骨架（画种锚点 / 负词 / 色板规则 / I2V 铁律）
│   ├── scripts/              # 编排 CLI + 出图/出视频/后期/运镜/拼接/质检/交付
│   └── projects/             # 026 镇魔塔示范工程（真实 6 镜 prompt / 取色目标 / 运镜）
└── peiyin/
    ├── SKILL.md              # 前端三模块入口（选题 / 出稿 / 配音）
    ├── README.md · MIGRATION.md · AGENTS.md
    ├── docs/                 # 10 份规约 + 对标逐字稿参考库
    ├── scripts/              # 初始化、批量配音、门禁校验、口播稿审计
    └── GPT-SoVITS/           # 配音引擎干净代码（权重由 setup.ps1 拉取）
```

<a id="stack"></a>
## 技术栈 🧰

| 环节 | 使用到的技术 |
| --- | --- |
| 内容与时间轴 | Python、GPT-SoVITS、Faster-Whisper、拼音 DP 对齐 |
| 画面工程 | TypeScript、Remotion、HTML、CSS、SVG、GSAP |
| 逐帧手绘 | Canvas、puppeteer-core、simplex-noise、opentype.js |
| 皮影剪影 | Playwright、Canvas、逐帧截图、ffmpeg |
| MG 短片渲染 | Node.js、three.js、mg-styles-15、Edge 无头逐帧渲染 |
| 像素风 | 640×360 索引色帧缓冲、×3 整数最近邻、输出分辨率 CRT 后处理 |
| 3D 战场 | battlefield-editor（Three.js 兵棋引擎）、稳帧逐帧渲染 |
| 立体地图 | three.js、terrarium 高程 + Sentinel-2 底图、playwright-core 逐帧、贴地经纬度标注 |
| 平板速写 | Canvas 2D 逐笔笔触 + 纸纹阈值、手势相机跟笔尖、playwright-core 逐帧 |
| 彩铅科普 | three.js 四张 G-buffer（albedo+id / light+depth+normal / 排线方向 / 锚点+reveal）、后处理分层排线 + 纸齿阈值、锚定坐标防漂移、逐帧轮廓 boil、playwright-core 逐帧 |
| 地理与地形 | OSM 建筑/道路/水系、Esri 卫星影像、SRTM 高程、Remotion + three.js |
| 长视频渲染 | HyperFrames、浏览器逐帧渲染 |
| 音频与交付 | ffmpeg、ffprobe、响度归一、两遍压缩 |
| 自动质检 | 字幕重叠检查、补间审计、频闪检测、成品抽帧 |
| BB-Video 风格运行时 | Canvas 2D / SVG / Three.js 纯函数逐帧、Chrome DevTools Protocol、代码合成配乐与音效 |

<a id="faq"></a>
## 常见问题 ❓

<details>
<summary>配音是怎么来的？</summary>

各管线默认走 **GPT-SoVITS 本地服务**（自备模型权重），也支持切 **Edge TTS** 免费方案（如 `jilupian --set voice.engine=edge_tts`）。配音模型权重体积大且可再生成，一律不进入仓库，只做安装引导——见各管线 `MIGRATION.md`。

</details>

<details>
<summary>mg-styles-15 是什么？为什么不在仓库里？</summary>

`mg-styles-15` 是 shouhui / xuni / shiliang / xianshiqi / dengju / huixingzhen / shuimo / xiangsu 共用的外部渲染引擎（MIT 协议，含 node_modules 约 1.2GB）。仓库只保留管线代码与示例工程，引擎按引导 clone + `npm install` + junction 安装（见上方针式安装命令或各管线 README）。

</details>

<details>
<summary>模型、权重、字体、大文件为什么都不入库？</summary>

这是本项目的一贯政策：**代码与配置入库，重量级资产引导下载**。渲染引擎、TTS 模型、音色权重、字体（如 `AlibabaPuHuiTi`，免费商用）等都可通过官方渠道下载，完整成片（本批 8 部约 2.2 GB）也只做本地归档，避免仓库膨胀和不可再生成产物污染版本历史。

</details>

<details>
<summary>样片和完整成片有什么区别？</summary>

`site/media/` 里是 86 段网页样片（约 40 MB，GitHub Pages 直接播放）；`showcase/` 保留了早先的 30 秒原片与拼图；完整成片只在作者本地同步盘归档，不随仓库提交。需要原片时从归档取，不必重渲染；`zhidiao`、`lvdong` 本批没有归档成片。

</details>

<details>
<summary>新风格九条管线和已有的 MG 管线有什么区别？</summary>

九条新管线来自 BB-Video 的风格运行时（BB-Video 共 33 种风格），画面是浏览器里的纯函数（Canvas / SVG / Three.js），同一帧永远渲染同一画面；它们和 `xuni` / `shiliang` / `dengju` 等 mg-styles-15 管线不是一套引擎。`isometric` 与 `dengju` 都画等距世界，但 `isometric` 是地块/路线/连续镜头运行时，`dengju` 是 mg-styles-15 的瓦片波浪运镜。`shadow` 与 `piying` 都做皮影，但 `shadow` 是 BB-Video 的透光牛皮+操纵杆，`piying` 是 Playwright/Canvas 剪影+卡片讲解。`blueprint` 是蓝晒工程图，专门讲机构/机器/系统原理。`laolang` 是 1980 上美影手绘赛璐璐（老狼请客式），4:3 片门、定稿 toon 人物与 24 动作，适合中国历史/民间故事。

</details>

<details>
<summary>怎么新增一条管线？</summary>

按「完成一条，迁移一条」：新管线必须带自己的流程说明（`SKILL.md`）、执行脚本、可复用资源（模板/字体/示例工程）和验收条件，才算完成迁移。参见下方路线图。

</details>

<a id="roadmap"></a>
## 路线图 🧭

当前：`32 / 99` 成片管线（`peiyin` 是前端模块，不计入风格数）。另有一条 `youxi`（仁德天皇陵，192.7 s）已出片待封装，完成管线目录后计入路线图。

Auto-Video 会按「完成一条，迁移一条」的方式持续扩展。新管线必须带自己的流程说明、脚本、可复用资源和验收条件，才算完成迁移。

99 条是长期目标，也就是 99 套能独立完成视频的生产方法。路线图会继续吸收不同题材、画风、媒介和平台需求，让更多人找到一条能直接开工的路径。

<a id="credits"></a>
## 鸣谢与许可 🙏

- **mg-styles-15**（合成波 / 扁平矢量 / HUD / 等轴等 MG 风格引擎）：[Vincentwei1021/mg-styles-15](https://github.com/Vincentwei1021/mg-styles-15)，MIT
- **AlibabaPuHuiTi-3-85-Bold**（示例工程字体）：阿里巴巴普惠体，免费商用
- **GPT-SoVITS**（配音方案）：[RVC-Boss/GPT-SoVITS](https://github.com/RVC-Boss/GPT-SoVITS)
- **BB-Video**（goldenage / manga / tapestry / pencil / isometric / parable / shadow / blueprint / laolang 九条风格运行时与渲染链）：[BubbleBrainBB/BB-Video](https://github.com/BubbleBrainBB/BB-Video)，MIT
- **battlefield-editor**（3D 兵棋渲染引擎）：随 `tuiyan` 迁移自 alannew 项目
- 本仓库管线由 `AutoUP`、`AutoJY`、`alannew` 等历史项目迁移归纳而来，出处与迁移说明见各管线 `MIGRATION.md` / `CREDITS.md`
- **许可**：本仓库代码以 [MIT License](LICENSE) 发布（见根目录 `LICENSE`）；第三方组件遵循各自协议（见上）。

## English

Auto-Video is a one-stop video production workflow that turns an idea — or a reference video link — into finished animation in 32 styles, plus a `peiyin` frontend module for topic selection, script writing and GPT-SoVITS voice cloning. It writes original voice-over scripts, clones your voice locally, and renders every frame deterministically (Remotion / Canvas / Three.js / 3D battle engine) — or, in the `tianshu` lane, generates plates and ambient motion with local ComfyUI models (Qwen-Image 2.1 + Wan2.2 TI2V-5B) — without calling any cloud image or video API. The current 32 film pipelines cover paper-style historical shorts (Remotion), paper-style historical explainers, paper-cut silhouette videos (HyperFrames), frame-by-frame hand-drawn animation, Canvas shadow-puppet animation (Playwright), 3D battle simulations, pixel-art shorts (640×360 indexed framebuffer ×3 nearest-neighbour with output-resolution CRT), six MG short-film styles (synthwave / flat-vector / cyberpunk HUD / isometric / paperclip explainer / ink-wash landscape), nine BB-Video style runtimes (golden-age cartoon / manga / Bayeux tapestry / pencil test / isometric miniature / 3D stick-figure parable / shadow puppetry / blueprint engineering drawing / Shanghai Animation Film Studio hand-drawn cel, laolang), satellite-terrain 3D map explainers with real elevation data (ditu), tablet-sketch scroll explainers drawn stroke by stroke (pingban), colored-pencil science illustrations hatched over a paper tooth (caiqian), city-growth films (real geodata: OSM buildings/roads/water, Esri satellite, SRTM terrain, Remotion + three.js), footage-based vertical shorts (Pixabay clips + MoneyPrinterTurbo CLI + single-line captions, shipai), silhouette-rhythm films cut on a 90 BPM beat (lvdong), and a local-model cel-animation lane (tianshu). 30 pipeline samples and 56 style samples are playable online; nine full films (about 2.3 GB) are archived locally and not committed. More visual and production styles are on the way, with a long-term roadmap of 99 pipelines.

## 关注更新

如果你正在寻找 AI 视频生成、自动剪辑、历史纪录片、纸雕动画、TTS 配音、字幕对齐或 ffmpeg 自动交付的实践，可以 Star 或 Watch 这个仓库。新管线完成后会直接进入项目。
