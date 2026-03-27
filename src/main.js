import {
  GRID_SIZE,
  createInitialState,
  queueDirection,
  stepGame,
  togglePause
} from "./game.js";

const BASE_TICK_MS = 140;
const STORAGE_KEY = "snake-best-score";

const board = document.querySelector("#board");
const scoreValue = document.querySelector("#score");
const bestScoreValue = document.querySelector("#best-score");
const stateValue = document.querySelector("#state");
const pauseButton = document.querySelector("#pause-button");
const restartButton = document.querySelector("#restart-button");
const controlButtons = document.querySelectorAll("[data-direction]");

let state = createInitialState();
let bestScore = Number.parseInt(window.localStorage.getItem(STORAGE_KEY) ?? "0", 10) || 0;

function getSpeedMultiplier() {
  const params = new URLSearchParams(window.location.search);
  const rawSpeed = Number.parseFloat(params.get("speed") ?? "1");

  if (!Number.isFinite(rawSpeed) || rawSpeed <= 0) {
    return 1;
  }

  return rawSpeed;
}

const speedMultiplier = getSpeedMultiplier();
const tickMs = BASE_TICK_MS / speedMultiplier;

function setBestScore(score) {
  bestScore = Math.max(bestScore, score);
  window.localStorage.setItem(STORAGE_KEY, String(bestScore));
}

function getStateLabel(status) {
  if (status === "game-over") {
    return "Game Over";
  }

  if (status === "paused") {
    return "Paused";
  }

  if (status === "won") {
    return "Cleared";
  }

  return "Running";
}

function renderBoard() {
  const cells = [];

  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      const segmentIndex = state.snake.findIndex((segment) => segment.x === x && segment.y === y);
      const isFood = state.food && state.food.x === x && state.food.y === y;
      const classes = ["cell"];

      if (segmentIndex === 0) {
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

function render() {
  renderBoard();
  scoreValue.textContent = String(state.score);
  bestScoreValue.textContent = String(bestScore);
  stateValue.textContent = getStateLabel(state.status);
  pauseButton.textContent = state.status === "paused" ? "Resume" : "Pause";
  pauseButton.disabled = state.status === "game-over" || state.status === "won";
}

function restart() {
  state = createInitialState();
  render();
}

function applyDirection(direction) {
  state = queueDirection(state, direction);
}

function tick() {
  const nextState = stepGame(state);
  if (nextState.score !== state.score) {
    setBestScore(nextState.score);
  }

  state = nextState;
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
    state = togglePause(state);
    render();
    return;
  }

  if (key === "r") {
    restart();
    return;
  }

  const direction = directionByKey[key];
  if (!direction) {
    return;
  }

  event.preventDefault();
  applyDirection(direction);
}

board.style.setProperty("--grid-size", String(GRID_SIZE));
window.addEventListener("keydown", handleKeydown);
pauseButton.addEventListener("click", () => {
  state = togglePause(state);
  render();
});
restartButton.addEventListener("click", restart);
controlButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyDirection(button.dataset.direction);
  });
});

render();
window.setInterval(tick, tickMs);
