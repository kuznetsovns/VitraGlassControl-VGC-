# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VitraGlassControl is a React + TypeScript + Vite application for managing architectural glass panels and window configurations ("Учет витражей со стеклопакетами"). This is a graphics-heavy application with HTML5 Canvas drawing capabilities for architectural glass design.

The application serves three departments (УОК, Снабжение, Гарантия) with role-based access. Construction objects are managed with Supabase backend and automatic localStorage fallback.

## Development Commands

```bash
npm run dev      # Start Vite dev server with HMR
npm run build    # TypeScript compilation + Vite build
npm run lint     # Run ESLint
npm run preview  # Preview production build
```

**Note**: No testing framework configured. Test manually in browser.

## Architecture

### Routing (React Router)
```
/                                           → Layout → MainPage (object selection)
/object/:id                                 → ObjectPage (department selection)
/object/:id/department/:department/:section → Layout → MainContent (workspace)
```

**URL Parameters:**
- `:id` - Object UUID
- `:department` - `УОК`, `Снабжение`, or `Гарантия`
- `:section` - Menu section (e.g., `vitrage-constructor`, `specification-new`, `floor-plans`)

### Department Access
| Section | Label | УОК | Снабжение | Гарантия |
|---------|-------|-----|-----------|----------|
| vitrage-constructor | Конструктор Витражей | ✓ | | |
| specification-new | Типовые витражи | ✓ | | |
| defect-tracking | Дефектовка | ✓ | | |
| floor-plans | План этажей | ✓ | | |
| facade-plans | Фасады | ✓ | | |
| order-form | Оформление заказа | | ✓ | ✓ |

Additional sections exist (`support`, `settings`, `admin`) but are currently placeholder UI.

### Core Files
- `src/App.tsx` - Route definitions
- `src/components/Layout.tsx` - Workspace shell with sidebar
- `src/components/MainContent.tsx` - Section content router
- `src/lib/supabase.ts` - Supabase client
- `src/types/database.ts` - Database TypeScript types

### Storage Services (`src/services/`)
- `objectStorage.ts` - Construction objects CRUD
- `vitrageStorage.ts` - Vitrage configurations + segments
- `defectStorage.ts` - Defect tracking data
- `floorPlanStorage.ts` - Floor plan data with placed vitrages
- `placedVitrageStorage.ts` - Placed vitrages with defect inspection data

### Legacy vs Current Components
| Legacy (deprecated) | Current |
|---------------------|---------|
| `GraphicsEditor/` | `VitrageConstructor/` |
| `VitrageVisualizer/` | `VitrageConstructor/` |
| `VitrageSpecification/` | `VitrageSpecificationNew/` |

**Note**: `VitrageConstructor` is now the primary component for creating and editing vitrages. `VitrageVisualizer` exists but is no longer accessible via menu.

### Fill Types (used across components)
```typescript
const FILL_TYPES = [
  'Стеклопакет',
  'Глухое остекление',
  'Открывающееся окно',
  'Дверь',
  'Вентиляция',
  'Пустой'
]
```

### Component Module Structure
Major components follow a modular pattern with subdirectories:
```
ComponentName/
├── ComponentName.tsx     # Main component
├── index.ts              # Public exports
├── hooks/                # Custom React hooks
├── types/                # TypeScript interfaces
├── utils/                # Helper functions
└── components/           # Sub-components (optional)
```

Components using this structure: `VitrageVisualizer`, `FloorPlanEditor`, `FacadePlanEditor`, `GraphicsEditor`, `DefectTracking`, `MainPage`

**Note**: `VitrageConstructor` and `VitrageSpecificationNew` use a simpler flat structure (main component + CSS + index.ts).

## Storage Architecture

### Hybrid Storage with Automatic Fallback
All storage services use Supabase with automatic localStorage fallback when unavailable:

| Data Type | Storage Service | Supabase Table | localStorage Key |
|-----------|-----------------|----------------|------------------|
| Objects | `objectStorage` | `objects` | `localStorage-objects` |
| Vitrages | `vitrageStorage` | `vitrages` | `saved-vitrages` |
| Defects | `defectStorage` | `segment_defects` | `segment-defects-data` |
| Floor Plans | `floorPlanStorage` | `floor_plans` | `floor-plans` |
| Placed Vitrages | `placedVitrageStorage` | `placed_vitrages` | `placed-vitrages` |

Always use the appropriate storage service for CRUD operations - never call Supabase directly.

### Environment Variables (`.env`, gitignored)
```
VITE_SUPABASE_URL=<project-url>
VITE_SUPABASE_ANON_KEY=<anon-key>
```

## Key Data Models

### VitrageConfig (VitrageVisualizer)
```typescript
interface Segment {
  id: string
  row: number, col: number
  width: number, height: number        // millimeters
  positionX: number, positionY: number // canvas coords
  fillType: string                     // glass, ventilation, door, etc.
  formula: string                      // e.g., "4М1-16-4М1"
}

interface VitrageConfig {
  marking: string
  horizontalSegments: number
  verticalSegments: number
  segments: Segment[][]
  totalWidth: number, totalHeight: number
}
```

### PlacedVitrage (Floor/Facade Plans with Defect Inspection)
```typescript
interface PlacedVitrageData {
  id: string
  object_id: string
  floor_plan_id?: string
  vitrage_id: string
  vitrage_name: string
  vitrage_data?: any           // Full vitrage config
  position_x?: number, position_y?: number
  rotation?: number            // 0, 90, 180, 270
  scale?: number               // 0.1 to 3.0
  // Hierarchical ID components
  id_object?: string
  id_corpus?: string
  id_section?: string
  id_floor?: string
  id_apartment?: string
  id_vitrage_number?: string
  id_vitrage_name?: string
  id_vitrage_section?: string
  full_id?: string             // Auto-generated in DB
  // Defect inspection
  segment_defects?: Record<string, SegmentDefect>
  inspection_status?: 'not_checked' | 'in_progress' | 'checked' | 'approved' | 'rejected'
  inspection_date?: string
  inspector_name?: string
  inspection_notes?: string
  total_defects_count?: number
  defective_segments_count?: number
}

interface SegmentDefect {
  defects: string[]            // defect type names
  status: 'ok' | 'defective' | 'not_checked'
  notes?: string
  checked_at?: string
}
```

## Component View Modes

### VitrageConstructor (Primary)
Uses a two-phase workflow:
- `'config'` - Initial configuration form (marking, site manager, segments count)
- `'editor'` - Grid editor with segment selection and properties, supports:
  - Multi-segment selection
  - Segment merging/splitting
  - Row/column insertion and deletion
  - Fill type assignment with formulas

### VitrageVisualizer (Legacy)
Similar two-phase approach with configuration preview and detailed editing. No longer accessible via menu.

## Canvas Editor Interactions

### Floor/Facade Plan Editors
- **Place vitrage**: "Добавить витраж" → select from library → click on plan
- **Move**: Click and drag
- **Scale**: Shift + mouse wheel (10-300%)
- **Rotate**: Select → "Повернуть на 90°"
- **Delete**: Select → Delete key
- **Pan**: Middle mouse button + drag

### Technical Notes
- Native wheel listener with `{ passive: false }` to prevent browser warnings
- Rotation hit detection uses coordinate transformation
- Vitrages anchored to background image position in facade editor
- Auto-save with 2-second debounce

## Important Instructions

### Development
- **Prefer editing existing files** over creating new ones
- **Use current components**: VitrageConstructor, VitrageSpecificationNew (not legacy GraphicsEditor, VitrageVisualizer, VitrageSpecification)
- **Russian UI**: Maintain Russian for all user-facing text
- **Canvas modifications**: Study existing rendering code before changes
- **Data model changes**: Test with fresh localStorage or provide migration
- **File size limit**: NEVER create or modify files to exceed 600 lines of code. If a file would exceed 600 lines:
  - Split functionality into smaller modules
  - Extract reusable components
  - Create separate utility files
  - Refactor before adding new features

### Git Operations
- **NEVER create commits automatically**: Only create git commits when explicitly requested by the user
  - Wait for explicit requests like: "сделай коммит", "создай коммит", "закоммить", "commit changes", "push changes"
  - Do NOT automatically commit after completing tasks
  - Do NOT commit as part of task completion unless specifically asked
- **Always push to main**: When asked to push/commit changes to GitHub, ALWAYS use `origin/main` branch
  - Use: `git push origin main` (not other branches)
  - If on different branch, switch to main first: `git checkout main`
  - Never create feature branches unless explicitly requested
  - Default flow (when requested): `git add .` → `git commit -m "message"` → `git push origin main`

### Navigation
- Use `navigate()` for programmatic navigation
- URL parameters are source of truth for navigation state
- Flow: Object selection → Department selection → Department workspace

### Patterns
- Modal dialogs: Use overlay pattern from MainPage/ObjectPage
- Storage: Use appropriate storage service (`objectStorage`, `vitrageStorage`, `defectStorage`, `floorPlanStorage`, `placedVitrageStorage`)
- Storage fallback: Console shows "📦 Using localStorage fallback" when Supabase unavailable

## Defect Data Models

### Two Defect Storage Approaches
The system has two complementary defect data models:

1. **PlacedVitrage.segment_defects** (`placedVitrageStorage.ts`) - defects stored directly on placed vitrages, used for floor plan defect tracking
2. **SegmentDefectData** (`defectStorage.ts`) - standalone defect records linked to vitrage IDs, used for historical inspection tracking

### SegmentDefectData (defectStorage)
```typescript
interface SegmentDefectData {
  id?: string
  vitrageId: string           // reference to saved vitrage
  segmentIndex: number        // segment index within vitrage grid
  inspectionDate: string      // ISO date
  inspector: string
  siteManager: string
  defects: string[]           // defect type names
  defectItems?: DefectItem[]  // detailed defect info (optional)
  notes?: string
}
```

Storage key pattern: `{vitrageId}-{segmentIndex}` for unique segment identification.

### Default Defect Types
`Царапины`, `Сколы`, `Трещины`, `Загрязнения`, `Деформация`, `Разгерметизация`, `Запотевание`, `Некачественный монтаж`
