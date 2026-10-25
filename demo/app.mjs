import { MAX_PLAYERS, applyCommand, awardWin, normalizeName, normalizePlayers, runDuel } from "./engine.mjs";

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
    text.append(element("small", "", "NV " + player.level + "  •  ATQ " + player.attack + "  •  DEF " + player.defense));
    row.append(text);
    nodes.roster.append(row);
  });
}

function render() {
  $("stat-players").textContent = String(players.length);
  $("stat-duels").textContent = String(duelCount);
  $("stat-level").textContent = String(Math.max(0, ...players.map(player => player.level)));
  renderArena();
  renderLeaderboard();
  renderRoster();
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
      $(targetPrefix + "Sprite").classList.toggle("hit", !turn.missed);
      $(sourcePrefix + "Sprite").classList.remove("hit");
      $("battleLog").textContent = turn.missed
        ? turn.attacker + " errou o ataque!"
        : turn.attacker + " causou " + turn.damage + " de dano em " + turn.target + ".";
      await pause(300);
      $(targetPrefix + "Sprite").classList.remove("hit");
    }
    $("battleLog").textContent = "🏆 " + result.winner + " venceu o duelo!";
    players = awardWin(players, result.winner);
    duelCount += 1;
    persist();
    render();
    logMessage("ARENA", result.winner + " venceu " + result.loser + "!", "system");
    await pause(1100);
  } finally {
    nodes.duel.hidden = true;
    nodes.actors.hidden = false;
    $("seedDemo").disabled = false;
    $("resetDemo").disabled = false;
    $("sendChat").disabled = false;
    $("importLegacy").disabled = false;
    fighting = false;
    render();
  }
}

function submitCommand(sender, command) {
  if (fighting) { logMessage("SISTEMA", "Aguarde o final do duelo.", "error"); return; }
  const name = normalizeName(sender);
  const text = String(command || "").trim();
  if (!name) { logMessage("SISTEMA", "Use um nome valido com letras, numeros ou _.", "error"); return; }
  if (!text) { logMessage("SISTEMA", "Digite um comando.", "error"); return; }
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
  if (fighting) return;
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
  if (fighting || !window.confirm("Apagar os personagens do modo demonstracao? O jogo classico nao sera afetado.")) return;
  players = [];
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
  if (fighting) return;
  const existing = new Set(players.map(player => player.name));
  const newPlayers = findLegacy().filter(player => !existing.has(player.name));
  const space = MAX_PLAYERS - players.length;
  players = [...players, ...newPlayers.slice(0, space)];
  persist();
  render();
  logMessage("ARENA", Math.min(space, newPlayers.length) + " personagens antigos importados. Backup original preservado.", "system");
});

render();
logMessage("ARENA", "Demo offline iniciada. Use !entrar 1 ou Adicionar aventureiros.", "system");
