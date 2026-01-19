import { useCallback, useEffect, useState } from 'react'
import { ScoreInput } from './ScoreInput'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { Scores, ScoreKey } from '../types'
import { SCORE_LABELS } from '../types'

const STORAGE_KEY = 'sisu-enem-scores'
const STORAGE_ENABLED_KEY = 'sisu-save-scores-enabled'

interface ScorePanelProps {
  scores: Scores
  onScoresChange: (scores: Scores) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const SCORE_KEYS: ScoreKey[] = [
  'linguagens',
  'cienciasHumanas',
  'cienciasNatureza',
  'matematica',
  'redacao',
]

export function ScorePanel({
  scores,
  onScoresChange,
  collapsed = false,
  onToggleCollapse,
}: ScorePanelProps) {
  const [saveEnabled, setSaveEnabled] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_ENABLED_KEY) === 'true'
    } catch {
      return false
    }
  })

  // Load saved scores on mount if saving is enabled
  useEffect(() => {
    if (saveEnabled) {
      try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) {
          const parsed = JSON.parse(saved)
          onScoresChange(parsed)
        }
      } catch {
        // Ignore errors
      }
    }
  // Only run on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Save scores when they change and saving is enabled (only if there are real scores)
  useEffect(() => {
    const hasAnyScore = Object.values(scores).some(v => v !== null)
    if (saveEnabled && hasAnyScore) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
      } catch {
        // Ignore errors
      }
    }
  }, [scores, saveEnabled])

  const handleScoreChange = useCallback((key: ScoreKey, value: number | null) => {
    onScoresChange({ ...scores, [key]: value })
  }, [scores, onScoresChange])

  const handleToggleSave = useCallback((e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card collapse
    setSaveEnabled(prev => {
      const newValue = !prev
      try {
        if (newValue) {
          localStorage.setItem(STORAGE_ENABLED_KEY, 'true')
          localStorage.setItem(STORAGE_KEY, JSON.stringify(scores))
        } else {
          localStorage.removeItem(STORAGE_ENABLED_KEY)
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch {
        // Ignore errors
      }
      return newValue
    })
  }, [scores])

  const filledCount = Object.values(scores).filter(v => v !== null).length
  const isComplete = filledCount === 5

  return (
    <Card>
      <CardHeader
        className="cursor-pointer select-none"
        onClick={onToggleCollapse}
      >
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <span className="text-xl">📊</span>
            Suas Notas do ENEM
            {isComplete && (
              <span className="text-green-500 text-sm font-normal">
                (Completo)
              </span>
            )}
          </CardTitle>
          {onToggleCollapse && (
            <button
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label={collapsed ? 'Expandir' : 'Recolher'}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform ${collapsed ? '' : 'rotate-180'}`}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          )}
        </div>
        {collapsed && filledCount > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {filledCount}/5 notas preenchidas
          </p>
        )}
      </CardHeader>
      {!collapsed && (
        <CardContent>
          <div className="flex flex-col gap-3">
            {SCORE_KEYS.map(key => (
              <ScoreInput
                key={key}
                label={SCORE_LABELS[key]}
                value={scores[key]}
                onChange={(value) => handleScoreChange(key, value)}
              />
            ))}
          </div>

          {/* Save toggle */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t">
            <label htmlFor="save-scores" className="text-sm text-muted-foreground">
              Salvar notas no navegador
            </label>
            <button
              id="save-scores"
              role="switch"
              aria-checked={saveEnabled}
              onClick={handleToggleSave}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${saveEnabled ? 'bg-primary' : 'bg-muted'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${saveEnabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>
        </CardContent>
      )}
    </Card>
  )
}
