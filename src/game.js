export const GRID_SIZE = 14;
export const INITIAL_DIRECTION = "right";
export const INITIAL_SNAKE = [
  { x: 2, y: 7 },
  { x: 1, y: 7 },
  { x: 0, y: 7 }
];

export const DIRECTION_VECTORS = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 }
};

export const OPPOSITE_DIRECTIONS = {
  up: "down",
  down: "up",
  left: "right",
  right: "left"
};

function positionsMatch(a, b) {
  return a.x === b.x && a.y === b.y;
}

export function randomInt(max, random = Math.random) {
  return Math.floor(random() * max);
}

export function createFood(snake, gridSize = GRID_SIZE, random = Math.random) {
  const openCells = [];

  for (let y = 0; y < gridSize; y += 1) {
    for (let x = 0; x < gridSize; x += 1) {
      const occupied = snake.some((segment) => segment.x === x && segment.y === y);
      if (!occupied) {
        openCells.push({ x, y });
      }
    }
  }

  if (openCells.length === 0) {
    return null;
  }

  return openCells[randomInt(openCells.length, random)];
}

export function createInitialState(random = Math.random, gridSize = GRID_SIZE) {
  return {
    gridSize,
    snake: INITIAL_SNAKE.map((segment) => ({ ...segment })),
    direction: INITIAL_DIRECTION,
    nextDirection: INITIAL_DIRECTION,
    food: createFood(INITIAL_SNAKE, gridSize, random),
    score: 0,
    status: "running"
  };
}

export function queueDirection(state, direction) {
  if (!DIRECTION_VECTORS[direction]) {
    return state;
  }

  const blockedDirection = OPPOSITE_DIRECTIONS[state.direction];
  if (direction === blockedDirection && state.snake.length > 1) {
    return state;
  }

  return {
    ...state,
    nextDirection: direction
  };
}

export function togglePause(state) {
  if (state.status === "game-over") {
    return state;
  }

  return {
    ...state,
    status: state.status === "paused" ? "running" : "paused"
  };
}

export function getNextHead(head, direction) {
  const vector = DIRECTION_VECTORS[direction];
  return {
    x: head.x + vector.x,
    y: head.y + vector.y
  };
}

export function isOutOfBounds(position, gridSize = GRID_SIZE) {
  return (
    position.x < 0 ||
    position.y < 0 ||
    position.x >= gridSize ||
    position.y >= gridSize
  );
}

export function hasSelfCollision(snake) {
  const [head, ...body] = snake;
  return body.some((segment) => positionsMatch(segment, head));
}

export function stepGame(state, random = Math.random) {
  if (state.status !== "running") {
    return state;
  }

  const direction = state.nextDirection;
  const nextHead = getNextHead(state.snake[0], direction);

  if (isOutOfBounds(nextHead, state.gridSize)) {
    return {
      ...state,
      direction,
      nextDirection: direction,
      status: "game-over"
    };
  }

  const eating = state.food && positionsMatch(nextHead, state.food);
  const nextSnake = [nextHead, ...state.snake];

  if (!eating) {
    nextSnake.pop();
  }

  if (hasSelfCollision(nextSnake)) {
    return {
      ...state,
      direction,
      nextDirection: direction,
      snake: nextSnake,
      status: "game-over"
    };
  }

  const nextFood = eating ? createFood(nextSnake, state.gridSize, random) : state.food;

  return {
    ...state,
    direction,
    nextDirection: direction,
    snake: nextSnake,
    food: nextFood,
    score: eating ? state.score + 1 : state.score,
    status: nextFood ? "running" : "won"
  };
}
