import { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { ResultCard } from './ResultCard'
import { Select } from './ui/select'
import type { VacancyResult, SortOption } from '../types'
import { SORT_LABELS } from '../types'

interface ResultsListProps {
  results: VacancyResult[]
  isLoading?: boolean
  isCalculating?: boolean
  matchingCount: number
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
  hasScores: boolean
}

const SORT_OPTIONS: SortOption[] = ['chance', 'notaCorte', 'concorrencia', 'curso', 'instituicao']

export function ResultsList({
  results,
  isLoading,
  isCalculating,
  matchingCount,
  sortBy,
  onSortChange,
  hasScores,
}: ResultsListProps) {
  const parentRef = useRef<HTMLDivElement>(null)

  const virtualizer = useVirtualizer({
    count: results.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 220,
    overscan: 5,
  })

  const items = virtualizer.getVirtualItems()

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 border-b bg-background sticky top-0 z-10">
        <div className="flex items-center gap-2">
          {isCalculating ? (
            <span className="text-muted-foreground animate-pulse">
              Calculando...
            </span>
          ) : (
            <>
              <span className="text-green-600 font-medium">✓</span>
              <span className="font-medium">{matchingCount.toLocaleString('pt-BR')}</span>
              <span className="text-muted-foreground">
                {matchingCount === 1 ? 'resultado' : 'resultados'}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="sort" className="text-sm text-muted-foreground hidden sm:inline">
            Ordenar:
          </label>
          <Select
            id="sort"
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="w-auto min-w-[150px]"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option} value={option} disabled={!hasScores && option === 'chance'}>
                {SORT_LABELS[option]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Results */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Carregando dados...</p>
          </div>
        </div>
      ) : results.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <p className="text-4xl mb-4">🔍</p>
            <h3 className="font-semibold text-lg mb-2">Nenhum resultado encontrado</h3>
            <p className="text-muted-foreground">
              {hasScores
                ? 'Tente ajustar os filtros para encontrar mais vagas.'
                : 'Preencha suas notas do ENEM para ver as vagas onde voce tem chance de ser aprovado.'}
            </p>
          </div>
        </div>
      ) : (
        <div
          ref={parentRef}
          className="flex-1 overflow-auto virtual-list"
          style={{ contain: 'strict' }}
        >
          <div
            style={{
              height: `${virtualizer.getTotalSize()}px`,
              width: '100%',
              position: 'relative',
            }}
          >
            {items.map((virtualItem) => (
              <div
                key={virtualItem.key}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="p-2"
              >
                <ResultCard
                  result={results[virtualItem.index]}
                  showCalculatedScore={hasScores}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
