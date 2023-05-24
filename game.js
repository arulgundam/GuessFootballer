var csvURL = 'tmarkt_players_05_09_2023.csv';
var resultDiv = document.getElementById("result");
var revealButton = document.getElementById("reveal-button");
var clueButtons = document.getElementsByClassName("clue-button");
var guessCountElement = document.getElementById("guess-count");
var clueCountElement = document.getElementById("clue-count");
var difficultySelect = document.getElementById("difficulty");

var guessCount = 0;
var clueCount = 0;
var takenClues = [];
var streakCount = 0;

fetch(csvURL)
    .then(response => response.text())
    .then(data => {
        var lines = data.trim().split('\n');
        var headers = lines[0].split(',');
        var players = [];

        for (var i = 1; i < lines.length; i++) {
            var currentLine = lines[i].split(',');
            var player = {};

            for (var j = 0; j < headers.length; j++) {
                player[headers[j]] = currentLine[j];
            }

            players.push(player);
        }

        startGame(players);
    })
    .catch(error => {
        console.error('Error fetching CSV data:', error);
    });

var playerIndex;
var player;
var guessInput = document.getElementById("guess");
var guessButton = document.querySelector("button");

guessButton.addEventListener("click", checkGuess);

function startGame(players) {
    resultDiv.textContent = "";

    var difficulty = difficultySelect.value;

    difficultySelect.classList.add("flash");
    setTimeout(function () {
        difficultySelect.classList.remove("flash");
    }, 500);

    var filteredPlayers;
    switch (difficulty) {
        case "normal":
            filteredPlayers = players.filter(player => player.highest_market_value_in_eur >= 50000000);
            break;
        case "hard":
            filteredPlayers = players.filter(player => player.highest_market_value_in_eur >= 10000000 && player.highest_market_value_in_eur <= 50000000);
            break;
        case "impossible":
            filteredPlayers = players.filter(player => player.highest_market_value_in_eur >= 1000000 && player.highest_market_value_in_eur <= 10000000);
            break;
        case "random":
            filteredPlayers = players.filter(player => player.highest_market_value_in_eur >= 1000000);
            break;
        default:
            filteredPlayers = players;
            break;
    }

    if (filteredPlayers.length === 0) {
        console.error('No players found for the selected difficulty');
        return;
    }

    playerIndex = Math.floor(Math.random() * filteredPlayers.length);
    player = filteredPlayers[playerIndex];
    guessInput.disabled = false;
    resultDiv.textContent = "";
    revealButton.style.display = "inline-block";
    for (var i = 0; i < clueButtons.length; i++) {
        clueButtons[i].style.display = "inline-block";
        clueButtons[i].classList.remove("disabled");
    }
    takenClues = [];
    guessCount = 0;
    clueCount = 0;
    guessCountElement.textContent = guessCount;
    clueCountElement.textContent = clueCount;
    document.getElementById("clue-section").style.display = "block";
    for (var i = 0; i < clueButtons.length; i++) {
        clueButtons[i].disabled = false;
    }
}

function checkGuess() {
    var guess = sanitizeInput(guessInput.value.trim());
    var playerName = sanitizeInput(player.name.toLowerCase());
    var playerLastName = sanitizeInput(player.last_name.toLowerCase());

    if (guess === "") {
        // No guess input, do not display the message
        return;
    }

    if (guess.toLowerCase() === playerName || guess.toLowerCase() === playerLastName) {
        streakCount++;
        document.getElementById("streak-count").textContent = streakCount;
        var transfermarktURL = "https://www.transfermarkt.us/" + player.player_code + "/profil/spieler/" + player.player_id;
        resultDiv.innerHTML = "<p>Correct! The player is <a href='" + transfermarktURL + "' target='_blank'>" + player.name + "</a>.</p><img id='player-image' src='" + player.image_url + "' alt='Player Image'>";
        guessInput.disabled = true;
        revealButton.style.display = "none";
        for (var i = 0; i < clueButtons.length; i++) {
            clueButtons[i].style.display = "none";
        }
        document.getElementById("clue-section").style.display = "none";
    } else {
        streakCount = 0;
        document.getElementById("streak-count").textContent = streakCount;
        resultDiv.innerHTML = "<p>Incorrect. Keep guessing!</p>";
        displayTakenClues();
    }

    guessInput.value = "";
    guessCount++;
    guessCountElement.textContent = guessCount;
}

function displayTakenClues() {
    if (takenClues.length === 0) {
        resultDiv.innerHTML = "<p>Incorrect. Keep guessing!</p>";
        return;
    }

    var cluesHTML = "<p>Incorrect. Keep guessing!</p><p>Your clue(s):<br>";
    var uniqueClueTypes = [...new Set(takenClues)];

    for (var i = 0; i < uniqueClueTypes.length; i++) {
        var clueType = uniqueClueTypes[i];
        var clue;

        switch (clueType) {
            case "Club":
                var clubId = player.current_club_id;
                clue = player.current_club_name;
                var clubLogoUrl = "https://www.transfermarkt.de/images/wappen/head/" + clubId + ".png";
                clue += "<br><img src='" + clubLogoUrl + "' alt='Club Logo' />";
                break;
            case "Position":
                clue = player.position;
                break;
            case "Birthday":
                clue = player.date_of_birth;
                break;
            case "Birthplace":
                clue = player.city_of_birth.trim() + ", " + player.country_of_birth;
                break;
            case "Peak Market Value":
                clue = addCommasToNumber(player.highest_market_value_in_eur);
                break;
            default:
                clue = "No clue available";
                break;
        }

        cluesHTML += clueType + " - " + clue + "<br>";
    }

    cluesHTML += "</p>";
    resultDiv.innerHTML = cluesHTML;
}

function addCommasToNumber(number) {
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function revealPlayer() {
    streakCount = 0;
    document.getElementById("streak-count").textContent = streakCount;
    var transfermarktURL = "https://www.transfermarkt.us/" + player.player_code + "/profil/spieler/" + player.player_id;
    resultDiv.innerHTML = "<p>Correct! The player is <a href='" + transfermarktURL + "' target='_blank'>" + player.name + "</a>.</p><img id='player-image' src='" + player.image_url + "' alt='Player Image'>";
    revealButton.style.display = "none";
    for (var i = 0; i < clueButtons.length; i++) {
        clueButtons[i].style.display = "none";
    }
    document.getElementById("clue-section").style.display = "none";
}

function provideClue(clueType) {
    if (takenClues.includes(clueType)) {
        return;
    }

    var clue;

    switch (clueType) {
        case "Club":
            var clubId = player.current_club_id;
            clue = player.current_club_name;
            var clubLogoUrl = "https://www.transfermarkt.de/images/wappen/head/" + clubId + ".png";
            clue += "<br><img src='" + clubLogoUrl + "' alt='Club Logo' />";
            break;
        case "Position":
            clue = player.position;
            break;
        case "Birthday":
            var birthdayParts = player.date_of_birth.split("-");
            var month = getMonthName(birthdayParts[1]);
            var day = parseInt(birthdayParts[2], 10);
            var year = birthdayParts[0];
            clue = month + " " + day + ", " + year;
            break;
        case "Birthplace":
            clue = player.city_of_birth.trim() + ", " + player.country_of_birth;
            break; 
        case "Birthplace":
            clue = player.city_of_birth.trim() + ", " + player.country_of_birth;
            break;
        case "Peak Market Value":
            clue = "&euro;" + addCommasToNumber(player.highest_market_value_in_eur);
            if (clue.endsWith(".0")) {
                clue = clue.slice(0, -2);
            }
            break;
        default:
            clue = "No clue available";
            break;
    }

    resultDiv.innerHTML += clueType + " - " + clue + "</p>";
    clueCount++;
    clueCountElement.textContent = clueCount;
    takenClues.push(clueType);

    for (var i = 0; i < clueButtons.length; i++) {
        if (clueButtons[i].textContent === clueType) {
            clueButtons[i].classList.add("disabled");
            clueButtons[i].disabled = true;
            break;
        }
    }
}

function startNewGame() {
    fetch(csvURL)
        .then(response => response.text())
        .then(data => {
            var lines = data.trim().split('\n');
            var headers = lines[0].split(',');
            var players = [];

            for (var i = 1; i < lines.length; i++) {
                var currentLine = lines[i].split(',');
                var player = {};

                for (var j = 0; j < headers.length; j++) {
                    player[headers[j]] = currentLine[j];
                }

                players.push(player);
            }

            startGame(players);
        })
        .catch(error => {
            console.error('Error fetching CSV data:', error);
        });
}

function sanitizeInput(input) {
    return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function getMonthName(monthNumber) {
    var months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    return months[parseInt(monthNumber, 10) - 1];
}

difficultySelect.addEventListener("change", startNewGame);
guessButton.addEventListener("click", checkGuess);
revealButton.addEventListener("click", revealPlayer);

for (var i = 0; i < clueButtons.length; i++) {
    clueButtons[i].addEventListener("click", function () {
        provideClue(this.textContent);
    });
}
