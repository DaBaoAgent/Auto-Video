# 魔搭 + 智谱 + Cloudflare API 实测报告（《从夏到秦》素材替代方案）

测试时间：2026-10-24 20:00–21:00
测试对象：未完成的 s001 静帧、s02 首帧视频（Agnes 卡队列的部分）
测试输出目录：`content/warring-states-20min/shots/_ms-test/`（独立目录，不影响 Agnes 管线的 assets.json）
测试脚本：`tools/zhidiao/zhipu_test.py`、`tools/zhidiao/zhipu_video_retry.py`
密钥：已统一写入项目 `.env`（ZHIPU_API_KEY / MODELSCOPE_API_KEY / CF_ACCOUNT_ID / CF_API_TOKEN，已 gitignore）

## 一、魔搭 ModelScope（token: ms-…，已邮箱验证）

### 结论：生图可用且风格命中率高；视频 API 不可用

| 项 | 结果 |
|---|---|
| 生图模型 | `Qwen/Qwen-Image`（异步任务制） |
| 风格命中 | **真·像素画**，比 CogView-3-Flash 好得多；无水印 |
| 尺寸控制 | `"size": "1344x768"` 字符串参数有效（`image_size:{w,h}` 对象无效，会出竖图） |
| 速度 | 提交后约 20–30 秒出图（含轮询间隔） |
| 额度 | 每天 2000 次总量（生成类模型独立配额） |
| 视频 | ❌ `Wan-AI/*` 全部报 "Invalid model provider"——**视频生成未对 API 开放**，只有网页端 AIGC 专区可用 |

### 正确调用方式（关键坑都在请求头/参数）

```bash
# 1) 提交（必须带 X-ModelScope-Async-Mode: true）
curl -X POST https://api-inference.modelscope.cn/v1/images/generations \
  -H "Authorization: Bearer $MS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "X-ModelScope-Async-Mode: true" \
  -d '{"model":"Qwen/Qwen-Image","prompt":"…","size":"1344x768"}'
# → {"task_status":"SUCCEED","task_id":"…"}   (task_status 字段无意义，别信)

# 2) 轮询（必须带 X-ModelScope-Task-Type: image_generation，否则报 task not found）
curl -H "Authorization: Bearer $MS_TOKEN" \
     -H "X-ModelScope-Task-Type: image_generation" \
     https://api-inference.modelscope.cn/v1/tasks/{task_id}
# → RUNNING… → SUCCEED 后取 output_images[0] 直接 GET 下载
```

### 坑位记录
1. 查询结果漏带 `X-ModelScope-Task-Type` 头 → "task not found"（500）。
2. 提交响应里的 `task_status:"SUCCEED"` 是提交成功的意思，不是生成完成。
3. `image_size:{width,height}` 对象参数被忽略；要用 `"size":"宽x高"` 字符串。
4. AIGC 需要账号完成邮箱验证（modelscope.cn/my/settings/account），否则报 Magicubes 拦截。
5. `/v1/models` 列表只返回 37 个（全是 LLM+Qwen-Image-Edit），不代表实际可调范围；社区开了 API-Inference 的模型都能按上面方式调。

## 二、智谱 BigModel（key: …89，账户充值 200 元）

### 生图：CogView-3-Flash ✅ 快，但风格不粘

| 项 | 结果 |
|---|---|
| 速度 | **提交+出图 10 秒**，全场最快 |
| 输出 | 1344×768 |
| 风格 | ⚠️ 偏手绘插画，**没有服从"复古像素艺术"约束**；右下角带"AI生成"水印 |
| 适配建议 | 只适合场景氛围图；像素小人/定妆照不如 Qwen-Image |

### 视频：CogVideoX-Flash ❌ 今晚全程限流；付费档余额不足

实测时间线（20:12–20:55，全部用 s02 已批准图 1280 宽 JPEG 首帧 161KB）：

| 模型 | 结果 |
|---|---|
| `cogvideox-flash`（免费） | 连续 **40+ 分钟**全部 `1305「访问量过大」`（12 次指数退避重试全失败；前台 429 复测仍失败） |
| `cogvideox` / `cogvideox-2b` | `1211 模型不存在`（老模型已下线） |
| `cogvideox-2` / `cogvideox-3`（付费） | `1113 余额不足或无可用资源包` —— **账户视频余额不足**，需到 open.bigmodel.cn 控制台核实那 200 元去向（可能被 LLM 调用消耗，或充到别的产品线） |
| `cogvideox-3-flash` / `cogvideox-3-turbo` | `500 内部错误`（平台侧，反复复测一致） |

- i2v 请求参数本身已验证格式正确：`image_url` 接受裸 base64，`quality:"speed"`、`with_audio:false`、`fps:30`；错误全部来自平台侧。
- **已启动通宵重试器** `tools/zhidiao/zhipu_video_retry.py`（后台运行，8 小时上限）：每 10 分钟搏一次免费 flash，成功自动下载 `_ms-test/s02-zhipu.mp4`；日志在 `logs/zhipu/retry-s02.log`。
- 结论：智谱视频免费档和 Agnes 一样是"抢队列"模式，**不能当确定性产能**，只能错峰捡漏。

## 二·五、Cloudflare Workers AI（2026-10-24 20:26 加入测试）

| 项 | 结果 |
|---|---|
| 端点 | POST `https://api.cloudflare.com/client/v4/accounts/{acc}/ai/run/@cf/black-forest-labs/flux-1-schnell` |
| 速度 | **7.4 秒/张**（含网络），全场最快 |
| 输出 | 1024×1024 **固定正方形**，无尺寸/宽高比参数 |
| 风格 | 扁平插画/极简矢量风，**不是像素风**，但干净无水印 |
| 额度 | 每天 10k neurons ≈ 200+ 张 |
| 适配建议 | 适合做封面、过渡图、方形比例素材；**不适合 16:9 分镜静帧**（比例不符） |

## 三、三方横向对比（s001 同题实测）

| 维度 | 魔搭 Qwen-Image | 智谱 CogView-3-Flash | Cloudflare FLUX schnell |
|---|---|---|---|
| 出图速度 | 20–30s | **10s** | **7.4s** |
| 尺寸控制 | ✅ 1344×768 等任意 | ✅ 16:9 | ❌ 固定 1024² |
| 像素风命中 | ✅ **真像素画** | ❌ 插画风 | ❌ 扁平插画 |
| 水印 | 无 | ⚠️ "AI生成"角标 | 无 |
| 免费额度 | 2000 次/天 | 免费 | ~200 张/天 |
| 参考图(i2i) | ❌（有 Qwen-Image-Edit 待测） | ❌ | ❌ |

**推荐分工：静帧/定妆主力 = 魔搭 Qwen-Image；方形素材/封面 = Cloudflare；智谱图不用；视频 = 智谱免费档错峰捡漏（重试器已挂）。**

## 三、对《从夏到秦》管线的落地建议

1. **定妆照/静帧生图主通道换魔搭 Qwen-Image**：风格命中高（像素画）、无水印、20-30 秒/张、每天 2000 张额度远超需求（333 镜全片也够）。
   - 限制：纯 t2i，**没有 img2img 参考图**——人物一致性要靠"定妆照 prompt 模板 + 固定措辞"或用 Qwen-Image-Edit 通道改造（已确认 Qwen/Qwen-Image-Edit 在可调列表里，后续可测）。
2. **视频走智谱 CogVideoX-Flash**（免费但需错峰退避），确认不通再考虑付费 cogvideox。
3. Agnes 保留为备胎；它目前还在后台正常出 char 定妆照，不打断。
4. Agnes 的 2K 分辨率（2624px）> Qwen-Image 的 1344px；如需 2K 可在 prompt 里要求大尺寸测试，或后期超分。

## 四、本次产出文件

- `content/warring-states-20min/shots/_ms-test/s001-zhipu.png`（智谱，1344×768，插画风+水印）
- `content/warring-states-20min/shots/_ms-test/s001-ms.png`（魔搭，竖图，参数教训样本）
- `content/warring-states-20min/shots/_ms-test/s001-ms-landscape.png`（魔搭，1344×768，像素风，**推荐样张**）
- `content/warring-states-20min/shots/_ms-test/s001-cf.png`（Cloudflare，1024×1024，扁平插画风，7.4s）
- `content/warring-states-20min/shots/_ms-test/s02-firstframe.jpg`（s02 首帧缩图，供 i2v 用）
- `tools/zhidiao/zhipu_test.py`（智谱生图/视频测试，读 .env）
- `tools/zhidiao/zhipu_video_retry.py`（通宵重试器，成功自动落 s02-zhipu.mp4）

## 五、待办

1. 明早看 `logs/zhipu/retry-s02.log`：若 s02-zhipu.mp4 已落盘，走 §10 质检清单 + ffprobe 核验。
2. 到智谱控制台核实余额（1113 报错），若要确定性视频产能，充视频资源包后用 `cogvideox-3`（已验证模型名有效、请求格式正确）。
3. 魔搭 Qwen-Image-Edit 通道待测：若能"参考定妆照生成新姿势/新场景"，即可补齐 Agnes i2i 的人物一致性能力。
