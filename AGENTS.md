# Repository guidance

## Run and verify
- Open `index.html` directly in a browser; no install or build is required. The README's optional server command is `npx serve .`.
- Run `node --check game.js` for syntax validation only. There are no configured automated tests, lint, formatter, or typecheck commands.
- Verify gameplay in the browser: rotation/thrust, Space firing, edge wrapping, asteroid splitting/scoring, death/respawn invincibility, level progression, and Space restart after game over. Check the browser console for errors.

## Runtime constraints
- `index.html` loads `game.js` as a classic script after the canvas. It immediately calls `initGame()` and starts `requestAnimationFrame`; it requires the browser DOM, not Node. Preserve direct-file launch unless explicitly changing setup.
- Canvas dimensions in `index.html` and `W`/`H` in `game.js` must stay synchronized (currently 800 × 600); movement, spawns, and HUD placement use those constants.
- The loop passes seconds to `update(dt)`, capped at 0.05. Shared game state and entity update/draw methods all live in `game.js`.
- Held movement uses `keys`; shooting/restarting uses consuming `pressed('Space')` edge detection, not continuous fire while held.
- Asteroid size indexes are 1 = small, 2 = medium, 3 = large across `RADII`, `SPEEDS`, and `POINTS`. Splits are collected separately and appended after collision iteration.
- Positions wrap at screen edges, but collision distance is ordinary Euclidean distance, not toroidal; don't assume objects collide across opposite edges.

## Documentation caveat
- The README advertises power-ups and special asteroid types, but neither exists in the current code. Treat `game.js` as the source of truth. Existing HUD/overlay text is Spanish.
