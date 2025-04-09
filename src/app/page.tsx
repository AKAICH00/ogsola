// src/pages/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useTheme } from '@/hooks/useTheme';
import { findTheme, Theme, themes } from '@/lib/themes';
import { handleCommand as processCommand } from '@/lib/commands';
import type { Game, GameState } from '@/games/types';
import { getGame, allGames, sortGameList } from '@/games';
import GameCanvas from '@/components/terminal/game/GameCanvas';
import { createEmptyKeyState, handleKeyDown, handleKeyUp, KeyState } from '@/lib/gameEngine';

type GameMode = 'command' | 'game-prestart' | 'game-countdown' | 'game-playing' | 'game-over' | 'learn' | 'build' | 'gallery' | 'tips' | 'game-canvas';

export default function Home() {
  const [selectedTheme, setTheme] = useTheme();
  const [commandLog, setCommandLog] = useState<string[]>(["OG Solas OS v0.11"]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('command');
  const [_gameModeSelected, setGameModeSelected] = useState<'single' | 'multi'>('single');
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [keyState, setKeyState] = useState<any>(null);
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
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [textBrightness, setTextBrightness] = useState<number>(100);
  const [dynamicTextColor, setDynamicTextColor] = useState<string | null>(null);
  const brightnessTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const logContainerRef = useRef<HTMLPreElement>(null);

  // --- Voting State ---
  const [gameVotes, setGameVotes] = useState<{ [id: string]: number }>(() => {
    if (typeof window !== 'undefined') {
      const savedVotes = localStorage.getItem('gameVotes');
      return savedVotes ? JSON.parse(savedVotes) : {};
    }
    return {};
  });
  const [sortedGameList, setSortedGameList] = useState<Game[]>(() => sortGameList(allGames, gameVotes));

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
    if (gameMode === 'command' && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [commandLog, gameMode]);

  // Focus input
  useEffect(() => {
    inputRef.current?.focus();
  }, [gameMode]);

  // Load saved brightness from localStorage on initial render
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBrightness = localStorage.getItem('terminal-brightness');
      if (savedBrightness) {
        setTextBrightness(Number(savedBrightness));
      }
    }
  }, []);

  // Effect to update dynamic color when theme or brightness changes
  useEffect(() => {
    const factor = textBrightness / 100;
    const [rBase, gBase, bBase] = selectedTheme.baseTextColorRGB;
    const r = Math.min(Math.round(rBase * factor), 255);
    const g = Math.min(Math.round(gBase * factor), 255);
    const b = Math.min(Math.round(bBase * factor), 255);
    setDynamicTextColor(`rgb(${r}, ${g}, ${b})`);

    // Save brightness to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('terminal-brightness', textBrightness.toString());
    }

    // Show indicator when brightness changes
    setShowBrightnessIndicator(true);
    if (brightnessTimeoutRef.current) {
        clearTimeout(brightnessTimeoutRef.current);
    }
    brightnessTimeoutRef.current = setTimeout(() => {
        setShowBrightnessIndicator(false);
    }, 2000); // Match the original example's 2000ms timeout

    // Cleanup timeout on unmount or when dependencies change
    return () => {
        if (brightnessTimeoutRef.current) {
            clearTimeout(brightnessTimeoutRef.current);
        }
    };
  }, [textBrightness, selectedTheme]);

  // Simplified wheel handler to match original example
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    // Only adjust brightness in command mode
    if (gameMode === 'command') {
        event.preventDefault(); // Prevent page scroll
      
        // Directly check wheel direction (matches original example)
        if (event.deltaY < 0) {
            // Scrolling up - increase brightness
            setTextBrightness(prev => Math.min(prev + 5, 150));
        } else {
            // Scrolling down - decrease brightness
            setTextBrightness(prev => Math.max(prev - 5, 30));
        }
    }
  };

  // Helper function to list available themes
  const getThemeList = (): string[] => {
    const themeListOutput: string[] = ['Available Themes:'];
    themes.forEach((theme, index) => {
      themeListOutput.push(`  ${index + 1}. ${theme.name.padEnd(8)} - ${theme.displayName}`);
    });
    themeListOutput.push(" ");
    themeListOutput.push("Set using 'set theme <name>' (e.g. 'set theme blue')");
    return themeListOutput;
  };

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
    // Stop ASCII game loop
    if (gameLoopIntervalRef.current) {
      clearInterval(gameLoopIntervalRef.current);
      gameLoopIntervalRef.current = null;
    }
    // Note: Canvas engine stopping is now handled by GameCanvas unmount
    // Reset common state
    setGameMode('command');
    setCurrentGameId(null); // Clear current game ID
    setGameState(null);
    setCountdown(null);
    activeGameRef.current = null;
    setGameModeSelected('single');
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

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

    // Add Escape for learn/tips mode
    if ((gameMode === 'learn' || gameMode === 'tips') && key === 'escape') {
      e.preventDefault();
      setGameMode('command');
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
    // Add some top margin to the title box
    return (
      <pre className="relative z-30 mb-4 flex-shrink-0">
        {`
  ╔════════════════════════════════════════════════════╗
  ║               OG SOLAS TERMINAL                    ║
  ║         Powered by Abstract Chain                  ║
  ╚════════════════════════════════════════════════════╝
        `}
      </pre>
    );
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

  // --- NEW: Help Text Function ---
  const renderHelpText = (): string[] => {
    return [
      'OG Solas OS - Available Commands:',
      '----------------------------------',
      '  start          - Begin the OG Solas experience (if not done). ',
      '  rename         - Change your user handle.',
      '  list games     - Show available games and their types (ASCII/Canvas).',
      '  run game <id>  - Start a game by its ID or number from the list.',
      "                 (e.g., 'run game 1', 'run game abstract-pong')",
      "  set theme <name> - Change the terminal theme (e.g., 'green', 'amber', 'blue').",
      '  theme list     - Show available themes.',
      '  clear          - Clear the terminal screen.',
      '  ask <query>    - Ask SIGMA (AI assistant) a question.',
      '  learn          - View coding tutorial info (Press ESC to exit).',
      '  tips           - View game builder tips (Press ESC to exit).',
      '  help           - Show this help message.',
      ' ',
      'During ASCII Games:',
      '  [W/S] or [Arrows] - Control paddles/player.',
      '  [Q]            - Quit the current game.',
      'During Canvas Games (like Brick Breaker):',
      '  [A/D] or [Arrows]- Control paddle.',
      '  [P]            - Pause/Resume the game.',
      '  [Q]            - Quit the current game.',
    ];
  };
  // --- End Help Text Function ---

  // Add a blinking cursor style for the terminal
  const cursorStyle = {
    display: 'inline-block',
    width: '8px',
    height: '16px',
    backgroundColor: dynamicTextColor || undefined,
    animation: 'blink 1s step-end infinite',
    verticalAlign: 'middle',
    marginLeft: '2px'
  };

  // Add the keyframes for the cursor animation
  const keyframes = `
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `;

  // Handle terminal commands
  const runTerminalCommand = async () => {
    const command = currentCommand.trim();
    if (command === '' || isProcessing || gameMode !== 'command') return;

    setCurrentCommand('');
    setCommandLog((prevLog) => [...prevLog, `${command}`]);

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
        `Type 'help' or 'list games' to see available commands.`
      ]);
      setIsProcessing(false);
      return;
    }

    const commandLower = command.toLowerCase();

    // Handle 'theme list' command
    if (commandLower === 'theme list') {
      setCommandLog(prevLog => [...prevLog, ...getThemeList()]);
      setIsProcessing(false);
      return;
    }

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

    // Handle 'list games' command
    if (commandLower === 'list games') {
      const gameListOutput: string[] = ['Available Games:'];
      sortedGameList.forEach((game, index) => {
        const voteCount = game.name.includes("(Coming Soon)") ? `(${(gameVotes[game.id] || 0)})` : '';
        gameListOutput.push(`  ${index + 1}. ${game.id.padEnd(15)} ${voteCount.padEnd(5)} ${game.name}`);
      });
      gameListOutput.push(" ");
      gameListOutput.push("Run using 'run game <id_or_number>' | Vote using 'vote game <id_or_number>'");
      setCommandLog(prevLog => [...prevLog, ...gameListOutput]);
      setIsProcessing(false);
      return;
    }

    // Handle 'help' command
    if (commandLower === 'help') {
      setCommandLog(prevLog => [...prevLog, ...renderHelpText()]);
      setIsProcessing(false);
      return;
    }

    // Handle 'vote game' command
    const voteMatch = commandLower.match(/^vote game (.+)$/);
    if (voteMatch) {
      const identifier = voteMatch[1];
      const gameToVote = getGame(identifier, sortedGameList);

      if (gameToVote && gameToVote.name.includes("(Coming Soon)")) {
        setGameVotes(prev => ({
          ...prev,
          [gameToVote.id]: (prev[gameToVote.id] || 0) + 1
        }));
        setCommandLog(prev => [...prev, `⚡ Vote registered for ${gameToVote.name}`]);
      } else if (gameToVote) {
        setCommandLog(prev => [...prev, `❌ Cannot vote for already available game: ${gameToVote.name}`]);
      } else {
        setCommandLog(prev => [...prev, `❌ Game not found: ${identifier}`]);
      }
      setIsProcessing(false);
      return;
    }

    const gameMatch = commandLower.match(/^run game (.+)(?: (single|multi))?$/);
    if (gameMatch) {
      const gameId = gameMatch[1];
      const gameModeArg = gameMatch[2] as 'single' | 'multi' | undefined;
      const game = getGame(gameId, sortedGameList);

      if (game) {
        if (game.name.includes("(Coming Soon)")) {
          setCommandLog(prev => [...prev, `⏳ ${game.name} is not yet available. Use 'vote game ${game.id}' to show your interest!`]);
        } else if (game.type === 'canvas') {
          setCommandLog(prev => [...prev, `Initializing ${game.name}...`]);
          setCurrentGameId(game.id);
          setGameMode('game-canvas');
        } else {
          activeGameRef.current = game;
          setCurrentGameId(game.id);
          setGameModeSelected(gameModeArg || 'single');
          setGameMode('game-prestart');
          setGameState(null);
          setCommandLog(prevLog => [...prevLog, `Starting ASCII Game: ${game.name}...`]);
        }
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
      const themeNameArg = setThemeMatch[1];
      const requestedTheme = findTheme(themeNameArg);
      let response: string;
      if (requestedTheme) {
        setTheme(requestedTheme.name);
        response = `Theme set to ${requestedTheme.displayName}`;
      } else {
        response = `Theme "${themeNameArg}" not found. Try 'theme list'.`;
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

  // Effect to set isClient to true after mounting
  useEffect(() => {
    setIsClient(true);
  }, []);

  // --- Complete Render Logic ---
  return (
    <>
      <Head>
        <title>OG Solas Terminal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <meta name="description" content="OG Solas OS V0.11" />
        <style>
          {`
            @keyframes blink {
              0%, 50% { opacity: 1; }
              51%, 100% { opacity: 0; }
            }
            
            /* CRT terminal specific styles */
            .terminal-content {
              width: 100%;
              height: 100%;
              padding: 60px; /* Padding inside this container */
              box-sizing: border-box;
              overflow: hidden; /* Hide main overflow */
              position: relative; /* For CRT effects */
              font-family: 'Courier New', monospace;
              font-size: 16px;
              line-height: 1.2;
              display: flex; 
              flex-direction: column; 
            }

            /* Apply CRT effects to this container */
            .terminal-content::before {
              content: "";
              position: absolute;
              /* Adjust inset to account for padding */
              top: 60px; left: 60px; right: 60px; bottom: 60px; 
              background: repeating-linear-gradient(
                0deg,
                rgba(0, 0, 0, 0.15),
                rgba(0, 0, 0, 0.15) 1px,
                transparent 1px,
                transparent 2px
              );
              pointer-events: none;
              z-index: 1;
            }
            
            .terminal-content::after {
              content: "";
              position: absolute;
               /* Adjust inset to account for padding */
              top: 60px; left: 60px; right: 60px; bottom: 60px;
              background: radial-gradient(
                circle at center,
                transparent 0%,
                rgba(0, 0, 0, 0.1) 90%,
                rgba(0, 0, 0, 0.4) 100%
              );
              pointer-events: none;
              z-index: 2;
            }
            
            .command-log-area {
              flex-grow: 1; /* Allow log area to grow */
              overflow-y: auto; /* Enable scrolling for the log */
              position: relative; /* Needed for z-index */
              z-index: 30; /* Ensure content is above CRT effects */
            }

            .input-line {
              flex-shrink: 0; /* Prevent input line from shrinking */
              z-index: 30; /* Ensure content is above CRT effects */
            }

            /* Keep brightness indicator fixed to viewport */
            .brightness-indicator {
              position: fixed;
              bottom: 10px; 
              right: 0; 
              margin-right: 10px; 
              background-color: rgba(0, 0, 0, 0.7);
              padding: 5px 10px;
              border-radius: 5px;
              z-index: 50; /* Ensure it's above everything */
              font-size: 12px; /* Adjust size if needed */
            }
          `}
        </style>
      </Head>

      {/* Main terminal container - NO PADDING HERE */}
      <div 
        className="bg-black w-screen h-screen overflow-hidden"
        style={{ transition: 'color 0.3s ease-in-out' }}
        onWheel={handleWheel}
      >
        {/* Use terminal-content div for padding, flex layout, and CRT effects */}
        <div 
          className="terminal-content" 
          style={{ 
            color: dynamicTextColor || undefined,
            transition: 'color 0.3s ease-in-out'
          }}
        >
          {/* Command Log Area (Scrollable, takes up middle space) */}
          {gameMode === 'command' && (
            <pre 
              ref={logContainerRef}
              className="command-log-area whitespace-pre-wrap"
            >
              {/* Render ALL log entries */}
              {commandLog.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
            </pre>
          )}

          {/* Game Output Area (Takes full space when not in command mode) */}
          {gameMode !== 'command' && (
            <div className="flex-grow-1 relative z-30">
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
              {gameMode === 'game-canvas' && currentGameId && (
                <div className="w-full h-full">
                  <GameCanvas 
                    gameId={currentGameId} 
                    userHandle={userHandle}
                    onQuit={exitGameMode}
                  />
                </div>
              )}
            </div>
          )}

          {/* Input Line (Pushed to bottom by flexbox) */}
          {gameMode === 'command' && (
            <div className="input-line flex items-center">
              <span className="mr-1">&gt;</span>
              {/* Placeholder logic */}
              {currentCommand === '' && isWaitingForHandle ? (
                <span className="opacity-60">enter your handle...</span>
              ) : currentCommand === '' && !userHandle && commandLog.length <= 1 ? (
                <span className="opacity-60">type 'start' to begin</span>
              ) : currentCommand === '' ? (
                <span className="opacity-60">type a command...</span>
              ) : (
                <span>{currentCommand}</span>
              )}
              {/* Blinking Cursor */}
              {isClient && !isProcessing && (
                <span 
                  className="cursor" 
                  style={{ backgroundColor: dynamicTextColor || undefined }}
                ></span>
              )}
            </div>
          )}

          {/* Hidden input remains for focus/keyboard handling */}
          <input
            ref={inputRef}
            type="text"
            className="opacity-0 absolute top-0 left-0 w-px h-px z-[-1]"
            value={currentCommand}
            onChange={(e) => setCurrentCommand(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing || gameMode !== 'command'}
            autoFocus
          />
        </div>

        {/* Brightness Indicator (Overlay) */}
        {showBrightnessIndicator && (
          <div 
            className="brightness-indicator"
            style={{ color: dynamicTextColor || undefined, transition: 'color 0.3s ease-in-out'}}
          >
            Brightness: {textBrightness}%
          </div>
        )}
      </div>
    </>
  );
}
