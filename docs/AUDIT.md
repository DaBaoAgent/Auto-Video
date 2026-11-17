# Auto-Video 仓库审查与装修记录

审查日期：2026-11-15　｜　基线：`main` @ 浅克隆 1.18 GB（含 `showcase/` 约 350 MB）
审查范围：仓库根的 33 个管线目录、`projects/`、`showcase/`、README、GitHub Pages 配置。

---

## 一、审查发现

### 1. 元数据各写各的

| 问题 | 具体情况 |
| --- | --- |
| 缺 `pipeline.json` | 9 条：`huixingzhen`、`jianying`、`jilupian`、`peiyin`、`piying`、`shouhui`、`tuiyan`、`xiangsu`、`zhidiao` |
| 顶层结构四不像 | `bianping` 13 键新式、`lishi` 19 键带 `locked` 参数段、`chengshi`/`laolang` 16 键、`shipai` 连 `style` 都没有——同一份契约有四种写法 |
| 没有机器可读的总表 | 33 条管线散在 README 表格、目录名和各自 SKILL.md 里，脚本无法核对「仓库里有几条、登记了几条」 |

### 2. README 与实际不符

- 通栏写「31 条成片 + 1 个前端 = 32」，但 `bianping` 目录已经存在、成片可播，总览表里却漏记；实际是 **32 条成片 + 1 个前端 = 33**。
- `### 30 秒公开样片` 表仍指向 `showcase/*_30s.mp4` 的旧直链，其中还挂着一条不存在的 `youxi（待封装）`。
- 快速开始里写「仓库保存 14 条 30 秒样片（约 260 MB）」，与实际样片规模不符。

### 3. SKILL.md 头部不规范

- `huixingzhen`、`peiyin` 完全没有 YAML frontmatter；
- 另有 3 条开头的缩进 / 格式不标准，解析不出 `name`。

### 4. 目录与登记双向脱漏

- `isometric` 目录存在、样片也在，但从没进过任何总表（本次补登记，归到 `d3` 工位）。

### 5. Pages 是坏的

- `build_type=legacy`、`source=main:/`、`status=errored`：仓库根没有 `index.html`，legacy 构建必然失败；站点产物也不该摊在仓库根。

---

## 二、改造策略：加性契约，不动老键

`pipeline.json` **会被脚本真实读取**，不是摆设：

| 读取方 | 读哪些键 |
| --- | --- |
| `shipai/scripts/shipai.py` | `json.load(PIPE_JSON)` 后取 `data["paths"]` 等**扁平键** |
| `tianshu/scripts/tcfg.py` | `cfg["stills"]`、`data["paths"]`、`cam.moves` |
| `shouhui/.../sceneFull.js` | 注释引用 `lishi` 的 `caption` 段 |

因此**不做「把参数搬进 `spec`」的重构**——那会打断上述脚本。统一改造只做加法：

1. 顶层新增 `"schema": "auto-video/pipeline@1"`；
2. 顶层新增 `"meta"`：`id / no / name_zh / name_en / station / tagline / engine / aspect / fps / entry / status`；
3. 原有扁平键**原地保留、保持原顺序**；
4. `schema/pipeline.schema.json` 顶层 `additionalProperties: true`，并在 `$comment` 里写明「历史扁平键合法，新管线请放 `spec`」。

`meta` 与 `catalog/pipelines.json` 逐字段相等，由校验器强制——登记表和管线文件从此不可能各说各话。

---

## 三、做了什么

| 产出 | 内容 |
| --- | --- |
| `catalog/pipelines.json` | 33 条管线登记表：id / 工位 / 中英名 / 一句话 / 引擎 / 画幅 / 帧率 / 入口 / 状态 / 样片 |
| `catalog/stations.json` | 11 个工位：纸本叙事 3、手绘笔触 4、传统工艺 5、卡通动画 4、平面图形 4、屏幕赛博 2、三维推演 4、地图地理 2、图纸说明 2、实拍混剪 2、前端工位 1 |
| `schema/pipeline.schema.json` | draft 2020-12，`schema` + `meta` 必填，顶层开放 |
| `tools/av/__init__.py` | 共用：读 JSON（保证 LF）、探片、跑命令、解析 frontmatter |
| `tools/normalize_pipelines.py` | 幂等补齐 `schema` + `meta`、给缺失的管线建骨架、给 SKILL.md 补 frontmatter |
| `tools/validate.py` | 契约校验（见下）+ 反向目录检查 + `--samples-dir` 样片核对 |
| `tools/build_samples.py` | 压网页短片 + 抽封面；**一律从片头取前 30 秒**（短片整条），管线 1280 长边 / crf 30，风格 640 / crf 32 |
| `tools/build_site.py` | catalog + samples → `site/assets/data.js` |
| `tools/build_fonts.py` | 按站点实际用字子集化思源宋 600 / 思源黑 400 → woff2 |
| `site/` | 静态样片站：首屏、11 个工位、83 张卡、样片库筛选、灯箱 |
| `.github/workflows/pages.yml` | 校验 → 建站 → 部署 Pages（`build_type` 由 legacy 切到 workflow） |
| README | 重写头部：工位地图、统一契约、工具链、样片表；修正 33 条与样片规模；补全仓库结构 |
| 33 个 `*/pipeline.json` | 新增 `schema` + `meta`，原有键一个没动 |
| 2 个 `SKILL.md` | `huixingzhen`、`peiyin` 补 YAML frontmatter |

### 校验器管什么

`python tools/validate.py`

- `catalog` 自洽：id 唯一、工位存在、编号连续；
- 每条管线 `SKILL.md` 的 frontmatter `name` == 目录名；
- 每条 `pipeline.json` 的 `schema` / `meta` 与 `catalog` **逐字段相等**；
- `meta.entry` 指向的文件真实存在；
- 反向检查：仓库里有目录但 catalog 没登记（曾据此抓出 `isometric`）；
- `--samples-dir` 逐条核对 catalog 登记的样片文件是否存在。

ERROR 退出 1，仅 WARN 退出 0。

---

## 四、当前校验结果

```
管线 33 条 / 工位 11 个 / 带样片 27 条
  01 纸本叙事    3 条  jianying lishi zhidiao
  ...
  11 前端工位    1 条  peiyin

WARN 4
  - piying / xiangsu / tuiyan / jilupian：没有声明单一入口脚本
OK 契约一致
```

4 条 WARN 是真实状态：这四条管线靠多脚本 + 手工编排跑，没有唯一入口。**不强造一个假的入口来消警告**，先留 WARN。

---

## 五、样片与站点

| 项 | 数值 |
| --- | --- |
| 管线样片 | 30 条（2 条无样片：`zhidiao` `lvdong`；`peiyin` 是配音前端，不出片，不计入缺样片） |
| 风格样片 | 56 段（`BB-Video` 37 段 + 顶层年代命名 15 段 + 其余横向抽样），不进管线元数据 |
| 合计 | 86 段网页短片 + 86 张封面，94.0 MB（每段取片头前 30 秒） |
| 字体 | 思源宋 600 子集 339 KB / 思源黑 400 子集 248 KB（754 个字） |

站点设计对齐 `lemo-opuscar` 的语言但数字自定：深墨底 `#0b0a09`、纸色 `#ece4d6`、唯一暖色灯色 `#e9b47c`、衬线标题 + 无衬线标签 + 等宽数字、发丝线分隔。

交互：

- 卡片**悬停即播**（首次悬停才挂 `src`，同时最多 4 个在播，移出即暂停归零）；
- 竖屏样片单独走 9:16 版式，4:3 走 `square`；
- 点击开**灯箱有声播放**，带片名 / 英文名 / 原片时长 / 试片时长 / 引擎 / 管线文档直链；
- 样片库 5 列密集网格 + 全部 / 管线 / 风格 / 横屏 / 竖屏 / 一分钟以上筛选 + 搜索（`/` 聚焦）；
- 键盘 `ESC` 关闭，`/` 聚焦搜索；
- 无样片的管线显示「样片待补」，点击直达其 GitHub `SKILL.md`；`peiyin` 例外，显示「配音模块 · 无样片」（catalog 的 `sample_note` 字段驱动）。

---

## 六、遗留与下次接手

1. ~~**4 条 WARN**~~：已清零。`piying` / `xiangsu` / `tuiyan` / `jilupian` 各补了 `scripts/<id>.py` 单一入口（真实串联原有 node/bash/`python -m autoup.run` 步骤，带 `check` / `--plan`），catalog 的 `entry` 与各自 `pipeline.json` 的 `meta.entry` 已同步，`validate.py` 报 `OK 契约一致`、0 WARN。
2. ~~**6 条无样片**~~：`tianshu` 已接《镇魔塔》41.0 s，`laolang` 已接《玄奘》62.2 s，`jilupian` 已接《一口气看完日本3000年》818.4 s；`peiyin` 已标注为配音前端、不出片、不需要样片（catalog `sample_note` + 站点卡片 + README 清单三处一致）。真缺样片的只剩 2 条：`zhidiao`、`lvdong`。
3. **`youxi`（仁德天皇陵 192.7 s）** 仍是「待封装」状态，未进 catalog；
4. **`showcase/`** 350 MB 旧原片保留未删（README 已改成站点用 `site/media/`），如需瘦身可后续单独处理；
5. 站点的 `samples.json` / `data.js` / `media/` 是**生成物**，但为了 Pages 不跑 ffmpeg 而**入库**；换素材时重跑 `build_samples.py` + `build_site.py` 即可。

---

## 七、复跑命令

```powershell
python tools/validate.py --samples-dir "D:\BaiduSyncdisk\@同步\1 MG 动画\管线样片"
python tools/normalize_pipelines.py      # 幂等，可随时跑
python tools/build_samples.py --workers 5 # 幂等，未变文件会跳过
python tools/build_site.py
python tools/build_fonts.py
```
