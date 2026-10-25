import { MAX_PLAYERS, ITEMS, SKILLS, applyCommand, normalizeName, normalizePlayers, runDuel, settleDuel, xpToNext } from "./engine.mjs";
import { TwitchSession } from "./twitch-client.mjs";
import { rewardToCommand } from "./twitch-protocol.mjs";

const STORAGE_KEY = "twitch-chat-arena-demo-v1";
const $ = id => document.getElementById(id);
const nodes = {
  actors: $("actors"), emptyArena: $("emptyArena"), duel: $("duelView"),
  leaderboard: $("leaderboard"), leaderboardEmpty: $("leaderboardEmpty"),
  roster: $("roster"), rosterEmpty: $("rosterEmpty"), chat: $("chatFeed")
};
let players = readSaved();
let duelCount = 0;
let fighting = false;
let selectedName = players[0]?.name ?? null;
const liveQueue = [];
const userCooldown = new Map();
let twitchSession = null;
let live = false;

function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = String(text);
  return node;
}

function readSaved() {
  try { return normalizePlayers(JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]")); }
  catch (error) { console.warn("Nao foi possivel carregar a demo.", error); return []; }
}

function persist() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(players)); }
  catch (error) { notify("O navegador nao permitiu salvar os personagens."); }
}

function notify(message) { $("status").textContent = message; }

function setSprite(node, skin) {
  const number = Number(skin);
  const safeSkin = Number.isInteger(number) && number >= 1 && number <= 20 ? number : 1;
  node.style.backgroundImage = 'url("../img/charB' + safeSkin + '.png")';
}

function avatar(player) {
  const node = element("div", "avatar-mini");
  node.setAttribute("aria-hidden", "true");
  setSprite(node, player.skin);
  return node;
}

function renderArena() {
  nodes.actors.replaceChildren();
  nodes.emptyArena.hidden = players.length > 0;
  $("sceneCount").textContent = players.length + " / " + MAX_PLAYERS + " jogadores" + (players.length > 12 ? " • 12 exibidos" : "");
  players.slice(0, 12).forEach((player, index) => {
    const hero = element("div", "hero");
    hero.style.left = 10 + (index % 6) * 16 + "%";
    hero.style.bottom = (index < 6 ? 11 : 48) + "%";
    hero.style.zIndex = index < 6 ? "3" : "2";
    hero.append(element("span", "hero-name", player.name));
    hero.append(element("span", "hero-level", "NV " + player.level));
    const sprite = element("div", "sprite");
    sprite.setAttribute("role", "img");
    sprite.setAttribute("aria-label", "Aparencia " + player.skin + " de " + player.name);
    setSprite(sprite, player.skin);
    hero.append(sprite);
    nodes.actors.append(hero);
  });
}

function renderLeaderboard() {
  nodes.leaderboard.replaceChildren();
  const sorted = [...players].sort((a, b) => b.wins - a.wins || b.level - a.level || a.name.localeCompare(b.name)).slice(0, 5);
  nodes.leaderboardEmpty.hidden = sorted.length > 0;
  sorted.forEach((player, index) => {
    const row = element("li");
    row.append(element("span", "position", String(index + 1).padStart(2, "0")));
    row.append(avatar(player), element("span", "rank-name", player.name));
    const info = element("span", "rank-info");
    info.append(element("strong", "", player.wins + " vitórias"), document.createElement("br"), document.createTextNode("Nível " + player.level));
    row.append(info);
    nodes.leaderboard.append(row);
  });
}

function renderRoster() {
  nodes.roster.replaceChildren();
  $("rosterCount").textContent = players.length + " registrados";
  nodes.rosterEmpty.hidden = players.length > 0;
  players.forEach(player => {
    const row = element("div", "roster-item");
    row.append(avatar(player));
    const text = element("div");
    text.append(element("strong", "", player.name));
    text.append(element("small", "", "NV " + player.level + "  •  " + player.xp + "/" + xpToNext(player.level) + " XP  •  " + player.gold + " moedas"));
    const view = element("button", "roster-view", "Ver perfil");
    view.type = "button";
    view.setAttribute("aria-label", "Ver perfil de " + player.name);
    view.addEventListener("click", () => { selectedName = player.name; renderProfile(); });
    row.append(text, view);
    nodes.roster.append(row);
  });
}

function renderProfile() {
  const selected = players.find(player => player.name === selectedName) ?? players[0];
  $("profileEmpty").hidden = Boolean(selected);
  $("profileContent").hidden = !selected;
  if (!selected) { selectedName = null; return; }
  selectedName = selected.name;
  $("detailName").textContent = selected.name;
  $("detailLevel").textContent = "Nível " + selected.level + " • " + selected.wins + " V / " + selected.losses + " D";
  $("detailStats").textContent = "Ataque " + selected.attack + " • Defesa " + selected.defense +
    " • Vida " + selected.health + " • Velocidade " + selected.speed;
  $("detailXp").textContent = selected.xp + " / " + xpToNext(selected.level) + " XP";
  $("detailXpBar").style.width = Math.min(100, selected.xp / xpToNext(selected.level) * 100) + "%";
  $("detailGold").textContent = selected.gold + " moedas";
  $("detailSkill").textContent = "Habilidade: " + selected.skill + " — " + SKILLS[selected.skill];
  $("detailGear").textContent = "Equipado: " + ITEMS[selected.equipment.weapon].name +
    " / " + ITEMS[selected.equipment.armor].name;
  $("detailInventory").replaceChildren();
  for (const id of selected.inventory) {
    const item = ITEMS[id];
    const chip = element("span", "inventory-chip", item.name);
    if (Object.values(selected.equipment).includes(id)) chip.classList.add("equipped");
    $("detailInventory").append(chip);
  }
  document.querySelectorAll(".roster-view").forEach(button => {
    const row = button.closest(".roster-item");
    const active = row?.querySelector("strong")?.textContent === selectedName;
    button.setAttribute("aria-pressed", String(active));
  });
}

function render() {
  $("stat-players").textContent = String(players.length);
  $("stat-duels").textContent = String(duelCount);
  $("stat-level").textContent = String(Math.max(0, ...players.map(player => player.level)));
  renderArena();
  renderLeaderboard();
  renderRoster();
  renderProfile();
}

function logMessage(author, content, type = "user") {
  const placeholder = nodes.chat.querySelector(".chat-placeholder");
  if (placeholder) placeholder.remove();
  const line = element("div", "chat-line" + (type === "user" ? "" : " " + type));
  const timestamp = element("span", "timestamp", new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
  line.append(timestamp, element("b", "", author), document.createTextNode("  " + content));
  nodes.chat.append(line);
  while (nodes.chat.children.length > 50) nodes.chat.firstElementChild.remove();
  nodes.chat.scrollTop = nodes.chat.scrollHeight;
  notify(content);
}

async function pause(milliseconds) { return new Promise(resolve => setTimeout(resolve, milliseconds)); }

function setFighter(prefix, player, health) {
  $(prefix + "Name").textContent = player.name;
  setSprite($(prefix + "Sprite"), player.skin);
  $(prefix + "Hp").textContent = health + " PV";
  $(prefix + "Bar").style.width = "100%";
}

async function animateDuel(challenger, opponent) {
  if (fighting) return;
  const left = players.find(player => player.name === challenger);
  const right = players.find(player => player.name === opponent);
  if (!left || !right) return;
  fighting = true;
  $("seedDemo").disabled = true;
  $("resetDemo").disabled = true;
  $("sendChat").disabled = true;
  $("importLegacy").disabled = true;
  const result = runDuel(left, right);
  setFighter("fighterLeft", left, result.initialHealth[left.name]);
  setFighter("fighterRight", right, result.initialHealth[right.name]);
  nodes.emptyArena.hidden = true;
  nodes.actors.hidden = true;
  nodes.duel.hidden = false;
  $("battleLog").textContent = "Preparando o combate...";
  try {
    await pause(600);
    for (const turn of result.turns) {
      const targetPrefix = turn.target === left.name ? "fighterLeft" : "fighterRight";
      const sourcePrefix = turn.attacker === left.name ? "fighterLeft" : "fighterRight";
      $(targetPrefix + "Bar").style.width = Math.max(0, turn.health / result.initialHealth[turn.target] * 100) + "%";
      $(targetPrefix + "Hp").textContent = turn.health + " PV";
      $(sourcePrefix + "Bar").style.width = Math.max(0, turn.attackerHealth / result.initialHealth[turn.attacker] * 100) + "%";
      $(sourcePrefix + "Hp").textContent = turn.attackerHealth + " PV";
      const targetSprite = $(targetPrefix + "Sprite");
      const sourceSprite = $(sourcePrefix + "Sprite");
      targetSprite.classList.toggle("hit", !turn.missed);
      sourceSprite.classList.toggle("attacking", true);
      sourceSprite.classList.toggle("casting", Boolean(turn.skill));
      $("battleLog").textContent = turn.missed
        ? turn.attacker + " errou o ataque!"
        : turn.attacker + (turn.skill ? " usou " + turn.skill + " e" : "") +
          " causou " + turn.damage + " de dano" + (turn.critical ? " CRÍTICO" : "") +
          (turn.healing ? " • recuperou " + turn.healing + " PV" : "") + "!";
      await pause(Math.max(95, 320 - result.turns.length * 2));
      targetSprite.classList.remove("hit");
      sourceSprite.classList.remove("attacking", "casting");
    }
    $("battleLog").textContent = "🏆 " + result.winner + " venceu o duelo!";
    players = settleDuel(players, result);
    duelCount += 1;
    persist();
    render();
    logMessage("ARENA", result.winner + " venceu " + result.loser + " (+45 XP, +28 moedas)! " + result.loser + " recebeu 20 XP e 12 moedas.", "system");
    await pause(1100);
  } finally {
    nodes.duel.hidden = true;
    nodes.actors.hidden = false;
    $("seedDemo").disabled = false;
    $("resetDemo").disabled = false;
    $("sendChat").disabled = live;
    $("importLegacy").disabled = live;
    fighting = false;
    render();
    if (liveQueue.length && live) setTimeout(flushLiveQueue, 150);
  }
}

function flushLiveQueue() {
  if (fighting || !live || !liveQueue.length) return;
  const next = liveQueue.shift();
  submitCommand(next.sender, next.command, "twitch");
  if (!fighting && liveQueue.length) setTimeout(flushLiveQueue, 150);
}

function submitCommand(sender, command, source = "demo") {
  if (fighting) {
    if (source === "twitch" && liveQueue.length < 50) liveQueue.push({ sender, command });
    else if (source === "demo") logMessage("SISTEMA", "Aguarde o final do duelo.", "error");
    return;
  }
  const name = normalizeName(sender);
  const text = String(command || "").trim();
  if (!name) { logMessage("SISTEMA", "Use um nome valido com letras, numeros ou _.", "error"); return; }
  if (!text) { logMessage("SISTEMA", "Digite um comando.", "error"); return; }
  if (source === "twitch") {
    // Evita spam de comandos e sobrecarga durante transmissões.
    const now = Date.now();
    const previous = userCooldown.get(name) || 0;
    if (now - previous < 1500) return;
    if (userCooldown.size > 400) userCooldown.clear();
    userCooldown.set(name, now);
  }
  logMessage(name, text);
  const outcome = applyCommand(players, name, text);
  players = outcome.players;
  persist();
  render();
  logMessage("ARENA", outcome.event.text, outcome.event.type === "error" ? "error" : "system");
  if (outcome.event.type === "duel") void animateDuel(outcome.event.challenger, outcome.event.opponent);
}

$("chatForm").addEventListener("submit", event => {
  event.preventDefault();
  submitCommand($("username").value, $("command").value);
  $("command").focus();
});

document.querySelectorAll("[data-command]").forEach(button => {
  button.addEventListener("click", () => {
    $("command").value = button.dataset.command;
    $("command").focus();
  });
});

$("seedDemo").addEventListener("click", () => {
  if (fighting || live) return;
  const samples = [["alchemy_flames", 1], ["luci", 5], ["pixel_witch", 9], ["slime_keeper", 15]];
  let added = 0;
  for (const [name, skin] of samples) {
    if (players.some(player => player.name === name)) continue;
    players = applyCommand(players, name, "!entrar " + skin).players;
    added += 1;
  }
  if (added) {
    players = applyCommand(players, "luci", "!treinar").players;
    players = applyCommand(players, "pixel_witch", "!treinar").players;
    persist();
    render();
    logMessage("ARENA", added + " aventureiros de demonstracao adicionados.", "system");
  } else {
    logMessage("ARENA", "Todos os personagens de exemplo ja estao na arena.", "system");
  }
});

$("resetDemo").addEventListener("click", () => {
  if (fighting || live || !window.confirm("Apagar os personagens do modo demonstracao? O jogo classico nao sera afetado.")) return;
  players = [];
  selectedName = null;
  duelCount = 0;
  persist();
  render();
  logMessage("ARENA", "Modo demonstracao reiniciado.", "system");
});

$("clearChat").addEventListener("click", () => {
  nodes.chat.replaceChildren(element("p", "chat-placeholder", "Os eventos aparecerão aqui."));
  notify("Historico visual do chat apagado.");
});

function findLegacy() {
  try { return normalizePlayers(JSON.parse(localStorage.getItem("players") || "[]")); }
  catch { return []; }
}
const importedPlayers = findLegacy();
$("importLegacy").hidden = importedPlayers.length === 0;
$("importLegacy").addEventListener("click", () => {
  if (fighting || live) return;
  const existing = new Set(players.map(player => player.name));
  const newPlayers = findLegacy().filter(player => !existing.has(player.name));
  const space = Math.max(0, MAX_PLAYERS - players.length);
  players = [...players, ...newPlayers.slice(0, space)];
  persist();
  render();
  logMessage("ARENA", Math.min(space, newPlayers.length) + " personagens antigos importados. Backup original preservado.", "system");
});

render();
logMessage("ARENA", "Demo offline iniciada. Use !entrar 1 ou Adicionar aventureiros.", "system");


// Twitch é opt-in: o modo offline segue jogável sem autenticação.
function updateTwitchStatus({ status, message, channel }) {
  live = status === "connected";
  $("twitchStatus").textContent = status === "connected" ? "AO VIVO"
    : status === "connecting" || status === "authenticating" ? "CONECTANDO"
    : status === "reconnecting" ? "RECONECTANDO" : status === "error" ? "ERRO" : "OFFLINE";
  $("twitchStatus").dataset.status = status;
  $("twitchStatusMessage").textContent = message;
  $("twitchChannel").textContent = channel ? "Canal autorizado: " + channel : "Conecte a conta proprietária do canal.";
  $("twitchDisconnect").hidden = status === "offline" || status === "error";
  $("twitchConnect").disabled = ["connecting", "authenticating", "reconnecting", "connected"].includes(status);
  $("sendChat").disabled = live || fighting;
  $("username").disabled = live;
  $("command").disabled = live;
  for (const button of document.querySelectorAll("[data-command]")) button.disabled = live;
  $("seedDemo").disabled = live || fighting;
  $("resetDemo").disabled = live || fighting;
  $("importLegacy").disabled = live || fighting;
  $("liveModeNotice").hidden = !live;
  if (!live) { liveQueue.length = 0; userCooldown.clear(); }
}
twitchSession = new TwitchSession({
  onStatus: updateTwitchStatus,
  onChat: event => {
    // Mensagens comuns aparecem no histórico; apenas comandos acionam o RPG.
    if (!event.text.trimStart().startsWith("!")) {
      logMessage(event.sender, event.text.slice(0, 160));
      return;
    }
    submitCommand(event.sender, event.text.slice(0, 100), "twitch");
  },
  onReward: event => {
    const command = rewardToCommand(event.rewardId, event.input);
    if (command) submitCommand(event.sender, command, "twitch");
  }
});
$("twitchClientId").value = twitchSession.getCurrentClientId();
$("twitchRedirect").textContent = twitchSession.redirectUri();
$("twitchConnect").addEventListener("click", () => {
  try { twitchSession.beginLogin($("twitchClientId").value, $("twitchRewards").checked); }
  catch (error) { logMessage("TWITCH", error.message, "error"); }
});
$("twitchDisconnect").addEventListener("click", () => {
  twitchSession.disconnect();
  logMessage("TWITCH", "Chat real desconectado. O simulador está disponível.", "system");
});
void twitchSession.restoreRedirect().catch(error => {
  twitchSession.disconnect("Falha ao recuperar autorização Twitch: " + error.message, "error");
});
