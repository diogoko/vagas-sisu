import { Checkbox } from './ui/checkbox'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import type { Filters } from '../types'
import { UF_REGIONS, MODALIDADE_LABELS, GRAU_LABELS, TURNO_LABELS } from '../types'

interface FilterPanelProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  activeCount: number
  onClear: () => void
}

export function FilterPanel({
  filters,
  onFilterChange,
  activeCount,
  onClear,
}: FilterPanelProps) {
  const toggleFilter = (key: keyof Filters, value: string) => {
    const arr = filters[key] as string[]
    const newArr = arr.includes(value)
      ? arr.filter(v => v !== value)
      : [...arr, value]
    onFilterChange({ ...filters, [key]: newArr })
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Buscar</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            type="search"
            placeholder="Curso, instituicao ou cidade..."
            value={filters.searchText}
            onChange={(e) => onFilterChange({ ...filters, searchText: e.target.value })}
          />
        </CardContent>
      </Card>

      {/* States by Region */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Estados (UFs)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(UF_REGIONS).map(([region, ufs]) => (
            <div key={region}>
              <p className="text-xs font-medium text-muted-foreground mb-2">{region}</p>
              <div className="flex flex-wrap gap-2">
                {ufs.map(uf => (
                  <label
                    key={uf}
                    className="flex items-center gap-1.5 cursor-pointer"
                  >
                    <Checkbox
                      checked={filters.ufs.includes(uf)}
                      onCheckedChange={() => toggleFilter('ufs', uf)}
                    />
                    <span className="text-sm">{uf}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Modalidade */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Modalidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(MODALIDADE_LABELS).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.modalidades.includes(key)}
                  onCheckedChange={() => toggleFilter('modalidades', key)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Grau */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Tipo de Curso</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(GRAU_LABELS).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.graus.includes(key)}
                  onCheckedChange={() => toggleFilter('graus', key)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Turno */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Turno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(TURNO_LABELS).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 cursor-pointer"
              >
                <Checkbox
                  checked={filters.turnos.includes(key)}
                  onCheckedChange={() => toggleFilter('turnos', key)}
                />
                <span className="text-sm">{label}</span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Clear button */}
      {activeCount > 0 && (
        <Button
          variant="outline"
          className="w-full"
          onClick={onClear}
        >
          Limpar filtros ({activeCount})
        </Button>
      )}
    </div>
  )
}
