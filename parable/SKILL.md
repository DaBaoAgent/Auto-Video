---
name: parable
description: 用纯黑虚空里的白色火柴人演一个对比寓言：两个角色、同一堆材料、相反做法，一个红色物件承载意义，固定广角、无切镜，靠动作和道具生长讲故事。当用户说「火柴人寓言」「3D 火柴人」「寓言短片」「对比型短视频」「无口播寓意片」时使用。
---

# parable：3D 火柴人寓言管线

一帧是纯黑虚空 + 会反光的地面：两个粗白火柴人，圆头悬在肩上，圆角四肢、深色描边、头顶一块等宽大写小标签；同样的道具随时间生长（砖、台阶、堆、硬币），只有一个红色东西承载意义；固定广角，最后淡出。

首个实例：`template/` 是 044《阿努纳奇》第一段的3D 火柴人寓言样片（3 分钟样片 178.3 s / 1280×720 / 30 fps；短寓言 15–45 s），代码、分镜、文案、配乐、音效齐全；只缺配音与成片。完整风格规范见 [`references/style.md`](references/style.md)，分镜模板见 [`references/storyboard.md`](references/storyboard.md)，验收清单见 [`references/qa.md`](references/qa.md)。

## 一分钟判断

- 适合：一个道理用两种做法对比（完美主义 vs 行动、爆发 vs 习惯、复利、模仿 vs 创造、等待 vs 开始）；15–45 s 社媒短片、竖屏优先；一个卖点的产品宣传。
- 不适合：步骤很多的解释、多个有名有姓的人物、真实 UI、超过一分钟又没有旁白的片。

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `配音.wav` | 选填 | 用户原声（也接受 m4a/mp3）。有口播时 `vo` 只截取、转 48 kHz 立体声，不重录、不变声；无口播寓言可手写 `timeline.json`，画面用音乐节拍定时 |
| `口播稿.txt` | 选填 | 有口播时每行一个自然段；`vo` 按字数/停顿做 DP 对齐，输出句级 + 字级时间轴。无口播寓言不需要 |
| `brief.md` | 是 | 事实表 + 旁白原文 + 屏幕文字表；**画面上的每个字都只能从这张表来** |
| `storyboard.md` | 是 | 信息清单、分幕、逐句画面、运镜与音效点 |
| `index.html` | 是 | 画面是 `t` 的纯函数：`PROMO.compose({ build })`，同一帧永远渲染同一画面 |
| `score.js` | 是 | 配乐（代码合成；也可 `script.json` 设 `bgm:false` 后改用 `--bgm` 混入现成音乐） |
| `sound.js` | 是 | 音效设计；每个动作在同一帧出声 |
| `assets/manifest.js` | 是 | 图片/视频素材清单；纯代码画面保持空对象即可 |

## 目录

```text
parable/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与来源
├── MIGRATION.md             来源、入库范围与同步方式
├── pipeline.json            定版参数（画幅/色板/字体/运动/音频/交付）
├── runtime/
│   ├── core.js promo.js parable.js   浏览器运行时（BB-Video MIT，vendored）
│   ├── render.mjs music.mjs bgm.mjs sound.mjs lang.mjs net.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── parable.py           编排：new / vo / check / stills / render / qa / deliver
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
python scripts/parable.py new projects/<名字> --title "片名"
```

复制 `template/`，并把 `runtime/core.js`、`runtime/promo.js`、`runtime/parable.js` 复制到 `<工程>/lib/`。

`template/` 不是空白模板，而是**阿努纳奇样片的完整做法**：`index.html` 是逐幕画面，`brief.md`/`storyboard.md` 是事实与分镜，`score.js`/`sound.js` 是配乐音效。照着它改，比从零写快。

### 2. 配音与时间轴

```bash
python scripts/parable.py vo projects/<名字> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
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
    const G = PROMO.parable(F, { /* 风格参数 */ });
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
python scripts/parable.py render projects/<名字> --bgm "音乐.mp3" --bgm-volume 0.14
```

想用 `score.js` 的内置配乐，把 `script.json` 的 `"bgm"` 改成 `true`，渲染时不要传 `--bgm`。

### 6. 自检与抽帧

```bash
python scripts/parable.py check  projects/<名字>
python scripts/parable.py stills projects/<名字> --times 2,8,15,25
python scripts/parable.py stills projects/<名字> --times 2,8 --aspect 9:16
```

`--check` 会查：文字重叠/出画/阅读时间、旁白段落里没有新动作、频闪与镜头急变、音效过密、屏幕文字是否越出 `brief.md`。提醒不等于错误：先判断它是不是这条风格的有意选择，再决定改不改。

### 7. 渲染

```bash
python scripts/parable.py render projects/<名字>                     # 1920×1080
python scripts/parable.py render projects/<名字> --scale 0.6667      # 720p 样片
python scripts/parable.py render projects/<名字> --draft             # 半分辨率快看
python scripts/parable.py render projects/<名字> --aspect 9:16      # 竖屏版（页面用 F.portrait 分支）
```

渲染是 Chrome 逐帧 + ffmpeg；1080p 每帧约 0.3–0.8 s，30 秒片约 5–15 分钟，长片更久。

如果 4 路并行出现 `frame-timeout`（某一路超过 60 秒没拍回来），降到 `--workers 1`（或 2）并加 `--frame-timeout 180`；慢一点但能出片。

### 8. 交付

```bash
python scripts/parable.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "parable_片名_样片_1080p"
```

产出 `.mp4 / _封面.png / _字幕.srt / _署名.txt`，QA 写入 `review/qa.json`（时长、分辨率、帧率、响度、峰值、黑帧、解码错误）。样片与阶段成果回到 `出稿/`，全片归档到 `out/`。

## 阿努纳奇样片逐幕

| 时间 | 旁白/段落 | 画面 |
|---|---|---|
| 0–28.5 | 1978 一本书 / 神话 / 剪刀 | 左＝西琴（写书、举书、卖书、被打脸），中＝人（被捏出、下矿、拿剪刀），右＝外星人（飞船、挖金、造人、后退）；固定机位 |
| 28.5–60.5 | 书 / 苏美尔 / 尼比鲁 / 造人 / 圣经 | 书《第十二个天体》、苏美尔城、带环行星与 3600 年轨道、基因罐、女神、圣经删节版 |
| 60.5–98.8 | 纪录片 / 自学 / 海泽 / 基因组 / 畅销 | 场记板、文凭、海泽逐字核对、基因组「后门基因」、书堆与庆祝 |
| 98.8–132.3 | 营地 / 狼 / 农业 / 1953 DNA | 营地火堆、狼变狗、玉米/麦子/香蕉、双螺旋、A/T/C/G、鞭炮 |
| 132.3–160.1 | 辐射育种 / 太空 / 秋水仙素 / 胰岛素 | 辐射盘、火箭、染色体加倍、纸与鞭炮、胰岛素、病人 |
| 160.1–176.9 | 细菌工厂 / 超市番茄 | 发酵罐、胰岛素瓶、超市货架、抗腐番茄、退市、标题 |

### 这条管线的做法

- **一个对比，两个角色，一堆材料**：先写清「两人做同一件事的不同做法 → 可见后果」；第三个角色只当过路人。样片用左/中/右三个身份位，但每幕只让一个对比成立。
- **固定广角，不切**：`P.figure` 摆位，`P.onFrame` 只做轻微相机呼吸（样片 3 分钟版用一条相机关键帧轨道，短版完全固定）；时间靠计数器和道具生长表示。
- **动作是叙事**：`a.pose`、`a.walk`、`a.climb`、`a.sit`、`a.lie`、`a.lay(stack)`、`a.inspect`、`a.tend`、`a.look`；重叠动作（hips → torso → arms → head）让火柴人活。
- **道具会生长**：`P.wall({ cols, rows, times | count, ghost:true })`、`P.steps`、`P.pile`、`P.coins`；红 ghost 砖表示「已经赚到的那一块」。
- **一个红色**：`P.item(kind, { accent:true })` 或 stack 的 `ghostColor:'accent'`；全片只能有一个红东西。
- **字极少**：标签是角色（2–6 字），`P.counter` 是时间，`P.title` 是收尾一句；屏幕字全部来自 `brief.md`，数字要真算。
- **声音是道具**：砖落一声干土响，计数滴答，揭示时一声玻璃钟；音乐是叙述者。

## 声音

配乐是叙述者：八分音符拨弦、木鱼滴答、低音 sub、pad；段落按寓言 beats 命名 `setup → divergence → reveal → hold`，揭示前留 0.3 s gap，收在一记钟。音效是道具：`place`（砖落）、`tap`（拍/放水平仪）、`step`、`thud`（坐/躺/落地）、`whoosh`（跳/落/挥）、`tick`（计数）、`coin`、`glow`（标题/标签）、`hit`（揭示）。

## 已知坑

| 现象 | 原因 / 处理 |
|---|---|
| 手穿过身体/伸过肩 | 砖位保持在可及范围；`lay` 会自己处理伸手 |
| 出现第二个红东西 | 全片只能一个红；`--check` 会报 |
| 字太多 | 标签 + 计数器 + 一句标题；标题/字幕超过约 36 字或 24 词会提醒 |
| 人物冻结 | 呼吸不算动作；给一个小动作（看、擦汗、拍一下），否则报 dead air |
| 标签被切/压在头上 | `--check` 会报；调 label y / follow |
| 倒影比人亮 | `reflect` 不超过 0.5；倒影必须比人暗 |
| 镜头在动/切 | 这条风格默认固定广角；样片 3 分钟版有缓慢相机轨道，但短版不要切 |

## 验收

- `--check` 无 error；提醒逐条判断并记录。
- 成片 1920×1080 / 30 fps（样片可 720p），时长与时间轴一致。
- 响度 −16 LUFS 左右、真峰值约 −1.5 dBTP；黑帧与解码错误为 0（纯黑底风格按 `references/qa.md` 判定）。
- 每句旁白都有对应画面，屏幕文字全部可追溯到 `brief.md`。
- 封面取 `F.coverAt(t)` / `P.cover(t)` 的最大姿态或揭示后的 hold，不用冲击帧。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 `CREDITS.md`。风格规范原文见 `references/style.md`；只学技法，不复用任何真实工作室的角色、桥段、配乐或片尾。

