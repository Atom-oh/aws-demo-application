'use client';

import { useEffect, useState } from 'react';
import { Bell, Search, User } from 'lucide-react';
import { getAdminUser } from '@/lib/auth';
import { AdminUser } from '@/types';
import Input from '@/components/ui/Input';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
}

export default function AdminHeader({ title, subtitle }: AdminHeaderProps) {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const adminUser = await getAdminUser();
      setUser(adminUser);
    };
    fetchUser();
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-admin-header px-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="hidden md:block">
          <Input
            type="search"
            placeholder="Search..."
            className="w-64"
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>

        {/* Notifications */}
        <button className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <Bell className="h-5 w-5" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Profile */}
        <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
          <div className="hidden sm:block text-right">
            <p className="text-sm font-medium text-gray-900">
              {user?.name || 'Admin User'}
            </p>
            <p className="text-xs text-gray-500 capitalize">
              {user?.role?.replace('_', ' ') || 'Administrator'}
            </p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            <User className="h-5 w-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
