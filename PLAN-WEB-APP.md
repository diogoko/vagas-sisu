# SISU Vacancy Finder - Web Application Plan

## Overview

A static web application that allows Brazilian students to find university vacancies through SISU where they have a realistic chance of being accepted based on their ENEM scores.

**Main Question:** "Where should I apply to have a real chance of being accepted?"

## Requirements

- ✅ Interactive input for 5 ENEM partial scores
- ✅ Updateable filters (states, courses, institutions, modality, etc.)
- ✅ Real-time results calculation and display
- ✅ Static website (no backend services)
- ✅ Handle ~60,000 vacancy rows performantly
- ✅ Deployable to GitHub Pages
- ✅ Mobile-friendly (many Brazilian students access via mobile)

---

## Tech Stack

### Core Framework
- **React 18** with **Vite** - Fast builds, excellent tree-shaking, perfect for static sites

### UI Components
- **shadcn/ui** (Radix UI + Tailwind CSS) - Accessible, performant, no runtime overhead

### Performance Libraries
- **@tanstack/react-virtual** - Virtual scrolling for large result lists
- **Web Workers** - Offload calculations from main thread

### Build & Deploy
- **Vite** - Build tool
- **gh-pages** - GitHub Pages deployment

### Dependencies
```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@tanstack/react-virtual": "^3.0.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "vite": "^5.0.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "gh-pages": "^6.1.0"
  }
}
```

---

## Project Structure

```
sisu-web/
├── public/
│   └── data/
│       ├── vacancies-0.json    # Chunked data files
│       ├── vacancies-1.json
│       └── ...
├── src/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── ScoreInput.tsx      # ENEM score input component
│   │   ├── ScorePanel.tsx      # All 5 scores panel
│   │   ├── FilterPanel.tsx     # Filters (states, courses, etc.)
│   │   ├── FilterSheet.tsx     # Mobile bottom sheet for filters
│   │   ├── ResultsList.tsx     # Virtual scrolled results
│   │   ├── ResultCard.tsx      # Individual vacancy card
│   │   └── ChanceBadge.tsx     # Visual chance indicator
│   ├── workers/
│   │   └── calculator.worker.ts # Web Worker for calculations
│   ├── hooks/
│   │   ├── useVacancyData.ts   # Data loading hook
│   │   ├── useCalculator.ts    # Web Worker integration
│   │   └── useFilters.ts       # Filter state management
│   ├── lib/
│   │   ├── calculator.ts       # Score calculation logic
│   │   └── utils.ts            # Utility functions
│   ├── types/
│   │   └── index.ts            # TypeScript types
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css               # Tailwind imports
├── scripts/
│   └── prepare-data.js         # Script to prepare JSON data
├── index.html
├── vite.config.ts
├── tailwind.config.js
└── package.json
```

---

## UI Layout

### Mobile Layout (< 768px)

```
┌─────────────────────────┐
│   SISU Vacancy Finder   │  ← Sticky header
├─────────────────────────┤
│  📊 Your ENEM Scores    │  ← Collapsible section
│  [Score inputs...]      │    (collapses after input)
├─────────────────────────┤
│  🔍 Filters (3 active)  │  ← Opens bottom sheet
├─────────────────────────┤
│  ✓ 1,234 matches        │  ← Sticky results header
│  Sort: [Best chance ▼]  │
├─────────────────────────┤
│  ┌───────────────────┐  │
│  │ 🎯 MUITO ALTA     │  │  ← Virtual scrolled cards
│  │ Direito - UFMG    │  │
│  │ Belo Horizonte/MG │  │
│  │ Sua Nota: 620     │  │
│  │ Corte: 580 (+6.9%)│  │
│  └───────────────────┘  │
│           ...           │
└─────────────────────────┘
```

### Desktop Layout (≥ 768px)

```
┌────────────────────────────────────────────────────────┐
│              SISU Vacancy Finder                       │
├─────────────────┬──────────────────────────────────────┤
│ 📊 ENEM Scores  │  ✓ 1,234 matches | Sort: [▼]        │
│ [Input fields]  ├──────────────────────────────────────┤
│                 │  ┌─────────────────────────────────┐ │
│ 🔍 Filters      │  │ 🎯 MUITO ALTA                   │ │
│ [Side panel]    │  │ Direito - UFMG                  │ │
│                 │  │ Belo Horizonte/MG               │ │
│ ☑ São Paulo     │  │ Sua Nota: 620 | Corte: 580      │ │
│ ☑ Minas Gerais  │  │ Margem: +40 (+6.9%)             │ │
│ ☐ Rio de Janeiro│  └─────────────────────────────────┘ │
│                 │  [Virtual scrolled list continues]   │
└─────────────────┴──────────────────────────────────────┘
```

---

## Components Specification

### 1. ScoreInput Component

- Large touch targets (min 44px height)
- `inputMode="numeric"` for mobile keyboard
- Real-time validation (0-1000 range)
- Visual feedback (green check when valid)

### 2. FilterPanel Component

**Available Filters:**
| Filter | Type | UI Component |
|--------|------|--------------|
| States (UFs) | Multi-select | Checkboxes grouped by region |
| Courses | Multi-select + search | Searchable checkbox list |
| Institutions | Multi-select + search | Searchable checkbox list |
| Modality | Single-select | Radio buttons (A, L, V, B) |
| Degree Type | Multi-select | Checkboxes |
| Shift | Multi-select | Checkboxes |

**Mobile:** Bottom sheet (slides up)
**Desktop:** Fixed sidebar

### 3. ResultCard Component

Visual hierarchy:
1. **Chance Badge** - Immediate visual indicator (🎯 MUITO ALTA, etc.)
2. **Course Name** - Primary information
3. **Institution + Location** - Secondary info
4. **Score Comparison** - Your score vs cut-off with margin
5. **Metadata** - Shift, degree type, competition ratio

### 4. ChanceBadge Component

| Level | Label | Color | Margin Range |
|-------|-------|-------|--------------|
| 🎯 | MUITO ALTA | Green | ≥ 10% |
| ✓ | ALTA | Light Green | 5-10% |
| 🟡 | BOA | Yellow | 2-5% |
| ⚠️ | RAZOÁVEL | Orange | 0-2% |
| 🔴 | ARRISCADA | Red | < 0% |

---

## Performance Strategy

### 1. Data Loading

**Build Time:**
- Split 60k rows into 12 chunks (~5k rows each)
- Compress JSON (remove unnecessary whitespace)
- Pre-calculate unique filter values

**Runtime:**
- Load first chunk immediately (show results fast)
- Load remaining chunks in background
- Cache in memory after first load

### 2. Calculation Offloading

```typescript
// Web Worker handles:
// 1. Filter matching
// 2. Weighted score calculation
// 3. Sorting by margin
// 4. Returns only matching results

// Main thread handles:
// 1. UI rendering
// 2. User input
// 3. Virtual scrolling
```

### 3. Virtual Scrolling

- Only render visible cards (~10-15 at a time)
- Use `@tanstack/react-virtual`
- Estimated card height: 140px
- Overscan: 5 items for smooth scrolling

### 4. Debouncing

- Score inputs: 300ms debounce
- Filter changes: 200ms debounce
- Prevents excessive recalculations

---

## Data Optimization

### Size Reduction Results

| Format | Raw Size | Gzipped |
|--------|----------|---------|
| Original JSON | 159 MB | ~35 MB |
| **Optimized** | **7 MB** | **~590 KB** |

**22.5x reduction** achieved by:
1. Removing long descriptions (modalidade.descricao ~300 chars each)
2. Removing IBGE/institution percentages (not needed for search)
3. Using lookup tables for repeated values (institutions, courses, cities)
4. Using short field names (i, l, c, g, t, m, tc, p, mn, nc, v, n)
5. Joining vagas + inscricoes into single dataset
6. Pre-computing normalized (accent-free) search terms

### Optimized Data Structure

```javascript
// Lookup tables (84 KB → 19 KB gzipped)
// Include normalized (_) fields for accent-insensitive search
{
  "instituicoes": [
    { "s": "UFMG", "n": "UNIVERSIDADE FEDERAL DE MINAS GERAIS",
      "_s": "ufmg", "_n": "universidade federal de minas gerais" },
    ...
  ],
  "cursos": [
    { "n": "HISTÓRIA", "_n": "historia" },
    { "n": "CIÊNCIAS DA COMPUTAÇÃO", "_n": "ciencias da computacao" },
    ...
  ],
  "municipios": [
    { "m": "São Paulo", "u": "SP", "_m": "sao paulo" },
    { "m": "Belo Horizonte", "u": "MG", "_m": "belo horizonte" },
    ...
  ]
}

// Vacancy record (compact)
{
  "i": 45,        // Institution index
  "l": 123,       // Location index
  "c": 234,       // Course index
  "g": "B",       // Grau: B/L/T/A
  "t": "N",       // Turno: M/V/N/I
  "m": "A",       // Modalidade: A/L/V/B
  "tc": "AC",     // Tipo concorrência
  "p": [3, 2.5, 1, 2.5, 1],     // Weights: [red, lin, mat, hum, nat]
  "mn": [400, 400, 400, 400, 400], // Minimum scores
  "nc": 623.45,   // Nota de corte
  "v": 20,        // Vagas ofertadas
  "n": 156        // Inscricoes
}
```

### Loading Strategy

| Phase | Files | Gzipped Size | When |
|-------|-------|--------------|------|
| Initial | lookups.json + vagas-0.json | ~70 KB | Immediate |
| Background | vagas-1.json to vagas-11.json | ~530 KB | After first paint |

### Normalized Search

User input is normalized at search time using the same function:

```javascript
function normalize(text) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ');            // Collapse multiple spaces
}
```

**What gets normalized:**
| Input | Normalized |
|-------|------------|
| "História" | "historia" |
| "MATEMÁTICA" | "matematica" |
| "São Paulo" | "sao paulo" |
| "  Ciências  da   Natureza  " | "ciencias da natureza" |

User can type "historia", "História", "HISTÓRIA", or "  historia  " — all match.

### Data Preparation Script

```bash
# Generate optimized web data
node scripts/prepare-web-data.js

# Output:
# sisu-web/public/data/lookups.json (43 KB)
# sisu-web/public/data/vagas.json (7 MB - single file)
# sisu-web/public/data/vagas-{0-11}.json (~600 KB each - chunked)
```

---

## User Flow

1. **Land on page** → See empty score inputs
2. **Enter 5 ENEM scores** → Scores validated in real-time
3. **Submit/auto-submit** → Results calculate automatically
4. **See all matches** → Sorted by best chance (default)
5. **Refine with filters** (optional) → Results update in real-time
6. **Scan top options** → Visual hierarchy guides eye to best matches

---

## Accessibility

- WCAG AA compliant contrast ratios
- Keyboard navigation support
- Screen reader announcements for results count
- Focus indicators on interactive elements
- `aria-live` regions for dynamic content

---

## Deployment

```bash
# Build and deploy to GitHub Pages
npm run build
npm run deploy

# Or configure GitHub Actions for automatic deployment
```

**Vite Config:**
```javascript
export default {
  base: '/sisu-finder/', // Repository name
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'virtual-vendor': ['@tanstack/react-virtual'],
        },
      },
    },
  },
};
```

---

## Implementation Phases

### Phase 1: Foundation
- [ ] Initialize Vite + React + TypeScript project
- [ ] Set up Tailwind CSS + shadcn/ui
- [ ] Create data preparation script
- [ ] Implement basic UI layout

### Phase 2: Core Functionality
- [ ] ScoreInput and ScorePanel components
- [ ] Web Worker for calculations
- [ ] ResultsList with virtual scrolling
- [ ] ResultCard component

### Phase 3: Filters
- [ ] FilterPanel component
- [ ] FilterSheet (mobile bottom sheet)
- [ ] State, course, institution filters
- [ ] Modality, degree, shift filters

### Phase 4: Polish
- [ ] Loading states and skeletons
- [ ] Empty state handling
- [ ] Error handling
- [ ] Mobile responsive testing

### Phase 5: Deployment
- [ ] GitHub Pages configuration
- [ ] Performance testing
- [ ] Final optimizations
- [ ] Documentation

---

## Success Metrics

- **First Contentful Paint:** < 1.5s
- **Time to Interactive:** < 3s
- **Results calculation:** < 500ms
- **Scroll performance:** 60fps
- **Bundle size:** < 200KB (gzipped)

---

## References

- [shadcn/ui Documentation](https://ui.shadcn.com/)
- [TanStack Virtual](https://tanstack.com/virtual/latest)
- [Vite Documentation](https://vitejs.dev/)
- [GitHub Pages Deployment](https://vitejs.dev/guide/static-deploy.html#github-pages)
