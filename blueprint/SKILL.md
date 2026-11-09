---
name: blueprint
description: 用蓝晒工程图的做法做口播片：深蓝图纸、白色细线、构造线先出、尺寸与 leader 标注、真实啮合的机构、红铅笔唯一强调。当用户说「蓝图」「工程图」「蓝晒」「技术图纸」「把原理画成一张图纸」时使用。
---

# blueprint：蓝图工程图管线

一帧是一张蓝晒工程图纸：深蓝纸、纸纹、细网格，白色细线与淡青虚线按制图惯例绘制；可见边连续、隐藏边虚线、中心线与节圆点划线；尺寸有箭头和数字，leader 末端是编号气球和零件名；有明细表、剖面线、细节圆、角落标题块；机构真的按齿数/模数/中心距啮合转动；一支红铅笔是全片唯一的强调色。

首个实例：`template/` 是 018《玄奘》前 10 秒 blueprint 样片（12.1 s / 1920×1080 / 30 fps），两张图纸（洞窟剖面 + 壁画立面）、门扇开合、线描壁画、红笔圈金箍齐全；只缺配音与成片。完整风格规范见 [`references/style.md`](references/style.md)，分镜模板见 [`references/storyboard.md`](references/storyboard.md)，验收清单见 [`references/qa.md`](references/qa.md)。

## 一分钟判断

- 适合：讲一个东西怎么工作（机构、机器、装置、系统：机械表、马桶水箱、锁、电梯、相机快门、自行车齿轮、发动机、泵、阀门、打印机）；需要数字、比例、零件名的题材；硬件/工程产品宣传（拆解画成图纸）；API/系统架构画成装配图。
- 不适合：情绪故事、人物（没有角色）、以 UI 为价值的产品（用 launch/swiss/toy3d）。

## 输入契约

| 输入 | 必填 | 说明 |
|---|---|---|
| `配音.wav` | 是 | 用户原声（也接受 m4a/mp3）。`vo` 只截取、转 48 kHz 立体声，不重录、不变声 |
| `口播稿.txt` | 是 | 每行一个自然段，空行忽略；`vo` 按字数/停顿做 DP 对齐，输出句级 + 字级时间轴 |
| `brief.md` | 是 | 事实表 + 旁白原文 + 屏幕文字表；**图上每个尺寸、齿数、比例、零件名都必须有来源** |
| `storyboard.md` | 是 | 信息清单、分幕、逐句画面、每张图纸的视图与镜头 |
| `index.html` | 是 | 画面是 `t` 的纯函数：`PROMO.compose({ build })`，同一帧永远渲染同一画面 |
| `score.js` | 是 | 配乐（代码合成；blueprint 默认用内置配乐，`script.json` 设 `bgm:true`） |
| `sound.js` | 是 | 制图室音效；每个动作在同一帧出声 |
| `assets/manifest.js` | 是 | 图片/视频素材清单；纯代码图纸保持空对象即可 |

## 目录

```text
blueprint/
├── SKILL.md                 本文档
├── README.md                快速开始
├── CREDITS.md               许可与来源
├── MIGRATION.md             来源、入库范围与同步方式
├── pipeline.json            定版参数（画幅/色板/字体/运动/音频/交付）
├── runtime/
│   ├── core.js promo.js blueprint.js   浏览器运行时（BB-Video MIT，vendored）
│   ├── render.mjs music.mjs bgm.mjs sound.mjs lang.mjs net.mjs scores/
│   └── LICENSE.BB-Video
├── scripts/
│   ├── blueprint.py         编排：new / vo / check / stills / render / qa / deliver
│   └── make_vo.py           配音 + 口播稿 → timeline / paragraphs / script.json
├── references/
│   ├── style.md             完整风格规范（BB-Video STYLE.md）
│   ├── storyboard.md        分镜模板
│   └── qa.md                验收清单
└── template/                玄奘前 10 秒 blueprint 样片工程（无音频与成片）
```

## 流程

### 1. 建工程

```bash
python scripts/blueprint.py new projects/<名字> --title "片名"
```

复制 `template/`，并把 `runtime/core.js`、`runtime/promo.js`、`runtime/blueprint.js` 复制到 `<工程>/lib/`。

`template/` 不是空白模板，而是**玄奘前 10 秒 blueprint 样片的完整做法**：`index.html` 是两张图纸（洞窟剖面 + 壁画立面），`brief.md`/`storyboard.md` 是事实与分镜，`score.js`/`sound.js` 是配乐音效。照着它改，比从零写快。

### 2. 配音与时间轴

```bash
python scripts/blueprint.py vo projects/<名字> --src 配音.wav --text 口播稿.txt [--lead 0.7] [--cut 秒]
```

产出：

- `audio/narration.m4a` / `audio/narration.wav`
- `timeline.json` / `timeline.js`（句级 + 字级；页面用 `F.T.start(id)`、`F.T.word(id, '词')` 取时间）
- `paragraphs.js`（自然段起止）
- `script.json`（**`bgm:true`**，blueprint 默认用 `score.js` 的内置配乐）

> `vo` 生成的行数取决于你的口播稿；样片 `index.html` 里的 `s('l4')`、`T.word(...)` 要改成你实际的行 id。改稿后先 `--check`，再渲染。

### 3. 事实与分镜

先写 `brief.md`：3–5 条事实、每条事实的画面证据、图上会出现的每个尺寸/齿数/比例/零件名及其来源、允许的创意短句、Off limits。再写 `storyboard.md`：每一句旁白对应哪张图纸、哪个视图、哪条线先画、哪个尺寸什么时候标、镜头推到哪。**分镜没写清就不要写代码**。

### 4. 写画面

`index.html` 的结构：

```js
PROMO.compose({
  bpm: 96, offset: 0, tail: 1.2,
  theme: { /* 蓝晒色、字色、字体 */ },
  build: (F) => {
    const T = F.T, s = T.start, e = T.end, w = T.word, B = PROMO.blueprint(F);
    const S = B.sheet({ a: 0, w: 5760, h: 3240, x: 600, y: 400 });
    B.frame({ at: 0.05 });
    B.block({ title: '片名', no: 'BP-001', scale: '示意', sheet: '1/1', at: 0.18 });
    const V = B.view(S, { x: 0, y: 0, scale: 1 });
    S.cam([{ at: 0, ...S.fit({ x, y, w, h }, 0.05, 0.16) }]);
    // 一个主体一张 sheet；同 sheet 只推近/拉远，不横移换主体
    B.title(V, { x, y, text: 'SECTION A–A', sub: '…', at: 0.28 });
    B.poly(V, { pts, close: true, cons: true, at: s('l1') + 0.2 });
    // 尺寸、leader、红笔都对着 T.word 落
  },
});
```

时间只从 `timeline.js` 来，不手写秒数；图上文字只从 `brief.md` 来。

### 5. 配乐与音效

`score.js` 是钟表式室内乐（D 小调 96 BPM）：pad、八分拨弦、反拍木鱼、sub、钟琴动机，高潮才进 kick/strings。`sound.js` 是制图室：`draw`、`letter`、`dim`、`hatch`、`pencil`、`stamp`、`expose`、`slide`、`explode`、`cut`、`tick`/`tock`。

blueprint 默认用内置配乐（`script.json` 的 `bgm:true`）。要改用现成 BGM：

```bash
# 先把 script.json 的 "bgm" 改成 false，再：
python scripts/blueprint.py render projects/<名字> --bgm "音乐.mp3" --bgm-volume 0.14
```

### 6. 自检与抽帧

```bash
python scripts/blueprint.py check  projects/<名字>
python scripts/blueprint.py stills projects/<名字> --times 2,5,7.5,10.2
python scripts/blueprint.py stills projects/<名字> --times 2,5 --aspect 9:16
```

`--check` 会查：文字重叠/出画/阅读时间、旁白段落里没有新动作、频闪与镜头急变、齿轮/机构几何、音效过密、屏幕文字是否越出 `brief.md`。blueprint 的配乐层级提醒（pad 偏响、某些层听不到）是样片混音的实际状态，按需调 gain。

### 7. 渲染

```bash
python scripts/blueprint.py render projects/<名字>                     # 1920×1080
python scripts/blueprint.py render projects/<名字> --scale 0.6667      # 720p 样片
python scripts/blueprint.py render projects/<名字> --draft             # 半分辨率快看
python scripts/blueprint.py render projects/<名字> --aspect 9:16       # 竖屏版
```

渲染是 Chrome 逐帧 + ffmpeg；1080p 每帧约 0.3–0.8 s，短片约 2–5 分钟。

如果 4 路并行出现 `frame-timeout`（某一路超过 60 秒没拍回来），降到 `--workers 1`（或 2）并加 `--frame-timeout 180`；慢一点但能出片。

### 8. 交付

```bash
python scripts/blueprint.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "blueprint_片名_样片_1080p"
```

产出 `.mp4 / _封面.png / _字幕.srt / _署名.txt`，QA 写入 `review/qa.json`（时长、分辨率、帧率、响度、峰值、黑帧、解码错误）。样片与阶段成果回到 `出稿/`，全片归档到 `out/`。

## 玄奘样片逐幕

| 时间 | 旁白 | 画面 |
|---|---|---|
| 0–0.54 | （静音） | 图纸边框、标题块 `榆林窟 第2窟 / BP-018 / 示意 / 1/1 / 1953 / 考古队`；SECTION A–A 标题绘入；崖体与洞窟构造线先出 |
| 0.54–4.06 | 一九五三年，甘肃敦煌的榆林窟，考古队推开第二号窟的门 | 崖体剖面轮廓与 45° 剖面线绘入；洞窟空腔成形；门扇绕铰链旋转打开（「推开」处，`G.to` + `slide` 音效）；崖体 ROCK / 窟室 CAVE / 门 DOOR 三条 leader；镜头在 l1 中段缓慢推近 |
| 4.06–8.38 | 壁画上画着一个和尚，一匹瘦马，还有一个猴脸徒弟，腰里别着金箍 | 第二张图纸用 `B.sheet({ enter:'expose' })` 曝光进来；ELEVATION B / 壁画立面；和尚、瘦马、猴脸徒弟依次用 `B.path`/`B.circle` 描出并 leader 标注；金箍画出后红笔圈出（全片唯一红色） |
| 8.52–9.22 | 考古队愣了 | 画面静止，镜头极缓拉远 |
| 9.22–10.80 | 这不就是唐僧和孙悟空吗 | 两条补充 leader：唐僧? / 孙悟空? 分别指向和尚与猴脸徒弟 |
| 10.8–12.0 | （尾音） | 标注保持，内置配乐收尾；封面取约 10.2 s |

### 这条管线的做法

- **一个主体一张图纸**：`B.sheet({ a, enter:'expose'|'slide'|'cut' })` 换主体；同 sheet 只允许推近/拉远（`S.cam` + `S.fit`），不要横移过纸去讲下一个主体——那会读成在滑动纸张。样片用两张 sheet：洞窟剖面（S）与壁画立面（S2，l2 曝光进来）。
- **先构造线，后终线，再标注**：`cons:true` 先下细构造线，终线用描图笔 `pen:true` 压上；`at` 是线画完的时刻，不是开始。尺寸/leader/文字在实体线之后落。
- **标题块与视图**：`B.block` 写图号/比例/张数/日期/作者；`B.view` 定局部坐标；`B.title` 是带粗细分隔线的视图标题（`SECTION A–A` / `ELEVATION B`）。
- **机构真的会动**：`B.clock` + `B.mech` 的齿轮/擒纵/凸轮/齿条按真实齿数、模数、中心距和转向啮合；`M.spin` 标出转向与转速。样片里门扇是 `B.group` 绕铰链 `G.to({ rot:78 })` 打开。
- **细节 = 推近 + focus**：先在平面上画 callout 圆和字母，再 `S.cam` 推近、`B.focus` 让其余线变暗；细节的 leader/尺寸画在第二个同位置 view 上（不被 focus 压暗），字号除以 zoom。
- **红笔是唯一强调色**：`B.pencil({ kind:'ring'|'underline'|'tick'|'cross'|'arrow' })`，一个想法最多一处；样片只在金箍上圈一次（8.15 s）。
- **信息密度**：图上每句至少一个新线/新标注/新尺寸；不要用「蓝纸上的幻灯片」——没有制图内容的字不算。
- **数字必须有来源**：齿数、比例、转速、尺寸、年代都写在 `brief.md`；没有公开数据就用内部自洽的示意值，并在图上标「示意 NTS」。

## 声音

配乐是钟表式室内乐（D 小调，96 BPM）：软 pad、八分拨弦（像轮系）、反拍木鱼（像擒纵）、低音 sub、钟琴动机；高潮才进 kick 与 strings。说话时脉冲/动机/木鱼自动让位。音效是制图室与工作台：`draw`（绘图笔沿线）、`letter`（写字）、`dim`（尺寸/leader 的尺子咔哒）、`hatch`（剖面线）、`pencil`（红笔）、`stamp`（标题块更新）、`expose`（新图纸曝光）、`slide`（图纸滑入）、`explode`（零件沿轴滑开）、`cut`（剖切打开）、`tick`/`tock`（擒纵）。

## 已知坑

| 现象 | 原因 / 处理 |
|---|---|
| 齿轮像假的 | 啮合齿轮必须同模数；用 `mesh` + `dir` 放置，`--check` 会核对中心距与转向 |
| 高速齿轮频闪 | 转速超过约 0.3 齿距/帧时运行时自动模糊；`blur:false` 会被报 |
| 字太多太小 | 一句一个视图，镜头框紧；每场至少一行约 45 px 的大字（竖屏 25 px） |
| leader 压住别的字 | leader 送到空白处（`to` 在零件外，`side` 朝开口侧）；竖屏用短中文 |
| 新图纸一片空白 | 新 sheet 要么在 `S.a` 之前已经画好，要么从 `S.a + 0.3` 开始绘入；不要空纸等旁白 |
| 在纸上横移换主体 | 读成滑纸；换主体开新 sheet，同 sheet 只推近/拉远 |
| 数字是编的 | 每个数字/比例/齿数都要在 `brief.md` 有来源；没有就标「示意」并保持内部自洽 |
| 红笔到处都是 | 一个想法最多一处；`--check` 超过约每 10 秒一次会提醒 |
| 字幕压住标题块 | `S.fit(…, pad, band)` 留出字幕带；caption 长度受 `captions.max` 限制 |
| 竖屏直接套横屏 | 竖屏是另一套排版：视图纵向排、齿轮上下啮合、leader 改短 |
| 纯黑剪影/HUD 发光 | 这是蓝晒工程图：深蓝纸、白细线、无霓虹、无扫描线 |

## 验收

- `--check` 无 error；提醒逐条判断并记录（配乐层级提醒按需调 gain）。
- 成片 1920×1080 / 30 fps（样片可 720p），时长与时间轴一致。
- 响度 −16 LUFS 左右、真峰值约 −1.5 dBTP；解码错误 0；深蓝底不是黑帧。
- 每句旁白都有对应线/标注/尺寸；图上文字全部可追溯到 `brief.md`。
- 封面取 `F.coverAt(t)`：样片约 10.2 s，红笔圈完金箍、两条「唐僧? / 孙悟空?」标注完成时。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 `CREDITS.md`。风格规范原文见 `references/style.md`；只学技法，不复用任何公司图纸、CAD 布局、Logo 或商业外观。
