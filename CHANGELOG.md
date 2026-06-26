# Changelog

## 2026-06-26

- rule-radar 流量统计/概览：在线连接每次采样都刷新规则与出口类别（即使本轮无新增流量），减少「未知」滞留；已断开的旧连接无法补分类，需清库才能彻底清零。
- rule-radar 新增「统计概览」标签：按出口类别（代理/直连/拦截）汇总上下行及占比，并按规则明细列出各规则的上下行/合计；可选日期、按设备筛选（与流量统计共享设备选择）、自动刷新 3s。采样时按连接出口链 `chains[0]`（DIRECT/REJECT/代理节点）记录类别。新增 `GET /api/summary`。
- rule-radar 流量统计：数据保留 3→15 天。
- rule-radar 流量统计：采样间隔 5s→3s、页面自动刷新 5s→3s；数据保留天数 30→3（按北京日期分桶，每次落盘删除超出保留天数的最旧整日）。
- rule-radar 流量统计：修复「规则」列偶发为空——只在 `c.rule` 非空时更新（不让某次空值清掉已记好的规则），从未采到规则时用出口链末端兜底。
- rule-radar 流量统计：默认自动刷新（5s，与采样同频），去掉手动刷新按钮，可勾选关闭。
- rule-radar 流量统计：在域名后加「规则」列，显示该域名实际命中的规则（采样时记录连接的 rule，最近一次为准；按主域名归并时取流量最大成员的规则）。
- rule-radar 流量统计：加载 traffic.json 时清洗旧版扁平残留（只保留嵌套结构），避免结构升级时新旧数据混杂导致的 NaN/空行。
- rule-radar 流量统计：增加**按设备**统计。累计结构改为 `traffic[日期][来源IP][域名]`，查询时按 IP→设备名解析（改设备名实时反映）。新增设备子标签（「全部」+各设备带当日总量），可筛选某设备的域名流量；`GET /api/traffic` 增 `dev` 参数，返回 `devices` 列表。选中设备存 localStorage。
- rule-radar 新增「流量统计」标签：按域名累计历史上下行流量。内核 `/connections` 的 up/down 只是单条连接存活期间的累计、断连重连即归零，故新增独立采样器（默认每 5s 拉一次，记上次基线算增量，累加进 `traffic[北京日期][域名]`，留 30 天，落盘 `server/data/traffic.json`），重连/短连接不丢量。支持选日期、按「主域名/完整主机」归并、点表头排序。新增 `GET /api/traffic`。
- rule-radar：`.gitignore` 排除 `server/data/`，运行时数据（候选/设备名/流量）不再被「推送」按钮带上 GitHub。

- rule-radar: 「走代理/直连」按钮改为断开**全部**连接（与「保存并应用」一致），不再只断该域名；响应与 toast 显示断开连接数。
- rule-radar: 网页用 localStorage 记住当前标签页（监测候选/改规则/查规则），刷新后恢复上次选中的页，不再每次重置回「监测候选」。
- rule-radar 查规则：自动清洗输入（去协议头/路径/端口，只留域名），避免粘 URL 查不到。
- rule-radar 查规则：结果区加「强制走代理/强制直连」按钮，可直接写入个人规则覆盖现有规则并即时生效。
- 规则：Tailscale `controlplane.tailscale.com`、`login.tailscale.com` 走代理（MyProxy，控制平面/登录纯信令需稳定上线）；`derp*.tailscale.com` 中继走直连（MyDirect，DOMAIN-REGEX，避免套代理绕路）。
- rule-radar 网页：内容区居中并加宽（max-width 1680，左右留白），不再挤在左侧。
- rule-radar 网页：所有表格支持**拖拽调整列宽**和**点表头排序**（数字/文本自动识别，↑↓ 指示方向），各 tab 通用。
- rule-radar 网页：上/下行拆成「上行」「下行」两列，各自独立排序；排序按原始字节数（`data-sort`）而非显示文本，跨 B/K/M 单位也正确。
- rule-radar 网页：顶部导航栏内容也居中（通栏背景 + 1680 居中列），与正文左右对齐。
- rule-radar 网页：刷新后记住「所有连接」选中的设备（`rr_csrc`）和各表排序列/方向（`rr_sort`，按表 key 持久化到 localStorage），不再每次重置。
- rule-radar 网页：「所有连接」操作列加「代理 / 直连」按钮，在连接表里看到走错的域名可当场一键改路由（写入 MyProxy/MyDirect + 断连重连即时生效），无需切到「查规则」重敲域名。纯 IP 行不显示（DOMAIN-SUFFIX 对 IP 无意义）。
- rule-radar 新增「所有连接」标签：实时列出全部连接，子标签按来源设备筛选；来源 IP 经 DHCP 租约表（`/tmp/dhcp.leases`）映射成设备名，可手动重命名（`server/data/devices.json`）；每条连接可单独断开。`docker-compose.yml` 增挂 `/tmp/dhcp.leases`。
