import test from "node:test";
import assert from "node:assert/strict";
import { createPlayer, normalizePlayers, normalizeName, applyCommand, runDuel, awardWin, parseCommand } from "../demo/engine.mjs";

test("cria personagem com nome e skin seguros", () => {
  assert.equal(createPlayer("Hero_123", 25).skin, 1);
  assert.equal(createPlayer("@Hero_123").name, "hero_123");
  assert.equal(normalizeName("<script>"), "");
  assert.throws(() => createPlayer("<script>"));
});

test("migra dados antigos e remove duplicatas", () => {
  const original = [
    { player: { nome: "Luci", char: 7, level: 5, ataque: 10, defesa: 3, vida: 4, velocidade: 2, win: 8 } },
    { player: { nome: "luci", char: 3 } },
    { player: { nome: "<img onerror=alert(1)>" } }
  ];
  assert.deepEqual(normalizePlayers(original), [{
    name: "luci", skin: 7, level: 5, attack: 10, defense: 3, health: 4, speed: 2, wins: 8
  }]);
});

test("comandos aceitam entrada, treino e troca de aparencia", () => {
  let players = applyCommand([], "Luci", "!entrar 4").players;
  assert.equal(players[0].skin, 4);
  players = applyCommand(players, "Luci", "!treinar").players;
  assert.equal(players[0].level, 1);
  players = applyCommand(players, "Luci", "!skin 12").players;
  assert.equal(players[0].skin, 12);
  assert.equal(applyCommand(players, "Luci", "!skin 99").event.type, "error");
  assert.equal(parseCommand("!pvp @Teste").type, "duel");
});

test("nao permite duelo invalido", () => {
  const players = [createPlayer("luci"), createPlayer("hero")];
  assert.equal(applyCommand(players, "luci", "!duelo @luci").event.type, "error");
  assert.equal(applyCommand(players, "luci", "!duelo @inexistente").event.type, "error");
  assert.equal(applyCommand(players, "luci", "!duelo @hero").event.type, "duel");
});

test("batalhas terminam e registram uma unica vitoria", () => {
  const players = [createPlayer("luci"), createPlayer("hero")];
  const duel = runDuel(players[0], players[1], () => 0.5);
  assert.ok(duel.turns.length > 0 && duel.turns.length <= 160);
  assert.ok(players.some(player => player.name === duel.winner));
  const result = awardWin(players, duel.winner);
  assert.equal(result.reduce((sum, player) => sum + player.wins, 0), 1);
});

test("entrada limitada e sem duplicatas", () => {
  let players = applyCommand([], "Luci", "!entrar").players;
  players = applyCommand(players, "luci", "!entrar").players;
  assert.equal(players.length, 1);
});
