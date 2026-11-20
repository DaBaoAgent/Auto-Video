---
name: jianzhi
description: 用「红色窗花剪纸」做craft短片，背光镂空，纸色分层叠上，孔洞透出背光，金线勾边。
---

# jianzhi：红色窗花剪纸

背光镂空：纸色分层叠上，孔洞透出背光，金线勾边。

## 一句话原则

1. **画面自己画。** 没有上游脚本可调，纸艺族的绘制代码在 `vendor/runtime/stylekit.js`，
   这条管线的形状坐标、色板、节拍写在 `projects/demo/main.js` 的 `SPEC` 里，生成时按 id 播种定死。
2. **确定性。** 只用 seeded RNG；不用 `Math.random`、不用 `Date.now`，同一秒数永远同一帧。
3. **一帧一画。** `renderAt(t)` 从空白重画，不叠上一帧，抽帧和整片完全一致。
4. **只出画面。** 配音、字幕、配乐由外层工序接，管线本身不掺。

## 目录

```
jianzhi/
├── SKILL.md
├── pipeline.json         定版参数（画幅/风格族/节拍）
├── scripts/jianzhi.py      入口：--check / --plan / --stills / --render / --mp4
└── projects/demo/
    ├── index.html        画布壳（字体走 assets/fonts）
    ├── main.js           SPEC + 版式牌 + renderAt
    ├── frames/           抓下来的帧（不入库）
    └── out/              静帧与成片（不入库）
```

## 常用命令

```bash
python pipelines/jianzhi/scripts/jianzhi.py --check
python pipelines/jianzhi/scripts/jianzhi.py --stills 0.6,2.0,5.0
python pipelines/jianzhi/scripts/jianzhi.py --render
```

## 验收

- `--check` 全 OK 才动手；缺 puppeteer-core / 浏览器 / ffmpeg 会直接报出来，不假装成功。
- 静帧看三件事：形状对不对、色板是不是这一族的气质、字有没有压到主体。
- 出片后 `ffprobe` 核时长与画幅，与 `pipeline.json` 的 `meta` 对齐。

---

## 附：剪纸一页短片（横屏竖屏都出，2026-11-20 定版）

上面的 SPEC/stylekit 只出平面纹样。要有叙事、要出竖屏，照 `projects/ep24v4_tincut/` 自建工程：`scene.js` + `main.js`，同一个文件换 `--width/--height` 就出横屏或竖屏。

```powershell
Set-Location 'D:\@kaifa\Auto-Video'
$env:PLAYWRIGHT_CORE='D:\@kaifa\Auto-Video\piying\node_modules\playwright-core'
$env:PLAYWRIGHT_CHROME=(Get-ChildItem "$env:LOCALAPPDATA\ms-playwright\chromium-1223" -Recurse -Filter 'chrome.exe' | Select-Object -First 1).FullName
node vendor\runtime\render-legacy.mjs pipelines\jianzhi\projects\<工程> --width 1080 --height 1920 --fps 30 --out out\video-9x16.mp4
node vendor\runtime\render-legacy.mjs pipelines\jianzhi\projects\<工程> --width 1920 --height 1080 --fps 30 --out out\video-16x9.mp4
node vendor\runtime\render-legacy.mjs pipelines\jianzhi\projects\<工程> --width 1080 --height 1920 --fps 30 --still 1.6,8.0
```

### 红纸六条

1. **亮的是洞，红的是纸。** 背光先铺满（`#ffe6bb` 的径向灯），再把红纸整张盖上去，只有挖穿的孔才透出亮色。孔用不透明浅色画（`rgba(255,232,192,.86)`），半透明红只会糊成一片脏红——这是第一版失败的原因。
2. **一张纸只有一处主体。** 上方一朵剪出来的团花（8 瓣折扇式）、中腰一道刃口，其余留红。竖屏最忌铺满，宁可空。
3. **剪口要有手劲。** 所有多边形都用 `fillR/line` 走 seeded 抖动（2–3 px），线头圆、交点钝；直边一律不做，直边就成 AI 矢量图。
4. **配色只有五支。** `BACK #180a06 / LIGHT #ffe6bb / DEEP #6b120f / MID #a81c15 / HOT #cf3a22`，金线 `#efc079` 勾边。深红压亮带、亮带压红纸，三层就够。
5. **亮带当刀。** 刃口用 `lighter` 合成一条 40–46 K 宽的渐变亮带（中间 `.58 + sin(t*2.2)*.14` 微颤），割的时刻再叠一条纯白 10 K 带，`1 - |t-割点|/.40` 做衰减。这样刃口自己是演员，不用画动作。
6. **血挂在刃口上。** 每滴 = 一条由上到下的窄梯形（6.5–9 K 宽，底端略收）+ 一个 `dropShape` 圆头（高光偏左）。滴与滴间距 `0.088W`，一滴一秒，攒成一排——「每周一刀」用数量说，不用字。

### 竖屏取景（1080×1920）

- 刃口斜线 `eye(x) = .400H + (x/W)*.115H`，从左上落到右边，一人高的位置横过画面。
- 团花圆心 `(.50W,.205H)`，半径 `.215W`（8 瓣），花瓣是挖穿的亮色三角扇。
- 下幅是铁皮暗面：`eye` 以下整片 `DEEP`，铺 14 条斜刮痕（`rgba(255,190,130,.10)`）、一层菱格透光孔（`rgba(255,226,180,.20)`）、四组卷草。
- 底边 7.2% 收一条红纸边 + 20 个锯齿 + 两朵角花，压住画面别散。

### 节拍（10 s 一条）

`0–1 s` 静场：团花、刃口、第一滴将落｜`1–7.7 s` 七滴依次挂上（1.05/2.15/3.20/4.30/5.40/6.55/7.70）｜`8.2–9.8 s` 刃口底下一线血慢慢攒满｜`9.8–10 s` 停住。
