import test from "node:test";
import assert from "node:assert/strict";
import { TwitchSession } from "../demo/twitch-client.mjs";
import { CHAT_EVENT, REWARD_EVENT } from "../demo/twitch-protocol.mjs";

const CLIENT_ID = "x".repeat(30);
const TOKEN = "unit-test-token";
class MockSocket {
  static instances = [];
  constructor(url) { this.url=url; this.closed=false; this.sent=[]; MockSocket.instances.push(this); }
  emit(frame) { this.onmessage?.({ data:JSON.stringify(frame) }); }
  close() { this.closed=true; this.onclose?.({code:1000}); }
  send(value) { this.sent.push(value); }
}
function frame(type, payload, id="frame-id", subscriptionType) {
  return { metadata:{message_type:type,message_id:id,subscription_type:subscriptionType},payload };
}
const tick = () => new Promise(resolve => setImmediate(resolve));
async function withMockSession(withRewards, callback) {
  const original = { WebSocket:globalThis.WebSocket, fetch:globalThis.fetch, document:globalThis.document };
  const subscribed = [];
  MockSocket.instances=[];
  globalThis.WebSocket=MockSocket;
  globalThis.document={hidden:false,addEventListener(){},removeEventListener(){}};
  globalThis.fetch=async (url, options) => {
    if (url.includes("/validate")) return {ok:true, json:async()=>({
      client_id:CLIENT_ID,user_id:"123",login:"alchemy_flames",
      scopes:["user:read:chat",...(withRewards ? ["channel:read:redemptions"] : [])]
    })};
    if (url.includes("/eventsub/subscriptions")) {
      const data=JSON.parse(options.body);
      subscribed.push(data);
      return {ok:true,status:202};
    }
    throw new Error("Unexpected network URL");
  };
  const status=[], chat=[], rewards=[];
  const client=new TwitchSession({
    onStatus:value=>status.push(value),
    onChat:value=>chat.push(value),
    onReward:value=>rewards.push(value)
  });
  try {
    await client.startSession({clientId:CLIENT_ID,accessToken:TOKEN,withRewards});
    const socket=MockSocket.instances[0];
    socket.emit(frame("session_welcome",{session:{id:"session-123",keepalive_timeout_seconds:30}}));
    await tick();
    assert.equal(client.connected,true);
    await callback({client,socket,subscribed,status,chat,rewards});
  } finally {
    client.disconnect();
    globalThis.WebSocket=original.WebSocket;
    globalThis.fetch=original.fetch;
    globalThis.document=original.document;
  }
}
test("cliente assina o chat após welcome e não envia dados pelo WebSocket", async()=>{
  await withMockSession(false, async ({socket,subscribed,status})=>{
    assert.equal(subscribed.length,1);
    assert.equal(subscribed[0].type,CHAT_EVENT);
    assert.equal(subscribed[0].condition.broadcaster_user_id,"123");
    assert.equal(subscribed[0].condition.user_id,"123");
    assert.equal(socket.sent.length,0);
    assert.equal(status.at(-1).status,"connected");
  });
});
test("eventos duplicados e eventos de outros canais são ignorados", async()=>{
  await withMockSession(false, async ({socket,chat})=>{
    const event=frame("notification",{
      event:{broadcaster_user_id:"123",chatter_user_login:"Viewer123",message:{text:"!entrar 1"}}
    },"same-id",CHAT_EVENT);
    socket.emit(event);
    socket.emit(event);
    socket.emit(frame("notification",{
      event:{broadcaster_user_id:"999",chatter_user_login:"Viewer123",message:{text:"!treinar"}}
    },"other-id",CHAT_EVENT));
    assert.equal(chat.length,1);
    assert.equal(chat[0].sender,"viewer123");
  });
});
test("recompensas só são inscritas quando autorizadas explicitamente", async()=>{
  await withMockSession(true, async ({client,socket,subscribed,rewards})=>{
    assert.equal(subscribed.length,2);
    assert.equal(subscribed[1].type,REWARD_EVENT);
    socket.emit(frame("notification",{
      event:{broadcaster_user_id:"123",user_login:"Viewer",reward:{id:"reward-1"},user_input:"1"}
    },"reward-msg",REWARD_EVENT));
    assert.equal(rewards.length,1);
    assert.equal(client.auth.rewardEnabled,true);
  });
});
test("reconnect Twitch transfere assinatura sem duplicar subscribe", async()=>{
  await withMockSession(false,async ({client,socket,subscribed})=>{
    socket.emit(frame("session_reconnect",{
      session:{reconnect_url:"wss://eventsub.wss.twitch.tv/ws?reconnect=xyz"}
    }));
    assert.equal(MockSocket.instances.length,2);
    const next=MockSocket.instances[1];
    next.emit(frame("session_welcome",{session:{id:"new-session",keepalive_timeout_seconds:30}}));
    await tick();
    assert.equal(client.connected,true);
    assert.equal(socket.closed,true);
    assert.equal(subscribed.length,1);
  });
});
test("revogação encerra e limpa a sessão", async()=>{
  await withMockSession(false, async ({client,socket,status})=>{
    socket.emit(frame("revocation",{subscription:{status:"authorization_revoked"}}));
    assert.equal(client.auth,null);
    assert.equal(client.connected,false);
    assert.equal(status.at(-1).status,"error");
  });
});
