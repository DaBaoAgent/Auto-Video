# 免费生图/生视频 API 调研（替代 Agnes，像素小人历史故事场景）

调研日期：2026-10-24
背景：当前管线用 Agnes（`agnes-image-2.5-flash`）生图 + 首帧 i2v 视频，痛点是**视频队列长期满员、排队数小时**。需求：能接 API、有免费额度、出图/出视频快、效果过得去（像素小人风格容错高，质量要求低）。

## 一句话结论

**主力换智谱 BigModel（一个 Key 同时解决生图 + 图生视频，免费、国内直连），备用挂魔搭 ModelScope（Wan i2v，每天 2000 次）和 Cloudflare Workers AI（FLUX schnell，出图最快），Pollinations 做零 Key 兜底。**

## 生图候选（按速度排序）

| 平台 | 免费额度 | 速度 | 国内直连 | Key | 备注 |
|---|---|---|---|---|---|
| Cloudflare Workers AI | 每天 10k neurons ≈ **230 张 FLUX 图/天** | **~2 秒/张**（schnell 4 步） | ✅ | 需 Account ID + Token | FLUX.1 [schnell]，Apache 2.0 可商用；适合高频批量 |
| 智谱 CogView-3-Flash | 永久免费 | 快（数秒级） | ✅ | 手机号注册 | 与 CogVideoX-Flash 同一 Key，统一接入首选 |
| 魔搭 ModelScope | **每天 2000 次**（单模型动态限流 500 次） | 快，排队少 | ✅ | 绑阿里云 + 实名，Access Token | Qwen-Image 等；中文提示词理解好 |
| Pollinations.ai | 匿名免费，约 **1 张/40 秒**（否则 402） | 慢（但可多 Key/多 IP 加速） | 需代理 | **无需 Key**，URL 即出图 | 匿名档模型只有 Sana；质量一般，做兜底合适 |
| 阿里百炼 DashScope | 新用户赠额（约千万级 Token），部分模型限时免费 | 快 | ✅ | 注册 | qwen-image；额度是一次性的，当尝鲜用 |
| 硅基流动 | 注册送约 14-16 元；生图模型多数计费 | 快 | ✅ | 注册 | 文本模型免费多，**生图不保证免费**，别当主力 |

## 生视频候选（免费是稀缺品，重点看这里）

| 平台 | 免费额度 | 能力 | 速度 | 备注 |
|---|---|---|---|---|
| **智谱 CogVideoX-Flash** | **永久免费** | 文生视频 + **图生视频（首帧 i2v）**，最长 10s，30/60fps | 异步任务 + 轮询；`quality="speed"` 模式出片快 | 与现有 Agnes 客户端同为「提交任务→轮询→下载」模式，改造成本最低 |
| 魔搭 ModelScope API | 每天 2000 次（含视频生成类） | Wan2.2 系 T2V/**I2V** | 有实测称"无水印、不排队、生成快" | 生成类模型有独立配额，跑批量前先小量验证 |
| 阿里百炼 wan2.x-t2v/i2v | 新用户限时免费 | T2V/I2V | 快 | 一次性额度，适合囤一批样片 |
| 腾讯混元视频 | 免费体验范围（每日协作奖励 200-500 万 Token） | 视频 | 未知 | 额度不绑定模型，但视频消耗大，仅作了解 |
| Agnes（现状） | 免费（新功能，无稳定性承诺） | 生图+视频 | **队列长期满员** | 据社区实测属"6 月新出的尝鲜款，别上生产" |

## 推荐落地组合（贴合现有管线）

1. **主力：智谱 BigModel（open.bigmodel.cn）**
   - 生图：`CogView-3-Flash`（免费）
   - 视频：`CogVideoX-Flash`，`image_url` 支持 base64 或公网 URL，`quality="speed"`，`with_audio=False`
   - 优点：一个 Key、免费、国内直连、i2v 完整支持；`tools/zhidiao/agnes_api.py` 的轮询框架几乎可以平移。
   - 注意：CogVideoX-Flash 对 size/fps 参数支持有限（部分版本不支持自定义），先实测。

2. **备用 A：魔搭 ModelScope**（api-inference.modelscope.cn/v1，OpenAI 兼容）
   - Wan2.2 I2V 做首帧视频，每天 2000 次总额度；需绑阿里云实名，Token 去 `ms-` 前缀。

3. **备用 B：Cloudflare Workers AI**
   - FLUX schnell 约 230 张/天、2 秒/张，专治"批量出分镜静帧"的量。

4. **兜底：Pollinations**（image.pollinations.ai，URL 直出，无需 Key）
   - 限速 1 张/40 秒，够不上量产，但断粮时永不排队；加退避重试。

5. **薅一把就走**：阿里百炼新用户额度——一次囤够样片/测试素材。

## 像素小人场景的额外建议

- 像素风对模型要求低，Sana/FLUX schnell/CogView 都能胜任；**风格一致性靠提示词模板 + 固定 seed**，不依赖高端模型。
- 用 Cloudflare FLUX 做静帧量产 + 智谱 CogVideoX-Flash 做首帧动效，是最快且全免费的组合。
- 免费层 429 是常态：客户端统一加指数退避 + 多平台 fallback（和现有 Agnes 退避逻辑合并）。

## 风险提示

- 所有免费额度政策变动快，接入前以各家控制台实时额度为准。
- 免费档多数"非商用"或限商用（智谱需确认商用条款；FLUX schnell 模型本身 Apache 2.0 可商用）；本项目若发布到有收益渠道需复查。
- 来源主要为 2026 年 8-10 月的多篇清单类文章交叉核对，标注"实测可信"的信息集中在：智谱免费模型列表、魔搭 2000 次/天、Cloudflare 10k neurons/天、Pollinations 匿名限速。
