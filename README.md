<div align="center">
  <h1>🎮 Chat Arena — Twitch Chat Game</h1>
  <p><strong>Um RPG de arena em que a comunidade cria aventureiros, treina e participa de duelos pelo chat.</strong></p>
  <p><img alt="Demo jogável" src="https://img.shields.io/badge/status-demo%20jog%C3%A1vel-64748b"> <img alt="Twitch EventSub" src="https://img.shields.io/badge/Twitch-EventSub-9146FF?logo=twitch&logoColor=white"></p>
  <p><a href="https://helioconde.github.io/Game_Linked_to_Twitch-Chat/demo/"><strong>Experimentar Chat Arena</strong></a> · <a href="https://helioconde.github.io/Game_Linked_to_Twitch-Chat/"><strong>Versão original</strong></a> · <a href="#conectar-o-chat-real"><strong>Conectar Twitch</strong></a></p>
</div>

---

## Duas experiências no repositório

| Edição | Onde está | Objetivo |
| --- | --- | --- |
| **Chat Arena (atual)** | [`demo/index.html`](demo/index.html) | RPG de chat com personagens, treino, duelos, inventário e modo OBS |
| **Twitch Chat Game (original)** | [`index.html`](index.html) | Experimento histórico usando eventos do chat via ComfyJS |

A Chat Arena pode ser usada **sem login, em modo de demonstração**. A integração com mensagens reais da Twitch é opcional e exige um aplicativo OAuth registrado pelo usuário.

## O que o jogador pode fazer

| Comando | Resultado |
| --- | --- |
| `!entrar 1` | Cria personagem com aparência escolhida |
| `!treinar` | Ganha XP e evolui atributos |
| `!perfil` | Mostra progresso |
| `!duelo @usuario` | Desafia outro personagem |
| `!loja` | Lista equipamentos disponíveis |
| `!inventario` | Mostra itens e equipamentos |
| `!comprar espada_ferro` | Compra usando moedas da arena |
| `!equipar espada_ferro` | Equipa item adquirido |
| `!habilidade chama` | Seleciona habilidade de combate |

O protótipo inclui **XP, níveis, moedas, armas, armaduras, habilidades e diferentes aparências**, com regras implementadas no motor JavaScript da arena.

**Importante:** a economia é **fictícia e local** — não são transações de dinheiro nem uma conta de jogador persistida em um servidor.

## Executar localmente

```bash
git clone https://github.com/HelioConde/Game_Linked_to_Twitch-Chat.git
cd Game_Linked_to_Twitch-Chat
python -m http.server 8000
```

Abra `http://localhost:8000/demo/` para a arena ou `http://localhost:8000/` para o jogo original.

## Conectar o chat real

A integração utiliza **Twitch OAuth e EventSub WebSocket**, sem inserir um `Client Secret` no navegador.

1. Registre um aplicativo no [Twitch Developer Console](https://dev.twitch.tv/console/apps).
2. Configure a URL de redirecionamento **exatamente como exibida no painel** (por exemplo, `http://localhost:8000/demo/index.html` para testes locais).
3. Insira o **Client ID público** e autorize a conta proprietária do canal.
4. Conecte o chat e envie os comandos durante a transmissão.
5. Mantenha a aba aberta; feche a conexão usando **Desconectar**.

A integração de recompensas requer permissões adicionais e os IDs de recompensas devem corresponder ao canal configurado. Para instruções de escopos OAuth, segurança e diagnóstico, consulte a [documentação técnica preservada](docs/README_HISTORY_2026-10-27.md).

**Limites:** os testes de integração usam respostas simuladas e **não confirmam conexão real com qualquer canal**. Tokens são mantidos na memória da aba, não em URLs compartilhadas.

## Experiência de transmissão e OBS

A arena oferece um modo de apresentação para o OBS:

- **Na mesma aba conectada:** esconder painéis e capturar a janela, preservando a conexão em memória.
- **Browser Source de prévia:** uma página isolada para testar layout e transparência, **sem sincronizar o chat real nem compartilhar a sessão OAuth**.

Não existe relay/servidor de sincronização entre várias abas ou computadores. O navegador precisa permanecer aberto durante a transmissão.

## Estrutura principal

```text
demo/
  index.html          Arena
  app.mjs             UI e comandos
  engine.mjs          XP, itens e combate
  twitch-client.mjs   OAuth e EventSub
  twitch-protocol.mjs Eventos recebidos
  obs-mode.mjs        Exibição para OBS
tests/                Testes Node e Playwright
index.html            Experimento legado
js/                   Scripts da versão original
.github/workflows/    Publicação e QA
```

Para os testes declarados no projeto:

```bash
node --test tests/*.test.mjs
```

Os testes automatizados não substituem experimentar uma transmissão real. O progresso local usa `localStorage` e pode ser perdido ao limpar o navegador.

[**Documentação anterior completa**](docs/README_HISTORY_2026-10-27.md) · [**Actions e testes**](https://github.com/HelioConde/Game_Linked_to_Twitch-Chat/actions)

---

<div align="center"><strong>Criado por <a href="https://github.com/HelioConde">Hélio Conde</a></strong></div>
