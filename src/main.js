import {
  GRID_SIZE,
  createFood,
  createInitialState,
  queueDirection,
  stepGame,
  togglePause
} from "./game.js";

const BASE_TICK_MS = 140;
const STORAGE_KEY = "snake-best-score";

const OVERLAY_INTRO = "intro";
const OVERLAY_GAME_OVER = "game-over";
const OVERLAY_LEVEL_CLEAR = "level-clear";

const board = document.querySelector("#board");
const panel = document.querySelector(".panel");
const splashScreen = document.querySelector("#splash-screen");
const splashTitle = document.querySelector("#splash-title");
const splashCaption = document.querySelector("#splash-caption");
const startButton = document.querySelector("#start-button");
const scoreValue = document.querySelector("#score");
const bestScoreValue = document.querySelector("#best-score");
const stateValue = document.querySelector("#state");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const eatButton = document.querySelector("#eat-button");
const nextLevelButton = document.querySelector("#next-level-button");
const controlButtons = document.querySelectorAll("[data-direction]");

function getSpeedMultiplier() {
  const params = new URLSearchParams(window.location.search);
  const rawSpeed = Number.parseFloat(params.get("speed") ?? "1");

  if (!Number.isFinite(rawSpeed) || rawSpeed <= 0) {
    return 1;
  }

  return rawSpeed;
}

function createLevelTwoWalls(gridSize) {
  const width = Math.floor(gridSize * 0.57);
  const height = Math.floor(gridSize * 0.5);
  const thickness = Math.max(1, Math.floor(gridSize * 0.07));
  const startX = Math.floor((gridSize - width) / 2);
  const startY = Math.floor((gridSize - height) / 2);
  const walls = [];

  for (let x = startX; x < startX + width; x += 1) {
    for (let t = 0; t < thickness; t += 1) {
      walls.push({ x, y: startY + t });
    }
  }

  for (let y = startY; y < startY + height; y += 1) {
    for (let t = 0; t < thickness; t += 1) {
      walls.push({ x: startX + t, y });
      walls.push({ x: startX + width - 1 - t, y });
    }
  }

  return walls;
}

function createLevelThreeWalls(gridSize) {
  const width = Math.floor(gridSize * 0.57);
  const height = Math.floor(gridSize * 0.54);
  const thickness = Math.max(1, Math.floor(gridSize * 0.07));
  const centerX = Math.floor(gridSize / 2);
  const startY = Math.floor((gridSize - height) / 2);
  const maxHalfWidth = Math.floor(width / 2);
  const wallMap = new Map();

  function addWall(x, y) {
    if (x < 0 || y < 0 || x >= gridSize || y >= gridSize) {
      return;
    }

    wallMap.set(`${x},${y}`, { x, y });
  }

  for (let row = 0; row < height; row += 1) {
    const offset = Math.max(1, Math.floor((row * maxHalfWidth) / Math.max(1, height - 1)));
    const y = startY + row;
    const leftX = centerX - offset;
    const rightX = centerX + offset;

    for (let t = 0; t < thickness; t += 1) {
      addWall(leftX + t, y);
      addWall(rightX - t, y);
    }
  }

  const crossbarRow = startY + Math.floor(height * 0.5);
  const crossbarOffset = Math.max(thickness + 1, Math.floor(maxHalfWidth * 0.45));

  for (let y = crossbarRow; y < crossbarRow + thickness; y += 1) {
    for (let x = centerX - crossbarOffset; x <= centerX + crossbarOffset; x += 1) {
      addWall(x, y);
    }
  }

  return [...wallMap.values()];
}

const LEVELS = [
  {
    id: "level-1",
    label: "Level 1",
    introButton: "Start",
    introCaption: "Press Space to start",
    targetScore: 20,
    createState: () =>
      createInitialState({
        gridSize: GRID_SIZE,
        targetScore: 20
      })
  },
  {
    id: "level-2",
    label: "Level 2",
    introButton: "Start",
    introCaption: "Press Space to start",
    targetScore: 20,
    createState: () =>
      createInitialState({
        gridSize: GRID_SIZE * 2,
        walls: createLevelTwoWalls(GRID_SIZE * 2),
        targetScore: 20
      })
  },
  {
    id: "level-3",
    label: "Level 3",
    introButton: "Start",
    introCaption: "Press Space to start",
    targetScore: null,
    createState: () =>
      createInitialState({
        gridSize: GRID_SIZE * 2,
        walls: createLevelThreeWalls(GRID_SIZE * 2)
      })
  }
];

const speedMultiplier = getSpeedMultiplier();
const tickMs = BASE_TICK_MS / speedMultiplier;

let currentLevelIndex = 0;
let overlayMode = OVERLAY_INTRO;
let state = LEVELS[currentLevelIndex].createState();
let bestScore = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0;

function getCurrentLevel() {
  return LEVELS[currentLevelIndex];
}

function isPlaying() {
  return overlayMode === null;
}

function positionKey(position) {
  return `${position.x},${position.y}`;
}

function setBestScore(score) {
  bestScore = Math.max(bestScore, score);
  window.localStorage.setItem(STORAGE_KEY, String(bestScore));
}

function getStateLabel() {
  if (overlayMode === OVERLAY_INTRO) {
    return getCurrentLevel().label;
  }

  if (overlayMode === OVERLAY_LEVEL_CLEAR) {
    return "You win!";
  }

  if (overlayMode === OVERLAY_GAME_OVER) {
    return "Game Over";
  }

  if (state.status === "paused") {
    return "Paused";
  }

  return getCurrentLevel().label;
}

function getOverlayConfig() {
  if (overlayMode === OVERLAY_GAME_OVER) {
    return {
      title: "Game Over",
      button: "Try again",
      caption: "Press Space to try again",
      className: "game-over"
    };
  }

  if (overlayMode === OVERLAY_LEVEL_CLEAR) {
    return {
      title: "You win!",
      button: "Continue",
      caption: "Press Space to continue",
      className: "level-clear"
    };
  }

  const level = getCurrentLevel();
  return {
    title: level.label,
    button: level.introButton,
    caption: level.introCaption,
    className: "level-intro"
  };
}

function applyLevelClassNames() {
  const isDenseLevel = getCurrentLevel().id === "level-2" || getCurrentLevel().id === "level-3";

  panel.classList.toggle("level-2", getCurrentLevel().id === "level-2");
  panel.classList.toggle("level-3", getCurrentLevel().id === "level-3");
  panel.classList.toggle("dense-level", isDenseLevel);

  board.classList.toggle("level-2", getCurrentLevel().id === "level-2");
  board.classList.toggle("level-3", getCurrentLevel().id === "level-3");
  board.classList.toggle("dense-level", isDenseLevel);

  splashScreen.classList.toggle("level-2", getCurrentLevel().id === "level-2");
  splashScreen.classList.toggle("level-3", getCurrentLevel().id === "level-3");
  splashScreen.classList.toggle("dense-level", isDenseLevel);
}

function renderBoard() {
  const wallKeys = new Set((state.walls ?? []).map(positionKey));
  const cells = [];

  for (let y = 0; y < state.gridSize; y += 1) {
    for (let x = 0; x < state.gridSize; x += 1) {
      const key = positionKey({ x, y });
      const segmentIndex = state.snake.findIndex((segment) => segment.x === x && segment.y === y);
      const isFood = state.food && state.food.x === x && state.food.y === y;
      const classes = ["cell"];

      if (wallKeys.has(key)) {
        classes.push("wall");
      } else if (segmentIndex === 0) {
        classes.push("snake-head");
      } else if (segmentIndex > 0) {
        classes.push("snake-body");
      } else if (isFood) {
        classes.push("food");
      }

      cells.push(`<div class="${classes.join(" ")}" role="gridcell" aria-hidden="true"></div>`);
    }
  }

  board.innerHTML = cells.join("");
}

function renderOverlay() {
  const showOverlay = overlayMode !== null;
  const config = getOverlayConfig();

  splashScreen.hidden = !showOverlay;
  splashScreen.classList.remove("game-over", "level-clear", "level-intro");
  splashScreen.classList.add(config.className);
  splashTitle.textContent = config.title;
  splashCaption.textContent = config.caption;
  startButton.textContent = config.button;
}

function render() {
  applyLevelClassNames();
  board.style.setProperty("--grid-size", String(state.gridSize));
  renderBoard();
  renderOverlay();

  scoreValue.textContent = String(state.score);
  bestScoreValue.textContent = String(bestScore);
  stateValue.textContent = getStateLabel();
  pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
  pauseButton.disabled = !isPlaying() || state.status === "game-over" || state.status === "won";
  eatButton.disabled = overlayMode === OVERLAY_LEVEL_CLEAR || state.status === "game-over";
  nextLevelButton.disabled = getCurrentLevel().id === "level-3";
}

function resetCurrentLevel() {
  state = getCurrentLevel().createState();
}

function restartLevel() {
  resetCurrentLevel();
  overlayMode = null;
  render();
}

function goToNextLevelIntro() {
  currentLevelIndex = Math.min(currentLevelIndex + 1, LEVELS.length - 1);
  resetCurrentLevel();
  overlayMode = OVERLAY_INTRO;
  render();
}

function goToNextLevel() {
  if (getCurrentLevel().id === "level-3") {
    return;
  }

  goToNextLevelIntro();
}

function activateOverlayAction() {
  if (overlayMode === OVERLAY_GAME_OVER) {
    restartLevel();
    return;
  }

  if (overlayMode === OVERLAY_LEVEL_CLEAR) {
    goToNextLevelIntro();
    return;
  }

  overlayMode = null;
  render();
}

function applyDirection(direction) {
  if (!isPlaying()) {
    return;
  }

  state = queueDirection(state, direction);
}

function spawnFood() {
  const food = createFood(state.snake, state.gridSize, Math.random, state.walls);

  state = {
    ...state,
    food,
    status: food ? state.status : "won"
  };
  render();
}

function tick() {
  if (!isPlaying()) {
    return;
  }

  const nextState = stepGame(state);
  if (nextState.score !== state.score) {
    setBestScore(nextState.score);
  }

  state = nextState;

  if (state.status === "game-over") {
    overlayMode = OVERLAY_GAME_OVER;
  } else if (state.status === "won") {
    overlayMode = OVERLAY_LEVEL_CLEAR;
  }

  render();
}

function handleKeydown(event) {
  const key = event.key.toLowerCase();
  const directionByKey = {
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down",
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right"
  };

  if (key === " ") {
    event.preventDefault();
    if (!isPlaying()) {
      activateOverlayAction();
      return;
    }

    state = togglePause(state);
    render();
    return;
  }

  if (key === "r") {
    restartLevel();
    return;
  }

  const direction = directionByKey[key];
  if (!direction) {
    return;
  }

  event.preventDefault();
  applyDirection(direction);
}

window.addEventListener("keydown", handleKeydown);
pauseButton.addEventListener("click", () => {
  state = togglePause(state);
  render();
});
restartButton.addEventListener("click", restartLevel);
eatButton.addEventListener("click", spawnFood);
nextLevelButton.addEventListener("click", goToNextLevel);
startButton.addEventListener("click", activateOverlayAction);
controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyDirection(button.dataset.direction);
  });
});

render();
window.setInterval(tick, tickMs);
