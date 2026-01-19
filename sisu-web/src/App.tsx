import { useState, useEffect, useCallback, useMemo } from 'react'
import { ScorePanel } from './components/ScorePanel'
import { FilterPanel } from './components/FilterPanel'
import { FilterSheet } from './components/FilterSheet'
import { ResultsList } from './components/ResultsList'
import { useVacancyData } from './hooks/useVacancyData'
import { useCalculator } from './hooks/useCalculator'
import { useFilters } from './hooks/useFilters'
import { debounce } from './lib/utils'
import type { Scores, SortOption } from './types'

const initialScores: Scores = {
  redacao: null,
  linguagens: null,
  matematica: null,
  cienciasHumanas: null,
  cienciasNatureza: null,
}

function App() {
  const [scores, setScores] = useState<Scores>(initialScores)
  const [sortBy, setSortBy] = useState<SortOption>('chance')
  const [scorePanelCollapsed, setScorePanelCollapsed] = useState(false)
  const [filterSheetOpen, setFilterSheetOpen] = useState(false)

  const { vacancies, lookups, isLoading, loadProgress, error } = useVacancyData()
  const { results, isCalculating, matchingCount, calculate } = useCalculator()
  const { filters, setFilters, activeFilterCount, clearFilters } = useFilters()

  // Check if scores are complete
  const hasCompleteScores = useMemo(() => {
    return Object.values(scores).every(v => v !== null && v !== undefined)
  }, [scores])

  // Debounced calculate function
  const debouncedCalculate = useMemo(
    () => debounce(calculate, 300),
    [calculate]
  )

  // Trigger calculation when inputs change
  useEffect(() => {
    if (lookups && vacancies.length > 0) {
      debouncedCalculate(scores, filters, vacancies, lookups, sortBy)
    }
  }, [scores, filters, vacancies, lookups, sortBy, debouncedCalculate])

  // Auto-collapse score panel when all scores are filled and on mobile
  useEffect(() => {
    if (hasCompleteScores && window.innerWidth < 768) {
      setScorePanelCollapsed(true)
    }
  }, [hasCompleteScores])

  // Update sort to 'notaCorte' if no scores and current sort is 'chance'
  useEffect(() => {
    if (!hasCompleteScores && sortBy === 'chance') {
      setSortBy('notaCorte')
    }
  }, [hasCompleteScores, sortBy])

  const handleScoresChange = useCallback((newScores: Scores) => {
    setScores(newScores)
  }, [])

  const toggleScorePanel = useCallback(() => {
    setScorePanelCollapsed(prev => !prev)
  }, [])

  // Show loading screen
  if (isLoading && loadProgress < 0.2) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Vagas SISU</h2>
          <p className="text-muted-foreground">Carregando dados...</p>
          <div className="w-48 h-2 bg-muted rounded-full mt-4 mx-auto overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${loadProgress * 100}%` }}
            />
          </div>
        </div>
      </div>
    )
  }

  // Show error screen
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center p-8 max-w-md">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar dados</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-primary underline"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">Vagas SISU</h1>
            {isLoading && (
              <span className="text-sm text-muted-foreground animate-pulse">
                Carregando mais dados...
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-4">
        {/* Mobile layout */}
        <div className="lg:hidden space-y-4">
          {/* Score panel */}
          <ScorePanel
            scores={scores}
            onScoresChange={handleScoresChange}
            collapsed={scorePanelCollapsed}
            onToggleCollapse={toggleScorePanel}
          />

          {/* Filter button */}
          <FilterSheet
            filters={filters}
            onFilterChange={setFilters}
            activeCount={activeFilterCount}
            onClear={clearFilters}
            open={filterSheetOpen}
            onOpenChange={setFilterSheetOpen}
          />

          {/* Results */}
          <div className="h-[calc(100vh-280px)] min-h-[400px] border rounded-lg overflow-hidden">
            <ResultsList
              results={results}
              isLoading={isLoading && vacancies.length === 0}
              isCalculating={isCalculating}
              matchingCount={matchingCount}
              sortBy={sortBy}
              onSortChange={setSortBy}
              hasScores={hasCompleteScores}
            />
          </div>
        </div>

        {/* Desktop layout */}
        <div className="hidden lg:grid lg:grid-cols-[320px_1fr] lg:gap-6">
          {/* Left sidebar */}
          <aside className="space-y-4 max-h-[calc(100vh-100px)] overflow-y-auto pr-2">
            {/* Score panel */}
            <ScorePanel
              scores={scores}
              onScoresChange={handleScoresChange}
              collapsed={scorePanelCollapsed}
              onToggleCollapse={toggleScorePanel}
            />

            {/* Filters */}
            <FilterPanel
              filters={filters}
              onFilterChange={setFilters}
              activeCount={activeFilterCount}
              onClear={clearFilters}
            />
          </aside>

          {/* Results area */}
          <div className="h-[calc(100vh-100px)] border rounded-lg overflow-hidden">
            <ResultsList
              results={results}
              isLoading={isLoading && vacancies.length === 0}
              isCalculating={isCalculating}
              matchingCount={matchingCount}
              sortBy={sortBy}
              onSortChange={setSortBy}
              hasScores={hasCompleteScores}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>
            Dados baseados no SISU 2025. Esta ferramenta e apenas informativa.
          </p>
          <p className="mt-1">
            Verifique sempre as informacoes oficiais em{' '}
            <a
              href="https://sisu.mec.gov.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              sisu.mec.gov.br
            </a>
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App
