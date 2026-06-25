# clash-rules — 自有规则集（fork 自 dler-io/Rules）

这是 [dler-io/Rules](https://github.com/dler-io/Rules) 的完整 fork，作为 Sub-Store 分流（`tools/sub-store/override.js`）的唯一可信规则源。完整、可读、可改、可控更新 —— 规则不再受上游或机场掌控。

## 文件

| 文件 | 作用 |
|------|------|
| `used-rulesets.txt` | override.js 实际引用的 59 个规则集路径清单（含自有 `Custom/appleai.yaml`）。 |
| `inventory.sh` | 扫描上表，生成 `INVENTORY.md`（每个集的条目数/规则类型/注释）。 |
| `INVENTORY.md` | 规则集清单，一眼看清"里面有什么"。改完规则跑 `inventory.sh` 刷新。 |
| `sync-upstream.sh` | 从 upstream(dler-io) 拉更新，默认只 diff 不合并。`--merge` 才合并。 |
| `Custom/appleai.yaml` | AppleAI 规则（原来自第三方 vruru/yaml，已并入自有仓）。 |

## 改规则

直接编辑对应 `.yaml`（如 `Clash/Provider/Media/Netflix.yaml` 增删域名）→ `bash inventory.sh` 刷新清单 → commit/push。jsdelivr `@main` 约 12h 缓存后生效；要立即生效可在 OpenClash 手动刷新 provider，或给仓库打 tag 并把 override.js 的 `@main` 改成 `@<tag>`。

## 同步上游

```bash
bash sync-upstream.sh          # 看上游改了哪些引用到的文件（不动本地）
bash sync-upstream.sh --merge  # 确认后再合并
```

## 引用方式

`tools/sub-store/override.js` 通过 jsdelivr 引用：
`https://testingcf.jsdelivr.net/gh/jeasonzhang-eth/clash-rules@main/<path>`
