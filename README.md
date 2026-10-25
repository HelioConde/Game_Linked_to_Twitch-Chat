# Twitch Chat Game — jogo integrado ao chat

**Protótipo de jogo para interagir com espectadores de uma transmissão da Twitch usando ComfyJS.**

![JavaScript](https://img.shields.io/badge/JavaScript-vanilla-F7DF1E?logo=javascript&logoColor=black) ![Twitch](https://img.shields.io/badge/Twitch-chat-9146FF?logo=twitch&logoColor=white) ![Status](https://img.shields.io/badge/status-protótipo-64748b)

## Visão geral

A proposta é transformar interações no chat em ações dentro do jogo: cada participante pode ter um personagem, evoluir atributos e participar de desafios exibidos durante a live.

### Mecânicas presentes no código

- Leitura de mensagens do chat por meio da biblioteca **ComfyJS**.
- Criação de personagens e troca de aparência associadas a recompensas do canal.
- Evolução de atributos e desafios **1 contra 1**.
- Exibição de jogadores, chat e rankings.
- Importação, exportação e persistência de dados dos jogadores via `localStorage`.

## Como testar

1. Baixe ou clone o repositório.
2. Sirva a pasta por HTTP, por exemplo com `python -m http.server 8000`.
3. Abra `http://localhost:8000` no navegador.
4. **Antes de usar em uma live**, revise `js/script.js` e configure a conexão do ComfyJS com seu canal. Os identificadores das recompensas presentes no código são específicos da configuração original e podem precisar de atualização.

O projeto utiliza arquivos JavaScript locais, sem processo de build.

## Tecnologias e estrutura

| Caminho | Conteúdo |
| --- | --- |
| `index.html` | Interface do jogo e painéis |
| `js/script.js` | Regras de personagens, eventos e chat |
| `js/comfy.min.js` | Cliente ComfyJS incluído no projeto |
| `css/` | Estilos |
| `img/`, `subImg/`, `font/` | Recursos visuais |

## Limitações e evolução

Este é um **experimento antigo**. As integrações dependem do funcionamento atual da API/biblioteca da Twitch, e a autenticação/conexão ao canal não foi revalidada nesta revisão de documentação. Os saves são locais ao navegador: não existe banco de dados compartilhado.

Possíveis próximas etapas: configuração de canal pela interface, revisão dos eventos de recompensas, persistência no servidor e segurança na renderização de mensagens do chat.

Feito por [Hélio Conde](https://github.com/HelioConde).


## Nova versão — Chat Arena (demonstração offline)

Acesse **[Chat Arena](./demo/index.html)** para experimentar a interface responsiva, os 20 personagens e o sistema de duelos sem precisar conectar a Twitch. O jogo clássico continua disponível em [index.html](./index.html).

### Comandos simulados

| Comando | Resultado |
| --- | --- |
| !entrar 1 | Cria um personagem com skin de 1 a 20 |
| !treinar | Evolui nível e atributos |
| !skin 5 | Troca a aparência |
| !duelo @luci | Inicia um combate entre dois aventureiros |
| !ajuda | Consulta comandos |

O botão **Adicionar aventureiros** cria exemplos para testar. A demo mantém seus dados na chave independente twitch-chat-arena-demo-v1 do armazenamento local do navegador. Se houver personagens antigos salvos na chave players, use **Importar personagens antigos**: a importação é opcional e preserva os dados de origem. O contador de duelos da demonstração é por sessão.

**Atenção:** esta versão apenas simula mensagens do chat; ela não se conecta à Twitch e não oferece multiplayer online. Integração OAuth/EventSub e persistência no servidor ficam para etapas posteriores.

### Testes do projeto

O workflow [Validar jogo e demo](./.github/workflows/demo-ci.yml) verifica sintaxe JavaScript e executa testes com Node.js (comando: node --test tests/demo.test.mjs).

### Etapa 3 — Progressão e combate RPG

A demonstração inclui sistema de **experiência (XP)**, ganho de nível, **moedas**, inventário,
armas, armaduras e **quatro habilidades**: golpe, chama, cura e guarda.

- Treino: +40 XP. A cada nível, ataque, defesa, vida e velocidade aumentam em 1.
- Vitória em duelo: +45 XP e +28 moedas.
- Derrota: +20 XP e +12 moedas.
- Equipamentos comprados são permanentes na demo local e modificam os atributos do combate.
- As habilidades são ativadas automaticamente durante a batalha.
- O perfil do aventureiro mostra XP, moedas, equipamento ativo, habilidades e inventário.

| Comando | Ação |
| --- | --- |
| `!perfil` | Mostra seu progresso e histórico |
| `!inventario` | Lista itens e os equipados |
| `!loja` | Lista equipamentos à venda e preços |
| `!comprar espada_ferro` | Compra item com moedas de combate |
| `!equipar espada_ferro` | Equipa um item já comprado |
| `!habilidade chama` | Escolhe habilidade ativa (golpe, chama, cura ou guarda) |

**Compatibilidade:** a demo atualiza os saves criados nas versões anteriores
e também importa backups de 2022, sem alterar a chave original `players`.
Continuamos usando armazenamento **local ao navegador**, não sincronizado na nuvem.


### Etapa 4 — Twitch real (OAuth + EventSub WebSocket)

A demo agora tem um painel opcional **Conectar chat real**: o motor do RPG
continua o mesmo, mas os comandos podem ser recebidos pelo EventSub da Twitch,
em vez de serem simulados. Nenhuma chave secreta é usada no código.

**Como configurar:**

1. Execute a demo em HTTPS ou use http://localhost:8000/demo/index.html.
2. Acesse o [Twitch Developer Console](https://dev.twitch.tv/console/apps),
   registre um aplicativo e configure a URL de redirecionamento **exatamente igual**
   à exibida no painel da demo (exemplo local: http://localhost:8000/demo/index.html).
   Para publicação, registre também o endereço HTTPS da demo publicada.
3. Copie somente o **Client ID público** para a interface. Nunca insira Client Secret ou token.
4. Clique em **Conectar Twitch** e autorize a conta proprietária do canal.
5. Após o retorno, o app valida o token e assina os eventos channel.chat.message.
6. No chat Twitch, envie !entrar 1, !treinar, !perfil, !duelo @usuario ou outros comandos.
7. Mantenha a aba aberta durante a live. Use **Desconectar** para voltar à demo.

**Escopos OAuth:** user:read:chat é obrigatório; channel:read:redemptions
é opcional, somente se habilitar recompensas personalizadas. O mapeamento
de recompensas usa os oito IDs conhecidos de 2022 em demo/twitch-protocol.mjs.
Se esses IDs já foram recriados na Twitch, precisam ser atualizados no código.
O jogo somente observa resgates e aplica efeitos locais: não cria, configura
ou finaliza recompensas na plataforma Twitch.

**Segurança:** state OAuth verificado, token validado na conexão e a cada hora,
canal de origem validado, eventos duplicados ignorados, limite de comandos,
política CSP e limpeza imediata do token no fragmento da URL.
O access token fica somente na memória da aba. Recarregar exige nova
autorização; o Client ID público pode ficar salvo localmente.

**Limitações:** saves ainda ficam no localStorage do navegador, sem sincronização
entre computadores; o app não roda 24/7 nem recebe mensagens com a aba fechada.
O login e os eventos reais exigem um aplicativo registrado na Twitch.
Os testes automatizados simulam a API, não comprovam conexão real.

Documentação oficial:
[OAuth](https://dev.twitch.tv/docs/authentication/getting-tokens-oauth/),
[EventSub WebSockets](https://dev.twitch.tv/docs/eventsub/handling-websocket-events/) e
[chat](https://dev.twitch.tv/docs/eventsub/eventsub-subscription-types/#channelchatmessage).

### Etapas da retomada

1. Auditoria e correções iniciais do legado.
2. Interface moderna e demo offline (implementadas, pendente de QA visual).
3. Combate e progressão avançados (implementados, pendentes de QA visual completo).
4. Integração Twitch moderna (OAuth/EventSub implementados, verificação ao vivo pendente).
5. Publicação, QA completo e modo OBS.
