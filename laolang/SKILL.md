---
name: laolang
description: 用 1980 年上海美术电影制片厂《老狼请客》式的手绘赛璐璐做口播动画：4:3 圆角片门、青绿/橄榄/赭黄/锈红的装饰绘景、长鼻大眼的平涂人物、30 fps 稳定版、每镜不同运镜、民乐小乐队与现场合成音效。当用户说「老狼请客」「上美影」「上海美影」「手绘赛璐璐」「1980 动画」「老动画」「玄奘那种画风」时使用。
---

# laolang：上海美影手绘赛璐璐管线

一帧是一幅青绿、橄榄、赭黄、锈红的手绘装饰绘景前，站着平涂的赛璐璐角色——细而活的深褐勾线、少量硬边阴影、夸张的长鼻子和大眼睛；画面被放进一个 4:3 的圆角胶片门里。它像一卷 1980 年上海美术电影制片厂的动画短片：人物是画的，世界是画的，但世界比人物更松、更像一幅画。**只学工艺与画面语言，不复制原片的角色、造型、题字、笑点、镜头或旋律。**

首个实例：`template/` 是**玄奘 60 秒样片**（62.200 s / 1920×1080 / 30 fps / 1866 帧）的完整工程：19 句旁白、17 个分镜、定稿人物与 24 动作库、无 BGM 的旁白 + 26 个音效。只缺 `audio/narration.m4a` 与成片（大文件不入库，用 `vo` 从用户原声现成配音生成）。

- 风格规范：[`references/style.md`](references/style.md)
- 定稿人物参数：[`references/characters.md`](references/characters.md)
- 24 个动作集：[`references/actions.md`](references/actions.md)
- 60 秒样片方法与参数：[`references/production.md`](references/production.md)
- 分镜模板：[`references/storyboard.md`](references/storyboard.md)
- 验收清单：[`references/qa.md`](references/qa.md)

## 一分钟判断

- 适合：中国历史、民间故事、寓言、成语、地方风物；人物驱动的小故事（一个和尚、一队考古队员、一个手艺人、一只动物）；品牌里「手作、地方、传统、慢」的一面。
- 不适合：需要精确图表和大量数字的讲解（用 `swiss` / `blueprint`）；真实素材出镜的新闻（用 `newsreel` / `collage`）；极快节奏的促销（用 `launch` / `pop`）。

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `配音.wav` | 是 | 用户原声（也接受 m4a/mp3）。`vo` 只截取、转 48 kHz 立体声，**不重录、不变声** |
| `口播稿.txt` | 是 | 每行一个自然段，空行忽略；`vo` 做句级 + 字级 DP 对齐 |
| `brief.md` | 是 | 事实表 + 旁白原文 + 屏幕文字表；**画面上的每个字都只能从这张表来** |
| `storyboard.md` | 是 | 信息清单、分幕、逐句画面、人物动作、运镜与音效点 |
| `index.html` | 是 | 画面是 `t` 的纯函数：`PROMO.compose({ build })`，同一帧永远渲染同一画面 |
| `score.js` | 否 | 配乐（代码合成）；默认 `script.json` `bgm:false`，60 秒样片没有 BGM |
| `sound.js` | 是 | 音效设计；每个动作在同一帧出声 |
| `assets/manifest.js` | 是 | 图片/视频素材清单；纯代码画面保持空对象即可 |

## 目录

```text
laolang/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与来源
├── MIGRATION.md             来源、入库范围与同步方式
├── pipeline.json            定版参数（画幅/色板/人物景别/声音/交付/冻结校验）
├── runtime/
│   ├── core.js promo.js goldenage.js laolang.js act.js   浏览器运行时（BB-Video MIT）
│   ├── toon.js cast-lite.js                              定稿人物 + 眨眼/绘制入口
│   ├── render.mjs music.mjs bgm.mjs sound.mjs lang.mjs net.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── laolang.py           编排：new / vo / check / stills / render / probe / qa / short-qa / deliver
│   ├── make_vo.py           现成配音 + 口播稿 → 词级时间轴
│   └── short_qa.py          逐帧黑/白/冻结/pop 检查（可选，需 numpy + Pillow）
├── references/
│   ├── style.md             完整风格规范（BB-Video STYLE.md）
│   ├── characters.md        人物定稿规格参数（比例/五官/单臂/18 人）
│   ├── actions.md           24 个动作集 + 22 个命名姿态
│   ├── production.md        60 秒样片方法/参数/配音/音效/渲染/QA
│   ├── storyboard.md        分镜模板
│   └── qa.md                验收清单
├── toon-cast/               人物/动作源码与冻结快照
│   ├── lao_body.ts toon.ts lao_cast.js lao_cast_full.js lao_poses.js
│   ├── build_toon.py lib/toon.js
│   └── archive/v20261110_stable/  60 秒样片逐字节冻结版
└── template/                玄奘 60 秒样片完整工程（无音频与成片）
```

## 流程

### 1. 建工程

```bash
python scripts/laolang.py new projects/<名字> --title "片名"
```

复制 `template/`，并把 `runtime/core.js`、`promo.js`、`goldenage.js`、`laolang.js`、`act.js`、`toon.js`、`cast-lite.js` 复制到 `<工程>/lib/`。`index.html` 依次加载：`timeline.js` → `lib/core.js` → `lib/promo.js` → `lib/goldenage.js` → `lib/laolang.js` → `lib/toon.js` → `lib/cast-lite.js` → `lib/act.js` → `lao_cast_full.js` → `lao_poses.js` → `lib/story.js`。

`template/` 不是空白模板，而是**玄奘 60 秒样片的完整做法**：`index.html` 是 17 个分镜，`brief.md`/`storyboard.md` 是事实与分镜，`sound.js` 是音效，`lao_cast_full.js`/`lao_poses.js` 是定稿人物与动作。照着它改，比从零写快。

### 2. 配音与时间轴（现成配音）

```bash
python scripts/laolang.py vo projects/<名字> \
  --src 配音.wav --text 口播稿.txt --lead 0 --cut 62.16
```

产出：

- `audio/narration.m4a` / `audio/narration.wav`（48 kHz / 2 声道）
- `timeline.json` / `timeline.js`（句级 + 词级；页面直接读 `window.TIMELINE`，样片用 `cue('l16','走')` 取词级时间）
- `paragraphs.js`、`script.json`（`bgm:false`）

> `vo` 生成的行数取决于你的口播稿；样片 `index.html` 里的 `cue('l16','走')` 要改成你实际的行 id 与词。改稿后先 `--check`，再渲染。

### 3. 事实与分镜

先写 `brief.md`：3–5 条事实、每条事实的画面证据、屏幕关键词、允许的创意短句、Off limits。再写 `storyboard.md`：每一句旁白对应什么画面、谁在做什么动作、哪件道具在哪一拍动、镜头怎么走。**分镜没写清就不要写代码**。

### 4. 写画面

```js
PROMO.compose({
  bpm: 84, offset: 0, grain: false, tail: 0.2,
  theme: { bg: '#14110d', fg: '#efe3c4', accent: '#b23a2b' },
  build: (F) => {
    const G = PROMO.laolang(F, {
      seed: 'xz-toon-lao',
      drawings: 30, boil: 0.04,          // 稳定版：每帧绘制、极低抖动
      captions: { max: 18, size: 37 },
    });
    const L = G.lib, lao = L.lao, ACT = window.ACT;
    const S = 0.26;                      // 1000 设计单位 → 260 世界单位
    // G.shot(a, b, (u, t) => { … }); G.pause(…); G.write(…); F.sfx(…); F.section(…);
  },
});
```

- **人物**：`CAST.draw(slot, LAO_FULL[slot], opts, true)`；`side()` 朝右，`sideL()` 镜像朝左。全身景别 0.24–0.26；头靠横中线；脚下留白 100–160 px。
- **动作**：步态用 `ACT.walkCurve()` + `ACT.footfalls()`；静态姿态用 `opts.act = 'point' | 'kneel' | 'pray' | …`（见 `references/actions.md`）。
- **镜头**：`camPush(K(t, [[t0,x0],[t1,x1]]), y, z)`；每个镜头不同的推/拉/横移/跟拍/升降。
- **声音**：`F.sfx(t, 'step' | 'door' | 'glint' | 'stamp' | …)`；脚步挂在 `footfalls` 的真实落地时刻。

### 5. 检查、抽帧、渲染

```bash
python scripts/laolang.py check  projects/<名字>          # lint（0 error 才渲染）
python scripts/laolang.py stills projects/<名字> --times 2,8,15,25
python scripts/laolang.py render projects/<名字> --fps 30
# 长片分段：--from 0 --to 15.55 …；只出声音：--audio；重新贴音轨：--remux
```

渲染器自动做 -16 LUFS 响度归一与真峰值限制。62 秒页面保留 `window.__lint = () => [];` 跳过 lint（会长时间空转），成片另做逐帧 QA。

### 6. QA 与交付

```bash
python scripts/laolang.py qa projects/<名字>
python scripts/laolang.py short-qa out/video-16x9.mp4 review/shortqa
python scripts/laolang.py deliver projects/<名字> \
  --chugao 出稿/<编号>_<选题> --name "laolang_片名_样片_1080p"
```

验收标准见 [`references/qa.md`](references/qa.md)：62.2 s / 1920×1080 / 30 fps；无黑帧、无 ≥1.2 s 冻结、无意外闪帧；-16 LUFS / 真峰值 -1.5 dBTP；1080p + 720p + 封面 + 字幕 + 署名。

## 已知坑

- **4:3 左右黑边不是黑帧**：`qa` 只把整帧黑 >2 s 当问题。
- **必须用冻结版 goldenage.js**：`runtime/goldenage.js` 已关闭 gate weave、灯光 0.008、静态颗粒、去 specks；换成主线版本会频闪。
- **必须用冻结版 laolang.js**：stable 版才有 60 秒样片的场景绘制（崖体、壁画细节、莲花座等）。
- **人物/动作不要临时改**：任何比例、发型、脸型、手臂结构改动，先出设定图给用户审核；源码在 `toon-cast/`。
- **旁白时闭嘴**：人物不对口型（`mo ≈ 0.26` 是合唇）；只有用力、惊讶等情绪才张嘴。
- **不滑行**：相位与位移积分绑定；不要用 `t × 频率` 驱动走路。
- **声音克制**：每个动作一个声音，不要每个动作都配；最大的声音是安静。
- **CDN 字体**：stable 页面已去掉 `<link>`；新页面别加，否则渲染可能卡住。
- **大文件不入库**：`audio/`、`out/`、`review/`、`lib/` 由 `.gitignore` 排除；模板只保留代码/文案/分镜/参数。

## 冻结与版本

- 人物/动作冻结快照：`toon-cast/archive/v20261110_stable/`（`MANIFEST.sha256`）。
- 60 秒页面 SHA-256：`a797cbb10ed829182618dc2bc03dfe5447d51180ee42493b4de307063a3b38f0`。
- `lib/toon.js` SHA-256：`ccba10e20eb3b8e26116f005d806436a10a4f5d6a03f2770f24dfce5b22be594`。
- `pipeline.json` 的 `frozen.rule`：人物结构改动必须先出新设定图并获用户确认。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT）；`toon.ts`/`cast.ts` 的思路来自 [claude-animated-shorts](https://github.com/)（MIT，Mr omi）；字体各自 OFL。详见 [CREDITS.md](CREDITS.md)。
