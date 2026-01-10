'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Search, Filter, MoreVertical, Eye, Ban, Trash2 } from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card } from '@/components/ui/Card';
import Table, { Column, Pagination } from '@/components/ui/Table';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { StatusBadge } from '@/components/ui/Card';
import { apiClient } from '@/lib/api';
import { User, UserStatus, UserRole, PaginationParams } from '@/types';

// Mock data for demonstration
const mockUsers: User[] = [
  {
    id: '1',
    email: 'john.doe@example.com',
    name: 'John Doe',
    role: 'job_seeker',
    status: 'active',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T10:30:00Z',
    lastLoginAt: '2024-01-20T14:22:00Z',
    provider: 'email',
  },
  {
    id: '2',
    email: 'jane.smith@techcorp.com',
    name: 'Jane Smith',
    role: 'employer',
    status: 'active',
    createdAt: '2024-01-10T09:15:00Z',
    updatedAt: '2024-01-10T09:15:00Z',
    lastLoginAt: '2024-01-19T16:45:00Z',
    provider: 'google',
  },
  {
    id: '3',
    email: 'bob.wilson@gmail.com',
    name: 'Bob Wilson',
    role: 'job_seeker',
    status: 'suspended',
    createdAt: '2024-01-05T11:00:00Z',
    updatedAt: '2024-01-18T08:30:00Z',
    provider: 'kakao',
  },
  {
    id: '4',
    email: 'alice.brown@startup.io',
    name: 'Alice Brown',
    role: 'employer',
    status: 'pending_verification',
    createdAt: '2024-01-20T15:00:00Z',
    updatedAt: '2024-01-20T15:00:00Z',
    provider: 'email',
  },
  {
    id: '5',
    email: 'charlie.kim@naver.com',
    name: 'Charlie Kim',
    role: 'job_seeker',
    status: 'active',
    createdAt: '2024-01-12T13:20:00Z',
    updatedAt: '2024-01-12T13:20:00Z',
    lastLoginAt: '2024-01-20T09:10:00Z',
    provider: 'naver',
  },
];

const statusVariants: Record<UserStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'success',
  inactive: 'default',
  suspended: 'error',
  pending_verification: 'warning',
};

const roleLabels: Record<UserRole, string> = {
  job_seeker: '구직자',
  employer: '기업회원',
  admin: '관리자',
};

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>(mockUsers);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<UserStatus | ''>('');
  const [pagination, setPagination] = useState<PaginationParams>({
    page: 1,
    limit: 10,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await apiClient.getUsers(pagination, {
        search: searchQuery || undefined,
        role: selectedRole || undefined,
        status: selectedStatus || undefined,
      });
      if (response.success && response.data) {
        setUsers(response.data.data);
        setTotalPages(response.data.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setIsLoading(false);
    }
  }, [pagination, searchQuery, selectedRole, selectedStatus]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSort = (key: string) => {
    setPagination((prev) => ({
      ...prev,
      sortBy: key,
      sortOrder: prev.sortBy === key && prev.sortOrder === 'asc' ? 'desc' : 'asc',
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const columns: Column<User>[] = [
    {
      key: 'name',
      header: '사용자',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-100 text-primary-600 font-medium">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: '유형',
      sortable: true,
      render: (user) => (
        <span className="text-sm text-gray-600">{roleLabels[user.role]}</span>
      ),
    },
    {
      key: 'status',
      header: '상태',
      sortable: true,
      render: (user) => (
        <StatusBadge status={user.status} variant={statusVariants[user.status]} />
      ),
    },
    {
      key: 'provider',
      header: '인증방식',
      render: (user) => (
        <span className="text-sm text-gray-600 capitalize">
          {user.provider || '-'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '가입일',
      sortable: true,
      render: (user) => (
        <span className="text-sm text-gray-600">{formatDate(user.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-12',
      render: (user) => (
        <div className="flex items-center gap-1">
          <Link
            href={`/users/${user.id}`}
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
        title="사용자 관리"
        subtitle="플랫폼 사용자 및 계정 관리"
      />

      <div className="p-6">
        <Card padding="none">
          {/* Filters */}
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-3">
                <Input
                  type="search"
                  placeholder="사용자 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="max-w-xs"
                />
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value as UserRole | '')}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">전체 유형</option>
                  <option value="job_seeker">구직자</option>
                  <option value="employer">기업회원</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value as UserStatus | '')}
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">전체 상태</option>
                  <option value="active">활성</option>
                  <option value="inactive">비활성</option>
                  <option value="suspended">정지됨</option>
                  <option value="pending_verification">대기중</option>
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
            data={users}
            keyExtractor={(user) => user.id}
            sortBy={pagination.sortBy}
            sortOrder={pagination.sortOrder}
            onSort={handleSort}
            isLoading={isLoading}
            emptyMessage="사용자가 없습니다"
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
