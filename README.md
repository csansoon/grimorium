# The Grimoire

> Every Storyteller needs a Grimoire.

A companion app for **Blood on the Clocktower** that handles the clockwork so you can focus on the story.

The Grimoire walks you through every phase of the game — role revelation, night actions, day discussion, nominations, voting, and game-over — so you never lose track of what happens next.

**Currently supports:** Trouble Brewing

## Features

- Step-by-step night phase guidance for every role
- Full player state tracking — roles, effects, and abilities
- Handles complex interactions automatically — kills, protections, redirects, and more
- Supports perception and deception mechanics (Recluse, Drunk, Poisoner...)
- Day phase with nominations, voting, and day abilities
- Win condition detection for both core and special conditions
- Works offline as an installable PWA — no internet needed at the table
- English and Spanish localization

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
pnpm dev
```

### Build for Production

```bash
pnpm build
```

### Run Tests

```bash
pnpm test
```

## Tech Stack

- **React 18** + **TypeScript**
- **Vite** — fast builds and HMR
- **Tailwind CSS** + **Radix UI** — styling and accessible primitives
- **PWA** — offline support, installable on mobile and desktop

## License

MIT
