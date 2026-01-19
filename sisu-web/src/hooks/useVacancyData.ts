import { useState, useEffect, useCallback } from 'react'
import type { Vacancy, Lookups } from '../types'

const DATA_BASE_URL = import.meta.env.BASE_URL + 'data/'
const CHUNK_COUNT = 12

interface UseVacancyDataReturn {
  vacancies: Vacancy[]
  lookups: Lookups | null
  isLoading: boolean
  loadProgress: number
  error: string | null
}

export function useVacancyData(): UseVacancyDataReturn {
  const [vacancies, setVacancies] = useState<Vacancy[]>([])
  const [lookups, setLookups] = useState<Lookups | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Load lookups first (required for everything)
      const lookupsResponse = await fetch(`${DATA_BASE_URL}lookups.json`)
      if (!lookupsResponse.ok) throw new Error('Failed to load lookups')
      const lookupsData: Lookups = await lookupsResponse.json()
      setLookups(lookupsData)
      setLoadProgress(1 / (CHUNK_COUNT + 1))

      // Load first chunk immediately
      const firstChunkResponse = await fetch(`${DATA_BASE_URL}vagas-0.json`)
      if (!firstChunkResponse.ok) throw new Error('Failed to load initial data')
      const firstChunk: Vacancy[] = await firstChunkResponse.json()
      setVacancies(firstChunk)
      setLoadProgress(2 / (CHUNK_COUNT + 1))

      // Load remaining chunks in background
      const remainingChunks: Promise<Vacancy[]>[] = []
      for (let i = 1; i < CHUNK_COUNT; i++) {
        remainingChunks.push(
          fetch(`${DATA_BASE_URL}vagas-${i}.json`)
            .then(res => {
              if (!res.ok) throw new Error(`Failed to load chunk ${i}`)
              return res.json()
            })
            .then(data => {
              setLoadProgress(prev => prev + (1 / (CHUNK_COUNT + 1)))
              return data
            })
        )
      }

      // Wait for all chunks and combine
      const allChunks = await Promise.all(remainingChunks)
      const allVacancies = [firstChunk, ...allChunks].flat()
      setVacancies(allVacancies)
      setLoadProgress(1)
      setIsLoading(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  return {
    vacancies,
    lookups,
    isLoading,
    loadProgress,
    error,
  }
}
