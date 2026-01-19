import { useCallback } from 'react'
import { ScoreInput } from './ScoreInput'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { Scores, ScoreKey } from '../types'
import { SCORE_LABELS } from '../types'

interface ScorePanelProps {
  scores: Scores
  onScoresChange: (scores: Scores) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

const SCORE_KEYS: ScoreKey[] = [
  'redacao',
  'linguagens',
  'matematica',
  'cienciasHumanas',
  'cienciasNatureza',
]

export function ScorePanel({
  scores,
  onScoresChange,
  collapsed = false,
  onToggleCollapse,
}: ScorePanelProps) {
  const handleScoreChange = useCallback((key: ScoreKey, value: number | null) => {
    onScoresChange({ ...scores, [key]: value })
  }, [scores, onScoresChange])

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
        </CardContent>
      )}
    </Card>
  )
}
