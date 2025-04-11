import { Theme } from './themes';

/**
 * Defines the visual style properties for canvas-based games.
 */
export interface CanvasGameStyle {
  primaryColor: string;    // Primary color for drawing (text, player elements, etc.)
  backgroundColor: string; // Background color for the canvas
  fontFamily: string;      // Font family for rendering text on canvas
  fontSize: number;        // Base font size
  // Add more properties as needed (e.g., accentColor, lineWidth)
}

/**
 * Maps a terminal Theme object to a specific CanvasGameStyle.
 * This enforces that canvas games visually match the selected terminal theme.
 */
export function mapThemeToCanvasStyle(theme: Theme): CanvasGameStyle {
  // Derive the primary color from the theme's RGB values
  const primaryColor = `rgb(${theme.baseTextColorRGB.join(', ')})`;

  // For now, use a fixed black background for canvas, could be theme.bg later if needed
  const backgroundColor = '#000000'; 

  // Use a standard monospace font
  const fontFamily = 'monospace';
  const fontSize = 16; // Default font size

  return {
    primaryColor,
    backgroundColor,
    fontFamily,
    fontSize,
  };
}

// Example of creating a default style if needed (e.g., if theme mapping fails)
// export const defaultCanvasStyle: CanvasGameStyle = {
//   primaryColor: 'rgb(33, 255, 33)', // Default to green
//   backgroundColor: '#000000',
//   fontFamily: 'monospace',
//   fontSize: 16,
// }; 