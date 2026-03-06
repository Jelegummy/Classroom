import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationDemo({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <div className="w-full rounded-2xl border border-gray-200 bg-white px-6 py-3 shadow-sm sm:w-auto">
      <Pagination>
        <PaginationContent className="gap-1 sm:gap-2">
          <PaginationItem>
            <PaginationPrevious
              onClick={e => {
                e.preventDefault()
                if (currentPage > 1) onPageChange(currentPage - 1)
              }}
              className={`rounded-xl transition-colors ${
                currentPage <= 1
                  ? 'pointer-events-none text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            />
          </PaginationItem>

          {pages.map(page => (
            <PaginationItem key={page}>
              <PaginationLink
                onClick={e => {
                  e.preventDefault()
                  onPageChange(page)
                }}
                isActive={page === currentPage}
                className={`rounded-xl transition-colors ${
                  page === currentPage
                    ? 'border-blue-200 bg-blue-50 font-semibold text-primary hover:bg-blue-100'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              onClick={e => {
                e.preventDefault()
                if (currentPage < totalPages) onPageChange(currentPage + 1)
              }}
              className={`rounded-xl transition-colors ${
                currentPage >= totalPages
                  ? 'pointer-events-none text-gray-300'
                  : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
              }`}
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}
