# 管线清单：155 条，一条一个命令

这份清单由 `tools/build_pipeline_doc.py` 从 `catalog/pipelines.json` 生成，是目录的镜像；
**入口与参数以各管线自己的 `SKILL.md` 为准**。这里回答的是「这条线现在能不能跑、从哪儿进、吃到什么输入」。

约定：

- **live** = 仓库里已有样片、入口脚本存在、`python tools/validate.py` 通过；
- **beta** = 代码与文档在，样片还没补齐；
- 命令都在仓库根目录执行，入口路径取 `pipeline.json` 的 `meta.entry`；不确定就 `--help`。

当前：**146 条 live / 9 条待补样片 / 11 个工位**。

## 01 · 纸本叙事　*Paper & Chronicle*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `jianying` | 纸本卡片（Paper-card Chronicle） | live | Remotion | `pipelines/jianying/scripts/jianying_shotcraft.py` | 211s |
| `lishi` | 纸本史话（Paper History） | live | Remotion | `pipelines/lishi/scripts/lishi.py` | 145s |
| `zhidiao` | 纸雕剪影（Paper-cut Lightbox） | live | HyperFrames | `pipelines/zhidiao/scripts/zhidiao_assemble.py` | 21s |

## 02 · 手绘笔触　*Hand & Pencil*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `baiban` | 白板讲解（Whiteboard Explainer） | live | 自研渲染 · vendor/runtime/stylekit.js（板写族） | `pipelines/baiban/scripts/baiban.py` | 111s |
| `biji` | 视觉笔记（Sketchnote） | live | 自研渲染 · vendor/runtime/stylekit.js（板写族） | `pipelines/biji/scripts/biji.py` | 51s |
| `bijia` | 毕加索蓝色时期（Picasso Blue Period） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/bijia/scripts/bijia.py` | 1s |
| `caiqian` | 彩铅科普（Colored-pencil Science） | live | G-buffer + 后处理 | `pipelines/caiqian/scripts/caiqian.py` | 27s |
| `dali` | 达利超现实（Dali Surrealism） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/dali/scripts/dali.py` | 1s |
| `fangao` | 梵高后印象（Van Gogh Post-Impressionism） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/fangao/scripts/fangao.py` | 1s |
| `gangbi` | 钢笔淡彩（Pen & Wash Sketch） | live | Canvas 逐帧 · 钢笔 + 水彩双层 | `pipelines/gangbi/scripts/gangbi.py` | 33s |
| `gaogeng` | 高更象征色（Gauguin Synthetism） | beta | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/gaogeng/scripts/gaogeng.py` | — |
| `guaerdi` | 瓜尔迪威尼斯（Guardi Venetian Atmosphere） | beta | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/guaerdi/scripts/guaerdi.py` | — |
| `heiban` | 黑板粉笔（Chalkboard） | live | 自研渲染 · vendor/runtime/stylekit.js（板写族） | `pipelines/heiban/scripts/heiban.py` | 49s |
| `huopu` | 霍普美国现实主义（Hopper American Realism） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/huopu/scripts/huopu.py` | 1s |
| `keer` | 科尔托纳巴洛克（Cortona Baroque） | beta | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/keer/scripts/keer.py` | — |
| `labi` | 蜡笔儿童绘本（Crayon Picture Book） | live | WebGL2 合成 + Canvas 逐帧 · 纸齿 / 蜡附着 / 水彩抗拒 | `pipelines/labi/scripts/labi.py` | 52s |
| `liti2` | 立体主义（Analytical Cubism） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/liti2/scripts/liti2.py` | 1s |
| `lunbo` | 伦勃朗明暗（Rembrandt Chiaroscuro） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/lunbo/scripts/lunbo.py` | 1s |
| `luolun` | 洛伦采蒂空间（Lorenzetti Civic Space） | beta | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/luolun/scripts/luolun.py` | — |
| `make` | 马克笔白纸速写（Marker on Paper） | live | 自研渲染 · vendor/runtime/stylekit.js（板写族） | `pipelines/make/scripts/make.py` | 52s |
| `mengke` | 蒙克表现主义（Munch Expressionism） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/mengke/scripts/mengke.py` | 1s |
| `pencil` | 铅笔测试（Pencil Test） | live | Canvas · Chrome 逐帧 | `pipelines/pencil/scripts/pencil.py` | 30s |
| `pingban` | 平板速写（Tablet Sketch） | live | 纯 Canvas · 零依赖 | `pipelines/pingban/scripts/pingban.py` | 39s |
| `qianhuang` | 铅黄浓彩（Giallo Gouache） | live | Canvas 逐帧 · 钢笔浓彩 + 彩色色片光 + 合成音效 | `pipelines/qianhuang/scripts/qianhuang.py` | 22s |
| `shouhui` | 逐帧手绘（Hand-drawn Cel） | live | Canvas 逐帧 · 浏览器渲染 | `pipelines/shouhui/scripts/shouhui.py` | 206s |
| `shuicai` | 水彩笔刷（Watercolor Brush） | live | Canvas 2D · 湿画法笔刷 + 纸张吸收 | `pipelines/shuicai/scripts/shuicai.py` | 114s |
| `wenyi` | 文艺复兴晕涂（High Renaissance Sfumato） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/wenyi/scripts/wenyi.py` | 1s |
| `xiajia` | 夏加尔记忆空间（Chagall Dream Space） | beta | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/xiajia/scripts/xiajia.py` | — |
| `xiula` | 修拉点彩（Seurat Pointillism） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/xiula/scripts/xiula.py` | 1s |
| `yibi` | 一笔画（One-line Drawing） | live | 自研渲染 · vendor/runtime/stylekit.js（板写族） | `pipelines/yibi/scripts/yibi.py` | 48s |
| `yinxiang` | 印象派（Impressionism） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/yinxiang/scripts/yinxiang.py` | 1s |
| `youhua` | 油画厚涂（Impasto Oil Painting） | live | 自研渲染 · vendor/runtime/stylekit.js（板写族） | `pipelines/youhua/scripts/youhua.py` | 40s |

## 03 · 传统工艺　*Traditional Crafts*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `aiji` | 埃及墓室壁画（Egyptian Wall Painting） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/aiji/scripts/aiji.py` | 1s |
| `boli` | 彩色玻璃窗（Stained Glass） | live | 自研渲染 · vendor/runtime/stylekit.js（纸艺族） | `pipelines/boli/scripts/boli.py` | 56s |
| `bosi` | 波斯细密画（Persian Miniature） | beta | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/bosi/scripts/bosi.py` | — |
| `dongxue` | 洞穴岩画（Cave Painting） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/dongxue/scripts/dongxue.py` | 1s |
| `dunhuang` | 敦煌壁画（Dunhuang Mural） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/dunhuang/scripts/dunhuang.py` | 1s |
| `fushihui` | 浮世绘（Ukiyo-e） | live | Canvas 2D · 分色版块 + 错版套印 | `pipelines/fushihui/scripts/fushihui.py` | 44s |
| `jianzhi` | 红色窗花剪纸（Red Paper-cut） | live | 自研渲染 · vendor/runtime/stylekit.js（纸艺族） | `pipelines/jianzhi/scripts/jianzhi.py` | 49s |
| `jinbo` | 金箔彩绘（Gilded Illumination） | live | 自研渲染 · vendor/runtime/stylekit.js（纸艺族） | `pipelines/jinbo/scripts/jinbo.py` | 47s |
| `kelimu` | 克里姆特金色（Klimt Golden Phase） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/kelimu/scripts/kelimu.py` | 1s |
| `laolang` | 上美影手绘（Shanghai Cel） | live | Canvas · Chrome 逐帧 | `pipelines/laolang/scripts/laolang.py` | 62s |
| `madisi` | 马蒂斯剪纸（Matisse Paper Cut-outs） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/madisi/scripts/madisi.py` | 1s |
| `pangbei` | 庞贝马赛克（Pompeii Mosaic） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/pangbei/scripts/pangbei.py` | 1s |
| `piying` | 皮影卡片（Shadow-puppet Cards） | live | Playwright + Canvas 逐帧 | `pipelines/piying/scripts/piying.py` | 272s |
| `shadow` | 皮影戏（Shadow Puppetry） | live | Canvas · Chrome 逐帧 | `pipelines/shadow/scripts/shadow.py` | 203s |
| `shuimo` | 纸本水墨（Ink Wash） | live | SVG + Canvas | `pipelines/shuimo/scripts/shuimo.py` | 30s |
| `shuimo2` | 中国水墨（Chinese Ink Wash） | live | Canvas 2D · 墨的浓淡/飞白/渗化 + 程序化宣纸 | `pipelines/shuimo2/scripts/shuimo2.py` | 48s |
| `tapestry` | 贝叶挂毯（Bayeux Tapestry） | live | Canvas · Chrome 逐帧 | `pipelines/tapestry/scripts/tapestry.py` | 30s |
| `xila` | 古希腊黑绘陶（Attic Black-Figure） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/xila/scripts/xila.py` | 1s |

## 05 · 平面图形　*Graphic & Motion*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `baohao` | 包豪斯几何（Bauhaus Shapes） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/baohao/scripts/baohao.py` | 52s |
| `bianping` | 扁平尺度漫游（Scale Zoom Explainer） | live | SVG 代码绘制 · 仓库内抓帧 | `pipelines/bianping/scripts/bianping.py` | 36s |
| `bopu` | 波普艺术（Pop Art） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/bopu/scripts/bopu.py` | 52s |
| `caojian` | 草间弥生波点（Kusama Polka Dots） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/caojian/scripts/caojian.py` | 1s |
| `fugu` | 复古版画拼贴（Vintage Engraving Collage） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/fugu/scripts/fugu.py` | 52s |
| `guaban` | 刮版画长镜头（Scratchboard Long Take） | live | 自研渲染 · vendor/runtime/stylekit.js（刻印族） | `pipelines/guaban/scripts/guaban.py` | 60s |
| `halin` | 凯斯·哈林（Keith Haring） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/halin/scripts/halin.py` | 1s |
| `huixingzhen` | 回形针风（Paperclip Explainer） | live | HTML 逐帧 · 确定性渲染 | `pipelines/huixingzhen/scripts/gen_episode.py` | 597s |
| `jiandie` | 60s 间谍片头（60s Spy Title Sequence） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/jiandie/scripts/jiandie.py` | 44s |
| `keli` | 扁平颗粒插画（Flat Grain Illustration） | live | Canvas · Chrome 逐帧（本地运行时） | `pipelines/keli/scripts/keli.py` | 93s |
| `kongban` | 孔版印刷（Risograph Print） | live | 自研渲染 · vendor/runtime/stylekit.js（网点族） | `pipelines/kongban/scripts/kongban.py` | 40s |
| `lvdong` | 剪影律动（Silhouette Rhythm） | live | Canvas + 着色器 · 代码合成配乐 | `pipelines/lvdong/scripts/lvdong.py` | 58s |
| `muke` | 木刻版画（Woodcut Print） | live | 自研渲染 · vendor/runtime/stylekit.js（刻印族） | `pipelines/muke/scripts/muke.py` | 58s |
| `muxia` | 慕夏新艺术（Mucha Art Nouveau） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/muxia/scripts/muxia.py` | 1s |
| `oupu` | 欧普艺术（Op Art） | live | Canvas · Chrome 逐帧（本地运行时） | `pipelines/oupu/scripts/oupu.py` | 22s |
| `ruishi` | 瑞士动态排版（Swiss Motion Graphics） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/ruishi/scripts/ruishi.py` | 44s |
| `shiliang` | 扁平矢量（Flat Vector） | live | SVG 单页 · 逐帧确定性渲染 | `pipelines/shiliang/scripts/shiliang.py` | 30s |
| `siyin` | 丝印旅行海报（Silkscreen Travel Poster） | live | 自研渲染 · vendor/runtime/stylekit.js（网点族） | `pipelines/siyin/scripts/siyin.py` | 50s |
| `tongban` | 铜版画（Copperplate Engraving） | live | 自研渲染 · vendor/runtime/stylekit.js（刻印族） | `pipelines/tongban/scripts/tongban.py` | 40s |
| `wangdian` | 网点档案（Halftone Dossier） | live | 自研渲染 · vendor/runtime/stylekit.js（网点族） | `pipelines/wangdian/scripts/wangdian.py` | 30s |
| `wenzi` | 文字闪切（Text Flash Cuts） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/wenzi/scripts/wenzi.py` | 46s |
| `xiangxing` | 象形运动图形（Pictogram Motion） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/xiangxing/scripts/xiangxing.py` | 50s |
| `yugao` | 电影预告（Movie Trailer） | live | Canvas · Chrome 逐帧（本地运行时） | `pipelines/yugao/scripts/yugao.py` | 83s |
| `zhuangshi` | 装饰艺术（Art Deco） | live | Canvas 2D · 金色渐变线 + 灯泡招牌 + 装饰字体排版 | `pipelines/zhuangshi/scripts/zhuangshi.py` | 39s |

## 06 · 屏幕赛博　*Screens & Neon*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `andiao` | 暗调励志（Dark Motivational） | live | Canvas · Chrome 逐帧（本地运行时） | `pipelines/andiao/scripts/andiao.py` | 165s |
| `biaoge` | 表格动画（Spreadsheet Film） | live | 自研渲染 · vendor/runtime/stylekit.js（屏幕族） | `pipelines/biaoge/scripts/biaoge.py` | 52s |
| `dianlu` | 电路板（Circuit Board） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/dianlu/scripts/dianlu.py` | 60s |
| `dianzhen` | 1-bit 点阵（1-bit Dither） | live | 自研渲染 · vendor/runtime/stylekit.js（像素族） | `pipelines/dianzhen/scripts/dianzhen.py` | 50s |
| `fabu` | 暗色科技发布（Dark Tech Keynote） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/fabu/scripts/fabu.py` | 42s |
| `guangzhui` | 光追 CGI（Ray-traced CGI） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/guangzhui/scripts/guangzhui.py` | 1s |
| `houshi` | 后室录像带（Liminal Found Footage） | live | 自研渲染 · vendor/runtime/stylekit.js（屏幕族） | `pipelines/houshi/scripts/houshi.py` | 60s |
| `leida` | 雷达扫描纪录片（Radar Sweep Documentary） | live | 自研渲染 · vendor/runtime/stylekit.js（摄影族） | `pipelines/leida/scripts/leida.py` | 52s |
| `liaotian` | 聊天叙事（Chat Narrative） | live | Canvas · Chrome 逐帧（本地运行时） | `pipelines/liaotian/scripts/liaotian.py` | 59s |
| `liuchang` | 流场风线（Flow-field Wind Lines） | live | 自研渲染 · vendor/runtime/stylekit.js（霓虹族） | `pipelines/liuchang/scripts/liuchang.py` | 52s |
| `luping` | 像素小人录屏（Mascot Screencast） | live | 自研渲染 · vendor/runtime/stylekit.js（屏幕族） | `pipelines/luping/scripts/luping.py` | 59s |
| `mopian` | 1920s 默片（1920s Silent Film） | live | 自研渲染 · vendor/runtime/stylekit.js（摄影族） | `pipelines/mopian/scripts/mopian.py` | 54s |
| `nihong` | 霓虹灯管（Neon Tubes） | live | 自研渲染 · vendor/runtime/stylekit.js（霓虹族） | `pipelines/nihong/scripts/nihong.py` | 48s |
| `puguang` | 双重曝光（Double Exposure） | live | 自研渲染 · vendor/runtime/stylekit.js（摄影族） | `pipelines/puguang/scripts/puguang.py` | 50s |
| `shibo` | 示波器数学（Oscilloscope Math） | live | 自研渲染 · vendor/runtime/stylekit.js（霓虹族） | `pipelines/shibo/scripts/shibo.py` | 51s |
| `xianshiqi` | 赛博 HUD（Cyber HUD） | live | Three.js + Canvas FUI 覆盖层 | `pipelines/xianshiqi/scripts/xianshiqi.py` | 30s |
| `xuanyi` | 悬疑探秘（Suspense Mystery） | live | Canvas · Chrome 逐帧（本地运行时） | `pipelines/xuanyi/scripts/xuanyi.py` | 44s |
| `xuni` | 合成波 VHS（Synthwave VHS） | live | Three.js + Canvas + VHS 后处理 | `pipelines/xuni/scripts/xuni.py` | 30s |
| `yinghuo` | 萤火光点（Firefly Pointillism） | live | 自研渲染 · vendor/runtime/stylekit.js（霓虹族） | `pipelines/yinghuo/scripts/yinghuo.py` | 51s |
| `zhike` | 胶片直刻（Scratch Film） | live | 自研渲染 · vendor/runtime/stylekit.js（摄影族） | `pipelines/zhike/scripts/zhike.py` | 52s |
| `zhuomian` | 桌面卡片穿梭（Tabletop App Flythrough） | live | 自研渲染 · vendor/runtime/stylekit.js（屏幕族） | `pipelines/zhuomian/scripts/zhuomian.py` | 60s |
| `zifu` | CRT 字符终端（CRT ASCII Terminal） | live | 自研渲染 · vendor/runtime/stylekit.js（屏幕族） | `pipelines/zifu/scripts/zifu.py` | 60s |

## 08 · 地图地理　*Maps & Terrain*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `baimo` | 白模投影（Projection-Mapped Model） | live | 自研渲染 · vendor/runtime/stylekit.js（立体族） | `pipelines/baimo/scripts/baimo.py` | 40s |
| `cehui` | 点云测绘（LiDAR Survey） | live | 自研渲染 · vendor/runtime/stylekit.js（地图族） | `pipelines/cehui/scripts/cehui.py` | 40s |
| `dietie` | 地铁线路图（Transit Map） | live | 自研渲染 · vendor/runtime/stylekit.js（地图族） | `pipelines/dietie/scripts/dietie.py` | 47s |
| `ditu` | 真实地形（Terrain Map） | live | WebGL · 高程驱动水面 | `pipelines/ditu/scripts/ditu.py` | 39s |
| `map` | 地图贴纸（Map Stickers） | live | Chrome 逐帧 + ffmpeg | `pipelines/map/scripts/map.py` | 544s |
| `moni` | 小人模拟实验（Blob Simulation） | live | 自研渲染 · vendor/runtime/stylekit.js（场族） | `pipelines/moni/scripts/moni.py` | 52s |
| `recheng` | 热成像（Thermal Camera） | live | 自研渲染 · vendor/runtime/stylekit.js（场族） | `pipelines/recheng/scripts/recheng.py` | 49s |
| `shiwu` | 数据实物化（Data Physicalization） | live | 自研渲染 · vendor/runtime/stylekit.js（地图族） | `pipelines/shiwu/scripts/shiwu.py` | 39s |
| `shuju` | 数据叙事（Data Storytelling） | live | 自研渲染 · vendor/runtime/stylekit.js（地图族） | `pipelines/shuju/scripts/shuju.py` | 50s |
| `weixing` | 卫星简报（Satellite Briefing） | live | 自研渲染 · vendor/runtime/stylekit.js（地图族） | `pipelines/weixing/scripts/weixing.py` | 38s |

## 09 · 图纸说明　*Diagram & Blueprint*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `anjian` | 安检 X 光（Security X-ray） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/anjian/scripts/anjian.py` | 52s |
| `bishi` | 笔式绘图仪（Pen Plotter） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/bishi/scripts/bishi.py` | 50s |
| `blueprint` | 工程蓝图（Blueprint） | live | Canvas · Chrome 逐帧 | `pipelines/blueprint/scripts/blueprint.py` | 12s |
| `chaijie` | 产品拆解（Exploded Teardown） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/chaijie/scripts/chaijie.py` | 39s |
| `jianbao` | 工程简报板（Engineering Briefing Board） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/jianbao/scripts/jianbao.py` | 40s |
| `jixie` | 分色机械图解（Color-Coded Mechanism） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/jixie/scripts/jixie.py` | 52s |
| `liushui` | 流水线图解（Assembly-Line Diagram） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/liushui/scripts/liushui.py` | 55s |
| `parable` | 火柴人寓言（Stick-figure Parable） | live | Three.js · 固定广角 | `pipelines/parable/scripts/parable.py` | 178s |
| `poumian` | 线稿剖面图解（Line-Art Cutaway） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/poumian/scripts/poumian.py` | 52s |
| `shuoming` | 说明书插画（Instruction Manual Art） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/shuoming/scripts/shuoming.py` | 51s |
| `xianwei` | 显微镜下（Under the Microscope） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/xianwei/scripts/xianwei.py` | 40s |
| `xinxi` | 等距信息图（Isometric Infographic） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/xinxi/scripts/xinxi.py` | 59s |

## 10 · 实拍混剪　*Live Footage*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `baozhuang` | 电视新闻包装（Broadcast News Package） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/baozhuang/scripts/baozhuang.py` | 54s |
| `dangan` | 档案看片台（Archive Light Table） | live | 自研渲染 · vendor/runtime/stylekit.js（摄影族） | `pipelines/dangan/scripts/dangan.py` | 40s |
| `daoshu` | 实时倒计时分屏（Live Countdown Split-screen） | live | 自研渲染 · vendor/runtime/stylekit.js（平面族） | `pipelines/daoshu/scripts/daoshu.py` | 60s |
| `diaocha` | 视觉调查（Visual Investigation） | live | 自研渲染 · vendor/runtime/stylekit.js（地图族） | `pipelines/diaocha/scripts/diaocha.py` | 60s |
| `jiaoxiang` | 城市交响曲（City Symphony） | live | 自研渲染 · vendor/runtime/stylekit.js（摄影族） | `pipelines/jiaoxiang/scripts/jiaoxiang.py` | 52s |
| `jilupian` | 纪录片解说（Documentary） | live | S1–S9 流水线 | `pipelines/jilupian/scripts/jilupian.py` | 818s |
| `mengtai` | 构成主义蒙太奇（Constructivist Montage） | live | 自研渲染 · vendor/runtime/stylekit.js（摄影族） | `pipelines/mengtai/scripts/mengtai.py` | 60s |
| `shipai` | 实拍混剪（Live-footage Cut） | live | MoneyPrinterTurbo + ffmpeg | `pipelines/shipai/scripts/shipai.py` | 18s |
| `xinwen` | 1920s 新闻影片（1920s Newsreel） | live | 自研渲染 · vendor/runtime/stylekit.js（摄影族） | `pipelines/xinwen/scripts/xinwen.py` | 55s |
| `zhanshu` | 体育战术板（Sports Telestrator） | live | 自研渲染 · vendor/runtime/stylekit.js（图纸族） | `pipelines/zhanshu/scripts/zhanshu.py` | 54s |
| `zimu` | 字幕新闻（Caption News） | live | 自研渲染 · vendor/runtime/stylekit.js（屏幕族） | `pipelines/zimu/scripts/zimu.py` | 60s |

## 11 · 前端工位　*Front of House*

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `peiyin` | 配音前端（Voice Front-end） | beta | GPT-SoVITS · 长稿分段合成 | `pipelines/peiyin/scripts/synthesize_dabao_paragraphs.py` | — |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `chanpin` | 玻璃质感产品（Glass Product Render） | live | 自研渲染 · vendor/runtime/stylekit.js（立体族） | `pipelines/chanpin/scripts/chanpin.py` | 32s |
| `chengshi` | 城市年轮（City Rings） | live | Three.js + Remotion | `pipelines/chengshi/scripts/chengshi.py` | 161s |
| `dengju` | 等轴 2.5D（Isometric 2.5D） | live | Three.js 正交场景 | `pipelines/dengju/scripts/dengju.py` | 30s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `gaoxiao` | 搞笑历史卡通（Comic History Cartoon） | live | 自研渲染 · vendor/runtime/stylekit.js（赛璐珞族） | `pipelines/gaoxiao/scripts/gaoxiao.py` | 51s |
| `goldenage` | 黄金卡通（Golden-age Toon） | live | Canvas · Chrome 逐帧 | `pipelines/goldenage/scripts/goldenage.py` | 30s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `isometric` | 等距微缩（Isometric Diorama） | live | Canvas · Chrome 逐帧 | `pipelines/isometric/scripts/isometric.py` | 30s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `jibuli` | 吉卜力水彩（Ghibli Watercolor） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/jibuli/scripts/jibuli.py` | 1s |
| `jiezou` | 节奏综艺（Rhythm Game Show） | live | 自研渲染 · vendor/runtime/stylekit.js（赛璐珞族） | `pipelines/jiezou/scripts/jiezou.py` | 149s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `jimu` | 积木玩具（Brick Toy） | live | 自研渲染 · vendor/runtime/stylekit.js（立体族） | `pipelines/jimu/scripts/jimu.py` | 54s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `kehuan` | 科幻情景喜剧卡通（Sci-Fi Sitcom Toon） | live | 自研渲染 · vendor/runtime/stylekit.js（赛璐珞族） | `pipelines/kehuan/scripts/kehuan.py` | 58s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `labi2` | 蜡笔立体世界（Crayon World 3D） | live | 自研渲染 · vendor/runtime/stylekit.js（板写族） | `pipelines/labi2/scripts/labi2.py` | 64s |
| `liti` | 纸片立体书（Paper Pop-up Book） | live | 自研渲染 · vendor/runtime/stylekit.js（立体族） | `pipelines/liti/scripts/liti.py` | 133s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `manga` | 漫画分格（Manga Panels） | live | Canvas · Chrome 逐帧 | `pipelines/manga/scripts/manga.py` | 30s |
| `nanfang` | 南方公园剪纸（South Park Cutout） | beta | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/nanfang/scripts/nanfang.py` | — |
| `pikesi` | 皮克斯三维（Pixar 3D） | beta | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/pikesi/scripts/pikesi.py` | — |
| `sailu` | 80 年代赛璐璐动画（80s Cel Anime） | live | 自研渲染 · vendor/runtime/stylekit.js（赛璐珞族） | `pipelines/sailu/scripts/sailu.py` | 59s |
| `tianshu` | 天书奇谭（Tianshu Cel） | live | ComfyUI + Wan2.2 | `pipelines/tianshu/scripts/tianshu.py` | 41s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `tuiyan` | 3D 战场推演（3D Battle Sim） | live | 3D 兵棋引擎 · 逐帧稳帧渲染 | `pipelines/tuiyan/scripts/tuiyan.py` | 540s |
| `weisuo` | 孟菲斯微缩（Memphis Diorama） | live | three.js 3D 微缩 + 法线/深度描边后处理 | `pipelines/weisuo/scripts/weisuo.py` | 45s |

## 99 · toon　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `weiyou` | 微游戏快闪（Microgame Frenzy） | live | 自研渲染 · vendor/runtime/stylekit.js（像素族） | `pipelines/weiyou/scripts/weiyou.py` | 60s |
| `wushi` | 50s 扁平卡通（Mid-century Cartoon） | live | 自研渲染 · vendor/runtime/stylekit.js（赛璐珞族） | `pipelines/wushi/scripts/wushi.py` | 40s |
| `xiangsu` | 像素风（Pixel Art） | live | Canvas · Puppeteer 逐帧 | `pipelines/xiangsu/scripts/xiangsu.py` | 29s |
| `xiangsu2` | 2.5D 像素（2.5D Pixel Art） | live | 自研渲染 · vendor/runtime/stylekit.js（像素族） | `pipelines/xiangsu2/scripts/xiangsu2.py` | 76s |
| `xinhai` | 新海诚光影（Makoto Shinkai Light） | live | 自研渲染 · huashu 引擎（本地 vendored） | `pipelines/xinhai/scripts/xinhai.py` | 1s |

## 99 · d3　**

| id | 名称 | 状态 | 引擎 | 入口 | 样片 |
| --- | --- | --- | --- | --- | --- |
| `yizhou` | 移轴微缩（Tilt-Shift Miniature） | live | 自研渲染 · vendor/runtime/stylekit.js（立体族） | `pipelines/yizhou/scripts/yizhou.py` | 38s |


---

## 怎么读一条管线

1. 打开 `<id>/SKILL.md`——完整流程、参数、验收条件、已知坑都在里面；
2. `python tools/validate.py` 看它是否被目录、`pipeline.json`、`SKILL.md` 三方一致地登记；
3. 想加一条新的，走 [CONTRIBUTING.md](../CONTRIBUTING.md) 的「加一条新管线四件事」。
