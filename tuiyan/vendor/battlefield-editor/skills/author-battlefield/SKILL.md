---
name: author-battlefield
description: Use when authoring or editing a battlefield-editor data package — turning a historical battle into a data package (factions/terrain/structures/units/scene/audio) that the engine renders. Encodes the AI authoring loop: draft in dependency order, clear the machine gates (validate / residue / render), then hand the human only what a machine can't judge.
---

# 编写战场 package(AI authoring loop)

**核心契约**:每一场战役 = 一份资料 package,引擎只负责演出。**AI 编写资料并通过所有机器能验的关卡;
人只判机器判不了的三件事 —— 空间正确、电影感时序、感官品质 —— 并做微修。** 设计理由见
`docs/P4-ai-authoring-loop.md`;各层栏位字典见 `docs/authoring/<layer>.md`。

## 何时用
- 从零做一个新战场、或扩充/修改既有 package(如把最小包养成完整战役)。
- 不适用:改引擎能力(那是改 `play.html`,不是编资料)。

## 黄金准则
1. **严格依相依顺序编**(下游的 id 是上游定义的):`factions → terrain → structures → units → scene → audio`。下游引用的 id 没在上游先定义 = validator 失败。
2. **永远从绿灯起步**:用 `new-package` scaffold,它产出的最小骨架本身就过 validator + render-check。
3. **每改一批就过机器三关**(validate → residue → render),绿了再往下;**任一关红,AI 自己 loop 修,不交人**。
4. **本机验到绿才算完**;交人时附截图 + 只列「人该判的」清单。

## 步骤

> **前置(每次动手前)**
> - 所有 `node`/`python` 指令都**在 repo 根目录执行**;`--pkg` 相对当前目录解析,换目录会验错档/被 403。
> - 动手前先读 `docs/authoring/<layer>.md`(栏位字典)与 `docs/P4-ai-authoring-loop.md`(边界)。
> - **以 `packages/gaixia/` 为黄金范例**(六层 + 旁白 + 音乐 + 音效齐全),照它的结构长相做,别自创。
> - 旁白走 edge-tts,需环境前置:`python3 -m venv /tmp/ttsenv && /tmp/ttsenv/bin/pip install edge-tts`、
>   PATH 有 `ffprobe`、本机连接需停用 sandbox。换机器先补齐,或先做纯字幕(语音后补)。

### 0. Scaffold(新包才需要)
```
node tools/new-package.mjs <slug> "显示名"
```
产出 `packages/<slug>/` 的六层 + manifest + 空音频壳 + `assets/` + `narration/script.json` +
`narration/generate.py`(旁白范本,已备好,改 `SUBS` 即可)。
**注意**:骨架的 `red/blue`、`redBase`、name 尾 `000`、`年号○○○` 全是 placeholder;结构 gate 不会挡
未改的 placeholder,但 `residue-scan` 会印 WARN 提醒——交付前要全部换掉。

### 1. 依序编六层(对照 `docs/authoring/<layer>.md`)
- **factions**:阵营 id 任意(白名单由本档 keys 推导)。每阵营 `col/dark/light`(标签配色)、`panel/legend`(面板/图例名)。
- **terrain**:`world` 尺寸要容得下所有点(留边);河 `centerline` ≥2 控制点(引擎以 Catmull 加密);丘陵/区块/色带。**结构不可沉在河里**(城/营要离河中线 > 半宽 + footprint)。
- **structures**:`city`/`camp`/`pass`/`marker`/`ferry`。camp 需 `faction`(本包阵营);`fire` 挂火源(需 id);**ferry 渡口刻意放岸边水缘**(`rot` 转向水侧)。水名标签直接给 `z`(别用 `followRiver`,`RZ` 目前是赤壁硬编码)。
- **units**:`army`/`fleet`;`faction` 为本包阵营;`start{x,z,visible,formation?}`;`gait`(cav/foot);`info[short,long]`。
- **scene**:多幕。每幕 `key/title/dur/env`(env ∈ day/cold/dusk/night/inferno/dawn)+ **非空 `shots`**(line/orbit/follow)+ `power`(key 为阵营)+ `set`/`march`/`fx`/`events`/`strat`/`combat`/`finale`。**`dur` 要 ≥ 该幕旁白音长**(否则旁白被切,audio-check 会挡);但 `dur` 只是**上限** —— 自动播映时引擎会在「旁白 + 动作 + 洪水 + 事件」都做完后自动提早换幕、收掉尾巴空转,所以 **`dur` 设宽松即可、不必精算幕长**(要某幕刻意停久设 `hold:true`)。set/fx 引用的 unit/structure/camp 必须存在。
- **audio**:`music.scenes` 长度 = 幕数,`music.scenes[i]` 与 `pathPattern {n}` 是 **1-based**(scene1=第一幕);音效 `cues` 键是 **0-based 幕索引**(`"0"`=第一幕)——两者别错位。synth 音效(drum/boom/burst)零素材即可;mp3 素材路径相对 manifest 目录(放 `assets/`)。**每幕 `dur` 要 ≥ 该幕旁白较长那条人声 + 缓冲**,否则旁白被切(`audio-check` 会挡)。
- **manifest `meta.tags`**(供战役列表页筛选,必填):两条轴,先时代后看点——时代(`三国`／`楚汉`／`东晋十六国`…)+ 看点机制(`火攻`／`水战`／`围城`／`以寡击众`／`武将单挑`…)。沿用既有词汇别自造同义词(例:已有 `火攻` 就别写 `火计`)。
- **manifest `meta.intro`**(开场字卡,选填):`tag`/`bodyHtml`/`footHtml`。**`footHtml` 有通用默认(史/演义 tag 说明),不必写**;要写就**对齐该战役朝代**——「演义」来源:三国→三国演义、楚汉→《史记》、东晋→《晋书》。**绝对别从赤壁复制** `classic.html`／`audition.html`／「无声原版」／「选曲记录」那两个连结(那是 red-cliffs-3d 专属页,别包会死连结;residue-scan 会挡)。

### 2. 机器四关(每批编辑后跑;都在 repo 根)
```
node tools/validate-data.mjs --pkg packages/<slug>/battlefield.json   # schema + 跨档引用 + 镜头/cue shape
node tools/residue-scan.mjs  --pkg packages/<slug>/battlefield.json   # 无赤壁残留 + placeholder WARN
node tools/render-check.mjs   --pkg packages/<slug>/battlefield.json   # 加载 + 逐幕截图 + 0 console error
node tools/audio-check.mjs    --pkg packages/<slug>/battlefield.json   # 旁白音长≤幕长 + 音频素材解析(空音频自动放行)
```
**全绿才往下**。红了读错误消息修(会指出档+索引+原因)。`render-check` 的 PASS 只代表
「有幕 + 有 canvas + 截图时机无 error」,不保证每个镜头每帧都求值过——镜头指向的 id 由 validate-data 把关。

### 3. 旁白语音(要的话)
- 文本写进 `packages/<slug>/narration/script.json`(每幕一段:`{scene,title,text}`,scene 为 1-based)。
- 跑 scaffold 已备好的 `packages/<slug>/narration/generate.py`(edge-tts 双声;`ROOT` 自动指向本包,**唯一要改 `SUBS`**):
  ```
  /tmp/ttsenv/bin/python3 packages/<slug>/narration/generate.py        # 连接需停用 sandbox
  ```
- **edge-tts 要点**:**读音用台湾音**;罕用字(如 彧/郃/铲/骓)会回空音频、破音字(降=投降xiáng、还=huán、拚=拼pīn、王=封王wàng)会念错 → 优先在 script 改白话避开,非用不可才在 `SUBS` 加同音替身(字幕由 `to_display` 还原原字)。
- **「将」别紧接人名**:像「派降将朱序」会被断成「派降 / 将朱序」、且「将」误念 jiāng(江),糊成乱码(「派翔酱」)。改用「**将领**」(中间「领」隔开人名:晋军将领朱序)或重写拿掉「将」(投降过来的朱序)。同理任何「X将+人名」(秦将梁成→秦军将领梁成)都要避开。
- 生完**先逐幕对帐音长**:每幕 `dur` 短于旁白就把 `dur`(连同 orbit 镜头/finale 时点)拉长,留 ~3.5s 缓冲;`audio-check` 会把关。
- 填 `audio.json` 的 `narration`(voices/default/voiceLabels/pathPattern/cues)、`music.scenes`、`sfx`、`cues`。
- 配乐/音效:从音乐库/音效库指派(自动复制素材 + 写 audio.json + 补 CREDITS):
  ```
  node tools/assign-music.mjs --list                          # 看音乐库(74 首 CC0,依情绪分类 + fit)
  node tools/assign-music.mjs <slug> <一幕一首 id...>          # 依幕序指派配乐(--theme 另指定主题曲)
  node tools/assign-sfx.mjs   <slug> <id...>                   # 指派音效(audio.cues 的 name 要对上)
  ```
  目录池(非 in-repo)的曲第一次用会从海选 stash 或 preview URL 取得(下载那次 Bash 要停 sandbox)。
  **库不够用?** append 一笔进 `tools/music-library.json` / `sfx-library.json`(id/mood/credit/preview),即刻全工具可用——这就是音乐/音效库的扩充方式。

### 4. 交人(所有机器关绿之后)
附上:① validator PASS 行 ② residue PASS ③ render-check 的 0-error log + `tools/render-out/<slug>/` 逐幕截图,
并**只列人该判的**:
- **空间**:地点/单位/镜头位置合不合理?有没有沉河、重叠、路径穿地形?(俯视可用 `?pkg=…` 开浏览器 + `__topdown()`;Shift+点地图取座标回报)
- **时序/运镜**:镜头有没有框到主角?fx 与旁白同拍?节奏顺?
- **感官**:env 气氛、配色辨识度、旁白发音(台湾音)、音乐贴合度。
- **史实**:旁白文字、史/演义 tag、策略卡。

## 机器关卡 vs 人的关卡(别越界)
| 机器(AI 自己过,有对应 gate) | 人(AI 不要自我认证) |
|---|---|
| schema 合法、跨档引用完整、镜头参数齐全(line/orbit/follow)、audio cue 键与 payload 合法(validate-data) | 位置在不在合理的地方(空间) |
| 无赤壁复制残留;placeholder 已换(residue-scan,后者为 WARN) | 镜头框没框到、fx 对不对拍(时序) |
| 加载无误、有画面、0 console error(render-check) | 好不好看、好不好听(感官) |
| 旁白音长 ≤ 幕长、音频素材全解析、music.scenes 长度=幕数(audio-check) | 发音对不对、史实/tag 对不对 |

机器四关**不是品味**,是客观门槛;品味与正确性留给人。
> 注意:`render-check` 绿 ≠ 每帧都求值过;只在特定帧触发的坏引用(如 follow 指向幽灵 unit)由
> validate-data 把关。`music.scenes` 留空、placeholder 未改不会让 gate FAIL(前者 audio-check 放行
> 早期状态、后者 residue 只 WARN)——交付前自己再扫一遍。
