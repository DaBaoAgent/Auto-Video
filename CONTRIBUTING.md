# 参与 Auto-Video

这个仓库的定位很具体：**把「一个想法」变成一部能发的片**，每条管线是一套画法 + 镜头语法 + 交付门禁。所以这里最欢迎的贡献不是「加功能」，而是**让某一条管线从「作者能跑」变成「谁都能跑」**。

## 三种最容易被合并的贡献

### 1. 补一条样片（最缺）

`catalog/pipelines.json` 里 `sample` 为空、或者样片还是旧版的管线，欢迎补：

```bash
# 把片子放进素材目录，然后重建样片与站点
python tools/build_samples.py --workers 4
python tools/build_site.py
python tools/validate.py
```

要求：片头 30 秒起、竖屏/横屏按管线原比例、不小于 720p、断言 `validate.py` 通过。

### 2. 加一条新管线

四件事，缺一不可：

1. **目录**：`<id>/`，里面至少 `SKILL.md`、`pipeline.json`、`scripts/<id>.py`（单一入口）。
2. **契约**：在 `catalog/pipelines.json` 里登记（`id / station / entry / sample / status`）。
3. **配置**：`pipeline.json` 的 `meta` 按 `schema/pipeline.schema.json` 填全；能在 `spec` 里写死参数就别散落在代码里。
4. **文档**：`SKILL.md` 写清「入口命令 / 参数 / 验收条件 / 已知坑」，让下一个不看代码的人也能出片。

```bash
python tools/normalize_pipelines.py   # 幂等，补齐 meta 缺项
python tools/validate.py              # 必须 OK 契约一致，0 WARN
```

### 3. 修一条「跑不通」

以下问题优先级最高，也最容易拿到 review：

- 脚本里写死的盘符路径（`D:\…`、`C:\Users\…`）→ 改成环境变量 + `pathlib`
- 只有 Windows 能跑的 Chrome 发现逻辑 → 加 macOS / Linux 候选
- `SKILL.md` 里承诺了但实际没做的参数或门禁
- 渲染器跑完不退出、留孤儿进程
- 同一条管线在不同机器上出片不一致（确定性被破坏）

## 硬规矩

- **确定性**：渲染代码里不许出现 `Date.now()` / `Math.random()`，随机必须走 seeded PRNG。同一条片、同一版代码，出来的像素必须一样。
- **不搬原片**：样片、AI 底图、素材都要能用仓库里的脚本重新生成，或者写清来源与许可（`CREDITS.md`）。
- **不塞二进制**：新的大文件（视频、字体、PSD、模型权重）走 Release assets 或 Git LFS；仓库本体只放代码与配置。
- **共享运行时只有一个源**：`vendor/runtime/`。改了要 `python tools/sync_runtime.py`，提交前 `--check` 必须过。
- **中文注释、中文提交信息**：这个仓库的读者是中文创作者，注释写「为什么」，不写「做了什么」。

## 提交前自检

```bash
python tools/validate.py              # 契约：catalog / pipeline.json / SKILL.md 三方一致
python tools/sync_runtime.py --check  # 共享运行时没有漂移
python demo/run.py --seconds 3        # 本机三件套（Python/Node/Chrome/ffmpeg）能出片
```

三条都过，PR 描述里贴一下输出即可。

## PR 怎么写

- 一个 PR 只做一件事：一条管线、一个修复、一份文档。
- 标题用中文，写「做了什么」而不是「改了文件」。
- 说明里写清：**改前什么现象、改后怎么验证的**（命令 + 输出片段）。
- 动了渲染逻辑的，附一张改前/改后静帧对比。

## 行为准则

参与本项目即表示同意 [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md)。技术分歧按「能不能复现、能不能验证」解决，不按嗓门解决。

## 许可

提交即表示同意以 [MIT](LICENSE) 授权你的贡献。第三方素材请单独在 `CREDITS.md` 里标注来源与许可。
