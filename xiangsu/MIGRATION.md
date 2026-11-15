# xiangsu 迁移记录（2026-11-04）

本目录从云端仓库 `DaBaoAgent/yandi` 整目录迁移而来，作为 Auto-Video 的第 14 条成片管线。

## 来源

| 项 | 值 |
| --- | --- |
| 仓库 | `github.com/DaBaoAgent/yandi`（公开） |
| 分支 / 提交 | `main` @ `33930505`（`3393050566c67a6512a165569883f8e67baf35c8`，2026-10-30 14:01 UTC，`feat(xiangsu-caocao): 全片 45 镜 / 187 s 成片与交付固化`） |
| 源路径 | `yandi-video/render/xiangsu/` |
| 落地路径 | `D:/@kaifa/Auto-Video/xiangsu/` |

## 迁移方式

`git clone --depth 1` 整仓到临时目录，再把 `render/xiangsu` 整目录复制到本项目。该目录自带 `.gitattributes`（`* -text`），关闭了 `core.autocrlf` 的 EOL 转换，所以检出字节与 git blob 一致，复制前后逐文件 SHA-256 完全相同（42 / 42）。

## 校验结果

- **文件数**：42 个文件 / 533,291 B，与远程仓库目录列表逐项一致。
- **冻结基线**：`FREEZE_PIPELINE.json` 记录 41 条（不含该文件自身）→ **40 条与磁盘逐字节一致**。
- **1 条不一致**：`demo/film.js`
  - 记录值 `0a6d7f5847822e6a336b676f046822fe21f7656ae845ba4007c8f4aee638ce64`（`FREEZE.json` 与 `README.md` 同，2026-10-28 冻结）
  - 实际值 `7a9293632a9722b68ed2002bc292c110a8fff04e76c7bf554f68991a23cef9d0`
  - 该文件自 2026-10-29 首次入库（`8b8aabe6`）起，在 `8b8aabe6` / `bc92aed4` / `33930505` 三个提交上都是 `7a92…`：`0a6d…` 是 10-28 冻结时的本地值，**从未入库**，属原仓库记录漂移，不是迁移导致。
  - 影响：`demo/film.js` 的哈希不能作为身份校验依据；画面以入库版本为准。重出 10 秒样片后需按新版本重记基线。
- **结构校验**：12 个 JSON 全部可解析；17 个 `.js` / `.mjs` 全部通过 `node --check`。

## 未随仓库迁移、需外置的依赖

| 依赖 | 说明 |
| --- | --- |
| `mg-styles-15` 渲染仓库 | harness（`harness/render.mjs`）、`tools/density.mjs`、像素字体 `assets/fonts/fonts.css` 都在这个渲染仓库里，不随本管线提交。按项目 README 的 MG 段落装到 `vendor/mg-styles-15` |
| Chrome | `MG_CHROME` 指向可执行文件 |
| ffmpeg / ffprobe | 需在 PATH |
| Python + numpy | 音轨合成（`audio.py` / `sfx_prep.py`） |
| bash | `build.sh` / `make_audio.sh` / `build_full.sh`，Windows 用 Git Bash 或 WSL |
| 音效库 | `D:/@kaifa/@/音效`（全片 rev4 的 58 条音效来源） |
| 上一部片的素材 | `001_波斯湾伊甸园` 的口播稿 / `配音.wav` / 词级转写（示例工程用） |

## 路径说明

脚本内的默认值仍是迁移前的 `D:/@kaifa/yandi/...`（为保持逐字节冻结未改写）。运行前必须覆盖：

```powershell
$env:XIANGSU_REPO = "D:/@kaifa/Auto-Video/vendor/mg-styles-15"
$env:XIANGSU_PROJ = "<本片项目目录>"
$env:XIANGSU_PY   = "<本机 python.exe，需 numpy>"
$env:XIANGSU_VOICE = "<本片 配音.wav>"
$env:MG_CHROME    = "C:/Program Files/Google/Chrome/Application/chrome.exe"
```

完整变量表见 [SKILL.md](SKILL.md)「环境变量」。

## 云端仓库处置

- **2026-11-04 已删除 GitHub 仓库 `DaBaoAgent/yandi`**（`gh repo delete`，随后 `gh api repos/DaBaoAgent/yandi` 返回 404）。
- 删除前整仓留档：`D:/@kaifa/Auto-Video/.tmp/yandi-archive-2026-11-04/`（565 文件 / 311,283,155 B，与克隆源文件数、字节数一致；`.tmp/` 已在 `.gitignore` 内，不入库）。
- 本目录是 `xiangsu` 管线在云端删除后的留存副本；云端已无第二份。
- **未随本次落地的兄弟目录**（仅存于上述留档）：`render/piying`、`render/nuwa`、`render/posiwan`、`render/rendieren`、`render/caocao`、`render/zhouwang`、`render/xiangsu-caocao`（曹操全片 45 镜 / 187 s 变体），以及 `tools/`、`docs/`、`output/`（多部片的口播稿与配音）。需要其中任何一条时从留档取回，不要指望云端。
