'use client';

import Head from 'next/head';
import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { themes, findTheme } from '@/lib/themes';
import { handleCommand as processCommand } from '@/lib/commands';

export default function Home() {
  const [log, setLog] = useState<string[]>(["Booting OGSola Terminal v0.1..."]);
  const [input, setInput] = useState('');
  const terminalRef = useRef<HTMLDivElement>(null);
  const [theme, setTheme] = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    terminalRef.current?.scrollTo(0, terminalRef.current.scrollHeight);
  }, [log]);

  const runTerminalCommand = async () => {
    const command = input.trim();
    if (command === '' || isProcessing) return;

    setIsProcessing(true);
    setInput('');
    setLog((prevLog) => [...prevLog, `> ${command}`]);

    const commandLower = command.toLowerCase();

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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      runTerminalCommand();
    }
  };

  return (
    <>
      <Head>
        <title>OGSola Terminal</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className={`${theme.bg} ${theme.text} font-mono w-screen h-screen p-4 overflow-hidden flex flex-col`}>
        <div
          ref={terminalRef}
          className="flex-1 overflow-y-auto whitespace-pre-wrap text-sm sm:text-base"
        >
          {log.map((line, idx) => (
            <div key={idx}>{line}</div>
          ))}
        </div>
        <div className="pt-2 flex items-center">
          <span className="mr-2">&gt;</span>
          <input
            type="text"
            className={`bg-transparent outline-none ${theme.text} w-full sm:w-auto ${theme.placeholder}`}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            autoFocus
            placeholder={isProcessing ? "Processing..." : "type a command..."}
            disabled={isProcessing}
          />
        </div>
      </div>
    </>
  );
}
