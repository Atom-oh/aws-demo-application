'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  Shield,
  Ban,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card, CardHeader, StatusBadge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { User, UserStatus } from '@/types';

// Mock user for demonstration
const mockUser: User = {
  id: '1',
  email: 'john.doe@example.com',
  name: 'John Doe',
  role: 'job_seeker',
  status: 'active',
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  lastLoginAt: '2024-01-20T14:22:00Z',
  phoneNumber: '+82-10-1234-5678',
  provider: 'email',
};

const statusVariants: Record<UserStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'success',
  inactive: 'default',
  suspended: 'error',
  pending_verification: 'warning',
};

export default function UserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getUserById(userId);
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          // Use mock data for demo
          setUser({ ...mockUser, id: userId });
        }
      } catch (error) {
        console.error('Failed to fetch user:', error);
        setUser({ ...mockUser, id: userId });
      } finally {
        setIsLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  const handleStatusChange = async (newStatus: UserStatus) => {
    if (!user) return;
    setActionLoading(newStatus);
    try {
      const response = await apiClient.updateUserStatus(user.id, newStatus);
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        // Demo: update locally
        setUser({ ...user, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update user status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!user || !confirm('Are you sure you want to delete this user?')) return;
    setActionLoading('delete');
    try {
      await apiClient.deleteUser(user.id);
      router.push('/users');
    } catch (error) {
      console.error('Failed to delete user:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-gray-500">User not found</p>
        <Button variant="outline" onClick={() => router.push('/users')} className="mt-4">
          Back to Users
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="User Details" subtitle={`Viewing user: ${user.name}`} />

      <div className="p-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Users
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2">
            <Card>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 text-primary-600 text-2xl font-bold">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                    <p className="text-sm text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                    <StatusBadge status={user.status} variant={statusVariants[user.status]} className="mt-2" />
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Mail className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">{user.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Phone className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Phone</p>
                    <p className="text-sm font-medium text-gray-900">{user.phoneNumber || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Joined</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(user.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Last Login</p>
                    <p className="text-sm font-medium text-gray-900">{formatDate(user.lastLoginAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Shield className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Auth Provider</p>
                    <p className="text-sm font-medium text-gray-900 capitalize">{user.provider || '-'}</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Actions" description="Manage user account" />
              <div className="mt-4 space-y-3">
                {user.status === 'active' ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Ban className="h-4 w-4" />}
                    onClick={() => handleStatusChange('suspended')}
                    isLoading={actionLoading === 'suspended'}
                  >
                    Suspend User
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    onClick={() => handleStatusChange('active')}
                    isLoading={actionLoading === 'active'}
                  >
                    Activate User
                  </Button>
                )}
                <Button
                  variant="danger"
                  className="w-full justify-start"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={handleDelete}
                  isLoading={actionLoading === 'delete'}
                >
                  Delete User
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="Activity" description="Recent user activity" />
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Applications</span>
                  <span className="font-medium text-gray-900">12</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Saved Jobs</span>
                  <span className="font-medium text-gray-900">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Profile Views</span>
                  <span className="font-medium text-gray-900">156</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
