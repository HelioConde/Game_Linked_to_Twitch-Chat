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
                    vida: 1,
                    win: 0
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
                        vida: 1,
                        win: 0
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

    // Subir o Nivel //
    if (extra.customRewardId == "889e0b60-695a-410b-a667-113a19f7218b") {
        playerName = JSON.parse(localStorage.getItem('players'));
        for (obj in playerName) {
            if (playerName[obj].player.nome == user) {
                playerName[obj].player.level = parseFloat(playerName[obj].player.level + 1);
                playerName[obj].player.ataque = parseFloat(playerName[obj].player.ataque + 1);
                playerName[obj].player.velocidade = parseFloat(playerName[obj].player.velocidade + 1);
                playerName[obj].player.defesa = parseFloat(playerName[obj].player.defesa + 1);
                playerName[obj].player.vida = parseFloat(playerName[obj].player.vida + 1);

                localStorage.setItem('players', JSON.stringify(playerName));
                console.log("Level Up")
                if (x1 == false) {
                    loadGame();
                }
                return;
            }
        }
    }

    // Subir a Vida //
    console.log(extra.customRewardId);
    if (extra.customRewardId == "28877035-4a19-44b0-82ef-a8ac32a75ff7") {
        playerName = JSON.parse(localStorage.getItem('players'));
        for (obj in playerName) {
            if (playerName[obj].player.nome == user) {
                playerName[obj].player.vida = parseFloat(playerName[obj].player.vida + 1);
                localStorage.setItem('players', JSON.stringify(playerName));
                console.log("Vida Up")
                if (x1 == false) {
                    loadGame();
                }
                return;
            }
        }
    }

    // Subir a Velocidade //
    if (extra.customRewardId == "87de82e2-df81-4b62-8cc4-91cc6dac52ca") {
        playerName = JSON.parse(localStorage.getItem('players'));
        for (obj in playerName) {
            if (playerName[obj].player.nome == user) {
                playerName[obj].player.velocidade = parseFloat(playerName[obj].player.velocidade + 1);
                localStorage.setItem('players', JSON.stringify(playerName));
                console.log("Velocidade de ataque Up")
                if (x1 == false) {
                    loadGame();
                }
                return;
            }
        }
    }

    // Subir a Defesa //
    if (extra.customRewardId == "b854181a-e9ea-4ecb-a0d3-559a326617a6") {
        playerName = JSON.parse(localStorage.getItem('players'));
        for (obj in playerName) {
            if (playerName[obj].player.nome == user) {
                playerName[obj].player.defesa = parseFloat(playerName[obj].player.defesa + 1);
                localStorage.setItem('players', JSON.stringify(playerName));
                console.log("Defesa Up")
                if (x1 == false) {
                    loadGame();
                }
                return;
            }
        }
    }

    // Subir a Ataque //
    if (extra.customRewardId == "d3182df2-77c6-49c2-84cc-221a5a6c88ca") {
        playerName = JSON.parse(localStorage.getItem('players'));
        for (obj in playerName) {
            if (playerName[obj].player.nome == user) {
                playerName[obj].player.ataque = parseFloat(playerName[obj].player.ataque + 1);
                localStorage.setItem('players', JSON.stringify(playerName));
                console.log("Ataque Up")
                if (x1 == false) {
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
    let levelRanking = 0;
    let levelRankingNome = '';
    let winRanking = 0;
    let winRankingNome = '';

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
        if (playerName[obj].player.level > levelRanking) {
            levelRankingNome = playerName[obj].player.nome;
            levelRanking = playerName[obj].player.level;
            console.log(levelRankingNome);
            $("#levelRanking").html(levelRankingNome + " > " + levelRanking);
        }
        if (playerName[obj].player.win > winRanking) {
            winRankingNome = playerName[obj].player.nome;
            winRanking = playerName[obj].player.win;
            console.log(winRankingNome);
            $("#pvpRanking").html(winRankingNome + " > " + winRanking);
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
    let playerName = JSON.parse(localStorage.getItem('players'));
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
            <div id="char" class="char`+ player1[1] + `"></div>
            <div class="sword1"></div>
        </div>`);

        $(".fight").append(`
        <div id="player2">
            <div class="playerName">` + valor2 + `</div>
            <div class="vida">` + parseFloat(player2[3] + 5) + `</div>
            <div id="char" class="charControl char` + player2[1] + `"></div>
            <div class="swordControl sword1"></div>
        </div>`);
    }, 4000);

    let vidaPlayer1 = parseInt(playerName[player1[0]].player.vida + 5);
    let vidaPlayer2 = parseInt(playerName[player2[0]].player.vida + 5);
    let timerPlayer1 = parseInt(1000 - playerName[player1[0]].player.velocidade);
    let timerPlayer2 = parseInt(1000 - playerName[player2[0]].player.velocidade);
    let timer1;
    let timer2;

    setTimeout(() => {
        timer1 = setInterval(() => {
            fight1()
        }, timerPlayer1);
        console.log('Tempo1: ' + timerPlayer1);

        timer2 = setInterval(() => {
            fight2()
        }, timerPlayer2);
        console.log('Tempo2: ' + timerPlayer2);
    }, 5000);

    function fight1() {
        let defesa = playerName[player2[0]].player.defesa
        let ataque = parseInt(playerName[player1[0]].player.ataque + 2);
        let ataqueLog = Math.floor(Math.random() * (defesa - ataque) + ataque);
        console.log(ataqueLog)

        if (defesa >= ataqueLog) {
            // Miss attack //
            console.log('Player1: Miss Attack')
        } else {
            vidaPlayer2 = parseInt(vidaPlayer2 - ataque);
            console.log('Player2: Vida ' + vidaPlayer2);
        }
        $("#player1 .sword1").addClass('attack1')
        $("#player2 #char").addClass('demage' + player2[1]);
        $("#player2 .vida").html(vidaPlayer2);
        $("#player2 .vida").css({
            width: vidaPlayer2 + '%'
        })

        if (vidaPlayer2 <= 0) {
            clearInterval(timer1);
            clearInterval(timer2);
            console.log('Player1 Win');
            console.log(vidaPlayer1);
            if (playerName[0].player.win == undefined) {
                playerName[player1[0]].player.win = 1;
                console.log('undfined');
            } else {
                playerName[player1[0]].player.win = parseInt(playerName[player1[0]].player.win + 1);
                console.log('++++1');
            }
            console.log(playerName[player1[0]].player.win);
            localStorage.setItem('players', JSON.stringify(playerName));
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
            setTimeout(() => {
                $("#player2 #char").removeClass('demage' + player2[1]);
                $("#player1 .sword1").removeClass('attack1')
            }, 500);
        }
    }
    function fight2() {
        let defesa = playerName[player1[0]].player.defesa
        let ataque = parseInt(playerName[player2[0]].player.ataque + 2);
        let ataqueLog = Math.floor(Math.random() * (defesa - ataque) + ataque);
        console.log(ataqueLog)

        if (defesa >= ataqueLog) {
            // Miss attack //
            console.log('Player2: Miss Attack')
        } else {
            vidaPlayer1 = parseInt(vidaPlayer1 - ataque);
            console.log('Player1: Vida ' + vidaPlayer1)
        }
        $("#player2 .sword1").addClass('attack2')
        $("#player1 #char").addClass('demage' + player1[1]);
        $("#player1 .vida").html(vidaPlayer1)
        $("#player1 .vida").css({
            width: vidaPlayer1 + '%'
        })

        if (vidaPlayer1 <= 0) {
            clearInterval(timer1);
            clearInterval(timer2);
            console.log('Player2 Win');
            console.log(vidaPlayer2);
            if (playerName[0].player.win == undefined) {
                playerName[player2[0]].player.win = 1;
                console.log('undfined');
            } else {
                playerName[player2[0]].player.win = parseInt(playerName[player2[0]].player.win + 1);
                console.log('++++1');
            }
            console.log(playerName[player2[0]].player.win);
            localStorage.setItem('players', JSON.stringify(playerName));
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
            setTimeout(() => {
                $("#player1 #char").removeClass('demage' + player1[1]);
                $("#player2 .sword1").removeClass('attack2')
            }, 500);
        }
    }
}

// Configurações //
let configOn = false;
$("#config").on('mouseup', function () {
    if (configOn == false) {
        $("#configView").css('display', 'grid');
        let banco = localStorage.getItem('players');
        $(".text").val(banco)
        configOn = true;
    } else {
        $("#configView").css('display', 'none');
        configOn = false;
    }
})

$("#backupText").on('mouseup', function () {
    $(".text").select();
    document.execCommand('copy');
});

$("#exporta").on('mouseup', function () {
    var element = document.createElement('a');
    let banco = localStorage.getItem('players');
    console.log(banco);
    element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(banco));
    element.setAttribute('download', 'backup.json');
    document.body.appendChild(element);
    element.click();
})

$("#importa").on('change', function (e) {

    if ($("#importa")[0].files[0] == undefined) {
        alert('Erro');
    } else {
        var reader = new FileReader();
        reader.onload = onReaderLoad;
        reader.readAsText(e.target.files[0]);
    }

    function onReaderLoad(event) {
        let backupArq = JSON.parse(event.target.result);
        let playerName;
        localStorage.removeItem('players');
        for (obj in backupArq) {
            console.log(backupArq[obj].player.nome);
            if (JSON.parse(localStorage.getItem('players')) == null) {
                playerName = [];
            } else {
                playerName = JSON.parse(localStorage.getItem('players'));
            }
            playerName.push({
                'player': {
                    nome: backupArq[obj].player.nome,
                    char: backupArq[obj].player.char,
                    level: backupArq[obj].player.level,
                    ataque: backupArq[obj].player.ataque,
                    velocidade: backupArq[obj].player.velocidade,
                    defesa: backupArq[obj].player.defesa,
                    vida: backupArq[obj].player.vida,
                    win: backupArq[obj].player.win
                }
            });
            localStorage.setItem('players', JSON.stringify(playerName));
        }
        alert('Importado com sucesso!');
        console.log("Importado com sucesso!");
        loadGame();
    }
})

$("#excluir").on('mouseup', function () {
    localStorage.removeItem('players');
    alert('Excluido com sucesso')
});

$(".chat").on('mousedown', function () {
    $('main').on('mousemove', function (e) {
        $(".chat").css({
            'left': e.pageX - 200,
            'top': e.pageY - 150
        })
        $(".ranking").css({
            'left': e.pageX - 200,
            'top': e.pageY - 150
        })
    });
});

$("main").on('mouseup', function (e) {
    $('main').off('mousemove');
    $('main').unbind('mousemove');
    localStorage.setItem('chatY', $(".chat").position().top);
    localStorage.setItem('chatX', $(".chat").position().left);
});

$(".chat").on('mouseup', function (e) {
    $('main').off('mousemove');
    $('main').unbind('mousemove');
    localStorage.setItem('chatY', $(".chat").position().top);
    localStorage.setItem('chatX', $(".chat").position().left);
});


function loadChat() {
    if (localStorage.getItem('chatX') == null) {

    } else {
        $(".chat").css({
            'left': localStorage.getItem('chatX') + 'px',
            'top': localStorage.getItem('chatY') + 'px'
        })
        $(".ranking").css({
            'left': localStorage.getItem('chatX') + 'px',
            'top': localStorage.getItem('chatY') + 'px'
        })
    }
}

setTimeout(() => {
    loadChat();
}, 1);


