'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import JobList from '@/components/jobs/JobList';
import { jobApi } from '@/lib/api';
import type { JobType, ExperienceLevel, JobSearchParams } from '@/types';

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'FULL_TIME', label: '정규직' },
  { value: 'PART_TIME', label: '파트타임' },
  { value: 'CONTRACT', label: '계약직' },
  { value: 'INTERNSHIP', label: '인턴' },
  { value: 'REMOTE', label: '원격' },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'ENTRY', label: '신입' },
  { value: 'MID', label: '경력 3-5년' },
  { value: 'SENIOR', label: '경력 5-10년' },
  { value: 'LEAD', label: '리드/매니저' },
  { value: 'EXECUTIVE', label: '임원' },
];

export default function JobsPage() {
  const [searchParams, setSearchParams] = useState<JobSearchParams>({
    keyword: '',
    location: '',
    page: 1,
    limit: 12,
  });

  const [filters, setFilters] = useState({
    types: [] as JobType[],
    levels: [] as ExperienceLevel[],
  });

  const [showFilters, setShowFilters] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['jobs', searchParams, filters],
    queryFn: () =>
      jobApi.search({
        ...searchParams,
        type: filters.types[0],
        experienceLevel: filters.levels[0],
      }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => ({ ...prev, page: 1 }));
  };

  const toggleTypeFilter = (type: JobType) => {
    setFilters((prev) => ({
      ...prev,
      types: prev.types.includes(type)
        ? prev.types.filter((t) => t !== type)
        : [...prev.types, type],
    }));
  };

  const toggleLevelFilter = (level: ExperienceLevel) => {
    setFilters((prev) => ({
      ...prev,
      levels: prev.levels.includes(level)
        ? prev.levels.filter((l) => l !== level)
        : [...prev.levels, level],
    }));
  };

  const clearFilters = () => {
    setFilters({ types: [], levels: [] });
  };

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container-wrapper">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">채용공고</h1>
          <p className="mt-2 text-secondary-600">
            {data?.total || 0}개의 채용공고가 있습니다
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearch} className="mb-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <Input
                placeholder="직무, 회사명, 키워드로 검색"
                value={searchParams.keyword}
                onChange={(e) =>
                  setSearchParams((prev) => ({ ...prev, keyword: e.target.value }))
                }
              />
            </div>
            <div className="w-full md:w-48">
              <Input
                placeholder="지역"
                value={searchParams.location}
                onChange={(e) =>
                  setSearchParams((prev) => ({ ...prev, location: e.target.value }))
                }
              />
            </div>
            <Button type="submit">검색</Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              필터 {showFilters ? '숨기기' : '보기'}
            </Button>
          </div>
        </form>

        {/* Filters */}
        {showFilters && (
          <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-secondary-900">필터</h3>
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                초기화
              </button>
            </div>

            <div className="space-y-4">
              {/* Job Type */}
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary-700">
                  고용 형태
                </label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPES.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => toggleTypeFilter(type.value)}
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${
                        filters.types.includes(type.value)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Experience Level */}
              <div>
                <label className="mb-2 block text-sm font-medium text-secondary-700">
                  경력
                </label>
                <div className="flex flex-wrap gap-2">
                  {EXPERIENCE_LEVELS.map((level) => (
                    <button
                      key={level.value}
                      onClick={() => toggleLevelFilter(level.value)}
                      className={`rounded-full px-4 py-2 text-sm transition-colors ${
                        filters.levels.includes(level.value)
                          ? 'bg-primary-100 text-primary-700'
                          : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                      }`}
                    >
                      {level.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {error ? (
          <div className="rounded-lg bg-red-50 p-8 text-center">
            <p className="text-red-600">채용공고를 불러오는 중 오류가 발생했습니다.</p>
          </div>
        ) : (
          <>
            <JobList
              jobs={data?.data}
              isLoading={isLoading}
              showPagination
              currentPage={searchParams.page || 1}
              totalPages={data?.totalPages || 1}
              onPageChange={(page) => setSearchParams((prev) => ({ ...prev, page }))}
            />
          </>
        )}
      </div>
    </div>
  );
}
