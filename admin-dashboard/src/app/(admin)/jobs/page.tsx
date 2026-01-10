'use client';

import { useEffect, useState, useCallback } from 'react';
import { Search, Filter, MoreVertical, Eye, Pause, Play } from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import Table, { Column, Pagination } from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Card';
import { apiClient } from '@/lib/api';
import { Job, JobStatus, PaginationParams } from '@/types';

const mockJobs: Job[] = [
  {
    id: '1',
    title: 'Senior Software Engineer',
    description: 'Join our team',
    companyId: '1',
    location: 'Seoul',
    employmentType: 'full_time',
    experienceLevel: 'senior',
    salaryMin: 80000000,
    salaryMax: 120000000,
    currency: 'KRW',
    skills: ['React', 'Node.js', 'TypeScript'],
    status: 'active',
    viewCount: 1234,
    applicationCount: 45,
    createdAt: '2024-01-15T10:00:00Z',
    updatedAt: '2024-01-15T10:00:00Z',
    expiresAt: '2024-02-15T10:00:00Z',
  },
  {
    id: '2',
    title: 'Product Manager',
    description: 'Lead product strategy',
    companyId: '2',
    location: 'Busan',
    employmentType: 'full_time',
    experienceLevel: 'mid',
    skills: ['Agile', 'Analytics'],
    status: 'active',
    viewCount: 856,
    applicationCount: 28,
    createdAt: '2024-01-12T09:00:00Z',
    updatedAt: '2024-01-12T09:00:00Z',
    expiresAt: '2024-02-12T09:00:00Z',
    currency: 'KRW',
  },
  {
    id: '3',
    title: 'UX Designer',
    description: 'Design user experiences',
    companyId: '1',
    location: 'Seoul',
    employmentType: 'contract',
    experienceLevel: 'junior',
    skills: ['Figma', 'UI/UX'],
    status: 'paused',
    viewCount: 432,
    applicationCount: 12,
    createdAt: '2024-01-10T11:00:00Z',
    updatedAt: '2024-01-18T14:00:00Z',
    expiresAt: '2024-02-10T11:00:00Z',
    currency: 'KRW',
  },
];

const statusVariants: Record<JobStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'success',
  draft: 'default',
  paused: 'warning',
  closed: 'info',
  expired: 'error',
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<JobStatus | ''>('');
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getJobs(pagination, {
        search: searchQuery || undefined,
        status: selectedStatus || undefined,
      });
      if (response.success && response.data) {
        setJobs(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination, searchQuery, selectedStatus]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleSort = (key: string) => {
    setPagination((prev) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleStatusToggle = async (job: Job) => {
    const newStatus = job.status === 'active' ? 'paused' : 'active';
    try {
      await apiClient.updateJobStatus(job.id, newStatus);
      setJobs((prev) =>
        prev.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j))
      );
    } catch (error) {
      console.error('Failed to update job status:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: Column<Job>[] = [
    {
      key: 'title',
      header: '채용공고',
      sortable: true,
      render: (job) => (
        <div>
          <p className="font-medium text-gray-900">{job.title}</p>
          <p className="text-sm text-gray-500">{job.location}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      sortable: true,
      render: (job) => <StatusBadge status={job.status} variant={statusVariants[job.status]} />,
    },
    {
      key: 'applicationCount',
      header: '지원자',
      sortable: true,
      render: (job) => <span className="text-sm text-gray-600">{job.applicationCount}</span>,
    },
    {
      key: 'viewCount',
      header: '조회수',
      sortable: true,
      render: (job) => <span className="text-sm text-gray-600">{job.viewCount.toLocaleString()}</span>,
    },
    {
      key: 'createdAt',
      header: '등록일',
      sortable: true,
      render: (job) => <span className="text-sm text-gray-600">{formatDate(job.createdAt)}</span>,
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (job) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleStatusToggle(job)}
            className={`rounded-lg p-2 ${
              job.status === 'active'
                ? 'text-yellow-600 hover:bg-yellow-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={job.status === 'active' ? '일시정지' : '활성화'}
          >
            {job.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <Eye className="h-4 w-4" />
          </button>
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <AdminHeader title="채용공고 관리" subtitle="채용공고 모니터링 및 관리" />
      <div className="p-6">
        <Card padding="none">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-3">
                <Input
                  type="search"
                  placeholder="채용공고 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="max-w-xs"
                />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as JobStatus | '')}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">전체 상태</option>
                  <option value="active">진행중</option>
                  <option value="paused">일시정지</option>
                  <option value="closed">마감</option>
                  <option value="expired">만료</option>
                </select>
              </div>
              <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
                추가 필터
              </Button>
            </div>
          </div>
          <Table
            columns={columns}
            data={jobs}
            keyExtractor={(job) => job.id}
            sortBy={pagination.sortBy}
            sortOrder={pagination.sortOrder}
            onSort={handleSort}
            isLoading={isLoading}
            emptyMessage="채용공고가 없습니다"
          />
          <div className="border-t border-gray-200">
            <Pagination
              currentPage={pagination.page}
              totalPages={totalPages}
              onPageChange={(page) => setPagination((prev) => ({ ...prev, page }))}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
