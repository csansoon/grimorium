# Grimoire

A Progressive Web App built with Vite, React, TypeScript, and Tailwind CSS.

## Features

- ⚡️ Vite for fast development and optimized builds
- ⚛️ React 18 with TypeScript
- 🎨 Tailwind CSS for styling
- 📱 PWA support with offline capability
- 🔥 Hot Module Replacement (HMR)
- 📦 Optimized production build

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
pnpm build
```

### Preview Production Build

```bash
pnpm preview
```

### Type Check

```bash
pnpm tc
```

## PWA Features

This app is configured as a Progressive Web App with:
- Service Worker for offline support
- Automatic updates
- Installable on mobile and desktop
- App manifest for native-like experience

## Tech Stack

- **Vite** - Next generation frontend tooling
- **React** - A JavaScript library for building user interfaces
- **TypeScript** - Typed superset of JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **vite-plugin-pwa** - Zero-config PWA plugin for Vite

## Project Structure

```
grimoire/
├── src/
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Application entry point
│   ├── index.css        # Global styles with Tailwind directives
│   └── vite-env.d.ts    # Vite type definitions
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
├── tailwind.config.js   # Tailwind CSS configuration
├── postcss.config.js    # PostCSS configuration
├── tsconfig.json        # TypeScript configuration
└── package.json         # Project dependencies and scripts
```

## Plan:
 - First, build a prototype with three simple roles:
    - Priest (can select one player to be protected from the Imp during this night)
    - Imp (selects a player to die each night)
    - Villager (can select one player to see its role)
  This prototype should have the following mechanics and features:
    - Game creation
    - Game state persisted in local storage
    - Game runs based on state changes
    - Night phase
    - End conditions

 - Then, actual UI components that get dynamically rendered based on the roles, effects and overall game state.
    This may require creating a component library.

 - After a prototype is built, we can start adding actual roles and Effects.
    First, we should add only roles with simple scripts that run only on the night phase.

 - After that, we can start building a day phase:
    - Voting mechanics
    - Actions that can be done from some roles during the day phase (like Hunter's)

 - Finally, think how to implement some of the hardest roles and effects. Leave to the end:
    - Poisoined (Effect)
    - Drunk (Role)

## License

MIT

