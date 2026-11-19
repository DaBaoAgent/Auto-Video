# liaotian —— 聊天叙事（Chat Narrative）

故事发生在聊天软件里：气泡、输入中、语音条与引用卡，镜头推进一条时其余变暗。

| 项 | 值 |
| --- | --- |
| 工位 | 06 屏幕赛博 |
| 上游 | BB-Video `skills/bb-video/styles/chat`（聊天叙事） |
| 样片 | 《一骑红尘妃子笑 · 聊天群》58.6 s，来源 BB-Video `samples` release |
| 入口 | `pipelines/liaotian/scripts/liaotian.py` |
| 画幅 | 16:9 |

## 跑

```bash
python pipelines/liaotian/scripts/liaotian.py --check   # 体检
python pipelines/liaotian/scripts/liaotian.py --plan    # 看步骤
python pipelines/liaotian/scripts/liaotian.py           # 建工程 + 出片（调上游 new.mjs / render.mjs）
```

要先把 BB-Video clone 到本机（默认 `D:/@kaifa/BB-Video`），或用 `BB_VIDEO_DIR` 指过去。

## 现状

这条线是**登记 + 上游复现**，还没有搬成本仓库自己的渲染代码：
画面、镜头、声音全部以 `styles/chat/STYLE.md` 为准，样片先用 BB-Video 的。
要做成「一条文案直接出片」，得把上游 starter 拆成数据驱动的 `template/`，
再按 `CONTRIBUTING.md` 补样片。
