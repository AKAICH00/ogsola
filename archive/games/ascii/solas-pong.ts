// src/games/solas-pong.ts
import type { Game, GameState } from './types';

const WIDTH = 20;
const HEIGHT = 12;
const PADDLE_WIDTH = 5;

interface PongState extends GameState {
  ballX: number;
  ballY: number;
  ballVelocityX: number;
  ballVelocityY: number;
  paddleX: number;
  score: number;
  gameOver: boolean;
}

// Ensure the export name matches the import alias in index.ts
export const PongGame: Game = {
  id: 'solas-pong', // Updated ID
  name: 'OG Solas Pong', // Updated Name
  description: 'Classic paddle and ball game. Use "a" and "d" to move paddle.',

  init: (): PongState => {
    return {
      ballX: Math.floor(WIDTH / 2),
      ballY: 3, // give more vertical space
      ballVelocityX: Math.random() > 0.5 ? 1 : -1,
      ballVelocityY: 1,
      paddleX: Math.floor(WIDTH / 2),
      score: 0,
      gameOver: false,
    };
  },

  update: (state: GameState, key?: string | null): PongState => {
    const pongState = { ...state as PongState };
    console.log(`[SolasPong] Update Start. Key: "${key}". State:`, JSON.stringify(pongState));

    if (pongState.gameOver) {
        console.log("[SolasPong] Update skipped: Game already over.");
        return pongState;
    }

    let paddleMoved = false;
    if (key === 'a' || key === 'A') {
      const oldPaddleX = pongState.paddleX;
      pongState.paddleX = Math.max(Math.floor(PADDLE_WIDTH / 2), pongState.paddleX - 2);
      paddleMoved = oldPaddleX !== pongState.paddleX;
      console.log(`[SolasPong] Paddle move left attempt. New X: ${pongState.paddleX}. Moved: ${paddleMoved}`);
    } else if (key === 'd' || key === 'D') {
      const oldPaddleX = pongState.paddleX;
      pongState.paddleX = Math.min(WIDTH - Math.floor(PADDLE_WIDTH / 2) - 1, pongState.paddleX + 2);
      paddleMoved = oldPaddleX !== pongState.paddleX;
      console.log(`[SolasPong] Paddle move right attempt. New X: ${pongState.paddleX}. Moved: ${paddleMoved}`);
    } else if (key === '__tick__') {
      console.log(`[SolasPong] Processing tick.`);
      const oldBallX = pongState.ballX;
      const oldBallY = pongState.ballY;
      
      pongState.ballX += pongState.ballVelocityX;
      pongState.ballY += pongState.ballVelocityY;
      console.log(`[SolasPong] Ball moved from (${oldBallX},${oldBallY}) to (${pongState.ballX},${pongState.ballY})`);

      // Wall bounce
      if (pongState.ballX <= 0 || pongState.ballX >= WIDTH - 1) {
        console.log(`[SolasPong] Wall bounce X! Old VelX: ${pongState.ballVelocityX}`);
        pongState.ballVelocityX *= -1;
        pongState.ballX = Math.max(1, Math.min(WIDTH - 2, pongState.ballX + pongState.ballVelocityX)); // Adjust slightly off wall
        console.log(`[SolasPong] New VelX: ${pongState.ballVelocityX}, New BallX: ${pongState.ballX}`);
      }

      if (pongState.ballY <= 0) {
        console.log(`[SolasPong] Wall bounce Y (top)! Old VelY: ${pongState.ballVelocityY}`);
        pongState.ballVelocityY *= -1;
        pongState.ballY = Math.max(1, pongState.ballY + pongState.ballVelocityY); // Adjust slightly off wall
        console.log(`[SolasPong] New VelY: ${pongState.ballVelocityY}, New BallY: ${pongState.ballY}`);
      }

      // Paddle collision
      if (pongState.ballY >= HEIGHT - 2) {
        const paddleLeft = pongState.paddleX - Math.floor(PADDLE_WIDTH / 2);
        const paddleRight = pongState.paddleX + Math.floor(PADDLE_WIDTH / 2);
        console.log(`[SolasPong] Ball at paddle level (Y=${pongState.ballY}). BallX: ${pongState.ballX}, Paddle: [${paddleLeft}-${paddleRight}]`);
        
        if (pongState.ballY + pongState.ballVelocityY >= HEIGHT - 2 && 
            pongState.ballX >= paddleLeft && pongState.ballX <= paddleRight) {
          
          if (pongState.ballVelocityY > 0) {
            console.log(`[SolasPong] Paddle HIT! Old VelY: ${pongState.ballVelocityY}`);
            pongState.ballVelocityY *= -1;
            pongState.score += 10;
            pongState.ballY = HEIGHT - 3; 
            console.log(`[SolasPong] New VelY: ${pongState.ballVelocityY}, New BallY: ${pongState.ballY}, New Score: ${pongState.score}`);
          }
        } else if (pongState.ballY >= HEIGHT - 1) { 
            console.log(`[SolasPong] Ball missed paddle and hit bottom. GAME OVER.`);
            pongState.gameOver = true;
        }
      }
    }
    
    console.log(`[SolasPong] Update End. State:`, JSON.stringify(pongState)); // Log end state
    return pongState;
  },

  render: (state: GameState): string[] => {
    const s = state as PongState;
    const out: string[] = [];
    out.push(`Score: ${s.score}`);
    out.push('+' + '-'.repeat(WIDTH) + '+');

    for (let y = 0; y < HEIGHT; y++) {
      let row = '|';
      for (let x = 0; x < WIDTH; x++) {
        if (Math.round(s.ballY) === y && Math.round(s.ballX) === x) {
          row += 'O';
        } else if (
          y === HEIGHT - 2 &&
          x >= s.paddleX - Math.floor(PADDLE_WIDTH / 2) &&
          x <= s.paddleX + Math.floor(PADDLE_WIDTH / 2)
        ) {
          row += '=';
        } else {
          row += ' ';
        }
      }
      row += '|';
      out.push(row);
    }

    out.push('+' + '-'.repeat(WIDTH) + '+');
    if (s.gameOver) out.push('GAME OVER!');
    return out; 
  },

  isOver: (state: GameState): boolean => {
    return (state as PongState).gameOver;
  },

  gameOverText: (state: GameState): string[] => {
    const pongState = state as PongState;
    return [
      "======= GAME OVER =======",
      `Final Score: ${pongState.score}`,
      "=========================",
      "Type 'run game solas-pong' to play again!"
    ];
  } 
}; 