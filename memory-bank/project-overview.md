# Project Overview: OG Solas Terminal

## 1. Core Technology

*   **Framework**: Next.js (v15+) with App Router
*   **Language**: TypeScript
*   **UI**: React (v19+)
*   **Styling**: Tailwind CSS (v4+)
*   **Linting**: ESLint

## 2. Project Goal

To create a retro-styled interactive terminal interface, "OG Solas OS", that allows users to run commands, interact with an AI assistant (SIGMA), play games, and potentially manage missions/XP.

## 3. Key Directories & Files

*   **`src/app/page.tsx`**: The main entry point for the application. Contains the core React component that renders the terminal UI, manages state (commands, game state, theme, user handle, etc.), handles user input, and orchestrates different modes (command, game, learn, etc.).
*   **`src/components/`**: Reusable React components.
    *   `GameCanvas.tsx`: Placeholder component intended to render HTML5 canvas-based games, receiving theme information to constrain colors.
*   **`src/games/`**: Contains the game system logic.
    *   `types.ts`: Defines the core `Game` interface (requiring `id`, `name`, `description`, `type`, `init`, `render`, `update`, `isOver`, `gameOverText`) and `GameState` type.
    *   `index.ts`: Imports individual game modules and exports the `gameList` array (the central registry of available games) and the `getGame(identifier)` helper function.
    *   Individual game files (e.g., `pong.ts`, `abstract-pong.ts`, `solas-pong.ts`, placeholder sim games): Implement the `Game` interface for specific ASCII games.
*   **`src/lib/`**: Utility functions and core logic modules.
    *   `themes.ts`: Defines the `Theme` interface (including `name`, `displayName`, `bg`, `text`, `baseTextColorRGB`, `placeholder`) and exports the list of available `themes` and `findTheme` helper.
    *   `commands.ts`: Exports an async `handleCommand` function that processes user input strings. It interacts with `sigma.ts` for AI responses and `missions.ts` for mission logic. It handles built-in commands like `help`, `about`, `xp`, `status`, `missions`, etc. *Note: Game and theme commands (`run game`, `set theme`) are primarily initiated here but handled/rendered within `page.tsx`.*
    *   `gameEngine.ts`: Contains helper functions for managing game key state (`createEmptyKeyState`, `handleKeyDown`, `handleKeyUp`).
    *   `sigma.ts`: (Inferred) Handles interaction with an AI assistant (SIGMA), likely replacing previous `openai.ts`.
    *   `missions.ts`: (Inferred) Manages mission data and state (completion, XP).
*   **`src/hooks/`**: Custom React hooks.
    *   `useTheme.ts`: Manages the current theme state, loads/saves the theme from/to `localStorage`, and provides a function to change the theme.
*   **`public/`**: Static assets.
*   **`memory-bank/`**: Contains project documentation like this overview and session logs.
*   **Configuration Files**: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.js`, `.eslintrc.json`.

## 4. Core Features & Flow

1.  **Initialization**: `page.tsx` loads, initializes state, loads user handle and theme preference from `localStorage`.
2.  **Command Input**: User types commands into the input field managed by `page.tsx`.
3.  **Command Processing**: The entered command is passed to `handleCommand` in `lib/commands.ts`.
    *   SIGMA checks are performed first via `lib/sigma.ts`.
    *   If not handled by SIGMA, built-in commands (`help`, `missions`, etc.) are processed directly within `handleCommand`.
    *   Special commands like `set theme` or `run game` might return minimal responses, with the main logic handled back in `page.tsx` based on the command structure.
4.  **Theme Management**: `useTheme` hook manages theme state. `set theme` command in `page.tsx` calls the setter from the hook. `page.tsx` uses the theme state to apply dynamic text colors and potentially pass theme info to games.
5.  **Game System**: `page.tsx` handles `run game`:
    *   Uses `getGame` from `src/games/index.ts` to find the game object.
    *   Checks `game.type`:
        *   **`ascii`**: Changes `gameMode`, calls game's `init`, `render`, `update` methods. Manages an interval-based game loop (`startGameLoop`).
        *   **`canvas`**: (Planned) Should change `gameMode` and render the `GameCanvas` component, passing necessary props like `gameId`, `theme`, `onQuit`.
6.  **State**: React state (`useState`) in `page.tsx` holds most of the application's current status.

## 5. Current State (as of review)

*   Basic terminal UI is functional.
*   Command handling for built-in commands, missions, and SIGMA exists.
*   ASCII game system is implemented and functional.
*   Theme switching is implemented and working visually.
*   Foundation for canvas games is laid (updated `Game` type, `GameCanvas.tsx` placeholder created), but integration into `page.tsx` is pending.
*   Linter error exists in `GameCanvas.tsx` related to `theme.textColor` property access (pending resolution or alternative approach). 