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
