# BB-Video 风格接入：37 → 6

上游：[BubbleBrainBB/BB-Video](https://github.com/BubbleBrainBB/BB-Video)，37 个风格（`skills/bb-video/styles/`）。
逐条对照本仓库原有 118 条管线后：**9 条已直接迁移、22 条同族等价、6 条新接入**。

处置表是唯一事实来源：[`tools/bb_style_map.json`](../tools/bb_style_map.json)；
新接入用 [`tools/import_bb_styles.py`](../tools/import_bb_styles.py) 生成，重复跑不会重复登记。

## 计数

| 处置 | 条数 | 含义 |
| --- | ---: | --- |
| 已迁移 | 9 | 2026-11-09 已把运行时和文档搬进 `pipelines/`，带 `LICENSE.BB-Video` |
| 同族等价 | 22 | 画法/交付片型与已有管线重复，保留已有的那条，避免同一套画法两张卡 |
| 新接入 | 6 | 原有 118 条里没有对应画法，登记成新管线 |

## 新接入的 6 条

| 管线 id | 上游风格 | 中文名 | 工位 | 命名的双拼来源 |
| --- | --- | --- | --- | --- |
| `liaotian` | `chat` | 聊天叙事 | screen | liaotian = 聊天叙事 的双拼 |
| `keli` | `grain` | 扁平颗粒插画 | graphic | keli = 扁平颗粒插画 的双拼 |
| `andiao` | `lumen` | 暗调励志 | screen | andiao = 暗调励志 的双拼 |
| `xuanyi` | `mystery` | 悬疑探秘 | screen | xuanyi = 悬疑探秘 的双拼 |
| `oupu` | `op` | 欧普艺术 | graphic | oupu = 欧普艺术 的双拼 |
| `yugao` | `trailer` | 电影预告 | graphic | yugao = 电影预告 的双拼 |

命名沿用仓库传统：中文名取双音节/三音节拼音，全小写无分隔符；撞车时用既有 `shuimo2` / `labi2` 的做法加序号。
这 6 个 id 与现有 118 条全部不撞车。

## 演示站

站点的样片暂时用 BB-Video 的 `samples` release 外链（1080p 成片），封面从同一支片子第 3.2 秒抽帧，
存在 `site/media/<id>.jpg`。等本仓库真封装后再换成本地 `projects/<编号>/out/*.mp4`。
外链写在 `site/assets/samples.json` 的 `mp4` / `source` 字段，`tools/build_site.py` 会带进 `data.js`。

复现上游样片：

```bash
# 先把 BB-Video clone 到本机（默认 D:/@kaifa/BB-Video）
python pipelines/liaotian/scripts/liaotian.py --check
python pipelines/liaotian/scripts/liaotian.py --plan
python pipelines/liaotian/scripts/liaotian.py --out out/bb-chat
```

## 37 条逐条对照

| 上游风格 | 中文名 | 处置 | Auto-Video 管线 | 理由 |
| --- | --- | --- | --- | --- |
| `chat` | 聊天叙事 | **新接入** | `liaotian` |  |
| `grain` | 扁平颗粒插画 | **新接入** | `keli` |  |
| `lumen` | 暗调励志 | **新接入** | `andiao` |  |
| `mystery` | 悬疑探秘 | **新接入** | `xuanyi` |  |
| `op` | 欧普艺术 | **新接入** | `oupu` |  |
| `trailer` | 电影预告 | **新接入** | `yugao` |  |
| `blueprint` | 工程蓝图 | 已迁移 | `blueprint`（工程蓝图） | 2026-11-09 已直接迁移（runtime/blueprint.js + LICENSE.BB-Video） |
| `goldenage` | 黄金卡通 | 已迁移 | `goldenage`（黄金卡通） | 2026-11-09 已直接迁移；同族的 laolang 也复用它的运行时 |
| `isometric` | 等距微缩 | 已迁移 | `isometric`（等距微缩） | 2026-11-09 已直接迁移；另有等轴 2.5D 的 dengju |
| `manga` | 漫画分格 | 已迁移 | `manga`（漫画分格） | 2026-11-09 已直接迁移 |
| `map` | 地图动画 | 已迁移 | `map`（地图贴纸） | 已直接迁移；另有真实地形的 ditu |
| `parable` | 火柴人寓言 | 已迁移 | `parable`（火柴人寓言） | 2026-11-09 已直接迁移 |
| `pencil` | 铅笔测试 | 已迁移 | `pencil`（铅笔测试） | 2026-11-09 已直接迁移 |
| `shadow` | 皮影戏 | 已迁移 | `shadow`（皮影戏） | 2026-11-09 已直接迁移；另有皮影卡片的 piying |
| `tapestry` | 贝叶挂毯 | 已迁移 | `tapestry`（贝叶挂毯） | 2026-11-09 已直接迁移 |
| `ink` | 水墨长卷 | 同族等价 | `shuimo`（纸本水墨） | 水墨长卷与 shuimo / shuimo2 同族等价（纸本水墨、中国水墨） |
| `pixel` | 像素游戏 | 同族等价 | `xiangsu`（像素风） | 8-bit 像素画与 xiangsu 同族等价；另有 xiangsu2 / weiyou |
| `watercolour` | 水彩 | 同族等价 | `shuicai`（水彩笔刷） | 湿画法水彩与 shuicai 同族等价 |
| `rubberhose` | 橡皮管卡通 | 同族等价 | `goldenage`（黄金卡通） | 1930 年代橡皮管卡通与已迁移的 goldenage 同族等价（只差彩色/黑白） |
| `supercut` | 踩点混剪 | 同族等价 | `shipai`（实拍混剪） | 踩点实拍混剪与 shipai 同族等价；另与 mengtai 的素材蒙太奇重叠 |
| `drawnworld` | 线稿成世界 | 同族等价 | `gangbi`（钢笔淡彩） | 钢笔线稿 + 淡彩与 gangbi 同族等价；一笔画的连续运笔已由 yibi 覆盖 |
| `storybook` | 手绘绘本 | 同族等价 | `labi`（蜡笔儿童绘本） | 手绘绘本吉祥物与 labi 蜡笔儿童绘本同族等价；另与 labi2 重叠 |
| `cutout` | 马蒂斯剪纸 | 同族等价 | `jianzhi`（红色窗花剪纸） | 剪纸拼贴与 jianzhi（剪纸红）同族等价 |
| `origami` | 折纸纸艺 | 同族等价 | `liti`（纸片立体书） | 折纸 / 立体书与 liti（纸片立体书）同族等价 |
| `toy3d` | 玩具三维 | 同族等价 | `jimu`（积木玩具） | 玩具三维与 jimu（积木玩具）同族等价；产品静物另有 chanpin |
| `filmroom` | 录像分析 | 同族等价 | `zhanshu`（体育战术板） | 冻帧画线、回放的录像分析与 zhanshu（体育战术板）同族等价 |
| `cutaway` | 剖视图解 | 同族等价 | `chaijie`（产品拆解） | 剖视图解与 chaijie（产品拆解）同族等价；线稿剖面另有 poumian |
| `newsreel` | 老新闻片 | 同族等价 | `xinwen`（1920s 新闻影片） | 1930 年代新闻片与已登记的 xinwen（1920s 新闻影片）同族等价 |
| `whiteboard` | 白板手绘 | 同族等价 | `baiban`（白板讲解） | 白板讲解与 baiban 同族等价；视觉笔记方向还有 biji / make |
| `riso` | 孔版印刷 | 同族等价 | `kongban`（孔版印刷） | 孔版套印与 kongban 同族等价 |
| `ascii` | 字符画 | 同族等价 | `zifu`（CRT 字符终端） | ASCII / CRT 字符画与 zifu 同族等价 |
| `pop` | 波普漫画 | 同族等价 | `bopu`（波普艺术） | 波普漫画与 bopu 同族等价 |
| `bauhaus` | 包豪斯 | 同族等价 | `baohao`（包豪斯几何） | 包豪斯几何与 baohao 同族等价 |
| `swiss` | 瑞士排版 | 同族等价 | `ruishi`（瑞士动态排版） | 瑞士动态排版与 ruishi 同族等价 |
| `launch` | 发布动画 | 同族等价 | `fabu`（暗色科技发布） | 产品发布动画与 fabu（暗色科技发布）同族等价 |
| `collage` | 纸艺拼贴 | 同族等价 | `fugu`（复古版画拼贴） | 纸艺拼贴与 fugu（复古版画拼贴）同族等价 |
| `dossier` | 剪报解说 | 同族等价 | `wangdian`（网点档案） | 剪报 / 网点档案与 wangdian 同族等价；简报板方向另有 jianbao |

## 已知边界

- 这 6 条是**登记 + 上游复现**，不是把 BB-Video 的渲染代码搬进本仓库；`runtime/` 仍是空的，入口只调上游。
- 上游样片里 `mystery` / `trailer` / `lumen` 是手写画面，`--quick` 只能复现同一套材质，复刻不了原分幕。
- 上游字体从 jsDelivr 现取，首次渲染要联网；本仓库不接管它的配乐与拟音。
- `site/assets/samples.json` 的 6 条外链依赖 GitHub Release，断网时卡片只剩封面。
