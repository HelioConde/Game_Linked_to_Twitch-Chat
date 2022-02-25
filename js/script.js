ComfyJS.onChat = (user, message, flags, self, extra) => {
    console.log(extra);

    /* $(".chat").append('<div> <p>' + user + '</p>: ' + message + '</div>'); */

    let chat = document.getElementsByClassName('chat')[0];
    chat.innerHTML =
        chat.innerHTML +
        '<div> <p>' + user + '</p>: ' + message + '</div>'

    $('.chat').animate({
        scrollTop: '10000'
    });

    let playerName = [];
    let playerChar;
    // Criar Personagem //
    if (extra.customRewardId == "5b9999e9-23c0-4ee4-b257-1ae87d1d5120") {
        console.log("Create Char?")
        if (message <= 4)
            playerChar = message;
        else if (message >= 1)
            playerChar = message;
        else
            playerChar = 1;

        if (localStorage.getItem('players') == null) {
            playerName.push({
                'player': {
                    nome: user,
                    char: playerChar,
                    level: 0,
                    ataque: 1,
                    velocidade: 1,
                    defesa: 1,
                    vida: 1
                }
            });
            localStorage.setItem('players', JSON.stringify(playerName));
            console.log("Created character!");
            loadGame();
        } else {
            playerName = JSON.parse(localStorage.getItem('players'));
            for (obj in playerName) {
                if (playerName[obj].player.nome == user) {
                    console.log("// Erro create character //");
                } else {
                    playerName.push({
                        'player': {
                            nome: user,
                            char: playerChar,
                            level: 0,
                            ataque: 1,
                            velocidade: 1,
                            defesa: 1,
                            vida: 1
                        }
                    });
                    localStorage.setItem('players', JSON.stringify(playerName));
                    console.log("Created character!");
                    loadGame();
                    return;
                }
            }
        }
    }

    // Subir o Nivel //
    if (extra.customRewardId == "889e0b60-695a-410b-a667-113a19f7218b") {
        playerName = JSON.parse(localStorage.getItem('players'));
        playerName[0].player.level = parseFloat(playerName[0].player.level + 1);
        localStorage.setItem('players', JSON.stringify(playerName));
        console.log("Level Up")
    }
}
ComfyJS.Init("alchemy_flames");



function loadGame() {
    let width = parseFloat(window.outerWidth);
    let hieght = parseFloat(window.outerHeight) - 75;
    /*
    $("main").css({
        'width': width + 'px',
        'height': hieght + 'px'
    })*/

    // Define o valor da tela como fixo //
    let main = document.getElementsByTagName('main')[0];
    main.style.width = width + 'px';
    main.style.height = hieght + 'px';

    let players = document.getElementsByClassName('players')[0];
    players.innerHTML = "";

    playerName = JSON.parse(localStorage.getItem('players'));
    
    let left = 0;
    for (obj in playerName) {
        let bottom = parseInt(Math.random() * (75 - 1));
        players.innerHTML = players.innerHTML + '<div class="playerChar" style="left:' + left + 'px;bottom:' + bottom + 'px;" alt="' + obj + '"><div class="playerName">' + playerName[obj].player.nome + '</div><div class="playerLevel">Level ' + playerName[obj].player.level + '</div><div class="char' + playerName[obj].player.char + '"></div><div class="sword1"></div></div>';
        left = left + 150;
    }
}
loadGame();