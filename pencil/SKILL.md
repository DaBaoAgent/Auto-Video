---
name: pencil
description: 把口播片做成一镜到底的铅笔手绘动画测试纸：蓝线起稿、石墨勾线、橡皮修改、画与画之间 morph，15 张/秒的线条抖动，一个暖色重点在情绪峰值晕开。当用户说「铅笔手绘」「铅笔测试」「素描动画」「手绘动画」「pencil test」时使用。
---

# pencil：铅笔手绘动画管线

一帧是一张暖白动画纸：顶部三个定位孔、角落的 drawing 编号、柔和暗角；一切都用石墨画，先下浅蓝结构线，再压深勾线，排线/擦笔做阴影；角色是无脸的 gesture 小人，只在一个情绪峰值处晕开一点暖色。

首个实例：`template/` 是 044《阿努纳奇》第一段的铅笔手绘动画样片（30.4 s / 1920×1080 / 30 fps），代码、分镜、文案、配乐、音效齐全；只缺配音与成片。完整风格规范见 [`references/style.md`](references/style.md)，分镜模板见 [`references/storyboard.md`](references/storyboard.md)，验收清单见 [`references/qa.md`](references/qa.md)。

## 一分钟判断

- 适合：人物生平/职业（用动作、地点、数字、物件讲，不画像）、运动与时间、机器怎么演化/怎么工作、情绪型科普、创意工具/教育/运动/健康产品。
- 不适合：真实 UI 走查、密集数字对比、很多会说话的角色、需要真实照片的场景。

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
pencil/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与来源
├── MIGRATION.md             来源、入库范围与同步方式
├── pipeline.json            定版参数（画幅/色板/字体/运动/音频/交付）
├── runtime/
│   ├── core.js promo.js pencil.js   浏览器运行时（BB-Video MIT，vendored）
│   ├── render.mjs music.mjs bgm.mjs sound.mjs lang.mjs net.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── pencil.py           编排：new / vo / check / stills / render / qa / deliver
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
python scripts/pencil.py new projects/<名字> --title "片名"
```

复制 `template/`，并把 `runtime/core.js`、`runtime/promo.js`、`runtime/pencil.js` 复制到 `<工程>/lib/`。

`template/` 不是空白模板，而是**阿努纳奇样片的完整做法**：`index.html` 是逐幕画面，`brief.md`/`storyboard.md` 是事实与分镜，`score.js`/`sound.js` 是配乐音效。照着它改，比从零写快。

### 2. 配音与时间轴

```bash
python scripts/pencil.py vo projects/<名字> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
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
    const G = PROMO.pencil(F, { /* 风格参数 */ });
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
python scripts/pencil.py render projects/<名字> --bgm "音乐.mp3" --bgm-volume 0.14
```

想用 `score.js` 的内置配乐，把 `script.json` 的 `"bgm"` 改成 `true`，渲染时不要传 `--bgm`。

### 6. 自检与抽帧

```bash
python scripts/pencil.py check  projects/<名字>
python scripts/pencil.py stills projects/<名字> --times 2,8,15,25
python scripts/pencil.py stills projects/<名字> --times 2,8 --aspect 9:16
```

`--check` 会查：文字重叠/出画/阅读时间、旁白段落里没有新动作、频闪与镜头急变、音效过密、屏幕文字是否越出 `brief.md`。提醒不等于错误：先判断它是不是这条风格的有意选择，再决定改不改。

### 7. 渲染

```bash
python scripts/pencil.py render projects/<名字>                     # 1920×1080
python scripts/pencil.py render projects/<名字> --scale 0.6667      # 720p 样片
python scripts/pencil.py render projects/<名字> --draft             # 半分辨率快看
python scripts/pencil.py render projects/<名字> --aspect 9:16      # 竖屏版（页面用 F.portrait 分支）
```

渲染是 Chrome 逐帧 + ffmpeg；1080p 每帧约 0.3–0.8 s，30 秒片约 5–15 分钟，长片更久。

如果 4 路并行出现 `frame-timeout`（某一路超过 60 秒没拍回来），降到 `--workers 1`（或 2）并加 `--frame-timeout 180`；慢一点但能出片。

### 8. 交付

```bash
python scripts/pencil.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "pencil_片名_样片_1080p"
```

产出 `.mp4 / _封面.png / _字幕.srt / _署名.txt`，QA 写入 `review/qa.json`（时长、分辨率、帧率、响度、峰值、黑帧、解码错误）。样片与阶段成果回到 `出稿/`，全片归档到 `out/`。

## 阿努纳奇样片逐幕

| 时间 | 旁白 | 画面 |
|---|---|---|
| 0.6–5.26 | 1978 年，一个自学楔形文字的人出了本书，说地球是外星人的金矿 | 书桌与打开的书，作者在桌边；「1978」「一本书」手写标题；推镜到地球 |
| 5.26–11.98 | 外星人用基因和猿猴造人，替他们下矿 | 地球→基因双螺旋→神 × 猿，蓝线结构 + 石墨勾线；人从画里站起 |
| 11.98–13.24 | 这个新物种，就是人 | 人站在纸中央，大字「人」 |
| 13.24–17.36 | 书卖了几百万册，翻译成二十多种语言 | 书堆、tally 刻痕、大数字 20+ 与小字「种语言」 |
| 17.36–22.12 | 学术界冷笑：伪学术，翻译错了 | 学者与泥板，红笔/石墨打叉，字「伪学术」 |
| 22.12–23.5 | 最讽刺的事情在后面 | 镜头横移到空白纸，下一张画先开始再擦上一张 |
| 23.5–26.82 | 四十年后，人类拿起了剪刀 | 巨剪刀 morph 出现，数字 2018 重画；暖色 bloom 在峰值晕开 |
| 26.82–29.12 | 不是外星人，是细菌 | 细菌在光池里，标题「细菌」 |

### 这条管线的做法

- **一镜到底，不切**：所有场景在一张长纸上沿 x 排开（样片 `X = { b:0, g:900, h:1500, m:2100, k:2850, cut:3600, bac:4350 }`），用 `D.move`/`D.follow` 走镜头。
- **画与画之间用 morph**：`D.morph(at, from, to)` 把两张画的线配对重画，球变地球、数字 8 变 24；不要硬切。
- **先结构后勾线**：`D.line/circle/ellipse/rect/poly/path` 默认 `construct:true` 先下蓝线，再压石墨；`clean:t` 让一组画在 t 之前保持蓝粗稿、t 之后才勾清。
- **人是无脸 gesture**：`D.figure({ x, y, height, face, look })`，用 `f.fig.walk/jump/sit/bow/cheer/look/gesture/reach`；人像用 `face:'back'` 或 `look:'silhouette'`，绝不画真人五官。
- **信息用铅笔的装置**：时间线 `D.timing`、序列 `D.onion`、对比 `D.versus`（赢的一边勾清+bloom，输的一边留蓝粗稿）、计数 `D.tally`、数字 `D.numeral`、标注 `D.note`/`D.ring`、光池 `D.light`、暖色 `D.bloom`。
- **只在峰值用颜色**：`D.bloom(at, { on, until })` 一两次；`--check` 超过 4 次或停留超过全片 1/3 会提醒。

## 声音

配乐是毛毡钢琴 + 软弦乐 + 低音提琴：钢琴在画下走，弦乐铺和声，峰值弦乐打开，收尾回到钢琴。音效是画桌：`sketch`（石墨划纸）、`scribble`（排线）、`erase`（橡皮）、`flip`（morph 翻纸）、`tap`（刻痕/关键帧）、`tick`（数字变）、`step`、`thud`（落地/弹跳）、`swish`（镜头/抛掷）、`bloom`（暖色晕开）、`rim`。

## 已知坑

| 现象 | 原因 / 处理 |
|---|---|
| 旁白在说，纸是空的 | 上一张先擦、下一张还没画；让 `until` 晚于下一张的 `at`，或 morph，或镜头离开再擦 |
| 一张白纸只有一个 figure | 读起来像测试不像片；把地点画进去（球场、街、山、人群、光池），暗部擦出石墨 |
| 二十个 draw-on 连排 | 像幻灯片；用 morph、跟拍、移动 |
| 人物僵硬 | `--check` 会量关节/硬起步/太快/冻结；给 hold 一个 look/turn/gesture |
| 暖色到处都是 | 只留 1–2 次 bloom；其余全是石墨 |
| 硬切 | 用 morph 或移动；`--check` 会报 hard cut |
| 字压在画上 | 地面线保持在字幕带以上（画面 88%）；`--check` 会量每个标签框与铅笔线 |
| 字重复旁白 | 字幕已经有词；画面只写旁白没说的数字、日期、部件名 |

## 验收

- `--check` 无 error；提醒逐条判断并记录。
- 成片 1920×1080 / 30 fps（样片可 720p），时长与时间轴一致。
- 响度 −16 LUFS 左右、真峰值约 −1.5 dBTP；黑帧与解码错误为 0（纯黑底风格按 `references/qa.md` 判定）。
- 每句旁白都有对应画面，屏幕文字全部可追溯到 `brief.md`。
- 封面取 `F.coverAt(t)` / `P.cover(t)` 的最大姿态或揭示后的 hold，不用冲击帧。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 `CREDITS.md`。风格规范原文见 `references/style.md`；只学技法，不复用任何真实工作室的角色、桥段、配乐或片尾。

