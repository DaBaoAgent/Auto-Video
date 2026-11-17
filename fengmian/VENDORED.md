# fengmian（导入自 DaBaoAgent/fengmian）

这个目录是 `DaBaoAgent/fengmian` 的**原样导入**，不是复制改写。它是 Auto-Video 每条管线的最后一道模块：文案 → 两张封面（4:3 / 3:4）+ 两行制发布信息，带交付门禁与硬校验。

| 项 | 值 |
| --- | --- |
| 上游 | https://github.com/DaBaoAgent/fengmian |
| 导入日期 | 2026-11-17 |
| 方式 | `git clone --depth 1` 后删掉 `.git`，其余文件未改 |
| 本地用法 | `python fengmian/fengmian.py build --src 字幕.srt --out 交付目录 --name 片名 --style tuiyan` |

上游 README 里关于「克隆自 tuiyan 发布层」「`refs/` 封面参考库」「ARK 出图」的说明，全部仍然有效，见本目录 `README.md`。

## 在 Auto-Video 里的位置

- `frontend/` 的第 05 阶段直接调它：`frontend/frontend.py` → `fengmian/fengmian.py build …`
- `laolang/scripts/laolang.py` 的 `deliver` 优先用仓库内这份（其次 `FENGMIAN_DIR`，最后才是老的 `D:\@kaifa\fengmian`）
- 别的管线要接，就照 `laolang` 的 `run_fengmian` 写法调用 `build / covers / gate`

## 维护

要更新就到上游改，再把整个目录覆盖进来（保持原样，别在这里二次开发）；Auto-Video 自己的适配逻辑放在 `frontend/` 里。
