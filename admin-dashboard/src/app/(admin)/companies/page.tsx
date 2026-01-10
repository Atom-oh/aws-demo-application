'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  Building2,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import Table, { Column, Pagination } from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Card';
import { apiClient } from '@/lib/api';
import { Company, CompanyStatus, CompanySize, PaginationParams } from '@/types';

// Mock data for demonstration
const mockCompanies: Company[] = [
  {
    id: '1',
    name: 'TechCorp Inc.',
    description: 'Leading technology company',
    industry: 'Technology',
    size: 'large',
    status: 'verified',
    location: 'Seoul, Korea',
    employerId: 'user-1',
    createdAt: '2024-01-10T09:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    verifiedAt: '2024-01-12T14:00:00Z',
  },
  {
    id: '2',
    name: 'StartupXYZ',
    description: 'Innovative startup',
    industry: 'Fintech',
    size: 'startup',
    status: 'pending',
    location: 'Busan, Korea',
    employerId: 'user-2',
    createdAt: '2024-01-18T11:00:00Z',
    updatedAt: '2024-01-18T11:00:00Z',
  },
  {
    id: '3',
    name: 'Global Finance',
    description: 'Financial services',
    industry: 'Finance',
    size: 'enterprise',
    status: 'verified',
    location: 'Seoul, Korea',
    employerId: 'user-3',
    createdAt: '2024-01-05T08:00:00Z',
    updatedAt: '2024-01-10T09:00:00Z',
    verifiedAt: '2024-01-07T10:00:00Z',
  },
  {
    id: '4',
    name: 'Creative Agency',
    description: 'Design and marketing',
    industry: 'Marketing',
    size: 'small',
    status: 'rejected',
    location: 'Incheon, Korea',
    employerId: 'user-4',
    createdAt: '2024-01-12T13:00:00Z',
    updatedAt: '2024-01-14T16:00:00Z',
  },
  {
    id: '5',
    name: 'MedTech Solutions',
    description: 'Healthcare technology',
    industry: 'Healthcare',
    size: 'medium',
    status: 'verified',
    location: 'Daegu, Korea',
    employerId: 'user-5',
    createdAt: '2024-01-08T10:00:00Z',
    updatedAt: '2024-01-09T11:00:00Z',
    verifiedAt: '2024-01-09T11:00:00Z',
  },
];

const statusVariants: Record<CompanyStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  verified: 'success',
  pending: 'warning',
  rejected: 'error',
  suspended: 'default',
};

const sizeLabels: Record<CompanySize, string> = {
  startup: '1-10명',
  small: '11-50명',
  medium: '51-200명',
  large: '201-1000명',
  enterprise: '1000명+',
};

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>(mockCompanies);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<CompanyStatus | ''>('');
  const [selectedSize, setSelectedSize] = useState<CompanySize | ''>('');
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchCompanies = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getCompanies(pagination, {
        search: searchQuery || undefined,
        status: selectedStatus || undefined,
        size: selectedSize || undefined,
      });
      if (response.success && response.data) {
        setCompanies(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination, searchQuery, selectedStatus, selectedSize]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleSort = (key: string) => {
    setPagination((prev) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const handleVerify = async (companyId: string) => {
    try {
      await apiClient.verifyCompany(companyId);
      setCompanies((prev) =>
        prev.map((c) =>
          c.id === companyId ? { ...c, status: 'verified' as CompanyStatus } : c
        )
      );
    } catch (error) {
      console.error('Failed to verify company:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: Column<Company>[] = [
    {
      key: 'name',
      header: '기업명',
      sortable: true,
      render: (company) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
            {company.logoUrl ? (
              <img
                src={company.logoUrl}
                alt={company.name}
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <Building2 className="h-5 w-5 text-gray-400" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{company.name}</p>
            <p className="text-sm text-gray-500">{company.industry}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: '위치',
      render: (company) => (
        <span className="text-sm text-gray-600">{company.location}</span>
      ),
    },
    {
      key: 'size',
      header: '규모',
      render: (company) => (
        <span className="text-sm text-gray-600">
          {sizeLabels[company.size]}
        </span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      sortable: true,
      render: (company) => (
        <StatusBadge status={company.status} variant={statusVariants[company.status]} />
      ),
    },
    {
      key: 'createdAt',
      header: '등록일',
      sortable: true,
      render: (company) => (
        <span className="text-sm text-gray-600">{formatDate(company.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (company) => (
        <div className="flex items-center gap-1">
          {company.status === 'pending' && (
            <button
              onClick={() => handleVerify(company.id)}
              className="rounded-lg p-2 text-green-600 hover:bg-green-50"
              title="Verify company"
            >
              <CheckCircle className="h-4 w-4" />
            </button>
          )}
          <Link
            href={`/companies/${company.id}`}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <Eye className="h-4 w-4" />
          </Link>
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="기업 관리"
        subtitle="등록 기업 및 인증 관리"
      />

      <div className="p-6">
        <Card padding="none">
          {/* Filters */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-3">
                <Input
                  type="search"
                  placeholder="기업 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="max-w-xs"
                />
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as CompanyStatus | '')}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">전체 상태</option>
                  <option value="pending">대기중</option>
                  <option value="verified">인증완료</option>
                  <option value="rejected">거절됨</option>
                  <option value="suspended">정지됨</option>
                </select>
                <select
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value as CompanySize | '')}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">전체 규모</option>
                  <option value="startup">스타트업 (1-10명)</option>
                  <option value="small">소기업 (11-50명)</option>
                  <option value="medium">중기업 (51-200명)</option>
                  <option value="large">대기업 (201-1000명)</option>
                  <option value="enterprise">대기업 (1000명+)</option>
                </select>
              </div>
              <Button variant="outline" leftIcon={<Filter className="h-4 w-4" />}>
                추가 필터
              </Button>
            </div>
          </div>

          {/* Table */}
          <Table
            columns={columns}
            data={companies}
            keyExtractor={(company) => company.id}
            sortBy={pagination.sortBy}
            sortOrder={pagination.sortOrder}
            onSort={handleSort}
            isLoading={isLoading}
            emptyMessage="등록된 기업이 없습니다"
          />

          {/* Pagination */}
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
