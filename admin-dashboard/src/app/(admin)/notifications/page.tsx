'use client';

import { useState } from 'react';
import {
  Bell,
  Mail,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  Search,
  Trash2,
  Eye,
  Send,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card, CardHeader, StatusBadge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Table, { Column, Pagination } from '@/components/ui/Table';

interface Notification {
  id: string;
  type: 'system' | 'email' | 'push' | 'sms';
  title: string;
  message: string;
  status: 'sent' | 'pending' | 'failed' | 'scheduled';
  recipients: number;
  createdAt: string;
  sentAt?: string;
}

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'email',
    title: '새로운 채용공고 알림',
    message: '관심 분야의 새로운 채용공고가 등록되었습니다.',
    status: 'sent',
    recipients: 1250,
    createdAt: '2024-01-20T10:00:00Z',
    sentAt: '2024-01-20T10:05:00Z',
  },
  {
    id: '2',
    type: 'push',
    title: '지원 결과 안내',
    message: '지원하신 포지션의 결과가 업데이트되었습니다.',
    status: 'sent',
    recipients: 450,
    createdAt: '2024-01-19T14:30:00Z',
    sentAt: '2024-01-19T14:30:00Z',
  },
  {
    id: '3',
    type: 'system',
    title: '시스템 점검 안내',
    message: '1월 25일 새벽 2시-4시 시스템 점검이 예정되어 있습니다.',
    status: 'scheduled',
    recipients: 12584,
    createdAt: '2024-01-20T09:00:00Z',
  },
  {
    id: '4',
    type: 'email',
    title: '월간 리포트',
    message: '1월 채용 활동 리포트가 준비되었습니다.',
    status: 'pending',
    recipients: 856,
    createdAt: '2024-01-20T08:00:00Z',
  },
  {
    id: '5',
    type: 'sms',
    title: '긴급 면접 일정 변경',
    message: '면접 일정이 변경되었습니다. 확인 부탁드립니다.',
    status: 'failed',
    recipients: 15,
    createdAt: '2024-01-18T16:00:00Z',
  },
];

const typeIcons: Record<Notification['type'], React.ReactNode> = {
  system: <Bell className="h-4 w-4" />,
  email: <Mail className="h-4 w-4" />,
  push: <MessageSquare className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
};

const typeLabels: Record<Notification['type'], string> = {
  system: '시스템',
  email: '이메일',
  push: '푸시',
  sms: 'SMS',
};

const statusVariants: Record<
  Notification['status'],
  'success' | 'warning' | 'error' | 'info' | 'default'
> = {
  sent: 'success',
  pending: 'warning',
  failed: 'error',
  scheduled: 'info',
};

const statusLabels: Record<Notification['status'], string> = {
  sent: '발송완료',
  pending: '대기중',
  failed: '실패',
  scheduled: '예약됨',
};

export default function NotificationsPage() {
  const [notifications] = useState<Notification[]>(mockNotifications);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<Notification['type'] | ''>('');
  const [selectedStatus, setSelectedStatus] = useState<Notification['status'] | ''>('');
  const [currentPage, setCurrentPage] = useState(1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const columns: Column<Notification>[] = [
    {
      key: 'type',
      header: '유형',
      render: (notification) => (
        <div className="flex items-center gap-2">
          <div className="rounded-lg bg-gray-100 p-2 text-gray-600">
            {typeIcons[notification.type]}
          </div>
          <span className="text-sm text-gray-600">{typeLabels[notification.type]}</span>
        </div>
      ),
    },
    {
      key: 'title',
      header: '제목',
      render: (notification) => (
        <div>
          <p className="font-medium text-gray-900">{notification.title}</p>
          <p className="text-sm text-gray-500 truncate max-w-xs">
            {notification.message}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: '상태',
      render: (notification) => (
        <StatusBadge
          status={statusLabels[notification.status]}
          variant={statusVariants[notification.status]}
        />
      ),
    },
    {
      key: 'recipients',
      header: '수신자',
      render: (notification) => (
        <span className="text-sm text-gray-600">
          {notification.recipients.toLocaleString()}명
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: '생성일',
      render: (notification) => (
        <span className="text-sm text-gray-600">{formatDate(notification.createdAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: '',
      className: 'w-24',
      render: (notification) => (
        <div className="flex items-center gap-1">
          <button className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <Eye className="h-4 w-4" />
          </button>
          {notification.status === 'pending' && (
            <button className="rounded-lg p-2 text-primary-600 hover:bg-primary-50">
              <Send className="h-4 w-4" />
            </button>
          )}
          <button className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  // Stats
  const stats = {
    total: notifications.length,
    sent: notifications.filter((n) => n.status === 'sent').length,
    pending: notifications.filter((n) => n.status === 'pending').length,
    failed: notifications.filter((n) => n.status === 'failed').length,
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="알림 관리" subtitle="시스템 알림 및 메시지 관리" />

      <div className="p-6">
        {/* Stats */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-gray-100 p-2">
                <Bell className="h-5 w-5 text-gray-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                <p className="text-sm text-gray-500">전체 알림</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
                <p className="text-sm text-gray-500">발송완료</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-yellow-100 p-2">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
                <p className="text-sm text-gray-500">대기중</p>
              </div>
            </div>
          </Card>
          <Card padding="sm">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-red-100 p-2">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.failed}</p>
                <p className="text-sm text-gray-500">실패</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Notifications Table */}
        <Card padding="none">
          <div className="border-b border-gray-200 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-1 gap-3">
                <Input
                  type="search"
                  placeholder="알림 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="h-4 w-4" />}
                  className="max-w-xs"
                />
                <select
                  value={selectedType}
                  onChange={(e) =>
                    setSelectedType(e.target.value as Notification['type'] | '')
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">모든 유형</option>
                  <option value="system">시스템</option>
                  <option value="email">이메일</option>
                  <option value="push">푸시</option>
                  <option value="sms">SMS</option>
                </select>
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as Notification['status'] | '')
                  }
                  className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <option value="">모든 상태</option>
                  <option value="sent">발송완료</option>
                  <option value="pending">대기중</option>
                  <option value="scheduled">예약됨</option>
                  <option value="failed">실패</option>
                </select>
              </div>
              <Button leftIcon={<Send className="h-4 w-4" />}>새 알림 작성</Button>
            </div>
          </div>

          <Table
            columns={columns}
            data={notifications}
            keyExtractor={(n) => n.id}
            emptyMessage="알림이 없습니다"
          />

          <div className="border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={1}
              onPageChange={setCurrentPage}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}
