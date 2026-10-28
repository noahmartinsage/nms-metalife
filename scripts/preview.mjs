import { chromium } from "playwright-core";
import fs from "node:fs";
import path from "node:path";

const EXEC =
  "C:/Users/noah/AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe";
const BASE = process.env.PREVIEW_URL || "http://127.0.0.1:3000";
const OUT = ".preview";

const ROUTES = [
  { path: "/", name: "01-home", label: "首页" },
  { path: "/quantum", name: "02-quantum", label: "量子公链" },
  { path: "/wallet", name: "03-wallet", label: "钱包" },
  { path: "/dex", name: "04-dex", label: "DEX" },
  { path: "/nft", name: "05-nft", label: "AI 商城" },
  { path: "/register", name: "06-register", label: "注册" },
  { path: "/invite?ref=NMSDEMO", name: "06b-invite", label: "邀请页" },
  { path: "/payment", name: "06c-payment", label: "支付中心" },
  { path: "/ai", name: "07-ai", label: "AI 管家" },
  { path: "/social", name: "08-social", label: "元Social" },
  { path: "/landing", name: "09-landing", label: "落地页" },
];

fs.mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({
  executablePath: EXEC,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});

const errors = [];
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
  locale: "zh-CN",
});
const page = await ctx.newPage();

page.on("console", (msg) => {
  if (msg.type() === "error") errors.push(`[console] ${msg.text().slice(0, 300)}`);
});
page.on("pageerror", (err) => errors.push(`[pageerror] ${String(err).slice(0, 300)}`));

const results = [];
for (const r of ROUTES) {
  const before = errors.length;
  await page.goto(`${BASE}${r.path}`, { waitUntil: "networkidle", timeout: 45000 });
  await page.waitForTimeout(2000);
  const title = await page.title();
  const bodyText = (await page.locator("body").innerText()).replace(/\s+/g, " ");
  const len = bodyText.length;
  const file = path.join(OUT, `${r.name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  results.push({
    route: r.path,
    label: r.label,
    ok: len > 200,
    chars: len,
    newErrors: errors.length - before,
    title,
  });
  console.log(
    `${len > 200 ? "OK  " : "FAIL"} ${r.path.padEnd(12)} ${r.label.padEnd(8)} chars=${String(len).padStart(6)} err=${errors.length - before}`
  );
}

// 移动端视图
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  locale: "zh-CN",
});
const mpage = await mobile.newPage();
mpage.on("pageerror", (err) => errors.push(`[mobile pageerror] ${String(err).slice(0, 200)}`));
await mpage.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 45000 });
await mpage.waitForTimeout(2000);
await mpage.screenshot({ path: path.join(OUT, "10-mobile-home.png") });
const mobileLen = (await mpage.locator("body").innerText()).length;
console.log(`OK   / (mobile)   chars=${mobileLen}`);

await browser.close();

fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ results, errors }, null, 2));

console.log(`\n===== 汇总 =====`);
console.log(`路由通过：${results.filter((r) => r.ok).length}/${results.length}`);
console.log(`控制台错误：${errors.length} 条`);
if (errors.length) {
  const uniq = [...new Set(errors)];
  uniq.slice(0, 12).forEach((e) => console.log("  " + e));
}
