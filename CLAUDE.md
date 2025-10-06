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
- `src/components/VitrageVisualizer/VitrageVisualizer.tsx` - Interactive vitrage creation and segment editing tool
- `src/components/GraphicsEditor/GraphicsEditor.tsx` - Legacy canvas-based graphics editor (deprecated, use VitrageVisualizer)
- `src/components/VitrageSpecification/VitrageSpecification.tsx` - Vitrage library and specification management
- `src/components/FloorPlanEditor/FloorPlanEditor.tsx` - Floor plan editor for placing vitrages on building plans

### Navigation Sections
The sidebar provides access to 7 main sections:
1. **Визуализатор Витража** - Interactive vitrage creation and segment editing tool
2. **Спецификация витражей** - Vitrage specification library and management
3. **План этажей** - Floor plan editor for placing vitrages on floor plans
4. **Планы фасадов** - Facade plan editor (placeholder)
5. **Поддержка** - Support information
6. **Настройки** - Settings
7. **Администрирование** - Administration

### Key Features
1. **Sidebar Navigation**: 7 main sections including vitrage visualizer, specification, floor plans, facade plans, support, settings, and administration
2. **Vitrage Visualizer**: Interactive form-based vitrage creation tool with:
   - Grid-based vitrage creation by specifying horizontal and vertical segments
   - Individual segment property editing (type, width, height, formula)
   - Visual preview with color-coded segment types
   - Segment selection and modification
   - Save and manage multiple vitrage configurations
   - Real-time dimension calculations and total size display
3. **Floor Plan Editor**: Canvas-based editor for architectural plans with:
   - Import floor plan images as background reference
   - Place vitrages from specification library onto floor plans
   - Individual vitrage scaling with Shift + mouse wheel (10% to 300%)
   - Rotate vitrages 90 degrees
   - Drag and drop vitrages with rotation support
   - Grid visualization for all vitrages showing segment layout
   - Organize plans by building (corpus), section, and floor
   - Auto-save functionality with unsaved changes indicator
4. **Multi-language Support**: Russian interface for architectural/construction terminology
5. **Local Storage Persistence**: All vitrages and floor plans are saved to browser localStorage

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
  scale: number               // Individual vitrage scale factor (0.1 to 3.0)
}
```

### Vitrage Visualizer Data Model
Located in `src/components/VitrageVisualizer/VitrageVisualizer.tsx`

```typescript
interface Segment {
  id: string
  row: number, col: number
  width: number, height: number        // In millimeters
  positionX: number, positionY: number // Canvas coordinates
  fillType: string                     // glass, ventilation, door, etc.
  formula: string                      // Glass formula (e.g., "4М1-16-4М1")
  selected: boolean
}

interface VitrageConfig {
  marking: string                      // Vitrage name/identifier
  horizontalSegments: number
  verticalSegments: number
  segments: Segment[][]               // 2D array of segments
  totalWidth: number
  totalHeight: number
}
```

## Working with the Vitrage Visualizer
- Located in `src/components/VitrageVisualizer/VitrageVisualizer.tsx`
- Form-based vitrage creation with visual preview
- Create vitrages by specifying grid dimensions (horizontal × vertical segments)
- Click segments to select and edit individual properties
- Real-time position recalculation when segment dimensions change
- Visual feedback with color-coded segment types
- Export vitrages to localStorage for use in Floor Plan Editor

### Key Features
- **Segment Types**: glass (default), ventilation, door, empty, sandwich, casement
- **Interactive Editing**: Click segments to select, edit width/height/formula in properties panel
- **Dimension System**: All dimensions in millimeters with automatic total size calculation
- **Visual Preview**: Canvas rendering with grid lines and color-coded segment types
- **Position Recalculation**: Automatic repositioning of all segments when dimensions change

## Working with the Floor Plan Editor
- Located in `src/components/FloorPlanEditor/FloorPlanEditor.tsx`
- Uses HTML5 Canvas for rendering floor plans and placed vitrages
- Import background images (PNG, JPG) as floor plan reference
- Place vitrages from specification library with drag-and-drop
- Individual vitrage scaling: Shift + mouse wheel over vitrage (no global canvas zoom)
- Rotate vitrages 90 degrees with button in properties panel
- Grid visualization shows segment layout for all vitrages
- Auto-save with 2-second debounce after changes
- Filter and organize plans by corpus/section/floor

### Key Interactions
- **Place Vitrage**: Click "Добавить витраж" → Select from library → Click on plan
- **Move Vitrage**: Click and drag vitrage to new position
- **Scale Vitrage**: Hover over vitrage + Shift + mouse wheel (10-300%)
- **Rotate Vitrage**: Select vitrage → Click "Повернуть на 90°"
- **Delete Vitrage**: Select vitrage → Press Delete key
- **Pan Canvas**: Middle mouse button + drag (zoom removed, panning kept for navigation)

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
- **Vitrage Visualizer** → **Vitrage Specification**: Vitrages created in visualizer are saved to localStorage
- **Graphics Editor** → **Vitrage Specification**: Legacy editor also saves to same localStorage key (deprecated)
- **Vitrage Specification** → **Floor Plan Editor**: Floor plan editor loads vitrages from localStorage to place on plans
- **Floor Plan Editor**: Maintains separate localStorage key for floor plans with references to vitrage IDs
- Changes to data models may require clearing browser localStorage during development

### Important Notes
- **Individual Vitrage Scaling**: Each placed vitrage on floor plans has its own `scale` property (0.1 to 3.0)
- **No Global Canvas Zoom**: Floor plan editor removed global zoom to avoid conflicts with individual vitrage scaling
- **Rotation Hit Detection**: Special coordinate transformation for detecting clicks on rotated vitrages
- **Grid Visibility**: All vitrages display segment grid lines at all times for clarity

## Development Workflow

When making changes to the application:
1. Run `npm run lint` to check code quality
2. Start the development server with `npm run dev` to test changes
3. Build the project with `npm run build` to verify production compatibility
4. If modifying data models, test with fresh localStorage or provide migration logic