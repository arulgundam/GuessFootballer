import "./timeless_mode.css";
import { useEffect, useState, useRef, useReducer } from "preact/hooks";
import tw from 'tailwind-styled-components';
import Confetti from "react-confetti";

const CSV_URL = "players_jun20_2023.csv";

const PlayerImage = tw.img`
  ${(p) => (p.blurred ? "" : "")}
  w-[278px]
  h-[362px]
  border-none
  transition-all
`;

const PlayerText = tw.p`
  text-2xl
  font-bold
  pb-4
  ${(p) => (p.blurred ? "blur-md" : "")}
  select-none
  text-black
`;

const PlayerImageWrapper = tw.div`
  flex
  flex-col
  items-center
  rounded-xl
  overflow-hidden
  ${(p) => (p.blurred ? "blur-xl" : "")}
  border border-black
`;

const ClueCard = tw.div`
  flex
  flex-col
  border
  border-black
  rounded-lg
  p-4
  w-full
  ${(p) => (p.clicked ? "" : "hover:bg-gray-300")}
  cursor-pointer
`;

const ClueText = tw.p`
  text-sm
  text-gray-900
  ${(p) => (p.clicked ? "" : "blur-md")}
  transition-all
`;

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
  const [clues, setClues] = useState({});

  const generateClues = () => {
    if (player === null) return {};

    const clues = {
      club: {
        shown: false,
        displayName: "Club",
        clue: player?.current_club_name,
      },
      position: {
        shown: false,
        displayName: "Position",
        clue: player?.position,
      },
      birthday: {
        shown: false,
        displayName: "Birthday",
        clue: (() => {
          let birthdayParts = player.date_of_birth.split("-");
          let month = getMonthName(birthdayParts[1]);
          let day = parseInt(birthdayParts[2], 10);
          let year = birthdayParts[0];
          return `${month} ${day}, ${year}`;
        })(),
      },
      birthplace: {
        shown: false,
        displayName: "Birthplace",
        clue: `${player.city_of_birth.trim()}, ${player.country_of_birth}`
      },
      peak_market_value: {
        shown: false,
        displayName: "Peak Market Value",
        clue: (() => {
          let value = addCommasToNumber(player.highest_market_value_in_eur);
          if (value.endsWith(".0")) {
            value = value.slice(0, -2);
          }
          return `€${value}`;
        })(),
      },
    };

    return clues;
  }

  const showState = () => {
    switch (state) {
      case "initial":
        return <></>;

      case "correct":
        return (
          <div>
            <Confetti recycle={false} />
          </div>
        );

      case "incorrect":
        return <></>;

      case "reveal":
        return (
          <></>
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
  };

  const startNewGame = async () => {
    const players = await loadPlayers();
    startGame(players);
  };

  useEffect(async () => {
    await startNewGame();
  }, []);

  useEffect(() => {
    setClues(generateClues());
  }, [player]);

  const showAllClues = () => {
    setClues(Object.entries(clues).map(([_, v]) => (v.shown = true, v)));
  };

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
      // Correct guess
      setStreakCount((count) => count + 1);
      if (streakCount + 1 > topStreak) {
        setTopStreak(streakCount + 1);
      }
  
      setState("correct");
      showAllClues();
    } else {
      // Incorrect guess
      setStreakCount(0);
      setState("incorrect");
      setIncorrectGuesses([...incorrectGuesses, guess]);
    }
  
    // Clear the guess input field
    guessInput.current.value = "";
  };
  
  

  useEffect(() => {
    const handleKeyDown = (event) => {
      if ((state === "correct" || state === "reveal") && event.key === "Enter") {
        startNewGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [state, startNewGame]);


  const revealPlayer = () => {
    setState("reveal");
    showAllClues();
    setStreakCount(0); // Reset streak count to zero
  };

  const displayIncorrectGuesses = () => (
    <>
      <ul>
        {incorrectGuesses.map((x, i) => (
          <li key={i}>{x}{i !== incorrectGuesses.length - 1}</li>
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

      <div class="stats-container">
        <div class="stats-item">
          <p>
            Streak: <span id="streak-count">{streakCount}</span>
          </p>
        </div>
        <div class="stats-item">
          <p>
            Top Streak: <span id="top-streak">{topStreak}</span>
          </p>
        </div>
        <div class="stats-item">
          <p>
            Guesses Taken: <span id="guess-count">{guessCount}</span>
          </p>
        </div>
      </div>


      <div id="incorrect-guesses">
        {incorrectGuesses.length !== 0 ? displayIncorrectGuesses() : <></>}
      </div>

      <div id="result">
        {showState()}
      </div>

      <div className="flex items-center justify-center">
        <div className="flex items-center justify-center space-x-10 border-2 border-black rounded-xl p-8" style={{ backgroundColor: state === "initial" ? "#F8DE7E" : state === "reveal" ? "#DA2C43" : state === "correct" ? "#50C878" : "" }}>
          <div className="flex flex-col text-center">
            <PlayerText blurred={state !== "correct" && state !== "reveal"}>{player?.name}</PlayerText>
            <PlayerImageWrapper blurred={state !== "correct" && state !== "reveal"}>
              <PlayerImage id="player-image" src={player?.image_url} alt="Player Image" width={139} height={181} />
            </PlayerImageWrapper>
          </div>
          <div className="flex flex-col pl-4 space-y-4 items-start justify-start">
            {Object.entries(clues ?? {}).map(([k, v], i) => {
              return (
                <ClueCard onClick={(e) => {
                  e.preventDefault();
                  if (clues[k].shown !== false) return;
                  let newClues = { ...clues };
                  newClues[k].shown = true;
                  setClues(newClues);
                }}
                  clicked={clues[k].shown === true}
                >
                  <p className="text-base font-medium text-gray-900">{clues[k].displayName}</p>
                  <ClueText clicked={clues[k].shown}>{clues[k].clue}</ClueText>
                </ClueCard>
              )
            })
            }
          </div>
        </div>
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

      <div className="button-section">
        {state === "initial" || state === "incorrect" ? (
          <button id="reveal-button" onClick={revealPlayer}>
            Give Up
          </button>
        ) : (
          <button id="new-game-button" onClick={startNewGame}>
            New Game
          </button>
        )}
      </div>




      <ul class="navigation">
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