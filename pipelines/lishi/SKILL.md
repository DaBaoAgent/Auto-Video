---
name: lishi
description: 历史科普短片管线（纸本/绢本美术 + AI 静帧底图 + 代码相机 + 从句级字幕 + 关键镜音效，Remotion 渲染）。当用户要做历史人物/悬案/战事类短视频，或说"按朱元璋/刘秀那套再来一集""用 lishi 出片"时使用。一条命令跑完 对齐→分镜→音轨→封面→渲染→封装→归档。
---

# lishi —— 历史科普短片管线

`jianying` 的演进版。差别不在这条链的名字，在三件被实战逼出来的东西：

1. **字幕必须从句级对齐**（不是按字数比例切）
2. **每镜的从句数要锁死**（不是按时长攒镜，否则重配就漂）
3. **频闪是硬预算**（全片帧间亮度差 P99 < 1 灰阶）

定版实例：`projects/zhuyuanzhang/`（E3《朱元璋·碽妃疑案》53 镜 / 144.9s），
参数快照在 `lishi/pipeline.json`。

## 一句命令

```bash
python lishi/scripts/lishi.py all --project <slug>          # 分镜→音轨→封面→渲染→封装
python lishi/scripts/lishi.py publish --project <slug>      # 归到 out/<编号>_<人物>/
```

step by step：

```bash
python lishi/scripts/lishi.py align   --project x --src 出稿/004_xxx   # 段落级配音→从句级
python lishi/scripts/lishi.py realign --project x --voice 出稿/xxx/配音-新.wav  # 整段重录
python lishi/scripts/lishi.py shots   --project x                       # storyboard→shots.json
python lishi/scripts/lishi.py audio   --project x                       # 28 音色 + 关键镜 + BGM
python lishi/scripts/lishi.py cover   --project x                       # 3:4 + 4:3 封面
python lishi/scripts/lishi.py render  --project x
python lishi/scripts/lishi.py mux     --project x
python lishi/scripts/lishi.py publish --project x
python lishi/scripts/lishi.py probe   --project x                       # 看缺什么
```

## 两个输入

```
projects/<slug>/
├── film.json              选题与全局参数（theme / audio / cover / delivery）
├── work/
│   ├── data/storyboard.json    ← 分镜表（人写，见 references/storyboard.md）
│   ├── narration/narration.json ← 从句级时码（align 或 realign 产出）
│   └── public/bg/b01.png ...    ← AI 静帧底图
```

`storyboard.json` 是这套管线的核心：每镜写清 **card / content / bg / count**，
`count` 是这一镜占几个从句。从句总数固定 → 镜数固定 → 按镜号的资产（底图、音效计划、
卡片文案）永远对得上。改稿只需调 `count` 或文案，不用重排时间。

## 画面五层（来自 `template/src/Film.tsx`）

```
Layer 5  字幕 Caption / CaptionVeil / OldFilm        数据驱动，meta 开关
Layer 4  纸面装饰 Ornament（版框/边栏影字/纪年/角章） meta.ornament
Layer 3  卡片正文 bookcard / sealcard / numcard / signcard
Layer 2  AI 静帧底图 BgProvider（活在 Paper 内部）    meta.backgrounds + shot.bg
Layer 1  纸底 Paper（底色 + 静止纸纹 + 暗角）
```

**底图必须放进 `Paper()` 内部**。叠在卡片之上会把卡片的白色纸页一起用 multiply 压掉，
整张蒙灰——这是 E3 返工最多的一处。

## 四条硬约束

1. **零频闪**：全片帧间亮度差 P99 < 1 灰阶，> 3 灰阶的跳变必须 0 处。
   四个源头：逐帧亮度抖动、片门闪白、纸纹逐帧位移、字幕衬底随字幕开关。
   量法与定位见 `references/qa.md`。
2. **字幕切点落在换气处**：≥ 90% 的字幕切换点应落在真静音里。
   比例分配做不到（句内必然切在字中间），必须用候选边界 + DP。
3. **音效少而准**：只挂关键镜，每镜 2 点上限。E3 是 40 条 / 19 镜。
   点数少则单点重（印章 −9dB、撞击 −12.5dB）。
4. **分组锁死**：`storyboard.json` 里每镜的 `count` 就是镜界依据，
   不要用「按时长攒镜」——重配一次能漂 18/53 镜。

## 参数（E3 定版，全量见 `lishi/pipeline.json`）

| 项 | 值 |
|---|---|
| 画幅 | 1920×1080 / 30fps |
| 单镜 | 2.0–4.0s，均 2.73s |
| 运镜 | 底图横移 22–38px + 推拉 1.04→1.11，逐镜换向 |
| 字幕 | 句级全量、≤14 字、60 号、底距 112、淡入 5 帧 |
| 字幕衬底 | 常驻 `CaptionVeil`（400px，0.74/0.34） |
| 老电影 | 划痕 3 / 灰尘 22 / 暖调 / 暗角 0.40，全部常驻缓慢漂移 |
| 音效 | 40 条 / 19 关键镜 / 10 音色 |
| BGM | 人声 RMS + 12.9dB，说话时再压 4.4dB |
| 响度 | −16.3 LUFS / −1.5 dBTP |
| 封面 | 3:4（1080×1440）+ 4:3（1440×1080），标题用 Remotion 叠，不用 AI 写字 |

## 交付

`publish` 只往 `out/<编号>_<人物>/` 放四个文件：**成片 + src_3x4.png + src_4x3.png + 发布信息.md**
（封面直接放集目录，不建子目录）。

审核版（要时从母版压）、`字幕.srt`（留工程根）、封面无字底图与生成原图
（留 `work/assets/cover/`）都不进交付目录。`发布信息.md` 只写 **5 个标题 + 4 个标签**。
目录规范见 `out/README.md`，封面与文案规范见 `references/publish.md`。

## 何时读哪个文件

| 时机 | 读 |
|---|---|
| 写分镜表 | `references/storyboard.md`（字段、count 怎么定、底图怎么配） |
| 调参数 | `lishi/pipeline.json`（唯一参数源，不再有单独 params.md） |
| 字幕对不上 | `references/qa.md`（切换点干净率、DP 参数） |
| 画面在闪 | `references/qa.md` 频闪一节 |
| 出封面 / 写发布信息 | `references/publish.md` |
| 看完整实例 | `projects/zhuyuanzhang/`（storyboard + 19 张底图 + 40 条音效） |

## 资产

- `lishi/scripts/` —— `lishi.py`（编排）、`build_shots.py`（storyboard→shots）、
  `align_captions.py`（段落→从句）、`realign_voice.py`（整段重录→从句）、
  `make_audio.py`（28 音色 + 关键镜 + BGM）、`qa_film.py`、`common.py`
- `lishi/template` —— 指向 `../template` 的目录联接（同一套 Remotion 工程）
- `template/src/` —— `look.tsx`（主题/印章/字幕/衬底）、`BgContext.tsx`（底图运镜）、
  `Ornament.tsx`（纸面装饰，配置驱动）、`OldFilm.tsx`（老电影，参数驱动）、
  `Film.tsx`（五层装配）、`shots/`（四张通用卡 + 早期场景卡）
- `out/` —— 成片库（唯一交付目录）
