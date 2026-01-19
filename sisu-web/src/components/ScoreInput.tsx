import { useState, useCallback } from 'react'
import { Input } from './ui/input'
import { cn } from '../lib/utils'

interface ScoreInputProps {
  label: string
  value: number | null
  onChange: (value: number | null) => void
  placeholder?: string
}

export function ScoreInput({ label, value, onChange, placeholder = '0-1000' }: ScoreInputProps) {
  const [inputValue, setInputValue] = useState(value?.toString() ?? '')
  const [isValid, setIsValid] = useState(true)

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value

    // Allow empty input
    if (raw === '') {
      setInputValue('')
      setIsValid(true)
      onChange(null)
      return
    }

    // Only allow numbers
    if (!/^\d*\.?\d*$/.test(raw)) {
      return
    }

    setInputValue(raw)

    const num = parseFloat(raw)
    if (isNaN(num)) {
      setIsValid(false)
      return
    }

    // Validate range
    if (num >= 0 && num <= 1000) {
      setIsValid(true)
      onChange(num)
    } else {
      setIsValid(false)
    }
  }, [onChange])

  const handleBlur = useCallback(() => {
    // Format on blur
    if (value !== null && !isNaN(value)) {
      setInputValue(value.toString())
    }
  }, [value])

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative">
        <Input
          type="text"
          inputMode="decimal"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "h-12 text-lg pr-8",
            !isValid && "border-destructive focus-visible:ring-destructive",
            value !== null && isValid && "border-green-500 focus-visible:ring-green-500"
          )}
        />
        {value !== null && isValid && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        )}
      </div>
      {!isValid && (
        <span className="text-xs text-destructive">
          Valor deve estar entre 0 e 1000
        </span>
      )}
    </div>
  )
}
