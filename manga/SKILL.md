---
name: manga
description: 把口播片做成会动的漫画页：黑墨线、网点、分格、手写拟声词、对白气泡，镜头按阅读顺序读页、在关键格 Punch-in。当用户说「日漫」「漫画分镜」「动画漫画」「把这段做成漫画页」「motion comic」时使用。
---

# manga：日漫 · 漫画分镜管线

一帧就是一张白纸黑墨的漫画页：分格与装订线、网点、速度线/集中线、汗滴与青筋、手写拟声词（ドン / ゴゴゴ / 轰 / 咚），一格一个 beat，镜头按从右到左的阅读顺序读下去。

首个实例：`template/` 是 044《阿努纳奇》第一段的日漫 · 漫画分镜样片（30.4 s / 1920×1080 / 30 fps），代码、分镜、文案、配乐、音效齐全；只缺配音与成片。完整风格规范见 [`references/style.md`](references/style.md)，分镜模板见 [`references/storyboard.md`](references/storyboard.md)，验收清单见 [`references/qa.md`](references/qa.md)。

## 一分钟判断

- 适合：科学/概念对抗（分子 vs 受体、病毒 vs 免疫）、有反转的故事、面向年轻人的角色驱动宣传片。
- 不适合：数据密集的财经、沉重题材（漫画的喜剧 beat 会消解）、步骤很多的长流程、中国历史（用皮影/水墨）。

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
manga/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与来源
├── MIGRATION.md             来源、入库范围与同步方式
├── pipeline.json            定版参数（画幅/色板/字体/运动/音频/交付）
├── runtime/
│   ├── core.js promo.js manga.js   浏览器运行时（BB-Video MIT，vendored）
│   ├── render.mjs music.mjs bgm.mjs sound.mjs lang.mjs net.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── manga.py           编排：new / vo / check / stills / render / qa / deliver
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
python scripts/manga.py new projects/<名字> --title "片名"
```

复制 `template/`，并把 `runtime/core.js`、`runtime/promo.js`、`runtime/manga.js` 复制到 `<工程>/lib/`。

`template/` 不是空白模板，而是**阿努纳奇样片的完整做法**：`index.html` 是逐幕画面，`brief.md`/`storyboard.md` 是事实与分镜，`score.js`/`sound.js` 是配乐音效。照着它改，比从零写快。

### 2. 配音与时间轴

```bash
python scripts/manga.py vo projects/<名字> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
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
    const G = PROMO.manga(F, { /* 风格参数 */ });
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
python scripts/manga.py render projects/<名字> --bgm "音乐.mp3" --bgm-volume 0.14
```

想用 `score.js` 的内置配乐，把 `script.json` 的 `"bgm"` 改成 `true`，渲染时不要传 `--bgm`。

### 6. 自检与抽帧

```bash
python scripts/manga.py check  projects/<名字>
python scripts/manga.py stills projects/<名字> --times 2,8,15,25
python scripts/manga.py stills projects/<名字> --times 2,8 --aspect 9:16
```

`--check` 会查：文字重叠/出画/阅读时间、旁白段落里没有新动作、频闪与镜头急变、音效过密、屏幕文字是否越出 `brief.md`。提醒不等于错误：先判断它是不是这条风格的有意选择，再决定改不改。

### 7. 渲染

```bash
python scripts/manga.py render projects/<名字>                     # 1920×1080
python scripts/manga.py render projects/<名字> --scale 0.6667      # 720p 样片
python scripts/manga.py render projects/<名字> --draft             # 半分辨率快看
python scripts/manga.py render projects/<名字> --aspect 9:16      # 竖屏版（页面用 F.portrait 分支）
```

渲染是 Chrome 逐帧 + ffmpeg；1080p 每帧约 0.3–0.8 s，30 秒片约 5–15 分钟，长片更久。

如果 4 路并行出现 `frame-timeout`（某一路超过 60 秒没拍回来），降到 `--workers 1`（或 2）并加 `--frame-timeout 180`；慢一点但能出片。

### 8. 交付

```bash
python scripts/manga.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "manga_片名_样片_1080p"
```

产出 `.mp4 / _封面.png / _字幕.srt / _署名.txt`，QA 写入 `review/qa.json`（时长、分辨率、帧率、响度、峰值、黑帧、解码错误）。样片与阶段成果回到 `出稿/`，全片归档到 `out/`。

## 阿努纳奇样片逐幕

| 时间 | 旁白 | 画面 |
|---|---|---|
| 0.6–5.26 | 1978 年，一个自学楔形文字的人出了本书，说地球是外星人的金矿 | 第 1 页：1978 年分格，书与作者，旁白框交代时间地点 |
| 5.26–11.98 | 外星人用基因和猿猴造人，替他们下矿 | 同页下半：神 × 猿的 VS 分格，基因罐，人从罐里出现 |
| 11.98–13.24 | 这个新物种，就是人 | 人的特写格 + 手写拟声词 |
| 13.24–17.36 | 书卖了几百万册，翻译成二十多种语言 | 第 2 页用 `slash` 翻页：书堆、数字 20+、语言标签 |
| 17.36–22.12 | 学术界冷笑：伪学术，翻译错了 | 第 3 页用 `turn` 翻页：学者、泥板、红叉、「偽」 |
| 22.12–23.5 | 最讽刺的事情在后面 | 一格静默，只有网点在呼吸 |
| 23.5–26.82 | 四十年后，人类拿起了剪刀 | `R.splash` 整页出血：巨剪刀 + 集中线 + 白闪 + 震动 |
| 26.82–29.12 | 不是外星人，是细菌 | 第 4 页用 `ink` 翻页：细菌特写，收在「完」 |

### 这条管线的做法

- **页是单位，格是 beat**：`R.page(a, b, { in: 'cut'|'slash'|'turn'|'ink' })` 定一页的时间；`pg.tiers(rows)` 切格；`pg.read([panels], [times])` 按阅读顺序读；`pg.punch(t, panel)` 在关键词上 punch-in。
- **先让读者看见整页**：每页第一拍用 `'page'` 视图，再推近；不要一上来就特写。
- **黑白 + 一个 spot 色**：纸 `#fff`、墨 `#141414`、网点 0.15–0.45 覆盖；spot 只给一个东西（样片给红色剪刀/红叉），`spot:false` 可关。
- **拟声词是画，不是字幕**：`P.sfx('ドン'|'轰'|'咚', { style:'impact'|'rumble'|'pop' })`，字要压住动作；对白/旁白才用 `P.balloon('talk'|'shout'|'think'|'narr', text)`。
- **角色用原创 cast**：`R.cast({ ... })` 定比例/发型/眼睛/服装；`P.char(name, { shot:'full'|'bust'|'face'|'eyes'|'chibi'|'silhouette', pose, face })`；两个人说话要 `faceTo` 互相看。
- **信息装置**：`P.intro` 入场名牌、`P.label` 手写标注、`P.chart` 手绘图表、`P.manpu` 漫画符号（汗/青筋/闪光/蒸汽/zzz/…）。
- **转场只用一种大动作**：一页最多一次 punch-in、一次 shake、一次 splash；冲击用 `R.flash({ kind:'white'|'black'|'invert'|'spot' })` 2–4 帧。

## 声音

配乐是 E 小调动画战斗 OST：跳弓弦乐、摇滚鼓、锯齿主音、铜管重击、转折处一架钢琴。音效跟着画面上的拟声词走：`hit`（拟声词重击）、`rumble`（低沉震动）、`punch`、`slash`、`page`、`whoosh`、`pan`、`pen`/`ink`、`pop`、`shout`、`blip`、`drip`、`ting`、`puff`、`gloom`、`tick`。

## 已知坑

| 现象 | 原因 / 处理 |
|---|---|
| 旁白在走，画面没新动作 | 每句至少一个新格、一次 punch、一个气泡或一个拟声词；`--check` 会列「没有新动作」 |
| 一直 punch-in / 一直震 | 一页最多一次；只在真正的冲击上用 |
| 网点像数码灰 | 网点必须是点/线/沙，不要平滑渐变灰 |
| 拟声词太规矩 | 每个字单独旋转缩放；impact 从 2× 砸下，rumble 抖动，pop 弹 |
| 竖排太长 | 超过 6 个字改横排；竖排只给短喊话 |
| 角色像某部现有漫画 | 原创 cast，不借任何现有角色的发型/服装/疤/徽章 |
| 屏幕字越出 brief | 气泡、旁白框、标签、图表标签都要在 `brief.md` 里；拟声词算画面不算事实 |

## 验收

- `--check` 无 error；提醒逐条判断并记录。
- 成片 1920×1080 / 30 fps（样片可 720p），时长与时间轴一致。
- 响度 −16 LUFS 左右、真峰值约 −1.5 dBTP；黑帧与解码错误为 0（纯黑底风格按 `references/qa.md` 判定）。
- 每句旁白都有对应画面，屏幕文字全部可追溯到 `brief.md`。
- 封面取 `F.coverAt(t)` / `P.cover(t)` 的最大姿态或揭示后的 hold，不用冲击帧。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 `CREDITS.md`。风格规范原文见 `references/style.md`；只学技法，不复用任何真实工作室的角色、桥段、配乐或片尾。

