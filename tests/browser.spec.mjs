import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:4173/demo/";
const screenshotDir = "browser-artifacts";
mkdirSync(screenshotDir, { recursive: true });
let browser;
before(async () => { browser = await chromium.launch({ headless: true }); });
after(async () => { await browser?.close(); });

async function open(viewport, path = "") {
  const context = await browser.newContext({ viewport, reducedMotion: "reduce" });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(base + path, { waitUntil: "networkidle" });
  return { context, page, errors };
}

test("desktop — renderiza heróis e muda para overlay transparente sem navegar", async () => {
  const { context, page, errors } = await open({ width: 1440, height: 900 });
  try {
    assert.equal((await page.locator("#stat-players").textContent()).trim(), "0");
    await page.locator("#seedDemo").click();
    assert.equal((await page.locator("#stat-players").textContent()).trim(), "4");
    assert.equal(await page.locator(".hero").count(), 4);
    await page.screenshot({ path: screenshotDir + "/desktop.png" });
    await page.locator("#obsEnter").click();
    assert.equal(await page.locator("body").evaluate(el => el.classList.contains("obs-mode")), true);
    assert.equal(new URL(page.url()).searchParams.get("obs"), "1");
    const visual = await page.evaluate(() => ({
      background: getComputedStyle(document.body).backgroundColor,
      arenaBackground: getComputedStyle(document.querySelector("#arena")).backgroundImage,
      scrollWidth: document.documentElement.scrollWidth,
      viewport: innerWidth,
      height: document.querySelector("#arena").getBoundingClientRect().height,
      viewHeight: innerHeight
    }));
    assert.equal(visual.background, "rgba(0, 0, 0, 0)");
    assert.equal(visual.arenaBackground, "none");
    assert.ok(visual.scrollWidth <= visual.viewport + 2);
    assert.ok(Math.abs(visual.height - visual.viewHeight) < 3);
    await page.screenshot({ path: screenshotDir + "/obs-transparent.png", omitBackground: true });
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("body").evaluate(el => el.classList.contains("obs-mode")), false);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test("mobile — permite comandos sem rolagem horizontal", async () => {
  const { context, page, errors } = await open({ width: 390, height: 844 });
  try {
    await page.locator("#username").fill("mobile_tester");
    await page.locator("#command").fill("!entrar 3");
    await page.locator("#sendChat").click();
    assert.equal((await page.locator("#stat-players").textContent()).trim(), "1");
    assert.ok(await page.getByText("mobile_tester entrou na arena!", { exact: false }).count());
    const size = await page.evaluate(() => ({
      viewport: innerWidth, scroll: document.documentElement.scrollWidth
    }));
    assert.ok(size.scroll <= size.viewport + 2, "Mobile overflow: " + size.scroll + " > " + size.viewport);
    await page.screenshot({ path: screenshotDir + "/mobile.png", fullPage: true });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test("OBS Browser Source — prévia sem autenticação exibe atores", async () => {
  const { context, page, errors } = await open({ width: 1920, height: 1080 }, "?obs=1&preview=1");
  try {
    assert.equal(await page.locator(".hero").count(), 4);
    assert.equal(await page.locator("body").evaluate(el => el.classList.contains("obs-mode")), true);
    assert.equal(await page.locator("#obsPlayerCount").textContent(), "4 aventureiros");
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test("combate PvP termina e atualiza o ranking", async () => {
  const { context, page, errors } = await open({ width: 1366, height: 768 });
  try {
    await page.locator("#seedDemo").click();
    await page.locator("#username").fill("alchemy_flames");
    await page.locator("#command").fill("!duelo @luci");
    await page.locator("#sendChat").click();
    await page.locator("#duelView").waitFor({ state: "visible", timeout: 3000 });
    await page.locator("#duelView").waitFor({ state: "hidden", timeout: 30000 });
    assert.equal((await page.locator("#stat-duels").textContent()).trim(), "1");
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
