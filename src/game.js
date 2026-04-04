export const GRID_SIZE = 14;
export const INITIAL_DIRECTION = "right";

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

function getInitialSnake(gridSize = GRID_SIZE) {
  const centerY = Math.floor(gridSize / 2);
  return [
    { x: 2, y: centerY },
    { x: 1, y: centerY },
    { x: 0, y: centerY }
  ];
}

export function randomInt(max, random = Math.random) {
  return Math.floor(random() * max);
}

function isBlockedCell(position, blockedCells = []) {
  return blockedCells.some((cell) => positionsMatch(cell, position));
}

function getReachableOpenCells(snake, gridSize, blockedCells = []) {
  const occupiedKeys = new Set(snake.map((segment) => `${segment.x},${segment.y}`));
  const blockedKeys = new Set(blockedCells.map((cell) => `${cell.x},${cell.y}`));
  const visited = new Set([`${snake[0].x},${snake[0].y}`]);
  const queue = [snake[0]];
  const reachable = [];

  while (queue.length > 0) {
    const current = queue.shift();

    for (const vector of Object.values(DIRECTION_VECTORS)) {
      const next = {
        x: current.x + vector.x,
        y: current.y + vector.y
      };
      const key = `${next.x},${next.y}`;

      if (visited.has(key) || isOutOfBounds(next, gridSize) || blockedKeys.has(key)) {
        continue;
      }

      visited.add(key);
      queue.push(next);

      if (!occupiedKeys.has(key)) {
        reachable.push(next);
      }
    }
  }

  return reachable;
}

function normalizeInitialStateOptions(randomOrOptions, legacyGridSize) {
  const defaults = {
    random: Math.random,
    gridSize: GRID_SIZE,
    initialDirection: INITIAL_DIRECTION,
    initialSnake: getInitialSnake(GRID_SIZE),
    walls: [],
    targetScore: null
  };

  if (typeof randomOrOptions === "function") {
    return {
      ...defaults,
      random: randomOrOptions,
      gridSize: legacyGridSize,
      initialSnake: getInitialSnake(legacyGridSize)
    };
  }

  return {
    ...defaults,
    ...randomOrOptions
  };
}

export function createFood(
  snake,
  gridSize = GRID_SIZE,
  random = Math.random,
  blockedCells = []
) {
  const openCells = getReachableOpenCells(snake, gridSize, blockedCells);

  if (openCells.length === 0) {
    return null;
  }

  return openCells[randomInt(openCells.length, random)];
}

export function createInitialState(randomOrOptions = Math.random, legacyGridSize = GRID_SIZE) {
  const options = normalizeInitialStateOptions(randomOrOptions, legacyGridSize);
  const initialSnake = (options.initialSnake ?? getInitialSnake(options.gridSize)).map((segment) => ({ ...segment }));
  const walls = (options.walls ?? []).map((wall) => ({ ...wall }));

  return {
    gridSize: options.gridSize,
    snake: initialSnake,
    direction: options.initialDirection,
    nextDirection: options.initialDirection,
    food: createFood(initialSnake, options.gridSize, options.random, walls),
    score: 0,
    status: "running",
    walls,
    targetScore: options.targetScore
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

export function hasWallCollision(position, walls = []) {
  return walls.some((wall) => positionsMatch(position, wall));
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

  if (hasWallCollision(nextHead, state.walls)) {
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

  const nextScore = eating ? state.score + 1 : state.score;
  const reachedTarget = state.targetScore !== null && nextScore >= state.targetScore;
  const nextFood = eating && !reachedTarget
    ? createFood(nextSnake, state.gridSize, random, state.walls)
    : state.food;

  return {
    ...state,
    direction,
    nextDirection: direction,
    snake: nextSnake,
    food: reachedTarget ? null : nextFood,
    score: nextScore,
    status: reachedTarget || !nextFood ? "won" : "running"
  };
}
