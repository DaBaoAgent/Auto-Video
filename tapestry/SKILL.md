---
name: tapestry
description: 把历史叙事做成一卷会自己绣出来的贝叶挂毯：亚麻底、羊毛绣线、上下花边、人物侧身大动作，镜头沿布卷滚动、偶尔推近看针脚。当用户说「贝叶挂毯」「挂毯动画」「刺绣长卷」「中世纪挂毯」「编年史风格」时使用。
---

# tapestry：贝叶挂毯 · 刺绣长卷管线

一帧是一扇看向一条长亚麻布卷的窗：布上的一切都用羊毛绣成，轮廓是茎针绣、填色是铺线压绣，脸和手留白亚麻；上下花边是鸟兽格，人物侧身、大头大鼻、大动作，树把场景隔开，题词是绣出来的「此处，…」。

首个实例：`template/` 是 044《阿努纳奇》第一段的贝叶挂毯 · 刺绣长卷样片（30.5 s / 1920×1080 / 30 fps），代码、分镜、文案、配乐、音效齐全；只缺配音与成片。完整风格规范见 [`references/style.md`](references/style.md)，分镜模板见 [`references/storyboard.md`](references/storyboard.md)，验收清单见 [`references/qa.md`](references/qa.md)。

## 一分钟判断

- 适合：编年史（一本书、一座钟、一条路、一座城怎么来的）、航程/战争/工艺史、按年龄或步骤展开的「人们一步一步在做」；想要温暖手作感的品牌故事。
- 不适合：多数字的数据解说、UI 走查、体内/机械内部的小尺度过程、快节奏宣传片。

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
tapestry/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与来源
├── MIGRATION.md             来源、入库范围与同步方式
├── pipeline.json            定版参数（画幅/色板/字体/运动/音频/交付）
├── runtime/
│   ├── core.js promo.js tapestry.js   浏览器运行时（BB-Video MIT，vendored）
│   ├── render.mjs music.mjs bgm.mjs sound.mjs lang.mjs net.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── tapestry.py           编排：new / vo / check / stills / render / qa / deliver
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
python scripts/tapestry.py new projects/<名字> --title "片名"
```

复制 `template/`，并把 `runtime/core.js`、`runtime/promo.js`、`runtime/tapestry.js` 复制到 `<工程>/lib/`。

`template/` 不是空白模板，而是**阿努纳奇样片的完整做法**：`index.html` 是逐幕画面，`brief.md`/`storyboard.md` 是事实与分镜，`score.js`/`sound.js` 是配乐音效。照着它改，比从零写快。

### 2. 配音与时间轴

```bash
python scripts/tapestry.py vo projects/<名字> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
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
    const G = PROMO.tapestry(F, { /* 风格参数 */ });
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
python scripts/tapestry.py render projects/<名字> --bgm "音乐.mp3" --bgm-volume 0.14
```

想用 `score.js` 的内置配乐，把 `script.json` 的 `"bgm"` 改成 `true`，渲染时不要传 `--bgm`。

### 6. 自检与抽帧

```bash
python scripts/tapestry.py check  projects/<名字>
python scripts/tapestry.py stills projects/<名字> --times 2,8,15,25
python scripts/tapestry.py stills projects/<名字> --times 2,8 --aspect 9:16
```

`--check` 会查：文字重叠/出画/阅读时间、旁白段落里没有新动作、频闪与镜头急变、音效过密、屏幕文字是否越出 `brief.md`。提醒不等于错误：先判断它是不是这条风格的有意选择，再决定改不改。

### 7. 渲染

```bash
python scripts/tapestry.py render projects/<名字>                     # 1920×1080
python scripts/tapestry.py render projects/<名字> --scale 0.6667      # 720p 样片
python scripts/tapestry.py render projects/<名字> --draft             # 半分辨率快看
python scripts/tapestry.py render projects/<名字> --aspect 9:16      # 竖屏版（页面用 F.portrait 分支）
```

渲染是 Chrome 逐帧 + ffmpeg；1080p 每帧约 0.3–0.8 s，30 秒片约 5–15 分钟，长片更久。

如果 4 路并行出现 `frame-timeout`（某一路超过 60 秒没拍回来），降到 `--workers 1`（或 2）并加 `--frame-timeout 180`；慢一点但能出片。

### 8. 交付

```bash
python scripts/tapestry.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "tapestry_片名_样片_1080p"
```

产出 `.mp4 / _封面.png / _字幕.srt / _署名.txt`，QA 写入 `review/qa.json`（时长、分辨率、帧率、响度、峰值、黑帧、解码错误）。样片与阶段成果回到 `出稿/`，全片归档到 `out/`。

## 阿努纳奇样片逐幕

| 时间 | 旁白 | 画面 |
|---|---|---|
| 0.6–5.26 | 1978 年，一个自学楔形文字的人出了本书，说地球是外星人的金矿 | 第一幕拱门「神话 / 一九七八 · 一本书」；作者在书桌前写，旁边的人在想 |
| 5.26–11.98 | 外星人用基因和猿猴造人，替他们下矿 | 神在左、猿在右，中间基因罐与双螺旋；人从罐边站起 |
| 11.98–13.24 | 这个新物种，就是人 | 人站在布中央，布推近，字幕「新物种 / 人」 |
| 13.24–17.36 | 书卖了几百万册，翻译成二十多种语言 | 第二幕拱门「书卖疯了」；书堆、 tally 圆点、语言标签 |
| 17.36–22.12 | 学术界冷笑：伪学术，翻译错了 | 学者指着泥板，红叉，字幕「伪学术 · 翻译错了」 |
| 22.12–23.5 | 最讽刺的事情在后面 | 布继续滚，人物停一拍 |
| 23.5–26.82 | 四十年后，人类拿起了剪刀 | 布推近巨剪刀，字幕「此处，四十年后 / 人类拿起了剪刀」 |
| 26.82–29.12 | 不是外星人，是细菌 | 推近细菌，字幕「此处，剪刀来自细菌 / 不是外星人」 |

### 这条管线的做法

- **一条布，一条镜头轨**：场景沿 x 排开（每场 1200–1500 单位），`B.scroll([[t,x],…])` 给镜头一条单调向前、起停平缓的轨道；全片不切，场景之间用树隔开。
- **先起草，再绣**：每个东西默认先以铅笔底稿出现在右缘（`sketch` 1.1 s），然后 `stitch`：针沿轮廓走 → 铺线 → 压绣；大树/拱门用 `grow`，大平面用 `lay`。
- **人是侧身挂毯人**：`B.figure('名字', { x, h, pose })`，用衣服/头饰/胡子区分身份；`c.pose`、`c.go`、`c.turn`、`c.nod`，人物不能站桩超过 9 s。
- **题词是绣出来的**：`B.caption('此处，…', { x, sub })`，主句 54、小字 34；一幕只留一条说明，别让两条说明在滚动时叠在一起。
- **推近看针脚**：`B.push(a, b, { on: node, pad }, { back, backDur })`，最多推到 3.4；用在齿轮、书页、日期、剪刀、细菌上。
- **信息用挂毯的装置**：数量用 `B.tally` 一颗一颗绣；年份绣在下花边 `B.margin`；机制用 `B.gear`/`B.wheel`；对比是两场并排，中间一棵树。

## 声音

配乐是一支中世纪小乐队（D dorian）：开五度持续音（风笛/管风琴）、竖笛旋律、竖琴拨弦、框鼓、开幕与收尾的钟。音效是针线：`stitch`（线穿过亚麻）、`lay`（铺线）、`grow`（树/拱门生长）、`letter`（绣字）、`knot`、`needle`、`unpick`（拆线）、`push`（推近的一口气）、`act`（开幕钟声）。

## 已知坑

| 现象 | 原因 / 处理 |
|---|---|
| 两条说明在滚动时叠住 | 说明默认 `until:1e9`；给前一条设 `until`，或把两条的 y 错开；样片 24 s 处有 18% 重叠 |
| 一幕里字太多 | 默认最多 6 段绣字；一幕一条（主句+小字）就够 |
| 说明绣到画外 | 把说明放在镜头到达的位置（`B.scroll` 的 x 附近），或晚一点开始绣 |
| 布滚太快 | 120–200 单位/秒；超过 0.42 帧/秒会被报「卷轴太快」 |
| 人物站桩 | 9 s 没动作会被报；给 idle 人物 `B.idle([...], a, b)` 或 pose 变化 |
| 东西硬出现 | 所有东西都要有 `enter:'stitch'|'lay'|'grow'`，不要 `fade` 偷懒 |
| 颜色越界 | 只用 bayeux 羊毛色；超过 2 个调色板外 hex 会被报 |

## 验收

- `--check` 无 error；提醒逐条判断并记录。
- 成片 1920×1080 / 30 fps（样片可 720p），时长与时间轴一致。
- 响度 −16 LUFS 左右、真峰值约 −1.5 dBTP；黑帧与解码错误为 0（纯黑底风格按 `references/qa.md` 判定）。
- 每句旁白都有对应画面，屏幕文字全部可追溯到 `brief.md`。
- 封面取 `F.coverAt(t)` / `P.cover(t)` 的最大姿态或揭示后的 hold，不用冲击帧。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 `CREDITS.md`。风格规范原文见 `references/style.md`；只学技法，不复用任何真实工作室的角色、桥段、配乐或片尾。

