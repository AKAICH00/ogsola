export interface Theme {
  name: string;
  displayName: string;
  bg: string; // Tailwind background class
  text: string; // Tailwind text class
  baseTextColorRGB: [number, number, number]; // Base RGB for dynamic brightness
  placeholder: string; // Tailwind placeholder class
}

export const themes: Theme[] = [
  {
    name: 'green',
    displayName: 'CRT Green',
    bg: 'bg-black',
    text: 'text-green-500', // Base class, might be overridden by style
    baseTextColorRGB: [33, 255, 33], // Classic Green phosphor (#21FF21)
    placeholder: 'placeholder-green-700',
  },
  {
    name: 'amber',
    displayName: 'Amber Glow',
    bg: 'bg-black',
    text: 'text-amber-400',
    baseTextColorRGB: [255, 176, 0], // Amber/Orange like Toshiba terminals (#FFB000)
    placeholder: 'placeholder-amber-600',
  },
  {
    name: 'white',
    displayName: 'Obsidian White',
    bg: 'bg-black',
    text: 'text-gray-200',
    baseTextColorRGB: [220, 220, 220], // Obsidian White
    placeholder: 'placeholder-gray-400',
  },
  {
    name: 'blue',
    displayName: 'P4 Blue',
    bg: 'bg-black',
    text: 'text-blue-400',
    baseTextColorRGB: [100, 180, 255], // P4/Early LCD bluish display (#64B4FF)
    placeholder: 'placeholder-blue-600',
  },
  // Add more themes here if needed
];

export const defaultTheme = themes[0]; // CRT Green

export const findTheme = (name: string): Theme | undefined => {
  return themes.find(theme => theme.name.toLowerCase() === name.toLowerCase());
}; 