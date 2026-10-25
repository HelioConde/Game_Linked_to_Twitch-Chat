import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SKINS, getSkin } from "../demo/skin-library.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

test("galeria contém exatamente 20 classes únicas em ordem", () => {
  assert.equal(SKINS.length, 20);
  assert.deepEqual(SKINS.map(s => s.id), Array.from({length:20},(_,i)=>i+1));
  assert.equal(new Set(SKINS.map(s => s.name)).size, 20);
  assert.equal(new Set(SKINS.map(s => s.image)).size, 20);
});

test("todos os arquivos de sprites novos existem e são imagens WebP válidas", () => {
  for (const skin of SKINS) {
    assert.match(skin.image, /^\.\.\/img\/characters-v2\/skin-\d{2}-[a-z-]+\.webp$/);
    const file = resolve(root, "demo", skin.image);
    assert.ok(existsSync(file), "Arquivo ausente: "+skin.image);
    const image = readFileSync(file);
    assert.ok(image.length > 500, "Arquivo vazio: "+skin.image);
    assert.equal(image.toString("ascii",0,4), "RIFF");
    assert.equal(image.toString("ascii",8,12), "WEBP");
  }
});

test("o jogo clássico continua com seus 20 sprites originais", () => {
  for(let id=1;id<=20;id++) {
    assert.ok(existsSync(resolve(root, "img", "charB"+id+".png")));
  }
});

test("recupera aparência inválida com fallback seguro", () => {
  assert.equal(getSkin(1).name, "Cavaleiro");
  assert.equal(getSkin(20).name, "Valquíria");
  assert.equal(getSkin(21).id, 1);
  assert.equal(getSkin("constructor").id, 1);
  assert.equal(getSkin({}).id, 1);
});
