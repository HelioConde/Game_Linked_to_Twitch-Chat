// Helpers puros da integração EventSub. Nenhum token ou segredo é persistido aqui.
import { normalizeName } from "./engine.mjs";

export const CHAT_SCOPE = "user:read:chat";
export const REWARDS_SCOPE = "channel:read:redemptions";
export const CHAT_EVENT = "channel.chat.message";
export const REWARD_EVENT = "channel.channel_points_custom_reward_redemption.add";
export const EVENTSUB_URL = "wss://eventsub.wss.twitch.tv/ws?keepalive_timeout_seconds=30";
export const OAUTH_PENDING_KEY = "chat-arena-twitch-oauth-state";

// Os identificadores abaixo pertencem às recompensas do jogo clássico de 2022.
// Podem não existir mais no canal; não são credenciais.
export const REWARD_COMMANDS = Object.freeze({
  "5b9999e9-23c0-4ee4-b257-1ae87d1d5120": "join",
  "d3e83db5-467d-4e85-b970-140535430716": "skin",
  "20dc0da2-d31a-43f4-8a24-e2bf5ff44417": "duel",
  "889e0b60-695a-410b-a667-113a19f7218b": "train",
  "28877035-4a19-44b0-82ef-a8ac32a75ff7": "health",
  "87de82e2-df81-4b62-8cc4-91cc6dac52ca": "speed",
  "b854181a-e9ea-4ecb-a0d3-559a326617a6": "defense",
  "d3182df2-77c6-49c2-84cc-221a5a6c88ca": "attack"
});

export function isValidClientId(value) {
  return typeof value === "string" && /^[a-z0-9]{20,64}$/i.test(value.trim());
}
export function buildLoginUrl({ clientId, redirectUri, state, withRewards = false }) {
  if (!isValidClientId(clientId)) throw new Error("Client ID Twitch inválido.");
  const callback = new URL(redirectUri);
  if (!["http:", "https:"].includes(callback.protocol)) throw new Error("Redirect URI inválida.");
  if (callback.protocol !== "https:" && !["localhost", "127.0.0.1"].includes(callback.hostname)) {
    throw new Error("Use HTTPS fora do ambiente local.");
  }
  if (!/^[a-zA-Z0-9_-]{24,128}$/.test(state)) throw new Error("Estado OAuth inválido.");
  const url = new URL("https://id.twitch.tv/oauth2/authorize");
  url.searchParams.set("client_id", clientId.trim());
  url.searchParams.set("redirect_uri", callback.href);
  url.searchParams.set("response_type", "token");
  url.searchParams.set("scope", [CHAT_SCOPE, ...(withRewards ? [REWARDS_SCOPE] : [])].join(" "));
  url.searchParams.set("state", state);
  return url.href;
}
export function parseOAuthResult(hash, query = "") {
  const fragment = new URLSearchParams(String(hash).replace(/^#/, ""));
  const errorQuery = new URLSearchParams(String(query).replace(/^\?/, ""));
  if (errorQuery.has("error")) return { error: errorQuery.get("error_description") || errorQuery.get("error"), state: errorQuery.get("state") };
  if (!fragment.has("access_token")) return null;
  return {
    accessToken: fragment.get("access_token"),
    state: fragment.get("state"),
    scopes: (fragment.get("scope") || "").split(/[ +]/).filter(Boolean)
  };
}
export function subscriptionPayload(type, broadcasterId, sessionId) {
  if (![CHAT_EVENT, REWARD_EVENT].includes(type)) throw new Error("Evento não permitido.");
  if (!/^\d+$/.test(String(broadcasterId))) throw new Error("ID de canal inválido.");
  if (!sessionId || typeof sessionId !== "string") throw new Error("Sessão EventSub inválida.");
  return {
    type, version: "1",
    condition: type === CHAT_EVENT ? { broadcaster_user_id: String(broadcasterId), user_id: String(broadcasterId) }
      : { broadcaster_user_id: String(broadcasterId) },
    transport: { method: "websocket", session_id: sessionId }
  };
}
export function interpretFrame(frame, broadcasterId, withRewards = false) {
  if (!frame || typeof frame !== "object") return null;
  const type = frame.metadata?.message_type;
  if (type === "session_welcome") return { type: "welcome", sessionId: frame.payload?.session?.id, keepalive: frame.payload?.session?.keepalive_timeout_seconds };
  if (type === "session_keepalive") return { type: "keepalive" };
  if (type === "session_reconnect") return { type: "reconnect", url: frame.payload?.session?.reconnect_url };
  if (type === "revocation") return { type: "revocation", reason: frame.payload?.subscription?.status || "unknown" };
  if (type !== "notification") return null;
  const subscriptionType = frame.metadata?.subscription_type || frame.payload?.subscription?.type;
  const event = frame.payload?.event;
  if (!event || String(event.broadcaster_user_id) !== String(broadcasterId)) return null;
  const id = frame.metadata?.message_id;
  if (!id || typeof id !== "string") return null;
  if (subscriptionType === CHAT_EVENT) {
    const sender = normalizeName(event.chatter_user_login);
    if (!sender || typeof event.message?.text !== "string") return null;
    return { type: "chat", id, sender, text: event.message.text.slice(0, 500) };
  }
  if (withRewards && subscriptionType === REWARD_EVENT) {
    const sender = normalizeName(event.user_login);
    if (!sender || typeof event.reward?.id !== "string") return null;
    return { type: "reward", id, sender, rewardId: event.reward.id, input: String(event.user_input || "").slice(0, 100) };
  }
  return null;
}
export function rewardToCommand(rewardId, input) {
  const action = Object.hasOwn(REWARD_COMMANDS, rewardId) ? REWARD_COMMANDS[rewardId] : "";
  const text = String(input || "").trim();
  if (!action) return null;
  if (action === "join") return "!entrar " + (/^(?:[1-9]|1\d|20)$/.test(text) ? text : "1");
  if (action === "skin") return "!skin " + (/^(?:[1-9]|1\d|20)$/.test(text) ? text : "1");
  if (action === "duel") {
    const name = normalizeName(text.replace(/\s+/g, ""));
    return name ? "!duelo @" + name : null;
  }
  if (action === "train") return "!treinar";
  return "!atributo " + action;
}
export function isSafeReconnectUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "wss:" && url.hostname === "eventsub.wss.twitch.tv" && url.port === "";
  } catch { return false; }
}
