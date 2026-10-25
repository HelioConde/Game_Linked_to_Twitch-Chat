import test from "node:test";
import assert from "node:assert/strict";
import {
  CHAT_SCOPE, REWARDS_SCOPE, CHAT_EVENT, REWARD_EVENT,
  REWARD_COMMANDS, isValidClientId, buildLoginUrl, parseOAuthResult,
  subscriptionPayload, interpretFrame, rewardToCommand, isSafeReconnectUrl
} from "../demo/twitch-protocol.mjs";
import { createPlayer, applyCommand } from "../demo/engine.mjs";

const CLIENT_ID = "a".repeat(30);
const STATE = "0123456789abcdefghijklmnop";
const REDIRECT = "https://example.github.io/Game_Linked_to_Twitch-Chat/demo/index.html";

test("OAuth Twitch implícito usa apenas Client ID e state, nunca Client Secret", () => {
  const url = new URL(buildLoginUrl({ clientId: CLIENT_ID, redirectUri: REDIRECT, state: STATE }));
  assert.equal(url.origin, "https://id.twitch.tv");
  assert.equal(url.searchParams.get("response_type"), "token");
  assert.equal(url.searchParams.get("redirect_uri"), REDIRECT);
  assert.equal(url.searchParams.get("scope"), CHAT_SCOPE);
  assert.equal(url.searchParams.get("state"), STATE);
  assert.equal(url.searchParams.has("client_secret"), false);
});
test("permissão de pontos é explicitamente opt-in", () => {
  const url = new URL(buildLoginUrl({ clientId: CLIENT_ID, redirectUri: REDIRECT, state: STATE, withRewards: true }));
  assert.equal(url.searchParams.get("scope"), CHAT_SCOPE + " " + REWARDS_SCOPE);
});
test("valida Client ID, origem HTTPS e state", () => {
  assert.equal(isValidClientId(CLIENT_ID), true);
  assert.equal(isValidClientId("invalid"), false);
  assert.throws(() => buildLoginUrl({ clientId:"<script>", redirectUri:REDIRECT, state:STATE }));
  assert.throws(() => buildLoginUrl({ clientId:CLIENT_ID, redirectUri:"http://malicious.test", state:STATE }));
  assert.throws(() => buildLoginUrl({ clientId:CLIENT_ID, redirectUri:REDIRECT, state:"abc" }));
  assert.ok(buildLoginUrl({ clientId:CLIENT_ID, redirectUri:"http://localhost:8000/demo/index.html", state:STATE }));
});
test("fragmento OAuth é interpretado sem registrar nem persistir token", () => {
  const result = parseOAuthResult("#access_token=secret&scope=user%3Aread%3Achat+channel%3Aread%3Aredemptions&state=" + STATE);
  assert.equal(result.accessToken, "secret");
  assert.equal(result.state, STATE);
  assert.deepEqual(result.scopes, [CHAT_SCOPE, REWARDS_SCOPE]);
  assert.equal(parseOAuthResult(""), null);
  assert.match(parseOAuthResult("", "?error=access_denied&error_description=denied&state=" + STATE).error, /denied/);
});
test("payload de chat usa os IDs corretos para EventSub WebSocket", () => {
  assert.deepEqual(subscriptionPayload(CHAT_EVENT, "1234", "session-abc"), {
    type: CHAT_EVENT, version:"1",
    condition:{ broadcaster_user_id:"1234", user_id:"1234" },
    transport:{ method:"websocket", session_id:"session-abc" }
  });
  const points = subscriptionPayload(REWARD_EVENT, "1234", "session-abc");
  assert.deepEqual(points.condition, { broadcaster_user_id:"1234" });
  assert.throws(() => subscriptionPayload("channel.follow", "1234", "session-abc"));
});
test("welcome, heartbeat, reconexão e revogação", () => {
  const wrap = (message_type, payload = {}) => ({metadata:{message_type},payload});
  assert.deepEqual(interpretFrame(wrap("session_welcome", {session:{id:"s1",keepalive_timeout_seconds:30}}),"12"),
    {type:"welcome",sessionId:"s1",keepalive:30});
  assert.equal(interpretFrame(wrap("session_keepalive"),"12").type,"keepalive");
  assert.equal(interpretFrame(wrap("session_reconnect",{session:{reconnect_url:"wss://eventsub.wss.twitch.tv/ws"}}),"12").type,"reconnect");
  assert.equal(interpretFrame(wrap("revocation",{subscription:{status:"authorization_revoked"}}),"12").reason,"authorization_revoked");
});
test("somente URLs EventSub oficiais podem ser usadas para reconexão", () => {
  assert.equal(isSafeReconnectUrl("wss://eventsub.wss.twitch.tv/ws?foo=bar"), true);
  assert.equal(isSafeReconnectUrl("ws://eventsub.wss.twitch.tv/ws"), false);
  assert.equal(isSafeReconnectUrl("wss://evil.com/ws"), false);
  assert.equal(isSafeReconnectUrl("wss://eventsub.wss.twitch.tv.evil.com/ws"), false);
  assert.equal(isSafeReconnectUrl("javascript:alert(1)"), false);
});
const messageFrame = (type, event, id = "msg-1") => ({
  metadata:{message_type:"notification",subscription_type:type,message_id:id},
  payload:{event}
});
test("chat é validado por canal, usuário e corpo da mensagem", () => {
  const payload = {broadcaster_user_id:"1234",chatter_user_login:"Luci",message:{text:"!entrar 5"}};
  assert.deepEqual(interpretFrame(messageFrame(CHAT_EVENT,payload),"1234"),{
    type:"chat",id:"msg-1",sender:"luci",text:"!entrar 5"
  });
  assert.equal(interpretFrame(messageFrame(CHAT_EVENT,{...payload,broadcaster_user_id:"999"}),"1234"),null);
  assert.equal(interpretFrame(messageFrame(CHAT_EVENT,{...payload,chatter_user_login:"<script>"}),"1234"),null);
});
test("recompensas não são lidas sem escopo opt-in", () => {
  const event={broadcaster_user_id:"1234",user_login:"Luci",reward:{id:"reward-1"},user_input:"7"};
  assert.equal(interpretFrame(messageFrame(REWARD_EVENT,event),"1234"),null);
  assert.deepEqual(interpretFrame(messageFrame(REWARD_EVENT,event),"1234",true),{
    type:"reward",id:"msg-1",sender:"luci",rewardId:"reward-1",input:"7"
  });
});
test("recompensas antigas são mapeadas para comandos seguros", () => {
  const find = value => Object.entries(REWARD_COMMANDS).find(([, action])=> action===value)[0];
  assert.equal(rewardToCommand(find("join"),"8"),"!entrar 8");
  assert.equal(rewardToCommand(find("skin"),"999"),"!skin 1");
  assert.equal(rewardToCommand(find("duel"),"@Hero_2"),"!duelo @hero_2");
  assert.equal(rewardToCommand(find("duel"),"<script>"),null);
  assert.equal(rewardToCommand(find("attack"),""),"!atributo attack");
  assert.equal(rewardToCommand("unknown","hello"),null);
});
test("recompensa de atributo age apenas sobre personagem válido", () => {
  const p=createPlayer("luci");
  assert.equal(applyCommand([p],"luci","!atributo attack").players[0].attack,2);
  assert.equal(applyCommand([p],"luci","!atributo speed").players[0].speed,2);
  assert.equal(applyCommand([p],"luci","!atributo __proto__").event.type,"error");
  assert.equal(applyCommand([], "viewer","!atributo attack").event.type,"error");
});
