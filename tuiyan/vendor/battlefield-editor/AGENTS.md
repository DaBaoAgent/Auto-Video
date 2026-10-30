# AGENTS.md — 本目录工作规则（给 Codex / 自动化代理）

本目录是「徐艾伦赤壁之战 3D 推演演示」的引擎与播放器。**任何 UI/文案/视觉改动，先读 `README-UI-REDESIGN.md`（UI 重设计交接文档），它包含完整背景、红线、验证流程。**

必须遵守：

1. **改完必跑验证**：`PROXY=1 node tools/verify-zh.mjs` → 必须 `errors: 0`；截图输出在本目录 `docs/screenshots/`，人工复核。
2. **git 只本地提交**：remote 是上游开源仓库（yazelin/battlefield-editor），**绝不 push**；提交信息用中文说明。
3. **禁 CDN / 禁构建链**：国内网络，所有依赖必须本地；保持单文件 `play.html` 直接可跑。
4. **数据红线**：不改 `packages/chibi-full/cues.json` 与旁白音频；不重新生成 `assets/commanders/*.jpg`；史料文案口径不改（措辞可改）。
5. **中文简体**，零繁体残留（验证器会扫）。
6. 样式优先改 `play.html` 顶部 `<style>`；JS 逻辑（播放状态机等）尽量不动。
7. 录制成片只用 `node tools/record-video.mjs --style real`；水墨模式已移除。UI 定稿后再录制。
