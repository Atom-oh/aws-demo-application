'use client';

import { useState } from 'react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { JobType, ExperienceLevel, JobSearchParams } from '@/types';

interface JobFiltersProps {
  searchParams: JobSearchParams;
  onSearchChange: (params: Partial<JobSearchParams>) => void;
  onSearch: () => void;
  className?: string;
}

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

const LOCATIONS = [
  '서울',
  '경기',
  '인천',
  '부산',
  '대구',
  '대전',
  '광주',
  '울산',
  '세종',
  '강원',
  '충북',
  '충남',
  '전북',
  '전남',
  '경북',
  '경남',
  '제주',
];

export default function JobFilters({
  searchParams,
  onSearchChange,
  onSearch,
  className = '',
}: JobFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [selectedTypes, setSelectedTypes] = useState<JobType[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<ExperienceLevel[]>([]);

  const handleKeywordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange({ keyword: e.target.value });
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSearchChange({ location: e.target.value });
  };

  const toggleJobType = (type: JobType) => {
    const newTypes = selectedTypes.includes(type)
      ? selectedTypes.filter((t) => t !== type)
      : [...selectedTypes, type];
    setSelectedTypes(newTypes);
    onSearchChange({ type: newTypes[0] });
  };

  const toggleExperienceLevel = (level: ExperienceLevel) => {
    const newLevels = selectedLevels.includes(level)
      ? selectedLevels.filter((l) => l !== level)
      : [...selectedLevels, level];
    setSelectedLevels(newLevels);
    onSearchChange({ experienceLevel: newLevels[0] });
  };

  const handleSalaryChange = (field: 'salaryMin' | 'salaryMax', value: string) => {
    const numValue = value ? parseInt(value, 10) : undefined;
    onSearchChange({ [field]: numValue });
  };

  const clearFilters = () => {
    setSelectedTypes([]);
    setSelectedLevels([]);
    onSearchChange({
      keyword: '',
      location: '',
      type: undefined,
      experienceLevel: undefined,
      salaryMin: undefined,
      salaryMax: undefined,
    });
  };

  const activeFilterCount =
    selectedTypes.length +
    selectedLevels.length +
    (searchParams.salaryMin ? 1 : 0) +
    (searchParams.salaryMax ? 1 : 0);

  return (
    <div className={className}>
      {/* Search Bar */}
      <div className="mb-4 flex flex-col gap-3 md:flex-row">
        <div className="flex-1">
          <Input
            placeholder="직무, 회사명, 키워드로 검색"
            value={searchParams.keyword || ''}
            onChange={handleKeywordChange}
            leftIcon={
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            }
          />
        </div>
        <div className="w-full md:w-44">
          <select
            value={searchParams.location || ''}
            onChange={handleLocationChange}
            className="w-full rounded-lg border border-secondary-300 bg-white px-4 py-2.5 text-secondary-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          >
            <option value="">전체 지역</option>
            {LOCATIONS.map((loc) => (
              <option key={loc} value={loc}>
                {loc}
              </option>
            ))}
          </select>
        </div>
        <Button onClick={onSearch}>검색</Button>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="relative"
        >
          필터
          {activeFilterCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary-500 text-xs text-white">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="rounded-lg border border-secondary-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-secondary-900">상세 필터</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                초기화
              </button>
            )}
          </div>

          <div className="space-y-6">
            {/* Job Type Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700">
                고용 형태
              </label>
              <div className="flex flex-wrap gap-2">
                {JOB_TYPES.map((type) => (
                  <button
                    key={type.value}
                    onClick={() => toggleJobType(type.value)}
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      selectedTypes.includes(type.value)
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-500'
                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                    }`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Experience Level Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700">
                경력
              </label>
              <div className="flex flex-wrap gap-2">
                {EXPERIENCE_LEVELS.map((level) => (
                  <button
                    key={level.value}
                    onClick={() => toggleExperienceLevel(level.value)}
                    className={`rounded-full px-4 py-2 text-sm transition-colors ${
                      selectedLevels.includes(level.value)
                        ? 'bg-primary-100 text-primary-700 ring-1 ring-primary-500'
                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                    }`}
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Salary Range Filter */}
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700">
                연봉 (만원)
              </label>
              <div className="flex items-center gap-3">
                <Input
                  type="number"
                  placeholder="최소"
                  value={searchParams.salaryMin || ''}
                  onChange={(e) => handleSalaryChange('salaryMin', e.target.value)}
                  className="w-32"
                />
                <span className="text-secondary-400">~</span>
                <Input
                  type="number"
                  placeholder="최대"
                  value={searchParams.salaryMax || ''}
                  onChange={(e) => handleSalaryChange('salaryMax', e.target.value)}
                  className="w-32"
                />
              </div>
            </div>

            {/* Sort Options */}
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700">
                정렬
              </label>
              <div className="flex gap-2">
                {[
                  { value: 'recent', label: '최신순' },
                  { value: 'salary', label: '연봉순' },
                  { value: 'relevance', label: '관련도순' },
                ].map((sort) => (
                  <button
                    key={sort.value}
                    onClick={() =>
                      onSearchChange({ sortBy: sort.value as JobSearchParams['sortBy'] })
                    }
                    className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                      searchParams.sortBy === sort.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-secondary-100 text-secondary-600 hover:bg-secondary-200'
                    }`}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
