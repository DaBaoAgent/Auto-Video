# huashu-art-motion 风格接入记录

**一句话**：上游 53 张风格配方逐条对照后，接 31 条（23 条实做带样片 + 8 条研究配方只出封面），
其余 22 条按「同族等价 / 同族变体」留在原管线，不重复开卡。处置表是唯一事实来源：
[`tools/huashu_style_map.json`](../tools/huashu_style_map.json)。

来源：[alchaincyf/huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) v1.3.1（MIT）。

## 计数

| 处置 | 条数 | 含义 |
| --- | ---: | --- |
| 新接入 | 31 | 本仓库此前没有这条画法；引擎已 vendored，入口可出风格段 |
| 同族等价 | 12 | 与已有管线画法/交付片型重复，保留已有那条 |
| 同族变体 | 10 | 上游自己就是同一画法的变体（画家版、重做版），只留代表那条 |

## 31 条新管线

| 管线 id | 上游配方 | 中文名 | 工位 | 双拼来源 |
| --- | --- | --- | --- | --- |
| `dongxue` | 01_cave | 洞穴岩画 | craft | dongxue = 洞穴岩画 |
| `aiji` | 02_egypt | 埃及墓室壁画 | craft | aiji = 埃及 |
| `xila` | 03_greek | 古希腊黑绘陶 | craft | xila = 希腊 |
| `pangbei` | 04_roman | 庞贝马赛克 | craft | pangbei = 庞贝 |
| `wenyi` | 06_renaissance | 文艺复兴晕涂 | hand | wenyi = 文艺复兴 |
| `yinxiang` | 08_impressionism | 印象派 | hand | yinxiang = 印象 |
| `fangao` | 09_postimp | 梵高后印象 | hand | fangao = 梵高 |
| `muxia` | 10_nouveau | 慕夏新艺术 | graphic | muxia = 慕夏 |
| `liti2` | 11_cubism | 立体主义 | hand | liti 已被纸片立体书占用，按 shuimo2 / labi2 加 2 |
| `guangzhui` | 15_raytrace | 光追 CGI | screen | guangzhui = 光追 |
| `kelimu` | 18_klimt | 克里姆特金色 | craft | kelimu = 克里姆 |
| `mengke` | 19_munch | 蒙克表现主义 | hand | mengke = 蒙克 |
| `dunhuang` | 20_dunhuang | 敦煌壁画 | craft | dunhuang = 敦煌 |
| `caojian` | 21_kusama | 草间弥生波点 | graphic | caojian = 草间 |
| `dali` | 23_dali | 达利超现实 | hand | dali = 达利 |
| `huopu` | 24_hopper | 霍普美国现实主义 | hand | huopu = 霍普 |
| `jibuli` | 25_ghibli | 吉卜力水彩 | toon | jibuli = 吉卜力 |
| `xiula` | 29_seurat | 修拉点彩 | hand | xiula = 修拉 |
| `madisi` | 30_matisse | 马蒂斯剪纸 | craft | madisi = 马蒂斯 |
| `halin` | 31_haring | 凯斯·哈林 | graphic | halin = 哈林 |
| `lunbo` | 32_rembrandt | 伦勃朗明暗 | hand | lunbo = 伦勃 |
| `xinhai` | 35_shinkai | 新海诚光影 | toon | xinhai = 新海 |
| `bijia` | 36_picasso_blue | 毕加索蓝色时期 | hand | bijia = 毕加 |
| `guaerdi` | 42_guardi | 瓜尔迪威尼斯 | hand | guaerdi = 瓜尔迪 |
| `luolun` | 43_lorenzetti | 洛伦采蒂空间 | hand | luolun = 洛伦 |
| `keer` | 44_cortona | 科尔托纳巴洛克 | hand | keer = 科尔 |
| `gaogeng` | 48_gauguin | 高更象征色 | hand | gaogeng = 高更 |
| `xiajia` | 49_chagall | 夏加尔记忆空间 | hand | xiajia = 夏加 |
| `bosi` | 51_persian_miniature | 波斯细密画 | craft | bosi = 波斯 |
| `nanfang` | 52_south_park | 南方公园剪纸 | toon | nanfang = 南方 |
| `pikesi` | 53_pixar | 皮克斯三维 | toon | pikesi = 皮克 |

命名沿用仓库传统：中文名取头两个字双拼，全小写无分隔符；撞车时用既有 `shuimo2` / `labi2` /
`xiangsu2` 的做法加序号（本批只有 `liti2`）。31 个 id 与原有 124 条全部不撞车。

## 12 条同族等价（保留已有管线）

| 上游 | 中文名 | 保留 | 理由 |
| --- | --- | --- | --- |
| 05_gothic | 哥特泥金手抄本 | `jinbo` | 金箔逐像素压花＋泥金，与金箔彩绘同一画法 |
| 12_bauhaus | 包豪斯 | `baohao` | 纯几何构成＋施莱默人偶 |
| 13_pop | 波普艺术 | `bopu` | 本戴点＋粗黑描边 |
| 14_8bit | 8-bit 像素 | `xiangsu` | 逐像素索引色 |
| 16_2026 | 当代扁平插画 | `keli` | 颗粒点彩＋无描边色块 |
| 17_ink | 中国水墨写意 | `shuimo` | 毛笔飞白＋墨晕＋留白＋钤印 |
| 22_constructivism | 俄国构成主义 | `mengtai` | 灰度网点＋红楔黑圆 |
| 26_vaporwave | 蒸汽波 | `xuni` | 霓虹辉光＋透视网格＋VHS |
| 27_kirby | 漫威 Kirby | `bopu` | 四色网点＋套色错位的美式漫画印刷 |
| 33_rubberhose | 1930 橡皮管卡通 | `goldenage` | 派切眼、面条臂、12fps 步进 |
| 34_shadowpuppet | 中国皮影 | `shadow` | 牛皮镂空＋铆钉关节＋幕后油灯 |
| 37_rick_morty | Rick & Morty | `kehuan` | 圆角细描边＋平涂的科幻情景喜剧卡通 |

## 10 条同族变体（只留代表那条）

| 上游 | 中文名 | 归到 | 理由 |
| --- | --- | --- | --- |
| 28_monet | 莫奈睡莲 | `08_impressionism` | 同一印象派短笔触，不按画家开卡 |
| 38_giotto | 乔托 | `06_renaissance` | 文艺复兴同一条线索的研究配方 |
| 39_piero | 皮耶罗 | `06_renaissance` | 同上 |
| 40_raphael | 拉斐尔 | `06_renaissance` | 盛期文艺复兴研究配方 |
| 41_michelangelo | 米开朗基罗 | `06_renaissance` | 盛期文艺复兴研究配方 |
| 45_renoir | 雷诺阿 | `08_impressionism` | 同一印象派画法 |
| 46_pissarro | 毕沙罗 | `08_impressionism` | 同一印象派画法 |
| 47_sisley | 西斯莱 | `08_impressionism` | 同一印象派画法 |
| 50_ma_yuan | 马远 | `17_ink` | 同一中国水墨画法 |
| 55_dunhuang | 敦煌壁画（重做） | `20_dunhuang` | 同一敦煌壁画的重做研究版 |

## 9 种解说语法为什么没接

上游另有 9 份「解说语法卡」（Kurzgesagt / Vox / 白板 / storytime / 动态文字 / 3Blue1Brown /
发布会 / 财经图表 / 讲解员）。它们是「怎么讲」的语法，不是「怎么画」的风格；其中白板、Vox、
动态文字、发布会、财经图表、尺度漫游这几种交付形态，仓库已有 `baiban`、`huixingzhen`、`wenzi`、
`fabu`、`shuju`、`bianping` 对应。本批只接风格，语法按需后续单独接。

## 引擎与样片

- 引擎：`vendor/huashu-art-motion/engine/`（场景、转场、绘画库、字体），全仓库共享；入口只调本地
  `render.py`，不依赖外部 checkout。`render.py` 加了一个环境变量补丁：`CHROME_PATH` 指本机
  Chrome/Edge；两个都没设时退回 Playwright 自带 chromium。
- 样片：23 条实做从上游 Release 的 `art-motion-35-styles.mp4` 按段切（每段 5 个八分音符 ≈ 1.17 s），
  进 `site/media/<id>.mp4` + 同名封面；8 条研究配方上游没有成片，只取原型单帧作封面，站点卡片
  显示「研究配方」。
- 不入库：`demos/`（含花叔角色帧，上游明确不随 MIT 授权）、`reference_films/`、Clawd 素材、
  上游总览图与示范视频。

## 已知限制

- 23 条实做里 22 条是 ★★ 以上，`lunbo`（伦勃朗）上游自评 ★（人物扁平），先按 beta 入库。
- 8 条研究配方是上游自己标注「未达实做」的水平（自评 65–82、独立复核 53–74），只作风格底座，
  不当作可直接交付的成片画法。
- 样片是上游同一构图的速通片段，不是这些风格的题材构图；接新题材时按配方卡重新构图。
- 引擎是共享目录，升级时整目录替换，单条管线不做分叉。
