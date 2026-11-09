# manga · 日漫 · 漫画分镜管线

一帧就是一张白纸黑墨的漫画页：分格与装订线、网点、速度线/集中线、汗滴与青筋、手写拟声词（ドン / ゴゴゴ / 轰 / 咚），一格一个 beat，镜头按从右到左的阅读顺序读下去。

首个实例：`template/`（044《阿努纳奇》第一段，30.4 s / 1920×1080 / 30 fps）。完整流程与已知坑见 [SKILL.md](SKILL.md)，风格规范见 [references/style.md](references/style.md)，定版参数见 [pipeline.json](pipeline.json)，来源与同步见 [MIGRATION.md](MIGRATION.md)。

## 快速开始

```bash
# 1. 建工程（复制 template + 运行时到 lib/）
python scripts/manga.py new projects/<名字> --title "片名"

# 2. 配音 + 口播稿 → 时间轴
python scripts/manga.py vo projects/<名字> --src 配音.wav --text 口播稿.txt

# 3. 改 brief.md / storyboard.md / index.html / score.js / sound.js

# 4. 自检与抽帧
python scripts/manga.py check  projects/<名字>
python scripts/manga.py stills projects/<名字> --times 2,8,15,25

# 5. 渲染（样片可 720p；BGM 可选）
python scripts/manga.py render projects/<名字> --scale 0.6667 --bgm "音乐.mp3"

# 6. 交付
python scripts/manga.py deliver projects/<名字>   --chugao 出稿/<编号>_<选题> --name "manga_片名_样片_1080p"
```

## 环境

- Node 18+、ffmpeg / ffprobe 在 PATH
- Chrome 或 Edge（Windows 下脚本自动找；否则设 `CHROME_PATH`）
- Python 3.9+（只用标准库）

## 目录

| 目录 | 内容 |
|---|---|
| `runtime/` | 浏览器运行时 + 渲染器（BB-Video MIT） |
| `scripts/` | 建工程、配音对齐、渲染、QA、交付 |
| `references/` | 风格规范、分镜模板、验收清单 |
| `template/` | 阿努纳奇样片完整工程（无音频与成片） |

## 风格要点

- **页是单位，格是 beat**：`R.page(a, b, { in: 'cut'|'slash'|'turn'|'ink' })` 定一页的时间；`pg.tiers(rows)` 切格；`pg.read([panels], [times])` 按阅读顺序读；`pg.punch(t, panel)` 在关键词上 punch-in。
- **先让读者看见整页**：每页第一拍用 `'page'` 视图，再推近；不要一上来就特写。
- **黑白 + 一个 spot 色**：纸 `#fff`、墨 `#141414`、网点 0.15–0.45 覆盖；spot 只给一个东西（样片给红色剪刀/红叉），`spot:false` 可关。
- **拟声词是画，不是字幕**：`P.sfx('ドン'|'轰'|'咚', { style:'impact'|'rumble'|'pop' })`，字要压住动作；对白/旁白才用 `P.balloon('talk'|'shout'|'think'|'narr', text)`。
- **角色用原创 cast**：`R.cast({ ... })` 定比例/发型/眼睛/服装；`P.char(name, { shot:'full'|'bust'|'face'|'eyes'|'chibi'|'silhouette', pose, face })`；两个人说话要 `faceTo` 互相看。
- **信息装置**：`P.intro` 入场名牌、`P.label` 手写标注、`P.chart` 手绘图表、`P.manpu` 漫画符号（汗/青筋/闪光/蒸汽/zzz/…）。
- **转场只用一种大动作**：一页最多一次 punch-in、一次 shake、一次 splash；冲击用 `R.flash({ kind:'white'|'black'|'invert'|'spot' })` 2–4 帧。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。
