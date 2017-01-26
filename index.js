"use strict";

var DEV = DEV || {};

DEV.Helper = function () {
    var removeClass = function (e, c) {
        e.className = e.className.replace(new RegExp('(?:^|\\s)' + c + '(?!\\S)'), '');
    }
    return {
        removeClass: removeClass
    }
} ();

DEV.SignIn = function () {
    var _dbUrl = "https://bravojeopardy.firebaseio.com/";
    var _db = new Firebase(_dbUrl);

    var btnLogIn = function (flag) {
        var user = document.querySelector("#username");
        if (flag) {
            logInUser(user.value, function (error) {
                if (!error) {
                    localStorage.setItem("username", user.value.toLowerCase());
                    document.querySelector("#hellouser").innerHTML = user.value;
                    document.querySelector("#userLogIn").style.cssText = "display: none;";
                    document.querySelector("#loggedIn").style.cssText = "display: block;";
		    if(user.value == "admin")
		        document.querySelector(".admin-container").style.cssText = "display: block";
                    user.value = "";
                    DEV.Jeopardy.loadGamePlayers();
                }
            });
        }
        else {
            localStorage.removeItem("username");
            document.querySelector("#hellouser").innerHTML = "";
            document.querySelector("#userLogIn").style.cssText = "display: block;";
            document.querySelector("#loggedIn").style.cssText = "display: none;";
            user.value = "";
        }
    }
    var logInUser = function (user, callback) {
        _db.child("users/" + user).update({
            user: user
        }, callback);
    }
    var init = function () {
        var user = localStorage.getItem("username");
        if (user) {
            document.querySelector("#hellouser").innerHTML = user;
            document.querySelector("#userLogIn").style.cssText = "display: none;";
            document.querySelector("#loggedIn").style.cssText = "display: block;";
        }
        else {
            document.querySelector("#loggedIn").style.cssText = "display: none;";
        }
    }

    return {
        init: init,
        btnLogIn: btnLogIn
    }
} ();

DEV.Jeopardy = function () {

    var _dbUrl = "https://bravojeopardy.firebaseio.com/";
    var _db = new Firebase(_dbUrl);

    var btnOpenAnswer = function () {
        var gameId = localStorage.getItem("currentGameID");
        if (gameId) {
            _db.child("games/" + gameId).update({
                answeropen: true
            });
        }
    }

    var btnPlayerAnswer = function (sender) {
        var gameId = localStorage.getItem("currentGameID");
        var user = localStorage.getItem("username");
        if (gameId) {
            _db.child("games/" + gameId).once("value", function (snap) {
                var btn = document.querySelector("#btnPlayerAnswer");
                btn.disabled = true;
                if (snap.val().answeropen && !snap.val().answeredby) {
                    _db.child("games/" + gameId).update({
                        answeredby: user
                    });
                    /*_db.child("games/" + gameId + "/answeropen").transaction(function () {
                        return true;
                    }, function (error, committed, snap) {
                        if (committed) {
                            checkFlag();
                        }
                    });*/
                }
            });
        }
    }

    var btnStartGame = function () {
        var selectedPlayers = document.querySelectorAll("input[name='player']:checked");
        if (selectedPlayers.length > 0) {
            var _gameplayers = _db.child("games").push();
            localStorage.setItem("currentGameID", _gameplayers.key());
            for (var i = 0; i < selectedPlayers.length; i++) {
                var item = selectedPlayers[i];
                _gameplayers.update({
                    ["players/" + item.value + "/score"]: 0,
                    answeropen: false
                });
            }
        }
    }

    var btnResetAnswerFlag = function () {
        var gameId = localStorage.getItem("currentGameID");
        if (gameId) {
            _db.child("games/" + gameId).update({
                answeropen: false,
                answeredby: null
            });
        }
    }

    var checkFlag = function () {
        var gameId = localStorage.getItem("currentGameID");
        var user = localStorage.getItem("username");
        if (gameId) {
            _db.child("games/" + gameId).on("value", function (snap) {
                var answeropen = snap.val().answeropen;
                var answeredby = snap.val().answeredby;
                var btn = document.querySelector("#btnPlayerAnswer");
                var status = document.querySelector(".answerStatus");
                var answeredPlayer = document.querySelector(".answeredPlayer");
                var answered = localStorage.getItem("answered");
                if (btn && status) {
                    if (answeredby || (answeredby && answeropen)) {
                        btn.disabled = true;
                    }
                    else if (!answeredby && answeropen) {
                        btn.disabled = false;
                        status.className += " answerOpen";
                        DEV.Helper.removeClass(document.querySelector(".answeredPlayer"), "answeredPlayer");
                    }
                }
            });
        }
    }

    var loadGame = function () {
        _db.child("games").limitToLast(1).on("value", function (snap) {
            if (snap.val()) {
                localStorage.setItem("currentGameID", Object.keys(snap.val())[0]);
            }
        });
    }

    var loadGamePlayers = function () {
        var user = localStorage.getItem("username");
        _db.child("games").limitToLast(1).on("value", function (snap) {
            if (snap.val()) {
                var currPlayerTemplate = "";
                var allPlayersTemplate = "";
                var count = 0;
                var match = false;
                var currentPlayerContainer = document.querySelector("#currentPlayer");
                var allPlayersContainer = document.querySelector("#players");
                var key = Object.keys(snap.val())[0];
                var players = snap.val()[key]["players"];
                var answeropen = snap.val()[key]["answeropen"];
                var answeredby = snap.val()[key]["answeredby"];
                var obj = Object.getOwnPropertyNames(players);
                for (var i in obj) {
                    count++;
                    var name = obj[i];
                    var score = players[name].score;
                    allPlayersTemplate += "" +
                        "<div class='game-player-container" + (name == answeredby ? " answeredPlayer" : "") + "' data-game-player='" + name + "'>" +
                        "<div class='game-player-score'>" + score + "</div>" +
                        "<div class='game-player-name'>" + name + "</div>" +
                        "</div>";
                    if (name == user) {
                        match = true;
                        currPlayerTemplate = "" +
                            "<div class='answerStatus'></div>" +
                            "<div class='answerButton'>" +
                            "<button type='button' id='btnPlayerAnswer' onclick='DEV.Jeopardy.btnPlayerAnswer(this)' data-player='" + name + "' disabled='disabled'>Answer!</button>" +
                            "</div>";
                        localStorage.setItem("currentGameID", Object.keys(snap.val())[0]);
                    }
                }
                if (!match) {
                    currPlayerTemplate = "<div class='noGamesFound'>You aren't entered in a current game yet. Please wait.</div>";
                }
                allPlayersContainer.innerHTML = allPlayersTemplate;
                currentPlayerContainer.innerHTML = currPlayerTemplate;

            }
        });
    }

    var availablePlayers = function () {
        var user = document.querySelector("#username").value || localStorage.getItem("username");
        if (user == "admin") {
            document.querySelector(".admin-container").style.cssText = "display: block";
            _db.child("users").on("value", function (snap) {
                var template = "";
                var count = 0;
                for (var i in snap.val()) {
                    var item = snap.val()[i];
                    count++;
                    template += "" +
                        "<div id='player" + count + "'>" +
                        "<input type='checkbox' name='player' value='" + item.user + "' />" +
                        "<span>" + item.user + "</span>" +
                        "</div>";
                }
                document.querySelector("#availableplayers").innerHTML = template;
            });
        }
    }

    var init = function () {
        loadGame();
        loadGamePlayers();
        availablePlayers();
        checkFlag();
    }

    return {
        init: init,
        btnOpenAnswer: btnOpenAnswer,
        btnStartGame: btnStartGame,
        btnPlayerAnswer: btnPlayerAnswer,
        btnResetAnswerFlag: btnResetAnswerFlag,
        loadGamePlayers: loadGamePlayers
    }
} ();

window.onload = function () {
    DEV.SignIn.init();
    DEV.Jeopardy.init();
}
