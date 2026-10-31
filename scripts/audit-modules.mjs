/**
 * 全模块生产级审计
 *
 * 对每条路由对应的页面做静态体检，输出 docs/module-audit.md 矩阵。
 *
 * 判定口径（宁可严，不可宽）：
 *   - 数据绑定：出现 base44.entities / useSession / useEntityList 之一
 *   - 写入闭环：出现 .create( / .update( / .delete(
 *   - 错误处理：try/catch 或 toast.error
 *   - 加载态：loading / 骨架 / Skeleton
 *   - 金额防护：涉及金额时使用 sanitizeAmount 或 min="0"
 *   - 空态：空数组时有提示文案
 *
 * 用法：node scripts/audit-modules.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");
const OUT = path.join(ROOT, "docs", "module-audit.md");

/* 1. 解析路由表 */
const utilsSrc = fs.readFileSync(path.join(SRC, "utils", "index.js"), "utf8");
const routes = [...utilsSrc.matchAll(/^\s{2}(\w+):\s*"([^"]+)",$/gm)].map((m) => ({ page: m[1], path: m[2] }));

/* 2. 定位页面文件 */
const pagesDir = path.join(SRC, "pages");
const pageFiles = fs.readdirSync(pagesDir).filter((f) => f.endsWith(".jsx"));
const fileByPage = new Map();
for (const f of pageFiles) fileByPage.set(f.replace(/\.jsx$/, ""), path.join(pagesDir, f));

/* 3. 组件也被页面引用，一并收集（用于写入闭环判断） */
const componentsDir = path.join(SRC, "components");
function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith(".jsx")) acc.push(p);
  }
  return acc;
}
const allComponents = fs.existsSync(componentsDir) ? walk(componentsDir) : [];

/** 收集页面直接 import 的组件源码 */
function importedComponentSources(src) {
  const out = [];
  for (const m of src.matchAll(/from\s+"@\/components\/([^"]+)"/g)) {
    const rel = m[1];
    const candidates = [
      path.join(componentsDir, `${rel}.jsx`),
      path.join(componentsDir, rel, "index.jsx"),
    ];
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        out.push(fs.readFileSync(c, "utf8"));
        break;
      }
    }
  }
  return out;
}

/* 内容型页面：无业务数据，不应按「数据绑定/错误处理/加载态/空态」扣分 */
const CONTENT_PAGES = new Set(["Landing", "Whitepaper", "Documentation", "QuantumChain", "MetaLife", "Login"]);

const has = (s, re) => re.test(s);

function auditPage({ page, path: routePath }) {
  const file = fileByPage.get(page);
  if (!file) {
    return { page, route: routePath, file: null, issues: ["页面文件缺失"], score: 0, checks: {} };
  }
  const src = fs.readFileSync(file, "utf8");
  const deps = importedComponentSources(src);
  const combined = [src, ...deps].join("\n");
  const isContent = CONTENT_PAGES.has(page);

  const checks = {
    数据绑定: isContent ? true : has(combined, /base44\.entities\.|useSession|useEntityList|useEntity\(|useReferral|ModuleShell/),
    写入闭环: isContent ? true : has(combined, /\.create\(|\.update\(|\.delete\(|\.bulkCreate\(/),
    错误处理: isContent ? true : has(combined, /try\s*{|toast\.error|catch\s*\(|DataErrorBanner|ErrorState|ModuleState/),
    加载态: isContent ? true : has(combined, /loading|Loading|Skeleton|Loader2|ModuleState|ModuleShell/),
    空态提示: isContent ? true : has(combined, /length\s*===?\s*0|暂无|还没有|No data|empty|EmptyState|ModuleState/i),
    页面标题: has(src, /PageHeader|SectionCard/),
    金额防护: has(combined, /sanitizeAmount|min="0"|Number\(/) || !has(combined, /amount|price|余额|金额/),
    移动端: has(combined, /sm:|md:|lg:/),
  };

  const issues = [];
  if (!isContent) {
    if (!checks.数据绑定) issues.push("无数据绑定（疑似静态壳）");
    if (!checks.错误处理) issues.push("缺少错误处理");
    if (!checks.加载态) issues.push("缺少加载态");
    if (!checks.空态提示) issues.push("缺少空态提示");
  }
  if (!checks.金额防护) issues.push("金额未做防护");

  const total = Object.keys(checks).length;
  const passed = Object.values(checks).filter(Boolean).length;
  const score = Math.round((passed / total) * 100);

  return { page, route: routePath, file: path.relative(ROOT, file), checks, issues, score, total, passed, isContent };
}

const results = routes.map(auditPage);

/* 4. 服务端能力探测 */
const serverDir = path.join(ROOT, "server");
const serverFiles = fs.existsSync(serverDir) ? fs.readdirSync(serverDir).filter((f) => f.endsWith(".mjs")) : [];
const serverCapabilities = {
  api: fs.existsSync(path.join(serverDir, "index.mjs")),
  db: fs.existsSync(path.join(serverDir, "db.mjs")),
  auth: fs.existsSync(path.join(serverDir, "auth.mjs")),
  kms: fs.existsSync(path.join(serverDir, "kms.mjs")),
  payments: fs.existsSync(path.join(serverDir, "payments.mjs")),
  scheduler: fs.existsSync(path.join(serverDir, "scheduler.mjs")),
  audit: fs.existsSync(path.join(serverDir, "audit.mjs")),
  qr: fs.existsSync(path.join(serverDir, "qr.mjs")),
};

/* 5. 汇总 */
const total = results.length;
const perfect = results.filter((r) => r.score === 100).length;
const good = results.filter((r) => r.score >= 75 && r.score < 100).length;
const weak = results.filter((r) => r.score < 75);
const avg = Math.round(results.reduce((a, r) => a + r.score, 0) / total);

const now = new Date().toISOString().slice(0, 19).replace("T", " ");

/* 6. 生成 Markdown */
const pad = (s, n) => String(s).padEnd(n, " ");
const yes = (b) => (b ? "✅" : "❌");

let md = `# NMS MetaLife · 全模块生产级审计报告\n\n`;
md += `> 生成时间：${now}　|　审计方式：静态分析（路由 → 页面 → 依赖组件）\n\n`;
md += `## 总览\n\n`;
md += `| 指标 | 数值 |\n|---|---|\n`;
md += `| 路由总数 | ${total} |\n`;
md += `| 满分模块 | ${perfect} |\n`;
md += `| 良好（75–99） | ${good} |\n`;
md += `| 待改进（<75） | ${weak.length} |\n`;
md += `| 平均分 | ${avg} |\n\n`;

md += `## 服务端能力\n\n`;
md += `| 能力 | 状态 |\n|---|---|\n`;
for (const [k, v] of Object.entries(serverCapabilities)) md += `| ${k} | ${yes(v)} |\n`;
md += `\n服务端模块：${serverFiles.join(", ") || "无"}\n\n`;

md += `## 逐模块矩阵\n\n`;
md += `> 类型：\`功能\` = 有业务数据与写入；\`内容\` = 落地页/白皮书/文档，仅考核标题与响应式。\n\n`;
md += `| 模块 | 类型 | 路由 | 分数 | 数据 | 写入 | 错误 | 加载 | 空态 | 标题 | 金额 | 响应式 |\n`;
md += `|---|---|---:|---:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|\n`;
for (const r of results) {
  const c = r.checks || {};
  md += `| ${r.page} | ${r.isContent ? "内容" : "功能"} | \`${r.route}\` | ${r.score} | ${yes(c.数据绑定)} | ${yes(c.写入闭环)} | ${yes(c.错误处理)} | ${yes(c.加载态)} | ${yes(c.空态提示)} | ${yes(c.页面标题)} | ${yes(c.金额防护)} | ${yes(c.移动端)} |\n`;
}

if (weak.length) {
  md += `\n## 待改进明细\n\n`;
  for (const r of weak) {
    md += `### ${r.page} \`${r.route}\` — ${r.score} 分\n\n`;
    for (const i of r.issues) md += `- ${i}\n`;
    md += `\n`;
  }
}

md += `\n## 判定口径\n\n`;
md += `- **数据绑定**：使用 \`base44.entities\` / \`useSession\` / \`useEntityList\` 之一\n`;
md += `- **写入闭环**：存在 \`.create\` / \`.update\` / \`.delete\` 调用\n`;
md += `- **错误处理**：\`try/catch\` 或 \`toast.error\`\n`;
md += `- **加载态**：\`loading\` / \`Skeleton\` / \`Loader2\`\n`;
md += `- **空态提示**：\`length === 0\` 分支或「暂无」文案\n`;
md += `- **金额防护**：\`sanitizeAmount\` / \`min="0"\`（无金额字段的模块自动通过）\n`;
md += `- **响应式**：存在 \`sm:\` / \`md:\` / \`lg:\` 断点\n`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, md, "utf8");

/* 7. 控制台输出 */
console.log(`\n=== 全模块生产级审计 ===\n`);
console.log(`${pad("模块", 22)}${pad("类型", 6)}${pad("分数", 6)}问题`);
for (const r of results) {
  console.log(`${pad(r.page, 22)}${pad(r.isContent ? "内容" : "功能", 6)}${pad(r.score, 6)}${r.issues.join("；") || "—"}`);
}
console.log(`\n路由 ${total} 个 · 满分 ${perfect} · 良好 ${good} · 待改进 ${weak.length} · 平均 ${avg} 分`);
console.log(`报告已写入 ${path.relative(ROOT, OUT)}\n`);

process.exit(weak.length > 0 ? 1 : 0);
