'use client';

import Head from 'next/head';
import { useEffect, useRef, useState, useCallback } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { findTheme } from '@/lib/themes';
import { handleCommand as processCommand } from '@/lib/commands';
import { getGame } from '@/games';
import type { Game, GameState } from '@/games/types';

type GameMode = 'command' | 'game-prestart' | 'game-countdown' | 'game-playing' | 'game-over';

export default function Home() {
  const [log, setLog] = useState<string[]>(["OG Solas OS v0.11"]);
  const [input, setInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  const [gameMode, setGameMode] = useState<GameMode>('command');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentGameState, setCurrentGameState] = useState<GameState | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const gameLoopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeGameRef = useRef<Game | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (gameMode === 'command') {
        terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
    }
  }, [log, gameMode]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [gameMode]);

  const runTerminalCommand = async () => {
    const command = input.trim();
    if (command === '' || isProcessing || gameMode !== 'command') return;

    setInput('');
    setLog((prevLog) => [...prevLog, `> ${command}`]);
    
    const commandLower = command.toLowerCase();

    const gameMatch = commandLower.match(/^run game (.+)$/);
    if (gameMatch) {
        const gameId = gameMatch[1];
        const game = getGame(gameId);
        if (game) {
            activeGameRef.current = game;
            setCurrentGameId(gameId);
            setGameMode('game-prestart');
            setCurrentGameState(null);
            setLog(prevLog => [...prevLog, `Starting ${game.name}...`]);
        } else {
            setLog(prevLog => [...prevLog, `Error: Game "${gameId}" not found.`]);
        }
        return;
    }

    setIsProcessing(true);

    if (commandLower === 'clear') {
      setLog([]);
      setIsProcessing(false);
      return;
    }

    const setThemeMatch = commandLower.match(/^set theme (.+)$/);
    if (setThemeMatch) {
      const themeName = setThemeMatch[1];
      const requestedTheme = findTheme(themeName);
      let response: string;
      if (requestedTheme) {
        setTheme(themeName);
        response = `Theme set to ${requestedTheme.displayName}`;
      } else {
        response = `Theme "${themeName}" not found. Try 'theme list'.`;
      }
      setLog((prevLog) => [...prevLog, response]);
      setIsProcessing(false);
      return;
    }

    const askMatch = commandLower.match(/^ask\s+(.+)/i);
    if (askMatch) {
        setLog((prevLog) => [...prevLog, "🤔 SIGMA is thinking..."]);
    }

    try {
      const resultLines = await processCommand(command);

      if (askMatch) {
          setLog((prevLog) => [
              ...prevLog.filter(line => line !== "🤔 SIGMA is thinking..."),
              ...resultLines
          ]);
      } else {
          setLog((prevLog) => [...prevLog, ...resultLines]);
      }

    } catch (error) {
        console.error("Error processing command:", error);
        setLog((prevLog) => [...prevLog, `❌ Error: Failed to execute command.`]);
    }

    setIsProcessing(false);
  };

  const startGameLoop = useCallback(() => {
    if (gameLoopIntervalRef.current) clearInterval(gameLoopIntervalRef.current);

    const game = activeGameRef.current;
    if (!game || gameMode !== 'game-playing') return;

    console.log("[UI] Starting game loop interval");
    gameLoopIntervalRef.current = setInterval(() => {
      setCurrentGameState((prevState) => {
        if (!prevState || !game) return prevState;
        
        const newState = game.update(prevState, '__tick__');
        
        if (game.isOver(newState)) {
          console.log("[UI] Game Over detected in loop");
          if (gameLoopIntervalRef.current) clearInterval(gameLoopIntervalRef.current);
          setGameMode('game-over');
          if ((newState as any).playerScore >= 3) {
             console.log("[UI] Player Won! Triggering XP add...");
             fetch('/api/xp/add', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ 
                 address: 'PLAYER_ADDRESS_PLACEHOLDER', 
                 amount: 50,
                 source: `pong_win` 
               })
             })
             .then(res => res.json())
             .then(data => console.log("[UI] XP Add Result:", data))
             .catch(err => console.error("[UI] XP Add Error:", err));
          }
        }
        return newState;
      });
    }, 120);
  }, [gameMode]);

  const startCountdown = useCallback(() => {
      setGameMode('game-countdown');
      setCountdown(3);
      let count = 3;
      const countdownInterval = setInterval(() => {
          count--;
          setCountdown(count);
          if (count <= 0) {
              clearInterval(countdownInterval);
              setCountdown(null);
              const game = activeGameRef.current;
              if (game) {
                 console.log("[UI] Countdown finished. Initializing game state.");
                 const initialState = game.init();
                 setCurrentGameState(initialState);
                 console.log("[DEBUG] Initialized currentGameState:", initialState);
                 setGameMode('game-playing');
              }
          }
      }, 1000);
  }, []);

  useEffect(() => {
    if (gameMode === 'game-playing') {
      console.log("[DEBUG] game-playing state entered");
      console.log("[DEBUG] currentGameState before starting loop:", currentGameState);
      if (currentGameState) { 
          startGameLoop();
      } else {
          console.error("[ERROR] Tried to start game loop but currentGameState is null!");
          setGameMode('command'); 
      }
    } else {
      if (gameLoopIntervalRef.current) {
        console.log("[UI] Clearing game loop interval.");
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
    }
    return () => {
      if (gameLoopIntervalRef.current) {
        console.log("[UI] Clearing game loop interval on unmount/mode change.");
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
    };
  }, [gameMode, startGameLoop, currentGameState]);

  // --- Helper to reset game state cleanly ---
  const exitGameMode = useCallback(() => {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
      setGameMode('command');
      setCurrentGameId(null);
      setCurrentGameState(null);
      setCountdown(null);
      activeGameRef.current = null;
      // Ensure focus goes back to input
      inputRef.current?.focus();
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase(); // Use lowercase for easier comparison

    // --- Quit logic (available in most game modes) ---
    if ((gameMode === 'game-prestart' || gameMode === 'game-countdown' || gameMode === 'game-playing') && key === 'q') {
      e.preventDefault();
      console.log("[UI] 'q' pressed. Quitting game mode.");
      setLog(prevLog => [...prevLog, "> Game aborted."]);
      exitGameMode();
      return; // Stop further processing
    }
    // --- End Quit logic ---

    if (gameMode === 'game-prestart' && key === ' ') {
      e.preventDefault(); 
      console.log("[UI] Spacebar pressed in prestart. Starting countdown.");
      startCountdown();
    } else if (gameMode === 'game-playing') {
      e.preventDefault(); 
      const game = activeGameRef.current;
      // Use lowercase key comparison
      if ((key === 'w' || key === 's') && game) {
         console.log(`[UI] Game key pressed: ${key}`);
         // Ensure prevState is not null before updating
         setCurrentGameState((prevState) => prevState ? game.update(prevState, key) : null);
      }
      // Ignore other keys during play
    } else if (gameMode === 'game-over' && key === 'enter') { // Use lowercase enter
      e.preventDefault();
      console.log("[UI] Enter pressed in game over. Exiting game mode.");
      setLog(prevLog => [...prevLog, "> Exited game results."]);
      exitGameMode();
    } else if (gameMode === 'command' && key === 'enter') { // Use lowercase enter
      runTerminalCommand();
    } else if (gameMode !== 'command' && key !== 'shift' && key !== 'control' && key !== 'alt' && key !== 'meta') {
       // Prevent default for most keys in non-command modes, but allow modifiers
       e.preventDefault(); 
    }
  };

  return (
    <>
      <Head>
        <title>OG Solas Terminal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={`${theme.bg} ${theme.text} font-mono w-screen h-screen p-4 overflow-hidden flex flex-col`}>
        
        {/* Game Output Area (Visible only in game modes) */}
        {gameMode !== 'command' && (
          <div className="flex-1 overflow-hidden whitespace-pre text-sm sm:text-base mb-2 border border-dashed border-gray-600 p-2">
            {gameMode === 'game-prestart' && (
              <div>
                 <p>Starting {activeGameRef.current?.name}...</p>
                 <p className="mt-2 text-yellow-400 animate-pulse">[ HIT SPACE BAR TO START ]</p>
              </div>
            )}
            {gameMode === 'game-countdown' && countdown !== null && (
               <div className="text-center text-4xl font-bold">
                  {countdown > 0 ? countdown : "GO!"}
               </div>
            )}
            {(gameMode === 'game-playing' || gameMode === 'game-over') && currentGameState && activeGameRef.current && (
               <div>
                  {activeGameRef.current.render(currentGameState).map((line, idx) => (
                     <div key={idx}>{line}</div>
                  ))}
               </div>
            )}
            {gameMode === 'game-over' && currentGameState && activeGameRef.current && (
               <div className="mt-2 text-yellow-400">
                  {activeGameRef.current.gameOverText(currentGameState).map((line, idx) => (
                     <div key={idx}>{line}</div>
                  ))}
                   <p className="mt-1">[ HIT ENTER TO EXIT ]</p>
               </div>
            )}
          </div>
        )}

        {/* Command Log Area (Visible only in command mode) */}
        {gameMode === 'command' && (
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm sm:text-base mb-2"
          >
            {log.map((line, idx) => (
              <div key={idx}>{line}</div>
            ))}
          </div>
        )}

        {/* Input Area (Always visible, but behavior changes) */}
        <div className="pt-2 flex items-center">
          <span className="mr-2">&gt;</span>
          <input
            type="text"
            ref={inputRef}
            className={`bg-transparent outline-none ${theme.text} w-full sm:w-auto ${theme.placeholder}`}
            value={input}
            onChange={(e) => {
              if (gameMode === 'command') setInput(e.target.value);
              else setInput('');
            }}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={
               gameMode === 'command' ? (isProcessing ? "Processing..." : "type a command...") :
               gameMode === 'game-prestart' ? "[ Space ]" :
               gameMode === 'game-countdown' ? "..." :
               gameMode === 'game-playing' ? "[ W / S ]" :
               gameMode === 'game-over' ? "[ Enter ]" : ""
            }
            disabled={isProcessing || gameMode === 'game-countdown'}
          />
        </div>
      </div>
    </>
  );
}