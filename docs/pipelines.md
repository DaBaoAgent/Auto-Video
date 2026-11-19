# 管线清单：41 条，一条一个命令

这份清单由 `tools/build_pipeline_doc.py` 从 `catalog/pipelines.json` 生成，是目录的镜像；
**入口与参数以各管线自己的 `SKILL.md` 为准**。这里回答的是「这条线现在能不能跑、从哪儿进、吃到什么输入」。

约定：

- **live** = 仓库里已有样片、入口脚本存在、`python tools/validate.py` 通过；
- **beta** = 代码与文档在，样片还没补齐；
- 命令都在仓库根目录执行，入口路径取 `pipeline.json` 的 `meta.entry`；不确定就 `--help`。

当前：**40 条 live / 1 条待补样片 / 11 个工位**。

## 01 · 纸本叙事　*Paper & Chronicle*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `jianying` | 纸本卡片（Paper-card Chronicle） | live | Remotion | `pipelines/jianying/scripts/jianying_shotcraft.py` | 211s |
| `lishi` | 纸本史话（Paper History） | live | Remotion | `pipelines/lishi/scripts/lishi.py` | 145s |
| `zhidiao` | 纸雕剪影（Paper-cut Lightbox） | live | HyperFrames | `pipelines/zhidiao/scripts/zhidiao_assemble.py` | 21s |

## 02 · 手绘笔触　*Hand & Pencil*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `caiqian` | 彩铅科普（Colored-pencil Science） | live | G-buffer + 后处理 | `pipelines/caiqian/scripts/caiqian.py` | 27s |
| `gangbi` | 钢笔淡彩（Pen & Wash Sketch） | live | Canvas 逐帧 · 钢笔 + 水彩双层 | `pipelines/gangbi/scripts/gangbi.py` | 33s |
| `labi` | 蜡笔儿童绘本（Crayon Picture Book） | live | WebGL2 合成 + Canvas 逐帧 · 纸齿 / 蜡附着 / 水彩抗拒 | `pipelines/labi/scripts/labi.py` | 52s |
| `pencil` | 铅笔测试（Pencil Test） | live | Canvas · Chrome 逐帧 | `pipelines/pencil/scripts/pencil.py` | 30s |
| `pingban` | 平板速写（Tablet Sketch） | live | 纯 Canvas · 零依赖 | `pipelines/pingban/scripts/pingban.py` | 39s |
| `qianhuang` | 铅黄浓彩（Giallo Gouache） | live | Canvas 逐帧 · 钢笔浓彩 + 彩色色片光 + 合成音效 | `pipelines/qianhuang/scripts/qianhuang.py` | 22s |
| `shouhui` | 逐帧手绘（Hand-drawn Cel） | live | Canvas 逐帧 · 浏览器渲染 | `pipelines/shouhui/scripts/shouhui.py` | 206s |
| `shuicai` | 水彩笔刷（Watercolor Brush） | live | Canvas 2D · 湿画法笔刷 + 纸张吸收 | `pipelines/shuicai/scripts/shuicai.py` | 114s |

## 03 · 传统工艺　*Traditional Crafts*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `fushihui` | 浮世绘（Ukiyo-e） | live | Canvas 2D · 分色版块 + 错版套印 | `pipelines/fushihui/scripts/fushihui.py` | 44s |
| `laolang` | 上美影手绘（Shanghai Cel） | live | Canvas · Chrome 逐帧 | `pipelines/laolang/scripts/laolang.py` | 62s |
| `piying` | 皮影卡片（Shadow-puppet Cards） | live | Playwright + Canvas 逐帧 | `pipelines/piying/scripts/piying.py` | 272s |
| `shadow` | 皮影戏（Shadow Puppetry） | live | Canvas · Chrome 逐帧 | `pipelines/shadow/scripts/shadow.py` | 203s |
| `shuimo` | 纸本水墨（Ink Wash） | live | SVG + Canvas | `pipelines/shuimo/scripts/shuimo.py` | 30s |
| `shuimo2` | 中国水墨（Chinese Ink Wash） | live | Canvas 2D · 墨的浓淡/飞白/渗化 + 程序化宣纸 | `pipelines/shuimo2/scripts/shuimo2.py` | 48s |
| `tapestry` | 贝叶挂毯（Bayeux Tapestry） | live | Canvas · Chrome 逐帧 | `pipelines/tapestry/scripts/tapestry.py` | 30s |

## 05 · 平面图形　*Graphic & Motion*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `bianping` | 扁平尺度漫游（Scale Zoom Explainer） | live | SVG 代码绘制 · lemo-opuscar core/render | `pipelines/bianping/scripts/bianping.py` | 36s |
| `huixingzhen` | 回形针风（Paperclip Explainer） | live | HTML 逐帧 · 确定性渲染 | `pipelines/huixingzhen/scripts/gen_episode.py` | 597s |
| `lvdong` | 剪影律动（Silhouette Rhythm） | live | Canvas + 着色器 · 代码合成配乐 | `pipelines/lvdong/scripts/lvdong.py` | 58s |
| `shiliang` | 扁平矢量（Flat Vector） | live | SVG 单页 · 逐帧确定性渲染 | `pipelines/shiliang/scripts/shiliang.py` | 30s |
| `zhuangshi` | 装饰艺术（Art Deco） | live | Canvas 2D · 金色渐变线 + 灯泡招牌 + 装饰字体排版 | `pipelines/zhuangshi/scripts/zhuangshi.py` | 39s |

## 06 · 屏幕赛博　*Screens & Neon*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `xianshiqi` | 赛博 HUD（Cyber HUD） | live | Three.js + Canvas FUI 覆盖层 | `pipelines/xianshiqi/scripts/xianshiqi.py` | 30s |
| `xuni` | 合成波 VHS（Synthwave VHS） | live | Three.js + Canvas + VHS 后处理 | `pipelines/xuni/scripts/xuni.py` | 30s |

## 08 · 地图地理　*Maps & Terrain*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `ditu` | 真实地形（Terrain Map） | live | WebGL · 高程驱动水面 | `pipelines/ditu/scripts/ditu.py` | 39s |
| `map` | 地图贴纸（Map Stickers） | live | Chrome 逐帧 + ffmpeg | `pipelines/map/scripts/map.py` | 544s |

## 09 · 图纸说明　*Diagram & Blueprint*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `blueprint` | 工程蓝图（Blueprint） | live | Canvas · Chrome 逐帧 | `pipelines/blueprint/scripts/blueprint.py` | 12s |
| `parable` | 火柴人寓言（Stick-figure Parable） | live | Three.js · 固定广角 | `pipelines/parable/scripts/parable.py` | 178s |

## 10 · 实拍混剪　*Live Footage*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `jilupian` | 纪录片解说（Documentary） | live | S1–S9 流水线 | `pipelines/jilupian/scripts/jilupian.py` | 818s |
| `shipai` | 实拍混剪（Live-footage Cut） | live | MoneyPrinterTurbo + ffmpeg | `pipelines/shipai/scripts/shipai.py` | 18s |

## 11 · 前端工位　*Front of House*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `peiyin` | 配音前端（Voice Front-end） | beta | GPT-SoVITS · 长稿分段合成 | `pipelines/peiyin/scripts/synthesize_dabao_paragraphs.py` | — |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `chengshi` | 城市年轮（City Rings） | live | Three.js + Remotion | `pipelines/chengshi/scripts/chengshi.py` | 161s |
| `dengju` | 等轴 2.5D（Isometric 2.5D） | live | Three.js 正交场景 | `pipelines/dengju/scripts/dengju.py` | 30s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `goldenage` | 黄金卡通（Golden-age Toon） | live | Canvas · Chrome 逐帧 | `pipelines/goldenage/scripts/goldenage.py` | 30s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `isometric` | 等距微缩（Isometric Diorama） | live | Canvas · Chrome 逐帧 | `pipelines/isometric/scripts/isometric.py` | 30s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `manga` | 漫画分格（Manga Panels） | live | Canvas · Chrome 逐帧 | `pipelines/manga/scripts/manga.py` | 30s |
| `tianshu` | 天书奇谭（Tianshu Cel） | live | ComfyUI + Wan2.2 | `pipelines/tianshu/scripts/tianshu.py` | 41s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `tuiyan` | 3D 战场推演（3D Battle Sim） | live | 3D 兵棋引擎 · 逐帧稳帧渲染 | `pipelines/tuiyan/scripts/tuiyan.py` | 540s |
| `weisuo` | 孟菲斯微缩（Memphis Diorama） | live | three.js 3D 微缩 + 法线/深度描边后处理 | `pipelines/weisuo/scripts/weisuo.py` | 45s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `xiangsu` | 像素风（Pixel Art） | live | Canvas · Puppeteer 逐帧 | `pipelines/xiangsu/scripts/xiangsu.py` | 29s |


---

## 怎么读一条管线

1. 打开 `<id>/SKILL.md`——完整流程、参数、验收条件、已知坑都在里面；
2. `python tools/validate.py` 看它是否被目录、`pipeline.json`、`SKILL.md` 三方一致地登记；
3. 想加一条新的，走 [CONTRIBUTING.md](../CONTRIBUTING.md) 的「加一条新管线四件事」。
