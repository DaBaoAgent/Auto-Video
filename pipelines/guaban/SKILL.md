---
name: guaban
description: 用「刮版画长镜头」做graphic短片，一刀一色，形状先定，再用排线造明暗，浅线压在深块上。
---

# guaban：刮版画长镜头

一刀一色：形状先定，再用排线造明暗，浅线压在深块上。

## 一句话原则

1. **画面自己画。** 没有上游脚本可调，刻印族的绘制代码在 `vendor/runtime/stylekit.js`，
   这条管线的形状坐标、色板、节拍写在 `projects/demo/main.js` 的 `SPEC` 里，生成时按 id 播种定死。
2. **确定性。** 只用 seeded RNG；不用 `Math.random`、不用 `Date.now`，同一秒数永远同一帧。
3. **一帧一画。** `renderAt(t)` 从空白重画，不叠上一帧，抽帧和整片完全一致。
4. **只出画面。** 配音、字幕、配乐由外层工序接，管线本身不掺。

## 目录

```
guaban/
├── SKILL.md
├── pipeline.json         定版参数（画幅/风格族/节拍）
├── scripts/guaban.py      入口：--check / --plan / --stills / --render / --mp4
└── projects/demo/
    ├── index.html        画布壳（字体走 assets/fonts）
    ├── main.js           SPEC + 版式牌 + renderAt
    ├── frames/           抓下来的帧（不入库）
    └── out/              静帧与成片（不入库）
```

## 常用命令

```bash
python pipelines/guaban/scripts/guaban.py --check
python pipelines/guaban/scripts/guaban.py --stills 0.6,2.0,5.0
python pipelines/guaban/scripts/guaban.py --render
```

## 验收

- `--check` 全 OK 才动手；缺 puppeteer-core / 浏览器 / ffmpeg 会直接报出来，不假装成功。
- 静帧看三件事：形状对不对、色板是不是这一族的气质、字有没有压到主体。
- 出片后 `ffprobe` 核时长与画幅，与 `pipeline.json` 的 `meta` 对齐。

---

## 附：刮版画一页短片（横屏竖屏都出，2026-11-20 定版）

上面的 SPEC/stylekit 只出平面的抽象图形。要有故事、要出竖屏，照 `projects/ep24v4_fever/` 自建工程：一套 `scene.js` + `main.js`，同一个文件改 `--width/--height` 就出横屏或竖屏。

```powershell
Set-Location 'D:\@kaifa\Auto-Video'
$env:PLAYWRIGHT_CORE='D:\@kaifa\Auto-Video\piying\node_modules\playwright-core'
$env:PLAYWRIGHT_CHROME=(Get-ChildItem "$env:LOCALAPPDATA\ms-playwright\chromium-1223" -Recurse -Filter 'chrome.exe' | Select-Object -First 1).FullName
# 竖屏
node vendor\runtime\render-legacy.mjs pipelines\guaban\projects\<工程> --width 1080 --height 1920 --fps 30 --out out\video-9x16.mp4
# 横屏（同一份 scene.js，换两个数字）
node vendor\runtime\render-legacy.mjs pipelines\guaban\projects\<工程> --width 1920 --height 1080 --fps 30 --out out\video-16x9.mp4
# 核静帧
node vendor\runtime\render-legacy.mjs pipelines\guaban\projects\<工程> --width 1080 --height 1920 --fps 30 --still 1.5,6.2
```

### 黑板的六条

1. **先铺浅再盖黑。** `BOARD=#e7d9bb` 打底，再整幅覆 `INK=#090807`。所有"亮"都是刀刮出来的，暗部就是没刮的地方——不要用亮色去画，要用亮色去**刮**。
2. **亮只留一处。** 竖屏里最忌平均，画面只给一个光源（门洞、灯、窗口），其余全是黑的。第 0 帧这一处就得亮着，不能从黑起。
3. **形状先定，排线后上。** 先用 `path()` 定块面轮廓，再用 `hatch()` 裁进这个多边形里排线；`hatch` 的 `ang` 是排线**法向**（≈0 竖线、≈1.57 横线），`gap` 给 12 以上才不像绘图纸，两层一组（疏 12/密 64）叠着上才像砂面。
4. **人只给剪影。** 背光的人不画五官，靠外形和轮廓光说话：后脑—鼻尖—下巴这三个转折必须在，缺一个就成圆球。`figure()` 里侧脸用点表 `prof` 从**下巴**起笔排一圈，别从头顶起（从头顶起会画成锯齿）。
5. **影子是第二个演员。** `c.transform(1,0,sh,1,0,0)` 以脚点为轴剪切出长投影，`sh` 给 `-W/H` 比例的三四成才够长；`sh` 随时间小幅摆动（`.80 + sin(t*1.15)*.13`），影子一晃，静止的人也活了。**影子必须裁到墙**（`c.rect(...dx0)` 先 clip），否则会盖在亮门洞上，像画了两个人。
6. **发热、呼吸、光都要有相位。** 热气用 `sin(j*0.62 + t*3 + i)` 的折线，光晕 `+ sin(t*3.1)*.012` 地微颤；整幅再压一层 `grain` 纸纹和暗角（`rgba(0,0,0,.66)`）。

### 竖屏取景（1080×1920）

- 光源放右中：`dx0=.545W, dx1=.885W, dy0=.235H, dy1=.845H`，地面光扇从 `dy1` 往画面外散。
- 人站光源左侧、脚跟踩 `H*.845`，身高 `s≈1.6`（头顶约 `H*.44`）；人小一点没关系，**影子占住左边半幅**才是构图。
- 别把整个暗室都刮亮：墙排线 `al≈.20`、第二层 `.06`，让黑占七成。

### 节拍（10 s 一条）

`0–3 s` 光起＋热气上浮（`heat` 由 0 到 1）｜`3–5.6 s` 站定抖头、影子轻晃｜`5.6–9.4 s` 迈步往光源挪（`walk` 走完光晕再涨一档）｜`9.4–10 s` 停住，人进光，影子缩短收束。
