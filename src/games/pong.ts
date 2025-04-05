// src/games/pong.ts
import type { Game, GameState } from './types';

// Game dimensions
const WIDTH = 40;
const HEIGHT = 20;
// Commenting out unused constant
// const PADDLE_WIDTH = 1;
const PADDLE_HEIGHT = 5;
const PADDLE_X_PLAYER = 3;
const PADDLE_X_CPU = WIDTH - 1 - 3;
const MAX_SCORE = 3; // Score to win (Best of 3 implies reaching 3 points)
const PADDLE_SPEED = 2.0;

// Define Pong-specific game state
interface PongState extends GameState {
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  paddleX: number;
  score: number;
  gameOver: boolean;
  cpuScore: number;
  playerScore: number;
  cpuY: number;
  playerY: number;
  message?: string;
}

const BALL_SYMBOL = 'O'; // Use simple O
const PADDLE_SYMBOL = '|'; // Use simple |

// --- Helper Functions ---
// Add the clamp function definition
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export const PongGame: Game = {
  id: 'pong',
  name: 'OG Solas Pong',
  description: 'Adapted Pong with CPU opponent. Use W/S keys.',
  
  init: (): PongState => {
    return {
      ballX: Math.floor(WIDTH / 2),
      ballY: 3, // give more vertical space
      ballVelocityX: Math.random() > 0.5 ? 1 : -1,
      ballVelocityY: 1,
      paddleX: Math.floor(WIDTH / 2),
      score: 0,
      gameOver: false,
      cpuScore: 0,
      playerScore: 0,
      cpuY: Math.floor(HEIGHT / 2),
      playerY: Math.floor(HEIGHT / 2),
    };
  },
  
  update: (state: GameState, key?: string | null): PongState => {
    const pongState = { ...state as PongState };
    console.log(`[Pong] Update Start. Key: "${key}". State:`, JSON.stringify(pongState)); // Log start state and key

    if (pongState.gameOver) {
        console.log("[Pong] Update skipped: Game already over.");
        return pongState;
    }

    // Use W/S keys for Player Paddle
    if (key === 'w' || key === 'W') {
      const oldPaddleY = pongState.playerY;
      pongState.playerY = clamp(pongState.playerY - 1, Math.floor(PADDLE_HEIGHT / 2), HEIGHT - 1 - Math.floor(PADDLE_HEIGHT / 2));
      console.log(`[Pong] Player paddle move UP attempt. New Y: ${pongState.playerY}. Moved: ${oldPaddleY !== pongState.playerY}`);
    } else if (key === 's' || key === 'S') {
      const oldPaddleY = pongState.playerY;
      pongState.playerY = clamp(pongState.playerY + 1, Math.floor(PADDLE_HEIGHT / 2), HEIGHT - 1 - Math.floor(PADDLE_HEIGHT / 2));
      console.log(`[Pong] Player paddle move DOWN attempt. New Y: ${pongState.playerY}. Moved: ${oldPaddleY !== pongState.playerY}`);
    } else if (key === '__tick__') {
      console.log(`[Pong] Processing tick.`);
      const oldBallX = pongState.ballX;
      const oldBallY = pongState.ballY;
      
      // Basic CPU Movement (adjust target based on ball direction)
      let targetCpuY = pongState.ballY;
      // Be more predictive if ball is moving towards CPU
      if (pongState.ballVelocityX > 0) {
          targetCpuY += pongState.ballVelocityY * 0.5; // Look slightly ahead
      }
      if (pongState.cpuY < targetCpuY && Math.random() > 0.3) { // Slightly less perfect tracking
        pongState.cpuY = clamp(pongState.cpuY + 1, Math.floor(PADDLE_HEIGHT / 2), HEIGHT - 1 - Math.floor(PADDLE_HEIGHT / 2));
      } else if (pongState.cpuY > targetCpuY && Math.random() > 0.3) {
        pongState.cpuY = clamp(pongState.cpuY - 1, Math.floor(PADDLE_HEIGHT / 2), HEIGHT - 1 - Math.floor(PADDLE_HEIGHT / 2));
      }
      
      pongState.ballX += pongState.ballVelocityX;
      pongState.ballY += pongState.ballVelocityY;
      console.log(`[Pong] Ball moved from (${oldBallX},${oldBallY}) to (${pongState.ballX},${pongState.ballY})`);

      // Wall bounce
      if (pongState.ballX <= 0 || pongState.ballX >= WIDTH - 1) {
        console.log(`[Pong] Wall bounce X! Old VelX: ${pongState.ballVelocityX}`);
        pongState.ballVelocityX *= -1;
        pongState.ballX = Math.max(1, Math.min(WIDTH - 2, pongState.ballX + pongState.ballVelocityX)); // Adjust slightly off wall
        console.log(`[Pong] New VelX: ${pongState.ballVelocityX}, New BallX: ${pongState.ballX}`);
      }

      if (pongState.ballY <= 0) {
        console.log(`[Pong] Wall bounce Y (top)! Old VelY: ${pongState.ballVelocityY}`);
        pongState.ballVelocityY *= -1;
        pongState.ballY = Math.max(1, pongState.ballY + pongState.ballVelocityY); // Adjust slightly off wall
        console.log(`[Pong] New VelY: ${pongState.ballVelocityY}, New BallY: ${pongState.ballY}`);
      }

      // Paddle collision checks (use corrected PADDLE_X constants)
      const PADDLE_HALF = Math.floor(PADDLE_HEIGHT / 2);

      // Ball Collision: Player Paddle (Left)
      if (pongState.ballX <= PADDLE_X_PLAYER + 1 && pongState.ballVelocityX < 0) {
          if (pongState.ballY >= pongState.playerY - PADDLE_HALF && pongState.ballY <= pongState.playerY + PADDLE_HALF) {
              console.log(`[Pong] Player Paddle HIT! BallX: ${pongState.ballX}`);
              pongState.ballVelocityX *= -1.05; 
              const hitDelta = pongState.ballY - pongState.playerY;
              pongState.ballVelocityY += hitDelta * 0.2; // Make angle change more pronounced
              pongState.ballVelocityY = clamp(pongState.ballVelocityY, -1.5, 1.5); // Allow slightly faster vertical
              pongState.ballX = PADDLE_X_PLAYER + 1; 
          }
      }

      // Ball Collision: CPU Paddle (Right)
      if (pongState.ballX >= PADDLE_X_CPU - 1 && pongState.ballVelocityX > 0) {
          if (pongState.ballY >= pongState.cpuY - PADDLE_HALF && pongState.ballY <= pongState.cpuY + PADDLE_HALF) {
              console.log(`[Pong] CPU Paddle HIT! BallX: ${pongState.ballX}`);
              pongState.ballVelocityX *= -1.05; 
              const hitDelta = pongState.ballY - pongState.cpuY;
              pongState.ballVelocityY += hitDelta * 0.2;
              pongState.ballVelocityY = clamp(pongState.ballVelocityY, -1.5, 1.5);
              pongState.ballX = PADDLE_X_CPU - 1; 
          }
      }

      // Ball Out of Bounds (Score)
      if (pongState.ballX < 0) {
        pongState.cpuScore++;
        // Update message based on score
        pongState.message = pongState.cpuScore >= MAX_SCORE ? "CPU Wins!" : "CPU Scored!";
        console.log("[Pong] CPU Scored! Resetting...");
        // Only reset ball/paddles if game not over
        if (pongState.cpuScore < MAX_SCORE) {
           Object.assign(pongState, PongGame.init(), { 
              cpuScore: pongState.cpuScore, 
              playerScore: pongState.playerScore, 
              message: pongState.message 
           }); 
        } else {
           pongState.gameOver = true; // Set game over explicitly on win
        }
      } else if (pongState.ballX >= WIDTH) {
        pongState.playerScore++;
        // Update message based on score
        pongState.message = pongState.playerScore >= MAX_SCORE ? "Player Wins!" : "Player Scored!";
        console.log("[Pong] Player Scored! Resetting...");
        // Only reset ball/paddles if game not over
        if (pongState.playerScore < MAX_SCORE) {
           Object.assign(pongState, PongGame.init(), { 
              cpuScore: pongState.cpuScore, 
              playerScore: pongState.playerScore, 
              message: pongState.message 
           });
        } else {
           pongState.gameOver = true; // Set game over explicitly on win
        }
      }
    }
    
    console.log(`[Pong] Update End. State:`, JSON.stringify(pongState)); // Log end state
    return pongState;
  },
  
  render: (state: GameState): string[] => {
    const s = state as PongState;
    const out: string[] = [];
    const PADDLE_HALF = Math.floor(PADDLE_HEIGHT / 2);

    // Top Border
    out.push("+" + "-".repeat(WIDTH + 2) + "+"); // Simple border

    // Score Header - simplified padding
    const scoreText = ` CPU: ${s.cpuScore} | YOU: ${s.playerScore} `;
    const headerPadding = " ".repeat(WIDTH - scoreText.length);
    out.push("| " + scoreText + headerPadding + " |"); // Simple border
    out.push("|" + "-".repeat(WIDTH + 2) + "|"); // Simple border

    // Play Area
    for (let y = 0; y < HEIGHT; y++) {
      let row = "| "; // Simple border
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
      row += " |"; // Simple border
      out.push(row);
    }

    // Bottom Separator
    out.push("|" + "-".repeat(WIDTH + 2) + "|"); // Simple border

    // Footer (Placeholders) - simplified padding
    const footerText = ` XP: --- | Rank: --- `;
    const footerPadding = " ".repeat(WIDTH - footerText.length);
    out.push("| " + footerText + footerPadding + " |"); // Simple border

    // Bottom Border
    out.push("+" + "-".repeat(WIDTH + 2) + "+"); // Simple border

    // Add message if any (e.g., after scoring)
    if (s.message && !s.gameOver) {
        out.push(`> ${s.message}`); // Simplified message format
    }

    return out;
  },
  
  isOver: (state: GameState): boolean => {
    return (state as PongState).gameOver;
  },
  
  gameOverText: (state: GameState): string[] => {
    const pongState = state as PongState;
    return [
      "=======================================",
      `          GAME OVER: ${pongState.message}`,
      `       Final Score: CPU ${pongState.cpuScore} - YOU ${pongState.playerScore}`,
      "=======================================",
      "        [ Hit ENTER to continue ]        "
    ];
  }
}; 