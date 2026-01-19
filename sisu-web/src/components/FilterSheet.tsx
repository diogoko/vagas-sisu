import { Button } from './ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet'
import { FilterPanel } from './FilterPanel'
import type { Filters } from '../types'

interface FilterSheetProps {
  filters: Filters
  onFilterChange: (filters: Filters) => void
  activeCount: number
  onClear: () => void
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FilterSheet({
  filters,
  onFilterChange,
  activeCount,
  onClear,
  open,
  onOpenChange,
}: FilterSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>Filtros</span>
          {activeCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-full">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh]">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <span>🔍</span>
            Filtros
          </SheetTitle>
        </SheetHeader>
        <div className="overflow-y-auto h-[calc(100%-60px)] pb-8">
          <FilterPanel
            filters={filters}
            onFilterChange={onFilterChange}
            activeCount={activeCount}
            onClear={onClear}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
