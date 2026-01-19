// ENEM score keys
export type ScoreKey = 'redacao' | 'linguagens' | 'matematica' | 'cienciasHumanas' | 'cienciasNatureza'

// User ENEM scores input
export interface Scores {
  redacao: number | null
  linguagens: number | null
  matematica: number | null
  cienciasHumanas: number | null
  cienciasNatureza: number | null
}

// Labels for score fields (Portuguese)
export const SCORE_LABELS: Record<ScoreKey, string> = {
  redacao: 'Redacao',
  linguagens: 'Linguagens',
  matematica: 'Matematica',
  cienciasHumanas: 'Ciencias Humanas',
  cienciasNatureza: 'Ciencias da Natureza',
}

// Lookup table types (from public/data/lookups.json)
export interface Institution {
  s: string  // Short name (sigla)
  n: string  // Full name
  _s: string // Normalized short name
  _n: string // Normalized full name
}

export interface Course {
  n: string  // Name
  _n: string // Normalized name
}

export interface Municipality {
  m: string  // Municipality name
  u: string  // UF (state)
  _m: string // Normalized name
}

export interface Lookups {
  instituicoes: Institution[]
  cursos: Course[]
  municipios: Municipality[]
}

// Vacancy record (from public/data/vagas-*.json)
export interface Vacancy {
  i: number     // Institution index
  l: number     // Location (municipality) index
  c: number     // Course index
  g: string     // Grau: B (Bacharelado), L (Licenciatura), T (Tecnologico), A (ABI)
  t: string     // Turno: M (Matutino), V (Vespertino), N (Noturno), I (Integral)
  m: string     // Modalidade: A (Ampla), L (Lei de Cotas), V (Reserva), B (Bonus)
  tc: string    // Tipo concorrencia: AC, LB_PPI, LI_PPI, etc.
  p: number[]   // Pesos: [redacao, linguagens, matematica, humanas, natureza]
  mn: number[]  // Minimum scores: [redacao, linguagens, matematica, humanas, natureza]
  nc: number    // Nota de corte
  v: number     // Vagas ofertadas
  n: number     // Inscricoes
}

// Calculated result with additional fields
export interface VacancyResult extends Vacancy {
  notaCalculada: number    // User's weighted score
  margem: number           // Difference from cut-off
  margemPercent: number    // Percentage margin
  chanceLevel: ChanceLevel // Visual chance indicator
  atendeMinimos: boolean   // Whether minimum scores are met
  concorrencia: number     // Competition ratio (inscricoes / vagas)
  // Resolved lookup values
  instituicao: Institution
  curso: Course
  municipio: Municipality
}

// Chance levels for visual indicators
export type ChanceLevel = 'muito-alta' | 'alta' | 'boa' | 'razoavel' | 'arriscada'

export const CHANCE_LABELS: Record<ChanceLevel, string> = {
  'muito-alta': 'MUITO ALTA',
  'alta': 'ALTA',
  'boa': 'BOA',
  'razoavel': 'RAZOAVEL',
  'arriscada': 'ARRISCADA',
}

// Grau (degree type) labels
export const GRAU_LABELS: Record<string, string> = {
  'B': 'Bacharelado',
  'L': 'Licenciatura',
  'T': 'Tecnologico',
  'A': 'ABI',
}

// Turno (shift) labels
export const TURNO_LABELS: Record<string, string> = {
  'M': 'Matutino',
  'V': 'Vespertino',
  'N': 'Noturno',
  'I': 'Integral',
}

// Modalidade labels
export const MODALIDADE_LABELS: Record<string, string> = {
  'A': 'Ampla Concorrencia',
  'L': 'Lei de Cotas',
  'V': 'Reserva de Vagas',
  'B': 'Bonus',
}

// Filter state
export interface Filters {
  ufs: string[]           // State abbreviations
  cursos: string[]        // Course indices or search terms
  instituicoes: string[]  // Institution indices or search terms
  modalidades: string[]   // A, L, V, B
  graus: string[]         // B, L, T, A
  turnos: string[]        // M, V, N, I
  tiposConcorrencia: string[]  // AC, LB_PPI, etc.
  searchText: string      // Free text search
}

// Sort options
export type SortOption = 'chance' | 'notaCorte' | 'concorrencia' | 'curso' | 'instituicao'

export const SORT_LABELS: Record<SortOption, string> = {
  chance: 'Melhor chance',
  notaCorte: 'Menor nota de corte',
  concorrencia: 'Menor concorrencia',
  curso: 'Nome do curso',
  instituicao: 'Nome da instituicao',
}

// Brazilian states grouped by region
export const UF_REGIONS = {
  'Norte': ['AC', 'AP', 'AM', 'PA', 'RO', 'RR', 'TO'],
  'Nordeste': ['AL', 'BA', 'CE', 'MA', 'PB', 'PE', 'PI', 'RN', 'SE'],
  'Centro-Oeste': ['DF', 'GO', 'MT', 'MS'],
  'Sudeste': ['ES', 'MG', 'RJ', 'SP'],
  'Sul': ['PR', 'RS', 'SC'],
} as const

// All UFs
export const ALL_UFS = Object.values(UF_REGIONS).flat()

// Web Worker message types
export interface WorkerMessage {
  type: 'calculate' | 'filter'
  payload: {
    scores?: Scores
    filters?: Filters
    vacancies?: Vacancy[]
    lookups?: Lookups
    sortBy?: SortOption
  }
}

export interface WorkerResult {
  type: 'results'
  payload: {
    results: VacancyResult[]
    totalCount: number
    matchingCount: number
  }
}
