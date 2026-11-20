---
name: pintie
description: | --- | --- |
---

# pintie：拼贴剪贴（Collage Cutout）

| 项 | 值 |
| --- | --- |
| 工位 | 平面动效 |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（自研，按拼贴剪贴的特征重写） |
| 画幅 | 16:9 · 24 fps |
| 入口 | `scripts/pintie.py` |

## 这条管线交什么

旧报纸上剪出的一座城：纸楼房、纸太阳、纸火车、撕边云，12 fps 定格，白剪边与落影。

自包含的单风格渲染线：运行时、舞台、画法脚本、入口全在 `pipelines/pintie/runtime/` 里，仓库外不留依赖。

## 入口命令

```bash
python pipelines/pintie/scripts/pintie.py --stills 0.5,2.5 --out review/pintie
python pipelines/pintie/scripts/pintie.py --out out/pintie_试片.mp4 --seconds 8
```

## 写法要点

- 先读 `references/style.md`：那份卡写的是这套拼贴剪贴的规矩，`runtime/scene.js` 是它的实现。
- 画面是代码画的：不加载外部图片、不引用外部库。
- 换题材时保留工序：报纸铺开 → 楼群落纸 → 纸火车驶入 → 标题纸带贴上来 → 红章盖下。。

## 自研边界

- 自研：`runtime/render.py`、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/pintie.py`。
- 只参考：mg-styles-15（MIT）对这种风格的公开描述与工序；未复制其源码或素材。

---

## 附：拼贴一页短片（横屏竖屏都出，2026-11-20 定版）

上面讲的是这条管线的自研入口（`scripts/pintie.py`，16:9 / 24 fps）。要有故事、要出竖屏，照 `projects/ep24v4_jobdesc/` 自建工程：`scene.js` + `main.js`，同一个文件换 `--width/--height` 就出横屏或竖屏，用仓库通用的渲染器。

```powershell
Set-Location 'D:\@kaifa\Auto-Video'
$env:PLAYWRIGHT_CORE='D:\@kaifa\Auto-Video\piying\node_modules\playwright-core'
$env:PLAYWRIGHT_CHROME=(Get-ChildItem "$env:LOCALAPPDATA\ms-playwright\chromium-1223" -Recurse -Filter 'chrome.exe' | Select-Object -First 1).FullName
node vendor\runtime\render-legacy.mjs pipelines\pintie\projects\<工程> --width 1080 --height 1920 --fps 30 --out out\video-9x16.mp4
node vendor\runtime\render-legacy.mjs pipelines\pintie\projects\<工程> --width 1920 --height 1080 --fps 30 --out out\video-16x9.mp4
node vendor\runtime\render-legacy.mjs pipelines\pintie\projects\<工程> --width 1080 --height 1920 --fps 30 --still 0,2.5,5.4
```

### 拼贴六条

1. **层次写死，别临场想。** 旧报纸打底（`#e8dfc9`，7px 网格半调网点 + 三栏示意文字 + 中缝折痕）→ 牛皮纸片中景（`#a97c4c`，斜着贴）→ 白纸条最上 → 剪片（人/物）压在边上。每层都要有自己的纸影：`torn()` 出的同形黑影，偏移 `[8,10]`、alpha `.20`。
2. **白剪边不是描边。** 剪片先画一圈比本体大 3–4 px 的白边（`WHITEP #f6f1e2`），再压本体；边必须用 `torn()` 走 14px 步长 + 抖动，等宽描边一眼假。
3. **字只给示意，不给真字。** 纸上的文字一律用 `textLines()` 的一排排短横线（每行 2–4 段、长短随机、alpha .55–.75）。要盖章也只给粗杠，让观众懂"这是文"，不用看清写什么。
4. **12 fps 定格 + 手抖。** 所有位置量到 `Math.floor(t*12)/12` 再算，位移叠 `±2px` 的 seeded 抖动。纸片"拍上来"：0.34 s 内从上方 -110K 落下、`scale 1.06→1`、投影先重后轻，不做淡入。
5. **主事件只一件。** 这条片子的主事件是红章砸下：5.35 s 前 0.34 s 从 1.55 倍缩到 1 倍落下，落点抖 0.18 s，飞 12 点墨（`1-t/.5` 衰减），章面用 40 个缺墨白点做旧。
6. **第 0 帧就要有戏。** 报纸别留白开场：底纸 0.24 s 内铺满，第一张纸条 0.30 s 就拍上去。

### 竖屏取景（1080×1920）

- 报纸铺满 `.04W/.035H` 起、`92%W × 93%H`，开画时 `scale .86→1`。
- 牛皮纸片 `.11W/.215H`、`78%W × 41%H`，`rotate -.035`——只占中上，别铺到地。
- 三张纸条 y = `.255H / .345H / .445H`，宽度 `.62 / .70 / .58`，各自 `rotate ∓.02`。
- 剪片压在下缘：小男孩 `.17W/.925H`、水壶（门口摊上的旧货）`.685W/.800H`；撕下来的一角报纸贴在 `.055W/.600H`，正好补住中下那块空。
- 红章圆心 `.545W/.380H`、半径 `.148W`，压在第二、三张纸条之间。

### 节拍（10 s 一条）

`0–0.24 s` 报纸铺满｜`0.30 / 1.10 / 1.90 s` 三张纸条依次拍上｜`2.95 s` 小男孩剪片贴上｜`3.85 s` 水壶贴上｜`4.25 s` 撕角报纸补位｜`5.35 s` 红章砸下（影片主事件）｜`5.8–10 s` 静止，只留纸面呼吸。
