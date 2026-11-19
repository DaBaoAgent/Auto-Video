# 管线清单：124 条，一条一个命令

这份清单由 `tools/build_pipeline_doc.py` 从 `catalog/pipelines.json` 生成，是目录的镜像；
**入口与参数以各管线自己的 `SKILL.md` 为准**。这里回答的是「这条线现在能不能跑、从哪儿进、吃到什么输入」。

约定：

- **live** = 仓库里已有样片、入口脚本存在、`python tools/validate.py` 通过；
- **beta** = 代码与文档在，样片还没补齐；
- 命令都在仓库根目录执行，入口路径取 `pipeline.json` 的 `meta.entry`；不确定就 `--help`。

当前：**123 条 live / 1 条待补样片 / 11 个工位**。

## 01 · 纸本叙事　*Paper & Chronicle*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `jianying` | 纸本卡片（Paper-card Chronicle） | live | Remotion | `pipelines/jianying/scripts/jianying_shotcraft.py` | 211s |
| `lishi` | 纸本史话（Paper History） | live | Remotion | `pipelines/lishi/scripts/lishi.py` | 145s |
| `zhidiao` | 纸雕剪影（Paper-cut Lightbox） | live | HyperFrames | `pipelines/zhidiao/scripts/zhidiao_assemble.py` | 21s |

## 02 · 手绘笔触　*Hand & Pencil*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `baiban` | 白板讲解（Whiteboard Explainer） | live | lemo styles/whiteboard · 上游 demo | `pipelines/baiban/scripts/baiban.py` | 111s |
| `biji` | 视觉笔记（Sketchnote） | live | lemo styles/sketchnote · 上游 demo | `pipelines/biji/scripts/biji.py` | 51s |
| `caiqian` | 彩铅科普（Colored-pencil Science） | live | G-buffer + 后处理 | `pipelines/caiqian/scripts/caiqian.py` | 27s |
| `gangbi` | 钢笔淡彩（Pen & Wash Sketch） | live | Canvas 逐帧 · 钢笔 + 水彩双层 | `pipelines/gangbi/scripts/gangbi.py` | 33s |
| `heiban` | 黑板粉笔（Chalkboard） | live | lemo styles/chalkboard · 上游 demo | `pipelines/heiban/scripts/heiban.py` | 49s |
| `labi` | 蜡笔儿童绘本（Crayon Picture Book） | live | WebGL2 合成 + Canvas 逐帧 · 纸齿 / 蜡附着 / 水彩抗拒 | `pipelines/labi/scripts/labi.py` | 52s |
| `make` | 马克笔白纸速写（Marker on Paper） | live | lemo styles/marker-paper · 上游 demo | `pipelines/make/scripts/make.py` | 52s |
| `pencil` | 铅笔测试（Pencil Test） | live | Canvas · Chrome 逐帧 | `pipelines/pencil/scripts/pencil.py` | 30s |
| `pingban` | 平板速写（Tablet Sketch） | live | 纯 Canvas · 零依赖 | `pipelines/pingban/scripts/pingban.py` | 39s |
| `qianhuang` | 铅黄浓彩（Giallo Gouache） | live | Canvas 逐帧 · 钢笔浓彩 + 彩色色片光 + 合成音效 | `pipelines/qianhuang/scripts/qianhuang.py` | 22s |
| `shouhui` | 逐帧手绘（Hand-drawn Cel） | live | Canvas 逐帧 · 浏览器渲染 | `pipelines/shouhui/scripts/shouhui.py` | 206s |
| `shuicai` | 水彩笔刷（Watercolor Brush） | live | Canvas 2D · 湿画法笔刷 + 纸张吸收 | `pipelines/shuicai/scripts/shuicai.py` | 114s |
| `yibi` | 一笔画（One-line Drawing） | live | lemo styles/one-line · 上游 demo | `pipelines/yibi/scripts/yibi.py` | 48s |
| `youhua` | 油画厚涂（Impasto Oil Painting） | live | lemo styles/impasto · 上游 demo | `pipelines/youhua/scripts/youhua.py` | 40s |

## 03 · 传统工艺　*Traditional Crafts*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `boli` | 彩色玻璃窗（Stained Glass） | live | lemo styles/stained-glass · 上游 demo | `pipelines/boli/scripts/boli.py` | 56s |
| `fushihui` | 浮世绘（Ukiyo-e） | live | Canvas 2D · 分色版块 + 错版套印 | `pipelines/fushihui/scripts/fushihui.py` | 44s |
| `jianzhi` | 红色窗花剪纸（Red Paper-cut） | live | lemo styles/papercut-red · 上游 demo | `pipelines/jianzhi/scripts/jianzhi.py` | 49s |
| `jinbo` | 金箔彩绘（Gilded Illumination） | live | lemo styles/gilded-illumination · 上游 demo | `pipelines/jinbo/scripts/jinbo.py` | 47s |
| `laolang` | 上美影手绘（Shanghai Cel） | live | Canvas · Chrome 逐帧 | `pipelines/laolang/scripts/laolang.py` | 62s |
| `piying` | 皮影卡片（Shadow-puppet Cards） | live | Playwright + Canvas 逐帧 | `pipelines/piying/scripts/piying.py` | 272s |
| `shadow` | 皮影戏（Shadow Puppetry） | live | Canvas · Chrome 逐帧 | `pipelines/shadow/scripts/shadow.py` | 203s |
| `shuimo` | 纸本水墨（Ink Wash） | live | SVG + Canvas | `pipelines/shuimo/scripts/shuimo.py` | 30s |
| `shuimo2` | 中国水墨（Chinese Ink Wash） | live | Canvas 2D · 墨的浓淡/飞白/渗化 + 程序化宣纸 | `pipelines/shuimo2/scripts/shuimo2.py` | 48s |
| `tapestry` | 贝叶挂毯（Bayeux Tapestry） | live | Canvas · Chrome 逐帧 | `pipelines/tapestry/scripts/tapestry.py` | 30s |

## 05 · 平面图形　*Graphic & Motion*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `baohao` | 包豪斯几何（Bauhaus Shapes） | live | lemo styles/bauhaus-shapes · 上游 demo | `pipelines/baohao/scripts/baohao.py` | 52s |
| `bianping` | 扁平尺度漫游（Scale Zoom Explainer） | live | SVG 代码绘制 · lemo-opuscar core/render | `pipelines/bianping/scripts/bianping.py` | 36s |
| `bopu` | 波普艺术（Pop Art） | live | lemo styles/pop-art · 上游 demo | `pipelines/bopu/scripts/bopu.py` | 52s |
| `fugu` | 复古版画拼贴（Vintage Engraving Collage） | live | lemo styles/vintage-collage · 上游 demo | `pipelines/fugu/scripts/fugu.py` | 52s |
| `guaban` | 刮版画长镜头（Scratchboard Long Take） | live | lemo styles/printed-long-take · 上游 demo | `pipelines/guaban/scripts/guaban.py` | 60s |
| `huixingzhen` | 回形针风（Paperclip Explainer） | live | HTML 逐帧 · 确定性渲染 | `pipelines/huixingzhen/scripts/gen_episode.py` | 597s |
| `jiandie` | 60s 间谍片头（60s Spy Title Sequence） | live | lemo styles/spy-titles · 上游 demo | `pipelines/jiandie/scripts/jiandie.py` | 44s |
| `keli` | 扁平颗粒插画（Flat Grain Illustration） | live | BB-Video styles/grain · 上游 promo | `pipelines/keli/scripts/keli.py` | 93s |
| `kongban` | 孔版印刷（Risograph Print） | live | lemo styles/risograph · 上游 demo | `pipelines/kongban/scripts/kongban.py` | 40s |
| `lvdong` | 剪影律动（Silhouette Rhythm） | live | Canvas + 着色器 · 代码合成配乐 | `pipelines/lvdong/scripts/lvdong.py` | 58s |
| `muke` | 木刻版画（Woodcut Print） | live | lemo styles/woodcut · 上游 demo | `pipelines/muke/scripts/muke.py` | 58s |
| `oupu` | 欧普艺术（Op Art） | live | BB-Video styles/op · 上游 promo | `pipelines/oupu/scripts/oupu.py` | 22s |
| `ruishi` | 瑞士动态排版（Swiss Motion Graphics） | live | lemo styles/swiss-motion · 上游 demo | `pipelines/ruishi/scripts/ruishi.py` | 44s |
| `shiliang` | 扁平矢量（Flat Vector） | live | SVG 单页 · 逐帧确定性渲染 | `pipelines/shiliang/scripts/shiliang.py` | 30s |
| `siyin` | 丝印旅行海报（Silkscreen Travel Poster） | live | lemo styles/silkscreen-poster · 上游 demo | `pipelines/siyin/scripts/siyin.py` | 50s |
| `tongban` | 铜版画（Copperplate Engraving） | live | lemo styles/engraving · 上游 demo | `pipelines/tongban/scripts/tongban.py` | 40s |
| `wangdian` | 网点档案（Halftone Dossier） | live | lemo styles/halftone-dossier · 上游 demo | `pipelines/wangdian/scripts/wangdian.py` | 30s |
| `wenzi` | 文字闪切（Text Flash Cuts） | live | lemo styles/text-flash-cuts · 上游 demo | `pipelines/wenzi/scripts/wenzi.py` | 46s |
| `xiangxing` | 象形运动图形（Pictogram Motion） | live | lemo styles/pictogram-motion · 上游 demo | `pipelines/xiangxing/scripts/xiangxing.py` | 50s |
| `yugao` | 电影预告（Movie Trailer） | live | BB-Video styles/trailer · 上游 promo | `pipelines/yugao/scripts/yugao.py` | 83s |
| `zhuangshi` | 装饰艺术（Art Deco） | live | Canvas 2D · 金色渐变线 + 灯泡招牌 + 装饰字体排版 | `pipelines/zhuangshi/scripts/zhuangshi.py` | 39s |

## 06 · 屏幕赛博　*Screens & Neon*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `andiao` | 暗调励志（Dark Motivational） | live | BB-Video styles/lumen · 上游 promo | `pipelines/andiao/scripts/andiao.py` | 165s |
| `biaoge` | 表格动画（Spreadsheet Film） | live | lemo styles/spreadsheet · 上游 demo | `pipelines/biaoge/scripts/biaoge.py` | 52s |
| `dianlu` | 电路板（Circuit Board） | live | lemo styles/circuit-board · 上游 demo | `pipelines/dianlu/scripts/dianlu.py` | 60s |
| `dianzhen` | 1-bit 点阵（1-bit Dither） | live | lemo styles/one-bit-dither · 上游 demo | `pipelines/dianzhen/scripts/dianzhen.py` | 50s |
| `fabu` | 暗色科技发布（Dark Tech Keynote） | live | lemo styles/dark-keynote · 上游 demo | `pipelines/fabu/scripts/fabu.py` | 42s |
| `houshi` | 后室录像带（Liminal Found Footage） | live | lemo styles/backrooms · 上游 demo | `pipelines/houshi/scripts/houshi.py` | 60s |
| `leida` | 雷达扫描纪录片（Radar Sweep Documentary） | live | lemo styles/dark-documentary · 上游 demo | `pipelines/leida/scripts/leida.py` | 52s |
| `liaotian` | 聊天叙事（Chat Narrative） | live | BB-Video styles/chat · 上游 promo | `pipelines/liaotian/scripts/liaotian.py` | 59s |
| `liuchang` | 流场风线（Flow-field Wind Lines） | live | lemo styles/flow-field · 上游 demo | `pipelines/liuchang/scripts/liuchang.py` | 52s |
| `luping` | 像素小人录屏（Mascot Screencast） | live | lemo styles/living-screencast · 上游 demo | `pipelines/luping/scripts/luping.py` | 59s |
| `mopian` | 1920s 默片（1920s Silent Film） | live | lemo styles/silent-film · 上游 demo | `pipelines/mopian/scripts/mopian.py` | 54s |
| `nihong` | 霓虹灯管（Neon Tubes） | live | lemo styles/neon-tubes · 上游 demo | `pipelines/nihong/scripts/nihong.py` | 48s |
| `puguang` | 双重曝光（Double Exposure） | live | lemo styles/double-exposure · 上游 demo | `pipelines/puguang/scripts/puguang.py` | 50s |
| `shibo` | 示波器数学（Oscilloscope Math） | live | lemo styles/oscilloscope-math · 上游 demo | `pipelines/shibo/scripts/shibo.py` | 51s |
| `xianshiqi` | 赛博 HUD（Cyber HUD） | live | Three.js + Canvas FUI 覆盖层 | `pipelines/xianshiqi/scripts/xianshiqi.py` | 30s |
| `xuanyi` | 悬疑探秘（Suspense Mystery） | live | BB-Video styles/mystery · 上游 promo | `pipelines/xuanyi/scripts/xuanyi.py` | 44s |
| `xuni` | 合成波 VHS（Synthwave VHS） | live | Three.js + Canvas + VHS 后处理 | `pipelines/xuni/scripts/xuni.py` | 30s |
| `yinghuo` | 萤火光点（Firefly Pointillism） | live | lemo styles/firefly-pointillism · 上游 demo | `pipelines/yinghuo/scripts/yinghuo.py` | 51s |
| `zhike` | 胶片直刻（Scratch Film） | live | lemo styles/scratch-film · 上游 demo | `pipelines/zhike/scripts/zhike.py` | 52s |
| `zhuomian` | 桌面卡片穿梭（Tabletop App Flythrough） | live | lemo styles/desktop-flythrough · 上游 demo | `pipelines/zhuomian/scripts/zhuomian.py` | 60s |
| `zifu` | CRT 字符终端（CRT ASCII Terminal） | live | lemo styles/ascii-crt · 上游 demo | `pipelines/zifu/scripts/zifu.py` | 60s |

## 08 · 地图地理　*Maps & Terrain*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `baimo` | 白模投影（Projection-Mapped Model） | live | lemo styles/white-model · 上游 demo | `pipelines/baimo/scripts/baimo.py` | 40s |
| `cehui` | 点云测绘（LiDAR Survey） | live | lemo styles/lidar-survey · 上游 demo | `pipelines/cehui/scripts/cehui.py` | 40s |
| `dietie` | 地铁线路图（Transit Map） | live | lemo styles/transit-map · 上游 demo | `pipelines/dietie/scripts/dietie.py` | 47s |
| `ditu` | 真实地形（Terrain Map） | live | WebGL · 高程驱动水面 | `pipelines/ditu/scripts/ditu.py` | 39s |
| `map` | 地图贴纸（Map Stickers） | live | Chrome 逐帧 + ffmpeg | `pipelines/map/scripts/map.py` | 544s |
| `moni` | 小人模拟实验（Blob Simulation） | live | lemo styles/pip-simulation · 上游 demo | `pipelines/moni/scripts/moni.py` | 52s |
| `recheng` | 热成像（Thermal Camera） | live | lemo styles/thermal-camera · 上游 demo | `pipelines/recheng/scripts/recheng.py` | 49s |
| `shiwu` | 数据实物化（Data Physicalization） | live | lemo styles/data-physical · 上游 demo | `pipelines/shiwu/scripts/shiwu.py` | 39s |
| `shuju` | 数据叙事（Data Storytelling） | live | lemo styles/dataviz · 上游 demo | `pipelines/shuju/scripts/shuju.py` | 50s |
| `weixing` | 卫星简报（Satellite Briefing） | live | lemo styles/satellite-briefing · 上游 demo | `pipelines/weixing/scripts/weixing.py` | 38s |

## 09 · 图纸说明　*Diagram & Blueprint*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `anjian` | 安检 X 光（Security X-ray） | live | lemo styles/security-xray · 上游 demo | `pipelines/anjian/scripts/anjian.py` | 52s |
| `bishi` | 笔式绘图仪（Pen Plotter） | live | lemo styles/pen-plotter · 上游 demo | `pipelines/bishi/scripts/bishi.py` | 50s |
| `blueprint` | 工程蓝图（Blueprint） | live | Canvas · Chrome 逐帧 | `pipelines/blueprint/scripts/blueprint.py` | 12s |
| `chaijie` | 产品拆解（Exploded Teardown） | live | lemo styles/teardown · 上游 demo | `pipelines/chaijie/scripts/chaijie.py` | 39s |
| `jianbao` | 工程简报板（Engineering Briefing Board） | live | lemo styles/briefing-board · 上游 demo | `pipelines/jianbao/scripts/jianbao.py` | 40s |
| `jixie` | 分色机械图解（Color-Coded Mechanism） | live | lemo styles/precise-mechanism · 上游 demo | `pipelines/jixie/scripts/jixie.py` | 52s |
| `liushui` | 流水线图解（Assembly-Line Diagram） | live | lemo styles/assembly-line-diagram · 上游 demo | `pipelines/liushui/scripts/liushui.py` | 55s |
| `parable` | 火柴人寓言（Stick-figure Parable） | live | Three.js · 固定广角 | `pipelines/parable/scripts/parable.py` | 178s |
| `poumian` | 线稿剖面图解（Line-Art Cutaway） | live | lemo styles/hardcore-info · 上游 demo | `pipelines/poumian/scripts/poumian.py` | 52s |
| `shuoming` | 说明书插画（Instruction Manual Art） | live | lemo styles/instruction-manual · 上游 demo | `pipelines/shuoming/scripts/shuoming.py` | 51s |
| `xianwei` | 显微镜下（Under the Microscope） | live | lemo styles/microscope · 上游 demo | `pipelines/xianwei/scripts/xianwei.py` | 40s |
| `xinxi` | 等距信息图（Isometric Infographic） | live | lemo styles/iso-infographic · 上游 demo | `pipelines/xinxi/scripts/xinxi.py` | 59s |

## 10 · 实拍混剪　*Live Footage*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `baozhuang` | 电视新闻包装（Broadcast News Package） | live | lemo styles/news-package · 上游 demo | `pipelines/baozhuang/scripts/baozhuang.py` | 54s |
| `dangan` | 档案看片台（Archive Light Table） | live | lemo styles/archive-lighttable · 上游 demo | `pipelines/dangan/scripts/dangan.py` | 40s |
| `daoshu` | 实时倒计时分屏（Live Countdown Split-screen） | live | lemo styles/countdown · 上游 demo | `pipelines/daoshu/scripts/daoshu.py` | 60s |
| `diaocha` | 视觉调查（Visual Investigation） | live | lemo styles/visual-investigation · 上游 demo | `pipelines/diaocha/scripts/diaocha.py` | 60s |
| `jiaoxiang` | 城市交响曲（City Symphony） | live | lemo styles/city-symphony · 上游 demo | `pipelines/jiaoxiang/scripts/jiaoxiang.py` | 52s |
| `jilupian` | 纪录片解说（Documentary） | live | S1–S9 流水线 | `pipelines/jilupian/scripts/jilupian.py` | 818s |
| `mengtai` | 构成主义蒙太奇（Constructivist Montage） | live | lemo styles/kino-montage · 上游 demo | `pipelines/mengtai/scripts/mengtai.py` | 60s |
| `shipai` | 实拍混剪（Live-footage Cut） | live | MoneyPrinterTurbo + ffmpeg | `pipelines/shipai/scripts/shipai.py` | 18s |
| `xinwen` | 1920s 新闻影片（1920s Newsreel） | live | lemo styles/newsreel · 上游 demo | `pipelines/xinwen/scripts/xinwen.py` | 55s |
| `zhanshu` | 体育战术板（Sports Telestrator） | live | lemo styles/telestrator · 上游 demo | `pipelines/zhanshu/scripts/zhanshu.py` | 54s |
| `zimu` | 字幕新闻（Caption News） | live | lemo styles/caption-news · 上游 demo | `pipelines/zimu/scripts/zimu.py` | 60s |

## 11 · 前端工位　*Front of House*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `peiyin` | 配音前端（Voice Front-end） | beta | GPT-SoVITS · 长稿分段合成 | `pipelines/peiyin/scripts/synthesize_dabao_paragraphs.py` | — |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `chanpin` | 玻璃质感产品（Glass Product Render） | live | lemo styles/glass-product · 上游 demo | `pipelines/chanpin/scripts/chanpin.py` | 32s |
| `chengshi` | 城市年轮（City Rings） | live | Three.js + Remotion | `pipelines/chengshi/scripts/chengshi.py` | 161s |
| `dengju` | 等轴 2.5D（Isometric 2.5D） | live | Three.js 正交场景 | `pipelines/dengju/scripts/dengju.py` | 30s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `gaoxiao` | 搞笑历史卡通（Comic History Cartoon） | live | lemo styles/comic-history · 上游 demo | `pipelines/gaoxiao/scripts/gaoxiao.py` | 51s |
| `goldenage` | 黄金卡通（Golden-age Toon） | live | Canvas · Chrome 逐帧 | `pipelines/goldenage/scripts/goldenage.py` | 30s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `isometric` | 等距微缩（Isometric Diorama） | live | Canvas · Chrome 逐帧 | `pipelines/isometric/scripts/isometric.py` | 30s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `jiezou` | 节奏综艺（Rhythm Game Show） | live | lemo styles/game-show · 上游 demo | `pipelines/jiezou/scripts/jiezou.py` | 149s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `jimu` | 积木玩具（Brick Toy） | live | lemo styles/brick-toy · 上游 demo | `pipelines/jimu/scripts/jimu.py` | 54s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `kehuan` | 科幻情景喜剧卡通（Sci-Fi Sitcom Toon） | live | lemo styles/scifi-toon · 上游 demo | `pipelines/kehuan/scripts/kehuan.py` | 58s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `labi2` | 蜡笔立体世界（Crayon World 3D） | live | lemo styles/crayon-world · 上游 demo | `pipelines/labi2/scripts/labi2.py` | 64s |
| `liti` | 纸片立体书（Paper Pop-up Book） | live | lemo styles/paper-popup · 上游 demo | `pipelines/liti/scripts/liti.py` | 133s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `manga` | 漫画分格（Manga Panels） | live | Canvas · Chrome 逐帧 | `pipelines/manga/scripts/manga.py` | 30s |
| `sailu` | 80 年代赛璐璐动画（80s Cel Anime） | live | lemo styles/cel-anime-80s · 上游 demo | `pipelines/sailu/scripts/sailu.py` | 59s |
| `tianshu` | 天书奇谭（Tianshu Cel） | live | ComfyUI + Wan2.2 | `pipelines/tianshu/scripts/tianshu.py` | 41s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `tuiyan` | 3D 战场推演（3D Battle Sim） | live | 3D 兵棋引擎 · 逐帧稳帧渲染 | `pipelines/tuiyan/scripts/tuiyan.py` | 540s |
| `weisuo` | 孟菲斯微缩（Memphis Diorama） | live | three.js 3D 微缩 + 法线/深度描边后处理 | `pipelines/weisuo/scripts/weisuo.py` | 45s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `weiyou` | 微游戏快闪（Microgame Frenzy） | live | lemo styles/microgame · 上游 demo | `pipelines/weiyou/scripts/weiyou.py` | 60s |
| `wushi` | 50s 扁平卡通（Mid-century Cartoon） | live | lemo styles/midcentury-toon · 上游 demo | `pipelines/wushi/scripts/wushi.py` | 40s |
| `xiangsu` | 像素风（Pixel Art） | live | Canvas · Puppeteer 逐帧 | `pipelines/xiangsu/scripts/xiangsu.py` | 29s |
| `xiangsu2` | 2.5D 像素（2.5D Pixel Art） | live | lemo styles/hd-2d · 上游 demo | `pipelines/xiangsu2/scripts/xiangsu2.py` | 76s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `yizhou` | 移轴微缩（Tilt-Shift Miniature） | live | lemo styles/tilt-shift · 上游 demo | `pipelines/yizhou/scripts/yizhou.py` | 38s |


---

## 怎么读一条管线

1. 打开 `<id>/SKILL.md`——完整流程、参数、验收条件、已知坑都在里面；
2. `python tools/validate.py` 看它是否被目录、`pipeline.json`、`SKILL.md` 三方一致地登记；
3. 想加一条新的，走 [CONTRIBUTING.md](../CONTRIBUTING.md) 的「加一条新管线四件事」。
