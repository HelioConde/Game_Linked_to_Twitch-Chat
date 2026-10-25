<div align="center">
  <h1>🎮 Chat Arena — Twitch Chat Game</h1>
  <p><strong>Um RPG de arena em que a audiência participa, evolui personagens e enfrenta outros jogadores pelo chat.</strong></p>
  <p>
    <img alt="JavaScript" src="https://img.shields.io/badge/JavaScript-ES%20Modules-F7DF1E?logo=javascript&logoColor=black">
    <img alt="Twitch" src="https://img.shields.io/badge/Twitch-EventSub-9146FF?logo=twitch&logoColor=white">
    <img alt="Status" src="https://img.shields.io/badge/status-demo%20jog%C3%A1vel-64748b">
  </p>
  <p><a href="https://helioconde.github.io/Game_Linked_to_Twitch-Chat/demo/"><strong>Experimentar Chat Arena</strong></a> · <a href="https://helioconde.github.io/Game_Linked_to_Twitch-Chat/"><strong>Jogo original</strong></a> · <a href="#conex%C3%A3o-opcional-%C3%A0-twitch-oauth--eventsub"><strong>Conectar chat</strong></a></p>
</div>

## Duas experiências no mesmo repositório

| Edição | Onde está | Experiência |
| --- | --- | --- |
| **Chat Arena (atual)** | [`demo/index.html`](demo/index.html) | RPG 2D com personagens, progresso, duelos, loja e modo de exibição OBS |
| **Twitch Chat Game (legado)** | [`index.html`](index.html) | Experimento original baseado em ComfyJS e eventos/recompensas de chat |

A versão **Chat Arena** pode ser usada em modo de **demonstração offline**, sem conta Twitch. A conexão real ao chat é opcional e exige aplicativo OAuth registrado na Twitch. **Não há servidor de jogos persistente**: progresso e interações da arena ficam no navegador onde a página está aberta.

## Comece em poucos minutos

**Experimentar:** abra [Chat Arena](https://helioconde.github.io/Game_Linked_to_Twitch-Chat/demo/) quando o GitHub Pages estiver publicado, ou rode localmente:

```bash
git clone https://github.com/HelioConde/Game_Linked_to_Twitch-Chat.git
cd Game_Linked_to_Twitch-Chat
python -m http.server 8000
```

Acesse `http://localhost:8000/demo/`. Para a edição clássica, abra `http://localhost:8000/`.

### Comandos para experimentar

| Comando no chat simulado | O que faz |
| --- | --- |
| `!entrar 1` | Cria aventureiro usando uma das 20 aparências |
| `!treinar` | Ganha experiência e melhora atributos |
| `!perfil` | Mostra o personagem e sua progressão |
| `!duelo @usuario` | Inicia confronto com outro aventureiro |
| `!loja`, `!inventario` | Consulta equipamentos e itens |
| `!comprar espada_ferro` | Compra um equipamento com moedas |
| `!equipar espada_ferro` | Equipa um item adquirido |
| `!habilidade chama` | Seleciona uma das habilidades de combate |

A demo conta com **XP, moedas, inventário, armas, armaduras e habilidades**; o duelo calcula o resultado usando o motor da arena. As 20 aparências são escolhas visuais, não 20 classes comprovadamente distintas.

## Onde o código está

```text
demo/
  index.html          Interface atual
  app.mjs             UI e comandos
  engine.mjs          Regras de RPG e duelos
  twitch-client.mjs   OAuth e chat EventSub
  twitch-protocol.mjs Eventos e mapeamento de recompensas
  obs-mode.mjs        Modo apresentação/OBS
tests/                Testes do motor, integração e navegador
index.html            Edição clássica
js/                   Lógica legada com ComfyJS
.github/workflows/    Validação e publicação
```

**Qualidade:** `node --test tests/*.test.mjs` cobre testes automatizados do motor e da integração; o workflow também executa cenários Playwright. Eles não comprovam, por si só, a autenticação numa transmissão real.

## Dados, privacidade e limites

- Personagens e progresso da demonstração usam **`localStorage`**; apagar os dados do site pode apagar o save.
- A importação de personagens do projeto antigo é opcional e não altera a chave legada `players`.
- **O token OAuth é mantido em memória da aba**, enquanto a conexão está ativa; não configure `Client Secret` no frontend.
- O chat real depende de permissões e da Twitch; a aplicação precisa ficar aberta durante a transmissão.
- O modo OBS apresenta a arena, mas **não cria um servidor 24/7** ou sincronização entre computadores.

---

## Progressão e combate da demo

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


## Conexão opcional à Twitch (OAuth + EventSub)

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


## Novos personagens — 20 skins de 2026

As 20 novas artes de fantasia foram adicionadas em [img/characters-v2](./img/characters-v2/)
como arquivos **WebP transparentes individuais** otimizados para a arena no navegador,
com quatro atlas WebP também armazenados na mesma pasta.
O catálogo e seus nomes ficam em [demo/skin-library.mjs](./demo/skin-library.mjs).

As aparências são selecionadas com o mesmo comando existente: `!entrar 1` até
`!entrar 20` ou `!skin 1` até `!skin 20`. Na Chat Arena, abra
**20 novas aparências de aventureiros** para visualizar os personagens e preencher
o comando clicando na skin. As novas imagens aparecem na arena, nas fichas, no
ranking, nos duelos e no modo OBS. O jogo clássico de 2022 continua utilizando os
arquivos originais `img/charB1.png` a `img/charB20.png`.

Os novos arquivos representam personagens em **pose idle estática**, com pequenas
animações de interface já existentes (movimento de idle e efeitos de combate).
**Ainda não são spritesheets de caminhada e ataques em múltiplos quadros.**
As artes PNG de maior resolução ficaram disponíveis em um pacote separado de
originais para edição posterior.

## GitHub Pages e apresentação no OBS

A nova versão fica na pasta [demo/](./demo/index.html); o jogo clássico continua no
[index.html](./index.html). O workflow [Publicar Chat Arena no GitHub Pages](./.github/workflows/pages.yml)
executa os testes do motor, empacota apenas os arquivos públicos e tenta publicar em cada
push para main. **É necessário habilitar Settings → Pages → Source: GitHub Actions** no
repositório (caso ainda não esteja habilitado). A URL padrão do projeto, quando a
publicação estiver concluída, será:

- Jogo clássico: https://helioconde.github.io/Game_Linked_to_Twitch-Chat/
- Nova arena: https://helioconde.github.io/Game_Linked_to_Twitch-Chat/demo/

Não considere os endereços ativos antes de o workflow e as configurações do Pages
confirmarem a publicação. Para OAuth Twitch, cadastre no console exatamente a URL
HTTPS da arena com /demo/index.html no final — não a URL com parâmetros.

#### Exibição no OBS

**Opção A — Mesmo navegador autenticado, capturado no OBS (chat real):**
abra a arena no navegador, conecte à Twitch e clique em **Ativar modo OBS nesta aba**.
A interface esconde os painéis e ocupa a viewport inteira mostrando os personagens
e batalhas sobre um fundo transparente. Pressione Esc para retornar sem recarregar
a página, preservando a conexão OAuth em memória. Adicione a janela ao OBS por
**Captura de janela**; se o navegador for capturado como uma janela opaca, recorte
ou use um filtro apropriado no OBS para remover o fundo. Transparência nativa na
captura da janela não é garantida.

**Opção B — Browser Source, para prévia sem Twitch:**
copie a URL da prévia fornecida no painel e adicione uma fonte **Navegador** no
OBS Studio, com largura 1920, altura 1080 e fundo transparente. Essa página
independente exibe 4 personagens de exemplo quando vazia; **não sincroniza**
comandos com a aba principal e **não recebe** o access token OAuth de outra aba.
Ela serve para ajustar layout e testar resolução do overlay no OBS.

Para avaliar uma fonte Navegador com chat real, a autenticação precisaria ocorrer
dentro do próprio contexto dessa fonte (e dependeria do suporte do navegador
embutido ao login Twitch) ou haver um relay autenticado entre controller e OBS.
Essas alternativas não estão implementadas nem validadas nesta etapa. Nunca
adicione access tokens nas URLs do OBS.

#### Qualidade

O CI executa testes Node de regras e segurança e um job Playwright em Chromium
que visita a arena em desktop e mobile, testa criação, PvP, transparência e
os botões do modo OBS. As capturas ficam disponíveis como artefatos do workflow.
Validação da Twitch com canal real ainda exige a configuração do Client ID e
um teste manual de autorização/eventos.

### Etapas da retomada

1. Auditoria e correções iniciais do legado.
2. Interface moderna e demo offline (implementadas, pendente de QA visual).
3. Combate e progressão avançados (implementados, pendentes de QA visual completo).
4. Integração Twitch moderna (OAuth/EventSub implementados, verificação ao vivo pendente).
5. Publicação e modo OBS implementados, pendentes de confirmação do Pages e validação ao vivo.
