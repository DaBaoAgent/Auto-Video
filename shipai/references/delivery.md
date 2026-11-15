# 交付与归档

## 本管线的交付形态

shipai 只负责把片子做出来，**不打包发布包**：成片就是 `projects/<名字>/final-9x16.mp4`。

交付目录里只有两样东西值得留：

| 文件 | 说明 |
|---|---|
| `final-9x16.mp4` | 成片，1080×1920 / 30 fps / h264+aac |
| `timeline.json` | 逐句时间轴（重烧字幕用；不含音频） |

其余（`voice.wav`、`audio/`、`materials/`、`base-9x16.mp4`、`logs/`）都是可再生成的中间产物，不入库。

## 为什么没有封面和发布信息

本次（2026-11-15）用户明确要求：**只封真正用到的能力，没用到的功能和界面都不要封**。封面、两行制发布信息、fengmian 门禁本次全都没用到，所以不接。

需要发布包时，按 `laolang` 那条链路的契约手动走一遍（`D:\@kaifa\fengmian build / covers / gate`），或直接用 `laolang/scripts/laolang.py deliver` 的产物结构做参考。

## 归档

- 成片如需长期保留，放本地归档目录（与仓库分离），不要提交进仓库。
- 工程目录只保留 `project.json`、`script.txt`、`timeline.json`、`materials/materials.json`、`materials/candidates.json` 这几样「重新出片需要的信息」。
- 素材本身不提交（Pixabay License 允许再分发，但没必要把仓库撑大）；`materials.json` 里的 id 足以重新下载。

## 命名

- 工程目录：`projects/<出稿编号>_<选题>/`，与 `peiyin` 的出稿目录同名，便于对齐。
- 成片：`final-9x16.mp4`（底片是 `base-9x16.mp4`，一眼能看出谁是中间产物）。
