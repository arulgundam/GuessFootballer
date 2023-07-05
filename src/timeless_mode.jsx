import "./timeless_mode.css";
import { useEffect, useState, useRef, useReducer } from "preact/hooks";

const CSV_URL = "players_jun20_2023.csv";

const getMonthName = (monthNumber) => {
  var months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  return months[parseInt(monthNumber, 10) - 1];
};

const sanitizeInput = (input) => {
  return input.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
};

const addCommasToNumber = (number) => {
  return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
};

const TimelessMode = () => {
  const [guessCount, setGuessCount] = useState(0);
  const [streakCount, setStreakCount] = useState(0);
  const [topStreak, setTopStreak] = useState(0);
  const [incorrectGuesses, setIncorrectGuesses] = useState([]);
  const [player, setPlayer] = useState(null);
  const difficultySelect = useRef(null);
  const guessInput = useRef(null);
  const [state, setState] = useState("initial");
  const [clueState, provideClue] = useReducer(
    (state, action) => {
      if (
        state.clueTypes.includes(action.type) ||
        state === "correct" ||
        state === "reveal"
      ) {
        return state;
      }

      state.clueTypes.push(action.type);
      state.clueCount += 1;

      switch (action.type) {
        case "clear": {
          state.clueCount = 0;
          state.clueTypes = [];
          state.clues = [];

          return {
            ...state,
          };
        }

        case "club": {
          const clue = (
            <>
              <span>Club - {player.current_club_name}</span>
              <br />
              <img
                src={`https://www.transfermarkt.de/images/wappen/head/${player.current_club_id}.png`}
              />
            </>
          );

          state.clues.push(clue);

          return {
            ...state,
          };
        }

        case "position": {
          const clue = (
            <>
              <span>Position - {player.position}</span>
            </>
          );

          state.clues.push(clue);

          return {
            ...state,
          };
        }

        case "birthday": {
          let birthdayParts = player.date_of_birth.split("-");
          let month = getMonthName(birthdayParts[1]);
          let day = parseInt(birthdayParts[2], 10);
          let year = birthdayParts[0];
          const clue = (
            <>
              <span>
                Birthday - {month} {day}, {year}
              </span>
            </>
          );

          state.clues.push(clue);

          return {
            ...state,
          };
        }

        case "birthplace": {
          const clue = (
            <>
              <span>
                Birthplace - {player.city_of_birth.trim()},{" "}
                {player.country_of_birth}
              </span>
            </>
          );

          state.clues.push(clue);

          return {
            ...state,
          };
        }

        case "peak_market_value": {
          let value = addCommasToNumber(player.highest_market_value_in_eur);
          if (value.endsWith(".0")) {
            value = value.slice(0, -2);
          }

          const clue = (
            <>
              <span>Peak Market Value - &euro;{value}</span>
            </>
          );

          state.clues.push(clue);

          return {
            ...state,
          };
        }

        default: {
          return state;
        }
      }
    },
    { clues: [], clueTypes: [], clueCount: 0 }
  );

  const showState = () => {
    switch (state) {
      case "initial":
        return <></>;

      case "correct":
        return (
          <div>
            <p>
              Correct! The player is{" "}
              <a
                href={`https://www.transfermarkt.us/${player.player_code}/profil/spieler/${player.player_id}`}
              />{" "}
              {player.name}.
            </p>
            <img id="player-image" src={player.image_url} alt="Player Image" />
          </div>
        );

      case "incorrect":
        return <p>Incorrect. Keep guessing!</p>;

      case "reveal":
        return (
          <div>
            <p>
              The correct player is{" "}
              <a
                href={`https://www.transfermarkt.us/${player.player_code}/profil/spieler/${player.player_id}`}
              />{" "}
              {player.name}.
            </p>
            <img id="player-image" src={player.image_url} alt="Player Image" />
          </div>
        );
    }
  };

  const loadPlayers = async () => {
    let req = await fetch(CSV_URL);
    let data = await req.text();

    let lines = data.trim().split("\n");
    let headers = lines[0].split(",");
    let players = [];

    for (let i = 1; i < lines.length; i++) {
      let currentLine = lines[i].split(",");
      let player = {};

      for (let j = 0; j < headers.length; j++) {
        player[headers[j]] = currentLine[j];
      }

      players.push(player);
    }

    return players;
  };

  const startGame = (players) => {
    var difficulty = difficultySelect.current.value;

    let filteredPlayers;
    switch (difficulty) {
      case "normal":
        filteredPlayers = players.filter(
          (player) => player.highest_market_value_in_eur >= 35000000
        );
        break;
      case "hard":
        filteredPlayers = players.filter(
          (player) =>
            player.highest_market_value_in_eur >= 10000000 &&
            player.highest_market_value_in_eur <= 35000000
        );
        break;
      case "impossible":
        filteredPlayers = players.filter(
          (player) =>
            player.highest_market_value_in_eur >= 1000000 &&
            player.highest_market_value_in_eur <= 10000000
        );
        break;
      case "random":
        filteredPlayers = players.filter(
          (player) => player.highest_market_value_in_eur >= 1000000
        );
        break;
      default:
        filteredPlayers = players;
        break;
    }

    if (filteredPlayers.length === 0) {
      console.error("No players found for the selected difficulty");
      return;
    }

    let playerIndex = Math.floor(Math.random() * filteredPlayers.length);
    setPlayer(filteredPlayers[playerIndex]);
    console.log(filteredPlayers[playerIndex]);
    setIncorrectGuesses([]);
    setState("initial");
    provideClue({ type: "clear" });
  };

  const startNewGame = async () => {
    const players = await loadPlayers();
    startGame(players);
  };

  useEffect(async () => {
    await startNewGame();
  }, []);

  const checkGuess = () => {
    const guess = sanitizeInput(guessInput.current.value.trim());
    const playerName = sanitizeInput(player.name.toLowerCase());
    const playerLastName = sanitizeInput(player.last_name.toLowerCase());

    if (guess === "") {
      // No guess input, do not display the message
      return;
    }

    if (
      guess.toLowerCase() === playerName ||
      guess.toLowerCase() === playerLastName
    ) {
      setStreakCount((count) => count + 1);
      if (streakCount + 1 > topStreak) {
        setTopStreak(streakCount + 1);
      }

      setState("correct");
      provideClue({ type: "clear" });
    } else {
      setStreakCount(0);
      setState("incorrect");
      setIncorrectGuesses([...incorrectGuesses, guess]);
    }
  };

  const revealPlayer = () => {
    setState("reveal");
  };

  const displayIncorrectGuesses = () => (
    <>
      <p style={{ display: 'inline' }}>Incorrect Guesses: </p>
      <ul>
        {incorrectGuesses.map((x, i) => (
          <li key={i}>{x}{i !== incorrectGuesses.length - 1 && ','}</li>
        ))}
      </ul>
    </>
  );  

  return (
    <>
      <title>GuessFootball</title>
      <h1 className="font-bold">GuessFootball: Timeless Mode</h1>

      <div id="difficulty-section">
        <label for="difficulty">Difficulty: </label>
        <select id="difficulty" ref={difficultySelect} onChange={startNewGame}>
          <option value="normal">Normal</option>
          <option value="hard">Hard</option>
          <option value="impossible">Impossible</option>
          <option value="random">Random</option>
        </select>
      </div>

      <p>
        Streak: <span id="streak-count">{streakCount}</span>
      </p>
      <p>
        Top Streak: <span id="top-streak">{topStreak}</span>
      </p>

      <div id="incorrect-guesses">
        {incorrectGuesses.length !== 0 ? displayIncorrectGuesses() : <></>}
      </div>

      <div id="guess-form">
        <label for="guess">Guess: </label>
        <input
          type="text"
          id="guess"
          ref={guessInput}
          placeholder="Enter player name"
          onKeyUp={(evt) => {
            if (evt.key === "Enter") {
              evt.preventDefault();
              checkGuess();
            }
          }}
        />
        <button id="submit-button" onClick={checkGuess}>
          Submit
        </button>
      </div>

      <div id="result">
        {showState()}
        {clueState.clues.map((x, i) => (
          <div key={i}>{x}</div>
        ))}
      </div>

      <p>
        Guesses Taken: <span id="guess-count">{guessCount}</span>
      </p>
      <p>
        Clues Used: <span id="clue-count">{clueState.clueCount}</span>
      </p>

      <div id="clue-section">
        <label id="clue-label" for="clue-buttons">
          Use a Clue:
        </label>
        <div id="clue-buttons">
          <button
            class="clue-button"
            onClick={() => provideClue({ type: "club" })}
            disabled={clueState.clueTypes.includes("club")}
          >
            Club
          </button>
          <button
            class="clue-button"
            onClick={() => provideClue({ type: "position" })}
            disabled={clueState.clueTypes.includes("position")}
          >
            Position
          </button>
          <button
            class="clue-button"
            onClick={() => provideClue({ type: "birthday" })}
            disabled={clueState.clueTypes.includes("birthday")}
          >
            Birthday
          </button>
          <button
            class="clue-button"
            onClick={() => provideClue({ type: "birthplace" })}
            disabled={clueState.clueTypes.includes("birthplace")}
          >
            Birthplace
          </button>
          <button
            class="clue-button"
            onClick={() => provideClue({ type: "peak_market_value" })}
            disabled={clueState.clueTypes.includes("peak_market_value")}
          >
            Peak Market Value
          </button>
        </div>
      </div>

      <button id="reveal-button" onClick={revealPlayer}>
        Give Up
      </button>
      <button id="new-game-button" onClick={startNewGame}>
        New Game
      </button>

      <ul class="top-right">
        <li>
          <a href="/">
            <span class="soccer-icon"></span> Game
          </a>
        </li>
        <li>
          <a href="/about">
            <span class="soccer-icon"></span> About
          </a>
        </li>
        <li>
          <a href="/contact">
            <span class="soccer-icon"></span> Contact
          </a>
        </li>
      </ul>
    </>
  );
};

export default TimelessMode;
