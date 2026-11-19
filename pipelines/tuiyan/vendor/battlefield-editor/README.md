# Battlefield Editor — AI 战场编辑器

> A data-driven, single-file 3D engine for cinematic historical battles.
> **每一场战役都是一份资料 package,引擎只负责加载与演出。** AI 编写资料、人负责验收与微调。

换一份 package,就换一场战役 —— 不必动引擎程式。本 repo 的引擎、资料契约(schema)、验证工具与
AI 编辑 SOP 是一套;`packages/` 里的赤壁、官渡、垓下、淝水、水淹七军、水淹下邳是它「消费」的六份范例。

## 线上展示

线上(GitHub Pages):

- **首页战役列表**:https://yazelin.github.io/battlefield-editor/ (gallery,列出所有战役)
- 赤壁之战:https://yazelin.github.io/battlefield-editor/play.html?pkg=packages/chibi/battlefield.json
- 官渡之战:https://yazelin.github.io/battlefield-editor/play.html?pkg=packages/guandu/battlefield.json
- 垓下之战:https://yazelin.github.io/battlefield-editor/play.html?pkg=packages/gaixia/battlefield.json
- 淝水之战:https://yazelin.github.io/battlefield-editor/play.html?pkg=packages/feishui/battlefield.json
- 水淹七军:https://yazelin.github.io/battlefield-editor/play.html?pkg=packages/fanchengflood/battlefield.json
- 水淹下邳:https://yazelin.github.io/battlefield-editor/play.html?pkg=packages/xiapi/battlefield.json

## 它是什么

一个零建置(zero-build)、单档 Three.js(r160,CDN importmap)的战场演出引擎:

- **参数化类比地形**:河道(Catmull 控制点)、丘陵、区块、色带 → 连续平滑高度场。
- **资料驱动的一切**:阵营、地形、结构(城/营/隘/标记)、单位(陆军/水师)、场景(多幕时间轴 +
  运镜 + 特效 + 事件)、音频(配乐/旁白/字幕/音效 cue)全部写在 package 的 JSON 里。
- **宣告式特效/音效词汇**:`volley`(箭雨)、`ignite`(燃烧)、`shake`(震动)、`campFire`(营火)、
  `flood`(水攻:水面动画上升/退去,船只随水浮;可加 `region` 椭圆**只淹该区、其他水不涨**,再配 `from` 决堤口让**水锋从缺口推进、漫过城**(溃堤流入感),省略=全域整面涨)… 由引擎的 dispatcher 执行;package 只宣告「何时、对谁」。
- **多阵营**:面板、图例、旗帜、单位标签配色全由 `factions.json` 动态生成,不限阵营数。
- **可替换模型(glTF)**:单位 / 结构可指 `model:"assets/models/x.glb"` 用自订 glTF 盖掉内建造型(单位保留阵营色 + 队形;没指就用内建,完全向后相容)。`tools/make-test-glb.mjs` 产测试素材。

设计准则:引擎只懂「怎么演」,不懂「演哪场」。任何战役知识都活在 package 资料里。

## Repo 结构

```
index.html              首页战役列表 gallery(GitHub Pages 首页;读 packages/index.json 列出各战役)
play.html               引擎(单档;`?pkg=` 加载指定战场;GitHub Pages)
packages/index.json     gallery 用的战场清单(scaffold 会自动登录新包)
schema/                 各层资料的 JSON Schema(契约)
tools/
  validate-data.mjs     零依赖验证器(跨档交叉引用检查)
  terrain-fit.mjs       地形数值拟合工具
docs/authoring/         AI 编辑 SOP(每层一份:怎么改、栏位意义、可贴范例、验收)
packages/
  chibi/                赤壁之战(水战:9 幕 + 旁白语音 + 音乐 + 音效)
  guandu/               官渡之战(陆战:8 幕 + 旁白 + 音效 + 音乐,含渡口)
  gaixia/               垓下之战(包围/追击/末路:8 幕 + 旁白/配乐/音效,四面楚歌・霸王别姬・乌江自刎;以 authoring skill 从 scaffold 编成)
  feishui/              淝水之战(383 风声鹤唳:8 幕 + 旁白/配乐/音效;由零-context agent 照 SKILL 自动编成的验证样本)
  fanchengflood/        水淹七军(219 水攻:7 幕 + 旁白/配乐;flood 动画水位+楼船乘洪、庞德射额决战→水淹七军→徐晃解围盛极而衰)
  xiapi/                水淹下邳(198 水攻:6 幕 + 旁白/配乐;曹操引沂泗灌城、刘备前驱、吕布白门楼殒命;地形对照三国志11大地图——泗水西来主河+沂水北支于城西南汇流,城在东岸非孤岛)
tools/new-package.mjs   scaffold:长出最小绿灯骨架包(含 narration/generate.py 旁白范本)
tools/residue-scan.mjs  残留扫描 gate(抓 chibi 复制残留 + 未改 placeholder WARN)
tools/render-check.mjs  渲染 gate(headless 逐幕截图 + 0 console error)
tools/audio-check.mjs   音频 gate(旁白音长≤幕长 + 音频素材解析;空音频放行)
tools/music-library.json  CC0 音乐库目录(全海选池 74 首;mood/fit/出处/preview)
tools/sfx-library.json    CC0 音效库目录(22 个;同结构)
tools/assign-music.mjs  从音乐库依「幕→曲」指派配乐(local→海选 stash→preview 下载;亦接受 `ostNN` 直接引用包内 `music.ost` 池的影视原声)
tools/reburn-bgm.mjs    免重渲换 BGM:只重建音轨、画面 `-c:v copy` 复用,输出另存新片(见 docs/FILM-WORKFLOW.md)
tools/assign-sfx.mjs    从音效库指派音效到 package
tools/make-test-glb.mjs 产最小合法 .glb(可替换模型 glTF 管线的测试素材)
tools/trailer/           零成本宣传片管线(录自动播映→edge-tts 旁白→Gemini 验音→ffmpeg 合成 16:9/9:16/4:5;见该目录 README)
skills/author-battlefield/SKILL.md   AI 编写战场的可执行流程
```

每个 package 自足:`battlefield.json`(manifest)指向同目录的六层资料,素材放在自己的 `assets/`
(路径相对 manifest 目录解析)。

## 快速开始

```bash
# 本机预览(需在 repo 根目录起一个静态伺服器,因为用到 fetch + ES module)
python3 -m http.server 8080
# 开 http://localhost:8080/                                        → 战役列表(gallery)
# 开 http://localhost:8080/play.html?pkg=packages/guandu/battlefield.json → 直接看官渡

# 验证资料包(任意 package 用 --pkg)
node tools/validate-data.mjs                                    # 默认验 chibi
node tools/validate-data.mjs --pkg packages/guandu/battlefield.json
```

## 编一场新战役(AI authoring loop)

完整的 AI 编写流程在 **[`skills/author-battlefield/SKILL.md`](skills/author-battlefield/SKILL.md)**
(AI 照着走);人类速览:

1. **Scaffold**:`node tools/new-package.mjs <slug> "显示名"` → 长出最小、已绿的骨架包。
2. **依序编**六层(`factions → terrain → structures → units → scene → audio`),对照 `docs/authoring/`。
3. **过机器四关**(绿了才往下;都在 repo 根):
   ```
   node tools/validate-data.mjs --pkg packages/<slug>/battlefield.json   # schema + 跨档引用 + 镜头/cue shape
   node tools/residue-scan.mjs  --pkg packages/<slug>/battlefield.json   # 无 chibi 残留 + placeholder WARN
   node tools/render-check.mjs   --pkg packages/<slug>/battlefield.json   # 加载 + 逐幕截图 + 0 console error
   node tools/audio-check.mjs    --pkg packages/<slug>/battlefield.json   # 旁白音长≤幕长 + 音频素材解析
   ```
4. **旁白/音频**(选):`narration/generate.py`(edge-tts)生语音 + 字幕;音效用 synth、音乐默认用 CC0(成片配乐可按断代题材改用该战役 `music.ost` 池的影视原声,见 `docs/FILM-WORKFLOW.md`)。
5. **交人验收**:开 `play.html?pkg=…` 看/听 —— **空间、运镜时序、感官品质、史实由人判**。

> 机器三关保证「结构合法 + 引用完整 + 加载不炸」;但**画面/声音/编排的「对不对、好不好」是人的工作**。
> 这条界线就是这个编辑器的核心:AI 编资料过机器关,人验机器验不了的。

## 编辑器(本机编辑模式)

公开 Pages 是唯读观看版;要**编辑**一场战役,在本机起 dev server:

```bash
node tools/editor-server.mjs          # http://localhost:8090(首页=战役列表)
# 开 http://localhost:8090/play.html?pkg=packages/<slug>/battlefield.json 进该战场编辑
```

只有经 editor-server 开(localhost)才出现编辑面板;纯展示 / Pages 不显示、也不探测。
进编辑模式会直接**俯视整张战场**(自由运镜:拖曳转视角、滚轮缩放),用面板 **◀ ▶ 选要编哪一幕**
(不跟着播放跑)。编辑面板可:
- **旁白**:就地改每幕旁白 → 「更新此幕语音」跑 edge-tts 并**自动对齐幕长**(双声变长变短都调)、维护**破音字 SUBS**。
- **背景音乐**:每幕下拉从音乐库挑(74 首)。
- **座标 / 拖曳 / 模型**:选物件(单位 / 有 id 结构)→ Shift+点地图 或 填 x/z;或**直接在地图上拖**城/营/单位;同处可填 **glTF 模型路径 + 缩放**(即时换造型,空=内建)→ 存回 units/structures。
- **行军路径**:军队路径(🟢出生点+途经点)在地图上拖各点、Shift+点加途经点,行军箭头同步 → 存回 scene。
- **地形・高斯凹凸**:挖盆地 / 隆丘(滑杆改深浅/范围、点图设中心),搭水位预览看洪水淹到哪 → 存回 terrain。
- **河道走向**:河流 centerline 节点在地图上**拖蓝点改流向**、加/删末点、河宽河深滑杆,放开即重挖地形 → 存回 terrain。
- **本幕洪水**:设每幕水**涨到多高 / 第几秒起 / 涨几秒 / 范围 / 决堤口**(`type:flood` + 可选 `region` 椭圆只淹该区、+ `from` 决堤口让水锋从缺口推进;中心/决堤口都可点图设),拖「涨到」即时用水位预览看 → 存回 scene。
- **阵营 / 单位属性**:旗色・面板/图例名;单位数量・密度・队形・说明就地改 → 存回 factions/units。
- **资讯文字**:本幕 title/era/叙述就地改 → 即时反映画面 → 存回 scene。
- 一键**跑验收**(validate + audio-check)。

所有编辑写回 package 资料档、仍过四道机器关。地图上同幕多张事件卡会**自动错开**避免叠住。
(设计见 [`docs/editor-mode-design.md`](docs/editor-mode-design.md))。

## 资料六层

| 层 | 档 | 内容 |
|---|---|---|
| 阵营 | `factions.json` | 名称/旗/色(col/dark/light)/面板名/图例名;阵营 id 任意 |
| 地形 | `terrain.json` | world 尺寸、河道、丘陵、区块、色带 → 参数化高度场 |
| 结构 | `structures.json` | city/camp/pass/marker;camp 可带 `fire` 火源;marker 可 `followRiver` |
| 单位 | `units.json` | army/fleet、阵营、兵力、初始 `start`、`gait`、`chainable`、`info` |
| 场景 | `scene.json` | 多幕:标题/年号/环境/运镜 shots/set 布署/march/fx/events/strat/combat/finale |
| 音频 | `audio.json` | 配乐、旁白(voices/pathPattern/cues/voiceLabels)、音效 cue |

## 由来

先前分享的 3D 赤壁之战得到一些回响,也有人想看、想做别的战役。与其每一场都从头重做,干脆把那个写死的
demo 一步步抽成「换一份资料就换一场战役」的通用编辑器,让大家能方便地做、调自己想重现的战役 —— 这就是本 repo。

从 [`red-cliffs-3d`](https://github.com/yazelin/red-cliffs-3d) 抽出。原本是一个写死的赤壁之战 3D demo,
经 P1→P2h 逐步把「战役」从「引擎」剥离成资料 package(过程记在 red-cliffs-3d 的 `docs/superpowers/`)。
red-cliffs-3d 仍是线上的赤壁展示;本 repo 是通用引擎的正式家。进度与下一步见 [ROADMAP.md](ROADMAP.md)。

## 授权

MIT © 林亚泽 (Yaze Lin)。引擎、契约、工具、SOP 皆 MIT。范例 package 的历史战役内容同 MIT。
