import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_PLAYERS, ITEMS, SKILLS, createPlayer, normalizePlayers, normalizeName,
  applyCommand, runDuel, awardWin, parseCommand, gainExperience, xpToNext,
  combatStats, settleDuel
} from "../demo/engine.mjs";

const doCommand = (players, user, command) => applyCommand(players, user, command);

test("criação segura e equipamento inicial", () => {
  const p = createPlayer("Hero_123", 25);
  assert.equal(p.name, "hero_123");
  assert.equal(p.skin, 1);
  assert.equal(p.level, 0);
  assert.equal(p.xp, 0);
  assert.equal(p.gold, 0);
  assert.equal(p.equipment.weapon, "espada_madeira");
  assert.deepEqual(p.inventory, ["espada_madeira", "roupa_simples"]);
  assert.equal(normalizeName("<script>"), "");
  assert.throws(() => createPlayer("<script>"));
});

test("migração do backup de 2022 mantém status e acrescenta campos novos", () => {
  const old = [
    { player: { nome: "Luci", char: 7, level: 5, ataque: 10, defesa: 3, vida: 4, velocidade: 2, win: 8 } },
    { player: { nome: "luci", char: 3 } }, { player: { nome: "<img onerror=alert(1)>" } }
  ];
  const [p] = normalizePlayers(old);
  assert.equal(normalizePlayers(old).length, 1);
  assert.equal(p.name, "luci");
  assert.equal(p.skin, 7);
  assert.equal(p.level, 5);
  assert.equal(p.attack, 10);
  assert.equal(p.defense, 3);
  assert.equal(p.health, 4);
  assert.equal(p.speed, 2);
  assert.equal(p.wins, 8);
  assert.equal(p.xp, 0);
  assert.deepEqual(p.inventory, ["espada_madeira", "roupa_simples"]);
});

test("migração da v2 e saneamento de equipamentos desconhecidos", () => {
  const [p] = normalizePlayers([{
    ...createPlayer("hero"), gold: 225, skill: "chama",
    inventory: ["espada_madeira", "roupa_simples", "espada_ferro", "__proto__", "espada_ferro"],
    equipment: { weapon: "espada_ferro", armor: "constructor" }
  }]);
  assert.equal(p.gold, 225);
  assert.equal(p.skill, "chama");
  assert.equal(p.equipment.weapon, "espada_ferro");
  assert.equal(p.equipment.armor, "roupa_simples");
  assert.equal(p.inventory.length, 3);
  assert.equal(normalizePlayers({ players: [] }).length, 0);
});

test("limites de números e nomes inválidos em importação", () => {
  const [p] = normalizePlayers([{ name: "hello", level: 9999999, gold: -50, wins: Infinity, skill: "constructor" }]);
  assert.equal(p.level, 1000);
  assert.equal(p.gold, 0);
  assert.equal(p.wins, 0);
  assert.equal(p.skill, "golpe");
});

test("XP acumulado sobe de nível e aumenta atributos sem mutar original", () => {
  const p = createPlayer("luci");
  assert.equal(xpToNext(0), 50);
  let next = gainExperience(p, 40);
  assert.equal(next.level, 0);
  assert.equal(next.xp, 40);
  next = gainExperience(next, 30);
  assert.equal(next.level, 1);
  assert.equal(next.xp, 20);
  assert.equal(next.attack, 2);
  assert.equal(p.level, 0);
});

test("treino, comandos de skin e validação de entrada", () => {
  let players = doCommand([], "Luci", "!entrar 4").players;
  assert.equal(players[0].skin, 4);
  players = doCommand(players, "Luci", "!treinar").players;
  assert.equal(players[0].xp, 40);
  players = doCommand(players, "Luci", "!treinar").players;
  assert.equal(players[0].level, 1);
  players = doCommand(players, "Luci", "!skin 12").players;
  assert.equal(players[0].skin, 12);
  assert.equal(doCommand(players, "Luci", "!skin 99").event.type, "error");
  assert.equal(doCommand([], "other", "!entrar 0").event.type, "error");
  assert.equal(doCommand(players, "luci", "!entrar").players.length, 1);
});

test("loja não permite comprar sem dinheiro nem duplicar itens", () => {
  let players = [createPlayer("luci")];
  assert.equal(doCommand(players, "luci", "!comprar espada_ferro").event.type, "error");
  players = [{ ...players[0], gold: 100 }];
  players = doCommand(players, "luci", "!comprar espada_ferro").players;
  assert.equal(players[0].gold, 35);
  assert.equal(players[0].inventory.includes("espada_ferro"), true);
  assert.equal(doCommand(players, "luci", "!comprar espada_ferro").event.type, "error");
  assert.equal(doCommand(players, "luci", "!comprar __proto__").event.type, "error");
  assert.equal(doCommand(players, "luci", "!comprar constructor").event.type, "error");
});

test("equipamento exige posse e modifica atributos de combate", () => {
  let players = [{ ...createPlayer("luci"), gold: 200 }];
  const previous = combatStats(players[0]).damage;
  assert.equal(doCommand(players, "luci", "!equipar lamina_arcana").event.type, "error");
  players = doCommand(players, "luci", "!comprar lamina_arcana").players;
  players = doCommand(players, "luci", "!equipar lamina_arcana").players;
  assert.equal(players[0].equipment.weapon, "lamina_arcana");
  assert.equal(combatStats(players[0]).damage, previous + 7);
  assert.equal(doCommand(players, "luci", "!equipar toString").event.type, "error");
  assert.ok(ITEMS.lamina_arcana.price > 0);
});

test("habilidades e consultas são reconhecidas", () => {
  const p = [createPlayer("luci")];
  assert.equal(parseCommand("!pvp @Hero").type, "duel");
  assert.equal(parseCommand("!perfil").type, "profile");
  assert.equal(parseCommand("!inventario").type, "inventory");
  assert.equal(doCommand(p, "luci", "!perfil").event.type, "info");
  assert.equal(doCommand(p, "luci", "!loja").event.type, "info");
  assert.equal(doCommand(p, "luci", "!inventario").event.type, "info");
  assert.equal(doCommand(p, "luci", "!habilidade invalida").event.type, "error");
  assert.equal(doCommand(p, "luci", "!habilidade __proto__").event.type, "error");
  assert.equal(doCommand(p, "luci", "!habilidade cura").players[0].skill, "cura");
  assert.deepEqual(Object.keys(SKILLS), ["golpe", "chama", "cura", "guarda"]);
});

test("duelos exigem dois participantes diferentes", () => {
  const p = [createPlayer("luci"), createPlayer("hero")];
  assert.equal(doCommand(p, "luci", "!duelo @luci").event.type, "error");
  assert.equal(doCommand(p, "luci", "!duelo @nenhum").event.type, "error");
  assert.equal(doCommand(p, "luci", "!duelo @hero").event.type, "duel");
  assert.throws(() => runDuel(p[0], p[0]));
});

test("duelos sempre terminam e geram histórico determinístico", () => {
  const left = createPlayer("luci"), right = createPlayer("hero");
  const battle1 = runDuel(left, right, () => 0.5);
  const battle2 = runDuel(left, right, () => 0.5);
  assert.deepEqual(battle1, battle2);
  assert.ok(battle1.turns.length > 0 && battle1.turns.length <= 160);
  assert.ok([left.name, right.name].includes(battle1.winner));
  assert.ok(battle1.turns.some(turn => turn.skill === "golpe"));
});

test("habilidade cura restaura pontos de vida sem ultrapassar o máximo", () => {
  const left = { ...createPlayer("luci"), skill: "cura" };
  const duel = runDuel(left, createPlayer("hero"), () => 0.5);
  const healingTurn = duel.turns.find(turn => turn.skill === "cura");
  assert.ok(healingTurn);
  assert.ok(healingTurn.healing > 0);
  assert.ok(healingTurn.attackerHealth <= duel.initialHealth.luci);
});

test("habilidade guarda reduz dano e chama executa efeito especial", () => {
  const left = createPlayer("luci"), right = createPlayer("hero");
  const normal = runDuel(left, right, () => 0.5).turns[0].damage;
  const guarded = runDuel(left, { ...right, skill: "guarda" }, () => 0.5).turns[0].damage;
  assert.ok(guarded < normal);
  const fire = runDuel({ ...left, skill: "chama" }, right, () => 0.5);
  assert.ok(fire.turns.some(turn => turn.skill === "chama"));
});

test("crítico aumenta dano e esquiva pode resultar em zero", () => {
  const players = [createPlayer("luci"), createPlayer("hero")];
  const critSeq = [0.5, 0.01, 0.5];
  let i = 0;
  const crit = runDuel(players[0], players[1], () => critSeq[i++ % critSeq.length]);
  assert.equal(crit.turns[0].critical, true);
  assert.equal(crit.turns[0].missed, false);
  const miss = runDuel(players[0], players[1], () => 0).turns[0];
  assert.equal(miss.missed, true);
  assert.equal(miss.damage, 0);
});

test("liquidação de duelo concede XP, moedas e histórico a ambos", () => {
  const original = [createPlayer("luci"), createPlayer("hero")];
  const duel = runDuel(original[0], original[1], () => 0.5);
  const settled = settleDuel(original, duel);
  const winner = settled.find(p => p.name === duel.winner);
  const loser = settled.find(p => p.name === duel.loser);
  assert.equal(winner.wins, 1);
  assert.equal(loser.losses, 1);
  assert.equal(winner.gold, 28);
  assert.equal(loser.gold, 12);
  assert.equal(winner.xp, 45);
  assert.equal(loser.xp, 20);
  assert.equal(original[0].gold, 0);
  assert.equal(awardWin(original, duel.winner).reduce((sum, p) => sum + p.wins, 0), 1);
});

test("limite de participantes e tratamento de resultado de duelo inválido", () => {
  const players = Array.from({ length: MAX_PLAYERS }, (_, i) => createPlayer("player_" + i));
  assert.equal(doCommand(players, "extra", "!entrar").event.type, "error");
  assert.throws(() => settleDuel(players, { winner: "player_0", loser: "desconhecido" }));
  assert.throws(() => settleDuel(players, { winner: "player_0", loser: "player_0" }));
});
