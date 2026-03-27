import test from "node:test";
import assert from "node:assert/strict";

import {
  createFood,
  createInitialState,
  queueDirection,
  stepGame
} from "../src/game.js";

test("queueDirection blocks instant reversal", () => {
  const state = createInitialState();
  const next = queueDirection(state, "left");

  assert.equal(next.nextDirection, "right");
});

test("stepGame moves snake in queued direction", () => {
  const state = {
    ...createInitialState(),
    nextDirection: "down"
  };

  const next = stepGame(state);

  assert.deepEqual(next.snake[0], { x: 2, y: 8 });
  assert.equal(next.direction, "down");
});

test("stepGame grows snake and increases score when eating", () => {
  const state = {
    ...createInitialState(() => 0),
    food: { x: 3, y: 7 }
  };

  const next = stepGame(state, () => 0);

  assert.equal(next.score, 1);
  assert.equal(next.snake.length, state.snake.length + 1);
  assert.notDeepEqual(next.food, { x: 3, y: 7 });
});

test("stepGame ends the game on wall collision", () => {
  const state = {
    ...createInitialState(),
    snake: [{ x: 13, y: 7 }, { x: 12, y: 7 }, { x: 11, y: 7 }]
  };

  const next = stepGame(state);

  assert.equal(next.status, "game-over");
});

test("stepGame ends the game on self collision", () => {
  const state = {
    ...createInitialState(),
    direction: "right",
    nextDirection: "right",
    snake: [
      { x: 4, y: 4 },
      { x: 4, y: 5 },
      { x: 5, y: 5 },
      { x: 5, y: 4 },
      { x: 5, y: 3 },
      { x: 4, y: 3 }
    ]
  };

  const next = stepGame(state);

  assert.equal(next.status, "game-over");
});

test("createFood never places food on the snake", () => {
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 }
  ];

  const food = createFood(snake, 4, () => 0);

  assert.deepEqual(food, { x: 3, y: 0 });
});
