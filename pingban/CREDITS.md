# pingban —— 来源与许可

## 代码

| 组件 | 来源 | 许可 |
|---|---|---|
| `projects/038_guanyu_sketch/index.html`（2D canvas 手写引擎 + 六格场景） | 本项目（原 films/guanyu-sketch） | 与本项目一致 |
| `scripts/render.mjs` / `scripts/pingban.py` | 本项目新写 | 与本项目一致 |

引擎无第三方运行时依赖：无 three.js、无 simplex-noise、无 opentype。
所有线条、色块、文字、雨、水、笔尖光斑都是 canvas 2D 逐笔画出来的。

## 字体

| 字体 | 用途 | 许可 |
|---|---|---|
| Caveat Bold / Medium | 英文手写（标签、副行、英文幕） | SIL OFL 1.1 |
| Long Cang（龙藏体） | 中文标题与手写标注 | SIL OFL 1.1 |
| Noto Serif SC 500 / 700 | 中文字幕 | SIL OFL 1.1 |

全部按片内实际用字做了子集化，单个文件 7–100 KB。

## 声音

示例工程只提交字幕切点 `voice/cues.json`；配音为作者本人录制（`038_关羽襄樊之战` 第 4 段），不入库、不转载。

## 与 029 骨架方案的关系

lemo-opuscar 早期的「029 骨架字形」把每个字拆成笔画骨架、逐笔动画（依赖 `glyphs.json`）。
本管线**弃用**那条路：字形表外的字画不出来，字幕一改就缺笔。
现方案用 canvas `fillText` + 逐字裁剪扫出，出笔节奏仍由 `TXT()` 返回的 `t0+d` 时间戳驱动——
任何字体子集覆盖得到的字都能"写"出来。
