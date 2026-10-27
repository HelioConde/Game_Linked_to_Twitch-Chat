import test from "node:test";
import assert from "node:assert/strict";
import { arenaBase, arenaPosition, battleDelay } from "../demo/arena-motion.mjs";

test("arena distribui até 12 jogadores, sem colisão de base ou corte nas bordas", () => {
  for (let count = 1; count <= 12; count++) {
    const bases = Array.from({ length: count }, (_, index) => arenaBase(index, count));
    assert.equal(new Set(bases.map(pos => pos.x.toFixed(3) + ":" + pos.y)).size, count);
    assert.ok(bases.every(pos => pos.x >= 7 && pos.x <= 93 && [13, 50].includes(pos.y)));
  }
});
test("caminhada é determinística, suave e respeita limites", () => {
  for (let i = 0; i < 12; i++) {
    const name = "player_" + i;
    let previous = arenaPosition(i, 12, name, 0);
    assert.deepEqual(previous, arenaPosition(i, 12, name, 0));
    assert.deepEqual(arenaPosition(i, 12, name, 1000, false), arenaBase(i, 12));
    for (let ms = 200; ms <= 10000; ms += 200) {
      const current = arenaPosition(i, 12, name, ms);
      assert.ok(current.x >= 7 && current.x <= 93 && current.y >= 9 && current.y <= 55);
      assert.ok(Math.abs(current.x - previous.x) < 1.0);
      assert.ok(Math.abs(current.y - previous.y) < 1.0);
      previous = current;
    }
  }
});
test("combate tem velocidade normal, acelerada e limite de atraso", () => {
  assert.ok(battleDelay(4, 2) < battleDelay(4, 1));
  assert.ok(battleDelay(160, 1) >= 90);
  assert.ok(battleDelay(160, 2) >= 90);
});
