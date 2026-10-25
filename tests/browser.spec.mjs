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
    const oneScreen = await page.evaluate(() => ({
      pageHeight: document.documentElement.scrollHeight,
      viewportHeight: innerHeight,
      stageHeight: document.querySelector("#arena").getBoundingClientRect().height
    }));
    assert.ok(oneScreen.pageHeight <= oneScreen.viewportHeight + 3,
      "Desktop must fit one screen: " + JSON.stringify(oneScreen));
    assert.ok(oneScreen.stageHeight >= 300, "Arena should be visually prominent");
    await page.screenshot({ path: screenshotDir + "/desktop.png" });
    await page.locator("#tab-connect").click();
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


test("nova galeria — 20 personagens, seleção da skin e imagem carregada", async () => {
  const { context, page, errors } = await open({ width: 1366, height: 768 });
  try {
    await page.locator("#tab-heroes").click();
    await page.locator("#skinsSection summary").click();
    assert.equal(await page.locator(".skin-card").count(), 20);
    const images = await page.locator(".skin-card img").evaluateAll(nodes =>
      nodes.map(image => ({ src: image.getAttribute("src"), width: image.naturalWidth, loaded: image.complete }))
    );
    // Imagens com loading=lazy são requisitadas conforme a galeria é percorrida.
    assert.equal(images.length, 20);
    for (const index of [1, 5, 10, 15, 20]) {
      const card = page.locator('.skin-card[data-skin="' + index + '"]');
      await card.scrollIntoViewIfNeeded();
      const image = card.locator("img");
      await image.evaluate(img => img.decode());
      assert.ok(await image.evaluate(img => img.naturalWidth > 0), "Skin " + index + " não carregou");
    }
    await page.locator('#skinGallery .skin-card[data-skin="20"]').click();
    assert.equal(await page.locator("#command").inputValue(), "!entrar 20");
    await page.locator("#sendChat").click();
    assert.equal((await page.locator("#stat-players").textContent()).trim(), "1");
    const background = await page.locator(".hero .sprite").evaluate(el => getComputedStyle(el).backgroundImage);
    assert.match(background, /skin-20-valkyrie\.webp/);
    const preview = await page.request.get(new URL("../img/characters-v2/skin-20-valkyrie.webp", base).href);
    assert.equal(preview.status(), 200);
    assert.match(preview.headers()["content-type"] || "", /image\/webp/);
    await page.screenshot({ path: screenshotDir + "/new-character-gallery.png", fullPage: true });
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});


test("navegação focada — três áreas e ações rápidas com feedback curto", async () => {
  const { context, page, errors } = await open({width: 1440, height: 900});
  try {
    assert.equal(await page.locator(".workspace-tab").count(), 3);
    assert.equal(await page.locator("#panel-play").isVisible(), true);
    assert.equal(await page.locator("#panel-connect").isVisible(), false);
    await page.locator("#tab-heroes").click();
    assert.equal(await page.locator("#panel-play").isVisible(), false);
    assert.equal(await page.locator("#panel-heroes").isVisible(), true);
    await page.locator("#tab-connect").click();
    assert.equal(await page.locator("#twitchClientId").isVisible(), true);
    await page.locator("#tab-play").click();
    await page.locator('[data-quick="join"]').click();
    assert.equal((await page.locator("#stat-players").textContent()).trim(), "1");
    await page.locator('[data-quick="train"]').click();
    assert.equal((await page.locator("#chatFeed .chat-line").count()), 2);
    assert.equal(await page.locator('#chatFeed').textContent().then(text => text.includes("!treinar")), false);
    await page.locator("#command").fill("!ajuda");
    await page.locator("#sendChat").click();
    assert.equal(await page.locator("#advancedCommands").evaluate(node => node.open), true);
    assert.ok(await page.locator("#chatFeed .chat-line").count() <= 7);
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});

test("atividade — repetição consolidada, sem duplicar comandos", async () => {
  const { context, page, errors } = await open({width: 1366, height: 768});
  try {
    await page.locator('[data-quick="join"]').click();
    for (let i=0;i<5;i++) await page.locator('[data-quick="train"]').click();
    const events = page.locator("#chatFeed .chat-line");
    assert.ok(await events.count() <= 4, "Treinos repetidos não devem lotar o painel");
    assert.ok((await page.locator("#chatFeed").textContent()).includes("×5"));
    assert.ok(!(await page.locator("#chatFeed").textContent()).includes("!treinar"));
    const vertical = await page.evaluate(() => ({
      document: document.documentElement.scrollHeight, viewport: innerHeight
    }));
    assert.ok(vertical.document <= vertical.viewport + 3, "A página não deve rolar no desktop");
    assert.deepEqual(errors, []);
  } finally { await context.close(); }
});
