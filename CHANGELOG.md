# 更新日志

版本口径：`MAJOR.MINOR.PATCH`。管线数量、契约字段这类会打断已有工程的变化走 MINOR；只修 bug 走 PATCH。

## v1.2.0 · 2026-11-20

两件事同时落地：77 条管线从「转调外部 `build.sh`」改成**仓库内自研渲染**；6 条管线从「登记 + 外部复现」转成**本地运行时封装**。两边都不再依赖外部 checkout，本地能自己出帧。

### 新增

- **`vendor/runtime/stylekit.js`**：自研 Canvas2D 绘制内核，14 个风格族（刻印 / 网点 / 霓虹 / 屏幕 /
  像素 / 立体 / 图纸 / 地图 / 摄影 / 纸艺 / 板写 / 平面 / 赛璐珞 / 场），含纸纹、排线、半调网点、
  一位抖动、加色发光、扫描线、等轴测投影、图纸网格与限色后处理等原语。
- **`vendor/runtime/style-frames.mjs`**：通用抓帧器（puppeteer-core + 本机 Edge headless），
  页面协议 `window.__ready` / `window.renderAt(t)`。
- **`tools/av_style.py`**：77 条共用的命令行入口实现（`--check / --plan / --stills / --render / --frames-only / --mp4`）。
- **`tools/gen_style_projects.py`**：按 id 播种生成/重写 77 套 `projects/demo`（`index.html` + `main.js`）。

### 变更（77 条自研内核渲染）

- 77 条 `scripts/<id>.py` 改为转调 `av_style.main`；`pipeline.json` 补 `spec.style{family,palette,kit,harness,project}`。
- 77 条 `SKILL.md` / `README.md` 改写为「自己画」的口径；`catalog` 的 `engine` 按真实风格族写成
  `自研渲染 · vendor/runtime/stylekit.js（族名）`，`frontend/targets.json` 的 `reason` 不再写「上游复现」。
- 演示站卡片短片暂为早期外部样片，本地可用 `--render` 出自己的帧。

### 变更（6 条本地运行时封装）

- **6 条管线自包含**：`liaotian` / `keli` / `andiao` / `xuanyi` / `oupu` / `yugao` 各补
  `runtime/`（共享 `core.js` + `promo.js` + 风格 `<slug>.js` + `render.mjs` 等）、
  `template/`（起步工程）、`references/`（风格规范原文）与 `MIGRATION.md`。
- **入口改写**：每条管线统一的 `new → check → stills → render → probe → qa → deliver` 七动作，
  渲染只调本地 `runtime/render.mjs`；`new` 把 runtime 复制进工程 `lib/`。
- **QA 口径**：promo 默认 −14 LUFS；`andiao` / `yugao` 暗调片按 −16 LUFS，并允许长黑场。
- **文档**：[`docs/风格集接入记录.md`](docs/风格集接入记录.md) 补“封装内容”与本地复现命令；
  README 的 6 条说明从“登记 + 外部复现”改为“本地运行时封装”。
- **验证**：6 条 `--check` 均 0 error；各出 12–34 s 本地成片（960×540，AAC），`qa` 全 OK。

## v1.1.0 · 2026-11-19

37 个候选画法逐条对照后，只接入 6 条真正缺的画法；其余 9 条已迁移、22 条同族等价，不重复登记。

### 新增

- **6 条管线**：`liaotian`（chat 聊天叙事）、`keli`（grain 扁平颗粒插画）、
  `andiao`（lumen 暗调励志）、`xuanyi`（mystery 悬疑探秘）、`oupu`（op 欧普艺术）、
  `yugao`（trailer 电影预告）。入口统一走本地编排脚本（v1.2.0 起只调 `runtime/render.mjs`）。
- **处置表**：[`tools/legacy_style_map.json`](tools/legacy_style_map.json)，37 个风格逐条记
  `already` / `equivalent` / `import`；接入说明见
  [`docs/风格集接入记录.md`](docs/风格集接入记录.md)。

- **演示站**：6 条先用外部 1080p 外链，封面从同片第 3.2 秒抽帧存
  `site/media/<id>.jpg`；等本地工程渲完再换自研成片。

## v1.0.0 · 2026-11-17

第一个可交付版本：33 条管线、11 个工位、32 条带样片，契约校验通过。

### 新增

- **一键 demo**：`python demo/run.py` / `docker compose run --rm demo`，不需要配音、模型或云端 API，出 15 秒片。
- **数据驱动分幕**：`vendor/runtime/autoscene.js`。8 条模板库派生模板（pencil / isometric /
  manga / tapestry / shadow / parable / goldenage / blueprint）不再写死 8 句旁白，稿子几行都能渲。
- **共享运行时单一源**：`vendor/runtime/`，`tools/sync_runtime.py` 负责下发与漂移校验。
- **去掉遗留品牌目录**：原带品牌前缀的 `vendor/<brand>/runtime/` 改为 `vendor/runtime/`，`render-mg.mjs` 改为
  `render-cdp.mjs`，样式包目录统一叫 `styles/`。环境变量前缀随之统一：`BV_*` / `MG_*` → `AV_*`
  （`AV_LANG`、`AV_CDP_TIMEOUT`、`AV_FRAME_TIMEOUT`、`AV_CHROME`、`AV_SITE`、`AV_VENDOR`、`AV_FONT_KAI`、`AV_FONT_DIR`）。
  旧变量名不再读取，自己脚本里写过的请一并改。版权与许可出处只保留在 `THIRD_PARTY_NOTICES.md`
  与 `vendor/runtime/LICENSE-upstream`（MIT 要求保留版权声明）。
- **贡献漏斗**：`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`、issue 表单与 PR 模板。
- **管线清单**：[docs/pipelines.md](docs/pipelines.md)，从 `catalog/pipelines.json` 生成，不再手写。

### 修复

- **渲染器不再留孤儿 Chrome**：`render.mjs` 在 Windows 上按进程树回收（`taskkill /T`），退出前显式
  `process.exit`，CDP 请求加超时。片出来，进程就退。
- **封面/联系表截图卡死**：PNG 截图不再无限等待（见下条已知问题）。
- **`.gitignore` / `.gitattributes`**：样片原片、审片目录、预览 GIF 不再进仓库；二进制与 LFS 规则补齐。

### 已知问题

- 体积：`.git` 已从 662 MB 重写为 322 MB（剔除 `showcase/`、工程产物视频与站点样片的 256 个历史旧版本），
  代价是**所有 commit hash 变化、旧 clone 作废**。剩余体积主要是字体 52 MB 与站点样片 101 MB，见
  [docs/素材与体积.md](docs/素材与体积.md)。
- 41 个脚本仍带硬编码盘符路径（`D:\…`、`C:\Users\…`），需要逐个改成环境变量。
- 8 条模板的「片头卡 + 卡片」是保底排版，不是原来样片的手绘美术；要那种画面仍走 `projects/` 里的手写工程。
- `frontend/targets.json` 里仍只有部分管线开了 render（原「只能出片 2/33」的现场问题）。
