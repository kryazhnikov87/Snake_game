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

test("stepGame ends the game on obstacle collision", () => {
  const state = {
    ...createInitialState(),
    walls: [{ x: 3, y: 7 }],
    food: { x: 10, y: 10 }
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

  assert.equal(snake.some((segment) => segment.x === food.x && segment.y === food.y), false);
});

test("createFood never places food on walls", () => {
  const snake = [{ x: 0, y: 0 }];
  const walls = [{ x: 1, y: 0 }, { x: 2, y: 0 }];

  const food = createFood(snake, 4, () => 0, walls);

  assert.equal(walls.some((wall) => wall.x === food.x && wall.y === food.y), false);
});

test("createFood only uses cells reachable from the snake", () => {
  const snake = [{ x: 0, y: 0 }];
  const walls = [
    { x: 3, y: 4 },
    { x: 4, y: 3 }
  ];

  const food = createFood(snake, 5, () => 0.999, walls);

  assert.notDeepEqual(food, { x: 4, y: 4 });
});

test("createFood returns a visible reachable cell on a level 2 style board", () => {
  const gridSize = 28;
  const snake = [
    { x: 2, y: 14 },
    { x: 1, y: 14 },
    { x: 0, y: 14 }
  ];
  const walls = [];
  const width = Math.floor(gridSize * 0.57);
  const height = Math.floor(gridSize * 0.5);
  const thickness = Math.max(1, Math.floor(gridSize * 0.07));
  const startX = Math.floor((gridSize - width) / 2);
  const startY = Math.floor((gridSize - height) / 2);

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

  const food = createFood(snake, gridSize, () => 0.5, walls);

  assert.notEqual(food, null);
  assert.equal(walls.some((wall) => wall.x === food.x && wall.y === food.y), false);
  assert.equal(snake.some((segment) => segment.x === food.x && segment.y === food.y), false);
});

test("stepGame marks the level as won when target score is reached", () => {
  const state = {
    ...createInitialState({ targetScore: 1 }),
    food: { x: 3, y: 7 }
  };

  const next = stepGame(state, () => 0);

  assert.equal(next.score, 1);
  assert.equal(next.status, "won");
  assert.equal(next.food, null);
});
