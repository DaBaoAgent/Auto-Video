## 这个 PR 做了什么

<!-- 一句话。比如「pirying：把 gen/qc 的盘符路径改成环境变量」 -->

## 改前 / 改后

- 改前：
- 改后：

## 怎么验证的

```bash
# 贴命令和关键输出
python tools/validate.py
python tools/sync_runtime.py --check
```

<!-- 动了渲染逻辑的，贴一张改前/改后静帧对比（拖图片进来即可） -->

## 自查

- [ ] `python tools/validate.py` 通过（0 WARN）
- [ ] `python tools/sync_runtime.py --check` 通过
- [ ] 没有新增硬编码盘符路径 / `Date.now()` / `Math.random()`
- [ ] 没有把新的二进制大文件塞进仓库
- [ ] 动了某条管线的 `SKILL.md` 与实际行为一致
