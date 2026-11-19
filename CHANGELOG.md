# 更新日志

版本口径：`MAJOR.MINOR.PATCH`。管线数量、契约字段这类会打断已有工程的变化走 MINOR；只修 bug 走 PATCH。

## v1.1.0 · 2026-11-19

BB-Video 的 37 个风格逐条对照后，只接入 6 条真正缺的画法；其余 9 条已迁移、22 条同族等价，不重复登记。

### 新增

- **6 条 BB-Video 管线**：`liaotian`（chat 聊天叙事）、`keli`（grain 扁平颗粒插画）、
  `andiao`（lumen 暗调励志）、`xuanyi`（mystery 悬疑探秘）、`oupu`（op 欧普艺术）、
  `yugao`（trailer 电影预告）。入口统一走 `tools/bb_style.py`，调上游
  `promo/scripts/new.mjs --style <slug>` + `render.mjs`。
- **处置表**：[`tools/bb_style_map.json`](tools/bb_style_map.json)，37 个风格逐条记
  `already` / `equivalent` / `import`；接入说明见
  [`docs/BB-Video-管线接入.md`](docs/BB-Video-管线接入.md)。
- **导入器**：[`tools/import_bb_styles.py`](tools/import_bb_styles.py)，幂等生成管线目录、
  登记 catalog、补 frontend targets 与站点样片。
- **演示站**：6 条先用 BB-Video `samples` release 的 1080p 外链，封面从同片第 3.2 秒抽帧存
  `site/media/<id>.jpg`；等真封装后再换本地成片。

## v1.0.0 · 2026-11-17

第一个可交付版本：33 条管线、11 个工位、32 条带样片，契约校验通过。

### 新增

- **一键 demo**：`python demo/run.py` / `docker compose run --rm demo`，不需要配音、模型或云端 API，出 15 秒片。
- **数据驱动分幕**：`vendor/runtime/autoscene.js`。8 条模板库派生模板（pencil / isometric /
  manga / tapestry / shadow / parable / goldenage / blueprint）不再写死 8 句旁白，稿子几行都能渲。
- **共享运行时单一源**：`vendor/runtime/`，`tools/sync_runtime.py` 负责下发与漂移校验。
- **去掉上游品牌名**：原 `vendor/bb-video/runtime/` 改为 `vendor/runtime/`，`render-mg.mjs` 改为
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
