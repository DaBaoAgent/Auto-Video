---
name: goldenage
description: 用 1940–50 年代美式院线卡通的做法做口播片：手绘城市背景 + 墨线赛璐璐角色，15 张/秒的抽搐墨线、橡皮物理、因果连锁和死寂停顿。当用户说「美式老动画」「黄金卡通」「橡皮管卡通」「把这段讲成一个卡通因果链」时使用。
---

# goldenage：美式黄金卡通管线

一帧就是一张 40–50 年代美国院线短片的印片：深蓝夜景、暖黄窗光、Art Deco 高楼和能读出砖缝的墙面，前面是带硬边阴影的墨线角色；画面有轻微片门晃动、彩色颗粒和圆角片门。

首个实例：`template/` 是 044《阿努纳奇》第一段的美式黄金卡通样片（30.3 s / 1920×1080 / 30 fps），代码、分镜、文案、配乐、音效齐全；只缺配音与成片。完整风格规范见 [`references/style.md`](references/style.md)，分镜模板见 [`references/storyboard.md`](references/storyboard.md)，验收清单见 [`references/qa.md`](references/qa.md)。

## 一分钟判断

- 适合：一个错误引发一串更大的碰撞（bug、事故、蝴蝶效应）；用挤压拉伸讲力、弹性、惯性；轻科普、日常冷知识；游戏/儿童/娱乐产品宣传。
- 不适合：真实 UI 走查、密集数字对比、严肃悲伤题材、很多会说话的角色。

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
goldenage/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与来源
├── MIGRATION.md             来源、入库范围与同步方式
├── pipeline.json            定版参数（画幅/色板/字体/运动/音频/交付）
├── runtime/
│   ├── core.js promo.js goldenage.js   浏览器运行时（BB-Video MIT，vendored）
│   ├── render.mjs music.mjs bgm.mjs sound.mjs lang.mjs net.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── goldenage.py           编排：new / vo / check / stills / render / qa / deliver
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
python scripts/goldenage.py new projects/<名字> --title "片名"
```

复制 `template/`，并把 `runtime/core.js`、`runtime/promo.js`、`runtime/goldenage.js` 复制到 `<工程>/lib/`。

`template/` 不是空白模板，而是**阿努纳奇样片的完整做法**：`index.html` 是逐幕画面，`brief.md`/`storyboard.md` 是事实与分镜，`score.js`/`sound.js` 是配乐音效。照着它改，比从零写快。

### 2. 配音与时间轴

```bash
python scripts/goldenage.py vo projects/<名字> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
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
    const G = PROMO.goldenage(F, { /* 风格参数 */ });
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
python scripts/goldenage.py render projects/<名字> --bgm "音乐.mp3" --bgm-volume 0.14
```

想用 `score.js` 的内置配乐，把 `script.json` 的 `"bgm"` 改成 `true`，渲染时不要传 `--bgm`。

### 6. 自检与抽帧

```bash
python scripts/goldenage.py check  projects/<名字>
python scripts/goldenage.py stills projects/<名字> --times 2,8,15,25
python scripts/goldenage.py stills projects/<名字> --times 2,8 --aspect 9:16
```

`--check` 会查：文字重叠/出画/阅读时间、旁白段落里没有新动作、频闪与镜头急变、音效过密、屏幕文字是否越出 `brief.md`。提醒不等于错误：先判断它是不是这条风格的有意选择，再决定改不改。

### 7. 渲染

```bash
python scripts/goldenage.py render projects/<名字>                     # 1920×1080
python scripts/goldenage.py render projects/<名字> --scale 0.6667      # 720p 样片
python scripts/goldenage.py render projects/<名字> --draft             # 半分辨率快看
python scripts/goldenage.py render projects/<名字> --aspect 9:16      # 竖屏版（页面用 F.portrait 分支）
```

渲染是 Chrome 逐帧 + ffmpeg；1080p 每帧约 0.3–0.8 s，30 秒片约 5–15 分钟，长片更久。

如果 4 路并行出现 `frame-timeout`（某一路超过 60 秒没拍回来），降到 `--workers 1`（或 2）并加 `--frame-timeout 180`；慢一点但能出片。

### 8. 交付

```bash
python scripts/goldenage.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "goldenage_片名_样片_1080p"
```

产出 `.mp4 / _封面.png / _字幕.srt / _署名.txt`，QA 写入 `review/qa.json`（时长、分辨率、帧率、响度、峰值、黑帧、解码错误）。样片与阶段成果回到 `出稿/`，全片归档到 `out/`。

## 阿努纳奇样片逐幕

| 时间 | 旁白 | 画面 |
|---|---|---|
| 0.6–5.26 | 1978 年，一个自学楔形文字的人出了本书，说地球是外星人的金矿 | 一本大书从天而降砸在旅馆屋顶，楼被压成弹簧，书打开升起金色地球 |
| 5.26–11.98 | 他们来了，挖金子挖烦了，就用基因和猿猴搅在一起，捏出新物种替他们下矿 | 月亮（神）打下一道光，猿在左，基因搅拌罐在右，人从罐里弹出来 |
| 11.98–13.24 | 这个新物种，就是人 | 人独自站在城市前，大字「人」 |
| 13.24–17.36 | 这本书卖了几百万册，翻译成二十多种语言 | 书堆成摩天楼，镜头横移，数字与语言标签弹入 |
| 17.36–22.12 | 学术界从第一天就冷笑：伪学术，他连楔形文字都翻译错了 | 泥板裂开，红字「伪学术」「翻译，错了」，镜头震动 |
| 22.12–23.5 | 最讽刺的事情在后面 | `G.pause` 死寂停顿，城市定格，只有眼睛在动 |
| 23.5–26.82 | 四十年后，人类真的拿起了那把神话里造人的剪刀 | 巨型剪刀从天上落下，低角度仰拍，落地一声闷响 |
| 26.82–29.12 | 只不过捏我们的不是外星人，是细菌 | 细菌在轴心，剪刀被吸走，圆iris 收黑 |

### 这条管线的做法

- **先定因果链，再定镜头**：8 句旁白 = 8 个镜头，每个镜头只做一件事；上一镜的落点就是下一镜的起点（书砸楼 → 楼顶打开 → 基因罐 → 人 → 书堆 → 泥板 → 剪刀 → 细菌）。
- **背景是画，角色是赛璐璐**：`skyline`、`drawTower`、`bg` 画背景；`wk`（工人）、`moon`（月亮）、`cel`/`tube`/`limb` 画角色。两种质感故意不统一，这是风格本身。
- **只在动作上切**：`G.shot(a, b, fn, { cut: true })` 默认硬切；大转场用 `G.iris` 收/开，不要用叠化。
- **每个大动作三拍**：预备（反方向）→ 冲击帧 → 弹性恢复。楼用 `drawTower` 的 `sq/sk/bul/bend/rattle`，球用 `moon` 的 `sx/sy/sa`，人用 `wp()` 姿态 + `K()` 关键帧。
- **声音是动作的一部分**：`G.bonk(at, gain)` 是「whack + boing」；`G.pause` 把音乐抽空，但音效还能落。最大的笑点是安静。
- **字是画上去的**：`G.write(text, { size, at, until, color, pop })`，标题 96–170、关键词 60–90、标签 26–44；字可以 `sag` 下垂、`tilt` 歪、`pop` 逐字弹。
- **信息用风格自己的装置**：步骤 `G.steps`、对比 `G.versus`、数字 `G.towers`（摩天楼柱状图）、单卡 `G.card`；最好的形式永远是一个 gag。

## 声音

配乐是一支小编制热乐队：两拍贝斯、班卓拨弦、钟琴旋律、弱音铜管、木鱼；安静段是摇篮曲。音效是鼓手加滑哨：`boing`、`whack`、`slide`、`zip`、`squeak`、`tink`、`pop`、`swish`、`crash`、`ratchet`、`tick`、`gulp`、`thud`。

## 已知坑

| 现象 | 原因 / 处理 |
|---|---|
| 全片都在慢慢飘 | 网感动画的通病。要「停住—突然动—停住」；看 `--strip` 逐格检查 |
| 撞击没有预备/余波 | 看冲击前后各 3 张：有没有反方向预备、压扁保持 2 张、楼在响、灰尘碎片 |
| 因果断了 | 每个碰撞必须由上一个碰撞造成；画不出箭头就删掉 |
| 角色走形 | 同一角色在全片保持同一比例；特写就是同一张画放大 |
| 手臂横过脸 | 伸手用 `rab` 把手臂绕到头侧，或转头（`turn`/`nx`） |
| 角色浮空 | 脚踩 `towerTop` 或地平线；路上的人脚下加椭圆阴影 |
| 天空空一半 | 镜头上推，或加云和近景层 |
| 底板出画 | 大拉远会跑到 plate 边缘；用 `xfFill` 补底，或 `academy:true` 做 4:3 |
| 字压住动作 | 字放在动作上方或字幕带以下（画面高度 88% 以下） |

## 验收

- `--check` 无 error；提醒逐条判断并记录。
- 成片 1920×1080 / 30 fps（样片可 720p），时长与时间轴一致。
- 响度 −16 LUFS 左右、真峰值约 −1.5 dBTP；黑帧与解码错误为 0（纯黑底风格按 `references/qa.md` 判定）。
- 每句旁白都有对应画面，屏幕文字全部可追溯到 `brief.md`。
- 封面取 `F.coverAt(t)` / `P.cover(t)` 的最大姿态或揭示后的 hold，不用冲击帧。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 `CREDITS.md`。风格规范原文见 `references/style.md`；只学技法，不复用任何真实工作室的角色、桥段、配乐或片尾。

