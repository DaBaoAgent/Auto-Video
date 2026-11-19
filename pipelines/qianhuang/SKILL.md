---
name: qianhuang
description: 千黄 · 铅黄浓彩（Giallo Gouache）管线：一页手绘浓彩，被红、蓝两盏硬特色片灯夹住；硬切分镜 2–4 秒一镜，刀落/转场/落字各有自己的合成音效。用于 70 年代意大利铅黄（giallo）电影解说、恐怖片/悬疑片拆解、以及任何要「血红＋钴蓝＋污染金」的浓彩叙事短片。当用户说「铅黄」「千黄」「giallo 风」「血红海那张」「狠一点的浓彩」时用。
---

# qianhuang · 千黄（铅黄浓彩）

一条片子 = **一页用浓彩画满的手绘**，但这一页被两台色片灯照着：一台钴蓝从左边切进来，一台深红从右边切进来，
两盏灯都不讲道理——没有光源、硬边、彼此交叉，把整页的颜料**染成**它们的颜色，而不是罩一层柔光。

主角在暗里，光只咬住轮廓；血红与钴蓝是两极，中间只允许一点**被污染的黄**（酸绿也算），其余全部沉进墨黑。

示例工程：`projects/001_bayofblood/`（《血之海滩》Blood and Black Beach 第一段，21.46 s，1920×1080 / 30 fps / −14.6 LUFS）。

## 一句话记住

1. **色是灯打上去的，不是画上去的。** 硬边光束走 `multiply` 把物体**染成**红/蓝/绿，只在光芯补一点 `screen` 提亮；暗部一律 `#0b0b0d`，不许糊成灰。
2. **两盏灯交叉，且没有理由。** 一镜至少两束，角度互相切；荷兰角跟着光束一起歪。
3. **主体必须在光里立住。** 光束画在离屏上，先把主体那一圈擦掉（`destination-out`），圈要跟着镜头推近与旋转搬。
4. **物件自己也得是铅黄的。** 白墙不许白（暖金＋紫红阴影），森林不许绿（压进墨黑，亮绿只留棱线上几簇），人不许穿灰（朱红上衣＋钴蓝）。
5. **一镜 2–4 秒，硬切到底。** 不做叠化、不在一张画里游走讲故事；切点就是音效点。
6. **字是黄字黑边。** 片名 268 px 马善政、字幕 58 px 龙藏，先描黑边再填黄——边比字重要。
7. **每一下动作都有声音。** 音效不是配乐：刀、转场、落字、脚步，全部按帧对齐。
8. **人物 12 fps 抖，页面不抖。** 线抖每 1/12 s 换一次；纸是纸，镜头每帧都在动。

## 入口

在仓库根执行，单一入口 `qianhuang/scripts/qianhuang.py`：

```bash
python qianhuang/scripts/qianhuang.py probe  001_bayofblood              # 看工程现状
python qianhuang/scripts/qianhuang.py stills 001_bayofblood --times 5.2,14.6,17.9
python qianhuang/scripts/qianhuang.py sfx    001_bayofblood              # 重跑音效床
python qianhuang/scripts/qianhuang.py render 001_bayofblood              # 无声母版 out/video.mp4
python qianhuang/scripts/qianhuang.py mux    001_bayofblood              # 配音+音效 → out/bayofblood.mp4
python qianhuang/scripts/qianhuang.py srt    001_bayofblood              # 从 subs.json 导出 SRT
python qianhuang/scripts/qianhuang.py qa     001_bayofblood              # 六项质检
python qianhuang/scripts/qianhuang.py pack   001_bayofblood --dest ../交付 --name "片名"
python qianhuang/scripts/qianhuang.py new    002_xxx                     # 从 001 复制一份新工程
```

参数：

| 子命令 | 参数 | 说明 |
|---|---|---|
| `stills` | `--times 5.2,14.6` | 逗号分隔的秒；输出 `out/stills/t_<秒>.jpg` |
| `render` | `--fps 30` `--start` `--end` `--out` | 默认按 `film.js` 的 `DUR` 出全片 |
| `sfx` | `--out` | 跑工程内 `voice/make_sfx.py`（纯 Python 合成，无采样素材） |
| `mux` | `--video` `--voice` `--sfx` `--out` | 配音压缩到 −14.6 LUFS → 音效按 0.82 权重叠上 → 量电平再顶到 −14.6 |
| `srt` | `--out` | 读 `subs.json`，`utf-8-sig` 便于播放器识别 |
| `pack` | `--src` `--dest` `--name` | CRF 20 / preset slow，交付目录里连 `.srt` 一起放 |

渲染交给共享运行时 `vendor/runtime/render-legacy.mjs`；页面契约：`window.READY` / `window.DUR` / `window.render(t)`，
禁 `Date.now()`、禁 `Math.random()`。

**渲染前字体必须到位**（字体不进仓库）：

```bash
python tools/sync_fonts.py --fetch
python tools/sync_fonts.py --pipeline qianhuang
```

## 工程怎么改

`projects/<编号_名>/`：

| 文件 | 管什么 |
|---|---|
| `film.js` | 时间轴（`DUR`）、`SHOTS` 十镜表（`cam` / `mv` / `snap` / `beams` / `hero` / `blinds` / `crush`）、光层顺序、黄字、字幕 |
| `world.js` | 这一页的世界：两张色版 `A`（冷版）与 `B`（浓彩版）共用同一副几何，坐标在 5120×2880 纸面里 |
| `poses.js` | 人物姿势库（走/站/趴/扑），骨骼角度表 |
| `engine.js` | 笔与彩的引擎：`penStroke`/`drawPen`/`rasterPen`/`wash`/`reserve`/`dab`/`foliage`/`figure`/`drawPrims`/`handwrite`（含 outline） |
| `voice/make_sfx.py` | 音效床：刀锋、转场、落字、脚步、底噪，全部按时间点表合成 |
| `subs.json` | 字幕行（`t0`/`t1`/`text`），改完跑 `srt` |

## 画面语法（按顺序叠，顺序错了就塌）

`render(t)` 里这一串不能调换：

```
comp(cam) → clouds/halo/ripples/foam/glitter/stars → 人物与物件 → shadeSide → fogBands
→ gelBeams → contaminate → gelLayers → blinds → shadowVignette → crush
→ 前景视差 → foreground → 纸纹(multiply) → subtitle
```

- **两遍套色**：`A` 版冷（夜湖：钴蓝＋窗里一点橙），`B` 版浓（血海：血红＋污染金）。同一页两块色版，`trace` 让 `B` 从地平线漫开、`splitPlate` 让两枚印张并排——这是「它抄的那部原片」那一镜的做法。
- **色片灯 `gelBeams`**：`[ox, oy, ang, half, len, key, alpha]`，硬边梯形；离屏画完先 `multiply` 染色、再 `screen` 补光芯，最后擦掉主体圈。
- **红蓝百叶 `blinds`**：一条钴蓝一条深红，`multiply`(tint .4) → **`color`**(.62) → `screen`(.2)。`color` 这步不能省，否则红条打在钴蓝上相消成紫。
- **四角压黑 `crush`**：`#0b0b0d` + 内圈钴蓝→深红的 `screen`，让画面四周自己沉下去。
- **页当画框**：镜头在 5120×2880 的纸上走，页边留白、边缘碎开；拉远到整页就是结尾那张。

镜头词表（`SH.mv = [dx, dy, zk, dr]`，一镜内线性推进 + `SH.snap = [ts, power, dur]` 钉住不回）：
慢推 prowling / 横移跟人 / 推＋荷兰角 / snap zoom / 绕轴自转＋推（自转摄影机）/ 斜向穿越。
转场只有一种：**硬切**。不用叠化。

## 配色（铅黄三原色 + 一点被污染的黄）

| 名 | 值 | 用在哪 |
|---|---|---|
| 深红 | `#b3001b` | 血、暴力、迫近的危机；血海、血泊、屋顶 |
| 钴蓝 | `#1b2a8f` | 真正到来的死亡；夜、天顶、窗外的水 |
| 翠绿 | `#0f7a5c` | 还活着的那一刻；岬、灌丛 |
| 酸绿 | `#7cc41a` | 不自然的、被施了法的东西；受光的树冠 |
| 污染金 | `#ffc84e` / `#ffc400` | 只许窄窄一条：地平线、窗光、面具侧光、片名 |
| 虚空黑 | `#0b0b0d` | 所有暗部，永不用灰 |

物件级（不许只靠色光罩）：
- 墙 `#ffe8a8`（暖金）＋ 阴影侧 `#7a2a4e`（紫红）＋ 窗 `#ffc23a`；
- 山体 `#08402f`，从上往下压暗到 `#030a09`，亮绿只留棱线往下 260 px 内、避开树冠；
- 栈桥 `#8c2a1c`，船底 `#ffe8a8` 配血红条；
- 受害者 朱红上衣 `#d0202a` ＋ 钴蓝下装 `#1e2a80`；杰森 紫黑雨衣 `#150e22`，右红左蓝两道细边。

## 字

- **片名**：马善政 268 px，`#ffc70a`，黑边`#0c0908` 5.5%，逐字按笔顺写出（`handwrite` 的 `outline` 分支先 `strokeText` 再 `fillText`，共用同一个擦入矩形）。
- **字幕**：龙藏 58 px，x=158 / y=962，黑晕 rgba(8,6,5,.75) blur 10 → 黑边 4.6 px → 黄 `#ffcb0e`；下划线 rgba(24,18,12,.55)。
- **装饰注记**：Caveat（`mario bava` / `35mm` / `grazie`）与 Reenie Beanie（年份），都是手写，淡、歪，落在页边。

## 音效（纯合成，无采样）

`voice/make_sfx.py` 用 `wave` + `struct` + `math` 手写合成，输出 48 kHz 双声道：

- **刀锋三层**：whoosh（一阶低通扫 0.93→0.06）＋ shing（2380/3260/4310/6180 Hz 四分音）＋ thud（66/132 Hz ＋ 噪声）；
- **转场**：每个切点一记 splice（噪声瞬态 ＋ 210 Hz ＋ 78 Hz 闷雷）；
- **落字**：tick（高通噪声＋正弦 blip）与 brush（低通噪声缓起缓落）；
- **片名/开场**：boom（48/96/151 Hz 叠低频）；
- **脚步**：sandstep（0.35 低通噪声＋42 衰率包络）；
- **底噪**：47.5 Hz ＋ 95 Hz 极低正弦，把碎声黏住。

摆设原则：**动作提前 0.30 s 起 whoosh，落点 +0.02 s 响 shing、+0.01 s 落 thud**；切点与分镜边界同一帧；19 条字幕各一记极轻 tick（压到 −31 dB）。

## 全片工程（002）与两类资产

`projects/002_bayofblood_full/` 是这管线的定版长片：《血之海滩》全片 **219.47 s / 6584 帧 / 30 fps / 74 镜 / 121 条字幕**，
片头 0–21.46 s 走 001 那套手绘页，21.48 s 之后进"卡片区"：一镜一张卡，卡里是立绘或插图。

### 立绘 `assets/cast/`（主角/女角/尸体）

- 一张一个透明 PNG，**1254×1881**（横卧尸体 1881×1254），必须 **rgba 真透明**（`ffmpeg -vf alphaextract,signalstats` 查 alpha YMIN=0/YMAX=255）；
- `cards.js` 里登记在 `CAST_SRC`，`preloadCast()` 先解码；
- 展示统一走 `castCard(ctx,t,key)`：钴蓝冷光、两根金柱、人物背后一片金光、暗地面、脚下椭圆投影、金边细框——**所有人物卡共用这一套底，才像一个家族的画**；
- 巴瓦那张肖像卡不走代码画，`KIT.portrait = (ctx,t) => castCard(ctx,t,'cast_bava')`。

### 插图 `assets/cards/`（道具与场景卡）

- 一张卡一整张 **1700×1060 满版**插图（生成给 1600×1000 即可，长边 1942×1214 落盘），落成**真 JPEG**（`ffmpeg -q:v 2`，别只改扩展名）；
- `CARD_SRC` 里 22 个 id → 路径，`preloadCards()` 与立绘一起 `Promise.all`，**必须在 `buildWorld()` 之前**；
- `cards()` 内 `drawImage(pic, -CW*.04, -CH*.04, CW*1.08, CH*1.08)`——**放大 8% 居中**，吃掉插图自带的旧纸白边，才和前一张满版的接得上；
- 缺图时 `onerror` 只 warn，回退老 `KIT` 代码卡，**一张缺图不该让整片起不来**。

卡片的画法（重画时沿用）：1970 年代铅黄纸上插图 / 纯平涂丝网印浓彩 / 无渐变 / 糙黑描边 / 限色（血红·钴蓝·金黄·墨绿·纯黑·米白）/ 旧纸颗粒 / **构图要满、要有前后层次与道具细节**；横构图 5:3，满版无边框、不放排版文字。

### 美女满屏（这管线的卖点）

- `shotWoman(t,SH,idx)`：未排过人的镜头，一律在**画面右边缘**（`x = 1792 - (idx%2)*54`、`y = 1040`、`h = 396+(idx%3)*44`）站一位女主，背后压一块 `rgba(70,10,22,.34)` 径向暗底 + 脚下椭圆影 + `saturate(1.18) sepia(.10)`；
- **为什么靠右**：左下与中下是字幕区（x≈158 起），贴左必压字幕；右边缘是字幕不会去的地方；
- 跳过条件：`t<2.30`、`SH.bava`、`SH.split`、立绘卡、以及已经单独排过人的那几段；
- 8 张女角按镜头序号轮换，相邻两镜不撞衣服；片头 `openingWoman()` 第 0 帧就有人（不留在白纸上）。

### 主角挥刀：人不动，只有刀动

`jasonCast()` 把整张 `cast_jason_arm.png`（同帽同面具同风衣，**右手举成空拳、手上没刀**）钉死，只留走路几像素 bob 与 0.35° 呼吸；
刀是代码画的：`KNIFE = { hx:.275, hy:.143, len:.62, wid:.062 }` 定位拳头（图内归一化），`ang = -1.02 + 1.62*chop`，白刃 + 黑描边 + 洋红/金两灯反光，劈下时补三道风弧。

## 已知坑

1. **纯 `screen` 色光会发灰。** 必须先 `multiply` 染色，`screen` 只补光芯。
2. **主体保护圈按死坐标量，镜头一推一旋主体就出了圈**，重新被光压暗。圈要按 `SH.cam` 反算回页面坐标、再按当前机位摆回去。
3. **红蓝百叶少 `color` 模式那一步，红蓝相消成紫。**
4. **镜头推太狠会把页上的装饰字裁掉半截。** 片名镜 `mv` 的 `zk` 超过 1.10、`dx` 给正，左上角 `BAY OF BLOOD` 与年份就出画。
5. **回拉（`zk < 1`）容易把页底推出边界露白。** 收尾镜用轻推，不要回拉。
6. **页面放大后字体没到位 → 手写字变系统默认**，整页气质立刻塌。
7. **字幕落在暖橙沙地上**对比最弱，黄字黑边要保证 4.6 px 以上。
8. **`qa` 的帧率是按 30 写死的**，改成 24 出片时先改 `FPS` 常量。
9. **`mux` 之后 aac 一定过冲。** 实测 −14.7 LUFS / **+0.9 dBFS**，不要指望 `mux` 一步到位；必须重编一次音轨：
   `-af "loudnorm=I=-14.4:TP=-2.4:LRA=11,alimiter=limit=-4.2dB:level=false" -c:v copy -c:a aac -b:a 192k`
   → 稳定落到 **−15.2～−15.3 LUFS / −3.9～−2.7 dBFS**，qa 六项才全绿。`alimiter=limit=-4.6dB` 不够（还 +0.6），`-7.0dB` 会把响度拉到 −16.3。
10. **位图卡片的 `drawImage` 必须在 `scale(.88)` 那道变换之内**，用 `(0,0,CW,CH)` 才是铺满内区；写到外层会顶到金框上。
11. **插图/立绘换新文件名交付**。同名文件被客户端缓存过，用户会说"交付物还是老的"——换名（如 `_插图重画版`）比解释省事。
12. **定稿要归档进 `out/<编号_片名>/`**，不要留在工程 `out/` 里。四件套：成片 + srt + 3:4 封面 + 4:3 封面 + 发布信息（只有标题 + 四个标签），细则见仓库 `docs/交付规范.md`。

## 验收

- [ ] `stills` 抽 5–8 帧：两盏灯交叉、暗部是黑不是灰、主体在光里立得住
- [ ] 每镜 2–4 秒，全是硬切，没有一镜游走
- [ ] 物件本身是铅黄的（墙不白、林不绿、人穿饱和色），不是只罩了一层光
- [ ] 片名与字幕是黄字黑边，描边完整、逐字写入
- [ ] 刀落/转场/落字都能听见对应音效，且咬在画面上
- [ ] `render` 帧数 = `DUR × 30`；`qa` 六项全绿；响度 −14.6 LUFS
- [ ] 全片：每一镜都有女主在右边缘、都不压字幕；片头第 0 帧就有人
- [ ] 卡片区没有一格是代码画的简笔画（立绘/插图都已落盘，`preloadCards` 零 warn）
- [ ] 杰森挥刀时身体不转、只有右手的刀在走
- [ ] `python tools/validate.py` 这条管线 0 error
