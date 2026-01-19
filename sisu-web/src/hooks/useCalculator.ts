import { useState, useEffect, useRef, useCallback } from 'react'
import type { Scores, Vacancy, Lookups, Filters, SortOption, VacancyResult } from '../types'
import type { WorkerRequest, WorkerResponse } from '../workers/calculator.worker'

interface UseCalculatorReturn {
  results: VacancyResult[]
  isCalculating: boolean
  totalCount: number
  matchingCount: number
  calculate: (
    scores: Scores,
    filters: Filters,
    vacancies: Vacancy[],
    lookups: Lookups,
    sortBy: SortOption
  ) => void
}

export function useCalculator(): UseCalculatorReturn {
  const [results, setResults] = useState<VacancyResult[]>([])
  const [isCalculating, setIsCalculating] = useState(false)
  const [totalCount, setTotalCount] = useState(0)
  const [matchingCount, setMatchingCount] = useState(0)
  const workerRef = useRef<Worker | null>(null)
  const pendingCalculation = useRef<WorkerRequest['payload'] | null>(null)

  useEffect(() => {
    // Create worker
    workerRef.current = new Worker(
      new URL('../workers/calculator.worker.ts', import.meta.url),
      { type: 'module' }
    )

    workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
      if (event.data.type === 'results') {
        setResults(event.data.payload.results)
        setTotalCount(event.data.payload.totalCount)
        setMatchingCount(event.data.payload.matchingCount)
        setIsCalculating(false)

        // Process any pending calculation
        if (pendingCalculation.current) {
          const pending = pendingCalculation.current
          pendingCalculation.current = null
          workerRef.current?.postMessage({
            type: 'calculate',
            payload: pending,
          } as WorkerRequest)
          setIsCalculating(true)
        }
      }
    }

    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error)
      setIsCalculating(false)
    }

    return () => {
      workerRef.current?.terminate()
    }
  }, [])

  const calculate = useCallback((
    scores: Scores,
    filters: Filters,
    vacancies: Vacancy[],
    lookups: Lookups,
    sortBy: SortOption
  ) => {
    if (!workerRef.current || vacancies.length === 0) return

    const payload = { scores, filters, vacancies, lookups, sortBy }

    if (isCalculating) {
      // Queue the calculation for when current one finishes
      pendingCalculation.current = payload
    } else {
      workerRef.current.postMessage({
        type: 'calculate',
        payload,
      } as WorkerRequest)
      setIsCalculating(true)
    }
  }, [isCalculating])

  return {
    results,
    isCalculating,
    totalCount,
    matchingCount,
    calculate,
  }
}
