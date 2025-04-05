import type { Game, GameState } from './types';

// --- Game Constants ---
const WIDTH = 40; // Play area width
const HEIGHT = 20; // Play area height
const PADDLE_HEIGHT = 5;
const PADDLE_X_PLAYER = 3; // X position of player paddle (left)
const PADDLE_X_CPU = WIDTH - 4; // X position of CPU paddle (right)
const BALL_SYMBOL = '🪙'; // Using a coin symbol for flair
const PADDLE_SYMBOL = '║';
const MAX_SCORE = 5; // Score to win

// --- Game State Interface ---
interface NodePongState extends GameState {
  ballX: number;
  ballY: number;
  ballVX: number; // Velocity X
  ballVY: number; // Velocity Y
  playerY: number; // Player paddle Y (center)
  cpuY: number;    // CPU paddle Y (center)
  playerScore: number;
  cpuScore: number;
  gameOver: boolean;
  message: string; // For win/loss message
}

// --- Helper Functions ---
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// --- Game Implementation ---
export const NodePongGame: Game = {
  id: 'node-pong',
  name: 'Node Pong',
  description: 'Adapted Pong with CPU opponent. Use W/S keys.',

  init: (): NodePongState => {
    return {
      ballX: Math.floor(WIDTH / 2),
      ballY: Math.floor(HEIGHT / 2),
      ballVX: Math.random() > 0.5 ? 1 : -1, // Start moving left or right
      ballVY: Math.random() > 0.5 ? 1 : -1, // Start moving up or down
      playerY: Math.floor(HEIGHT / 2),
      cpuY: Math.floor(HEIGHT / 2),
      playerScore: 0,
      cpuScore: 0,
      gameOver: false,
      message: '',
    };
  },

  update: (state: GameState, key?: string | null): NodePongState => {
    const pongState = { ...state as NodePongState };
    if (pongState.gameOver) return pongState;

    const PADDLE_HALF = Math.floor(PADDLE_HEIGHT / 2);

    // 1. Handle Player Input
    if (key === 'w' || key === 'W') {
      pongState.playerY = clamp(pongState.playerY - 1, PADDLE_HALF, HEIGHT - 1 - PADDLE_HALF);
    } else if (key === 's' || key === 'S') {
      pongState.playerY = clamp(pongState.playerY + 1, PADDLE_HALF, HEIGHT - 1 - PADDLE_HALF);
    }

    // 2. Handle Tick (Ball Movement, CPU, Collisions)
    if (key === '__tick__') {
      // Basic CPU Movement (tries to follow the ball, slightly imperfect)
      const targetCpuY = pongState.ballY;
      if (pongState.cpuY < targetCpuY && Math.random() > 0.2) { // Add slight delay/randomness
        pongState.cpuY = clamp(pongState.cpuY + 1, PADDLE_HALF, HEIGHT - 1 - PADDLE_HALF);
      } else if (pongState.cpuY > targetCpuY && Math.random() > 0.2) {
        pongState.cpuY = clamp(pongState.cpuY - 1, PADDLE_HALF, HEIGHT - 1 - PADDLE_HALF);
      }

      // Update Ball Position
      pongState.ballX += pongState.ballVX;
      pongState.ballY += pongState.ballVY;

      // Ball Collision: Top/Bottom Walls
      if (pongState.ballY <= 0 || pongState.ballY >= HEIGHT - 1) {
        pongState.ballVY *= -1;
        pongState.ballY = clamp(pongState.ballY, 0, HEIGHT - 1);
      }

      // Ball Collision: Player Paddle (Left)
      if (pongState.ballX <= PADDLE_X_PLAYER + 1 && pongState.ballVX < 0) {
        if (pongState.ballY >= pongState.playerY - PADDLE_HALF && pongState.ballY <= pongState.playerY + PADDLE_HALF) {
          pongState.ballVX *= -1.05; // Reverse X and increase speed slightly
          // Add slight vertical angle based on hit position
          const hitDelta = pongState.ballY - pongState.playerY;
          pongState.ballVY += hitDelta * 0.1;
          pongState.ballVY = clamp(pongState.ballVY, -1, 1); // Limit vertical speed change
          pongState.ballX = PADDLE_X_PLAYER + 1; // Prevent sticking
        }
      }

      // Ball Collision: CPU Paddle (Right)
      if (pongState.ballX >= PADDLE_X_CPU - 1 && pongState.ballVX > 0) {
        if (pongState.ballY >= pongState.cpuY - PADDLE_HALF && pongState.ballY <= pongState.cpuY + PADDLE_HALF) {
          pongState.ballVX *= -1.05; // Reverse X and increase speed slightly
          const hitDelta = pongState.ballY - pongState.cpuY;
          pongState.ballVY += hitDelta * 0.1;
          pongState.ballVY = clamp(pongState.ballVY, -1, 1);
          pongState.ballX = PADDLE_X_CPU - 1; // Prevent sticking
        }
      }

      // Ball Out of Bounds (Score)
      if (pongState.ballX < 0) {
        pongState.cpuScore++;
        pongState.message = "CPU Scored!";
        Object.assign(pongState, NodePongGame.init(), { cpuScore: pongState.cpuScore, playerScore: pongState.playerScore, message: pongState.message }); // Reset ball/paddles
      } else if (pongState.ballX >= WIDTH) {
        pongState.playerScore++;
        pongState.message = "Player Scored!";
        Object.assign(pongState, NodePongGame.init(), { cpuScore: pongState.cpuScore, playerScore: pongState.playerScore, message: pongState.message }); // Reset ball/paddles
      }

      // Check for Win Condition
      if (pongState.playerScore >= MAX_SCORE) {
        pongState.gameOver = true;
        pongState.message = "PLAYER WINS!";
      } else if (pongState.cpuScore >= MAX_SCORE) {
        pongState.gameOver = true;
        pongState.message = "CPU WINS!";
      }
    }

    return pongState;
  },

  render: (state: GameState): string[] => {
    const s = state as NodePongState;
    const out: string[] = [];
    const PADDLE_HALF = Math.floor(PADDLE_HEIGHT / 2);

    // Top Border
    out.push("╔" + "═".repeat(WIDTH + 2) + "╗");

    // Score Header
    const scoreLine = `🧠 CPU: ${s.cpuScore}                            YOU: ${s.playerScore} 🕹️`;
    out.push("║ " + scoreLine.padEnd(WIDTH) + " ║");
    out.push("║" + "─".repeat(WIDTH + 2) + "║");

    // Play Area
    for (let y = 0; y < HEIGHT; y++) {
      let row = "║ ";
      for (let x = 0; x < WIDTH; x++) {
        // Player Paddle
        if (x === PADDLE_X_PLAYER && y >= s.playerY - PADDLE_HALF && y <= s.playerY + PADDLE_HALF) {
          row += PADDLE_SYMBOL;
        // CPU Paddle
        } else if (x === PADDLE_X_CPU && y >= s.cpuY - PADDLE_HALF && y <= s.cpuY + PADDLE_HALF) {
          row += PADDLE_SYMBOL;
        // Ball
        } else if (Math.round(s.ballY) === y && Math.round(s.ballX) === x) {
          row += BALL_SYMBOL;
        // Empty Space
        } else {
          row += ' ';
        }
      }
      row += " ║";
      out.push(row);
    }

    // Bottom Separator
    out.push("║" + "─".repeat(WIDTH + 2) + "║");

    // Footer (Placeholders)
    const footerLine = `⬢ XP: ---        ⬢ SIGMA Rank: ---`;
    out.push("║ " + footerLine.padEnd(WIDTH) + " ║");

    // Bottom Border
    out.push("╚" + "═".repeat(WIDTH + 2) + "╝");

    // Add message if any (e.g., after scoring)
    if (s.message && !s.gameOver) {
        out.push(`
> ${s.message}
`);
    }

    return out;
  },

  isOver: (state: GameState): boolean => {
    return (state as NodePongState).gameOver;
  },

  gameOverText: (state: GameState): string[] => {
    const s = state as NodePongState;
    return [
      "=======================================",
      `          GAME OVER: ${s.message}`,
      `       Final Score: CPU ${s.cpuScore} - YOU ${s.playerScore}`,
      "=======================================",
      "     Type 'run game node-pong' to play again!     "
    ];
  }
}; 