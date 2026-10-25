import {
  CHAT_SCOPE, REWARDS_SCOPE, CHAT_EVENT, REWARD_EVENT, EVENTSUB_URL,
  OAUTH_PENDING_KEY, buildLoginUrl, parseOAuthResult,
  interpretFrame, subscriptionPayload, isSafeReconnectUrl, isValidClientId
} from "./twitch-protocol.mjs";

const PUBLIC_CLIENT_KEY = "chat-arena-twitch-client-id";
const TOKEN_VALIDATE_URL = "https://id.twitch.tv/oauth2/validate";
const SUBSCRIBE_URL = "https://api.twitch.tv/helix/eventsub/subscriptions";

function createNonce() {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}

export class TwitchSession {
  constructor({ onStatus, onChat, onReward }) {
    this.onStatus = onStatus;
    this.onChat = onChat;
    this.onReward = onReward;
    this.auth = null;
    this.socket = null;
    this.previousSocket = null;
    this.stopped = true;
    this.migrating = false;
    this.connected = false;
    this.reconnectCount = 0;
    this.reconnectTimer = null;
    this.heartbeatTimer = null;
    this.validationTimer = null;
    this.lastValidated = 0;
    this.processedIds = new Set();
    this.lastStatus = "offline";
    this.report("offline", "Modo demonstração disponível.");
  }
  report(status, message) {
    this.lastStatus = status;
    this.onStatus?.({ status, message, channel: this.auth?.login ?? null });
  }
  getCurrentClientId() {
    try { return localStorage.getItem(PUBLIC_CLIENT_KEY) || ""; }
    catch { return ""; }
  }
  saveClientId(value) {
    if (isValidClientId(value)) {
      try { localStorage.setItem(PUBLIC_CLIENT_KEY, value.trim()); } catch {}
    }
  }
  redirectUri() {
    return new URL("./index.html", window.location.href).href.split(/[?#]/)[0];
  }
  beginLogin(clientId, withRewards) {
    if (!isValidClientId(clientId)) throw new Error("Informe o Client ID público do aplicativo Twitch (20 a 64 caracteres).");
    const state = createNonce();
    const pending = {
      clientId: clientId.trim(),
      redirectUri: this.redirectUri(), state, withRewards: Boolean(withRewards),
      createdAt: Date.now()
    };
    sessionStorage.setItem(OAUTH_PENDING_KEY, JSON.stringify(pending));
    this.saveClientId(pending.clientId);
    const url = buildLoginUrl(pending);
    this.report("authenticating", "Redirecionando para a autorização Twitch...");
    window.location.assign(url);
  }
  async restoreRedirect() {
    const hash = window.location.hash;
    const query = window.location.search;
    const isReturn = hash.includes("access_token=") || new URLSearchParams(query).has("error");
    if (!isReturn) return;
    // Remover token da URL imediatamente, antes de iniciar requisições ou carregar dados externos.
    window.history.replaceState(null, "", window.location.pathname);
    let pending;
    try { pending = JSON.parse(sessionStorage.getItem(OAUTH_PENDING_KEY) || "null"); }
    finally { sessionStorage.removeItem(OAUTH_PENDING_KEY); }
    try {
      const response = parseOAuthResult(hash, query);
      if (!pending || !response || !response.state || pending.state !== response.state ||
          !Number.isFinite(pending.createdAt) || Date.now() - pending.createdAt > 600000) {
        throw new Error("Autorização expirou ou estado OAuth inválido. Conecte novamente.");
      }
      if (response.error) throw new Error("Twitch não autorizou o aplicativo: " + response.error);
      if (!response.accessToken || !response.scopes.includes(CHAT_SCOPE) ||
        (pending.withRewards && !response.scopes.includes(REWARDS_SCOPE))) {
        throw new Error("O token não possui as permissões necessárias.");
      }
      await this.startSession({
        accessToken: response.accessToken,
        clientId: pending.clientId,
        withRewards: pending.withRewards
      });
    } catch (error) {
      this.report("error", error.message || "Falha na autenticação.");
    }
  }
  async fetchValidation(token) {
    const response = await fetch(TOKEN_VALIDATE_URL, {
      headers: { Authorization: "OAuth " + token }, cache: "no-store"
    });
    if (!response.ok) throw new Error("Token Twitch inválido ou expirado. Reconecte o aplicativo.");
    return response.json();
  }
  async startSession(auth) {
    this.stopConnection();
    this.report("connecting", "Validando acesso ao canal Twitch...");
    const validated = await this.fetchValidation(auth.accessToken);
    if (validated.client_id !== auth.clientId || !validated.user_id ||
      !Array.isArray(validated.scopes) || !validated.scopes.includes(CHAT_SCOPE) ||
      (auth.withRewards && !validated.scopes.includes(REWARDS_SCOPE))) {
      throw new Error("Token Twitch não corresponde ao aplicativo, canal ou permissões.");
    }
    this.auth = { ...auth, userId: String(validated.user_id), login: String(validated.login || "") };
    this.lastValidated = Date.now();
    this.stopped = false;
    this.report("connecting", "Abrindo canal seguro EventSub...");
    this.validationTimer = setInterval(() => void this.revalidate(), 3600000);
    document.addEventListener("visibilitychange", this.onVisibility);
    this.connectSocket(EVENTSUB_URL, false);
  }
  onVisibility = () => {
    if (!document.hidden && this.auth && Date.now() - this.lastValidated >= 3600000) void this.revalidate();
  };
  async revalidate() {
    if (this.stopped || !this.auth) return;
    try {
      const token = await this.fetchValidation(this.auth.accessToken);
      if (token.client_id !== this.auth.clientId || String(token.user_id) !== this.auth.userId ||
        !token.scopes?.includes(CHAT_SCOPE) || (this.auth.withRewards && !token.scopes.includes(REWARDS_SCOPE))) {
        throw new Error("Permissões Twitch foram alteradas.");
      }
      this.lastValidated = Date.now();
    } catch (error) {
      this.disconnect("Sessão Twitch encerrada: " + (error.message || "credencial inválida"), "error");
    }
  }
  async subscribe(sessionId) {
    const kinds = [CHAT_EVENT, ...(this.auth.withRewards ? [REWARD_EVENT] : [])];
    for (const type of kinds) {
      const response = await fetch(SUBSCRIBE_URL, {
        method: "POST",
        headers: {
          "Client-Id": this.auth.clientId,
          Authorization: "Bearer " + this.auth.accessToken,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(subscriptionPayload(type, this.auth.userId, sessionId))
      });
      if (!response.ok) {
        // Nunca ecoar o corpo completo da API ou credenciais no painel de chat.
        throw new Error("Falha ao inscrever " + type + " (HTTP " + response.status + "). Verifique as permissões e o canal.");
      }
    }
  }
  watchHeartbeat(seconds) {
    clearTimeout(this.heartbeatTimer);
    this.heartbeatTimer = setTimeout(() => {
      if (!this.stopped && this.socket) this.socket.close(4000, "Keepalive timeout");
    }, Math.max(30000, (Number(seconds) || 30) * 1800 + 5000));
  }
  connectSocket(url, migration) {
    if (this.stopped || !this.auth) return;
    if (migration && !isSafeReconnectUrl(url)) {
      this.report("error", "Twitch enviou endereço de reconexão inválido.");
      return;
    }
    const old = migration ? this.socket : null;
    this.migrating = Boolean(migration);
    const socket = new WebSocket(url);
    if (old) this.previousSocket = old;
    this.socket = socket;
    socket.onmessage = event => { void this.handleFrame(socket, event.data, migration); };
    socket.onclose = () => {
      if (socket === this.previousSocket) { this.previousSocket = null; return; }
      if (socket !== this.socket || this.stopped) return;
      clearTimeout(this.heartbeatTimer);
      this.connected = false;
      if (this.previousSocket) { this.previousSocket.close(); this.previousSocket = null; }
      this.report("reconnecting", "Conexão perdida. Tentando reconectar...");
      this.scheduleReconnect();
    };
    socket.onerror = () => {
      if (socket === this.socket && !this.stopped) this.report("reconnecting", "Erro de rede no EventSub.");
    };
  }
  async handleFrame(socket, raw, migration) {
    if (this.stopped || (socket !== this.socket && socket !== this.previousSocket)) return;
    let frame;
    try { frame = JSON.parse(raw); } catch { return; }
    const event = interpretFrame(frame, this.auth.userId, this.auth.withRewards);
    if (!event) return;
    if (socket === this.socket) this.watchHeartbeat(frame.payload?.session?.keepalive_timeout_seconds || 30);
    if (event.type === "welcome") {
      if (socket !== this.socket || !event.sessionId) return;
      if (migration) {
        this.previousSocket?.close();
        this.previousSocket = null;
        this.migrating = false;
        this.connected = true;
        this.reconnectCount = 0;
        this.report("connected", "Chat reconectado sem perder inscrições.");
        return;
      }
      try {
        await this.subscribe(event.sessionId);
        if (this.stopped || socket !== this.socket) return;
        this.connected = true;
        this.reconnectCount = 0;
        this.report("connected", "Lendo comandos no chat de " + this.auth.login + ".");
      } catch (error) {
        this.disconnect("Não foi possível assinar os eventos: " + error.message, "error");
      }
      return;
    }
    if (event.type === "reconnect") {
      if (socket === this.socket && isSafeReconnectUrl(event.url)) {
        this.report("reconnecting", "Twitch solicitou migração de sessão...");
        this.connectSocket(event.url, true);
      }
      return;
    }
    if (event.type === "revocation") {
      this.disconnect("Twitch revogou a assinatura EventSub: " + event.reason, "error");
      return;
    }
    if (!this.connected || !["chat", "reward"].includes(event.type)) return;
    if (this.processedIds.has(event.id)) return;
    this.processedIds.add(event.id);
    if (this.processedIds.size > 1000) this.processedIds.delete(this.processedIds.values().next().value);
    if (event.type === "chat") this.onChat?.(event);
    else this.onReward?.(event);
  }
  scheduleReconnect() {
    clearTimeout(this.reconnectTimer);
    const delay = Math.min(30000, 1000 * 2 ** Math.min(this.reconnectCount++, 5));
    this.reconnectTimer = setTimeout(async () => {
      if (this.stopped || !this.auth) return;
      if (Date.now() - this.lastValidated >= 3600000) {
        await this.revalidate();
        if (this.stopped) return;
      }
      this.connectSocket(EVENTSUB_URL, false);
    }, delay);
  }
  stopConnection() {
    this.stopped = true;
    this.connected = false;
    clearTimeout(this.reconnectTimer);
    clearTimeout(this.heartbeatTimer);
    clearInterval(this.validationTimer);
    document.removeEventListener("visibilitychange", this.onVisibility);
    this.socket?.close();
    this.previousSocket?.close();
    this.socket = null;
    this.previousSocket = null;
    this.auth = null;
    this.processedIds.clear();
  }
  disconnect(message = "Desconectado da Twitch. Demo offline disponível.", state = "offline") {
    this.stopConnection();
    this.report(state, message);
  }
}
