export interface Theme {
  name: string;
  displayName: string;
  bg: string; // Tailwind background class
  text: string; // Tailwind text class
  placeholder: string; // Tailwind placeholder class
}

export const themes: Theme[] = [
  {
    name: 'green',
    displayName: 'CRT Green',
    bg: 'bg-black',
    text: 'text-green-500',
    placeholder: 'placeholder-green-700',
  },
  {
    name: 'amber',
    displayName: 'Amber Glow',
    bg: 'bg-black',
    text: 'text-amber-400',
    placeholder: 'placeholder-amber-600',
  },
  {
    name: 'white',
    displayName: 'Obsidian White',
    bg: 'bg-black',
    text: 'text-gray-200',
    placeholder: 'placeholder-gray-400',
  },
  // Add more themes here if needed
];

export const defaultTheme = themes[0]; // CRT Green

export const findTheme = (name: string): Theme | undefined => {
  return themes.find(theme => theme.name.toLowerCase() === name.toLowerCase());
}; 