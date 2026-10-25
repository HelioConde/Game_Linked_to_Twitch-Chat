// Motor puro do modo demonstracao. Nao depende da Twitch nem do navegador.
export const MAX_PLAYERS = 60;

export function normalizeName(value) {
  const name = String(value ?? "").trim().replace(/^@/, "").toLowerCase();
  return /^[a-z0-9_]{1,25}$/.test(name) ? name : "";
}

export function normalizeSkin(value) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 && number <= 20 ? number : 1;
}

function safeNumber(value, fallback, max = 1000) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(max, Math.max(0, Math.floor(number))) : fallback;
}

export function createPlayer(value, skin = 1) {
  const name = normalizeName(value);
  if (!name) throw new Error("Nome de usuario invalido.");
  return { name, skin: normalizeSkin(skin), level: 0, attack: 1, defense: 1, health: 1, speed: 1, wins: 0 };
}

// Aceita tanto o formato novo quanto os backups antigos ({player: {nome, char...}}).
export function normalizePlayers(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const result = [];
  for (const item of input) {
    const source = item && typeof item === "object" ? (item.player || item) : null;
    if (!source || typeof source !== "object") continue;
    const name = normalizeName(source.name ?? source.nome);
    if (!name || seen.has(name)) continue;
    seen.add(name);
    result.push({
      name,
      skin: normalizeSkin(source.skin ?? source.char),
      level: safeNumber(source.level, 0),
      attack: safeNumber(source.attack ?? source.ataque, 1),
      defense: safeNumber(source.defense ?? source.defesa, 1),
      health: safeNumber(source.health ?? source.vida, 1),
      speed: safeNumber(source.speed ?? source.velocidade, 1),
      wins: safeNumber(source.wins ?? source.win, 0, 100000)
    });
    if (result.length === MAX_PLAYERS) break;
  }
  return result;
}

export function parseCommand(input) {
  const parts = String(input ?? "").trim().split(/\s+/);
  const command = (parts[0] || "").toLowerCase();
  if (["!entrar", "!join", "!criar"].includes(command)) return { type: "join", arg: parts[1] };
  if (["!treinar", "!level", "!upar"].includes(command)) return { type: "train" };
  if (["!skin", "!aparencia"].includes(command)) return { type: "skin", arg: parts[1] };
  if (["!duelo", "!pvp", "!x1"].includes(command)) return { type: "duel", arg: parts[1] };
  if (["!ajuda", "!help"].includes(command)) return { type: "help" };
  return { type: "unknown" };
}

export function applyCommand(players, sender, input) {
  const name = normalizeName(sender);
  if (!name) return { players, event: { type: "error", text: "Nome de usuario invalido." } };
  const cmd = parseCommand(input);
  const index = players.findIndex(player => player.name === name);
  const player = index >= 0 ? players[index] : null;
  const result = (type, text, extra = {}) => ({ players, event: { type, text, ...extra } });

  if (cmd.type === "help") return result("info", "Comandos: !entrar 1-20, !treinar, !skin 1-20, !duelo @usuario.");
  if (cmd.type === "unknown") return result("info", "Mensagem recebida. Use !ajuda para ver os comandos.");
  if (cmd.type === "join") {
    if (player) return result("info", name + " ja esta na arena.");
    if (players.length >= MAX_PLAYERS) return result("error", "A arena atingiu o limite de jogadores.");
    const next = [...players, createPlayer(name, cmd.arg ?? 1)];
    return { players: next, event: { type: "join", text: name + " entrou na arena!" } };
  }
  if (!player) return result("error", name + " precisa usar !entrar primeiro.");
  if (cmd.type === "train") {
    const next = players.map(item => item.name === name ? {
      ...item, level: Math.min(1000, item.level + 1),
      attack: Math.min(1000, item.attack + 1),
      defense: Math.min(1000, item.defense + 1),
      health: Math.min(1000, item.health + 1),
      speed: Math.min(1000, item.speed + 1)
    } : item);
    return { players: next, event: { type: "train", text: name + " treinou e ganhou um nivel!" } };
  }
  if (cmd.type === "skin") {
    const requested = Number(cmd.arg);
    if (!Number.isInteger(requested) || requested < 1 || requested > 20) {
      return result("error", "Escolha uma skin entre 1 e 20.");
    }
    return { players: players.map(item => item.name === name ? { ...item, skin: requested } : item),
      event: { type: "skin", text: name + " mudou para a skin " + requested + "." } };
  }
  if (cmd.type === "duel") {
    const target = normalizeName(cmd.arg);
    if (!target || !players.some(item => item.name === target)) return result("error", "Desafiado nao encontrado na arena.");
    if (target === name) return result("error", "Voce nao pode duelar consigo mesmo.");
    return result("duel", name + " desafiou " + target + "!", { challenger: name, opponent: target });
  }
  return result("error", "Comando desconhecido.");
}

export function runDuel(left, right, random = Math.random) {
  if (!left || !right || left.name === right.name) throw new Error("Duelo exige dois jogadores distintos.");
  const maxHealth = player => 25 + Math.max(1, player.health) * 6;
  const health = { [left.name]: maxHealth(left), [right.name]: maxHealth(right) };
  const initialHealth = { ...health };
  const turns = [];
  const first = left.speed >= right.speed ? left : right;
  const second = first === left ? right : left;
  let winner = null;

  for (let step = 0; step < 160; step += 1) {
    const attacker = step % 2 === 0 ? first : second;
    const target = attacker === left ? right : left;
    const missed = random() < 0.06;
    const variance = Math.floor(random() * 4);
    const rawDamage = 3 + attacker.attack * 2 + variance - Math.floor(target.defense * 0.85);
    const damage = missed ? 0 : Math.max(1, rawDamage);
    health[target.name] = Math.max(0, health[target.name] - damage);
    turns.push({ attacker: attacker.name, target: target.name, damage, health: health[target.name], missed });
    if (health[target.name] === 0) {
      winner = attacker.name;
      break;
    }
  }
  if (!winner) winner = health[left.name] >= health[right.name] ? left.name : right.name;
  return { winner, loser: winner === left.name ? right.name : left.name, initialHealth, health, turns };
}

export function awardWin(players, winner) {
  return players.map(player => player.name === winner ? { ...player, wins: player.wins + 1 } : player);
}
