# 字体（不进仓库）

60 MB 的字体不该躺在 git 历史里——每次 clone 都要为它付带宽，法律上还要单独审一遍。所以这里**只放清单，不放字体**。

第一次用（或者换了台机器）：

```bash
python tools/sync_fonts.py --fetch     # 按 fonts.json 的地址下载，校验 SHA256
python tools/sync_fonts.py             # 复制到各工程目录（渲染器只服务工程目录这一个根）
```

下载下来的 `.ttf` 被 `.gitignore` 忽略，不会出现在 `git status` 里。

| 文件 | 授权 | 用途 |
|---|---|---|
| `NotoSerifSC.ttf` | OFL-1.1 | 正文、标题（`jianying` / `lishi`） |
| `LXGWWenKai-Regular.ttf` | OFL-1.1 | 楷体替代（没有系统楷体的机器） |
| `AlibabaPuHuiTi-3-85-Bold.ttf` | 阿里巴巴普惠体免费商用 | 大字标题（`dengju` / `shiliang` / `xianshiqi` / `xuni`） |
| `LongCang-Regular.ttf` | OFL-1.1 | 手写旁注（`shouhui` / `shuimo`） |
| `LXGWMarkerGothic-Regular.ttf` | OFL-1.1 | 马克笔标注 |

`KaiTi` 不在这里：它是微软 Windows 自带字体，不可再分发。`tools/sync_fonts.py` 会从
`%WINDIR%/Fonts/simkai.ttf`（macOS `STKaiti`、Linux `ukai`）复制，或者用 `BV_FONT_KAI` 指到你想用的楷体文件；
系统没有楷体时降级到霞鹜文楷。

授权细节见根目录 `THIRD_PARTY_NOTICES.md`。
