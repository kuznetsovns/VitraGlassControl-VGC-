# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VitraGlassControl is a specialized React + TypeScript + Vite application for managing glass panels and window configurations ("Учет витражей со стеклопакетами"). This is not a standard template but a custom graphics-heavy application with drawing capabilities for architectural glass design.

## Development Commands

- **Start development server**: `npm run dev` - Starts Vite dev server with HMR
- **Build for production**: `npm run build` - TypeScript compilation followed by Vite build
- **Lint code**: `npm run lint` - Run ESLint on all files
- **Preview production build**: `npm run preview` - Preview the production build locally

## Application Architecture

### Core Structure
- `src/App.tsx` - Entry point that renders the Layout component
- `src/components/Layout.tsx` - Main application shell with sidebar navigation and content area
- `src/components/MainContent.tsx` - Content router that renders different sections based on active menu item
- `src/components/GraphicsEditor/` - Complex canvas-based graphics editor for drawing glass panels

### Key Features
1. **Sidebar Navigation**: 7 main sections including vitrage drawing, specification, floor plans, facade plans, support, settings, and administration
2. **Graphics Editor**: Interactive HTML5 Canvas for drawing and editing glass units with:
   - Drawing tools (select, glass unit creation, profile creation)
   - Real-time property editing
   - Drag-and-drop functionality
   - Visual feedback with grid and dimensions
3. **Multi-language Support**: Russian interface for architectural/construction terminology

## TypeScript Configuration

The project uses a multi-config TypeScript setup:
- `tsconfig.json` - Root configuration with project references
- `tsconfig.app.json` - App-specific config with strict linting rules
- `tsconfig.node.json` - Node.js tooling configuration

Key TypeScript settings:
- Strict mode enabled with additional linting rules
- Modern ES2022 target with ESNext modules
- React JSX transform enabled
- Bundler module resolution for Vite compatibility

## Code Quality

ESLint is configured with:
- TypeScript ESLint recommended rules
- React Hooks plugin with latest recommended rules
- React Refresh plugin for Vite compatibility
- Browser globals configured

The project enforces strict TypeScript settings including unused variable detection and no fallthrough cases in switch statements.

## Important Data Models

### VitrageSegment Interface
```typescript
interface VitrageSegment {
  id: string
  row: number, col: number    // Grid position
  x: number, y: number        // Canvas position
  width: number, height: number // Canvas dimensions
  type: 'glass' | 'ventilation' | 'empty' | 'sandwich' | 'casement' | 'door'
  formula?: string            // Element formula (e.g., "4М1-16-4М1")
  label?: string              // Display label (e.g., "G1", "V1")
  realWidth?: number          // Actual dimensions in mm
  realHeight?: number
  merged?: boolean            // For merged segments
  rowSpan?: number, colSpan?: number // Spanning properties
  isStemalit?: boolean        // For glass segments
}
```

### VitrageGrid Interface
```typescript
interface VitrageGrid {
  id: string
  name: string                // Vitrage identifier (e.g., "В-01")
  rows: number, cols: number  // Grid dimensions
  segments: VitrageSegment[]  // All segments in grid
  totalWidth: number, totalHeight: number // Total canvas size
  profileWidth: number        // Frame thickness
  createdAt: Date
}
```

## Working with the Graphics Editor
- Located in `src/components/GraphicsEditor/GraphicsEditor.tsx`
- Uses HTML5 Canvas with React refs for drawing operations
- Grid-based vitrage creation system with configurable rows/columns
- Interactive segment editing with property panels
- Supports segment merging for complex glass configurations
- Real-time dimension editing by clicking on dimension labels
- Canvas coordinates with proportional sizing based on real millimeter dimensions
- Profile system with intelligent intersection handling
- Local storage persistence for saved vitrages

### Key Features
- **Segment Types**: glass, ventilation, empty, sandwich, casement, door
- **Merge Functionality**: Combine adjacent segments with span calculations
- **Dimension System**: Real millimeters converted to proportional canvas coordinates
- **Interactive Editing**: Click dimensions to edit, click segments for properties
- **Profile Rendering**: Automatic frame and intersection drawing