var x1 = false;

ComfyJS.onChat = (user, message, flags, self, extra) => {
    console.log(extra);

    /* $(".chat").append('<div> <p>' + user + '</p>: ' + message + '</div>'); */
    message = message.replaceAll(/>/g, '')
    message = message.replaceAll(/</g, '')
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

        if (message > 0 && message < 21)
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

            if (x1 == false) {
                loadGame();
            }

            return;
        } else {
            playerName = JSON.parse(localStorage.getItem('players'));
            let created = true;
            for (obj in playerName) {
                if (playerName[obj].player.nome == user) {
                    created = false;
                    console.log("// Erro create character //");
                    return;
                }
            }

            if (created == true) {
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
                if (x1 == false) {
                    loadGame();
                }
                return;
            } else {
                console.log("// Erro create character //");
                return;
            }
        }
    }

    // Subir o Nivel //
    if (extra.customRewardId == "889e0b60-695a-410b-a667-113a19f7218b") {
        playerName = JSON.parse(localStorage.getItem('players'));
        for (obj in playerName) {
            if (playerName[obj].player.nome == user) {
                playerName[obj].player.level = parseFloat(playerName[obj].player.level + 1);
                localStorage.setItem('players', JSON.stringify(playerName));
                console.log("Level Up")
                if (x1 == false) {
                    loadGame();
                }
                return;
            }
        }
    }

    // Desafio X1 //
    if (extra.customRewardId == "20dc0da2-d31a-43f4-8a24-e2bf5ff44417") {
        message = message.replaceAll(/@/g, '')
        message = message.replaceAll(/ /g, '')
        console.log(message)
        playerName = JSON.parse(localStorage.getItem('players'));
        for (obj in playerName) {
            if (playerName[obj].player.nome == message) {
                console.log(playerName[obj].player.nome);
                if (x1 === false) {
                    pvp(user, message);
                }
                return;
            }
        }
    }

    // Alterar Skin //
    if (extra.customRewardId == "d3e83db5-467d-4e85-b970-140535430716") {
        console.log("Trocar Skin: " + message + " Usuario: " + user);
        playerName = JSON.parse(localStorage.getItem('players'));
        for (obj in playerName) {
            if (playerName[obj].player.nome == user) {
                if (message > 0 && message < 21)
                    playerChar = message;
                else
                    playerChar = 1;

                playerName[obj].player.char = parseFloat(playerChar);
                localStorage.setItem('players', JSON.stringify(playerName));
                console.log("Skin Alterada")
                if (x1 === false) {
                    console.log('true');
                    loadGame();
                }
                return;
            }
        }
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
    let bottom;
    let index;

    for (obj in playerName) {
        var n = obj;
        var total = n;
        var resultado = total % 2 == 0 ? 'Par' : 'Impar';
        if (resultado == 'Par') {
            bottom = Math.floor(Math.random() * (70 - 55)) + 55;
            index = 3;
        } else {
            bottom = Math.floor(Math.random() * (25 - 10)) + 10;
            index = 4;
        }
        players.innerHTML = players.innerHTML + `
        <div class="playerChar" style="z-index:` + index + `;left:` + left + `px;bottom:` + bottom + `px;" alt="' + obj + '">
            <div class="playerName">` + playerName[obj].player.nome + `</div>
            <div class="playerLevel">Level ` + playerName[obj].player.level + `</div>
            <div class="char` + playerName[obj].player.char + `"></div>
            <div class="sword1"></div>
        </div>`;
        left = left + 75;
    }
}
loadGame();

function pvp(valor1, valor2) {
    x1 = true;

    let players = document.getElementsByClassName('players')[0];
    let player1 = [];
    let player2 = [];

    players.innerHTML = "";
    $(".players").append('<div class="pvp"></div>');
    playerName = JSON.parse(localStorage.getItem('players'));
    for (obj in playerName) {
        if (playerName[obj].player.nome == valor1) {
            if (player1 == "") {
                $(".pvp").append(`
                <div class="player1">
                    <div class="playerName">` + valor1 + `</div>
                    <div class="playerLevel">Level ` + playerName[obj].player.level + `</div>
                    <div class="char char`+ playerName[obj].player.char + `"></div>
                    <div class="sword sword1"></div>
                </div>`);
                player1.push(obj, playerName[obj].player.char, playerName[obj].player.defesa, playerName[obj].player.vida);
            }
        }
    }

    $(".player1").hide().fadeIn(1000)
    $(".pvp").append(`
    <div class="vs">
    <span>V</span><span>/</span><span>S</span>
    </div>`);

    $(".vs").hide()
    setTimeout(() => {
        $(".vs").fadeIn(2000)
    }, 1000);
    for (obj in playerName) {
        if (playerName[obj].player.nome == valor2) {
            if (player2 == "") {
                $(".pvp").append(`
                <div class="player2">
                    <div class="playerName">` + valor2 + `</div>
                    <div class="playerLevel">Level ` + playerName[obj].player.level + `</div>
                    <div class="char char`+ playerName[obj].player.char + `"></div>
                    <div class="sword sword1"></div>
                </div>`);
                player2.push(
                    obj,
                    playerName[obj].player.char,
                    playerName[obj].player.defesa, playerName[obj].player.vida);
            }
        }
    }

    $(".player2").hide()
    setTimeout(() => {
        $(".player2").fadeIn(2000)
    }, 2000);
    setTimeout(() => {
        $(".players").html("")
        $(".players").append(`
        <div class="fight">
        </div>`);

        $(".fight").append(`
        <div id="player1">
            <div class="playerName">` + valor1 + `</div>
            <div class="vida">` + parseFloat(player1[3] + 5) + `</div>
            <div class="char`+ player1[1] + `"></div>
            <div class="sword1"></div>
        </div>`);

        $(".fight").append(`
        <div id="player2">
            <div class="playerName">` + valor2 + `</div>
            <div class="vida">` + parseFloat(player2[3] + 5) + `</div>
            <div class="charControl char`+ player2[1] + `"></div>
            <div class="swordControl sword1"></div>
        </div>`);
    }, 4000);
    setTimeout(() => {
        fight()
    }, 5000);

    let shift = 1;

    let vidaPlayer1 = parseInt(playerName[player1[0]].player.vida + 100);
    let vidaPlayer2 = parseInt(playerName[player2[0]].player.vida + 100);

    function fight() {
        if (shift == 1) {
            let defesa = playerName[player2[0]].player.defesa
            let ataque = parseInt(playerName[player1[0]].player.ataque + 10);
            let ataqueLog = Math.floor(Math.random() * (defesa - ataque) + ataque);
            console.log(ataqueLog)

            if (defesa >= ataqueLog) {
                // Miss attack //
                console.log('Miss Attack')
            } else {
                vidaPlayer2 = parseInt(vidaPlayer2 - ataque);
                console.log(vidaPlayer2)
            }
            shift = 2;
            $("#player2 .vida").html(vidaPlayer2)
            $("#player2 .vida").css({
                width: vidaPlayer2 + '%'
            })
            setTimeout(() => {
                if (vidaPlayer2 <= 0) {
                    console.log('Player1 Win');
                    console.log(vidaPlayer1);
                    players.innerHTML = "";
                    $(".players").append('<div class="pvp"></div>');
                    $(".pvp").append(`
                    <div class="win">
                    <i>`+ playerName[player1[0]].player.nome + ` Win</i>
                    </div>`);
                    $(".pvp").append(`
                    <div class="player1">
                    <div class="playerName"></div>
                    <div class="playerLevel"></div>
                        <div class="char char`+ playerName[player1[0]].player.char + `"></div>
                        <div class="sword sword1"></div>
                    </div>`);
                    $(".pvp").hide();
                    x1 = false;
                    setTimeout(() => {
                        $(".pvp").fadeIn(3000);
                    }, 1000);
                    setTimeout(() => {
                        loadGame();
                    }, 6000);
                } else {
                    fight();
                }
            }, 1000);
        } else {
            let defesa = playerName[player1[0]].player.defesa
            let ataque = parseInt(playerName[player2[0]].player.ataque + 10);
            let ataqueLog = Math.floor(Math.random() * (defesa - ataque) + ataque);
            console.log(ataqueLog)

            if (defesa >= ataqueLog) {
                // Miss attack //
                console.log('Miss Attack')
            } else {
                vidaPlayer1 = parseInt(vidaPlayer1 - ataque);
                console.log(vidaPlayer1)
            }
            shift = 1;
            $("#player1 .vida").html(vidaPlayer1)
            $("#player1 .vida").css({
                width: vidaPlayer1 + '%'
            })
            setTimeout(() => {
                if (vidaPlayer1 <= 0) {
                    console.log('Player2 Win');
                    console.log(vidaPlayer2);
                    players.innerHTML = "";
                    $(".players").append('<div class="pvp"></div>');
                    $(".pvp").append(`
                    <div class="win">
                    <i>`+ playerName[player2[0]].player.nome + ` Win</i>
                    </div>`);
                    $(".pvp").append(`
                    <div class="player1">
                    <div class="playerName"></div>
                    <div class="playerLevel"></div>
                        <div class="char char`+ playerName[player2[0]].player.char + `"></div>
                        <div class="sword sword1"></div>
                    </div>`);
                    $(".pvp").hide();
                    x1 = false;
                    setTimeout(() => {
                        $(".pvp").fadeIn(3000);
                    }, 1000);
                    setTimeout(() => {
                        loadGame();
                    }, 5000);
                } else {
                    fight();
                }
            }, 1000);
        }
    }
}