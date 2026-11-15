# zhidiao 管线 · 本机落地说明（2026-10-22）

## 来源

- 原始包：`D:\自动剪辑\zhidiao-skill-package.zip`
- 归档副本：`_source/zhidiao-skill-package.zip`
- SHA-256：`3dc6ad408d21c304b52c7125add528ed97f06bbb7a4a2e995a1eb7df76f7f3d9`
- 包内文件按原样解压，未改动任何脚本或文档。

## 本机依赖差异（运行前先处理）

| 包内写死的路径 | 本机现状 | 可用替代 |
|---|---|---|
| `D:/GPT-SoVITS/.venv/Scripts/python.exe`、`D:/GPT-SoVITS/dabao_tts.py`、`D:/GPT-SoVITS/voices/dabao/preset.json` | 不存在。本机有 `D:/@kaifa/GPT-SoVITS/`，但目录内没有 `dabao_tts.py` / `preset.json` | 已于 2026-10-22 改为 tushuo 自带 TTS：`vendor/gpt-sovits/.venv/Scripts/python.exe` + `tools/dabao_batch_tts.py`（服务 `127.0.0.1:9880`，参数锁定） |
| `D:/tmp_dl/chrome-win64/chrome.exe`（Chrome 131） | 不存在 | 本项目通过 `hyperframes@hyperframes` 插件渲染；`output/china-emperors-20min/render/sample-motion-v3.log` 显示浏览器走 cache/auto-detect 可正常出片 |
| 参考实现 `films/china-history-20min/` | 本机没有该目录；`films/china-emperors-20min` 属已删除的 jianying 管线，2026-10-23 一并删除 | 参考交付改看 `out/2 170万年的中国历史/` 与 `output/china-history-20min/`；新片按 zhidiao 目录契约重建 |

`D:/@kaifa/tushuo` 这个 BASE 路径与本机一致。

## 本机适配改动（2026-10-22）

`scripts/zhidiao_make_audio.py` 已改成本机 TTS 入口，其余逻辑未动：

- `PY` → `vendor/gpt-sovits/.venv/Scripts/python.exe`
- `TTS_SCRIPT` → `tools/dabao_batch_tts.py`
- 去掉 `--config` 与 `preset_parts.json`：本机 TTS 服务的采样参数锁定在 `vendor/gpt-sovits/tts_server.py`，
  不再有 `max_chars_per_second` 阈值；长句切分由 `--max-chars`（默认 78）负责。
- 时长字段兼容：`narration.json` 的 `duration_s` 与旧版 `duration` 都能读。

注意：`PARTS_DIR` / `OUT_DIR` 默认指向 `content/china-history-20min`、`output/china-history-20min`；
跑新片前按实际 slug 改这两处（当前在做的片子是 `warring-states-20min`）。

## 2026-10-22 同步：封面与发布信息（统一交付口径）

- `references/pipeline.md` 新增 §7 封面与发布信息、§8 交付结构，`SKILL.md` 总览由六阶段扩为七阶段。
- 封面统一用 `tools/zhidiao/make_covers.py`（Seedream `doubao-seedream-5-0-flash-260915`，
  配置读项目根 `.env` 的 `IMG_BASE_URL / IMG_MODEL / IMG_API_KEY`）：
  两张 2048×1536 / 1536×2048，主标题恰好 6 个汉字、金色毛笔、由模型直接画入。
- 发布信息两行：标题 **≤25 字、两段式强钩子**、含阿拉伯数字；第二行恰好 4 个 `#话题`。
- 打包用 `tools/zhidiao/package_delivery.py`，交付目录顶层 4 文件 + `源文件/`。
- 首个按此口径交付的 zhidiao 片：`out/2 170万年的中国历史/`
  （标题「一百七十万年」，18 分 12 秒，1920×1080 横版）。

## 2026-10-24 改规则：发布信息 5 条标题 + 4 话题

- 宝哥要求「以后发布信息里放5条标题，4个标签」。`发布信息.txt` 从两行改为
  **6 行 = 5 条候选标题 + 1 行 4 个 `#话题`**，发布时从 5 条里选 1 条用。
- 每条标题仍守原硬约束：≤25 字（含标点）、两段式（：？ ！分隔）、含阿拉伯数字；
  5 条角度要错开（数字反差 / 悬念 / 情绪 / 极限词），按抖音爆款逻辑写。
- `package_delivery.py` 的 `validate_release_info()` 已改为校验 6 行、逐条校验 5 个标题，
  末行恰好 4 个话题；`pipeline.md` §7.2 / §8 与 `SKILL.md` 同步。
- 首个按新规则重打的交付：`out/4 刘秀/`。

## 2026-10-24 新增：Agnes 分镜素材（生图 + 首帧图生视频）

- 新增 `tools/zhidiao/agnes_api.py`（纯标准库客户端：生图、首帧视频、轮询、下载、
  指数退避 + 抖动）与 `tools/zhidiao/agnes_shots.py`（`images/videos/all/status/check`
  子命令，输入 `content/<slug>/shots.json`，状态写 `shots/assets.json`）。
- `zhidiao_assemble.py` 增加 `--slug / --base / --shots-file / --shot-mode` 参数；
  fragment 用 `<div class="shotslot" data-shot="sNNN"></div>` 占位，组装时自动复制素材
  到 `films/<slug>/<part>/assets/shots/` 并替换成 `<img>/<video>` 层，另加场景数断言。
- 配置写入项目根 `.env`：`AGNES_BASE_URL / AGNES_IMAGE_MODEL / AGNES_VIDEO_MODEL /
  AGNES_API_KEY`。Agnes 当前图片与视频均限时免费；视频高峰会 `video_queue_full`，
  脚本退避重试并记 `queued/pending`，重跑自动续传（退出码 2）。
- 实测：2K/16:9 纸雕剪影图每张约 3–4MB、2 张并发约 16 秒；视频排队在白天持续拥塞，
  建议错峰。首帧视频要求源图为公网 URL，URL 失效会自动重出图片。
- 详细用法见 `references/pipeline.md` §2.5。

## 2026-10-24 新增：参考图（角色定妆）img2img

- `agnes_api.py` 的 `generate_image()` 支持 `images=[...]`：本地路径（相对项目根）、
  公网 URL、base64 或 data URI，统一转 base64 放进 `extra_body.image`，走 img2img。
- `shots.json` 的镜头可写 `reference`（或 `ref_images`）列表；`agnes_shots.py` 会自动
  转绝对路径并记录到 `assets.json`，`--no-reference` 可临时关闭。
- 首个用例：《从夏到秦》第一幕（分镜 S2）用
  `content/warring-states-20min/shots/refs/方案A_束发骨簪首领版.png` 锁定人物造型，
  2K/16:9 一次出图成功；视频仍走首帧图生视频。
- 注意：参考图会原样 base64 上传，2–3 MB 的 PNG 可用；过大时先压到 1 MB 以内更稳。


## 使用方式

- 作为 tushuo 项目技能加载：新开 Claude Code 会话后以 `/zhidiao` 或触发词（纸雕、剪影动画、图说历史、分镜渲染、zhidiao）调用。
- 详细定稿参数见 `references/pipeline.md`；首次运行前先按上表把脚本里的 TTS 路径改成本机入口。
