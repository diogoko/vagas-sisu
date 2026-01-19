import type { Scores, Vacancy, VacancyResult, ChanceLevel, Lookups, Filters, SortOption } from '../types'
import { normalize } from './utils'

/**
 * Calculate weighted average score for a vacancy based on its weights
 */
export function calcularNotaPonderada(scores: Scores, pesos: number[]): number | null {
  const scoreValues = [
    scores.redacao,
    scores.linguagens,
    scores.matematica,
    scores.cienciasHumanas,
    scores.cienciasNatureza,
  ]

  // Check if all scores are provided
  if (scoreValues.some(v => v === null || v === undefined)) {
    return null
  }

  const totalPeso = pesos.reduce((sum, p) => sum + p, 0)
  if (totalPeso === 0) return null

  // Type assertion is safe because we've already checked all values are non-null above
  const validScores = scoreValues as number[]
  const notaPonderada = validScores.reduce((sum, nota, i) => {
    return sum + nota * pesos[i]
  }, 0) / totalPeso

  return notaPonderada
}

/**
 * Check if user scores meet minimum requirements
 */
export function verificarMinimos(scores: Scores, minimos: number[]): boolean {
  const scoreValues = [
    scores.redacao,
    scores.linguagens,
    scores.matematica,
    scores.cienciasHumanas,
    scores.cienciasNatureza,
  ]

  return scoreValues.every((nota, i) => {
    if (nota === null || nota === undefined) return false
    return nota >= minimos[i]
  })
}

/**
 * Determine chance level based on margin percentage
 */
export function getChanceLevel(margemPercent: number): ChanceLevel {
  if (margemPercent >= 10) return 'muito-alta'
  if (margemPercent >= 5) return 'alta'
  if (margemPercent >= 2) return 'boa'
  if (margemPercent >= 0) return 'razoavel'
  return 'arriscada'
}

/**
 * Check if vacancy matches filters
 */
export function matchesFilters(
  vacancy: Vacancy,
  filters: Filters,
  lookups: Lookups
): boolean {
  const municipio = lookups.municipios[vacancy.l]
  const instituicao = lookups.instituicoes[vacancy.i]
  const curso = lookups.cursos[vacancy.c]

  // Filter by UF
  if (filters.ufs.length > 0 && !filters.ufs.includes(municipio.u)) {
    return false
  }

  // Filter by modalidade
  if (filters.modalidades.length > 0 && !filters.modalidades.includes(vacancy.m)) {
    return false
  }

  // Filter by grau
  if (filters.graus.length > 0 && !filters.graus.includes(vacancy.g)) {
    return false
  }

  // Filter by turno
  if (filters.turnos.length > 0 && !filters.turnos.includes(vacancy.t)) {
    return false
  }

  // Filter by tipo concorrencia
  if (filters.tiposConcorrencia.length > 0 && !filters.tiposConcorrencia.includes(vacancy.tc)) {
    return false
  }

  // Filter by search text (searches in course, institution, and municipality)
  if (filters.searchText) {
    const normalizedSearch = normalize(filters.searchText)
    const matchesCurso = curso._n.includes(normalizedSearch)
    const matchesInstituicao = instituicao._n.includes(normalizedSearch) || instituicao._s.includes(normalizedSearch)
    const matchesMunicipio = municipio._m.includes(normalizedSearch)

    if (!matchesCurso && !matchesInstituicao && !matchesMunicipio) {
      return false
    }
  }

  // Filter by specific courses (indices)
  if (filters.cursos.length > 0) {
    const normalizedFilters = filters.cursos.map(c => normalize(c))
    const matchesCurso = normalizedFilters.some(f => curso._n.includes(f))
    if (!matchesCurso) {
      return false
    }
  }

  // Filter by specific institutions (indices)
  if (filters.instituicoes.length > 0) {
    const normalizedFilters = filters.instituicoes.map(i => normalize(i))
    const matchesInstituicao = normalizedFilters.some(f =>
      instituicao._n.includes(f) || instituicao._s.includes(f)
    )
    if (!matchesInstituicao) {
      return false
    }
  }

  return true
}

/**
 * Process vacancies with scores and filters
 */
export function processVacancies(
  vacancies: Vacancy[],
  scores: Scores,
  filters: Filters,
  lookups: Lookups,
  sortBy: SortOption = 'chance'
): { results: VacancyResult[]; totalCount: number; matchingCount: number } {
  const results: VacancyResult[] = []

  // Check if scores are complete
  const scoresComplete = Object.values(scores).every(v => v !== null && v !== undefined)

  for (const vacancy of vacancies) {
    // Skip if no cut-off score (no historical data)
    if (vacancy.nc === 0) continue

    // Apply filters
    if (!matchesFilters(vacancy, filters, lookups)) continue

    // Get lookups
    const instituicao = lookups.instituicoes[vacancy.i]
    const curso = lookups.cursos[vacancy.c]
    const municipio = lookups.municipios[vacancy.l]

    if (scoresComplete) {
      // Calculate weighted score
      const notaCalculada = calcularNotaPonderada(scores, vacancy.p)
      if (notaCalculada === null) continue

      // Check minimum scores
      const atendeMinimos = verificarMinimos(scores, vacancy.mn)

      // Calculate margin
      const margem = notaCalculada - vacancy.nc
      const margemPercent = (margem / vacancy.nc) * 100

      // Determine chance level
      const chanceLevel = getChanceLevel(margemPercent)

      // Calculate competition ratio
      const concorrencia = vacancy.v > 0 ? vacancy.n / vacancy.v : 0

      results.push({
        ...vacancy,
        notaCalculada,
        margem,
        margemPercent,
        chanceLevel,
        atendeMinimos,
        concorrencia,
        instituicao,
        curso,
        municipio,
      })
    } else {
      // No scores - just show vacancies without calculations
      const concorrencia = vacancy.v > 0 ? vacancy.n / vacancy.v : 0

      results.push({
        ...vacancy,
        notaCalculada: 0,
        margem: 0,
        margemPercent: 0,
        chanceLevel: 'arriscada',
        atendeMinimos: false,
        concorrencia,
        instituicao,
        curso,
        municipio,
      })
    }
  }

  // Sort results
  results.sort((a, b) => {
    switch (sortBy) {
      case 'chance':
        // Sort by margin (highest chance first)
        return b.margemPercent - a.margemPercent
      case 'notaCorte':
        // Sort by cut-off score (lowest first)
        return a.nc - b.nc
      case 'concorrencia':
        // Sort by competition (lowest first)
        return a.concorrencia - b.concorrencia
      case 'curso':
        // Sort alphabetically by course name
        return a.curso.n.localeCompare(b.curso.n, 'pt-BR')
      case 'instituicao':
        // Sort alphabetically by institution name
        return a.instituicao.s.localeCompare(b.instituicao.s, 'pt-BR')
      default:
        return 0
    }
  })

  return {
    results,
    totalCount: vacancies.length,
    matchingCount: results.length,
  }
}
