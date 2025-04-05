// src/games/abstract-pong.ts
import type { Game, GameState } from './types';

const WIDTH = 60;
const HEIGHT = 30;
const PADDLE_SIZE = 6;

export interface AbstractPongState extends GameState {
  ball: { x: number; y: number; dx: number; dy: number };
  leftPaddle: number;
  rightPaddle: number;
  leftScore: number;
  rightScore: number;
  xp: number;
  hashRate: number;
  nftRally: number;
  message: string;
  messageTimer: number;
  gameOver: boolean;
  gameMode: 'single' | 'multi';
  wins?: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

const renderBoard = (state: AbstractPongState): string[] => {
  const board = Array(HEIGHT).fill('').map(() => Array(WIDTH).fill(' '));

  // Draw Borders
  for (let x = 0; x < WIDTH; x++) {
    board[0][x] = '═';
    board[HEIGHT - 1][x] = '═';
  }
  for (let y = 0; y < HEIGHT; y++) {
    board[y][0] = '║';
    board[y][WIDTH - 1] = '║';
  }
  board[0][0] = '╔';
  board[0][WIDTH - 1] = '╗';
  board[HEIGHT - 1][0] = '╚';
  board[HEIGHT - 1][WIDTH - 1] = '╝';

  // Draw Paddles
  for (let i = 0; i < PADDLE_SIZE; i++) {
    const lY = Math.floor(state.leftPaddle) + i;
    const rY = Math.floor(state.rightPaddle) + i;
    if (lY >= 1 && lY < HEIGHT - 1) {
      board[lY][2] = '▲'; // Triangle on the left
      board[lY][3] = '█'; // Solid block
    }
    if (rY >= 1 && rY < HEIGHT - 1) {
      board[rY][WIDTH - 3] = '█'; // Solid block
      board[rY][WIDTH - 4] = '▼'; // Triangle on the right
    }
  }

  // Draw Ball
  const bY = Math.floor(state.ball.y);
  const bX = Math.floor(state.ball.x);
  if (bY >= 1 && bY < HEIGHT - 1 && bX >= 1 && bX < WIDTH - 1) {
    board[bY][bX] = '◉';
  }

  // Removed Center Line as per request

  // Header and Footer
  const headerText = `CHAIN SCORE: ${state.leftScore} - ${state.rightScore} | GAS: ${state.xp} GWEI | HASH: ${state.hashRate} TH/s`;
  const messageLine = state.messageTimer > 0 ? state.message.padEnd(WIDTH - 2) : " ".repeat(WIDTH - 2);
  const controls = state.gameMode === 'single' ? '< W / S >' : '< W / S >  < ↑ / ↓ >';
  const footerText = controls.padStart(Math.floor((WIDTH - controls.length) / 2) + controls.length).padEnd(WIDTH - 2);

  return [
    `╔${"═".repeat(WIDTH - 2)}╗`,
    `║ ${headerText.padEnd(WIDTH - 4)} ║`,
    `║ ${messageLine} ║`,
    `╚${"═".repeat(WIDTH - 2)}╝`,
    ...board.map(r => r.join('')),
    `╔${"═".repeat(WIDTH - 2)}╗`,
    `║ ${footerText} ║`,
    `╚${"═".repeat(WIDTH - 2)}╝`,
  ];
};

const updateState = (state: AbstractPongState, input: string | null): AbstractPongState => {
  if (state.gameOver) return state;

  const s = {
    ...state,
    ball: { ...state.ball },
    message: state.messageTimer > 0 ? state.message : '',
    messageTimer: Math.max(0, state.messageTimer - 1),
  };

  // Handle Player Input
  if (input === 'w') {
    s.leftPaddle = Math.max(1, s.leftPaddle - 1);
  }
  if (input === 's') {
    s.leftPaddle = Math.min(HEIGHT - 1 - PADDLE_SIZE, s.leftPaddle + 1);
  }
  if (s.gameMode === 'multi') {
    if (input === 'ArrowUp') {
      s.rightPaddle = Math.max(1, s.rightPaddle - 1);
    }
    if (input === 'ArrowDown') {
      s.rightPaddle = Math.min(HEIGHT - 1 - PADDLE_SIZE, s.rightPaddle + 1);
    }
  }

  // Automatic Updates (Tick)
  if (input === null || !['w', 's', 'ArrowUp', 'ArrowDown'].includes(input)) {
    // CPU Paddle Logic (Single-Player Only)
    if (s.gameMode === 'single') {
      const cpuPaddleCenter = s.rightPaddle + PADDLE_SIZE / 2;
      if (s.ball.y < cpuPaddleCenter - 0.5 && Math.random() > 0.1) {
        s.rightPaddle = Math.max(1, s.rightPaddle - 1);
      }
      if (s.ball.y > cpuPaddleCenter + 0.5 && Math.random() > 0.1) {
        s.rightPaddle = Math.min(HEIGHT - 1 - PADDLE_SIZE, s.rightPaddle + 1);
      }
    }

    // Ball Physics
    let { x, y, dx, dy } = s.ball;
    let nx = x + dx;
    let ny = y + dy;

    // Top/Bottom Wall Collision
    if (ny <= 1 || ny >= HEIGHT - 2) {
      dy = -dy;
      s.xp += 10;
      s.hashRate += 5;
      s.message = 'MINING HASHES...';
      s.messageTimer = 30;
      const ny = y + dy;
    }

    // Player Paddle Collision
    if (nx <= 4 && dx < 0) {
      if (ny >= s.leftPaddle && ny < s.leftPaddle + PADDLE_SIZE) {
        dx = -dx * 1.02;
        const hitPosRatio = (ny - (s.leftPaddle + PADDLE_SIZE / 2)) / (PADDLE_SIZE / 2);
        dy += hitPosRatio * 0.5;
        dy = clamp(dy, -1, 1);
        s.xp += 50;
        s.hashRate += 10;
        s.nftRally++;
        s.message = 'DECENTRALIZED DUNK!';
        s.messageTimer = 30;
        const nx = 5;
      }
    }

    // Right Paddle Collision
    if (nx >= WIDTH - 4 && dx > 0) {
      if (ny >= s.rightPaddle && ny < s.rightPaddle + PADDLE_SIZE) {
        dx = -dx * 1.02;
        const hitPosRatio = (ny - (s.rightPaddle + PADDLE_SIZE / 2)) / (PADDLE_SIZE / 2);
        dy += hitPosRatio * 0.5;
        dy = clamp(dy, -1, 1);
        s.xp += 50;
        s.hashRate += 10;
        s.nftRally++;
        s.message = 'DECENTRALIZED DUNK!';
        s.messageTimer = 30;
        const nx = WIDTH - 5;
      }
    }

    // NFT Rally Bonus
    if (s.nftRally >= 5) {
      s.xp += 100;
      s.message = 'NFT RALLY ACTIVATED!';
      s.messageTimer = 30;
      s.nftRally = 0;
    }

    // Scoring
    let scored = false;
    if (nx <= 1) {
      s.rightScore++;
      s.xp += 100;
      s.hashRate += 20;
      s.nftRally = 0;
      s.message = s.gameMode === 'single' ? 'BLOCK REWARD CLAIMED! (CPU)' : 'BLOCK REWARD CLAIMED! (NODE 2)';
      s.messageTimer = 30;
      scored = true;
      if (s.rightScore >= 3) {
        s.gameOver = true;
        s.message = s.gameMode === 'single' ? 'NODE 2 WINS! FORK REJECTED' : 'NODE 2 WINS! CONSENSUS REACHED';
      }
    } else if (nx >= WIDTH - 2) {
      s.leftScore++;
      s.xp += 100;
      s.hashRate += 20;
      s.nftRally = 0;
      s.message = 'BLOCK REWARD CLAIMED! (YOU)';
      s.messageTimer = 30;
      scored = true;
      const newWins = (s.wins || 0) + 1;
      s.wins = newWins;
      if (s.leftScore >= 3) {
        s.gameOver = true;
        s.message = 'NODE 1 WINS! CONSENSUS REACHED';
      }
    }

    if (scored && !s.gameOver) {
      const nx = WIDTH / 2;
      const ny = HEIGHT / 2;
      const dx = s.leftScore > s.rightScore ? -1 : 1;
      const dy = Math.random() > 0.5 ? 1 : -1;
    }

    s.ball = { x: nx, y: ny, dx, dy };
  }

  return s;
};

export const AbstractPong: Game = {
  id: 'abstract-pong',
  name: 'Abstract Chain: Decentralized Pong',
  description: 'Use W/S keys to control your node. First to 3 blocks wins.',
  init: (gameMode: 'single' | 'multi' = 'single'): AbstractPongState => ({
    ball: { x: WIDTH / 2, y: HEIGHT / 2, dx: Math.random() > 0.5 ? 1 : -1, dy: Math.random() > 0.5 ? 1 : -1 },
    leftPaddle: HEIGHT / 2 - PADDLE_SIZE / 2,
    rightPaddle: HEIGHT / 2 - PADDLE_SIZE / 2,
    leftScore: 0,
    rightScore: 0,
    xp: 0,
    hashRate: 0,
    nftRally: 0,
    message: '',
    messageTimer: 0,
    gameOver: false,
    gameMode,
    wins: 0,
  }),
  render: (state) => renderBoard(state as AbstractPongState),
  update: (state, input) => updateState(state as AbstractPongState, input ?? null),
  isOver: (state) => (state as AbstractPongState).gameOver,
  gameOverText: (state) => {
    const s = state as AbstractPongState;
    return [
      `╔${"═".repeat(WIDTH - 2)}╗`,
      `║ ${" ".repeat(WIDTH - 2)} ║`,
      `║ ${(s.leftScore >= 3 ? 'NODE 1 WINS! CONSENSUS REACHED' : 'NODE 2 WINS! FORK REJECTED').padStart(Math.floor((WIDTH - 2) / 2) + 15).padEnd(WIDTH - 4)} ║`,
      `║ ${`Final Score: YOU ${s.leftScore} - ${s.gameMode === 'single' ? 'CPU' : 'NODE 2'} ${s.rightScore}`.padStart(Math.floor((WIDTH - 2) / 2) + 10).padEnd(WIDTH - 4)} ║`,
      `║ ${`Total GWEI mined: ${s.xp}`.padStart(Math.floor((WIDTH - 2) / 2) + 8).padEnd(WIDTH - 4)} ║`,
      `║ ${`Peak Hashrate: ${s.hashRate} TH/s`.padStart(Math.floor((WIDTH - 2) / 2) + 8).padEnd(WIDTH - 4)} ║`,
      `║ ${" ".repeat(WIDTH - 2)} ║`,
      `║ ${'Press SPACEBAR to play again | Q to quit'.padStart(Math.floor((WIDTH - 2) / 2) + 15).padEnd(WIDTH - 4)} ║`,
      `║ ${" ".repeat(WIDTH - 2)} ║`,
      `╚${"═".repeat(WIDTH - 2)}╝`,
    ];
  },
};