# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- `npm run dev` - Start development server with HMR (Hot Module Replacement)
- `npm run build` - Build for production (runs TypeScript compiler then Vite build)
- `npm run lint` - Run ESLint on codebase
- `npm run preview` - Preview production build locally

## Project Architecture

This is a React 19 + TypeScript + Vite application with the following structure:

### Core Technologies
- **React 19** with TypeScript for UI components
- **Vite** as build tool and dev server with React plugin
- **ESLint** with TypeScript, React Hooks, and React Refresh plugins for code quality

### TypeScript Configuration
- Uses project references with separate configs for app (`tsconfig.app.json`) and build tools (`tsconfig.node.json`)
- Strict TypeScript settings with modern ES2022 target
- React JSX transform enabled
- Bundler module resolution for Vite compatibility

### Source Structure
- `src/main.tsx` - Application entry point with React 19's `createRoot`
- `src/App.tsx` - Main application component
- `src/assets/` - Static assets like images and SVGs
- `public/` - Public static files served directly

### Development Notes
- Uses React 19's StrictMode for development checks
- Hot Module Replacement (HMR) enabled for fast development iteration
- ESLint configured for modern React patterns with hooks rules and React Refresh
- No testing framework currently configured

## Project Rules

1. **Database Security**: Never create or work with Row Level Security (RLS) policies. RLS functionality should be disabled.
2. **File Size**: Keep all files under 600 lines. Split larger files into smaller, focused modules.
3. **Logging**: All user actions on the portal must be logged to the console for debugging and monitoring purposes.