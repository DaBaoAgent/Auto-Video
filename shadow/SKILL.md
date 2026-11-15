---
name: shadow
description: 用皮影戏的做法做口播片：素白幕/木质台框、透光牛皮影人、操纵杆、红色纸签、灯暗换场。当用户说「皮影戏」「皮影」「皮影动画」「影子戏」「用皮影讲个故事」时使用。
---

# shadow：皮影戏管线

一帧是一块打在木质台框里的素白幕，从背后打光；影人是透光牛皮刻的，朱红、赭黄、靛蓝、墨黑，镂空花纹漏光；人物侧身、颈肩肘胯有关节，下面伸着操纵杆；人物上台、说话、鞠躬、骑马、倒下，红纸签挂名字和年份；换场时灯暗下去再亮起来。

首个实例：`template/` 是 044《阿努纳奇》第一段的皮影样片（30.3 s / 1920×1080 / 30 fps），五场戏、带杆道具、cast、地图路线与灯光变化齐全；只缺配音与成片。完整风格规范见 [`references/style.md`](references/style.md)，分镜模板见 [`references/storyboard.md`](references/storyboard.md)，验收清单见 [`references/qa.md`](references/qa.md)。

## 一分钟判断

- 适合：历史、故事、典故、人物（有冲突、有转折的事件）；传统文化、节日、民俗、非遗；讲清「谁对谁做了什么」——两方对峙、一方倒戈、一个人走过几个地方。
- 不适合：全是数据和 UI 的产品宣传（截屏会破坏幻觉）、快节奏科技发布（皮影动作慢而顿）、没有角色的抽象概念。

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `配音.wav` | 是 | 用户原声（也接受 m4a/mp3）。`vo` 只截取、转 48 kHz 立体声，不重录、不变声 |
| `口播稿.txt` | 是 | 每行一个自然段，空行忽略；`vo` 按字数/停顿做 DP 对齐，输出句级 + 字级时间轴 |
| `brief.md` | 是 | 事实表 + 旁白原文 + 屏幕文字表；**画面上的每个字都只能从这张表来** |
| `storyboard.md` | 是 | 信息清单、分幕、逐句画面、人物动作、灯光与音效点 |
| `index.html` | 是 | 画面是 `t` 的纯函数：`PROMO.compose({ build })`，同一帧永远渲染同一画面 |
| `score.js` | 是 | 配乐（代码合成；也可 `script.json` 设 `bgm:false` 后改用 `--bgm` 混入现成音乐） |
| `sound.js` | 是 | 音效设计；每个动作在同一帧出声 |
| `assets/manifest.js` | 是 | 图片/视频素材清单；皮影是纯代码画面，保持空对象即可 |

## 目录

```text
shadow/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与来源
├── MIGRATION.md             来源、入库范围与同步方式
├── pipeline.json            定版参数（画幅/色板/字体/运动/音频/交付）
├── runtime/
│   ├── core.js promo.js shadow.js rods.js   浏览器运行时（BB-Video MIT，vendored）
│   ├── render.mjs music.mjs bgm.mjs sound.mjs lang.mjs net.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── shadow.py            编排：new / vo / check / stills / render / qa / deliver
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
python scripts/shadow.py new projects/<名字> --title "片名"
```

复制 `template/`，并把 `runtime/core.js`、`runtime/promo.js`、`runtime/shadow.js`、`runtime/rods.js` 复制到 `<工程>/lib/`。`index.html` 在 `lib/shadow.js` 之后加载 `lib/rods.js`。

`template/` 不是空白模板，而是**阿努纳奇样片的完整做法**：`index.html` 是五场戏、`brief.md`/`storyboard.md` 是事实与分镜，`score.js`/`sound.js` 是配乐音效。照着它改，比从零写快。

### 2. 配音与时间轴

```bash
python scripts/shadow.py vo projects/<名字> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
```

产出：

- `audio/narration.m4a` / `audio/narration.wav`
- `timeline.json` / `timeline.js`（句级 + 字级；页面用 `F.T.start(id)`、`F.T.word(id, '词')` 取时间）
- `paragraphs.js`（自然段起止）
- `script.json`（`bgm:false`，供页面与渲染器读取）

> `vo` 生成的行数取决于你的口播稿；样片 `index.html` 里的 `s('l8')`、`T.word(...)` 要改成你实际的行 id。改稿后先 `--check`，再渲染。

### 3. 事实与分镜

先写 `brief.md`：3–5 条事实、每条事实的画面证据、屏幕关键词、允许的创意短句、Off limits。再写 `storyboard.md`：每一句旁白对应什么画面、谁在做什么动作、哪件道具在哪一拍动、灯光怎么变。**分镜没写清就不要写代码**。

### 4. 写画面

`index.html` 的结构：

```js
PROMO.compose({
  bpm: 84, offset: 0.5, tail: 1.1,
  theme: { /* 幕色、字色、字体 */ },
  build: async (F) => {
    const T = F.T, s = T.start, e = T.end;
    const Y = PROMO.shadow(F, { lamp: 0.05 });
    const R = SHADOW_RODS(F, Y, { H: F.H, L: (a, b) => F.portrait && b !== undefined ? b : a });
    const a1 = s('l1'), a2 = s('l2'), /* … */ fin = F.duration;
    // 一场戏一个 Y.stage；换场用 Y.change；人物用 Y.cast + Y.puppet
  },
});
```

时间只从 `timeline.js` 来，不手写秒数；屏幕文字只从 `brief.md` 来。

### 5. 配乐与音效

`score.js` 写段落与配器；`sound.js` 写每个动作的声音。样片最终用的是用户指定 BGM，`script.json` 里 `bgm:false`，渲染时混入：

```bash
python scripts/shadow.py render projects/<名字> --bgm "音乐.mp3" --bgm-volume 0.14
```

想用 `score.js` 的内置配乐，把 `script.json` 的 `"bgm"` 改成 `true`，渲染时不要传 `--bgm`。

### 6. 自检与抽帧

```bash
python scripts/shadow.py check  projects/<名字>
python scripts/shadow.py stills projects/<名字> --times 2,8,15,25
python scripts/shadow.py stills projects/<名字> --times 2,8 --aspect 9:16
```

`--check` 会查：文字重叠/出画/阅读时间、旁白段落里没有新动作、频闪与镜头急变、音效过密、人物是否原样重复、屏幕文字是否越出 `brief.md`。皮影动作慢，提醒不等于错误：先判断它是不是有意的停顿，再决定改不改。

### 7. 渲染

```bash
python scripts/shadow.py render projects/<名字>                     # 1920×1080
python scripts/shadow.py render projects/<名字> --scale 0.6667      # 720p 样片
python scripts/shadow.py render projects/<名字> --draft             # 半分辨率快看
python scripts/shadow.py render projects/<名字> --aspect 9:16       # 竖屏版
```

渲染是 Chrome 逐帧 + ffmpeg；1080p 每帧约 0.3–0.8 s，30 秒片约 5–15 分钟。

如果 4 路并行出现 `frame-timeout`（某一路超过 60 秒没拍回来），降到 `--workers 1`（或 2）并加 `--frame-timeout 180`；慢一点但能出片。

### 8. 交付

```bash
python scripts/shadow.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "shadow_片名_样片_1080p"
```

产出 `.mp4 / _封面.png / _字幕.srt / _署名.txt`，QA 写入 `review/qa.json`（时长、分辨率、帧率、响度、峰值、黑帧、解码错误）。样片与阶段成果回到 `出稿/`，全片归档到 `out/`。

## 阿努纳奇样片逐幕

| 时间 | 旁白 | 画面 |
|---|---|---|
| 0.6–5.26 | 1978 年，一个自学楔形文字的人出了本书，说地球是外星人的金矿 | 第一场：山、草、月亮、书都插着签子；作者从左侧走上台，说、指、转身、鞠躬；红纸签「1978」挂在他头顶，大字「一本书」 |
| 5.26–11.98 | 外星人用基因和猿猴造人，替他们下矿 | 第二场：神从右侧上来，猿在跳，基因罐在晃，双螺旋在转；人淡入/走上台，说话、跳舞；大字「基因」，红纸签「人」 |
| 11.98–13.24 | 这个新物种，就是人 | 人留在台上，灯不变，让「人」这个字站住 |
| 13.24–17.36 | 书卖了几百万册，翻译成二十多种语言 | 第三场：皮影地图出现，巴格达→伦敦→纽约、巴格达→东京→开罗两条路线逐段画出；书在跳；大字「20+」，红纸签「种语言」 |
| 17.36–22.12 | 学术界冷笑：伪学术，翻译错了 | 第四场：学者说、指、晃、掩面；泥板抖动、盖章；红纸签「伪学术」；学者转身走下 |
| 22.12–23.5 | 最讽刺的事情在后面 | 灯暗，换场前留一拍 |
| 23.5–26.82 | 四十年后，人类拿起了剪刀 | 第五场：剪刀从上方落下、开合；大字「四十年后」 |
| 26.82–29.12 | 不是外星人，是细菌 | 细菌从台面升起，菌毛摆动；大字「细菌」 |

### 这条管线的做法

- **一物一杆**：皮影不是贴在幕布上的剪纸，而是插着签子的舞台道具。每个有意义的道具都用 `rp()` / `SHADOW_RODS.mount()`：先画从道具底部延伸到台框下的深棕操纵杆（`#2A1A10`，约 4 px），再画道具，整组以下端为轴 `rotate`，加 0.5–2° 的慢摆和小幅上下浮动。样片里的山、草、月亮、书、猿、罐子、双螺旋、泥板、剪刀、细菌全部带杆。
- **每件道具自己会动**：书页开合、罐盖跳、螺旋脉动、泥板抖、剪刀开合、菌毛摆、草叶一根根弯。`frame(t, g, o)` 里给每件道具一个自己的小动作；不动就会读成贴纸。
- **场景至少两件活的边缘道具**：左右草、山、月亮、云放在边缘，中间留给演员；讲台词时再让一件道具跟着动。
- **人物先定妆，再逐场调用**：`Y.cast({ 作者: { kind, look, colors }, … })` 定脸型/胡子/帽子/袍色，之后每场 `Y.puppet(sc, { who: '作者', … })`。同场两个人至少两处不同（脸谱、胡子、帽子、袍色、胖瘦、高矮）。
- **动作密度 1.2–1.5 秒一个**：`walk / talk / point / bow / fight / fall / lie / rise / sink / sway / weep / turn / exit / dance / ride` 串起来；一个人物整句站着不动就是死气。
- **换场就是灯暗灯亮**：`Y.change(at, dur, { to, color })`，在灯最暗的一刻换景；最多每 4 秒一次。灯色 `warm` / `red`（战火）/ `cold`（夜、逃亡、悲伤）承载情绪，不要靠花哨转场。
- **字是幕上的字**：`Y.placard` 红纸签挂名字/地点/年份（≤6 字可竖排，`over: figure` 自动挂在人物头顶）；`Y.title` 大字楷书；`Y.endcard` 收尾（`seal` 不给就不盖章）。
- **样片的五场戏**：`scene(a, z, o)` 用 `F.layer` 叠层，`Y.lamp(0.9, { to: 1, dur: 1.2 })` 从暗到亮开场；第 3 场用 `Y.map` + `Y.route` 把「二十多种语言」画成地图路线；第 5 场用自定义 `scissors` / `bacteria` 带杆道具完成反转。

## 声音

配乐是皮影戏台班子（D 小调）：弦乐铺底、琵琶/扬琴式拨弦、木鱼、堂鼓（gain ≤0.1，否则盖住其它层）、高潮铜锣。音效是木头、牛皮、锣鼓：`wood`（木鱼/纸签落下）、`gong`（大字）、`drum`（行军/战斗）、`step`（影人脚步）、`thud`（倒地）、`stamp`（印章）、`whoosh`（换场灯暗）、`impact`、`pop`、`tick`、`click`、`type`、`riser`、`boom`。

## 已知坑

| 现象 | 原因 / 处理 |
|---|---|
| 道具像贴纸 | 没有操纵杆。用 `rp()` / `SHADOW_RODS.mount()`：先杆后道具，以下端为轴 |
| 人物在说话，背景空 | 场景边缘至少两件活的道具（草/山/月亮/云），再加一件跟台词动的道具 |
| 整句没有新动作 | 皮影动作慢，但也要 1.2–1.5 秒一个动作；`talk`、挂纸签、换灯都算 |
| 纸签叠住/出画 | 一次最多 3–4 张；竖屏排成一列；离画框至少 60 px |
| 骑手比马大/浮在马背上 | 马在前（`z` 更大），骑手在后；人物 `size` 与马 `size` 匹配（样片 460 / 400–420） |
| 人物/道具不动或位置错 | 自己加的 SVG 一律 `setAttribute('transform', …)`，不要用 CSS `transform` |
| 灯闪得太频繁 | 灯亮度只 ±3% 慢闪；换场最多每 4 秒一次 |
| 红脸/白脸认错人 | 用脸谱约定：红脸忠勇、白脸奸、黑脸直；老人白胡子，年轻人无须 |
| 皮影变成纯黑剪影 | 皮影是透光彩色牛皮，不是黑影戏；保留朱红/赭黄/靛蓝的透光色 |
| `--check` 报「没有新动作」 | 先判断是不是有意的停顿；是就接受，不是就加一个 talk/point/挂签/换灯 |

## 验收

- `--check` 无 error；提醒逐条判断并记录。
- 成片 1920×1080 / 30 fps（样片可 720p），时长与时间轴一致。
- 响度 −16 LUFS 左右、真峰值约 −1.5 dBTP；解码错误 0。皮影从暗到亮，开场黑帧不作为硬门槛。
- 每句旁白都有对应画面与人物动作；屏幕文字全部可追溯到 `brief.md`。
- 封面取 `F.coverAt(t)` 的人物最大姿态或灯亮后的稳定画面。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 `CREDITS.md`。风格规范原文见 `references/style.md`；只学技法，不复用任何真实剧团/工作室的角色、桥段、配乐或片尾。
