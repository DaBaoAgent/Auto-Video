---
name: qianhuang2
description: 铅黄剪影（Giallo Silhouette Stage）管线：不画颜料，只画全黑剪影、双缘光和一池压在地上的舞台光；角色回头靠发丝晚两帧、抬手别发与一道月白弧，最后三条 35mm 胶片带收拢成片名。用于铅黄/欧洲老片的代码动画解说、恐怖悬疑片拆解，以及任何要「墨黑剪影 + 红青缘光 + 光池舞台」的短片。用户说「剪影舞台」「铅黄剪影」「全黑人物站光里」「血之海滩那种画法」时用。
---

# qianhuang2 · 铅黄剪影（Giallo Silhouette Stage）

同一部片子、同一套铅黄用光，但画法从「浓彩手绘页」换成「剪影舞台」：
**人物全黑，只有轮廓被两盏灯咬出边；地上永远有一池光，标出他站在哪儿。**
镜头里没有一张 AI 图、没有一帧原片——全部是 `seek(t)` 纯函数在 Canvas 2D 上逐帧算出来的。

示例工程：`projects/001_bayofblood_stage/`（《血之海滩》第一段，21.462 s / 1920×1080 / 30 fps / −14.6 LUFS）。

## 一句话记住

1. **人不画脸，只画边。** 整副剪影偏移一层冷青、再偏移一层血红（`lighter`），本体最后用 `#05060A` 压上；缘光天然贴着姿势走，不许 `shadowBlur` 糊一圈光团。
2. **人必须站在光里。** 每个场景先铺 `lightPool`（椭圆径向渐变 + 更亮内芯），再 `ringEdge` 画出"台"，最后 `groundShadow` 压整体；脚上另有接触影，否则人像浮着。
3. **头压中线，脚压舞台线。** `STAGE_Y=872`、`HEAD_Y=540`：头顶落 540±40，`y≳870` 全空给字幕带。这一条比任何构图技巧都硬。
4. **回头是三个信号叠出来的。** 抬手别到颈后发际 + 肩宽收缩 0.80 + 头发晚两帧（0.066 s）；`headYaw` 小于 0.04 就完全读不出，只在 >0.04 时补一道 2.4 px 月白弧。
5. **裂口是烧穿的，不是贴纸。** 焦炭线 2–3.4 px 断续、内芯熔橙带 `shadowBlur`、亮度随 `sin(t*6.1)` 抖、贴边黑烟；连续一圈暗红描边立刻降级成贴纸。
6. **血光是扫过去的一道，不是一块。** 窄光柱 0.85 s 自左向右掠全屏，五档横向递减；宽度每次 `290 + hash()*330`，三束不许一样粗。
7. **一物一光源理由。** 火盆要有碗沿 1.6 px 暖反光，否则火苗像浮在空中的蜡烛；海湾她脚下要有礁石承重面，否则脚下灰影是个悬空圆盘。
8. **胶片带自己会滚。** 三条 35 mm：齿孔 34 px 节距、画格 286 px、步进 302 px、滚动 150 px/s；18.20 s 收拢到 486/612/738 并留三成残影，片名落在她头顶。

## 入口

在仓库根执行，单一入口 `qianhuang2/scripts/qianhuang2.py`：

```bash
python qianhuang2/scripts/qianhuang2.py probe  001_bayofblood_stage          # 看工程现状
python qianhuang2/scripts/qianhuang2.py stills 001_bayofblood_stage --times 3.0,7.6,20.4
python qianhuang2/scripts/qianhuang2.py render 001_bayofblood_stage          # 无声母版 out/video.mp4（已转 tv range）
python qianhuang2/scripts/qianhuang2.py mux    001_bayofblood_stage --voice <配音.mp4|wav>   # → out/<名>.mp4
python qianhuang2/scripts/qianhuang2.py qa     001_bayofblood_stage          # 七项质检
python qianhuang2/scripts/qianhuang2.py pack   001_bayofblood_stage --dest ../交付 --name "片名"
python qianhuang2/scripts/qianhuang2.py new    002_xxx                       # 从骨架复制一份工程
```

| 子命令 | 参数 | 说明 |
|---|---|---|
| `stills` | `--times 3.0,7.6` `--fps 30` | 输出 `out/stills/t_<秒>.jpg`，改参数先抽三帧看 |
| `render` | `--fps 30` `--from` `--to` `--out` | 先出 `raw.mp4`，再显式转 `bt709 / tv` 成 `video.mp4` |
| `mux` | `--video` `--voice` `--out` | 配音压到 −14.6 LUFS → 限峰 −1.8 dB → AAC 192k |
| `qa` | — | 分辨率 / 30fps / 帧数 / 时长 / 音轨 / 响度 / 峰值 / 色彩范围 |
| `pack` | `--src` `--dest` `--name` | CRF 18 / preset slow，交付目录里只放成片 |
| `new` | `slug` | 复制 `001_bayofblood_stage` 骨架（不含 out 与配音） |

渲染交给共享运行时 `vendor/runtime/render-legacy.mjs`；页面契约：`window.READY` / `window.DUR` / `window.render(t)`。
本机跑之前三件事：

```bash
export PLAYWRIGHT_CORE=<playwright-core 目录>     # 或装到工程逐级向上的 node_modules
export PLAYWRIGHT_CHROME=<chrome 可执行文件>       # 没装 headless shell 时必须指到真 Chrome
export PATH=<ffmpeg bin>:$PATH
```

## 工程怎么改

`projects/<编号_名>/` 五个文件，一层管一件事：

| 文件 | 管什么 |
|---|---|
| `film.js` | `DUR` 与 `SHOTS` 镜头表（`name / t0 / t1 / draw / card`）、`render(t)` 与页面契约 |
| `world.js` | 六个场景：面具 / 营地 / 裂口 / 海湾 / 片名 / 胶片收束；一地一物的坐标都在这里 |
| `cast.js` | `POSES` 姿势表与三种人形：`woman()`（她）/ `figure()`（男人）/ `lying()`（倒地者），以及 `STAGE_Y` / `HEAD_Y` |
| `engine.js` | 画布与色板、`lightPool / fireBowl / ringEdge / groundShadow`、`lg/soft/glow/fogBand`、颗粒/污渍/暗角与 `post(t)` |
| `index.html` | 装配，按 `engine → cast → world → film` 顺序引脚本 |

改片子的顺序：**配音先定时间码 → 改 `SHOTS` → 改 `world.js` 的场景 → 改 `cast.js` 的身高与姿势 → `stills` 抽三帧验收 → 全片。**

## 画面语法（顺序错了就塌）

```
底（场景天空/地面）→ lightPool / ringEdge / groundShadow → 人物（contact shadow → 双缘光 → 本黑身）→ 火盆与火星
→ 场景特效（裂口/扫光/胶片）→ 字与台标 → post(t)：multiply 压色 → 污渍 → 颗粒 → 划痕 → 暗角 → 曝光抖
```

- **缘光的做法**：`woman()` 里同一副 `womanBody()` 画三遍——先 `translate(-dx)` 用 `#0F6F63` alpha 0.30，再 `translate(dx*2.1)` 用 `#B3121F` alpha 0.24，都 `lighter`；最后 `#05060A` 画本体。男人用 0.26 / +8.5 与 0.17 / −8.5 的同款。
- **姿势插值**：`POSES.back` ↔ `POSES.glance` 用 `mixPose(a,b,m)`；三段延迟各自独立（营地 body 3.50 / head 3.76 / hip 3.64），海湾 body 11.05 / head 11.30。
- **发丝滞后**：`womanBody` 的摆发量读 `p.headYawLag`，上下游各算一条晚 0.066 s 的 `headYaw`；这是"头先转、头发后到"的全部秘密。
- **镜头**：本线不推纸，只在画布里改坐标；裂口内层起点 1.78 倍锚在她胸背（`zay=706`），1.55 s（`pz²`）退回 (960,540) 的 1.16。

## 时间轴（贴配音，改表等于改片子）

| 段 | 时间 | 画面 |
|---|---|---|
| `mask` | 0.00–1.89 | 面具特写，污化/霉斑/血痕全 `hash` 生成 |
| `camp` | 1.89–6.68 | 营地三人侧倒 2.35 / 3.55 / 4.45，每次一道血色扫光；她在右，一池光 |
| `rift` | 6.68–9.20 | 裂口两次跳动涨到六成，内层是海湾那卷胶片 |
| `bay` | 9.20–11.80 | 1971 海湾：落日核 58 px、帆船、红顶白屋 |
| `baycard` | 11.80–13.20 | 同一画面压台标「1971 · 意大利 / G I A L L O」 |
| `title` | 13.20–15.09 | 拱门 + 片名 116 px |
| `reel` | 15.09–21.462 | 三条胶片带 → 18.20 收拢 → 她 524 高做底影 + 片名 76 px |

## 配色（铅黄两极 + 一点暖）

| 名 | 值 | 用在哪 |
|---|---|---|
| 血红 | `#B3121F` | 腰带、扫光、裂口熔边、暗红细环 |
| 血红亮 | `#E3232C` | 收束红光晕、火星 |
| 冷青 | `#0F6F63` | 左侧缘光、水面的冷 |
| 琥珀 | `#D89B3C` / `#F2B24A` | 帐篷、火盆碗口、暖光池 |
| 洋红 | `#7A1E4B` | 面具内衬、暗部过渡（少量） |
| 骨白 | `#EFE3C8` | 字、月光（禁纯白） |
| 墨黑 | `#050406` / `#05060A` | 人物本体、暗部，永不用灰 |

血红面积 ≤8%、墨黑 ≥55%；颗粒 0.17、划痕 3 条、暗角 0.86、每 12 帧一次曝光抖。

## 已知坑

1. **`window.render = t => render(t)` 会无限递归。** `function render` 声明本身就是 `window.render`，箭头再包一层就自己调自己（表现为 `Maximum call stack` + 等 `READY` 超时）。必须 `window.render = render` 直接交函数引用。
2. **不转 range，暗场在播放器里发灰。** 逐帧 JPEG 是 full range，`libx264` 不写 range 标记；`render` 必须再走一遍 `scale=out_color_matrix=bt709:out_range=tv` 并把 `-color_range tv` 写进容器。
3. **火盆没有碗沿反光，火苗像浮在空中的蜡烛。** 碗体、碗口膛火 0.40、碗沿 1.6 px 暖反光三件齐了才读成"三脚火盆"。
4. **海湾她脚下没有承重面，灰影就是悬空圆盘。** 得补一块礁石多边形（顶面浅青高光），人才落得住。
5. **剪影里回头极难读。** 只转 `headYaw` 看起来只是"头变宽"；必须叠抬手别发、肩宽 0.80、发丝滞后、月白弧四个信号。
6. **裂口连续一圈描边就变贴纸。** 断续焦炭 + 熔橙内芯 + 黑烟才对；内芯亮度静止也会假，要 `sin(t*6.1)` 抖。
7. **横扫光峰值有平台会出硬边。** 横向必须五档递减（0/0.42/0.55/0.68/1），不能"中间一大段全同亮度"。
8. **人物 base 与地面线脱钩就会浮或陷。** 营地地面 856 起、脚底 872；海湾礁石顶 880；改动地面高度必须同时改 `woman()` 的 base，并重看接触影。
9. **胶片步进与画格/齿孔要对齐。** 步进 302 = 画格 286 + 间隙；齿孔 34 px 节距；三者乱一个，带子就"跳格"。
10. **收束残带的横线会切头。** 底影压到 524 高（头顶 504）、三条带收到 486/612/738 才不压脸。
11. **字体是系统字体。** 换到 Linux 渲染机没有 Microsoft YaHei / PingFang SC 会掉成默认无衬线，字的气质全塌；交付机上先装中文字体（本线不随仓库分发 ttf）。
12. **`qa` 要把 `raw.mp4` 排除在外**，否则会拿母版当交付物测（没有音轨、响度全红）。
13. **逐帧渲染约 10–11 fps**，644 帧 ≈ 61 s；改一个坐标别直接跑全片，先 `stills` 抽三帧。

## 验收

- [ ] `stills` 抽 3–5 帧：人物全黑、缘光左青右红、脚上有接触影、地面有一池光
- [ ] 每一段（她 / 男人 / 倒地者 / 群像）头顶都在 540±40，脚底都在 872（海湾 880）
- [ ] `y ≳ 870` 没有任何人物、道具、光池——字幕带是空的
- [ ] 回头能读出"转过去了"：抬手 + 肩宽收缩 + 头发晚两帧 + 月白弧
- [ ] 裂口边缘是断续焦炭不是整圈描边，内芯亮度会抖
- [ ] 三道扫光宽窄不同，峰值没有平台硬边
- [ ] 胶片带齿孔在滚、画格在过、收拢后残带不压她的脸
- [ ] `render` 帧数 = `DUR × 30`；`qa` 七项全绿（含色彩范围 tv）
- [ ] 成片没有一帧来自 AI 生图或原片截帧
- [ ] `python tools/validate.py` 这条管线 0 error
