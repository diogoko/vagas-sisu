import { useState, useCallback } from 'react'
import type { Filters } from '../types'

const initialFilters: Filters = {
  ufs: [],
  cursos: [],
  instituicoes: [],
  modalidades: [],
  graus: [],
  turnos: [],
  tiposConcorrencia: [],
  searchText: '',
}

interface UseFiltersReturn {
  filters: Filters
  setFilters: React.Dispatch<React.SetStateAction<Filters>>
  toggleUf: (uf: string) => void
  toggleModalidade: (modalidade: string) => void
  toggleGrau: (grau: string) => void
  toggleTurno: (turno: string) => void
  setSearchText: (text: string) => void
  clearFilters: () => void
  activeFilterCount: number
}

export function useFilters(): UseFiltersReturn {
  const [filters, setFilters] = useState<Filters>(initialFilters)

  const toggleArrayFilter = useCallback(<K extends keyof Filters>(
    key: K,
    value: string
  ) => {
    setFilters(prev => {
      const arr = prev[key] as string[]
      const newArr = arr.includes(value)
        ? arr.filter(v => v !== value)
        : [...arr, value]
      return { ...prev, [key]: newArr }
    })
  }, [])

  const toggleUf = useCallback((uf: string) => {
    toggleArrayFilter('ufs', uf)
  }, [toggleArrayFilter])

  const toggleModalidade = useCallback((modalidade: string) => {
    toggleArrayFilter('modalidades', modalidade)
  }, [toggleArrayFilter])

  const toggleGrau = useCallback((grau: string) => {
    toggleArrayFilter('graus', grau)
  }, [toggleArrayFilter])

  const toggleTurno = useCallback((turno: string) => {
    toggleArrayFilter('turnos', turno)
  }, [toggleArrayFilter])

  const setSearchText = useCallback((text: string) => {
    setFilters(prev => ({ ...prev, searchText: text }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters(initialFilters)
  }, [])

  const activeFilterCount =
    filters.ufs.length +
    filters.cursos.length +
    filters.instituicoes.length +
    filters.modalidades.length +
    filters.graus.length +
    filters.turnos.length +
    filters.tiposConcorrencia.length +
    (filters.searchText ? 1 : 0)

  return {
    filters,
    setFilters,
    toggleUf,
    toggleModalidade,
    toggleGrau,
    toggleTurno,
    setSearchText,
    clearFilters,
    activeFilterCount,
  }
}
