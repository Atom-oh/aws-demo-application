'use client';

import { useQuery } from '@tanstack/react-query';
import JobCard from './JobCard';
import Button from '@/components/ui/Button';
import { jobApi } from '@/lib/api';
import type { Job } from '@/types';

interface JobListProps {
  jobs?: Job[];
  isLoading?: boolean;
  limit?: number;
  showPagination?: boolean;
  currentPage?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
}

export default function JobList({
  jobs: propJobs,
  isLoading: propIsLoading,
  limit = 6,
  showPagination = false,
  currentPage = 1,
  totalPages = 1,
  onPageChange,
}: JobListProps) {
  // If jobs are passed as props, use them; otherwise fetch
  const { data, isLoading: queryLoading } = useQuery({
    queryKey: ['jobs', 'recent', limit],
    queryFn: () => jobApi.search({ page: 1, limit }),
    enabled: !propJobs,
  });

  const jobs = propJobs || data?.data || [];
  const isLoading = propIsLoading !== undefined ? propIsLoading : queryLoading;

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: limit }).map((_, index) => (
          <div
            key={index}
            className="h-64 animate-pulse rounded-lg bg-secondary-200"
          />
        ))}
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="rounded-lg bg-white p-12 text-center shadow-sm">
        <div className="mb-4 text-5xl">&#128269;</div>
        <h3 className="mb-2 text-lg font-semibold text-secondary-900">
          채용공고가 없습니다
        </h3>
        <p className="text-secondary-600">
          검색 조건을 변경해보세요.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {jobs.map((job: Job) => (
          <JobCard key={job.id} job={job} />
        ))}
      </div>

      {showPagination && totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            이전
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }).map((_, index) => {
              let pageNumber: number;

              if (totalPages <= 5) {
                pageNumber = index + 1;
              } else if (currentPage <= 3) {
                pageNumber = index + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + index;
              } else {
                pageNumber = currentPage - 2 + index;
              }

              return (
                <button
                  key={pageNumber}
                  onClick={() => onPageChange?.(pageNumber)}
                  className={`flex h-8 w-8 items-center justify-center rounded text-sm transition-colors ${
                    currentPage === pageNumber
                      ? 'bg-primary-600 text-white'
                      : 'text-secondary-600 hover:bg-secondary-100'
                  }`}
                >
                  {pageNumber}
                </button>
              );
            })}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </Button>
        </div>
      )}
    </div>
  );
}
