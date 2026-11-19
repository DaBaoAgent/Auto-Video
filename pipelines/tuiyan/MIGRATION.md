# tuiyan 迁移说明（MIGRATION）

本文件说明 tuiyan 与上游 `DaBaoAgent/alannew` 的差异、外部依赖与已知缺口。

## 来源与取舍

tuiyan 克隆自 `DaBaoAgent/alannew`（2026-10-14 产出 `赤壁之战_完整版_稳帧1080p_*` 成片），只保留**最终成片所需的最小自洽子集**：

| 项 | 取舍 | 说明 |
| --- | --- | --- |
| `pipeline/laorou/` | ✅ 保留 | 口播稿子管线（机检 + 去味），自带 SKILL.md |
| `scripts/` | ✅ 保留 9 个 | 封面/试听/抽帧审核/发布校验/渲染启动等生产脚本 |
| `vendor/battlefield-editor/` 引擎 | ✅ 保留 | 本地化 3D 引擎 + `schema/` + `skills/` + `tools/`（渲染/校验/换乐工具） |
| `packages/chibi-full/` | ✅ 保留 | 赤壁之战 46 幕完整包（最终成片所用） |
| `packages/chibi/`（9 幕演示包） | ❌ 不搬 | 演示用，非最终成片；其 `assets/music/scene1-9.mp3`（CC0 配乐）与 21 个音效已迁入 `chibi-full/assets/music/`、`assets/sfx/` 并改写 `audio.json` 引用 |
| `packages/chibi-10min/`、`chibi-full-12x/`、`chibi-clone/` | ❌ 不搬 | 赤壁老变体/派生包 |
| `packages/guandu*`、`fanchengflood/`、`feishui/`、`gaixia/`、`xiapi/` | ❌ 不搬 | 其他战役包，与本管线无关 |
| `content/`（战役产物） | ❌ 不搬 | 成片/封面/发布信息为战役交付物，按本仓库 `content/NN-<战役名>/` 约定重建 |
| `docs/`、`sfx-stash/`、`参考素材/` | ❌ 不搬 | 验证中间产物与大素材库 |
| 根目录演示 bat/vbs、Logo 图 | ❌ 不搬 | 本地演示辅助 |

## 外部依赖

| 依赖 | 版本/说明 | 获取方式 |
| --- | --- | --- |
| Node.js | 18+（引擎工具链） | 系统安装 |
| Python | 3.10+（口播稿/试听/发布脚本） | 系统安装 |
| ffmpeg / ffprobe | 合成、变速、抽帧 | 系统 PATH 或 `%USERPROFILE%\bin\` |
| Edge 或 Chrome | 渲染录屏（`record-video.mjs`、`render-check.mjs`） | 系统浏览器；脚本默认 `C:/Program Files/Google/Chrome/Application/chrome.exe`，可用 `CHROME` 环境变量覆盖 |
| puppeteer-core | 引擎节点依赖 | `cd vendor/battlefield-editor && npm ci`（`package.json` 已声明） |

## 本机自备项（不入仓库）

| 项 | 说明 |
| --- | --- |
| TTS 配音服务 | `generate-film-narration.py` 默认走 SiliconFlow（云端）/ 本地克隆音色（`--provider local --base-url http://127.0.0.1:9880/... --voice dabao`）；试听脚本需 DashScope 密钥（环境变量或本机 Hermes `.env`） |
| 影视原声 OST | `audio.json#music.scenes` 引用 2010 版《三国》等影视原声，**非 CC0**，需本机自备并按 `packages/chibi-full/CREDITS.md` 记录授权；换乐用 `tools/reburn-bgm.mjs` |
| 主帅卡等美术资产 | 原 `scripts/make_commander_cards.py` 引用未迁移的 `chibi/assets/commanders` 与外部参考图，本次未搬；`chibi-full` 数据已内嵌现有资产 |

## 路径适配

迁移时已将硬编码的上游工作目录（`D:/@kaifa/alannew/...`）与演示包路径改为 tuiyan 相对路径：

- 引擎工具默认战役包统一为 `packages/chibi-full/battlefield.json`（`play.html`、`audio-check`、`fit-durations`、`render-check`、`residue-scan`、`serve`、`record-video`、`reburn-bgm`、`apply-artdir` 等）
- 试听/审核脚本输出改为 `tuiyan/content/01-赤壁之战/` 相对路径（基于 `__file__` 推导）
- 截图/日志输出指向引擎目录内 `docs/screenshots/`

已知遗留（保留原样，不影响成片链路）：`tools/music-library.json`、`tools/sfx-library.json` 的 `local` 字段仍是上游 `packages/chibi/assets/...` 库索引（历史记录）；`chibi-full/audio.json` 引用的逐幕配乐（scene1-9，CC0）与 21 个音效已迁入包内 `assets/music/`、`assets/sfx/`，`node tools/validate-data.mjs --pkg packages/chibi-full/battlefield.json` 已 PASS。
