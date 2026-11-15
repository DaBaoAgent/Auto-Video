# shouhui —— 逐帧手绘短片管线

把 `Vincentwei1021/mg-styles-15`（MIT）的 **05-cel-boil / 逐帧手绘·线条沸腾** 封装成本项目可用的一条链：
口播稿 + 成品配音进，纸本手绘成片出（24fps / 1920×1080 / −14 LUFS）。

## 结构

```
vendor/mg-styles-15/          上游完整克隆（1.2GB：15 支原片 + 全部源码 + harness）
shouhui/
├── SKILL.md                  管线入口：原则、命令、坑、验收口径
├── scripts/shouhui.py        编排 CLI
├── scripts/render.mjs        逐帧渲染器（改造自 harness/render.mjs）
├── scripts/sfx_build.py      音效 cue 合成（纯标准库）
├── node_modules → vendor/mg-styles-15/node_modules   目录联接
└── projects/<slug>/          每条片子一个工程（film.json + js/scene.js + audio/）
```

## 环境

| 依赖 | 说明 |
|---|---|
| Node ≥ 18 | 实测 v22.22.2；渲染器走 puppeteer-core |
| Edge | 无头浏览器，默认 `C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe` |
| ffmpeg / ffprobe | 抽帧、混音、质检 |
| Python ≥ 3.10 | 编排与音效合成；**不需要 numpy** |
| 上游克隆 | `git clone --depth 1 https://gh-proxy.com/https://github.com/Vincentwei1021/mg-styles-15.git vendor/mg-styles-15` |

装依赖（只装本管线用到的四个包）：

```bash
cd vendor/mg-styles-15
npm install --no-audit --no-fund puppeteer-core@25.12.0 simplex-noise@4.0.3 opentype.js@2.0.0
cd ../..
# Windows：让 node 能在 shouhui/ 下解析依赖（无需管理员）
powershell -c "New-Item -ItemType Junction -Path 'shouhui/node_modules' -Target 'vendor/mg-styles-15/node_modules'"
```

## 跑一条

```bash
python shouhui/scripts/shouhui.py probe  012_shangzhouwang
python shouhui/scripts/shouhui.py audio  012_shangzhouwang
python shouhui/scripts/shouhui.py stills 012_shangzhouwang --times 1,3,5,7,9
python shouhui/scripts/shouhui.py render 012_shangzhouwang
python shouhui/scripts/shouhui.py qa     012_shangzhouwang
```

## 与上游的差异（改造点）

| 上游 | 本管线 |
|---|---|
| `ROOT` = 仓库根，工程必须放仓库内 | 站点根（`MG_SITE`）与依赖根（`MG_VENDOR`）分离，工程放 AutoJY 里 |
| 默认 Chrome 路径为 macOS | Windows 默认 Edge；`MG_GPU_ARGS` 可覆盖 GPU 参数 |
| 音频由 `demos/<slug>/audio.py` 合成音乐 + 音效 | 真人配音 + `sfx_build.py` 只合音效点 + 本地 BGM 库，统一 −14 LUFS |
| 字体从 `assets/fonts/` 读（未随仓库分发） | 每片自带字体（Long Cang 主字 / LXGW 印章字，均 OFL） |

## 许可

- 引擎 `js/engine.js`、`engine` 原语、`05-cel-boil` 的风格与实现思路：**mg-styles-15，MIT**（保留出处）。
- 字体：Long Cang（OFL）、LXGW Marker Gothic（OFL）。
- 素材：`paper_base.jpg` / `paper_tooth.png` / `dust_ink_*.png` 来自上游 demo，随 MIT 一并使用。
- 本管线脚本：与本项目一致。
