# CREDITS · tianshu 天书本地大模型出片

这条管线**不做**确定性渲染：定帧由本机 Qwen-Image 2.1 生成，动态由本机 Wan2.2 TI2V-5B 生成，
代码只负责提示词骨架、统一后期、色彩锚定、运镜、拼接、质检与交付。模型权重一律不入库。

## 视觉参考

- **《天书奇谭》(1983)** — 上海美术电影制片厂。只作为**风格参考与对位样本**：
  取色基线、亮度/饱和区间、颗粒与纸纹残差层，全部由本机已购/已有片源抽帧测得。
  **不复刻原片镜头、不还原原片演员与角色造型、不搬运原片画面**；每条成片是按自己的口播稿新生成的画面。
  片源素材不入库，路径写在 `pipeline.json → paths.film_frames`。

## 模型与引擎

- **Qwen-Image 2.1** — 出定帧。GGUF 量化版 `qwen-image-2.1-Q4_K_M.gguf` 与
  `qwen_image_2.1_vae_bf16.safetensors` 的文件名见 `pipeline.json → models.qwen`。
  权重许可与商用条款请以阿里云通义官方仓库为准，本仓库只引用文件名，不随附权重。
- **Wan2.2 TI2V-5B** — 出视频。GGUF 量化版 `Wan2.2-TI2V-5B-Q4_K_M.gguf`，
  文本编码 `umt5_xxl_fp8_e4m3fn_scaled.safetensors`，VAE `wan2.2_vae.safetensors`。
  权重许可与商用条款请以官方仓库为准。
- **ComfyUI** — GPL-3.0，本管线通过它的 HTTP API（`/prompt`、`/history`、`/system_stats`）提交工作流，
  https://github.com/comfyanonymous/ComfyUI
- **ffmpeg** — LGPL/GPL 视构建而定，用于抽帧、锚定重编码、拼接、合流与响度测量。

## 技法来源

- 逐镜对位取色：亮度/均饱和/高饱和/梯度四项统计，配合 PIL 中值切分（MEDIANCUT）取主色。
- 统一后期：gamma 反解目标亮度 → 轻降对比 → 黑位抬升 → 褪色暖调 → 饱和锚定（放最后）→
  原片高频/低频残差当颗粒与纸纹。
- 后期 2D 运镜：cosine 缓动 + 双线性采样 + 采样窗越界即报错，源自 2026-11 的
  `tianshu` 前身验证工程（026《镇魔塔》）。
- 无 ASR 定字幕：20 ms RMS 包 → 语音块/静音窗 → 字数比例铺轴 → 接缝吸附真静音。
  与 `dengju` / `laolang` 一线的做法同源。

## 示范工程

`projects/026_zhenmota/` 的 6 镜画面 prompt、运镜参数、时长与取色目标，来自 026《镇魔塔》
2026-11-13 的实际运行记录（`i2v_jobs_01_10_v2.json` / `cam_jobs_01_10.json` / `jobs_post_01_10.json`）。
底图与片段本身（约 40 MB）不入库。
