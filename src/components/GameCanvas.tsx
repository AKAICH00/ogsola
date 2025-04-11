import React, { useRef, useEffect } from 'react';
import { CanvasGameStyle } from '@/lib/canvasStyles';
import { getGame } from '@/games'; // To look up game details

interface GameCanvasProps {
  gameId: string;
  userHandle: string;
  style: CanvasGameStyle; // Changed theme prop to style prop
  onQuit: () => void;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ gameId, userHandle, style, onQuit }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d'); // Start with 2D for now
    if (!context) {
      console.error('Failed to get 2D rendering context');
      return;
    }

    const game = getGame(gameId);
    if (!game || game.type !== 'canvas') {
      console.error(`Game ${gameId} not found or is not a canvas game.`);
      onQuit(); // Go back if the game isn't right
      return;
    }

    console.log(`Initializing canvas game: ${game.name} with primary color: ${style.primaryColor}`);

    // --- Game Initialization Placeholder ---
    // TODO: Instantiate the actual game logic class here, passing the style object
    // Example: const gameInstance = new SpecificCanvasGame(context, style, userHandle);
    // TODO: Set up game loop (requestAnimationFrame)
    // TODO: Add event listeners (keyboard, mouse)
    // TODO: Call gameInstance.update() and gameInstance.draw() in the loop

    // Placeholder drawing to show it's working
    context.fillStyle = style.backgroundColor;
    context.fillRect(0, 0, canvas.width, canvas.height); // Clear with background color

    context.fillStyle = style.primaryColor;
    context.font = `${style.fontSize}px ${style.fontFamily}`;
    context.fillText(`Loading ${game.name}...`, 10, 20 + style.fontSize);
    context.fillText(`Style Primary: ${style.primaryColor}`, 10, 40 + style.fontSize * 2);
    context.fillText(`Press Q to Quit (placeholder)`, 10, 60 + style.fontSize * 3);

    // --- Input Handling Placeholder ---
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === 'q') {
        onQuit();
      }
      // TODO: Pass other keys to the gameInstance
    };

    window.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      console.log(`Cleaning up canvas game: ${game.name}`);
      window.removeEventListener('keydown', handleKeyDown);
      // TODO: Stop game loop
      // TODO: Clean up game instance resources
    };

  }, [gameId, userHandle, style, onQuit]); // Use style in dependencies

  return (
    <canvas
      ref={canvasRef}
      width={800} // Example fixed size, can be dynamic
      height={600}
      className="w-full h-full block" // Ensure it fills the container
      style={{ backgroundColor: style.backgroundColor }}
    />
  );
};

export default GameCanvas; 