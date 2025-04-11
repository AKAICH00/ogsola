This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

# Developer Guide: Building Visually-Focused ASCII Games with HTML5 Canvas

## Overview

This guide is a comprehensive developer reference for building top-tier ASCII-style games using **JavaScript**, **HTML5 Canvas**, and simulated **C terminals**. It is intended for agentic developers recreating beloved ASCII classics—roguelikes, terminal-based arcade games, and ASCII art adventures—while maintaining visual fidelity and performance.

The focus is on:
- ASCII visual representation (not full gameplay systems)
- HTML5 canvas rendering of ASCII characters
- UI layout, menus, and retro terminal effects
- Usage of pre-made ASCII assets from sources like [asciiart.eu](https://www.asciiart.eu)

---

## 📚 ASCII Art Resources

**Main Source:** https://www.asciiart.eu

You can use:
- **Pre-made assets** from categories (dragons, spaceships, scenes, etc.)
- **Text-to-ASCII converters** for logos
- **Tools** like image-to-ASCII or webcam-to-ASCII for custom content

Use `<pre>` tags or `ctx.fillText()` with `monospace` fonts for accurate rendering.

```html
<pre style="font-family: monospace">
  /\_/\
 ( o.o )
  > ^ <
</pre>
```

## 🧱 ASCII Symbol Standards (Game Component Mapping)

| Component | ASCII Symbol | Notes |
|-----------|--------------|-------|
| Player | @ | Universal symbol for the player |
| Enemy (generic) | a-z, A-Z | Use first letter of enemy type |
| Wall | #, █ | Use █ for blocky visuals |
| Floor | . or   | Dot for visible floor, space for empty |
| Door (closed) | + | Common for closed doors |
| Door (open) | ' or / | Open paths |
| Stairs | > / < | Down / up stairs |
| Treasure | $ | Coins or loot |
| Potion | ! | Quick visual recognition |
| Weapon | ) or / | Curved or slash symbol |
| Armor | ] | Suggestive of bracers or shields |
| Trap | ^ | Pointed hazard |
| Water | ~ | Wavy lines |
| Bush/Tree | %, ♣ | Organic shapes |

## 🖼️ Rendering ASCII in HTML5 Canvas

### Setup

```javascript
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
ctx.font = "16px Courier New, monospace";
ctx.textBaseline = "top";
```

### Drawing a 2D Map

```javascript
const map = [
  "########",
  "#@..G..#",
  "#..##..#",
  "#...^..#",
  "########"
];

const charWidth = 10;
const charHeight = 16;

for (let y = 0; y < map.length; y++) {
  for (let x = 0; x < map[y].length; x++) {
    const ch = map[y][x];
    ctx.fillStyle = {
      '@': '#fff',
      'G': '#0f0',
      '^': '#f00',
    }[ch] || '#ccc';

    ctx.fillText(ch, x * charWidth, y * charHeight);
  }
}
```

## 🖥️ Simulating Terminal Effects

- **Blinking Cursor**: Alternate _ visibility with setInterval()
- **Scanlines**: Overlay <div> with animated CSS gradient
- **CRT Flicker**: Flash semi-transparent dark overlays briefly
- **Shadow Text**: Draw black text first, then offset white

```css
.scanlines {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: repeating-linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0) 0px,
    rgba(0, 0, 0, 0.1) 2px,
    rgba(0, 0, 0, 0.15) 4px
  );
  pointer-events: none;
}
```

## 🧩 UI Components

### Box Drawing

```javascript
function drawBox(x, y, w, h) {
  ctx.fillText("+" + "-".repeat(w-2) + "+", x, y);
  for (let i = 1; i < h-1; i++) {
    ctx.fillText("|", x, y + i * charHeight);
    ctx.fillText("|", x + (w-1) * charWidth, y + i * charHeight);
  }
  ctx.fillText("+" + "-".repeat(w-2) + "+", x, y + (h-1) * charHeight);
}
```

### Menu Selection

```javascript
const menuItems = ["Start Game", "Options", "Quit"];
let selectedIndex = 0;

function drawMenu() {
  for (let i = 0; i < menuItems.length; i++) {
    ctx.fillStyle = i === selectedIndex ? "#ff0" : "#fff";
    const prefix = i === selectedIndex ? "> " : "  ";
    ctx.fillText(prefix + menuItems[i], 10, 100 + i * 20);
  }
}
```

## 📈 Status Bars and Stats

```javascript
function makeBar(current, max, width) {
  const fillCount = Math.round((current / max) * width);
  return "[" + "#".repeat(fillCount) + "-".repeat(width - fillCount) + "]";
}

ctx.fillText("HP " + makeBar(8, 10, 10), 10, 200);
```

## 🧠 Best Practices

- Use monospace fonts or bitmap sprite sheets
- Keep symbols consistent and easily recognizable
- Use limited colors for retro vibes or ANSI themes
- Apply layering for visual depth (draw shadows or backgrounds)
- Integrate particle effects (e.g., *, ., ~ with random flicker)
- Test at different resolutions with pixel-perfect scaling
- Create art using tools like REXPaint or online ASCII editors

## 🔧 Helpful Libraries

- **ROT.js** – Roguelike toolkit for JS (map generation, display, etc.)
- **REXPaint** – The gold standard for creating ASCII UIs and sprites
- **asciiart.eu** – Large categorized collection of prebuilt ASCII scenes

## 📂 Suggested File Structure

```
ascii-game/
├── public/
│   ├── sprites/
│   └── fonts/
├── src/
│   ├── engine/
│   ├── rendering/
│   ├── ui/
│   └── scenes/
├── assets/
│   └── ascii/
│       ├── splash.txt
│       └── goblin.txt
├── index.html
├── game.js
└── styles.css
```

## 🎉 Final Thoughts

ASCII is more than a style—it's a statement. This guide arms you with all the visual and rendering knowledge needed to craft ASCII simulations that honor the classics and push the style forward in the browser era.

Happy building!
