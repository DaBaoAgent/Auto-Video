---
name: map
description: 用「真实地理数据 + 漫画贴纸」做地图动画口播片。口播稿 + 配音进，地球/区域/城市连续镜头、路线沿线绘制、人物贴纸锚定经纬度、标注卡与年份出：1920×1080 / 30 fps / −16 LUFS。当用户说「做地图解说」「地图动画」「在地图上讲这条路线」「map 管线出片」「照张骞那种地图来一支」时使用。
---

# map：地图动画管线

地图是论证主体：路线画在地图上、数字钉在发生地、镜头永远飞向正在说的那个地方。
人物、道具、地形都是**纯 SVG 漫画贴纸**，锚定真实经纬度或沿路线移动，按旁白逐句落位。
底图来自 Natural Earth（public domain），渲染是 Chrome 逐帧 + ffmpeg，画面是 `t` 的纯函数。

首个实例：`projects/zhangqian/`（025《张骞寻路》全片，544 s，1280×720 / 30 fps）。
规范：`references/asset-spec.md`（贴纸）、`references/storyboard.md`（分镜）、`references/qa.md`（验收）。

## 三种用法

| 用法 | 场景 | 入口 |
|---|---|---|
| **A. 新片** | 有配音 wav + 口播稿 txt | `map.py new` → 写 brief/分镜/贴纸 → `map.py vo` → `check/stills/render` |
| **B. 改一段** | 只改某段文案或动画 | 改 `script.json`/`main.js` → `map.py vo`（可 `--cut`）→ `stills` 复核 → `render` |
| **C. 只要视觉** | 复用地图/贴纸/镜头语法 | 抄 `runtime/map.js` 的 `G.*` 与 `runtime/stickers.js` 的 `MAP_STICKERS` |

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `配音.wav` | 是 | 用户原声，不重录；任意采样率，脚本会转 48k 立体声 |
| `口播稿.txt` | 是 | 每行一个自然段，空行忽略 |
| `brief.md` | 是 | 事实表 + 旁白原文；屏幕文字的唯一出处 |
| `storyboard.md` | 是 | 信息清单、段落时间轴、贴纸行为表 |
| `assets/models/*.svg` | 是 | 400×400、透明底、`#2E2924` 描边 4px 的贴纸 |
| `score.js` / `sound.js` | 是 | 配乐与音效设计（模板已给 map 风格起点） |

## 目录

```
map/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与数据来源
├── pipeline.json            定版参数（画幅/色板/镜头/音频/交付）
├── runtime/
│   ├── core.js promo.js map.js    浏览器运行时（BB-Video MIT，vendored）
│   ├── stickers.js                贴纸层（本管线新增）
│   ├── render.mjs music.mjs bgm.mjs lang.mjs net.mjs sound.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── map.py               编排 CLI：new/vo/check/stills/render/probe/deliver
│   ├── make_vo.py           配音 + 口播稿 → timeline / paragraphs / script.json
│   └── deliver.py           混 BGM → QA → 出稿包
├── references/
│   ├── asset-spec.md        贴纸规范（图层、lift、动画字段、已知坑）
│   ├── storyboard.md        分镜写法
│   └── qa.md                验收清单
├── template/                空白可运行工程（8 s 示例时间轴 + 2 张示例贴纸）
└── projects/
    └── zhangqian/           张骞全片实例（代码/文案/44 张贴纸/时间轴，无音频与成片）
```

## 流程

### 1. 建工程

```bash
python scripts/map.py new <工程目录> --title "片名"
```

复制 `template/`，并把运行时复制到 `<工程>/lib/`。随后写 `brief.md`、`storyboard.md`、贴纸与 `main.js`。

### 2. 配音与时间轴

```bash
python scripts/map.py vo <工程目录> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
```

`make_vo.py` 做的事：

1. `silencedetect` 找静音候选；
2. 按「字数 / 语速」DP 对齐每个自然段的边界（停顿短于 0.22 s 也能切开）；
3. 段内按字数预测句边界，在 ±0.8 s 内取 20 ms 能量最低点校正；
4. 输出 `audio/narration.m4a`、`timeline.json/js`（句级 + 字级）、`paragraphs.js`、`script.json`。

已有验证过的前 K 段边界时用 `--fixed 0,32.18,47.73,…`（或 `para_bounds.json`），其余段落继续 DP。

### 3. 画贴纸

按 `references/asset-spec.md`：400×400 viewBox、透明底、统一色板、平涂分面。
文件名 `NN_english_name.svg`，中文说明放审核页。人物与道具的 `lift` 规则见规范 §3。

### 4. 写画面

`main.js` 的 `PROMO.compose({ build })` 里：

```js
const G = await PROMO.map(F, { ground: 'atlas', globeZoom: 3.6 });
await G.world({ detail: '50m', states: false });

G.label(CHANGAN, '长安', { kind: 'city', dir: 'e', at: a1 + 1.7, until: E[0] });
const R = G.line(NORTH, { color: 'accent', width: 5, dash: [8, 8], at: a1, dur: 3 });
G.travel(NORTH, { at: a1 + 0.2, dur: 4, marker: 'dot', trail: true });
G.callout(AFG, { kicker: '一万二千里', title: '阿富汗集市', at: a2, until: E[1], side: 'r' });
G.note('方向示意，非实测路线', { at: a1, until: fin, pos: 'br' });

await MAP_STICKERS(G, [
  { f: '01_zhangqian.svg', path: HOMEWARD, from: a1 + 1.8, to: a1 + 4.2, w: 240, at: a1 + 1.8, until: a1 + 4.7, dy: 20, lift: 200 },
  { f: '02_wudi.svg',      ll: [108.94, 34.34], w: 260, at: a1 + 2.4, until: a2 + 0.3, dy: 22, lift: 215 },
], { dir: 'assets/models/' });

G.camera([...]);
```

API 全表见 `runtime/map.js` 顶部注释与 `references/storyboard.md`。要点：

- 一条连续镜头；每段给 `center/zoom` 或 `fit`，飞行 ≤ 2.5 zoom/秒。
- 地理锚点用今天坐标，只作画布位置，不代表历史疆界。
- 字幕级别的时间用 `paragraphs.js` 的 `start/end`，不要手写。

### 5. 自检与抽帧

```bash
python scripts/map.py check  <工程>
python scripts/map.py stills <工程> --times 3,7.5,16.5,25
```

`--check` 会核对：文字重叠、标注出画、镜头过快、没有新动作、屏幕文字 vs `brief.md`、信息密度、音乐/音效 name 是否还是模板原文。

### 6. 渲染

```bash
python scripts/map.py render <工程>                  # 1080p
python scripts/map.py render <工程> --scale 0.6667   # 720p 样片
```

渲染是 Chrome 逐帧 + ffmpeg；map 的 waterlines 每帧重算，1080p 约 0.3–0.6 s/帧。
长片（>5 分钟）整片配乐合成也要数分钟，别误判为卡死。

### 7. 交付

```bash
python scripts/map.py deliver <工程> --chugao 出稿/<编号>_<选题> --name "12_map_片名_全片_720p" [--bgm 音乐.mp3]
```

混 BGM（循环铺满、自动响度）→ QA（时长/分辨率/帧率/响度/峰值/黑帧/解码）→ 复制 `.mp4/_封面/_字幕/_署名`。
QA 写入 `<工程>/review/qa.json`。样片与阶段成果回到 `出稿/`，全片归档到 `out/`。

## 已知坑

| 现象 | 原因 / 处理 |
|---|---|
| ffmpeg 卡在 AAC 编码 | 44.1k 单声道 → 先转 48k 立体声（`make_vo.py` 已内置） |
| 最后一句被切 | `-t` 必须放在 `-i` 之前（已内置） |
| 找不到 Chrome | 设置 `CHROME_PATH`；Windows 下脚本会自动找本机 Chrome/Edge |
| 贴纸出现在地球边缘 | globe 阶段不显示贴纸，出场推迟到地图展开后 |
| 人物压在路线南侧 | 加 `lift`，不是只调 `dy` |
| 地点标签出画 | 按「镜头能看到它的那一段」设 `at/until` |
| `G.world` 长时间不返回 | 从 CDN 取 world-atlas；网络差时先 `--offline` 不可用（页面依赖 d3），改用本地 CDN 或重试 |
| 渲染打印「完成」后挂起 | 封面/字幕收尾偶发挂起；确认帧数完整后终止进程，用 `deliver.py` 生成 SRT |
| 长片 `--check` 很慢 | 543 s 全片会合成整片配乐，正常需要数分钟 |
| Bash 的 curl 不通但 Chrome 能加载 CDN | 字体由 Node 拦截下载并缓存，底图由 Chrome 加载 |

## 验收

见 `references/qa.md`。硬门槛：`--check` 无 error、−16 LUFS / 约 −1 dBTP、黑帧 0、解码无错误、每句字幕齐全。
