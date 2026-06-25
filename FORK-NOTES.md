# clash-rules — 自有规则集（fork 自 dler-io/Rules）

这是 [dler-io/Rules](https://github.com/dler-io/Rules) 的完整 fork，作为 Sub-Store 分流（`tools/sub-store/override.js`）的唯一可信规则源。完整、可读、可改、可控更新 —— 规则不再受上游或机场掌控。

## 文件

| 文件 | 作用 |
|------|------|
| `used-rulesets.txt` | override.js 实际引用的全部规则集路径清单（含自有 `Custom/*`）。 |
| `inventory.sh` | 扫描上表，生成 `INVENTORY.md`（每个集的条目数/规则类型/注释）。 |
| `INVENTORY.md` | 规则集清单，一眼看清"里面有什么"。改完规则跑 `inventory.sh` 刷新。 |
| `sync-upstream.sh` | 从 upstream(dler-io) 拉更新，默认只 diff 不合并。`--merge` 才合并。 |
| `Custom/appleai.yaml` | AppleAI 规则（原来自第三方 vruru/yaml，已并入自有仓）。 |
| `Custom/MyProxy.yaml` | 个人·强制走代理清单（最高优先级，可覆盖 AdBlock 误拦）。 |
| `Custom/MyDirect.yaml` | 个人·强制直连清单（最高优先级）。 |
| `server/` | **rule-radar** 网页服务：监测 + 改规则 + 本地 serve 规则集（见下）。 |

## rule-radar 网页服务（监测 + 改规则 + 本地 serve）

跑在**网关 iStoreOS**，浏览器打开 **`http://192.168.6.116:3003/`**。三合一：

1. **本地 serve 规则集**：`GET /rules/<path>` 提供仓内所有 yaml。`override.js` 的 rule-providers 指这里（`http://192.168.6.116:3003/rules`），不再走 jsdelivr（网关连它常 TLS 超时）。
2. **监测候选**：定时拉 mihomo `/connections`，攒"走了直连的境外域名(rule=Match) / 被 REJECT 拦的域名"。
3. **改规则·即时生效**：网页编辑任意 yaml 保存，或给候选点「走代理 / 直连」，服务写文件后调控制器 `PUT /providers/rules/<name>` 刷新该规则集，**秒生效不用重启**。
   - 「走代理/直连」追加到 `Custom/MyProxy.yaml` / `Custom/MyDirect.yaml`（排在所有 REJECT 之前，可覆盖 AdBlock 误拦）。
4. **查规则**：输入域名 → 按控制器实际规则顺序算出命中哪个规则集、最终走哪个出口组（`GET /api/match`）。能看出"实际"路由，而非以为的路由。

### 部署 / 运维（在网关）

```bash
# 首次：clone 仓到网关 + 起服务（用本机已缓存的 node 镜像）
git clone --depth 1 https://github.com/jeasonzhang-eth/clash-rules.git /mnt/nvme0n1-4/clash-rules
cd /mnt/nvme0n1-4/clash-rules/server && docker compose up -d
# 重启 / 看日志
docker compose restart && docker logs rule-radar --tail 20
```

> **同步模型**：网关这份 clone 是**线上实际 serve 的副本**，网页改动即时生效但只在网关本地。
> - 从 GitHub 拉更新到网关：`git -C /mnt/nvme0n1-4/clash-rules pull`（拉完在网页或控制器刷新 provider）。
> - 网页改的内容若要长期保留/同步回 Mac：在网关 `git commit && push`（需先配好 push 凭据），或把同样的改动在 Mac 仓里做一遍再 push。

## 改规则（命令行方式）

直接编辑对应 `.yaml`（如 `Clash/Provider/Media/Netflix.yaml` 增删域名）→ `bash inventory.sh` 刷新清单 → 在网关 rule-radar 网页/控制器刷新该 provider 即时生效。

## 同步上游

```bash
bash sync-upstream.sh          # 看上游改了哪些引用到的文件（不动本地）
bash sync-upstream.sh --merge  # 确认后再合并
```

## 引用方式

`tools/sub-store/override.js` 的 rule-providers 指向网关本地 serve：
`http://192.168.6.116:3003/rules/<path>`（由 rule-radar 提供）。
GitHub 仓仍是备份与多端同步的来源（网关 `git pull` 更新）。

## 网页「推送 GitHub」按钮（网关 → GitHub → Mac）

rule-radar 网页右上角「⬆ 推送 GitHub」一键把仓内全部改动 `git add -A && commit && push`（`POST /api/push`）。

- 工作流：网页改规则（即时生效，仅网关本地）→ 点「推送」上 GitHub → Mac 在 `code/personal/clash-rules` `git pull` → 父仓库 `git add` 更新 submodule 引用。
- 网关 ssh 客户端是 **Dropbear**，不读 `~/.ssh/config`、用不了 OpenSSH 格式 key：复用 Mac 的 `github-jeasonzhang` key，`dropbearconvert` 成 `/root/.ssh/github-jeasonzhang.db`，remote 走 `ssh.github.com:443`，`core.sshCommand="ssh -y -i …db -p 443"`（宿主机 `git pull` 用）。
- rule-radar **容器**是 Debian，自带 git+OpenSSH：`docker-compose.yml` 把 `/root/.ssh` 只读挂进容器，`/api/push` 用 `GIT_SSH_COMMAND`（OpenSSH 语法 + 原始 `github-jeasonzhang` key + `-p 443`）覆盖宿主机那条 dropbear 专用的 `core.sshCommand`。
