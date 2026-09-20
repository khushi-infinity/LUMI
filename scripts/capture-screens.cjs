/* Capture LUMI screenshots for the README. Run: node scripts/capture-screens.cjs */
const { chromium } = require("playwright");

const BASE = "http://localhost:3100";
const OUT = "docs/screenshots";

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });

  // Home
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(3500); // let the 3D mascot render
  await page.screenshot({ path: `${OUT}/home.png` });
  console.log("home");

  // Tutor with a chat exchange
  await page.goto(BASE + "/tutor", { waitUntil: "networkidle" });
  await page.fill('input[placeholder="Ask Lumi anything…"]', "Explain recursion");
  await page.keyboard.press("Enter");
  await page.waitForTimeout(4000);
  await page.screenshot({ path: `${OUT}/tutor.png` });
  console.log("tutor");

  // Scan
  await page.goto(BASE + "/scan", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  await page.screenshot({ path: `${OUT}/scan.png` });
  console.log("scan");

  // Practice
  await page.goto(BASE + "/practice", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/practice.png` });
  console.log("practice");

  // Progress
  await page.goto(BASE + "/progress", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/progress.png` });
  console.log("progress");

  // Live (pre-session hero)
  await page.goto(BASE + "/live", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/live.png` });
  console.log("live");

  await browser.close();
})();
