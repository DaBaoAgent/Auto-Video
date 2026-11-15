---
name: caiqian
description: 用「彩铅科普插画」做科学/生物科普短片：三维场景先渲成四张 G-buffer，再由后处理按锚定坐标一层层排线、上色、抖轮廓，纸齿与颜料阈值合成，出 1920×1080 / 24 fps / −14 LUFS 的彩铅质感成片。当用户说「彩铅科普」「手绘插画讲科学」「照鳕鱼那支彩铅来一支」「要有纸和铅笔的颗粒感」时使用。
---

# caiqian：彩铅科普插画管线

一支片子 = **一张正在被彩铅笔填满的插图纸**：先用 three.js 把场景建成真的三维体（鱼、海床剖面、鱼群），
再把它拆成四张 G-buffer，在后处理里按每个表面的"露出时间"一笔一笔排线上色。
镜头扫过的地方，画才出现；没说到的东西，纸上还是空的。

首个实例：`projects/029_jia_xueyu/`（029 · 假鳕鱼，27.1 s，1920×1080 / 24 fps）。

## 一句话原则

1. **几何先真，再谈笔触。** 鱼身、鳍、海床分层都是 extrude/曲线做的真三维，剖面才立得住；画不好是因为形状不对，不是笔不对。
2. **四张 G-buffer 决定四层笔。** albedo+id / light+depth+normal / 排线方向 / 锚点+露出时间——每层都在后处理里单独成图，再合成。
3. **锚定坐标，笔画才黏得住。** 排线与纸齿在**固定参考相机**的投影坐标里算，相机只在同一镜头内平移；否则笔触会随镜头"游动"。
4. **轮廓可以抖，排线不能漂。** 每 2 帧换一张画（3 张循环，24 fps → 12 次/秒），只抖轮廓；内部排线必须稳。
5. **东西按时间被"画出来"。** 每个表面一个 `arev`，四层笔触在它之后依次建立：剖面从上往下一层层出，鱼从轮廓到背深腹浅。
6. **一句一标签，从不同屏。** 标签是白底小卡 + 手描边，靠 `at()` 锚到投影点，跟句子同进同出。

## 目录

```
caiqian/
├── SKILL.md                    本文档
├── README.md                   环境、依赖、快速开始
├── MIGRATION.md                来源与改造点
├── CREDITS.md                  字体与代码许可
├── pipeline.json               定版参数（画幅/纸/铅笔层/色板/字体/相机/渲染/音频）
├── scripts/
│   ├── caiqian.py              编排 CLI：new / stills / render / mux / srt / qa / probe
│   └── render.mjs              逐帧渲染器（playwright-core + ffmpeg，三管线共用）
└── projects/
    └── 029_jia_xueyu/
        ├── index.html          壳：canvas + importmap（three → ./lib/three.module.js）
        ├── main.js             全部画面逻辑（1142 行：世界 / G-buffer / 后处理 / 标签 / 字幕 / 事件）
        ├── glyphs.json         手写字形骨架表（fetch 载入，缺了页面永远不 READY）
        ├── lib/three.module.js 随工程走的 three（不需要 npm）
        ├── fonts/LXGWWenKai-subset.ttf   霞鹜文楷子集（OFL）
        ├── tools/              make_font.py（子集）/ skeleton.py（字形骨架）/ subs.py（SRT）/ poster.py
        ├── FACTS.md            事实表：物种、年代、鳍、产卵量、体长
        ├── CREDITS             字体与技法出处
        └── out/                静帧与成片（不入库）
```

## 常用命令

```bash
# 静帧（秒，逗号分隔）—— 改一个节拍先看它，整片 650 帧要 1–2 分钟
python caiqian/scripts/caiqian.py stills 029 --times 2.0,6.0,13.0,20.5

# 无声母版
python caiqian/scripts/caiqian.py render 029

# 预母带 + 合流（voice/voice.wav 自备）
python caiqian/scripts/caiqian.py mux 029

# 字幕 SRT（从 main.js 的 SUBS 导出）
python caiqian/scripts/caiqian.py srt 029

# 质检
python caiqian/scripts/caiqian.py qa 029
```

## 工序

| 步 | 做什么 | 产出 |
|---|---|---|
| 1 事实 | 把口播稿里每个数字查实（年代、鳍数、产卵量、体长体重），写 `FACTS.md` | `FACTS.md` |
| 2 时间轴 | `TL` 用**逐句起音**写成：`strata: [0.25, 1.0]` 表示第 1 句 0.25 s 起、这句持续 1.0 s | `TL` |
| 3 世界 | three.js 建鱼 / 海床分层 / 鱼群 / 远坡，每个表面加 `mat({id, color, angle, outline, dens, rev})` | `main.js` |
| 4 笔层 | 四张 G-buffer + 后处理排线，按 `arev` 建层 | `main.js` |
| 5 标签 | `addTag({at, t0, t1, size})` 一句一个，`addLeader` 拉引线 | `main.js` |
| 6 字形 | `tools/make_font.py` 子集 → `tools/skeleton.py` 生成 `glyphs.json` | `fonts/` + `glyphs.json` |
| 7 核对 | `stills` 抽帧：不看"好不好看"，看**每句说的话有没有对应画面** | 静帧 |
| 8 出片 | `render` → `mux` → `srt` → `qa` | `out/<名>.mp4` |

## 画面语法

- **海床剖面**：五层沉积（lit / top / sub / wea / bed），每层一条 `ExtrudeGeometry`，`angle: 0.62 + id × 0.11` 让相邻层排线错开。
- **鱼**：侧视 extrude，头左尾右，身长 = 口播里说的"两米"；背鳍两三瓣、臀鳍分开、下颌在吻下（鳕鱼嘴的真实位置）。
- **鱼群**：同一条鱼复制成列，`school` 段像兵蚁一样推过去；`barren` 段留空白表示"寸草不生"。
- **水**：`kind: 4` 的平面，`dens: 0.62`，只上一层薄薄的蓝灰排线，不能盖住鱼。
- **标签**：白卡 + 手描边 + 英文大写 + 中文小字，`pop` 0.9→1.0 弹入，`t1−0.25` 起淡出。
- **字幕**：左下纸片，中文 40 px / 英文 29 px（0.72 alpha），`wipe` 从左揭开 0.28 s。
- **片长**：`FILM` 常量就是全片长度；`?from=&to=` 可出片段（渲染器用 `--from/--to` 转发）。

## 已知坑

1. **`glyphs.json` 少了，页面不报错但不 READY。** `main.js` 顶部 `await fetch('glyphs.json')`，404 会让整个 module 挂住 —— 渲染器等到 120 s 超时才失败。新建工程务必确认这个文件在。
2. **importmap 必须指向本地 `./lib/three.module.js`**。原 demo 写的是 `/node_modules/three/...`，离开库根就 404，页面全黑。
3. **不要给相机加旋转。** 一旦同镜内相机转向，锚定坐标与投影对不上，排线会从物体上滑走。
4. **SS=2 是必须的。** 关掉超采样，细排线会糊成灰面，像喷墨打印而不是彩铅。
5. **露出时间要跟句子走。** `REV` 里每层 0.3–0.5 s 的窗口，比句子早 0.1 s 就够；早了会出现"话没到、画已满"。
6. **`FILM` 与 `build.sh` 里的 `TO` 可能不一致**（demo 是 50.8 s，鳕鱼段是 27.1 s）。以 `main.js` 的 `FILM` 为准，`DUR` 是它派生的。
7. **字体子集漏字 = 字幕出豆腐块。** 改文案后必须重跑 `tools/make_font.py` 与 `tools/skeleton.py`。

## 验收

- [ ] `stills` 抽 8–12 帧：口播说的每件事都有画面，没有"话到了画还没到"
- [ ] 剖面、鱼、鱼群的排线方向不打架，纸齿能看出来
- [ ] 标签一句一个、不进画面两次、不出画
- [ ] 中英字幕与配音逐句对齐（`SUBS` 的 `t0/t1` 与 `TL` 同源）
- [ ] `qa` 通过：1920×1080 / 24 fps / 帧数 = 时长×24 / 有音轨 / −14 LUFS
- [ ] `fonts/` 与 `glyphs.json` 齐全（缺任一个换机器就跑不起来）
