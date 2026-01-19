import type { Scores, Vacancy, Lookups, Filters, SortOption, VacancyResult } from '../types'
import { processVacancies } from '../lib/calculator'

export interface WorkerRequest {
  type: 'calculate'
  payload: {
    scores: Scores
    filters: Filters
    vacancies: Vacancy[]
    lookups: Lookups
    sortBy: SortOption
  }
}

export interface WorkerResponse {
  type: 'results'
  payload: {
    results: VacancyResult[]
    totalCount: number
    matchingCount: number
  }
}

self.onmessage = (event: MessageEvent<WorkerRequest>) => {
  const { type, payload } = event.data

  if (type === 'calculate') {
    const { scores, filters, vacancies, lookups, sortBy } = payload

    const result = processVacancies(vacancies, scores, filters, lookups, sortBy)

    const response: WorkerResponse = {
      type: 'results',
      payload: result,
    }

    self.postMessage(response)
  }
}

export {}
