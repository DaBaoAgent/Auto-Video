# 张骞寻路 · 全片 · map 实例

025《张骞寻路》全片的 map 管线工程：32 自然段 / 132 句 / 542.99 s 旁白，44 张 SVG 贴纸，1280×720 / 30 fps。

- 配音与成片未随仓库提交（`audio/`、`out/` 由 `.gitignore` 排除）。
- 复现：把 `配音.wav` 与 `口播稿_定稿.txt` 放进来，运行
  `python ../../scripts/map.py vo . --src 配音.wav --text 口播稿_定稿.txt --fixed para_bounds.json`
  再 `check → stills → render → deliver`。
- 文案与分镜：`brief.md`、`storyboard.md`；贴纸规范：`../../references/asset-spec.md`。
