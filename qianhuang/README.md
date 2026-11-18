# qianhuang · 铅黄浓彩（Giallo Gouache）

一页手绘浓彩，被红蓝两盏硬特色片灯夹住：血红与钴蓝是两极，污染金只许窄窄一条，暗部全部沉进墨黑。
一镜 2–4 秒硬切，刀落、转场、落字各有自己的合成音效。

示例工程 `projects/001_bayofblood/`：《血之海滩》Blood and Black Beach 第一段，21.46 s / 1920×1080 / 30 fps / −14.6 LUFS。

## 结构

```
qianhuang/
├── SKILL.md              入口命令、画面语法、配色、已知坑、验收清单
├── README.md             本文件
├── MIGRATION.md          从 gangbi 派生与本管线自己的定版参数
├── CREDITS.md            字体 / 引擎 / 技法许可
├── pipeline.json         契约（schema + meta + spec 定版参数）
├── scripts/
│   └── qianhuang.py      单一入口：probe / stills / sfx / render / mux / srt / qa / pack / new
└── projects/001_bayofblood/
    ├── index.html        canvas#c + 四个 @font-face（相对 fonts/）
    ├── main.js           按查询参数决定加载哪个模块（默认 film.js）
    ├── film.js           十镜表、色片灯、黄字黑边、字幕
    ├── world.js          整页 5120×2880 的两遍套色（A 冷版 / B 浓彩版）
    ├── poses.js          人物姿势库
    ├── engine.js         笔 / 彩 / 合成器 / 人物 / 手写（含 outline 描边）
    ├── subs.json         字幕行（SRT 从这里导出）
    ├── voice/make_sfx.py 音效床合成脚本（纯 Python，无采样素材）
    └── fonts/            渲染前由 tools/sync_fonts.py 落位（不进仓库）
```

## 环境

| 需要 | 版本 | 说明 |
|---|---|---|
| Node | 20+ | 跑共享渲染器 |
| ffmpeg / ffprobe | 5.1+（建议 7.x） | 编码、响度测量、质检 |
| Python | 3.11+ | 跑 `qianhuang.py`，只用标准库 |
| playwright-core | 任意近期版本 | 渲染器优先 `$PLAYWRIGHT_CORE`，其次工程向上找 `node_modules` |
| chromium-headless-shell | — | `node node_modules/playwright-core/cli.js install chromium-headless-shell` |
| MaShanZheng / LongCang / Caveat / Reenie Beanie | OFL 1.1 | 字体不进仓库，`python tools/sync_fonts.py --fetch` 现取 |

**不需要 npm install three**：纯 Canvas 2D，没有三维依赖。

## 一条片子怎么走

1. `python tools/sync_fonts.py --fetch && python tools/sync_fonts.py --pipeline qianhuang`
2. `python qianhuang/scripts/qianhuang.py new 002_xxx` 复制骨架
3. 改 `film.js` 的 `DUR` 与 `SHOTS`（一镜 2–4 秒）、`world.js` 的地点与调色板
4. 改 `voice/make_sfx.py` 顶部的 `CHOP / CUTS / CUE / WORDS / TITLE` 时间点表
5. `sfx` → `stills 5.2,14.6,17.9` 看构图 → `render` → `mux` → `qa`
6. `pack --dest <交付目录> --name <片名>`，`.mp4` + `.srt` 一起给

渲染前两个环境变量（本机）：

```powershell
$env:PLAYWRIGHT_CORE = 'D:\@kaifa\tuangou\node_modules\playwright-core'
$env:PLAYWRIGHT_CHROME = '<chromium-headless-shell.exe 的完整路径>'
```

## 样片

`qianhuang 血之海滩.mp4`（21.46 s）：19 条字幕、10 个硬切分镜、4 个落刀点、9 个切点音效。
样片站点用的压缩版在 `site/media/qianhuang.mp4`（1280 长边 / CRF 30）与同名封面 `qianhuang.jpg`。
