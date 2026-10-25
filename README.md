# Game Linked to Twitch Chat

RPG 2D criado originalmente em 2022 para fazer espectadores da Twitch participarem do jogo via mensagens e recompensas de canal.

## Versoes disponiveis

- **Jogo classico:** abra [index.html](./index.html). Usa ComfyJS e o canal configurado no codigo legado. Ainda nao foi migrado para a nova API de autenticacao da Twitch.
- **Chat Arena — demonstracao offline:** abra [demo/index.html](./demo/index.html). Interface responsiva, personagens originais, testes de comandos e duelos sem conexao com a Twitch.

Para testar a demo localmente, use um servidor HTTP estatico, por exemplo: python -m http.server 8000. Depois acesse http://localhost:8000/demo/.

## Comandos da demo

| Comando | Efeito |
| --- | --- |
| !entrar 1 | Cria um personagem com skin de 1 a 20 |
| !treinar | Aumenta o nivel e os atributos do personagem |
| !skin 5 | Troca para uma das 20 aparencias |
| !duelo @luci | Desafia um aventureiro presente |
| !ajuda | Mostra os comandos disponiveis |

Use **Adicionar aventureiros** para popular a arena sem preencher manualmente. Os personagens da demonstracao ficam na chave twitch-chat-arena-demo-v1 do armazenamento local do navegador. Se houver personagens na chave antiga players, o botao **Importar personagens antigos** permite copia-los sem apagar o original. O contador de duelos e apenas da sessao.

**Importante:** a demo simula mensagens; ela nao le o chat real da Twitch e ainda nao e um multiplayer em tempo real. A integracao com Twitch (OAuth + EventSub), persistencia no servidor e protecoes adicionais para o jogo classico sao etapas futuras.

## Qualidade

O fluxo de GitHub Actions verifica a sintaxe do JavaScript, confirma a existencia de assets essenciais e executa os testes do motor com Node.js sem dependencias externas: node --test tests/demo.test.mjs.

## Progresso de desenvolvimento

- Etapa 1 — Auditoria e correcoes iniciais de seguranca/estabilidade do codigo legado.
- Etapa 2 — Demo responsiva com comandos, personagens, PvP e rankings (implementada, pendente de QA visual).
- Etapa 3 — Expansao de combate, progressao e balanceamento.
- Etapa 4 — Integracao Twitch atual, com autenticacao e eventos.
- Etapa 5 — Publicacao, testes de navegacao e modo OBS.

O trabalho de modernizacao fica isolado em branch ate validacao e integracao.
