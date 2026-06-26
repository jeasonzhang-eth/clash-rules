# Changelog

## 2026-06-26

- rule-radar: 「走代理/直连」按钮改为断开**全部**连接（与「保存并应用」一致），不再只断该域名；响应与 toast 显示断开连接数。
- rule-radar: 网页用 localStorage 记住当前标签页（监测候选/改规则/查规则），刷新后恢复上次选中的页，不再每次重置回「监测候选」。
- rule-radar 查规则：自动清洗输入（去协议头/路径/端口，只留域名），避免粘 URL 查不到。
- rule-radar 查规则：结果区加「强制走代理/强制直连」按钮，可直接写入个人规则覆盖现有规则并即时生效。
- 规则：Tailscale `controlplane.tailscale.com` 走代理（MyProxy，控制平面纯信令需稳定上线）；`derp*.tailscale.com` 中继走直连（MyDirect，DOMAIN-REGEX，避免套代理绕路）。
- rule-radar 新增「所有连接」标签：实时列出全部连接，子标签按来源设备筛选；来源 IP 经 DHCP 租约表（`/tmp/dhcp.leases`）映射成设备名，可手动重命名（`server/data/devices.json`）；每条连接可单独断开。`docker-compose.yml` 增挂 `/tmp/dhcp.leases`。
