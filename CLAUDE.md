# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- **Development server**: `npm run dev` - Starts Vite dev server with HMR
- **Build**: `npm run build` - TypeScript compilation followed by Vite production build
- **Lint**: `npm run lint` - ESLint with TypeScript support
- **Preview**: `npm run preview` - Preview production build locally

## Architecture

This is a React + TypeScript + Vite project with a minimal setup:

- **Build tool**: Vite with @vitejs/plugin-react for Fast Refresh
- **TypeScript**: Configured with project references (tsconfig.app.json for app code, tsconfig.node.json for build tools)
- **Linting**: Modern ESLint flat config with TypeScript, React Hooks, and React Refresh rules
- **Entry point**: src/main.tsx renders the App component with React StrictMode
- **Main component**: src/App.tsx contains the basic Vite + React template with counter example

The project uses React 19 with modern patterns including functional components and hooks.