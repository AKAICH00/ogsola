// src/pages/page.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Head from 'next/head';
import { useTheme } from '@/hooks/useTheme';
import { findTheme, Theme, themes } from '@/lib/themes';
import { handleCommand as processCommand } from '@/lib/commands';
import type { Game } from '@/games/types';
import { getGame, gameList } from '@/games';
import GameCanvas from '@/components/GameCanvas';
import { mapThemeToCanvasStyle } from '@/lib/canvasStyles';

type GameMode = 'command' | 'learn' | 'build' | 'gallery' | 'tips' | 'game-canvas';

export default function Home() {
  const [selectedTheme, setTheme] = useTheme();
  const [commandLog, setCommandLog] = useState<string[]>(["OG Solas OS v0.11"]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [currentGameId, setCurrentGameId] = useState<string | null>(null);
  const [gameMode, setGameMode] = useState<GameMode>('command');
  const [_leaderboard, setLeaderboard] = useState<{ address: string; xp: number }[]>([]);
  const [_unlockedStories, _setUnlockedStories] = useState<number[]>([]);
  const [userHandle, setUserHandle] = useState<string | null>(null);
  const [isWaitingForHandle, setIsWaitingForHandle] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [textBrightness, setTextBrightness] = useState<number>(100);
  const [dynamicTextColor, setDynamicTextColor] = useState<string | null>(null);
  const brightnessTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [showBrightnessIndicator, setShowBrightnessIndicator] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const logContainerRef = useRef<HTMLPreElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedHandle = localStorage.getItem('userHandle');
      if (savedHandle) {
        setUserHandle(savedHandle);
        setCommandLog(prevLog => [
          ...prevLog,
          `Welcome back, ${savedHandle}! Type 'help' to see available commands.`
        ]);
      }
    }
  }, []);

  useEffect(() => {
    if (gameMode === 'command' && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [commandLog, gameMode]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [gameMode]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedBrightness = localStorage.getItem('terminal-brightness');
      if (savedBrightness) {
        setTextBrightness(Number(savedBrightness));
      }
    }
  }, []);

  useEffect(() => {
    const factor = textBrightness / 100;
    const [rBase, gBase, bBase] = selectedTheme.baseTextColorRGB;
    const r = Math.min(Math.round(rBase * factor), 255);
    const g = Math.min(Math.round(gBase * factor), 255);
    const b = Math.min(Math.round(bBase * factor), 255);
    setDynamicTextColor(`rgb(${r}, ${g}, ${b})`);

    if (typeof window !== 'undefined') {
      localStorage.setItem('terminal-brightness', textBrightness.toString());
    }

    setShowBrightnessIndicator(true);
    if (brightnessTimeoutRef.current) {
        clearTimeout(brightnessTimeoutRef.current);
    }
    brightnessTimeoutRef.current = setTimeout(() => {
        setShowBrightnessIndicator(false);
    }, 2000);

    return () => {
        if (brightnessTimeoutRef.current) {
            clearTimeout(brightnessTimeoutRef.current);
        }
    };
  }, [textBrightness, selectedTheme]);

  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    if (gameMode === 'command') {
        event.preventDefault();
      
        if (event.deltaY < 0) {
            setTextBrightness(prev => Math.min(prev + 5, 150));
        } else {
            setTextBrightness(prev => Math.max(prev - 5, 30));
        }
    }
  };

  const getThemeList = (): string[] => {
    const themeListOutput: string[] = ['Available Themes:'];
    themes.forEach((theme, index) => {
      themeListOutput.push(`  ${index + 1}. ${theme.name.padEnd(8)} - ${theme.displayName}`);
    });
    themeListOutput.push(" ");
    themeListOutput.push("Set using 'set theme <name>' (e.g. 'set theme blue')");
    return themeListOutput;
  };

  const exitGameMode = useCallback(() => {
    setGameMode('command');
    setCurrentGameId(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const key = e.key.toLowerCase();

    if (key === 'backspace' && e.target === inputRef.current) {
       // Allow backspace default behavior within the input
    } else if (key === 'backspace') {
       e.preventDefault(); // Prevent navigation if focus is elsewhere
    }

    if (gameMode === 'command') {
      if (key === 'enter') {
        e.preventDefault();
        if (currentCommand.trim() !== '' && !isProcessing) {
          runTerminalCommand();
          setCurrentCommand('');
        }
      } else if (key === 'arrowup') {
        e.preventDefault();
        // TODO: Implement command history
      } else if (key === 'arrowdown') {
        e.preventDefault();
        // TODO: Implement command history
      } else if (key === 'c' && e.ctrlKey) {
        e.preventDefault();
        setCommandLog(prevLog => [...prevLog, '> ^C']);
        setIsProcessing(false);
      }
    } else if (gameMode === 'learn' || gameMode === 'gallery' || gameMode === 'tips' || gameMode === 'build') {
        if (key === 'escape') {
            e.preventDefault();
            setGameMode('command');
            setTimeout(() => inputRef.current?.focus(), 0);
        }
    }
  };

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

  const renderTitleBox = () => {
    return (
      <pre className="relative z-30 mb-4 flex-shrink-0 font-bold" 
           style={{ 
             fontFamily: "'Courier New', monospace",
             fontSize: '18px',
             lineHeight: 1.2 
           }}>
        {`
  ╔════════════════════════════════════════════════════╗
  ║               OG SOLAS TERMINAL                    ║
  ║         Powered by Abstract Chain                  ║
  ╚════════════════════════════════════════════════════╝
        `}
      </pre>
    );
  };

  useEffect(() => {
    const globalKeyHandler = (e: KeyboardEvent) => {
      if (document.activeElement === inputRef.current) {
        return;
      }
      
      inputRef.current?.focus();
    };

    document.addEventListener('keydown', globalKeyHandler);
    return () => {
      document.removeEventListener('keydown', globalKeyHandler);
    };
  }, []);

  useEffect(() => {
    inputRef.current?.focus();
  }, [gameMode, isWaitingForHandle, isProcessing]);

  const renderHelpText = (): string[] => {
    return [
      'OG Solas OS - Available Commands:',
      '----------------------------------',
      '  start          - Begin the OG Solas experience (if not done). ',
      '  rename         - Change your user handle.',
      '  list games     - Show available canvas games.',
      '  run game <id>  - Start a canvas game by its ID or number.',
      "                 (e.g., 'run game 1', 'run game brick-breaker')",
      "  set theme <name> - Change the terminal theme (e.g., 'green', 'amber', 'blue').",
      '  theme list     - Show available themes.',
      '  clear          - Clear the terminal screen.',
      '  ask <query>    - Ask SIGMA (AI assistant) a question.',
      '  learn          - View coding tutorial info (Press ESC to exit).',
      '  tips           - View game builder tips (Press ESC to exit).',
      '  help           - Show this help message.',
      ' ',
      'During Canvas Games:',
      '  [Q]            - Quit the current game (usually).',
      '  (Other controls depend on the specific game)'
    ];
  };

  const keyframes = `
    @keyframes blink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `;

  const runTerminalCommand = async () => {
    const command = currentCommand.trim();
    if (command === '' || isProcessing || gameMode !== 'command') return;

    setCurrentCommand('');
    setCommandLog((prevLog) => [...prevLog, `${command}`]);

    if (isWaitingForHandle) {
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
      const gameListOutput: string[] = ['Available Canvas Games:'];
      if (gameList.length === 0) {
        gameListOutput.push('  (No canvas games installed yet)');
      } else {
        gameList.forEach((game, index) => {
          gameListOutput.push(`  ${index + 1}. ${game.id.padEnd(25)} ${game.name}`);
        });
      }
      gameListOutput.push(" ");
      gameListOutput.push("Run using 'run game <id_or_number>'");
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

    const gameMatch = commandLower.match(/^run game (.+)$/);
    if (gameMatch) {
      const gameId = gameMatch[1];
      const game = getGame(gameId);

      if (game) {
        // Only handle canvas type now
        if (game.type === 'canvas') {
          setCommandLog(prev => [...prev, `Initializing canvas game: ${game.name}...`]);
          setCurrentGameId(game.id);
          setGameMode('game-canvas');
          // Ensure focus leaves the hidden input when canvas is active
          setTimeout(() => inputRef.current?.blur(), 0);
        } else {
          // This case should technically not happen if types.ts is correct
          setCommandLog(prevLog => [...prevLog, `Error: Game "${gameId}" is not a canvas game.`]);
        }
      } else {
        setCommandLog(prevLog => [...prevLog, `Error: Game "${gameId}" not found.`]);
      }
      setIsProcessing(false); // Set processing false after attempting to run
      return; // Ensure we exit after handling 'run game'
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
              height: 100%; /* Explicitly set height */
              padding: 60px; /* Padding inside this container */
              box-sizing: border-box;
              overflow: hidden; /* Hide main overflow */
              position: relative; /* For CRT effects */
              font-family: 'Courier New', monospace;
              font-size: 18px;
              line-height: 1.2;
              display: flex; /* Ensure flex display */
              flex-direction: column; /* Ensure column direction */
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
              font-weight: bold; /* Make text bold to match input */
            }

            .input-line {
              flex-shrink: 0; /* Prevent input line from shrinking */
              z-index: 30; /* Ensure content is above CRT effects */
              font-family: 'Courier New', monospace; /* Match terminal font */
              font-size: 18px; /* Match terminal font size */
              font-weight: bold; /* Make text bold to match output */
            }
            
            .cursor {
              display: inline-block;
              width: 10px;
              height: 18px;
              animation: blink 1s step-end infinite;
              vertical-align: middle;
              margin-left: 2px;
              font-weight: bold;
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
        className="bg-black w-screen h-screen overflow-hidden flex flex-col"
        style={{ transition: 'color 0.3s ease-in-out' }}
        onWheel={handleWheel}
      >
        {/* Terminal content with CRT effects and proper flex layout */}
        <div 
          className="terminal-content flex-1 flex flex-col" 
          style={{ 
            color: dynamicTextColor || undefined,
            transition: 'color 0.3s ease-in-out'
          }}
        >
          {/* Command Log Area (Visible when not in canvas game mode) - Takes all available space */}
          {gameMode !== 'game-canvas' && (
            <pre
              ref={logContainerRef}
              className="command-log-area flex-1 whitespace-pre-wrap overflow-y-auto relative z-30 font-bold"
            >
              {/* Render command log entries */}
              {commandLog.map((line, idx) => (
                <div key={idx}>{line}</div>
              ))}
              {/* TODO: Add rendering for other non-game modes like learn, tips here if needed */}
            </pre>
          )}

          {/* Game Canvas Area (Visible only when in canvas game mode) - Takes all available space */}
          {gameMode === 'game-canvas' && currentGameId && userHandle && (
            <div className="flex-1 relative z-30">
              <GameCanvas
                gameId={currentGameId}
                userHandle={userHandle}
                style={mapThemeToCanvasStyle(selectedTheme)}
                onQuit={exitGameMode}
              />
            </div>
          )}
            
          {/* Input Line (Visible only in command mode, now at bottom due to flex layout) */}
          {gameMode === 'command' && (
            <div className="input-line flex items-center mt-2 flex-shrink-0 font-bold"
                 style={{ 
                   fontFamily: "'Courier New', monospace",
                   fontSize: '18px', 
                   lineHeight: 1.2 
                 }}>
              <span className="mr-1">&gt;</span>
              {/* Placeholder logic */}
              {currentCommand === '' && isWaitingForHandle ? (
                <span style={{ 
                  color: dynamicTextColor || undefined, 
                  fontFamily: "'Courier New', monospace",
                  fontSize: '18px',
                  fontWeight: '900'
                }}>enter your handle...</span>
              ) : currentCommand === '' && !userHandle && commandLog.length <= 1 ? (
                <span style={{ 
                  color: dynamicTextColor || undefined, 
                  fontFamily: "'Courier New', monospace",
                  fontSize: '18px',
                  fontWeight: '900'
                }}>type 'start' to begin</span>
              ) : currentCommand === '' ? (
                <span style={{ 
                  color: dynamicTextColor || undefined, 
                  fontFamily: "'Courier New', monospace",
                  fontSize: '18px',
                  fontWeight: '900'
                }}>type a command...</span>
              ) : (
                <span style={{ 
                  fontFamily: "'Courier New', monospace",
                  fontSize: '18px',
                  fontWeight: '900'
                }}>{currentCommand}</span>
              )}
              {/* Blinking Cursor */}
              {isClient && !isProcessing && (
                <span 
                  className="cursor" 
                  style={{ 
                    backgroundColor: dynamicTextColor || undefined,
                    height: '20px',
                    width: '11px'
                  }}
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

        {/* Brightness Indicator (Fixed Overlay) - Now properly positioned with fixed position */}
        {showBrightnessIndicator && (
          <div 
            className="fixed bottom-2 right-2 bg-black bg-opacity-70 px-2 py-1 rounded z-50"
            style={{ 
              color: dynamicTextColor || undefined, 
              transition: 'color 0.3s ease-in-out',
              fontFamily: "'Courier New', monospace",
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            Brightness: {textBrightness}%
          </div>
        )}
      </div>
    </>
  );
}
