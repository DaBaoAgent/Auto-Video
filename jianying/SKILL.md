---
name: jianying
description: 用「绢本/纸本美术 + 卡片运动语法 + 从句级字幕对齐 + 关键镜音效」做历史题材短片（Remotion 渲染，2-4 秒一镜）。当用户要做历史叙事短片、人物独白、悬案考据类视频，或说"做一支历史短片""按刘秀/朱棣那支的风格再来一集""用这个管线出片"时使用。管线只认 film.json + 口播稿两个输入，一条命令跑完 配音→对齐→分镜→音轨→字幕→渲染→质检。
---

# jianying：纸本历史短片管线

从赤壁三十秒样片沉淀，经《刘秀·位面之子》（194 条字幕 / 211s）与
《朱元璋·碽妃疑案》（53 镜 / 144.9s）两轮实战定版的管线。

不是模板填空，是**美术系统 + 运动语法 + 数据契约 + 门禁**四件套：换个选题，
改口播稿和 `film.json`，其余照跑。

## 三种用法

| 用法 | 场景 | 入口 |
|---|---|---|
| **A. 新选题全流程** | 有稿子/有主题，要一支新片 | `jianying_shotcraft.py new` → 改两个文件 → `jianying_shotcraft.py all` |
| **B. 复用镜头语法** | 只要某几个镜头，或要在别的工程里用某个动效 | 读 `cards/` 对应卡，复制 `template/src/shots/` 的实现 |
| **C. 只换风格** | 片子已跑通，想试别的纸料/夜色 | 改 `film.json` 的 `theme`，或 `--props` 临时覆盖，出静帧对比 |

先判断：用户给的是一段文字/一个选题（走 A），还是点名某个镜头/风格（走 B/C）。
**不要问"要不要用模板"**——这里没有模板填空路线，只有上面三条。

## 核心理念

1. **画面分五层，层次不能乱。** 纸底（`Paper`）→ AI 静帧底图（`BgContext`，活在
   Paper 内部）→ 卡片正文 → 纸面装饰（`Ornament`）→ 字幕与老电影层。底图若叠在
   卡片之上，会把卡片的白色纸页一起用 multiply 压掉，整张蒙灰。
2. **一行 = 一镜 = 一句。** 口播稿按句分行，逐行请求 TTS 拿到每行精确 start/end。
   段落级配音拿不到行级时码——**这时不许猜，先跑 `align` 从音频里测边界**。
3. **镜界只能落在静音窗。** 镜界取静音窗中点；每镜止于下一镜起点，句间静音并入
   前一镜。按句累加会丢掉静音，53 镜能差出 96 帧（3.2 秒），全片越走越错。
4. **风格从纸与墨长出来，不套皮。** 色板七槽全部走 CSS 变量，换主题时镜头一行不改。
   历史语境里**锁朱砂**（`accentLock`），朱砂是画面唯一高饱和色锚点。
5. **AI 底图只做静帧，不做视频。** 底图提供材质与人，代码提供相机与影调。
   人物一律背影或侧影，脸不出现——这是剪影路线的底线，也是 AI 最不容易崩的地方。
6. **确定性渲染。** 禁 `Date.now()` / `Math.random()`，一切伪随机用 `lib/anim.ts` 的
   `prng(seed)`，同一帧永远渲染出同一像素。
7. **音效少而准，不是铺满。** 只挂关键镜（每镜 2 点上限），点数少则单点重。
   宁可留白给 BGM，也不要每镜堆音。
8. **零频闪是硬预算。** 全片帧间亮度差 P99 < 1 灰阶、> 3 灰阶的跳变必须为 0。
   任何逐帧变化的层（亮度抖动、粒子重抽、纸纹位移、衬底开关）都是违规。
9. **画面先静帧验证，再整片渲染。** 静帧 4 秒 / 整片 4368 帧约 7.5 分钟；
   改一个镜头先 `still --frame=<镜中>` 看，别直接重渲。

## 快速开始

```bash
cd <仓库根>

# 1. 建选题（生成 口播稿.txt + film.json）
python scripts/jianying_shotcraft.py new myfilm --title "标题" --theme paper

# 2. 改两个文件
#    projects/myfilm/口播稿.txt     一行一镜，句末标点
#    projects/myfilm/film.json      镜序 + rules（美术/节奏/字幕/音频参数）

# 3. 工程就位（复制模板 + 装依赖 + 字体）
python scripts/jianying_shotcraft.py init --project myfilm
cd projects/myfilm/work && npm install && cd -

# 4. 全链
python scripts/jianying_shotcraft.py all --project myfilm

# 5. 看现状（哪一步有产物、缺什么）
python scripts/jianying_shotcraft.py probe --project myfilm
```

分步跑（改稿后不必重跑配音，配音与分镜都有缓存）：

```bash
python scripts/jianying_shotcraft.py tts    --project myfilm   # 逐行配音
python scripts/jianying_shotcraft.py align  --project myfilm --src 出稿/xxx
                                                              # 段落级配音 → 从句级时码
python scripts/realign_voice.py --voice 出稿/xxx/配音-新.wav \
       --narration narration/narration.json --out <工程>      # 整段重录后重新对齐
python scripts/jianying_shotcraft.py shots  --project myfilm   # 镜界夹进静音窗
python scripts/jianying_shotcraft.py audio  --project myfilm   # 28 音色 + 关键镜 + BGM
python scripts/jianying_shotcraft.py srt    --project myfilm
python scripts/jianying_shotcraft.py render --project myfilm
python scripts/jianying_shotcraft.py mux    --project myfilm
python scripts/jianying_shotcraft.py qa     --project myfilm
```

`sfx` + `mix` 是旧音轨方案（只程序化音效床、无 BGM 闪避），与 `audio` 二选一；
`film.json` 里有 `audio` 段时 `all` 自动走 `audio`。

**前置条件**：GPT-SoVITS `api_v2.py` 常驻 `127.0.0.1:9880`；Python 有 numpy
（`D:/@kaifa/hermes/.venv` 里现成，本机 pip 走不通，音频合成不依赖 scipy/soundfile）；
ffmpeg 在 PATH；Remotion 用 Edge 当渲染浏览器。

## 阶段

| 阶段 | 产出 | 判据 |
|---|---|---|
| `tts` | `narration/narration.json`（每行 start/end） | 每行字/秒 ≤ 6.4，超了判截断并重配 |
| `align` | 从句级 `narration.json` + `data/captions.json` | 语音段数 == 从句数时一一对应 |
| `realign` | `narration.json` + `captions.json`（新时码） | 沿用旧从句文本；语速异常句 < 5%；镜数不变 |
| `shots` | `data/shots.json` | 每镜 2-4s，镜界落在静音窗，绝对时码铺满；按 `shot-groups.json` 锁定分组 |
| 画面 | `work/src/shots/*` + 静帧 | 静帧先过，再整片 |
| `audio` | `audio/final-audio.wav` | −16.3 LUFS / −1.5 dBTP |
| `render` | `work/out/full.mp4` | 帧数 × fps = 时长 |
| `mux` | `out/<标题>.mp4` | 与音轨逐帧对齐 |
| `qa` | 五项门禁 | 全 PASS |
| 交付 | 成片 + 字幕 | 抽帧回看无重叠/跳变/频闪 |

细节与失败处理见 `references/pipeline.md`。

## 定版参数（E3 锁死，新片照抄）

完整快照在 `projects/zhuyuanzhang/film.json` 的 `rules` 段。核心几条：

| 项 | 值 | 为什么 |
|---|---|---|
| 画幅 | 1920×1080 / 30fps | B 站与 YouTube 标准，字幕空间充足 |
| 单镜 | 2.0–4.0s，均 2.73s | 低于 2s 读不到画面，高于 4s 中段会滑 |
| 运镜 | 底图横移 22–38px + 推拉 1.04→1.11 | 幅度压在察觉不到的量级，但切镜能看出镜头在动 |
| 字幕 | 句级全量、≤14 字、60 号、底距 112 | 悬案题材人名年号太多，没字幕抓不住 |
| 字幕淡入 | 0→5 帧（0.17s） | 原 3→14 帧的 0.37s 延迟本身就是「慢半拍」 |
| 字幕衬底 | 常驻（`CaptionVeil`，400px，0.74/0.34） | 画进 Caption 内部会让字幕空隙时底部跳 30 灰阶 |
| 老电影 | 划痕 3 / 灰尘 22 / 暖调 / 暗角 0.40 | 全部常驻缓慢漂移，禁逐帧重抽 |
| 音效 | 40 条 / 19 关键镜 / 10 音色 | 每镜 2 点上限；点数少则单点重 |
| 印章 / 撞击 / 转场 | −9 / −12.5 / −15.5 dB | 砸印 RMS −10.5 vs 空档 −17.0，差 6.5dB |
| BGM | 底值 −8.5dB，人声时再压 4.4dB | 说话时在人声下约 17dB |
| 响度 | −16.3 LUFS / −1.5 dBTP | 平台统一 |

## 画面五层

```
Layer 5  字幕 Caption / CaptionVeil / OldFilm
Layer 4  纸面装饰 Ornament（版框 + 边栏影字 + 纪年 + 角章 + 墨点）
Layer 3  卡片正文 bookcard / sealcard / numcard / signcard
Layer 2  AI 静帧底图 BgProvider（必须活在 Paper 内部，本镜独立运镜）
Layer 1  纸底 Paper（底色渐变 + 静止纸纹 + 暗角）
```

**卡片四张，全内容驱动，跨项目可复用**：`bookcard`（卷轴引文）、`sealcard`（竖排
名卡 + 朱砂印）、`numcard`（巨字 + 小注）、`signcard`（落款）。`S01–S12` 是赤壁那集
的手写场景卡，文案有硬编码，**不要跨项目复用**。

## 已知坑（都付过代价）

| 坑 | 现象 | 正确做法 |
|---|---|---|
| 按句累加切镜 | 全片短 3.2 秒，越到后面偏得越多 | 绝对时码铺排，每镜止于下一镜起点 |
| 段落级配音猜时码 | 字幕整体错位、慢半拍 | 先 `align` 从音频测边界，别猜 |
| 纸纹逐帧位移 | 360px 平铺接缝横切画面，整帧跳 8 灰阶 | 纸纤维静止，`backgroundPosition: '0px 0px'` |
| 字幕衬底画在 Caption 里 | 字幕间空 1–3 帧就掉 30 灰阶 | 抽成 `CaptionVeil` 常驻层 |
| 逐帧亮度抖动 / 片门闪白 | 10Hz 频闪，手机上看更明显 | 删。老电影只留暖调、暗角、常驻划痕与灰尘 |
| AI 底图直接 multiply 叠卡片 | 纸面压脏，卡片白页被吃掉 | 先 `curves` 把纸白归一，再把底图放进 `Paper` 内部 |
| 底图 prompt 不写死风格 | 跑成摄影质感，与绢本体系冲突 | 必写 `NOT a photograph, NOT a 3D render` |
| 生成图右下角水印 | 「AI生成 WORKBUDDY.」 | `delogo=x=1358:y=918:w=170:h=100` |
| 3:2 图裁成 16:9 | 切掉头冠 | 缩到 1620×1080 + 左右各镜像 150px 补边 |
| 音效每镜三个点 | 211 条，听感密集 | 关键镜 2 点，40 条；删掉周期性的 riser 与 whisper |
| 卡片里写死文案 | `GridCard` 里出现上一集的台词 | 跨项目只用四张内容驱动的通用卡 |
| 重配后镜界漂移 | 按 2.0s 攒镜会让 18/53 镜的台词错位一句 | 把每镜的从句数存成 `data/shot-groups.json`，重配后按它分组 |
| 重配音量差 10dB | 人声 RMS 从 −21.4 掉到 −31.4，BGM 相对变响 | ① 人声归一到峰值 −1.5 ② BGM 电平改为「人声 RMS + 12.9dB」动态算 |
| 邮件正文用反引号 | bash 做命令替换，正文被吃掉一段 | 用 here-doc 写文件再传 |
| 右边栏纪年压在右对齐大字上 | `year`/`place` 在 x=1796，是给居中的巨字卡设计的 | 大字靠右的卡（如 S01Year）关掉 `year`/`place`，或把边栏降为 1 列 |

## 何时读哪个文件

| 时机 | 读 |
|---|---|
| 要动手做一支新片 | `references/pipeline.md`（阶段的输入输出与判据） |
| 挑镜头 / 写 film.json 的 shots | `references/shot-grammar.md` + `cards/` 对应卡 |
| 选风格 / 调纸底与墨 | `references/themes.md`（13 套 + accentLock + solid 槽） |
| 配音与音效参数 | `references/sound-design.md` |
| 验收 / 判 FAIL 原因 | `references/aesthetic-rules.md`（门禁数值与已知坑） |
| 看一支完整实例 | `projects/zhuyuanzhang/`（E3 定版参数 + 19 张底图 + 40 条音效） |
| 看「无底图、纯纸本」实例 | `projects/liuxiu/`（168 镜 / 211s / 194 条字幕） |

## 资产

- `template/` —— 可渲染 Remotion 工程（`npm install` 后可跑）。`src/look.tsx` 是
  视觉系统（主题 + solid + 印章 + `Caption` + `CaptionVeil`），`src/BgContext.tsx`
  是底图与运镜，`src/Ornament.tsx` 是纸面装饰（配置驱动），`src/OldFilm.tsx` 是
  老电影层（参数驱动），`src/shots/` 是卡片实现。
- `cards/` —— 镜头卡：运动语法、参数、**已知坑**、参考实现路径、content 槽。
- `scripts/` —— 阶段脚本 + `jianying_shotcraft.py` 编排。脚本只认 `film.json`；
  `align_captions.py` 与 `make_audio.py` 可独立命令行调用。
- `projects/zhuyuanzhang/` —— **E3 定版实例**：`film.json` 的 `rules` 是参数快照，
  `work/data/audio-plan.json` 是关键镜表，`work/public/bg/` 是 19 张底图。
- `projects/liuxiu/` —— 纯纸本实例（无 AI 底图、无老电影层，靠 168 镜密度撑）。

**改镜头实现时：** 卡上「已知坑」列的参数是调过的真相，可以改，但不能降档
（例如镜界的 0.06s 安全边距、字幕的 14 字上限、频闪预算、音效每镜 2 点上限）。
凭感觉重写等于把调参积累丢掉。
