# WiserPin

WiserPin is a Chrome extension and web platform that helps you pin and summarize content from websites into themed Collections.

## 🎥 Demo

- **Live Demo:** [https://app.wiserpin.com](https://app.wiserpin.com)
- **Video Demo:** [https://youtu.be/ZN7SGF9fu58](https://youtu.be/ZN7SGF9fu58)

## Project Structure

This is a monorepo managed with pnpm workspaces and Turborepo.

```
wiserpin/
├── apps/
│   ├── extension/    # Chrome extension (MV3)
│   ├── web/          # Web dashboard
│   └── api/          # Backend API
├── packages/
│   ├── ui/           # Shared UI components (shadcn/ui)
│   ├── core/         # Shared types and interfaces
│   ├── storage/      # IndexedDB storage layer
│   ├── prompts/      # Summarization logic
│   ├── eslint-config/
│   └── tsconfig/
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm >= 8.0.0

### Installation

```bash
pnpm install
```

### Development

```bash
# Run all apps in dev mode
pnpm dev

# Build all packages and apps
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint
```

## Tech Stack

- **TypeScript** - Language
- **React** - UI framework
- **shadcn/ui** - UI components
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Turborepo** - Monorepo management
- **pnpm** - Package manager
- **IndexedDB** - Local storage (extension)
