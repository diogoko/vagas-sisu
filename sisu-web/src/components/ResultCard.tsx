import { Card, CardContent } from './ui/card'
import { ChanceBadge } from './ChanceBadge'
import { cn, formatNumber, formatPercent } from '../lib/utils'
import type { VacancyResult } from '../types'
import { GRAU_LABELS, TURNO_LABELS, MODALIDADE_LABELS } from '../types'

interface ResultCardProps {
  result: VacancyResult
  showCalculatedScore?: boolean
}

export function ResultCard({ result, showCalculatedScore = true }: ResultCardProps) {
  const {
    curso,
    instituicao,
    municipio,
    nc,
    notaCalculada,
    margem,
    margemPercent,
    chanceLevel,
    atendeMinimos,
    concorrencia,
    g,
    t,
    m,
    tc,
    v,
    n,
  } = result

  return (
    <Card className={cn(
      "transition-shadow hover:shadow-md",
      !atendeMinimos && showCalculatedScore && "opacity-75"
    )}>
      <CardContent className="p-4">
        {/* Header with chance badge */}
        <div className="flex items-start justify-between gap-2 mb-2">
          {showCalculatedScore && (
            <ChanceBadge level={chanceLevel} />
          )}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{GRAU_LABELS[g] || g}</span>
            <span>•</span>
            <span>{TURNO_LABELS[t] || t}</span>
          </div>
        </div>

        {/* Course name */}
        <h3 className="font-semibold text-lg leading-tight mb-1">
          {curso.n}
        </h3>

        {/* Institution and location */}
        <p className="text-sm text-muted-foreground mb-3">
          {instituicao.s} - {municipio.m}/{municipio.u}
        </p>

        {/* Score comparison */}
        {showCalculatedScore && notaCalculada > 0 && (
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-xs text-muted-foreground">Sua Nota</p>
              <p className="text-lg font-semibold">{formatNumber(notaCalculada)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nota de Corte</p>
              <p className="text-lg font-semibold">{formatNumber(nc)}</p>
            </div>
          </div>
        )}

        {/* Margin */}
        {showCalculatedScore && notaCalculada > 0 && (
          <div className={cn(
            "text-sm font-medium mb-3",
            margem >= 0 ? "text-green-600" : "text-red-600"
          )}>
            Margem: {margem >= 0 ? '+' : ''}{formatNumber(margem)} ({formatPercent(margemPercent)})
          </div>
        )}

        {/* No score - show cut-off only */}
        {(!showCalculatedScore || notaCalculada === 0) && (
          <div className="mb-3">
            <p className="text-xs text-muted-foreground">Nota de Corte 2024</p>
            <p className="text-lg font-semibold">{formatNumber(nc)}</p>
          </div>
        )}

        {/* Warning for minimum scores */}
        {showCalculatedScore && !atendeMinimos && notaCalculada > 0 && (
          <div className="text-xs text-orange-600 bg-orange-50 dark:bg-orange-950 px-2 py-1 rounded mb-3">
            ⚠️ Nao atende aos requisitos minimos
          </div>
        )}

        {/* Metadata row */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground border-t pt-3">
          <span title="Modalidade">{MODALIDADE_LABELS[m] || m}</span>
          <span>•</span>
          <span title="Tipo de Concorrencia">{tc}</span>
          <span>•</span>
          <span title="Vagas">{v} vagas</span>
          {n > 0 && (
            <>
              <span>•</span>
              <span title="Concorrencia">{formatNumber(concorrencia, 1)} cand/vaga</span>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
