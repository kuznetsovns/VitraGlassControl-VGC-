# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VitraGlassControl is a specialized React + TypeScript + Vite application for managing glass panels and window configurations ("Учет витражей со стеклопакетами"). This is not a standard template but a custom graphics-heavy application with drawing capabilities for architectural glass design.

## Development Commands

- **Start development server**: `npm run dev` - Starts Vite dev server with HMR
- **Build for production**: `npm run build` - TypeScript compilation followed by Vite build
- **Lint code**: `npm run lint` - Run ESLint on all files
- **Preview production build**: `npm run preview` - Preview the production build locally

**Note**: This project does not currently have a testing framework configured. When adding tests, consider using Vitest (recommended for Vite projects) or Jest.

## Application Architecture

### Core Structure
- `src/App.tsx` - Entry point that renders the Layout component
- `src/components/Layout.tsx` - Main application shell with sidebar navigation and content area
- `src/components/MainContent.tsx` - Content router that renders different sections based on active menu item
- `src/components/MainPage.tsx` - Landing page with introduction and workflow information
- `src/components/GraphicsEditor/GraphicsEditor.tsx` - Complex canvas-based graphics editor for drawing glass panels
- `src/components/VitrageSpecification/VitrageSpecification.tsx` - Vitrage library and specification management
- `src/components/FloorPlanEditor/FloorPlanEditor.tsx` - Floor plan editor for placing vitrages on building plans

### Navigation Sections
The sidebar provides access to 7 main sections:
1. **Отрисовка витражей с размерами** - Graphics editor for creating vitrage designs
2. **Спецификация витражей** - Vitrage specification library and management
3. **План этажей** - Floor plan editor for placing vitrages on floor plans
4. **Планы фасадов** - Facade plan editor (placeholder)
5. **Поддержка** - Support information
6. **Настройки** - Settings
7. **Администрирование** - Administration

### Key Features
1. **Graphics Editor**: Interactive HTML5 Canvas for drawing and editing glass units with:
   - Grid-based vitrage creation system
   - Drawing tools (select, glass unit creation, profile creation)
   - Real-time property editing with click-to-edit dimensions
   - Drag-and-drop functionality
   - Segment merging for complex configurations
   - Visual feedback with grid and dimensions
2. **Floor Plan Editor**: Canvas-based editor for architectural plans with:
   - Import floor plan images as background reference
   - Place vitrages from specification library onto floor plans
   - Zoom and pan with Shift+scroll wheel
   - Rotate vitrages 90 degrees
   - Organize plans by building (corpus), section, and floor
   - Auto-save functionality
3. **Multi-language Support**: Russian interface for architectural/construction terminology
4. **Local Storage Persistence**: All vitrages and floor plans are saved to browser localStorage

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
Located in `src/components/GraphicsEditor/GraphicsEditor.tsx`

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
Located in `src/components/GraphicsEditor/GraphicsEditor.tsx`

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

### FloorPlan Interface
Located in `src/components/FloorPlanEditor/FloorPlanEditor.tsx`

```typescript
interface FloorPlan {
  id: string
  name: string
  corpus: string              // Building name/number
  section: string             // Building section
  floor: number               // Floor number
  walls: Wall[]               // Wall definitions (future use)
  rooms: Room[]               // Room definitions (future use)
  placedVitrages: PlacedVitrage[] // Vitrages placed on floor plan
  scale: number               // mm per pixel
  backgroundImage?: string    // Base64 image data
  backgroundOpacity?: number
  createdAt: Date
  updatedAt: Date
}
```

### PlacedVitrage Interface
Located in `src/components/FloorPlanEditor/FloorPlanEditor.tsx`

```typescript
interface PlacedVitrage {
  id: string
  vitrageId: string           // Reference to VitrageGrid
  x: number, y: number        // Position on floor plan
  rotation: number            // 0, 90, 180, 270 degrees
  wallId?: string             // Wall this vitrage is attached to (future use)
  scale: number               // Display scale factor
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

## Environment Configuration

The project uses environment variables stored in `.env`:
- **Supabase Integration**: The application is configured to use Supabase for backend services
- Environment variables are prefixed with `VITE_` to be accessible in the frontend
- **Important**: Never commit real API keys or sensitive credentials to the repository

## Repository Structure

**Note**: This repository contains an embedded `VitraGlassControl-VGC-` directory which appears to be a nested copy of the same project. When working with files, ensure you're modifying the correct instance at the root level unless specifically working with the embedded version.

## Data Flow and Storage

The application uses **browser localStorage** for all data persistence:
- **Vitrages**: Stored under key `'saved-vitrages'` as JSON array of VitrageGrid objects
- **Floor Plans**: Stored under key `'floorPlans'` as JSON array of FloorPlan objects
- **No Backend**: Currently no server-side persistence, all data is client-side only

### Data Sharing Between Components
- **Graphics Editor** → **Vitrage Specification**: Vitrages created in the graphics editor are saved to localStorage
- **Vitrage Specification** → **Floor Plan Editor**: Floor plan editor loads vitrages from localStorage to place on plans
- Changes to data models may require clearing browser localStorage during development

## Development Workflow

When making changes to the application:
1. Run `npm run lint` to check code quality
2. Start the development server with `npm run dev` to test changes
3. Build the project with `npm run build` to verify production compatibility
4. If modifying data models, test with fresh localStorage or provide migration logic