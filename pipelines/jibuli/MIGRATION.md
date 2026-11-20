# 迁移说明 · jibuli（吉卜力水彩）

## 来源

- 上游仓库：[huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) v1.3.1
- 风格配方：`references/风格配方/25_ghibli.md` → `references/style.md`
- 场景代码：`scripts/engine/scenes/25_ghibli.js` → `vendor/huashu-art-motion/engine/scenes/25_ghibli.js`
- 渲染器：`scripts/engine/render.py` → `vendor/huashu-art-motion/engine/render.py`
- 引擎库、转场、字体：`scripts/engine/lib/`、`transitions.js`、`lib/fonts/` 原样入库

## 入库内容

- `scripts/jibuli.py`：本管线入口，固定 `--film gallery --solo 25_ghibli`，其余参数透传给上游 render.py。
- `references/style.md`：配方卡原文，只改路径表述，不改参数。
- 引擎为**全仓库共享**：所有 huashu 管线共用 `vendor/huashu-art-motion/engine`，不在每条管线里复制一份。

## 不入库

- `demos/`（含花叔角色帧，上游明确不随 MIT 授权）、`reference_films/`（示范工程，体积大且与风格无关）、Clawd 相关素材。
- 成片 `out/*.mp4`、抽帧 `review/*.png`。

## 本地补丁

`vendor/huashu-art-motion/engine/render.py` 加了一个环境变量入口：`CHROME_PATH` 指本机 Chrome/Edge 可执行文件，`CHROME_CHANNEL` 走 Playwright channel；都没有时退回 Playwright 自带 chromium。其余逻辑与上游逐字一致。

## 更新方式

上游升版本后，重新复制 `scripts/engine/` 到 `vendor/huashu-art-motion/engine/`（排除 demos / reference_films），再跑一遍：

```bash
uv run --with playwright python pipelines/jibuli/scripts/jibuli.py --stills 0.5,2.5 --out review/jibuli
```

抽帧与上游配方卡视觉一致才算同步完成。
