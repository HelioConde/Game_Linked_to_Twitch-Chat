// Motor deterministico da demo. Sem dependencias do DOM ou da Twitch.
export const MAX_PLAYERS = 60;
export const MAX_LEVEL = 1000;
const MAX_GOLD = 1000000;
const MAX_TURNS = 160;

export const ITEMS = Object.freeze({
  espada_madeira: Object.freeze({ name: "Espada de madeira", slot: "weapon", price: 0, attack: 1, defense: 0 }),
  espada_ferro: Object.freeze({ name: "Espada de ferro", slot: "weapon", price: 65, attack: 4, defense: 0 }),
  lamina_arcana: Object.freeze({ name: "Lâmina arcana", slot: "weapon", price: 150, attack: 8, defense: 0 }),
  roupa_simples: Object.freeze({ name: "Roupa simples", slot: "armor", price: 0, attack: 0, defense: 0 }),
  couro_reforcado: Object.freeze({ name: "Couro reforçado", slot: "armor", price: 55, attack: 0, defense: 3 }),
  armadura_aco: Object.freeze({ name: "Armadura de aço", slot: "armor", price: 140, attack: 0, defense: 7 })
});
export const SKILLS = Object.freeze({
  golpe: "Golpe poderoso — a cada 3 ataques, causa dano adicional",
  chama: "Chama arcana — a cada 3 ataques, ignora parte da defesa",
  cura: "Recuperação — a cada 3 ataques, restaura PV",
  guarda: "Guarda — reduz o dano recebido"
});
const STARTER_ITEMS = ["espada_madeira", "roupa_simples"];

export function normalizeName(value) {
  const name = String(value ?? "").trim().replace(/^@/, "").toLowerCase();
  return /^[a-z0-9_]{1,25}$/.test(name) ? name : "";
}
export function normalizeSkin(value) {
  const n = Number(value);
  return Number.isInteger(n) && n >= 1 && n <= 20 ? n : 1;
}
function safeNumber(value, fallback, max = 1000) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.min(max, Math.max(0, Math.floor(n))) : fallback;
}
const owns = (collection, key) => Object.prototype.hasOwnProperty.call(collection, key);
export function xpToNext(level) { return 50 + Math.min(MAX_LEVEL, safeNumber(level, 0)) * 25; }
function safeInventory(value) {
  const items = Array.isArray(value) ? value : [];
  return [...new Set([...STARTER_ITEMS, ...items.filter(id => typeof id === "string" && owns(ITEMS, id))])];
}
function normalizeEquipment(value, inventory) {
  const equip = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    weapon: inventory.includes(equip.weapon) && ITEMS[equip.weapon]?.slot === "weapon" ? equip.weapon : "espada_madeira",
    armor: inventory.includes(equip.armor) && ITEMS[equip.armor]?.slot === "armor" ? equip.armor : "roupa_simples"
  };
}
export function createPlayer(value, skin = 1) {
  const name = normalizeName(value);
  if (!name) throw new Error("Nome de usuario invalido.");
  return {
    name, skin: normalizeSkin(skin), level: 0, xp: 0, gold: 0,
    attack: 1, defense: 1, health: 1, speed: 1, wins: 0, losses: 0,
    skill: "golpe", inventory: [...STARTER_ITEMS],
    equipment: { weapon: "espada_madeira", armor: "roupa_simples" }
  };
}
// Compativel com a demo v2 e com backups do formato {player: {...}} de 2022.
export function normalizePlayers(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set(), result = [];
  for (const item of input) {
    const source = item && typeof item === "object" ? (item.player || item) : null;
    if (!source || typeof source !== "object") continue;
    const name = normalizeName(source.name ?? source.nome);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    const inventory = safeInventory(source.inventory);
    result.push({
      name, skin: normalizeSkin(source.skin ?? source.char),
      level: safeNumber(source.level, 0, MAX_LEVEL),
      xp: safeNumber(source.xp, 0, 50000),
      gold: safeNumber(source.gold, 0, MAX_GOLD),
      attack: safeNumber(source.attack ?? source.ataque, 1),
      defense: safeNumber(source.defense ?? source.defesa, 1),
      health: safeNumber(source.health ?? source.vida, 1),
      speed: safeNumber(source.speed ?? source.velocidade, 1),
      wins: safeNumber(source.wins ?? source.win, 0, 100000),
      losses: safeNumber(source.losses, 0, 100000),
      skill: typeof source.skill === "string" && owns(SKILLS, source.skill) ? source.skill : "golpe",
      inventory, equipment: normalizeEquipment(source.equipment, inventory)
    });
    if (result.length >= MAX_PLAYERS) break;
  }
  return result;
}
export function gainExperience(player, amount) {
  let xp = player.xp + safeNumber(amount, 0, 10000);
  let level = player.level;
  let gained = 0;
  while (level < MAX_LEVEL && xp >= xpToNext(level)) {
    xp -= xpToNext(level);
    level++;
    gained++;
  }
  if (level === MAX_LEVEL) xp = 0;
  return {
    ...player, level, xp,
    attack: Math.min(1000, player.attack + gained),
    defense: Math.min(1000, player.defense + gained),
    health: Math.min(1000, player.health + gained),
    speed: Math.min(1000, player.speed + gained)
  };
}
export function combatStats(player) {
  const gear = player.equipment || {};
  const weapon = ITEMS[gear.weapon]?.attack ?? 1;
  const armor = ITEMS[gear.armor]?.defense ?? 0;
  return {
    maxHealth: Math.min(15000, 40 + Math.max(1, player.health) * 8 + player.level * 2),
    damage: Math.min(800, 4 + Math.max(1, player.attack) * 2 + weapon),
    defense: Math.min(800, Math.max(1, player.defense) + armor),
    speed: Math.max(1, player.speed),
    skill: owns(SKILLS, player.skill) ? player.skill : "golpe"
  };
}
export function parseCommand(input) {
  const parts = String(input ?? "").trim().split(/\s+/);
  const command = (parts[0] || "").toLowerCase();
  const commands = {
    "!entrar":"join", "!join":"join", "!criar":"join",
    "!treinar":"train", "!level":"train", "!upar":"train",
    "!skin":"skin", "!aparencia":"skin",
    "!duelo":"duel", "!pvp":"duel", "!x1":"duel",
    "!ajuda":"help", "!help":"help", "!perfil":"profile",
    "!inventario":"inventory", "!inv":"inventory",
    "!loja":"shop", "!comprar":"buy", "!equipar":"equip",
    "!habilidade":"skill"
  };
  return { type: commands[command] ?? "unknown", arg: parts[1] };
}
export function applyCommand(players, sender, input) {
  const name = normalizeName(sender);
  if (!name) return { players, event: { type: "error", text: "Nome de usuario invalido." } };
  const cmd = parseCommand(input);
  const player = players.find(p => p.name === name);
  const result = (type, text, extra = {}) => ({ players, event: { type, text, ...extra } });
  const replace = updated => players.map(p => p.name === name ? updated : p);
  if (cmd.type === "help") return result("info", "Comandos: !entrar 1-20, !treinar, !perfil, !inventario, !loja, !comprar ITEM, !equipar ITEM, !habilidade golpe|chama|cura|guarda, !skin N, !duelo @nome.");
  if (cmd.type === "unknown") return result("info", "Mensagem recebida. Use !ajuda para ver os comandos.");
  if (cmd.type === "join") {
    if (player) return result("info", name + " ja esta na arena.");
    if (players.length >= MAX_PLAYERS) return result("error", "A arena atingiu o limite de jogadores.");
    const requested = cmd.arg === undefined ? 1 : Number(cmd.arg);
    if (!Number.isInteger(requested) || requested < 1 || requested > 20) return result("error", "Escolha uma skin entre 1 e 20.");
    return { players: [...players, createPlayer(name, requested)], event: { type: "join", text: name + " entrou na arena!" } };
  }
  if (!player) return result("error", name + " precisa usar !entrar primeiro.");
  if (cmd.type === "train") {
    const updated = gainExperience(player, 40);
    return { players: replace(updated), event: { type: "train", text: name + " treinou (+40 XP)." + (updated.level > player.level ? " Subiu para o nivel " + updated.level + "!" : "") } };
  }
  if (cmd.type === "skin") {
    const requested = Number(cmd.arg);
    if (!Number.isInteger(requested) || requested < 1 || requested > 20) return result("error", "Escolha uma skin entre 1 e 20.");
    return { players: replace({ ...player, skin: requested }), event: { type: "skin", text: name + " mudou para a skin " + requested + "." } };
  }
  if (cmd.type === "profile") {
    return result("info", name + ": NV " + player.level + " (" + player.xp + "/" + xpToNext(player.level) + " XP), " + player.gold + " moedas, " + player.wins + " V / " + player.losses + " D, habilidade " + player.skill + ".");
  }
  if (cmd.type === "inventory") {
    return result("info", name + ": " + player.inventory.map(id => ITEMS[id].name + (Object.values(player.equipment).includes(id) ? " [equipado]" : "")).join(", ") + ".");
  }
  if (cmd.type === "shop") {
    return result("info", "Loja: " + Object.entries(ITEMS).filter(([, item]) => item.price > 0).map(([id, item]) => id + " (" + item.price + " moedas)").join(", ") + ".");
  }
  if (cmd.type === "buy") {
    const item = typeof cmd.arg === "string" && owns(ITEMS, cmd.arg) ? ITEMS[cmd.arg] : null;
    if (!item || item.price === 0) return result("error", "Item invalido. Use !loja.");
    if (player.inventory.includes(cmd.arg)) return result("error", "Voce ja possui este item.");
    if (player.gold < item.price) return result("error", "Moedas insuficientes para comprar " + item.name + ".");
    return { players: replace({ ...player, gold: player.gold - item.price, inventory: [...player.inventory, cmd.arg] }),
      event: { type: "buy", text: name + " comprou " + item.name + " por " + item.price + " moedas." } };
  }
  if (cmd.type === "equip") {
    const item = typeof cmd.arg === "string" && owns(ITEMS, cmd.arg) ? ITEMS[cmd.arg] : null;
    if (!item || !player.inventory.includes(cmd.arg)) return result("error", "Voce precisa possuir o item para equipar.");
    return { players: replace({ ...player, equipment: { ...player.equipment, [item.slot]: cmd.arg } }),
      event: { type: "equip", text: name + " equipou " + item.name + "." } };
  }
  if (cmd.type === "skill") {
    if (!cmd.arg || !owns(SKILLS, cmd.arg)) return result("error", "Habilidade invalida. Use golpe, chama, cura ou guarda.");
    return { players: replace({ ...player, skill: cmd.arg }), event: { type: "skill", text: name + " escolheu a habilidade " + cmd.arg + "." } };
  }
  if (cmd.type === "duel") {
    const target = normalizeName(cmd.arg);
    if (!target || !players.some(p => p.name === target)) return result("error", "Desafiado nao encontrado na arena.");
    if (target === name) return result("error", "Voce nao pode duelar consigo mesmo.");
    return result("duel", name + " desafiou " + target + "!", { challenger: name, opponent: target });
  }
  return result("error", "Comando desconhecido.");
}
function sample(random) {
  const n = Number(random());
  return Number.isFinite(n) ? Math.max(0, Math.min(0.999999, n)) : 0.5;
}
export function runDuel(left, right, random = Math.random) {
  if (!left || !right || !normalizeName(left.name) || !normalizeName(right.name) || left.name === right.name) {
    throw new Error("Duelo exige dois jogadores distintos.");
  }
  const info = { [left.name]: combatStats(left), [right.name]: combatStats(right) };
  const initialHealth = { [left.name]: info[left.name].maxHealth, [right.name]: info[right.name].maxHealth };
  const health = { ...initialHealth };
  const turns = [];
  const first = info[left.name].speed >= info[right.name].speed ? left : right;
  const second = first === left ? right : left;
  const attacks = { [left.name]: 0, [right.name]: 0 };
  let winner = null;
  for (let step = 0; step < MAX_TURNS; step++) {
    const attacker = step % 2 === 0 ? first : second;
    const target = attacker === left ? right : left;
    const atk = info[attacker.name], def = info[target.name];
    attacks[attacker.name]++;
    const special = attacks[attacker.name] % 3 === 0 && atk.skill !== "guarda";
    const missed = sample(random) < Math.min(0.17, 0.05 + Math.max(0, def.speed - atk.speed) * 0.005);
    const critical = !missed && sample(random) < 0.10;
    const variance = Math.floor(sample(random) * 4);
    let raw = atk.damage + variance - Math.floor(def.defense * 0.55);
    let skill = null, healing = 0;
    if (special) {
      skill = atk.skill;
      if (skill === "golpe") raw += 5 + Math.floor(attacker.level / 5);
      if (skill === "chama") raw += 4 + Math.floor(def.defense * 0.25);
      if (skill === "cura") {
        healing = Math.min(initialHealth[attacker.name] - health[attacker.name], 10 + Math.floor(attacker.level / 4));
        health[attacker.name] += healing;
      }
    }
    let damage = missed ? 0 : Math.max(2, Math.floor(raw * (critical ? 1.5 : 1)));
    if (def.skill === "guarda") damage = Math.max(missed ? 0 : 1, Math.floor(damage * 0.78));
    health[target.name] = Math.max(0, health[target.name] - damage);
    turns.push({
      attacker: attacker.name, target: target.name, damage,
      health: health[target.name], attackerHealth: health[attacker.name],
      missed, critical, skill, healing
    });
    if (health[target.name] === 0) { winner = attacker.name; break; }
  }
  // Em limite de turnos, vence quem preservou a maior proporcao de PV.
  if (!winner) {
    const leftPercent = health[left.name] / initialHealth[left.name];
    const rightPercent = health[right.name] / initialHealth[right.name];
    winner = leftPercent !== rightPercent ? (leftPercent > rightPercent ? left.name : right.name)
      : (info[left.name].speed !== info[right.name].speed ? (info[left.name].speed > info[right.name].speed ? left.name : right.name)
      : [left.name, right.name].sort()[0]);
  }
  return { winner, loser: winner === left.name ? right.name : left.name, initialHealth, health, turns };
}
// Mantido para compatibilidade com testes e integracoes anteriores.
export function awardWin(players, winner) {
  return players.map(p => p.name === winner ? { ...p, wins: p.wins + 1 } : p);
}
// Liquidacao unica por combate. Vitoria/derrota, XP e moedas sao tratados juntos.
export function settleDuel(players, duel) {
  if (!duel || !duel.winner || !duel.loser || duel.winner === duel.loser) throw new Error("Resultado de duelo invalido.");
  if (!players.some(p => p.name === duel.winner) || !players.some(p => p.name === duel.loser)) throw new Error("Jogadores nao encontrados.");
  return players.map(p => {
    if (p.name === duel.winner) {
      const upgraded = gainExperience(p, 45);
      return { ...upgraded, wins: upgraded.wins + 1, gold: Math.min(MAX_GOLD, upgraded.gold + 28) };
    }
    if (p.name === duel.loser) {
      const upgraded = gainExperience(p, 20);
      return { ...upgraded, losses: upgraded.losses + 1, gold: Math.min(MAX_GOLD, upgraded.gold + 12) };
    }
    return p;
  });
}
