---
name: isometric
description: 把口播片做成一个 45° 等距微缩世界：一块块带厚底座的方形地块组成系统，低多边形小人/传送带/卡车/扫描仪在里面自己动，镜头连续滑行、推近、拉远，讲到哪一块就抬起并保留颜色。当用户说「等距微缩」「isometric」「微缩世界」「2.5D 小城市」「把流程做成一个小世界」时使用。
---

# isometric：等距微缩世界管线

一帧是一个从固定 45° 看下去的小世界：方形地块坐在厚底座上，块与块之间有缝；低多边形、圆角、平涂友好色、浅色背景、软太阳和接触阴影。信息由世界本身讲：路线画在地上、包裹在流、数字长在堆上、钟立在杆上。

首个实例：`template/` 是 044《阿努纳奇》第一段的等距微缩世界样片（30.4 s / 1920×1080 / 30 fps），代码、分镜、文案、配乐、音效齐全；只缺配音与成片。完整风格规范见 [`references/style.md`](references/style.md)，分镜模板见 [`references/storyboard.md`](references/storyboard.md)，验收清单见 [`references/qa.md`](references/qa.md)。

## 一分钟判断

- 适合：流程与系统（物流、供应链、工厂、电网、互联网、支付、公司管线）；「跟着一个东西走完系统」（包裹、信、水滴、请求、订单）；前后对比与规模；卖的是系统的 B2B 产品。
- 不适合：单个物体的细节、情绪与人物戏剧、长文字、真实 UI 截图。

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `配音.wav` | 是 | 用户原声（也接受 m4a/mp3）。`vo` 只截取、转 48 kHz 立体声，不重录、不变声 |
| `口播稿.txt` | 是 | 每行一个自然段，空行忽略；`vo` 按字数/停顿做 DP 对齐，输出句级 + 字级时间轴 |
| `brief.md` | 是 | 事实表 + 旁白原文 + 屏幕文字表；**画面上的每个字都只能从这张表来** |
| `storyboard.md` | 是 | 信息清单、分幕、逐句画面、运镜与音效点 |
| `index.html` | 是 | 画面是 `t` 的纯函数：`PROMO.compose({ build })`，同一帧永远渲染同一画面 |
| `score.js` | 是 | 配乐（代码合成；也可 `script.json` 设 `bgm:false` 后改用 `--bgm` 混入现成音乐） |
| `sound.js` | 是 | 音效设计；每个动作在同一帧出声 |
| `assets/manifest.js` | 是 | 图片/视频素材清单；纯代码画面保持空对象即可 |

## 目录

```text
isometric/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与来源
├── MIGRATION.md             来源、入库范围与同步方式
├── pipeline.json            定版参数（画幅/色板/字体/运动/音频/交付）
├── runtime/
│   ├── core.js promo.js isometric.js   浏览器运行时（BB-Video MIT，vendored）
│   ├── render.mjs music.mjs bgm.mjs sound.mjs lang.mjs net.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── isometric.py           编排：new / vo / check / stills / render / qa / deliver
│   └── make_vo.py           配音 + 口播稿 → timeline / paragraphs / script.json
├── references/
│   ├── style.md             完整风格规范（BB-Video STYLE.md）
│   ├── storyboard.md        分镜模板
│   └── qa.md                验收清单
└── template/                阿努纳奇样片完整工程（无音频与成片）
```

## 流程

### 1. 建工程

```bash
python scripts/isometric.py new projects/<名字> --title "片名"
```

复制 `template/`，并把 `runtime/core.js`、`runtime/promo.js`、`runtime/isometric.js` 复制到 `<工程>/lib/`。

`template/` 不是空白模板，而是**阿努纳奇样片的完整做法**：`index.html` 是逐幕画面，`brief.md`/`storyboard.md` 是事实与分镜，`score.js`/`sound.js` 是配乐音效。照着它改，比从零写快。

### 2. 配音与时间轴

```bash
python scripts/isometric.py vo projects/<名字> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
```

产出：

- `audio/narration.m4a` / `audio/narration.wav`
- `timeline.json` / `timeline.js`（句级 + 字级；页面用 `F.T.start(id)`、`F.T.word(id, '词')` 取时间）
- `paragraphs.js`（自然段起止）
- `script.json`（`bgm:false`，供页面与渲染器读取）

> `vo` 生成的行数取决于你的口播稿；样片 `index.html` 里的 `s('l8')`、`T.word(...)` 要改成你实际的行 id。改稿后先 `--check`，再渲染。

### 3. 事实与分镜

先写 `brief.md`：3–5 条事实、每条事实的画面证据、屏幕关键词、允许的创意短句、Off limits。再写 `storyboard.md`：每一句旁白对应什么画面、镜头怎么走、哪个字落哪个动作。**分镜没写清就不要写代码**。

### 4. 写画面

`index.html` 的结构：

```js
PROMO.compose({
  bpm: 112, chapters: false, tail: 1.1,
  theme: { /* 底色、字色、字体 */ },
  build: (F) => {
    const T = F.T, s = T.start, e = T.end;
    const G = PROMO.isometric(F, { /* 风格参数 */ });
    const a1 = s('l1'), a2 = s('l2'), /* … */ fin = F.duration;
    // 逐幕写画面：每个动作都用 a1/a2/… 或 T.word(...) 对到旁白
    F.section(0, 1, { name: 'hook' });
    F.section(a2, 2, { name: 'myth' });
  },
});
```

时间只从 `timeline.js` 来，不手写秒数；屏幕文字只从 `brief.md` 来。

### 5. 配乐与音效

`score.js` 写段落（`open / story / turn / reveal` 等）与配器；`sound.js` 写每个动作的声音。样片最终用的是用户指定 BGM，`script.json` 里 `bgm:false`，渲染时混入：

```bash
python scripts/isometric.py render projects/<名字> --bgm "音乐.mp3" --bgm-volume 0.14
```

想用 `score.js` 的内置配乐，把 `script.json` 的 `"bgm"` 改成 `true`，渲染时不要传 `--bgm`。

### 6. 自检与抽帧

```bash
python scripts/isometric.py check  projects/<名字>
python scripts/isometric.py stills projects/<名字> --times 2,8,15,25
python scripts/isometric.py stills projects/<名字> --times 2,8 --aspect 9:16
```

`--check` 会查：文字重叠/出画/阅读时间、旁白段落里没有新动作、频闪与镜头急变、音效过密、屏幕文字是否越出 `brief.md`。提醒不等于错误：先判断它是不是这条风格的有意选择，再决定改不改。

### 7. 渲染

```bash
python scripts/isometric.py render projects/<名字>                     # 1920×1080
python scripts/isometric.py render projects/<名字> --scale 0.6667      # 720p 样片
python scripts/isometric.py render projects/<名字> --draft             # 半分辨率快看
python scripts/isometric.py render projects/<名字> --aspect 9:16      # 竖屏版（页面用 F.portrait 分支）
```

渲染是 Chrome 逐帧 + ffmpeg；1080p 每帧约 0.3–0.8 s，30 秒片约 5–15 分钟，长片更久。

如果 4 路并行出现 `frame-timeout`（某一路超过 60 秒没拍回来），降到 `--workers 1`（或 2）并加 `--frame-timeout 180`；慢一点但能出片。

### 8. 交付

```bash
python scripts/isometric.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "isometric_片名_样片_1080p"
```

产出 `.mp4 / _封面.png / _字幕.srt / _署名.txt`，QA 写入 `review/qa.json`（时长、分辨率、帧率、响度、峰值、黑帧、解码错误）。样片与阶段成果回到 `出稿/`，全片归档到 `out/`。

## 阿努纳奇样片逐幕

| 时间 | 旁白 | 画面 |
|---|---|---|
| 0.6–5.26 | 1978 年，一个自学楔形文字的人出了本书，说地球是外星人的金矿 | `hall` 地块：书桌/书架/传送带，一本书的卡片「一本书 / 1978」 |
| 5.26–11.98 | 外星人用基因和猿猴造人，替他们下矿 | `mine` 地块：沙地、矿堆、矿车、外星人；标签「神的矿 / 挖金子」 |
| 11.98–13.24 | 这个新物种，就是人 | `lab` 地块抬升聚焦：基因罐、双螺旋、小人「人 / 新物种」 |
| 13.24–17.36 | 书卖了几百万册，翻译成二十多种语言 | `town` 地块：书堆、路线、计数器「20+ 种语言」 |
| 17.36–22.12 | 学术界冷笑：伪学术，翻译错了 | 镜头回到 `hall`，标签「伪学术 / 翻译错了」，focus 其余变灰 |
| 22.12–23.5 | 最讽刺的事情在后面 | 天光转黄昏，所有地块安静一拍 |
| 23.5–26.82 | 四十年后，人类拿起了剪刀 | 镜头推近 `lab`，标签「剪刀 / 四十年后」，夜晚灯光亮起 |
| 26.82–29.12 | 不是外星人，是细菌 | `lab` 局部：细菌、标签「细菌 / 不是外星人」 |

### 这条管线的做法

- **世界就是论证**：每个阶段一块地，流程是地上能看见的路线/传送带/车流，数字长在发生的地方（杆上的卡片、堆上的计数器、阶段钟）。
- **地块先建，路线后画**：`W.tile({x,z,w,d,top,at})` 建地；`W.route(pts, {at,dur})` 画路线（路线会找脚下的地块，跟着抬升）。
- **四块地按之字形排**：样片 `hall(-13,0) → mine(-3,2) → lab(7,-1) → town(17,2)`，在 16:9 里从左到右读；直线排会斜着跑出画。
- **镜头一条连续**：`W.camera([{ at, fit:[...], dur, room:{top,bottom}, min, drift }])`，默认 1.4 s 缓入缓出；拉远看系统、横移跟流程、推近讲细节；只在万不得已时 `cut:true`。
- **聚焦抬升**：`W.focus([tiles|parts|movers], a, b, { dim, lift })` 把正在讲的地块抬起、其余变灰；和时间点对齐。
- **信息卡**：`W.label(anchor,{text,sub})`、`W.counter`、`W.timer`、`W.title`；卡是 48 px、标题 92 px，杆子会自动缩短避免出画。
- **时间**：`W.sky([[t,'day'],[t2,'dusk'],[t3,'night']])`，夜段窗户和路灯自己亮。

## 声音

配乐是一座在工作的小镇：马林巴式拨弦稳定八分音符、软低音、木鱼像机器、钟琴动机在系统合拢时出现；大调、轻快。音效由运行时发出：`land`（地块落下）、`pop`（部件弹出）、`draw`（路线）、`beep`（扫描）、`drop`（包裹落）、`tick`（卡片）、`glow`（聚焦）、`click`（灯/柜门）、`whoosh`（镜头滑行）、`motor`（车辆 move 时传 `sfx:'motor'`）。

## 已知坑

| 现象 | 原因 / 处理 |
|---|---|
| 门/柜门/车厢门看不见 | 相机从 +x +z 看；门、储物柜正面、装货门必须朝 +z 或 +x |
| 路线不跟着地块抬升 | 先建 tile 再画 route；route 靠脚下 tile 关联 |
| mover 的移动时间重叠 | 每个 mover 的 move 按时间顺序写；被搬运时用 `ride` 取代自己的 move |
| 两张卡片叠住 | 两个阶段离得近时，给卡片不同杆高或锚点 |
| 卡片出画/压字幕带 | `--check` 会报；用 `room:{top,bottom}` 与 `fit` 留空间 |
| 地块排成一条直线 | 斜着跑出画；用之字形（+x → −z → +x…） |
| 全片像静止画 | 世界要一直有东西动：传送带、车流、人走、灯闪；hold 也要有微动 |

## 验收

- `--check` 无 error；提醒逐条判断并记录。
- 成片 1920×1080 / 30 fps（样片可 720p），时长与时间轴一致。
- 响度 −16 LUFS 左右、真峰值约 −1.5 dBTP；黑帧与解码错误为 0（纯黑底风格按 `references/qa.md` 判定）。
- 每句旁白都有对应画面，屏幕文字全部可追溯到 `brief.md`。
- 封面取 `F.coverAt(t)` / `P.cover(t)` 的最大姿态或揭示后的 hold，不用冲击帧。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 `CREDITS.md`。风格规范原文见 `references/style.md`；只学技法，不复用任何真实工作室的角色、桥段、配乐或片尾。

