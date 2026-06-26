// rule-radar —— 规则雷达：监测 + 改规则 + 本地 serve 规则集（即时生效）
// 纯 Node，无依赖。跑在网关 iStoreOS（host 网络），把整个 clash-rules 仓挂进 /repo。
//   1. 本地 HTTP 提供规则集：GET /rules/<path>  ← override.js 的 rule-providers 指这里
//   2. 监测：定时拉 mihomo /connections，攒"走直连的境外域名 / 被 REJECT 拦的域名"
//   3. 改规则：网页编辑 yaml、给候选一键"走代理/直连"，写完调控制器刷新 provider → 秒生效
const http = require("http");
const fs = require("fs");
const path = require("path");
const { execFile } = require("child_process");

const REPO = process.env.REPO || "/repo";
const PORT = parseInt(process.env.PORT || "3003", 10);
const CTRL = process.env.CTRL || "http://127.0.0.1:9090";
const SECRET = process.env.SS_CTRL_SECRET || "A1tK9Q0h";
const INTERVAL = parseInt(process.env.INTERVAL || "30", 10) * 1000;
const STATE =
  process.env.STATE || path.join(REPO, "server/data/candidates.json");

// 个人规则文件（最高优先级，排在 AdBlock/HTTPDNS 之前 → 可覆盖误拦）
const MYPROXY = "Custom/MyProxy.yaml"; // 强制走代理，provider 名 MyProxy
const MYDIRECT = "Custom/MyDirect.yaml"; // 强制直连，provider 名 MyDirect

// ── 候选状态 ──────────────────────────────────────────────
let state = {};
try {
  state = JSON.parse(fs.readFileSync(STATE, "utf8"));
} catch (e) {}
function persist() {
  try {
    fs.mkdirSync(path.dirname(STATE), { recursive: true });
    fs.writeFileSync(STATE, JSON.stringify(state, null, 2));
  } catch (e) {}
}

async function poll() {
  let data;
  try {
    const r = await fetch(CTRL + "/connections", {
      headers: { Authorization: "Bearer " + SECRET },
    });
    data = await r.json();
  } catch (e) {
    return;
  }
  const now = new Date().toISOString();
  for (const c of data.connections || []) {
    const m = c.metadata || {};
    const host = (m.host || m.sniffHost || "").trim();
    if (!host) continue;
    const chains = c.chains || [];
    const rule = c.rule || "";
    let cat = null;
    if (chains.indexOf("REJECT") >= 0) cat = "blocked";
    else if (/^match$/i.test(rule)) cat = "uncovered";
    if (!cat) continue;
    const e = state[host] || {
      category: cat,
      first: now,
      hits: 0,
      up: 0,
      down: 0,
    };
    e.last = now;
    e.hits += 1;
    e.up = Math.max(e.up, c.upload || 0);
    e.down = Math.max(e.down, c.download || 0);
    e.category = cat;
    e.chain = chains.join(">");
    state[host] = e;
  }
  persist();
}
setInterval(poll, INTERVAL);
poll();

// ── 工具 ──────────────────────────────────────────────────
function safe(rel) {
  const full = path.normalize(path.join(REPO, rel));
  if (full !== REPO && !full.startsWith(REPO + path.sep)) return null;
  if (!full.endsWith(".yaml")) return null;
  return full;
}
function listFiles() {
  const out = [];
  for (const d of ["Custom", "Clash/Provider", "Clash/Provider/Media"]) {
    let fns = [];
    try {
      fns = fs.readdirSync(path.join(REPO, d));
    } catch (e) {}
    for (const f of fns) if (f.endsWith(".yaml")) out.push(d + "/" + f);
  }
  return out;
}
async function refresh(name) {
  try {
    const r = await fetch(
      CTRL + "/providers/rules/" + encodeURIComponent(name),
      {
        method: "PUT",
        headers: { Authorization: "Bearer " + SECRET },
      },
    );
    return r.status;
  } catch (e) {
    return 0;
  }
}
// 文件 → 控制器里的 provider 名（处理 AI Suite→OpenAI、Max→HBO Max 等别名）
function providerName(file) {
  for (const n in NAME2FILE) if (NAME2FILE[n] === file) return n;
  return path.basename(file, ".yaml");
}
// 刷新后清 fake-ip 缓存，让已解析过的域名立刻按新规则走（否则只对新连接生效）
async function flushFakeip() {
  try {
    await fetch(CTRL + "/cache/fakeip/flush", {
      method: "POST",
      headers: { Authorization: "Bearer " + SECRET },
    });
  } catch (e) {}
}
// 断开连接，逼其用新规则重连。filterFn(host) 为空则断开全部。
// 这是"改规则立刻见效"的关键——已建立的连接不会自己重新匹配。
async function closeConns(filterFn) {
  try {
    const data = await (
      await fetch(CTRL + "/connections", {
        headers: { Authorization: "Bearer " + SECRET },
      })
    ).json();
    let n = 0;
    for (const c of data.connections || []) {
      const m = c.metadata || {};
      const host = (m.host || m.sniffHost || "").toLowerCase();
      if (!filterFn || filterFn(host)) {
        await fetch(CTRL + "/connections/" + c.id, {
          method: "DELETE",
          headers: { Authorization: "Bearer " + SECRET },
        });
        n++;
      }
    }
    return n;
  } catch (e) {
    return 0;
  }
}
// 在仓库里跑 git。容器内用 OpenSSH + 原始 key 走 443，
// 用 GIT_SSH_COMMAND 覆盖宿主机 .git/config 里 dropbear 专用的 core.sshCommand。
function sh(args) {
  return new Promise((resolve) => {
    execFile(
      "git",
      args,
      {
        cwd: REPO,
        env: {
          ...process.env,
          GIT_SSH_COMMAND:
            "ssh -i /root/.ssh/github-jeasonzhang -p 443 -o IdentitiesOnly=yes" +
            " -o UserKnownHostsFile=/tmp/gh_known_hosts -o StrictHostKeyChecking=accept-new",
        },
      },
      (err, stdout, stderr) =>
        resolve({
          code: err ? err.code || 1 : 0,
          out: (stdout || "") + (stderr || ""),
        }),
    );
  });
}
// 网页「推送」按钮：把仓内全部改动 commit + push 到 GitHub（一次性）。
async function gitPush() {
  await sh(["add", "-A"]);
  const diff = await sh(["diff", "--cached", "--quiet"]);
  if (diff.code === 0) return { ok: true, nothing: true };
  const stamp = new Date().toISOString().slice(0, 19).replace("T", " ");
  const commit = await sh(["commit", "-m", "rules: web edit " + stamp]);
  const push = await sh(["push", "origin", "HEAD:main"]);
  return {
    ok: push.code === 0,
    committed: commit.code === 0,
    log: (commit.out + "\n" + push.out).slice(-800),
  };
}
function addDomain(file, domain, type) {
  const abs = safe(file);
  if (!abs) throw new Error("bad path");
  let content = "";
  try {
    content = fs.readFileSync(abs, "utf8");
  } catch (e) {
    content = "payload:\n";
  }
  if (
    content.indexOf("," + domain + "\n") >= 0 ||
    content.endsWith("," + domain)
  )
    return false; // 已存在
  if (!/payload:/.test(content)) content = "payload:\n" + content;
  if (!content.endsWith("\n")) content += "\n";
  content += "  - " + (type || "DOMAIN-SUFFIX") + "," + domain + "\n";
  fs.writeFileSync(abs, content);
  return true;
}

// ── 域名 → 命中哪个规则集 ──────────────────────────────────
// 规则集 name(控制器里的 payload) 与文件名不一致的少数别名：
const NAME2FILE = {
  OpenAI: "Clash/Provider/AI Suite.yaml",
  "HBO Max": "Clash/Provider/Media/Max.yaml",
  AppleAI: "Custom/appleai.yaml",
  PROXY: "Clash/Provider/Proxy.yaml",
};
let _idx = null;
function fileOf(name) {
  if (NAME2FILE[name]) return NAME2FILE[name];
  if (!_idx) {
    _idx = {};
    for (const f of listFiles()) _idx[path.basename(f, ".yaml")] = f;
  }
  return _idx[name] || null;
}
function domMatch(domain, type, val) {
  if (!val) return false;
  val = val.toLowerCase();
  if (type === "DOMAIN") return domain === val;
  if (type === "DOMAIN-SUFFIX")
    return domain === val || domain.endsWith("." + val);
  if (type === "DOMAIN-KEYWORD") return domain.indexOf(val) >= 0;
  if (type === "DOMAIN-REGEX") {
    try {
      return new RegExp(val).test(domain);
    } catch (e) {
      return false;
    }
  }
  return false;
}
function matchInFile(file, domain) {
  const abs = safe(file);
  if (!abs) return null;
  let txt = "";
  try {
    txt = fs.readFileSync(abs, "utf8");
  } catch (e) {
    return null;
  }
  for (const ln of txt.split("\n")) {
    const m = ln.match(/^\s*-\s*([A-Z-]+),\s*([^,#\s]+)/);
    if (m && domMatch(domain, m[1], m[2])) return m[1] + "," + m[2];
  }
  return null;
}
async function matchDomain(input) {
  const domain = input.toLowerCase().trim();
  let rules = [];
  try {
    rules =
      (
        await (
          await fetch(CTRL + "/rules", {
            headers: { Authorization: "Bearer " + SECRET },
          })
        ).json()
      ).rules || [];
  } catch (e) {}
  const DT = {
    Domain: "DOMAIN",
    DomainSuffix: "DOMAIN-SUFFIX",
    DomainKeyword: "DOMAIN-KEYWORD",
    DomainRegex: "DOMAIN-REGEX",
  };
  let effective = null;
  const allSets = [];
  let skippedIP = false;
  for (const r of rules) {
    const type = r.type,
      payload = r.payload,
      group = r.proxy;
    if (type === "RuleSet" || type === "RULE-SET") {
      const file = fileOf(payload);
      const hit = file ? matchInFile(file, domain) : null;
      if (hit) {
        const rec = { set: payload, group: group, pattern: hit, file: file };
        allSets.push(rec);
        if (!effective) effective = Object.assign({ kind: "ruleset" }, rec);
      }
    } else if (DT[type]) {
      if (domMatch(domain, DT[type], payload) && !effective)
        effective = {
          kind: "direct",
          set: "(override.js 直接规则)",
          group: group,
          pattern: DT[type] + "," + payload,
        };
    } else if (type === "Match" || type === "MATCH") {
      if (!effective)
        effective = {
          kind: "match",
          set: "(MATCH 兜底)",
          group: group,
          pattern: "MATCH",
        };
    } else if (
      !effective &&
      (type === "GeoIP" ||
        type === "IPCIDR" ||
        type === "IPCIDR6" ||
        type === "SrcIPCIDR")
    ) {
      skippedIP = true; // 这些要解析 IP 才能判，域名维度跳过
    }
  }
  return { domain, effective, allSets, skippedIP };
}

function body(req) {
  return new Promise((res) => {
    let b = "";
    req.on("data", (c) => (b += c));
    req.on("end", () => {
      try {
        res(JSON.parse(b || "{}"));
      } catch (e) {
        res({});
      }
    });
  });
}
function json(res, obj, code) {
  res.writeHead(code || 200, {
    "Content-Type": "application/json; charset=utf-8",
  });
  res.end(JSON.stringify(obj));
}

// ── HTTP ──────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  const u = new URL(req.url, "http://x");
  const p = decodeURIComponent(u.pathname);

  // 规则集本地 serve（OpenClash 来拉）
  if (p.startsWith("/rules/")) {
    const abs = safe(p.slice("/rules/".length));
    if (!abs) return json(res, { error: "bad path" }, 400);
    fs.readFile(abs, (e, d) => {
      if (e) return json(res, { error: "not found" }, 404);
      res.writeHead(200, { "Content-Type": "text/yaml; charset=utf-8" });
      res.end(d);
    });
    return;
  }
  if (p === "/api/candidates") {
    const all = Object.entries(state);
    const pick = (cat) =>
      all
        .filter((x) => x[1].category === cat)
        .sort((a, b) => b[1].hits - a[1].hits)
        .map((x) => Object.assign({ host: x[0] }, x[1]));
    return json(res, {
      uncovered: pick("uncovered"),
      blocked: pick("blocked"),
    });
  }
  if (p === "/api/match") {
    const d = u.searchParams.get("domain") || "";
    if (!d) return json(res, { error: "no domain" }, 400);
    return json(res, await matchDomain(d));
  }
  if (p === "/api/files") return json(res, { files: listFiles() });
  if (p === "/api/file") {
    const abs = safe(u.searchParams.get("path") || "");
    if (!abs) return json(res, { error: "bad path" }, 400);
    fs.readFile(abs, "utf8", (e, d) =>
      e ? json(res, { error: "not found" }, 404) : json(res, { content: d }),
    );
    return;
  }
  if (req.method === "POST" && p === "/api/save") {
    const b = await body(req);
    const abs = safe(b.path || "");
    if (!abs || typeof b.content !== "string")
      return json(res, { error: "bad" }, 400);
    fs.writeFileSync(abs, b.content);
    const name = providerName(b.path);
    const code = await refresh(name);
    await flushFakeip();
    const closed = await closeConns(); // 断开全部，逼新规则即时生效
    return json(res, { ok: true, refreshed: name, status: code, closed });
  }
  if (req.method === "POST" && p === "/api/add") {
    const b = await body(req);
    const domain = (b.domain || "").trim();
    if (!domain) return json(res, { error: "no domain" }, 400);
    const target = b.target === "direct" ? "direct" : "proxy";
    const file = target === "direct" ? MYDIRECT : MYPROXY;
    const name = target === "direct" ? "MyDirect" : "MyProxy";
    let added = false;
    try {
      added = addDomain(file, domain, "DOMAIN-SUFFIX");
    } catch (e) {
      return json(res, { error: String(e) }, 500);
    }
    const code = await refresh(name);
    await flushFakeip();
    // 断开全部连接，逼所有流量用新规则重连（与「保存并应用」一致）
    const closed = await closeConns();
    // 加进规则后从候选里移除，界面更干净
    if (state[domain]) {
      delete state[domain];
      persist();
    }
    return json(res, {
      ok: true,
      added,
      target,
      refreshed: name,
      status: code,
      closed,
    });
  }
  if (req.method === "POST" && p === "/api/drop") {
    const b = await body(req);
    if (b.host && state[b.host]) {
      delete state[b.host];
      persist();
    }
    return json(res, { ok: true });
  }
  if (req.method === "POST" && p === "/api/reset") {
    state = {};
    persist();
    return json(res, { ok: true });
  }
  if (req.method === "POST" && p === "/api/push") {
    const r = await gitPush();
    return json(res, r, r.ok ? 200 : 500);
  }
  if (p === "/" || p === "/index.html") {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(PAGE);
    return;
  }
  json(res, { error: "not found" }, 404);
});
server.listen(PORT, () =>
  console.log("rule-radar on :" + PORT + " repo=" + REPO),
);

// ── 网页 ──────────────────────────────────────────────────
const PAGE = `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>规则雷达 rule-radar</title>
<style>
  :root{color-scheme:dark}
  body{font:14px/1.5 -apple-system,system-ui,"PingFang SC",sans-serif;margin:0;background:#15171c;color:#e6e6e6}
  header{padding:12px 18px;background:#1d2027;border-bottom:1px solid #2a2e37;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
  h1{font-size:16px;margin:0}
  .tab{padding:6px 14px;border-radius:8px;cursor:pointer;background:#262a33;color:#bbb}
  .tab.on{background:#3a6df0;color:#fff}
  main{padding:16px 18px;max-width:1100px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  th,td{text-align:left;padding:7px 10px;border-bottom:1px solid #262a33;font-size:13px}
  th{color:#8b93a1;font-weight:600}
  td.host{font-family:ui-monospace,Menlo,monospace;word-break:break-all}
  button{font:13px system-ui;border:0;border-radius:7px;padding:5px 11px;cursor:pointer;background:#262a33;color:#dfe3ea}
  button.p{background:#3a6df0;color:#fff}button.d{background:#3a8a55;color:#fff}button:hover{filter:brightness(1.15)}
  .muted{color:#8b93a1}.pill{font-size:12px;background:#262a33;border-radius:10px;padding:1px 8px;color:#9aa3b2}
  textarea{width:100%;height:60vh;background:#0f1115;color:#cfe;border:1px solid #2a2e37;border-radius:8px;padding:10px;font-family:ui-monospace,Menlo,monospace;font-size:13px}
  select{background:#262a33;color:#e6e6e6;border:1px solid #2a2e37;border-radius:7px;padding:6px}
  #toast{position:fixed;right:16px;bottom:16px;background:#2b313c;padding:10px 14px;border-radius:8px;opacity:0;transition:.3s;border:1px solid #3a6df0}
  #toast.show{opacity:1}
  .row{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-bottom:10px}
</style></head><body>
<header>
  <h1>📡 规则雷达</h1>
  <span class="tab on" data-t="mon" onclick="tab('mon')">监测候选</span>
  <span class="tab" data-t="edit" onclick="tab('edit')">改规则</span>
  <span class="tab" data-t="look" onclick="tab('look')">查规则</span>
  <span class="muted" id="meta"></span>
  <button class="p" style="margin-left:auto" onclick="push()" title="把所有改动 commit 并推送到 GitHub">⬆ 推送 GitHub</button>
</header>
<main>
 <section id="mon">
  <div class="row"><button onclick="loadCand()">刷新</button><button onclick="reset()">清空候选</button>
   <span class="muted">「走直连的境外域名」点 <b>走代理</b> 即时加入 MyProxy；误拦的点 <b>放行</b>。</span></div>
  <h3>🌍 未覆盖·走了直连 <span class="pill" id="cu">0</span></h3>
  <table><thead><tr><th>域名</th><th>次数</th><th>上/下行</th><th>操作</th></tr></thead><tbody id="tu"></tbody></table>
  <h3 style="margin-top:22px">⛔ 被 REJECT 拦截 <span class="pill" id="cb">0</span></h3>
  <table><thead><tr><th>域名</th><th>次数</th><th>上/下行</th><th>操作</th></tr></thead><tbody id="tb"></tbody></table>
 </section>
 <section id="edit" style="display:none">
  <div class="row"><select id="f" onchange="loadFile()"></select>
   <button class="p" onclick="save()">保存并应用（刷新该规则集）</button>
   <span class="muted" id="fstat"></span></div>
  <textarea id="ta" spellcheck="false"></textarea>
 </section>
 <section id="look" style="display:none">
  <div class="row"><input id="dq" placeholder="输入域名，如 chat.openai.com" style="flex:1;min-width:240px;background:#0f1115;color:#cfe;border:1px solid #2a2e37;border-radius:8px;padding:8px 10px;font-family:ui-monospace,monospace" onkeydown="if(event.key==='Enter')mtest()">
   <button class="p" onclick="mtest()">查询</button></div>
  <div id="mres" class="muted">输入域名，看它命中哪个规则集、最终走哪个组。</div>
 </section>
</main>
<div id="toast"></div>
<script>
const $=s=>document.querySelector(s);
function toast(m){const t=$('#toast');t.textContent=m;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200);}
function tab(n){try{localStorage.setItem('rr_tab',n)}catch(e){}document.querySelectorAll('.tab').forEach(e=>e.classList.toggle('on',e.dataset.t===n));['mon','edit','look'].forEach(s=>$('#'+s).style.display=s===n?'':'none');if(n==='edit')loadFiles();}
async function mtest(){
  const d=$('#dq').value.trim();if(!d)return;
  $('#mres').innerHTML='查询中…';
  const r=await (await fetch('/api/match?domain='+encodeURIComponent(d))).json();
  let h='';
  if(r.effective){const e=r.effective;h+='<div style="font-size:15px;margin:10px 0"><b>最终命中</b>：'+(e.kind==='ruleset'?'规则集 <code>'+e.set+'</code>':e.set)+' → 出口组 <b>'+e.group+'</b><br><span class=muted>匹配规则 '+e.pattern+(e.file?'（'+e.file+'）':'')+'</span></div>';}
  else h+='<div class=muted style="margin:10px 0">没有任何域名规则命中（可能走 GEOIP/IP 规则或 MATCH 兜底）。</div>';
  if(r.allSets&&r.allSets.length){h+='<h4>包含该域名的全部规则集（按规则顺序）</h4><table><thead><tr><th>规则集</th><th>出口组</th><th>匹配项</th></tr></thead><tbody>'+r.allSets.map(s=>'<tr><td>'+s.set+'</td><td>'+s.group+'</td><td class=muted>'+s.pattern+'</td></tr>').join('')+'</tbody></table>';}
  if(r.skippedIP)h+='<div class=muted style="margin-top:8px">注：GEOIP/IP-CIDR 类规则需解析 IP，未参与计算，结果以域名规则为准。</div>';
  $('#mres').innerHTML=h;
}
function hum(n){return n>1048576?(n/1048576).toFixed(1)+'M':n>1024?(n/1024).toFixed(1)+'K':n+'B';}
async function loadCand(){
  const d=await (await fetch('/api/candidates')).json();
  $('#cu').textContent=d.uncovered.length;$('#cb').textContent=d.blocked.length;
  $('#tu').innerHTML=d.uncovered.map(r=>'<tr><td class="host">'+r.host+'</td><td>'+r.hits+'</td><td class="muted">'+hum(r.up)+' / '+hum(r.down)+'</td><td><button class="p" onclick="add(\\''+r.host+'\\',\\'proxy\\')">走代理</button> <button onclick="add(\\''+r.host+'\\',\\'direct\\')">直连</button> <button onclick="drop(\\''+r.host+'\\')">忽略</button></td></tr>').join('')||'<tr><td colspan=4 class=muted>（暂无）</td></tr>';
  $('#tb').innerHTML=d.blocked.map(r=>'<tr><td class="host">'+r.host+'</td><td>'+r.hits+'</td><td class="muted">'+hum(r.up)+' / '+hum(r.down)+'</td><td><button class="p" onclick="add(\\''+r.host+'\\',\\'proxy\\')">放行·代理</button> <button class="d" onclick="add(\\''+r.host+'\\',\\'direct\\')">放行·直连</button> <button onclick="drop(\\''+r.host+'\\')">忽略</button></td></tr>').join('')||'<tr><td colspan=4 class=muted>（暂无）</td></tr>';
  $('#meta').textContent='候选 '+(d.uncovered.length+d.blocked.length)+' 个 · 自动刷新';
}
async function add(host,target){const r=await (await fetch('/api/add',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({domain:host,target})})).json();toast((target==='direct'?'已直连 ':'已走代理 ')+host+'·断开 '+(r.closed||0)+' 连接'+(r.status>=200&&r.status<300?'（已生效）':'（刷新 '+r.status+'）'));loadCand();}
async function drop(host){await fetch('/api/drop',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({host})});loadCand();}
async function reset(){if(!confirm('清空所有候选？'))return;await fetch('/api/reset',{method:'POST'});loadCand();}
async function push(){toast('推送中…');try{const r=await (await fetch('/api/push',{method:'POST'})).json();if(r.nothing)toast('没有改动可推');else if(r.ok)toast('已推送 GitHub ✓');else{toast('推送失败，看控制台');console.log(r.log||r);}}catch(e){toast('推送出错');console.log(e);}}
async function loadFiles(){const d=await (await fetch('/api/files')).json();const sel=$('#f');if(sel.dataset.done)return;sel.innerHTML=d.files.map(f=>'<option>'+f+'</option>').join('');sel.dataset.done=1;loadFile();}
async function loadFile(){const f=$('#f').value;const d=await (await fetch('/api/file?path='+encodeURIComponent(f))).json();$('#ta').value=d.content||'';$('#fstat').textContent='';}
async function save(){const f=$('#f').value;const r=await (await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({path:f,content:$('#ta').value})})).json();$('#fstat').textContent=r.ok?'已保存·刷新 '+r.refreshed+'('+r.status+')·断开 '+(r.closed||0)+' 连接，即时生效':'失败';toast('已保存 '+f);}
(function(){let t='mon';try{t=localStorage.getItem('rr_tab')||'mon'}catch(e){}if(['mon','edit','look'].indexOf(t)<0)t='mon';tab(t);})();
loadCand();setInterval(()=>{if($('#mon').style.display!=='none')loadCand();},15000);
</script></body></html>`;
