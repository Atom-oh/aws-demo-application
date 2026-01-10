'use client';

import { ReactNode } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => ReactNode;
  className?: string;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (key: string) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  className?: string;
}

function Table<T>({
  columns,
  data,
  keyExtractor,
  sortBy,
  sortOrder,
  onSort,
  isLoading,
  emptyMessage = 'No data available',
  className,
}: TableProps<T>) {
  const renderSortIcon = (column: Column<T>) => {
    if (!column.sortable) return null;

    if (sortBy === column.key) {
      return sortOrder === 'asc' ? (
        <ChevronUp className="h-4 w-4" />
      ) : (
        <ChevronDown className="h-4 w-4" />
      );
    }

    return <ChevronsUpDown className="h-4 w-4 text-gray-400" />;
  };

  return (
    <div className={cn('overflow-hidden rounded-lg border border-gray-200 bg-white', className)}>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={cn(
                    'px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600',
                    column.sortable && 'cursor-pointer hover:bg-gray-100',
                    column.className
                  )}
                  onClick={() => column.sortable && onSort?.(column.key)}
                >
                  <div className="flex items-center gap-1">
                    {column.header}
                    {renderSortIcon(column)}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {isLoading ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={keyExtractor(item)}
                  className="hover:bg-gray-50 transition-colors"
                >
                  {columns.map((column) => (
                    <td
                      key={`${keyExtractor(item)}-${column.key}`}
                      className={cn(
                        'whitespace-nowrap px-6 py-4 text-sm text-gray-900',
                        column.className
                      )}
                    >
                      {column.render
                        ? column.render(item)
                        : (item as Record<string, unknown>)[column.key] as ReactNode}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: PaginationProps) {
  const pages = [];
  const showEllipsisStart = currentPage > 3;
  const showEllipsisEnd = currentPage < totalPages - 2;

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);
    if (showEllipsisStart) {
      pages.push(-1); // Ellipsis marker
    }
    for (
      let i = Math.max(2, currentPage - 1);
      i <= Math.min(totalPages - 1, currentPage + 1);
      i++
    ) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    if (showEllipsisEnd) {
      pages.push(-2); // Ellipsis marker
    }
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }
  }

  return (
    <nav
      className={cn('flex items-center justify-between px-4 py-3', className)}
      aria-label="Pagination"
    >
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>
      <div className="hidden sm:flex sm:gap-1">
        {pages.map((page, index) =>
          page < 0 ? (
            <span
              key={`ellipsis-${index}`}
              className="relative inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={cn(
                'relative inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              {page}
            </button>
          )
        )}
      </div>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </nav>
  );
}

export default Table;
