# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VitraGlassControl is a specialized React + TypeScript + Vite application for managing glass panels and window configurations ("Учет витражей со стеклопакетами"). This is not a standard template but a custom graphics-heavy application with drawing capabilities for architectural glass design.

The application serves multiple departments (УОК, Снабжение, Гарантия) with role-based access to different features. Construction objects are managed centrally with Supabase backend integration.

## Development Commands

- **Start development server**: `npm run dev` - Starts Vite dev server with HMR
- **Build for production**: `npm run build` - TypeScript compilation followed by Vite build
- **Lint code**: `npm run lint` - Run ESLint on all files
- **Preview production build**: `npm run preview` - Preview the production build locally

**Note**: This project does not currently have a testing framework configured. When adding tests, consider using Vitest (recommended for Vite projects) or Jest.

## Application Architecture

### Routing Structure
The application uses React Router with a three-level navigation hierarchy:
1. **Home Route** (`/`) - Object selection landing page (MainPage component)
2. **Object Route** (`/object/:id`) - Department selection page for specific object (ObjectPage component)
3. **Department Route** (`/object/:id/department/:department/:section`) - Department-specific workspace with sidebar navigation (Layout component)

**URL Parameters:**
- `:id` - Supabase object UUID
- `:department` - Department type: `УОК`, `Снабжение`, or `Гарантия`
- `:section` - Active menu section (e.g., `vitrage-visualizer`, `order-form`, `specification-new`)

### Core Structure
- `src/App.tsx` - React Router configuration with route definitions
- `src/components/Layout.tsx` - Main workspace shell with department-specific sidebar navigation
- `src/components/MainContent.tsx` - Content router that renders section components based on active menu item
- `src/components/MainPage.tsx` - Object selection landing page with CRUD operations for construction objects
- `src/components/ObjectPage.tsx` - Department selection interface for a specific construction object
- `src/components/VitrageVisualizer/VitrageVisualizer.tsx` - Interactive vitrage visualizer with segment-by-segment editing
- `src/components/GraphicsEditor/GraphicsEditor.tsx` - Legacy canvas-based graphics editor (deprecated, use VitrageVisualizer)
- `src/components/VitrageSpecification/VitrageSpecification.tsx` - Legacy vitrage specification management
- `src/components/VitrageSpecificationNew/VitrageSpecificationNew.tsx` - Modern vitrage library and specification management
- `src/components/DefectTracking/DefectTracking.tsx` - Defect tracking system for vitrages
- `src/components/FloorPlanEditor/FloorPlanEditor.tsx` - Floor plan editor for placing vitrages on building plans
- `src/components/FacadePlanEditor/FacadePlanEditor.tsx` - Facade plan editor for placing vitrages on facade plans
- `src/lib/supabase.ts` - Supabase client configuration
- `src/services/objectStorage.ts` - Storage service with Supabase + localStorage fallback
- `src/types/database.ts` - TypeScript types for Supabase database schema

### Department-Based Navigation
The application uses a multi-department workflow with context-aware menus:

**Initial Flow**: MainPage → Department Selection → Department-Specific Menu

**Three Department Types**:
1. **УОК (Отдел УОК)** - Full access to:
   - `vitrage-visualizer` - Interactive vitrage visualizer with segment editing
   - `specification-new` - Vitrage specification library and management
   - `defect-tracking` - Defect tracking for vitrages
   - `floor-plans` - Floor plan editor for placing vitrages on building plans
   - `facade-plans` - Facade plan editor for placing vitrages on facade plans
   - `support` - Support information
   - `settings` - Settings
   - `admin` - Administration

2. **Снабжение (Отдел снабжения)** - Supply department with:
   - `order-form` - Order form
   - `support` - Support
   - `settings` - Settings

3. **Гарантия (Гарантийный отдел)** - Warranty department with:
   - `order-form` - Order form
   - `support` - Support
   - `settings` - Settings

### Application Workflow
1. **Object Management** (MainPage) - Users create/edit/select construction objects
2. **Department Selection** (ObjectPage) - Select department (УОК/Снабжение/Гарантия) for the object
3. **Department Workspace** (Layout + sections) - Access department-specific tools and features
4. **Navigation** - URL parameters maintain context throughout the session

### Key Features

**1. Object Management System** (MainPage):
- Create/edit/delete construction objects (projects)
- Object properties: name, customer, address, corpus count, photo
- Department-based access control (УОК, Снабжение, Гарантия)
- Card-based grid layout with visual previews
- Automatic fallback to localStorage when Supabase unavailable
- Real-time sync with Supabase when available

**2. Department Selection** (ObjectPage):
- View object details loaded from storage (Supabase or localStorage)
- Three department cards: УОК, Снабжение, Гарантия
- Navigate to department workspace with object context in URL
- Department-specific default sections

**3. Vitrage Visualizer**:
- Interactive segment-by-segment vitrage editor
- Grid-based creation with configurable rows and columns
- Individual segment property editing (width, height, type, formula)
- Real-time position recalculation based on segment dimensions
- Visual canvas rendering with segment selection
- Save/load functionality for vitrage configurations

**4. Graphics Editor (Legacy)**:
- Canvas-based drawing tool (deprecated, use VitrageVisualizer)
- Grid-based vitrage creation system
- Drawing tools (select, glass unit creation, profile creation)
- Click-to-edit dimensions and properties
- Segment merging for complex configurations
- Profile rendering with intelligent intersections

**5. Floor Plan Editor**:
- Canvas-based editor for architectural plans
- Import floor plan images as background reference
- Place vitrages from specification library onto floor plans
- Individual vitrage scaling with Shift + mouse wheel (10% to 300%)
- Rotate vitrages 90 degrees
- Drag and drop vitrages with rotation support
- Grid visualization for all vitrages showing segment layout
- Segment ID system with 8-component structure for tracking
- Organize plans by building (corpus), section, and floor
- Auto-save functionality with unsaved changes indicator

**6. Facade Plan Editor**:
- Canvas-based editor for facade plans
- Import background images as reference
- Background image scaling with Shift + wheel (zoom to cursor)
- Background panning with middle mouse button
- Individual vitrage scaling with Shift + wheel when selected
- Vitrages anchored to background image position
- Place vitrages from specification library
- Rotate vitrages 90 degrees
- Organize by building (corpus), section, and floor
- Auto-save to localStorage

**7. Multi-language Support**: Russian interface for architectural/construction terminology

**8. Hybrid Storage**: Supabase backend for shared objects + localStorage for user-specific data with automatic fallback

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

### ProjectObject Interface
Located in `src/components/MainPage.tsx`

```typescript
interface ProjectObject {
  id: string                  // UUID from Supabase or localStorage
  name: string                // Construction object name
  customer: string            // Customer/client name
  address: string             // Physical address
  buildingsCount: number      // Number of buildings/corpus
  image?: string              // Base64 encoded image data
  createdAt: Date
  updatedAt: Date
}
```

This represents construction objects stored in Supabase `objects` table or localStorage fallback. Objects are the top-level organizational unit in the application.

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
Located in `src/components/FloorPlanEditor/FloorPlanEditor.tsx` and `src/components/FacadePlanEditor/FacadePlanEditor.tsx`

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

### FacadePlan Interface
Located in `src/components/FacadePlanEditor/FacadePlanEditor.tsx`

```typescript
interface FacadePlan {
  id: string
  name: string
  corpus: string              // Building name/number
  section: string             // Building section
  floor: number               // Floor number
  walls: Wall[]               // Wall definitions
  rooms: Room[]               // Room definitions (future use)
  placedVitrages: PlacedVitrage[] // Vitrages placed on facade plan
  scale: number               // mm per pixel
  backgroundImage?: string    // Base64 image data
  backgroundOpacity?: number
  backgroundScale?: number    // Background image scale factor
  createdAt: Date
  updatedAt: Date
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

The project uses Supabase for backend storage with automatic localStorage fallback:
- **Supabase Client**: Database connection configured via `src/lib/supabase.ts`
- **Storage Service**: `src/services/objectStorage.ts` - Automatic fallback to localStorage when Supabase unavailable
- **Environment Variables**: Stored in `.env` file (gitignored)
  - `VITE_SUPABASE_URL`: Project URL
  - `VITE_SUPABASE_ANON_KEY`: Public anonymous key
- **Type Safety**: Environment variables are typed in `src/vite-env.d.ts`
- **Storage Architecture**:
  - **Supabase (preferred)**: Construction objects (shared across all users)
  - **localStorage (fallback)**: Automatic fallback for objects when Supabase unavailable
  - **localStorage (primary)**: Vitrages, floor plans, facade plans (per-browser storage)
- **Important**: Never commit `.env` files with real credentials to the repository
- **Database Setup**: Run migrations from `supabase/migrations/` via Supabase SQL Editor (see `supabase/README.md`)

## Repository Structure

**Note**: This repository contains an embedded `VitraGlassControl-VGC-` directory which appears to be a nested copy of the same project. When working with files, ensure you're modifying the correct instance at the root level unless specifically working with the embedded version.

## Data Flow and Storage

The application uses **hybrid storage with automatic fallback**:

### Browser localStorage (Client-side)
- **Objects (fallback)**: Stored under key `'project-objects'` when Supabase unavailable
- **Vitrages**: Stored under key `'saved-vitrages'` as JSON array of VitrageGrid objects
- **Floor Plans**: Stored under key `'floorPlans'` as JSON array of FloorPlan objects
- **Facade Plans**: Stored under key `'facadePlans'` as JSON array of FacadePlan objects

### Supabase Database (Server-side)
- **Objects Table**: Stores construction objects with shared access for all users
  - Schema: `id`, `name`, `customer`, `address`, `corpus_count`, `photo_url`, `created_at`, `updated_at`
  - Location: `supabase/migrations/001_create_objects_table.sql`
  - Types: `src/types/database.ts` - TypeScript types for Database schema
  - Access: Public read/write with Row Level Security enabled
  - Client: `src/lib/supabase.ts` - Supabase client configuration
  - Service: `src/services/objectStorage.ts` - Handles Supabase with localStorage fallback
  - Migration instructions: See `supabase/README.md`

### Data Sharing Between Components
- **MainPage/ObjectPage/Layout** → **objectStorage**: All object operations go through storage service with automatic fallback
- **objectStorage** → **Supabase or localStorage**: Automatic selection based on availability
- **Vitrage Visualizer** → **Vitrage Specification**: Vitrages created in visualizer are saved to localStorage
- **Graphics Editor** → **Vitrage Specification**: Legacy editor also saves to same localStorage key (deprecated)
- **Vitrage Specification** → **Floor/Facade Plan Editors**: Plan editors load vitrages from localStorage to place on plans
- **Floor/Facade Plan Editors**: Maintain separate localStorage keys for plans with references to vitrage IDs
- Changes to data models may require clearing browser localStorage during development

### Important Notes
- **Automatic Fallback**: Application automatically switches to localStorage if Supabase is unavailable (network issues, server down, etc.)
- **Console Notifications**: When using localStorage fallback, console shows "📦 Using localStorage fallback (Supabase unavailable)"
- **Individual Vitrage Scaling**: Each placed vitrage on floor/facade plans has its own `scale` property (0.1 to 5.0)
- **No Global Canvas Zoom**: Floor plan editor removed global zoom to avoid conflicts with individual vitrage scaling
- **Background Anchoring**: Facade plan editor anchors vitrages to background image position accounting for offset and scale
- **Rotation Hit Detection**: Special coordinate transformation for detecting clicks on rotated vitrages
- **Grid Visibility**: All vitrages display segment grid lines at all times for clarity
- **Passive Event Listener Fix**: Native wheel event listener used with `{ passive: false }` to prevent browser warnings

### Data Model Differences
There are currently two separate vitrage creation systems:
1. **VitrageVisualizer**: Uses segment-based model with position recalculation
2. **GraphicsEditor**: Uses canvas-based model with merged segments
Both save to the same localStorage key but have different internal structures

## Development Workflow

When making changes to the application:
1. Run `npm run lint` to check code quality
2. Start the development server with `npm run dev` to test changes
3. Build the project with `npm run build` to verify production compatibility
4. If modifying data models, test with fresh localStorage or provide migration logic

## Important Instructions

### General Development
- **File Operations**: ALWAYS prefer editing existing files over creating new ones. This is a mature codebase with established patterns.
- **Component Duplication**: Be aware of legacy components:
  - Use `VitrageVisualizer` instead of `GraphicsEditor` for new vitrage work
  - Use `VitrageSpecificationNew` instead of `VitrageSpecification` for specification management
- **Data Persistence**: Hybrid storage model with automatic fallback:
  - Supabase for shared objects (with localStorage fallback)
  - localStorage for user-specific data (vitrages, plans)
  - Consider data migration when changing interfaces
- **Russian UI**: Maintain Russian language for all user-facing text and architectural terminology.
- **Canvas Work**: Both editors use HTML5 Canvas with different rendering approaches - study existing code before modifications.
- **Testing**: No testing framework currently configured. Test manually in browser during development.

### Architecture-Specific
- **Routing**: Navigation uses React Router with URL parameters for state management. Always use `navigate()` for programmatic navigation instead of manipulating state directly.
- **Department Context**: Application flow starts with object selection, then department selection, then department-specific tools. Components may need to be department-aware. Check URL parameters for current department when needed.
- **Storage Service**: All object CRUD operations go through `src/services/objectStorage.ts` which handles automatic fallback
- **Supabase Integration**: objectStorage service tries Supabase first, falls back to localStorage automatically on any error

### Common Patterns
- **Object CRUD**: All object operations use `objectStorage` service (not direct Supabase calls)
- **Modal Dialogs**: Use modal overlay pattern from MainPage/ObjectPage for consistency
- **Navigation Flow**: Object selection → Department selection → Department workspace
- **State Management**: URL parameters are the source of truth for navigation state
- **Error Handling**: Storage service handles errors gracefully with automatic fallback
