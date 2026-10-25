import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const read = path => readFileSync(resolve(root, path), "utf8");
const html = read("demo/index.html");
const app = read("demo/app.mjs");
const css = read("demo/styles.css");

test("todos os ids estaticos referenciados pelo aplicativo existem no HTML", () => {
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
  assert.equal(ids.length, new Set(ids).size, "HTML contém identificadores duplicados");
  const referenced = [...app.matchAll(/\$\("([^"]+)"\)/g)].map(match => match[1]);
  const missing = referenced.filter(id => !ids.includes(id));
  assert.deepEqual(missing, [], "IDs ausentes no HTML: " + missing.join(", "));
});

test("botões de comando e perfil utilizam seletores registrados", () => {
  assert.match(html, /data-command="!entrar 1"/);
  assert.match(html, /data-command="!habilidade chama"/);
  assert.match(html, /data-command="!comprar espada_ferro"/);
  assert.match(html, /id="detailXpBar"/);
  assert.match(html, /id="detailInventory"/);
  assert.match(app, /addEventListener\("click"/);
  assert.match(css, /\.profile-xp-track/);
});

test("a demo mantém o modo offline e o jogo clássico separado", () => {
  assert.match(html, /DEMO OFFLINE/);
  assert.match(html, /Jogo clássico/);
  assert.match(app, /twitch-chat-arena-demo-v1/);
  assert.ok(!app.includes("ComfyJS.Init"));
  assert.ok(existsSync(resolve(root, "index.html")));
});

test("cenário, espada e 20 personagens continuam presentes no repositório", () => {
  assert.ok(existsSync(resolve(root, "img/cena1.png")));
  assert.ok(existsSync(resolve(root, "img/sword1.png")));
  for (let i = 1; i <= 20; i++) assert.ok(existsSync(resolve(root, "img/charB" + i + ".png")));
});
