# 交付契约（2026-11-11 宝哥定，硬规则）

**成片完成后只有两件事由 laolang 自己做：移动成片、建交付子目录。封面与发布信息一律调用
`D:\@kaifa\fengmian`，不在 laolang 里重复实现。**

## 一、目录结构

```text
D:\@kaifa\Auto-Video\laolang\out\
└── <三位序号> <片名>\
    ├── <片名>_全片.mp4          # 成片（H.264 + AAC 192k）
    ├── 封面-4比3.png            # 2048×1536（fengmian 出图）
    ├── 封面-3比4.png            # 1536×2048（fengmian 出图）
    ├── 发布信息.txt              # 两行制：标题 + 4 个话题
    └── 源文件/
        ├── 封面提示词-4比3.txt
        ├── 封面提示词-3比4.txt
        ├── 封面元信息.json
        ├── <片名>_字幕.srt
        ├── <片名>_署名.txt
        └── 旧交付-<日期>/        # 旧版成片、旧封面、旧发布信息等
```

- **序号**：从 `001` 起，取 `out/` 里已有最大序号 +1；不复用、不跳号。
- **片名**：发布用中文片名（不是工程目录名），子目录与成片文件同名。
- 交付根只放上面 3 类文件 + `源文件/`；名字带 `封面 / cover / 即梦 / 提示词` 的多余文件
  会被 fengmian 门禁拦下。
- 已发布成片归档到 `out/@已发/<序号> <片名>/`。

## 二、封面与发布信息由 fengmian 生成

### 2.1 工程侧只需一份 `delivery.json`

放在工程根（或 `out/`），字段：

```json
{
  "name": "会飞的中国人",
  "cover_main": "会飞的中国人",
  "cover_sub": "一个人骑车绕地球",
  "publish_title": "会飞的中国人：90年前骑车跑赢飞机",
  "tags": "#会飞的中国人 #潘德明 #环球旅行 #民国往事",
  "style": "laolang",
  "scene43": "1930 年代澳大利亚山间土路，黄昏暖金逆光……",
  "scene34": "米白色双翼小飞机从右上角贴着山脊低飞……"
}
```

- `cover_main` 必须 **恰好 6 字**（金色粗毛笔主标），`cover_sub` 必须 **恰好 8 字**（白色毛笔副标）。
- `publish_title` 必须 **≤25 字、两段式（：/？/！）、含阿拉伯数字**。
- `tags` 必须 **恰好 4 个**，空格分隔。
- `style` 用 fengmian 预设：laolang / tuiyan / auto。
- `scene43` / `scene34` 分别写横版、竖版的画面描述（不含文字排版，fengmian 会自动拼版头与标题规则）。

### 2.2 fengmian 三个动作

```bash
# 1) 发布信息 + 两张封面提示词 + 元信息（进 源文件/）
python D:\@kaifa\fengmian\fengmian.py build --src <交付目录>\源文件\<片名>_字幕.srt \
  --out <交付目录> --name <片名> \
  --main <6字主标> --sub <8字副标> --style laolang \
  --scene43 "<横版画面>" --scene34 "<竖版画面>" \
  --title "<两行制标题>" --tags "<4个话题>"

# 2) 出图（需要 ARK_API_KEY；输出 封面-4比3.png / 封面-3比4.png）
python D:\@kaifa\fengmian\fengmian.py covers --dir <交付目录> --backend ark

# 3) 门禁：根目录不得有多余封面/提示词
python D:\@kaifa\fengmian\fengmian.py gate --dir <交付目录> --dry-run
```

规格由 fengmian 固化，laolang 不再自定义：

| 项 | fengmian 规格 |
|---|---|
| 封面 4:3 | `2048×1536`，`封面-4比3.png` |
| 封面 3:4 | `1536×2048`，`封面-3比4.png` |
| 版头 | 6 字金黄粗毛笔主标 + 8 字白色毛笔副标 |
| 发布信息 | 恰好两行；标题 ≤25 字、两段式、含阿拉伯数字；第二行恰好 4 个 `#话题` |
| 门禁 | 根目录只许成片 / 两张封面 / `发布信息.txt` / 任意子目录 |

## 三、交付命令

```bash
python scripts/laolang.py deliver projects/<工程> --name "片名" --title "片名"
# 默认根目录 <laolang>/out，序号自动 +1；输出 out/<序号> <片名>/
```

`deliver` 的实际动作：

1. 先跑 `qa`（响度 / 黑帧 / 解码不过则非 0 退出）。
2. 建 `out/<序号> <片名>/`，把成片移进去；srt、署名放进 `源文件/`。
3. 读工程的 `delivery.json`，调用 `fengmian build` 生成 `发布信息.txt` 与封面提示词。
4. 有 `ARK_API_KEY` 时调用 `fengmian covers` 出两张封面；没有则留下提示词并提示待出图。
5. 校验封面尺寸（2048×1536 / 1536×2048）；缺封面时默认报错（`--allow-missing` 可先交）。
6. 调用 `fengmian gate --dry-run` 过交付门禁。

## 四、验收清单

1. `qa` OK（-16±1.5 LUFS、真峰值 ≤ -1.5 dBTP、0 长黑帧、0 解码错误）。
2. `shots` PASS；`sync --ocr` PASS（音频滞后 ≤40 ms、逐句起点中位偏 ≤0.30 s、超差 ≤20%）。
3. 两张封面尺寸正确（2048×1536 / 1536×2048），标题恰好 6 + 8 字，无错字。
4. `发布信息.txt` 恰好两行；标题 ≤25 字、两段式、含阿拉伯数字；恰好 4 个话题。
5. `out/<序号> <片名>/` 顶层只有成片 + 两张封面 + `发布信息.txt` + `源文件/`。
