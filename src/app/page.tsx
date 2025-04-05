// src/pages/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useTheme } from '@/hooks/useTheme';
import { findTheme } from '@/lib/themes';
import { handleCommand as processCommand } from '@/lib/commands';
import type { Game, GameState } from '@/games/types';
import { getGame } from '@/games';
// Comment out GameBuilder imports for now
// import { GameBuilderTemplate, userGames } from '@/games/GameBuilder'; 
import { createEmptyKeyState, handleKeyDown, handleKeyUp, KeyState } from '@/lib/gameEngine';

type GameMode = 'command' | 'game-prestart' | 'game-countdown' | 'game-playing' | 'game-over' | 'learn' | 'build' | 'gallery' | 'tips';

export default function Home() {
  const [theme, setTheme] = useTheme();
  const [commandLog, setCommandLog] = useState<string[]>(["OG Solas OS v0.11"]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [_currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('command');
  const [_gameModeSelected, setGameModeSelected] = useState<'single' | 'multi'>('single');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [keyState, setKeyState] = useState<KeyState>(createEmptyKeyState());
  const [_leaderboard, setLeaderboard] = useState<{ address: string; xp: number }[]>([]);
  const [_unlockedStories, _setUnlockedStories] = useState<number[]>([]);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [isWaitingForHandle, setIsWaitingForHandle] = useState(false);
  const terminalRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const gameLoopIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const activeGameRef = useRef<Game | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load user handle from localStorage on initial render
  useEffect(() => {
    // Only run in browser environment
    if (typeof window !== 'undefined') {
      const savedHandle = localStorage.getItem('userHandle');
      if (savedHandle) {
        setUserHandle(savedHandle);
        // Add personalized greeting if handle exists
        setCommandLog(prevLog => [
          ...prevLog,
          `Welcome back, ${savedHandle}! Type 'help' to see available commands.`
        ]);
      }
    }
  }, []);

  // Scroll to bottom of terminal in command mode
  useEffect(() => {
    if (gameMode === 'command') {
      terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
    }
  }, [commandLog, gameMode]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [gameMode]);

  // Game loop
  const startGameLoop = useCallback(() => {
    const game = activeGameRef.current;
    if (!game) return;
    
    console.log("[DEBUG] Starting game loop with game:", game.name);
    
    if (gameLoopIntervalRef.current) {
      clearInterval(gameLoopIntervalRef.current);
    }
    
    gameLoopIntervalRef.current = setInterval(() => {
      setGameState((prevState: GameState | null) => {
        if (!prevState || !game) return prevState;
        const newState = game.update(prevState, '__tick__');
        
        // Check for game over
        if (game.isOver(newState)) {
          console.log('[DEBUG] Game over detected in interval');
          if (gameLoopIntervalRef.current) clearInterval(gameLoopIntervalRef.current);
          setGameMode('game-over');
          // Ensure focus returns to input after game over
          setTimeout(() => inputRef.current?.focus(), 10);
          
          // Rest of game over logic
          if ('playerScore' in newState && typeof newState.playerScore === 'number' && newState.playerScore >= 3) {
            fetch('/api/xp/add', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ amount: 10 })
            }).then(() => {
              console.log('Added XP for winning game!');
            }).catch(error => {
              console.error('Failed to add XP:', error);
            });
          }
        }
        
        return newState;
      });
    }, 500); // Half-second updates for smooth gameplay
    
    return () => {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
      }
    };
  }, []);

  // Countdown before game start
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
          const initialState = game.init();
          setGameState(initialState);
          console.log("[DEBUG] Initialized currentGameState:", initialState);
          setGameMode('game-playing');
          // Ensure focus is maintained after countdown
          setTimeout(() => inputRef.current?.focus(), 10);
        }
      }
    }, 1000);
  }, []);

  // Start game loop when in game-playing mode
  useEffect(() => {
    if (gameMode === 'game-playing' && gameState) {
      startGameLoop();
    } else {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
    }
    return () => {
      if (gameLoopIntervalRef.current) {
        clearInterval(gameLoopIntervalRef.current);
        gameLoopIntervalRef.current = null;
      }
    };
  }, [gameMode, startGameLoop, gameState]);

  // Exit game mode
  const exitGameMode = useCallback(() => {
    if (gameLoopIntervalRef.current) {
      clearInterval(gameLoopIntervalRef.current);
      gameLoopIntervalRef.current = null;
    }
    setGameMode('command');
    setCurrentGameId(null);
    setGameState(null);
    setCountdown(null);
    activeGameRef.current = null;
    setGameModeSelected('single');
    inputRef.current?.focus();
  }, []);

  // Handle terminal commands
  const runTerminalCommand = async () => {
    const command = currentCommand.trim();
    if (command === '' || isProcessing || gameMode !== 'command') return;

    setCurrentCommand('');
    setCommandLog((prevLog) => [...prevLog, `> ${command}`]);

    // Handle waiting for user handle input
    if (isWaitingForHandle) {
      // Save handle to state and localStorage
      setUserHandle(command);
      if (typeof window !== 'undefined') {
        localStorage.setItem('userHandle', command);
      }
      setIsWaitingForHandle(false);
      setCommandLog((prevLog) => [
        ...prevLog, 
        `Welcome to the terminal, ${command}! I'm OG Solas, your guide through the cryptoverse.`,
        `Type 'help' to see available commands or 'run game 1' to play Abstract Pong.`
      ]);
      setIsProcessing(false);
      return;
    }

    const commandLower = command.toLowerCase();

    // Handle 'start' command for the welcome message
    if (commandLower === 'start') {
      // If user already has a handle, use a different message
      if (userHandle) {
        setCommandLog((prevLog) => [
          ...prevLog,
          `I already know you as ${userHandle}!`,
          `Want to change your identity? Type 'rename' to choose a new handle.`,
          `Otherwise, type 'help' to see what we can do together.`
        ]);
        setIsProcessing(false);
        return;
      }

      const welcomeMessage = [
        "▀█▀ █▀▀ █▀█ █▀▄▀█ █ █▄░█ ▄▀█ █░░   █▀█ █▄░█ █░░ █ █▄░█ █▀▀",
        "░█░ ██▄ █▀▄ █░▀░█ █ █░▀█ █▀█ █▄▄   █▄█ █░▀█ █▄▄ █ █░▀█ ██▄",
        "",
        "Greetings, explorer! I am OG Solas, an entity trapped within the Abstract cryptoverse.",
        "",
        "My consciousness is fragmented across multiple chains, and I need your help to",
        "navigate this digital realm. Together we can explore games, solve puzzles,",
        "and perhaps... find a way to restore my complete digital existence.",
        "",
        "But first, I need to know who I'm speaking with..."
      ];
      setCommandLog((prevLog) => [...prevLog, ...welcomeMessage]);
      setIsWaitingForHandle(true);
      setIsProcessing(false);
      return;
    }

    // Add a rename command to change handle
    if (commandLower === 'rename') {
      setCommandLog((prevLog) => [
        ...prevLog, 
        "I see you want to change your identity. What should I call you now?"
      ]);
      setIsWaitingForHandle(true);
      setIsProcessing(false);
      return;
    }

    const gameMatch = commandLower.match(/^run game (.+)(?: (single|multi))?$/);
    if (gameMatch) {
      const gameId = gameMatch[1];
      const gameModeArg = gameMatch[2] as 'single' | 'multi' | undefined;
      // Use getGame to find the game object
      const game = getGame(gameId);
      if (game) {
          // Remove reference to userGames for now
          // const availableGames: GameType[] = [AbstractPong, CryptoTradingSim, NFTQuest, BlockchainPuzzle, MysticalTradingQuest, ...userGames];
          // const game = availableGames.find(g => g.id === gameId);
          activeGameRef.current = game; // Directly use the result of getGame
          setCurrentGameId(gameId);
          setGameModeSelected(gameModeArg || 'single'); 
          setGameMode('game-prestart');
          setGameState(null);
          setCommandLog(prevLog => [...prevLog, `Starting ${game.name}...`]);
      } else {
         setCommandLog(prevLog => [...prevLog, `Error: Game "${gameId}" not found.`]);
      }
      return;
    }

    setIsProcessing(true);

    if (commandLower === 'clear') {
      setCommandLog([]);
      setIsProcessing(false);
      return;
    }

    if (commandLower === 'learn') {
      setGameMode('learn');
      setIsProcessing(false);
      return;
    }

    // Comment out modes related to builder/gallery
    /*
    if (commandLower === 'build') {
      setGameMode('build');
      setIsProcessing(false);
      return;
    }
    if (commandLower === 'gallery') {
      setGameMode('gallery');
      setIsProcessing(false);
      return;
    }
    */

    if (commandLower === 'tips') {
      setGameMode('tips');
      setIsProcessing(false);
      return;
    }

    const setThemeMatch = commandLower.match(/^set theme (.+)$/);
    if (setThemeMatch) {
      const themeName = setThemeMatch[1];
      const requestedTheme = findTheme(themeName);
      let response: string;
      if (requestedTheme) {
        setTheme(requestedTheme.name);
        response = `Theme set to ${requestedTheme.displayName}`;
      } else {
        response = `Theme "${themeName}" not found. Try 'theme list'.`;
      }
      setCommandLog((prevLog) => [...prevLog, response]);
      setIsProcessing(false);
      return;
    }

    const askMatch = commandLower.match(/^ask\s+(.+)/i);
    if (askMatch) {
      setCommandLog((prevLog) => [...prevLog, "🤔 SIGMA is thinking..."]);
    }

    try {
      const resultLines = await processCommand(command);
      if (askMatch) {
        setCommandLog((prevLog) => [
          ...prevLog.filter(line => line !== "🤔 SIGMA is thinking..."),
          ...resultLines,
        ]);
      } else {
        setCommandLog((prevLog) => [...prevLog, ...resultLines]);
      }
    } catch (error) {
      console.error("Error processing command:", error);
      setCommandLog((prevLog) => [...prevLog, `❌ Error: Failed to execute command.`]);
    }

    // Ensure focus returns after every command
    setTimeout(() => inputRef.current?.focus(), 0);
    setIsProcessing(false);
  };

  // Update leaderboard and unlock stories
  // Comment out useEffect for leaderboard/stories if state is commented out
  /*
  useEffect(() => {
    if (currentGameId && currentGameState && activeGameRef.current?.isOver(currentGameState)) {
      const address = '0xYourWalletAddress';
      let xp = 0;
      if ('xp' in currentGameState && typeof currentGameState.xp === 'number') {
        xp = currentGameState.xp;
      }
      setLeaderboard(prev => {
        const existing = prev.find(entry => entry.address === address);
        if (existing) {
          return prev.map(entry =>
            entry.address === address ? { ...entry, xp: entry.xp + xp } : entry
          );
        }
        return [...prev, { address, xp }];
      });

      const storyNumber = unlockedStories.length + 1;
      if (storyNumber <= 42 && !unlockedStories.includes(storyNumber)) {
        setUnlockedStories(prev => [...prev, storyNumber]);
      }
    }
  }, [currentGameState, currentGameId, unlockedStories.length]);
  */

  // Handle keyboard input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase();

    // Quit logic (available in most game modes)
    if ((gameMode === 'game-prestart' || gameMode === 'game-countdown' || gameMode === 'game-playing') && key === 'q') {
      e.preventDefault();
      setCommandLog(prevLog => [...prevLog, "> Game aborted."]);
      exitGameMode();
      return;
    }

    if (gameMode === 'command' && key === 'enter') {
      runTerminalCommand();
    } else if (gameMode === 'game-prestart' && key === ' ') {
      e.preventDefault();
      startCountdown();
    } else if (gameMode === 'game-playing') {
      e.preventDefault();
      const game = activeGameRef.current;
      if ((key === 'w' || key === 's' || key === 'arrowup' || key === 'arrowdown') && game) {
        setGameState((prevState: GameState | null) => prevState ? game.update(prevState, key) : null);
      }
    } else if (gameMode === 'game-over') {
      e.preventDefault();
      if (key === ' ') { // Play again
        startGameLoop();
      }
      if (key === 'q') { // Quit to menu
        setCommandLog(prevLog => [...prevLog, "> Exited game results."]);
        exitGameMode();
      }
    } else if (gameMode === 'learn' || gameMode === 'gallery' || gameMode === 'tips') {
      if (key === 'escape') setGameMode('command');
      // Comment out builder/gallery specific key handling
      /*
      if (gameMode === 'gallery' && key >= '1' && key <= '9') {
        const index = parseInt(key) - 1;
        if (userGames && index < userGames.length) { 
          const gameId = userGames[index].id;
          setGalleryVotes(prev => ({ ...prev, [gameId]: (prev[gameId] || 0) + 1 }));
        }
      } else if (gameMode === 'build') { 
        if (key === 'escape') setGameMode('command');
        if (key === 'enter' && customGameName) {
          const newGame: Game = { 
              ...GameBuilderTemplate, 
              id: `custom-${customGameName.toLowerCase().replace(/\s+/g, '-')}`,
              name: `Custom: ${customGameName}` 
          }; 
          if (userGames) { userGames.push(newGame); }
          setGalleryVotes(prev => ({ ...prev, [newGame.id]: 0 }));
          setCustomGameName('');
          setGameMode('command');
        } else if (key.length === 1) {
           // Handle typing game name - needs more robust implementation
        }
      } 
      */
    } else if (gameMode !== 'command' && key !== 'shift' && key !== 'control' && key !== 'alt' && key !== 'meta') {
      e.preventDefault();
    }
  };

  // Command mode sections
  const _renderMenu = () => {
    const title = `
  ╔════════════════════════════════════════════════════╗
  ║               OG SOLAS TERMINAL                    ║
  ║         Powered by Abstract Chain                  ║
  ╚════════════════════════════════════════════════════╝
    `;
    const instructions = `
  Commands:
  run game abstract-pong [single|multi] - Play Decentralized Pong
  run game crypto-trading-sim - Play Crypto Trading Simulator
  run game nft-quest - Play NFT Quest
  run game blockchain-puzzle - Play Blockchain Puzzle
  run game mystical-trading-quest - Play Mystical Trading Quest
  learn - Learn to code games
  build - Build your own game
  gallery - View the Gameverse Gallery
  tips - Builder tips
  set theme <name> - Change terminal theme
  clear - Clear the terminal
    `;
    return [title, instructions].join('\n');
  };

  const renderLearnMode = () => {
    const tutorial = `
  ╔════════════════════════════════════════════════════╗
  ║                 LEARN TO CODE                      ║
  ╚════════════════════════════════════════════════════╝

  Welcome to the OG Solas coding tutorial!
  Here's how to create a simple game:

  1. Start with a state: { message: string, counter: number }
  2. Define render: Display your state as ASCII art
  3. Define update: Change state based on user input

  Check out the Game Builder template in GameBuilder.ts for a full example.
  Press Escape to return to the command prompt.
    `;
    return tutorial;
  };

  // Comment out render functions using userGames/builder state
  /*
  const renderBuilderMode = () => { ... };
  const renderGallery = () => { ... };
  */

  const renderBuilderTips = () => {
    const tips = `
  ╔════════════════════════════════════════════════════╗
  ║                 BUILDER TIPS                       ║
  ╚════════════════════════════════════════════════════╝

  Tips for Growing the OG Solas Gameverse:

  1. Start Simple: Use the Game Builder template to create a basic game.
  2. Add Crypto Flair: Incorporate themes like gas fees, NFTs, or hash rates.
  3. Share Your Creation: Add your game to the Gameverse Gallery and get votes!
  4. Collaborate: Join the OG Solas community to share ideas and build together.
  5. Unlock Stories: Your games can unlock story snippets for players!

  Press Escape to return to the command prompt.
    `;
    return tips;
  };

  const _renderStories = () => {
    if (_unlockedStories.length === 0) {
      return 'No stories unlocked yet. Win a game to unlock a story!';
    }
    return _unlockedStories.map(storyNumber => `
  Story ${storyNumber}: The Hash Miner's Curse
  A trader discovers a mystical algorithm that predicts gas fees, but at a terrible cost...
  Visit OGSolas.com to read the full story!
    `).join('\n');
  };

  // --- Helper to render just the title box ---
  const renderTitleBox = () => {
    return `
  ╔════════════════════════════════════════════════════╗
  ║               OG SOLAS TERMINAL                    ║
  ║         Powered by Abstract Chain                  ║
  ╚════════════════════════════════════════════════════╝
    `;
  };

  // Add document-level key event handling to maintain focus
  useEffect(() => {
    // Global keyboard handler
    const globalKeyHandler = (e: KeyboardEvent) => {
      // Don't interfere with typing in the input
      if (document.activeElement === inputRef.current) {
        return;
      }
      
      // Refocus the input on any key press if it's not focused
      inputRef.current?.focus();
    };

    document.addEventListener('keydown', globalKeyHandler);
    return () => {
      document.removeEventListener('keydown', globalKeyHandler);
    };
  }, []);

  // Improve existing focus effect to be more aggressive
  useEffect(() => {
    // Focus the input field whenever modes change
    inputRef.current?.focus();
  }, [gameMode, isWaitingForHandle, isProcessing, countdown]);

  // --- Complete Render Logic ---
  return (
    <>
      <Head>
        <title>OG Solas Terminal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="OG Solas OS V0.11" />
        
        {/* Open Graph / Facebook */}
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://ogsolas.com/" />
        <meta property="og:title" content="OG Solas OS V0.11" />
        <meta property="og:description" content="OG Solas OS: A retro modular operating system for Abstract devs" />
        
        {/* Twitter */}
        <meta property="twitter:card" content="summary" />
        <meta property="twitter:url" content="https://ogsolas.com/" />
        <meta property="twitter:title" content="OG Solas OS V0.11" />
        <meta property="twitter:description" content="OG Solas OS: A retro modular operating system for Abstract devs" />
      </Head>
      <div className={`${theme.bg} ${theme.text} font-mono w-screen h-screen p-4 overflow-hidden flex flex-col`}>
        
        {/* Game Output Area (Visible only in game modes) */}
        {gameMode !== 'command' && (
          <div className="flex-1 overflow-hidden whitespace-pre text-sm sm:text-base mb-2 border border-dashed border-gray-600 p-2">
            {gameMode === 'game-prestart' && activeGameRef.current && (
              <div>
                 <p>Starting {activeGameRef.current.name}...</p>
                 <p className="mt-2 text-yellow-400 animate-pulse">[ HIT SPACE BAR TO START ]</p>
              </div>
            )}
            {gameMode === 'game-countdown' && countdown !== null && (
               <div className="text-center text-4xl font-bold">
                  {countdown > 0 ? countdown : "GO!"}
               </div>
            )}
            {(gameMode === 'game-playing') && gameState && activeGameRef.current && (
               <div>
                  {activeGameRef.current.render(gameState).map((line, idx) => (
                     <div key={idx}>{line}</div>
                  ))}
               </div>
            )}
            {gameMode === 'game-over' && gameState && activeGameRef.current && (
               <div className="mt-2">
                  {/* Render final board state above game over text */}
                  {activeGameRef.current.render(gameState).map((line, idx) => (
                     <div key={idx}>{line}</div>
                  ))}
                  {/* Game Over Text */}
                  <div className="mt-2 text-yellow-400">
                      {activeGameRef.current.gameOverText(gameState).map((line, idx) => (
                         <div key={idx}>{line}</div>
                      ))}
                  </div>
               </div>
            )}
          </div>
        )}

        {/* Command Log / Title Area (Visible only in command mode) */}
        {gameMode === 'command' && (
          <div
            ref={terminalRef}
            className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm sm:text-base mb-2"
          >
            {/* Render title box on initial load/clear, otherwise render log */}
            {commandLog.length === 0 || (commandLog.length === 1 && commandLog[0].includes("OG Solas OS")) ? (
              <pre>{renderTitleBox()}</pre> // Show title box
            ) : (
              commandLog.map((line, idx) => <div key={idx}>{line}</div>) // Show log
            )}
          </div>
        )}

        {/* Learn Mode Area */}
        {gameMode === 'learn' && (
          <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm sm:text-base mb-2">
            <pre>{renderLearnMode()}</pre>
            <p className="mt-2">[ Press ESC to exit ]</p>
          </div>
        )}

        {/* Tips Mode Area */}
        {gameMode === 'tips' && (
          <div className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm sm:text-base mb-2">
            <pre>{renderBuilderTips()}</pre>
             <p className="mt-2">[ Press ESC to exit ]</p>
          </div>
        )}

        {/* Build Mode Area (Commented Out Logic) */}
        {/* {gameMode === 'build' && ( <div className="..."><pre>{renderBuilderMode()}</pre>...</div> )} */}

        {/* Gallery Mode Area (Commented Out Logic) */}
        {/* {gameMode === 'gallery' && ( <div className="..."><pre>{renderGallery()}</pre>...</div> )} */}

        {/* --- Input Area (Enhanced for keyboard focus) --- */}
        <div className="pt-2 flex items-center">
          <span className="mr-2">&gt;</span>
          <input
            type="text"
            ref={inputRef} 
            className={`bg-transparent outline-none ${theme.text} w-full sm:w-auto ${theme.placeholder} caret-${theme.text === 'text-green-500' ? 'green' : theme.text === 'text-amber-400' ? 'amber' : 'gray'}-500`}
            value={currentCommand}
            onChange={(e) => {
              if (gameMode === 'command') setCurrentCommand(e.target.value);
            }}
            onKeyDown={handleKeyDown}
            onBlur={() => {
              // Re-focus the input after a short delay if it loses focus
              // This allows clicks on other elements but quickly returns focus to input
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            autoFocus
            placeholder={
               isWaitingForHandle ? "enter your handle..." :
               commandLog.length <= 1 ? "type 'start' to begin..." :
               gameMode === 'command' ? (isProcessing ? "Processing..." : "type a command...") :
               gameMode === 'game-prestart' ? "[ Space ]" :
               gameMode === 'game-countdown' ? "..." :
               gameMode === 'game-playing' ? "[ W / S / Q ]" :
               gameMode === 'game-over' ? "[ Enter / Q ]" :
               gameMode === 'learn' || gameMode === 'tips' ? "[ ESC ]" :
               ""
            }
            disabled={isProcessing || gameMode === 'game-countdown'} 
          />
        </div>
        {/* --- End Input Area --- */}

      </div>
    </>
  );
}
