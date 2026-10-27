import { MAX_PLAYERS, ITEMS, SKILLS, applyCommand, normalizeName, normalizePlayers, runDuel, settleDuel, xpToNext } from "./engine.mjs";
import { TwitchSession } from "./twitch-client.mjs";
import { rewardToCommand } from "./twitch-protocol.mjs";
import { readObsMode, readPreviewMode, overlayPosition, viewUrl } from "./obs-mode.mjs";
import { SKINS, getSkin } from "./skin-library.mjs";

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
function setTransparentOverlay(enabled) {
  // OBS exige pixels transparentes em html e body, inclusive em navegadores
  // que aplicam estilos do tema antes de recalcular a classe .obs-mode.
  for (const element of [document.documentElement, document.body]) {
    if (enabled) {
      element.style.setProperty("background-color", "transparent", "important");
      element.style.setProperty("background-image", "none", "important");
    } else {
      element.style.removeProperty("background-color");
      element.style.removeProperty("background-image");
    }
  }
}

let overlayActive = readObsMode(window.location.search);
document.body.classList.toggle("obs-mode", overlayActive);
document.documentElement.classList.toggle("obs-document", overlayActive);
setTransparentOverlay(overlayActive);

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

function notify(message) {
  $("status").textContent = message;
  $("activityHighlight").textContent = message;
}

const WORKSPACES = ["play", "heroes", "connect"];
let activeWorkspace = "play";
function selectWorkspace(workspace, focus = false) {
  if (!WORKSPACES.includes(workspace)) return;
  activeWorkspace = workspace;
  for (const name of WORKSPACES) {
    const chosen = name === workspace;
    const tab = $("tab-" + name);
    const panel = $("panel-" + name);
    tab.setAttribute("aria-selected", String(chosen));
    tab.tabIndex = chosen ? 0 : -1;
    panel.hidden = !chosen;
    if (chosen && focus) tab.focus();
  }
}
document.querySelectorAll(".workspace-tab").forEach(tab => {
  tab.addEventListener("click", () => selectWorkspace(tab.dataset.workspace));
  tab.addEventListener("keydown", event => {
    const index = WORKSPACES.indexOf(tab.dataset.workspace);
    const next = event.key === "ArrowRight" ? index + 1
      : event.key === "ArrowLeft" ? index - 1 : event.key === "Home" ? 0
      : event.key === "End" ? WORKSPACES.length - 1 : -1;
    if (next === -1) return;
    event.preventDefault();
    selectWorkspace(WORKSPACES[(next + WORKSPACES.length) % WORKSPACES.length], true);
  });
});


function setSprite(node, skin) {
  const appearance = getSkin(skin);
  node.style.backgroundImage = 'url("' + appearance.image + '")';
  node.style.backgroundSize = "contain";
  node.style.backgroundPosition = "center bottom";
  node.style.backgroundRepeat = "no-repeat";
  node.style.imageRendering = "auto";
}



function renderSkinGallery() {
  const gallery = $("skinGallery");
  gallery.replaceChildren();
  for (const skin of SKINS) {
    const button = element("button", "skin-card");
    button.type = "button";
    button.dataset.skin = String(skin.id);
    button.setAttribute("aria-label", "Selecionar aparência " + skin.id + ": " + skin.name);
    const image = document.createElement("img");
    image.src = skin.image;
    image.alt = "";
    image.loading = "lazy";
    image.decoding = "async";
    image.width = 124;
    image.height = 124;
    const label = element("span", "skin-card-name", skin.name);
    const number = element("span", "skin-card-number", "#" + String(skin.id).padStart(2, "0"));
    button.append(image, label, number);
    button.addEventListener("click", () => {
      const username = normalizeName($("username").value);
      const exists = username && players.some(player => player.name === username);
      $("command").value = (exists ? "!skin " : "!entrar ") + skin.id;
      $("command").focus();
      gallery.querySelectorAll(".skin-card").forEach(item => {
        item.classList.toggle("is-selected", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });
      selectWorkspace("play");
      notify(skin.name + " selecionado. Clique em Enviar para confirmar.");
    });
    gallery.append(button);
  }
}
renderSkinGallery();

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
    const placement = overlayActive ? overlayPosition(index, Math.min(12, players.length)) :
      { left: 10 + (index % 6) * 16 + "%", bottom: (index < 6 ? 11 : 48) + "%" };
    if (!overlayActive) {
      const rowSize = Math.min(6, players.length);
      const currentRowCount = index < 6 ? rowSize : Math.min(6, players.length - 6);
      const inRow = index < 6 ? index : index - 6;
      placement.left = (12 + (inRow + 0.5) * 76 / currentRowCount) + "%";
    }
    hero.style.left = placement.left;
    hero.style.bottom = placement.bottom;
    hero.style.zIndex = index < 6 ? "3" : "2";
    hero.append(element("span", "hero-name", player.name));
    hero.append(element("span", "hero-level", "NV " + player.level));
    const sprite = element("div", "sprite");
    sprite.setAttribute("role", "img");
    sprite.setAttribute("aria-label", getSkin(player.skin).name + " de " + player.name);
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
    view.addEventListener("click", () => { selectedName = player.name; selectWorkspace("heroes"); renderProfile(); });
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
  $("detailLevel").textContent = getSkin(selected.skin).name + " • Nível " + selected.level + " • " + selected.wins + " V / " + selected.losses + " D";
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
  $("obsPlayerCount").textContent = players.length + " aventureiros";
  $("stat-duels").textContent = String(duelCount);
  $("stat-level").textContent = String(Math.max(0, ...players.map(player => player.level)));
  renderArena();
  renderLeaderboard();
  renderRoster();
  renderProfile();
}

// Um acontecimento por ação, com consolidação de repetição e histórico curto.
function logMessage(author, content, type = "system") {
  const placeholder = nodes.chat.querySelector(".chat-placeholder");
  if (placeholder) placeholder.remove();
  const key = author + "|" + type + "|" + content;
  const previous = [...nodes.chat.querySelectorAll(".chat-line")].find(item =>
    item.dataset.eventKey === key && Date.now() - Number(item.dataset.updatedAt) < 60000);
  if (previous) {
    const repeats = Number(previous.dataset.repeats || "1") + 1;
    previous.dataset.repeats = String(repeats);
    previous.dataset.updatedAt = String(Date.now());
    previous.querySelector(".repeat-count").textContent = " ×" + repeats;
    nodes.chat.append(previous);
  } else {
    const line = element("div", "chat-line" + (type === "user" ? "" : " " + type));
    line.dataset.eventKey = key;
    line.dataset.updatedAt = String(Date.now());
    line.dataset.repeats = "1";
    const timestamp = element("span", "timestamp", new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    line.append(timestamp, element("b", "", author), document.createTextNode(" " + content), element("span", "repeat-count"));
    nodes.chat.append(line);
  }
  while (nodes.chat.children.length > 7) nodes.chat.firstElementChild.remove();
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
  for (const button of document.querySelectorAll("[data-quick]")) button.disabled = true;
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
    logMessage("ARENA", result.winner + " venceu " + result.loser + " • +45 XP e 28 moedas.", "system");
    await pause(1100);
  } finally {
    nodes.duel.hidden = true;
    nodes.actors.hidden = false;
    $("seedDemo").disabled = false;
    $("resetDemo").disabled = false;
    $("sendChat").disabled = live;
    $("importLegacy").disabled = live;
    for (const button of document.querySelectorAll("[data-quick]")) button.disabled = live;
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
  const outcome = applyCommand(players, name, text);
  players = outcome.players;
  persist();
  render();
  const commandType = text.split(/\s+/)[0].toLowerCase();
  if (outcome.event.type === "info" && ["!perfil", "!inventario", "!inv", "!loja"].includes(commandType)) {
    selectedName = name;
    selectWorkspace("heroes");
    const target = commandType === "!loja" ? document.querySelector(".shop-panel") : document.querySelector(".profile-panel");
    if (target) target.scrollIntoView({ block: "nearest", behavior: "instant" });
    notify(commandType === "!loja" ? "Loja aberta: veja itens e preços." : "Ficha e inventário abertos.");
  } else if (outcome.event.type === "info" && ["!ajuda", "!help"].includes(commandType)) {
    selectWorkspace("play");
    $("advancedCommands").open = true;
    notify("Veja a lista em Mais comandos e escolha uma ação.");
  } else {
    logMessage("ARENA", outcome.event.text, outcome.event.type === "error" ? "error" : "system");
  }
  if (outcome.event.type === "duel") void animateDuel(outcome.event.challenger, outcome.event.opponent);
}

$("chatForm").addEventListener("submit", event => {
  event.preventDefault();
  submitCommand($("username").value, $("command").value);
  $("command").focus();
});

document.querySelectorAll("[data-quick]").forEach(button => {
  button.addEventListener("click", () => {
    const user = normalizeName($("username").value);
    if (!user) { logMessage("ARENA", "Informe um nome de usuário válido.", "error"); return; }
    if (button.dataset.quick === "join") submitCommand(user, "!entrar 1");
    else if (button.dataset.quick === "train") submitCommand(user, "!treinar");
    else if (button.dataset.quick === "duel") {
      const opponent = players.find(player => player.name !== user);
      if (opponent) submitCommand(user, "!duelo @" + opponent.name);
      else logMessage("ARENA", "Crie pelo menos dois personagens antes do duelo.", "error");
    }
  });
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
  nodes.chat.replaceChildren(element("p", "chat-placeholder", "Acontecimentos importantes aparecerão aqui."));
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
notify("Pronto para jogar. Clique em Entrar ou + Criar equipe.");


// Twitch é opt-in: o modo offline segue jogável sem autenticação.
function updateTwitchStatus({ status, message, channel }) {
  live = status === "connected";
  $("obsConnection").textContent = status === "connected" ? "TWITCH AO VIVO" :
    status === "connecting" ? "CONECTANDO" : "DEMONSTRAÇÃO";
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
  for (const button of document.querySelectorAll("[data-quick]")) button.disabled = live || fighting;
  if (!live) { liveQueue.length = 0; userCooldown.clear(); }
}
twitchSession = new TwitchSession({
  onStatus: updateTwitchStatus,
  onChat: event => {
    // O painel é um resumo do RPG; conversas comuns continuam no chat Twitch.
    if (!event.text.trimStart().startsWith("!")) return;
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


// A janela que recebeu o OAuth pode ser capturada pelo OBS em modo transparente.
// Não copiamos access tokens para outra aba, URL, localStorage ou BroadcastChannel.
function toggleObsMode(force = !overlayActive) {
  overlayActive = Boolean(force);
  document.body.classList.toggle("obs-mode", overlayActive);
  document.documentElement.classList.toggle("obs-document", overlayActive);
setTransparentOverlay(overlayActive);
  const target = viewUrl(window.location.href, overlayActive);
  window.history.replaceState(null, "", target.pathname + target.search);
  $("obsExit").hidden = !overlayActive;
  $("obsEnter").setAttribute("aria-pressed", String(overlayActive));
  renderArena();
  notify(overlayActive ? "Modo OBS ativado. Pressione Escape para retornar ao painel." : "Painel restaurado.");
}
$("obsEnter").addEventListener("click", () => toggleObsMode(true));
$("obsExit").addEventListener("click", () => toggleObsMode(false));
document.addEventListener("keydown", event => {
  if (event.key === "Escape" && overlayActive) toggleObsMode(false);
});
$("obsCopy").addEventListener("click", async () => {
  const preview = viewUrl(window.location.href, true, true).href;
  try {
    await navigator.clipboard.writeText(preview);
    notify("Endereço da prévia OBS copiado.");
  } catch {
    $("obsPreviewUrl").textContent = preview;
    notify("Copie o endereço exibido no painel OBS.");
  }
});
$("obsPreviewUrl").textContent = viewUrl(window.location.href, true, true).href;
$("obsExit").hidden = !overlayActive;
$("obsEnter").setAttribute("aria-pressed", String(overlayActive));

// Prévia isolada, para OBS Browser Source sem autenticação ou sincronização falsa.
// A versão real funciona na MESMA aba autenticada, usando captura de janela.
if (readPreviewMode(window.location.search) && !players.length) {
  for (const [name, skin] of [["alchemy_flames", 1], ["luci", 5], ["pixel_witch", 9], ["slime_keeper", 15]]) {
    players = applyCommand(players, name, "!entrar " + skin).players;
  }
  render();
}
