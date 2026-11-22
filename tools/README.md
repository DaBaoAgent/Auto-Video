# tools 索引

仓库里**还活着**的工具都在这层，一屏能看完。一次性脚本已经移到 [legacy/](legacy/)。

## 门禁（CI 与本地都跑这几个）

| 命令 | 作用 |
|---|---|
| `python tools/check_syntax.py` | 全仓自有 Python 编译一遍 |
| `python tools/validate.py` | 契约校验：catalog / pipeline.json / SKILL.md 三方一致 |
| `python tools/sync_runtime.py --check` | 检查 vendor/runtime 与各管线副本是否同源 |
| `python tools/check_links.py` | 文档里的相对链接、站点引用的媒体是否都存在 |

## 站点

| 命令 | 作用 |
|---|---|
| `python tools/build_site.py` | 由 catalog + samples.json 生成 `site/assets/data.js`，并给 index 里的 css/js 打内容指纹 |
| `python tools/pack_sample.py --key <id> --master <mp4> --title <片名> --poster <秒> [--push]` | 演示站样片固化：压 1024×576 / 30fps / CRF30、导封面、标题三处同步、构建校验、可选推送 |
| `python tools/build_samples.py` | 批量把源片切成站点样片并挑封面 |
| `python tools/poster_appeal.py` | 封面自动挑选（运动量 + 边缘密度，排除白场/黑场/空镜） |
| `python tools/sample_audit.py` | 样片巡检：时长、体积、画幅、缺片 |
| `tools/poster_overrides.json` | 人工钉秒的封面配置 |

## 管线与文档

| 命令 | 作用 |
|---|---|
| `python tools/normalize_pipelines.py` | 把 pipeline.json 的扁平键归一成 `spec` 结构 |
| `python tools/build_pipeline_doc.py` | 生成 `docs/pipelines.md` |
| `python tools/hand_samples.py` / `python tools/paper_samples.py` | 手绘、纸本类样片的批量生产 |
| `python tools/update_samples_v3.py` | 回写 v3 样片的元数据 |
| `python tools/sync_fonts.py` / `python tools/build_fonts.py` | 站点字体的子集化与同步 |
| `python tools/platform_paths.py` | 各平台的路径口径（被上面几个脚本引用） |
| `tools/av.py` | 公共工具层：仓库路径、读 catalog、媒体探测、时长格式化 |

## 规矩

- 新脚本放这一层，并在上表登记；**不要**在仓库根或 `pipelines/` 里散放临时脚本。
- 只跑一次就完成使命的脚本，用完移到 `legacy/`，别留在门口。
- 脚本里不要硬编码绝对路径，统一用 `tools/av.py` 的 `REPO` / `SITE_DIR`。
