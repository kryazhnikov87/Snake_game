# Snake Game

Classic Snake built as a small dependency-free browser app.

## Run

```bash
npm start
```

Then open `http://localhost:4173`.

## Test

```bash
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
