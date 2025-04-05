# OG Solas OS - Game System Design (Pong Example)

This document outlines the design and implementation of the modular ASCII game system within the OG Solas OS terminal environment.

## 1. Architecture Overview

The game system is designed to be modular and terminal-native. It allows classic ASCII-based games (like Pong, Snake, etc.) to be plugged into the OS and triggered via commands (e.g., `run game pong`).

The core principles are:

*   **Modularity**: Each game is a self-contained module implementing a standard interface.
*   **Terminal-Native**: Games render using arrays of strings, suitable for direct output in the terminal UI. No HTML canvas or direct DOM manipulation is used for game logic or rendering.
*   **Pure Functions**: Game logic (initialization, update/input processing, rendering) aims to be based on pure functions that operate on a state object, making them easier to test and reason about.
*   **Simulated Gameplay**: Initially, game execution is simulated step-by-step using a predefined input stream within the command handler. Real-time input loops may be added later.

## 2. Game Module Structure (`Game` Interface)

All games must adhere to the `Game` interface defined in `src/games/types.ts`:

```typescript
export type GameState = Record<string, any>;

export type Game = {
  id: string;          // Unique identifier (e.g., 'pong')
  name: string;        // Display name (e.g., 'ASCII Pong')
  description: string; // Brief description
  init: () => GameState; // Returns the initial state of the game
  render: (state: GameState) => string[]; // Returns array of strings for terminal output
  update: (state: GameState, key?: string | null) => GameState; // Processes input/tick, returns new state
  isOver: (state: GameState) => boolean; // Checks if the game has ended
  gameOverText: (state: GameState) => string[]; // Text to display on game over
};
```

*   `GameState`: A simple key-value object holding all necessary data for a game's current state (positions, score, map, etc.).
*   `render`: Must return an array of strings, where each string represents a line in the terminal output for that frame.
*   `update`: Takes the current state and an optional input key (`string`) or a null value (representing a time tick without specific input). It returns the *new* state after processing the input or game physics for that step.

## 3. Game Registry (`src/games/index.ts`)

A central registry maps game IDs to their corresponding `Game` implementations:

```typescript
import type { Game } from './types';
import { PongGame } from './pong';
// ... import other games

export const gameRegistry: Record<string, Game> = {
  pong: PongGame,
  // other games...
};

export function getGame(id: string): Game | undefined { ... }
```

This allows the game engine and command handler to easily look up and load the requested game.

## 4. Game Runner (`src/lib/gameEngine.ts`)

The `runGameLoop(gameId, inputStream)` function simulates a game session:

1.  **Lookup**: Retrieves the `Game` implementation using `getGame(gameId)`.
2.  **Initialize**: Calls `game.init()` to get the starting `GameState`.
3.  **Render Initial Frame**: Calls `game.render()` on the initial state.
4.  **Input Loop**: Iterates through the provided `inputStream` array.
    *   For each `input` (or `null` tick):
        *   Checks `game.isOver(state)`. If true, breaks the loop.
        *   Calls `state = game.update(state, input)` to get the next state.
        *   Calls `game.render(state)` to get the frame for this new state.
5.  **Collect Output**: Accumulates all rendered frames and input markers into a single array of strings.
6.  **Game Over Check**: After the loop, checks `game.isOver(state)` again.
7.  **Final Output**: Appends the `game.gameOverText(state)` or a simulation summary message.
8.  **Return**: Returns the complete array of output strings for the terminal.

## 5. Command Integration (`src/lib/commands.ts`)

The `run game [gameId]` command is handled by:

1.  Matching the command pattern (`/^run game (.+)$/`).
2.  Extracting the `gameId`.
3.  Creating a *simulated* `inputStream` array (e.g., `[null, 'd', 'a', null]`).
4.  Calling `runGameLoop(gameId, simulatedInputStream)`.
5.  Returning the resulting array of strings provided by `runGameLoop`.

## 6. Pong Implementation (`src/games/pong.ts`)

*   Defines a `PongState` extending `GameState`.
*   Implements `init` to set initial ball/paddle positions and score.
*   Implements `update` to:
    *   Move the paddle based on 'a' or 'd' keys.
    *   Update ball position based on its direction (`ballDX`, `ballDY`).
    *   Handle collisions with walls and the paddle.
    *   Increment score on paddle hit.
    *   Set `gameOver` flag on miss.
*   Implements `render` to draw the score, borders, ball (`O`), and paddle (`=`) as strings.
*   Implements `isOver` based on the `gameOver` flag.
*   Implements `gameOverText` to display the final score.

## 7. Initial Problem & Fix

*   **Problem**: The first version of `runGameLoop` only called `init()` and `render()` once, then immediately checked `isOver()`. For games like Pong where `isOver()` starts as `false`, the loop never ran, and the game appeared to end instantly or only show the first frame without progression.
*   **Fix**: The `runGameLoop` was updated to accept an `inputStream`. It now iterates through these inputs, calling `game.update()` for each step to modify the `GameState`, and `game.render()` *after* each update. This correctly simulates the step-by-step progression of the game based on the provided inputs. 