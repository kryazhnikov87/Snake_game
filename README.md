# Snake Game

Classic Snake built as a small dependency-free browser app.

## Quick start

```bash
cd /path/to/Snake_game
npm start
```

This starts a local static server for the game.

Open the game at `http://localhost:4173`.

## Auto-tests

```bash
cd /path/to/Snake_game
npm test
```

## Controls

- Arrow keys or `WASD` to move
- `Space` to pause or resume
- `R` or the Restart button to start over
- On-screen direction buttons are available for touch devices

## Manual verification

- Snake moves one cell per tick and does not allow instant reverse direction
- Eating food increases score and length by one
- Food never appears on the snake body
- Hitting a wall or the snake body ends the game
- Pause freezes movement and Resume continues from the same state
- Restart resets score, snake position, and food placement

  ## Promt for create game for Codex
  Build a classic Snake game in this repo.

Scope & constraints:
- Implement ONLY the classic Snake loop: grid movement, growing snake, food spawn, score, game-over, restart.
- Reuse existing project tooling/frameworks; do NOT add new dependencies unless truly required.
- Keep UI minimal and consistent with the repo’s existing styles (no new design systems, no extra animations).

Implementation plan:
1) Inspect the repo to find the right place to add a small interactive game (existing pages/routes/components).
2) Implement game state (snake positions, direction, food, score, tick timer) with deterministic, testable logic.
3) Render: simple grid + snake + food; support keyboard controls (arrow keys/WASD) and on-screen controls if mobile is present in the repo.
4) Add basic tests for the core game logic (movement, collisions, growth, food placement) if the repo has a test runner.

Deliverables:
- A small set of files/changes with clear names.
- Short run instructions (how to start dev server + where to navigate).
- A brief checklist of what to manually verify (controls, pause/restart, boundaries).
