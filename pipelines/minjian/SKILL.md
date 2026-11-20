---
name: minjian
description: 民间故事绘本（Folk-tale Storybook）：水粉压在铅笔稿上，前景不透明，越往远越薄，最后只剩没盖住的那几根线。 管线自带 runtime 与画法脚本，入口只调本目录画帧器，不依赖外部仓库。
---

# minjian：民间故事绘本（Folk-tale Storybook）

| 项 | 值 |
| --- | --- |
| 工位 | 01 纸本叙事 |
| 渲染 | 本管线 `runtime/`（自研画帧器 + Canvas 2D 逐帧） |
| 画法 | `runtime/scene.js`（自研，按民间故事绘本的媒介原理重写） |
| 画幅 | 16:9 · 24 fps |
| 入口 | `scripts/minjian.py` |

## 这条管线交什么

水粉压在铅笔稿上，前景不透明，越往远越薄，最后只剩没盖住的那几根线。

这是一条**自包含的单风格渲染线**：运行时、舞台、画法脚本、入口全在 `pipelines/minjian/runtime/` 里，仓库外不留任何依赖。交付的是风格段 / 风格短片，默认不配旁白。

## 入口命令

```bash
# 抽两帧看画（没装 playwright 时用 uv 带一次）
python pipelines/minjian/scripts/minjian.py --stills 0.5,2.5 --out review/minjian

# 出 7 秒风格段
python pipelines/minjian/scripts/minjian.py --out out/minjian_试片.mp4 --seconds 7
```

## 写法要点

- **先读 `references/style.md`**：那份卡写的是这套民间故事绘本的笔触、色光、空间和母题动法；`runtime/scene.js` 是它的实现。
- **画面是代码画的**：`runtime/scene.js` 不加载外部图片、不引用外部库；换题材要重新构图。
- **时间轴按秒算**：`--seconds` 出风格段长度；镜头内动作仍按这套画法的工序走。
- **换题材时保留工序**：铅笔先、远景色次、中景再、前景最后压；笔序就是画师的手序。。

## 自研边界

- 自研：`runtime/render.py`（静态服务、逐帧抓取、ffmpeg 管道）、`runtime/stage.html`、`runtime/player.js`、`runtime/lib/util.js`、`runtime/scene.js`、`scripts/minjian.py`、参数与验收。
- 只参考：上游 anidoodle（Apache-2.0）对这套媒介的描述与工序，见 [CREDITS.md](CREDITS.md)、[MIGRATION.md](MIGRATION.md)；未复制其源码或素材。
- 运行时不读 `vendor/`、不读上游仓库、不调外部渲染脚本。

## 附：一页民间绘本短片（横屏竖屏都出，2026-11-20 定版）

这条附录是竖屏实测出来的，和上面自带的 16:9 runtime 并行存在：工程照旧放在 `pipelines/minjian/projects/<工程>/`，走仓库统一 `vendor/runtime/render-legacy.mjs` 契约（`window.READY/DUR/render(t)`，`scene.js` 必须同时 export `init` 和 `paint`），不吃自带 `scripts/minjian.py`。

```powershell
Set-Location 'D:\@kaifa\Auto-Video'
$env:PLAYWRIGHT_CORE='D:\@kaifa\Auto-Video\piying\node_modules\playwright-core'
$env:PLAYWRIGHT_CHROME=(Get-ChildItem "$env:LOCALAPPDATA\ms-playwright\chromium-1223" -Recurse -Filter 'chrome.exe' | Select-Object -First 1).FullName

# 竖屏 1080x1920
node vendor\runtime\render-legacy.mjs pipelines\minjian\projects\<工程> --width 1080 --height 1920 --fps 30 --out out\video-9x16.mp4
# 横屏 1920x1080（同一份 scene.js，坐标全用 W/H 比例，不要写死像素）
node vendor\runtime\render-legacy.mjs pipelines\minjian\projects\<工程> --width 1920 --height 1080 --fps 30 --out out\video-16x9.mp4
# 抽帧核对
node vendor\runtime\render-legacy.mjs pipelines\minjian\projects\<工程> --width 1080 --height 1920 --fps 30 --still 1.0,3.2,8.4
```

### 一页绘本六条（代码画，硬规矩）

1. **不画人手、不画人形**。先用代码画过全身双人戏和手指特写，结果都是纸板在滑：肩肘腕的转折、指节的方向、掌缘与袖口的交界，靠多边形拼不出来，一眼假。绘本里本来就有整页只画物件的做法——改画「一张纸条落到门板上、两条胶带压住、一支铅笔圈住其中一行」，动作立刻可信。
2. **物件要按工序上色**：铅笔线先（`pencil()` 每 0.1 s 换一次抖动、叠两遍），中景水粉其次，前景最后压到 0.95 以上；越远越薄，远景只剩线和一层水色。禁忌照旧：不做数字渐变、不把远景画厚、不把铅笔线全盖掉。
3. **纸不是平铺的矩形**。四角要有暗边（右下厚一点）、右上折一个三角（浅木色）并配一根折痕线、右下角随 `t` 掀起来一小块（`flap = .55 + .45*sin(t*2.1)`，两片三角形一明一暗），纸才有重量。
4. **胶带半透明**：`#e6d7b5` 走 `.74–.90` 透明度，上面再压一条 `#f4e9cd` 亮边，落下来时从上方 0.045H 处掉落、0.34 s 贴死，别做弹跳。
5. **铅笔是道具，不是装饰**：削出的浅木锥 `#e3c69b` → 杆 `#a9713a` → 暗边 `#7d4f25` 走 0.42 → 铅芯 `#3c3a35` 半径 0.0042W。笔尖必须跟着圈的当前笔尖点走（用 `p2w()` 把纸的局部坐标换成世界坐标），否则笔和线对不上。
6. **纸上的字用短划示意**，不写真实文字：每行 5–10 段长短不一的横，字色 `#6b6152` 走 0.28–0.36 透明度，重点行加粗到 0.50 并在下面压一道 0.16 的下划线；圈只圈重点那一行，半径 `0.222PW × 0.046H`，开口留 0.55 rad。

### 竖屏取景（1080×1920）

- 门板：`dL=0.112W / dR=0.888W / dT=0.030H / dB=0.862H`，木纹只留 3 道竖线（`al 0.11`），不画横档，否则像柜门格子。
- 纸条：`PW=0.556W / PH=0.462H`，落点中心 `(0.462W, 0.452H)`，落定旋转 `-0.022 rad`，从 `(0.396W, 0.120H)`、`-0.118 rad` 处落下来。
- 地面：`GY=0.900H`，下面再压一条 `0.972H` 的深土带。
- 纸的投影只偏移 `0.012W / 0.016H`，多了就像纸悬在半空。

### 10 s 节拍表

| 时间 | 动作 |
| --- | --- |
| 0.0–2.4 | 纸条带旋转下落（`ss(seg(t,0,2.4))` + `eio`），下落途中叠加一次摆动衰减 |
| 2.4–2.9 | 贴住、回弹 4px（`sin(press*π)*0.004H`） |
| 2.9–3.24 / 3.44–3.78 | 左、右两条胶带先后落下贴死 |
| 5.9 | 铅笔进画（提前 0.6 s 出现，别让笔凭空冒出来） |
| 6.6–8.9 | 圈住重点行，铅笔跟随笔尖 |
| 8.9–10.0 | 停住，纸角继续微颤 |

### 踩过的坑

- `node --check` 对含 `import` 的 ESM 恒返回 0，语法真错只能靠渲染输出的 pageerror 抓；改完必须抽帧看。
- PowerShell `Set-Content` 后再跑 `Write` 会报 "file has been modified since read"，改完就地重读。
- 手指那版给过的教训：`limb()`（圆柱带 + 暗侧 + 亮侧 + 圆头）画手臂、画手指都成立，但一旦两指并列、掌缘与袖口拼接，就会穿帮成"两根香肠 + 一块胶带"。这条路直接放弃，不要再试。
