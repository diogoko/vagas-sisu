# SISU Vacancy Search Project

## Project Goal

This project helps Brazilian students find university vacancies through SISU (Sistema de Seleção Unificada) where they have a realistic chance of being accepted based on their ENEM scores.

**Main question the system answers:** "Where should I apply to have a real chance of being accepted for course(s) X or Y in states A, B, or C?"

## Context

- **SISU** is the Brazilian unified selection system that allows students to use their ENEM (national exam) results to apply for vacancies at public universities across Brazil
- **ENEM** has 5 components: Redação (Essay), Linguagens, Matemática, Ciências Humanas, Ciências da Natureza
- Each university/course has different **weights** for each ENEM component
- Each vacancy has a **nota de corte** (cut-off score) - the minimum weighted score to be accepted
- There are different **competition modalities**: Ampla Concorrência (A), Lei de Cotas (L), Reserva (V), Bônus (B)

## Data Sources

Two xlsx files from the official SISU portal (2026 edition), downloaded from:
https://sisu.mec.gov.br/#/relatorio#onepage

1. **portal-sisu-2026-inscricoes-e-nota-de-corte.xlsx** - Inscriptions and cut-off scores
   - Contains: cut-off scores, number of applications per vacancy

2. **portal-sisu-2026-vagas-ofertadas.xlsx** - Offered vacancies
   - Contains: ENEM weights, minimum scores, vacancy counts, institution details

## Project Structure

```
sisu/
├── xlsx-reader.js      # Generic xlsx file reader
├── sisu-data.js        # SISU-specific data loading and filtering
├── sisu-search.js      # Main search functionality
├── minha-busca.js      # Personalized search script
└── *.json              # Cached JSON data (faster loading)
```

## Key Modules

### xlsx-reader.js
Generic functions to read xlsx files:
- `listSheets(filePath)` - List sheet names
- `getSheetContent(filePath, sheet)` - Get sheet data as objects
- `getSheetInfo(filePath, sheet)` - Get sheet metadata

### sisu-data.js
SISU-specific data handling:
- `loadInscricoesNotaCorte()` / `loadVagasOfertadas()` - Load from xlsx
- `loadInscricoes()` / `loadVagas()` - Smart load (JSON if available, else xlsx)
- `exportToSeparateJsonFiles()` - Export to JSON for faster loading
- Filter functions: `filterByUF()`, `filterByCurso()`, `filterByModalidade()`, etc.

### sisu-search.js
Main search functionality:
- `buscarVagas(scores, filters, options)` - Main search function
- `buscarMelhoresChances(scores, filters, limit)` - Find vacancies where score >= cut-off
- `calcularNotaPonderada(scores, pesos)` - Calculate weighted average for a vacancy

## Usage Example

```javascript
import { buscarMelhoresChances } from './sisu-search.js';

const minhasNotas = {
  redacao: 680,
  linguagens: 619,
  matematica: 464,
  cienciasHumanas: 629,
  cienciasNatureza: 600
};

const filtros = {
  ufs: ['SP', 'MG'],
  cursos: ['direito', 'letras'],
  modalidades: ['A']  // Ampla concorrência
};

const resultados = buscarMelhoresChances(minhasNotas, filtros, 100);
```

## Available Filters

| Filter | Type | Description |
|--------|------|-------------|
| `ufs` | string[] | State abbreviations: 'SP', 'RJ', 'MG', etc. |
| `municipios` | string[] | City names (partial match) |
| `cursos` | string[] | Course names (partial match) |
| `instituicoes` | string[] | Institution name or abbreviation |
| `modalidades` | string[] | 'A' (Ampla), 'L' (Cotas), 'V' (Reserva), 'B' (Bônus) |
| `tiposConcorrencia` | string[] | 'AC', 'LB_PPI', 'LI_PPI', 'LB_Q', etc. |
| `graus` | string[] | 'Bacharelado', 'Licenciatura', 'Tecnológico' |
| `turnos` | string[] | 'Matutino', 'Vespertino', 'Noturno', 'Integral' |

## Result Fields

Each search result includes:
- `notaCalculada` - Student's weighted score for that specific vacancy
- `notaCorte` - Last year's cut-off score
- `margem` / `margemPercent` - Difference from cut-off
- `chanceSummary` - "Muito alta", "Alta", "Boa", "Razoável", "Arriscada", "Baixa"
- `atendeMinimos` - Whether minimum score requirements are met
- `concorrencia` - Competition ratio (applicants per vacancy)

## Commands

```bash
# Run personalized search
node minha-busca.js

# Export xlsx to JSON (faster subsequent loads)
node -e "import { exportToSeparateJsonFiles } from './sisu-data.js'; exportToSeparateJsonFiles();"

# Run tests
npm test          # unit tests (node --test test/*.test.js)
npm run test:all # unit + validation (test:external holds 2025 reference data, so it is not included)
```
