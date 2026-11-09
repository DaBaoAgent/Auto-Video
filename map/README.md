# map · 地图动画管线

真实地理数据 + 漫画贴纸的地图解说：地球到街道一条连续镜头，路线沿线绘制，人物贴纸锚定经纬度，标注卡钉在事件发生地。输出 1920×1080 / 30 fps / −16 LUFS。

首个实例：[`projects/zhangqian/`](projects/zhangqian/)（025《张骞寻路》全片，544 s）。完整流程与已知坑见 [SKILL.md](SKILL.md)。

## 快速开始

```bash
# 1. 建工程（复制模板与运行时）
python scripts/map.py new projects/<名字> --title "片名"

# 2. 配音 + 口播稿 → 时间轴
python scripts/map.py vo projects/<名字> --src 配音.wav --text 口播稿.txt

# 3. 写 brief.md / storyboard.md / assets/models/*.svg / main.js

# 4. 自检与抽帧
python scripts/map.py check  projects/<名字>
python scripts/map.py stills projects/<名字> --times 3,7.5,16.5

# 5. 渲染与交付
python scripts/map.py render  projects/<名字>
python scripts/map.py deliver projects/<名字> --chugao 出稿/<编号>_<选题> --name "12_map_片名_全片_720p"
```

## 环境

- Node 18+、ffmpeg 在 PATH
- Chrome / Chromium（Windows 上脚本自动找；否则设 `CHROME_PATH`）
- Python 3（只用标准库）

## 目录

| 目录 | 内容 |
|---|---|
| `runtime/` | 浏览器运行时 `core.js` / `promo.js` / `map.js` / `stickers.js` + 渲染器 |
| `scripts/` | `map.py` 编排、`make_vo.py` 时间轴、`deliver.py` 交付 |
| `references/` | 贴纸规范、分镜写法、验收清单 |
| `template/` | 8 秒可运行模板（示例时间轴 + 2 张贴纸） |
| `projects/zhangqian/` | 张骞全片实例（无音频与成片） |

## 风格要点

- **地图是论证**：路线画在它经过的地方，数字钉在它发生的地方，镜头飞向正在说的地名。
- **贴纸是画出来的**：400×400 纯 SVG、平涂分面、统一描边；人物用 `lift` 站在路线「上方」。
- **一条连续镜头**：不硬切；长距离用 van Wijk 飞行（缩小—平移—放大）。
- **示意要说清楚**：所有推测路线标「方向示意，非实测路线」。

## 许可

运行时代码来自 [BB-Video](https://github.com/BubbleBrainBB/BB-Video)（MIT），见 `runtime/LICENSE.BB-Video` 与 [CREDITS.md](CREDITS.md)。底图 Natural Earth（public domain）。
