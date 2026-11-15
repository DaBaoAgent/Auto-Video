# 封面与发布信息

`out/<编号>_<人物>/` 里**只放四个文件**：成片 + `src_3x4.png` + `src_4x3.png` + 发布信息。规范沿用
`DaBaoAgent/yandi` 的成片约定。

不放：审核版（母版一条 ffmpeg 就能压）、`字幕.srt`（留工程根目录）、
封面无字底图与生成原图（留 `work/assets/cover/`）。交付目录保持一集三件。

## 封面

### 两张，比例固定

| 文件 | 尺寸 | 用在哪 |
|---|---|---|
| `src_3x4.png` | 1080×1440 | 抖音 / 视频号 / 小红书（竖版流） |
| `src_4x3.png` | 1440×1080 | B 站 / YouTube（平台会裁 16:9，主体放右/安全区） |

两张直接放在集目录下，**不建 `封面/` 子目录**——一集就四个文件，打开目录一眼到底。

无字底图 `base_3x4.png` / `base_4x3.png` 和生成器的原始输出 `原图/` 是**素材不是交付物**，
放 `work/assets/cover/`：改文案时不必重新生成图（一张 5–10 credits，别乱删）。
`lishi.py publish` 会自动把误放在 `封面/` 下的这两类挪过去。

### 分工：图归图，字归字

- **底图**用图像生成（绢本设色、低对比、留白给标题、无文字）
- **标题文字**用 Remotion 叠（`src/Cover.tsx`）

不要指望 AI 写字。两个字的人名偶尔能对，生僻字必崩——「碽」这种字十有八九
被写成「碛」。真字体渲染 100% 可控，还能和片子共用同一套 ink()/gold() 色。

### 底图 prompt 模板

```
Traditional Chinese silk painting in the style of a {朝代} dynasty hanging scroll,
NOT a photograph, NOT a 3D render, NOT photorealism.
{竖版:Vertical portrait / 横版:Horizontal landscape} composition.
Subject: {一个场景，人物背影或侧影，脸不出现}
Flat mineral pigments on aged silk, visible woven silk texture, thin ink outlines,
dry brush strokes, muted ochre, faded indigo and dusty sepia with one restrained
vermilion accent, even diffuse light, no lens blur, no bokeh.
No text, no letters, no calligraphy, no seal characters, no border, no frame.
The entire {upper third / left third} of the frame is empty pale silk reserved for a title.
{2:3 portrait / 4:3 landscape} aspect.
```

### 生成后必做三步

```bash
# 1 去水印（右下角「AI生成 WORKBUDDY」，delogo 区域不能贴边）
# 2 裁到目标比例（3:4 从 2:3 裁：crop=1024:1365:0:0）
# 3 缩放（lanczos）
ffmpeg -y -i 原图.png -vf "delogo=x=838:y=1414:w=178:h=114,crop=1024:1365:0:0,scale=1080:1440:flags=lanczos" base_3x4.png
ffmpeg -y -i 原图.png -vf "delogo=x=1346:y=1040:w=184:h=106,scale=1440:1080:flags=lanczos" base_4x3.png
```

`delogo` 的 x+w / y+h 必须小于画面尺寸，否则报 `Logo area is outside of the frame`。

### 叠字时的两个坑

1. **必须包 `LookProvider`**。`Seal` 的朱砂色是 CSS 变量 `--lk-cin`，
   少了 Provider 变量未定义，印章会变成没有底色的白字。
2. **封面印章不要用成片的 `Seal`**。它带 3px 纸色描边（在纸面上看不出），
   压在深色底图上会变成一圈白边。封面用 `CoverSeal`（暗投影）。

## 发布信息（`发布信息.md`）

**只写两件事：5 个标题 + 4 个标签。** 简介、正文、平台分组、封面说明、发布备注
都不写进这个文件——平台后台各有一栏，复制粘贴比翻 Markdown 快。

```markdown
# 003 朱元璋·碽妃疑案

## 标题（5 选 1）

1. <主推标题>（主推）
2. <备选>
3. <备选>
4. <备选>
5. <备选>

## 标签（4 个）

#历史 #明朝 #朱棣 #历史悬案
```

要点：

- **5 个标题要真的不同路子**，不是同一句改字：数字反差 / 认知冲突 / 人名前置 /
  悬念问句 / 短句口语。同义词替换等于只有一个标题。
- **4 个标签**：2 个大词（能带来流量，如 `#历史` `#明朝`）+ 2 个精确词
  （能带来精准观众，如 `#朱棣` `#历史悬案`）。生僻词（`#碽妃`）不作标签，搜不到。
- 第 1 个标题标「主推」，方便事后对照数据复盘。

### 标题的三条纪律

1. **最大流量词放最前**（人名 / 朝代 / 数字反差）
2. **第二句制造认知冲突**，不要复述第一句
3. **不做标题党**：片子里没讲到的结论，标题里不许出现。历史类内容一旦被举报
   「标题与内容不符」，账号权重掉得比涨得快

### 两条纪律（写进片子，不写进发布信息）

1. **史料逐条列**。悬案类内容必须有出处，否则评论区会变成考据战场。
2. **不确定的地方明说**。E3 里「学界主流认为碽妃之说不可信」是通行观点，
   写成定论会误导；写成「大概率」既准确又留了讨论空间。

## 归档检查

```bash
python lishi/scripts/lishi.py publish --project <slug>
```

它只做三件事：拷母版、拷两张封面、检查 `发布信息.md`（不存在就落一个空模板，
5 个标题 + 4 个标签留手填）。SRT 留在工程里，审核版需要时另外压：

```bash
ffmpeg -y -i "<片名>.mp4" -c:v libx264 -crf 28 -preset medium \
  -c:a aac -b:a 128k -movflags +faststart "<片名>_审核版.mp4"
```
