# 更新日志

版本口径：`MAJOR.MINOR.PATCH`。管线数量、契约字段这类会打断已有工程的变化走 MINOR；只修 bug 走 PATCH。

## v1.0.0 · 2026-11-17

第一个可交付版本：33 条管线、11 个工位、32 条带样片，契约校验通过。

### 新增

- **一键 demo**：`python demo/run.py` / `docker compose run --rm demo`，不需要配音、模型或云端 API，出 15 秒片。
- **数据驱动分幕**：`vendor/bb-video/runtime/autoscene.js`。8 条 BB-Video 派生模板（pencil / isometric /
  manga / tapestry / shadow / parable / goldenage / blueprint）不再写死 8 句旁白，稿子几行都能渲。
- **共享运行时单一源**：`vendor/bb-video/runtime/`，`tools/sync_runtime.py` 负责下发与漂移校验。
- **贡献漏斗**：`CONTRIBUTING.md`、`CODE_OF_CONDUCT.md`、`SECURITY.md`、issue 表单与 PR 模板。
- **管线清单**：[docs/pipelines.md](docs/pipelines.md)，从 `catalog/pipelines.json` 生成，不再手写。

### 修复

- **渲染器不再留孤儿 Chrome**：`render.mjs` 在 Windows 上按进程树回收（`taskkill /T`），退出前显式
  `process.exit`，CDP 请求加超时。片出来，进程就退。
- **封面/联系表截图卡死**：PNG 截图不再无限等待（见下条已知问题）。
- **`.gitignore` / `.gitattributes`**：样片原片、审片目录、预览 GIF 不再进仓库；二进制与 LFS 规则补齐。

### 已知问题

- 大体积：默认分支仍有 88 段压缩样片（约 101 MB）与字体副本，`.git` 历史 662 MB。历史瘦身需要
  `git filter-repo` 重写，属破坏性操作，见 [docs/素材与体积.md](docs/素材与体积.md)。
- 41 个脚本仍带硬编码盘符路径（`D:\…`、`C:\Users\…`），需要逐个改成环境变量。
- 8 条模板的「片头卡 + 卡片」是保底排版，不是原来样片的手绘美术；要那种画面仍走 `projects/` 里的手写工程。
- `frontend/targets.json` 里仍只有部分管线开了 render（原「只能出片 2/33」的现场问题）。
