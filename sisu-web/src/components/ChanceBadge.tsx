import { cn } from '../lib/utils'
import type { ChanceLevel } from '../types'
import { CHANCE_LABELS } from '../types'

interface ChanceBadgeProps {
  level: ChanceLevel
  className?: string
}

const CHANCE_STYLES: Record<ChanceLevel, { bg: string; text: string; icon: string }> = {
  'muito-alta': {
    bg: 'bg-green-600',
    text: 'text-white',
    icon: '🎯',
  },
  'alta': {
    bg: 'bg-green-500',
    text: 'text-white',
    icon: '✓',
  },
  'boa': {
    bg: 'bg-yellow-400',
    text: 'text-black',
    icon: '🟡',
  },
  'razoavel': {
    bg: 'bg-orange-500',
    text: 'text-white',
    icon: '⚠️',
  },
  'arriscada': {
    bg: 'bg-red-500',
    text: 'text-white',
    icon: '🔴',
  },
}

export function ChanceBadge({ level, className }: ChanceBadgeProps) {
  const style = CHANCE_STYLES[level]

  return (
    <div
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold',
        style.bg,
        style.text,
        className
      )}
    >
      <span>{style.icon}</span>
      <span>{CHANCE_LABELS[level]}</span>
    </div>
  )
}
