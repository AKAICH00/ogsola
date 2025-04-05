import { useState, useEffect } from 'react';
import { Theme, themes, defaultTheme, findTheme } from '@/lib/themes';

export function useTheme(): [Theme, (themeName: string) => void] {
  const [currentTheme, setCurrentTheme] = useState<Theme>(defaultTheme);

  // Optionally: Load saved theme from localStorage on initial mount
  useEffect(() => {
    const savedThemeName = localStorage.getItem('terminal-theme');
    if (savedThemeName) {
      const theme = findTheme(savedThemeName);
      if (theme) {
        setCurrentTheme(theme);
      }
    }
  }, []);

  const setTheme = (themeName: string) => {
    const theme = findTheme(themeName);
    if (theme) {
      setCurrentTheme(theme);
      // Optionally: Save theme to localStorage
      localStorage.setItem('terminal-theme', theme.name);
    } else {
      console.warn(`Theme "${themeName}" not found.`);
      // Optionally, provide feedback to the user that the theme wasn't found
    }
  };

  return [currentTheme, setTheme];
} 