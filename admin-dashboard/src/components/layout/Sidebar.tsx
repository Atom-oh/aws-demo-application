'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  LayoutDashboard,
  Users,
  Building2,
  Briefcase,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
} from 'lucide-react';
import { adminLogout } from '@/lib/auth';

function cn(...inputs: (string | undefined | null | boolean)[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
}

const navigation: NavItem[] = [
  {
    name: '대시보드',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
  },
  {
    name: '사용자 관리',
    href: '/users',
    icon: <Users className="h-5 w-5" />,
  },
  {
    name: '기업 관리',
    href: '/companies',
    icon: <Building2 className="h-5 w-5" />,
  },
  {
    name: '채용공고',
    href: '/jobs',
    icon: <Briefcase className="h-5 w-5" />,
  },
  {
    name: '분석',
    href: '/analytics',
    icon: <BarChart3 className="h-5 w-5" />,
  },
  {
    name: '알림 관리',
    href: '/notifications',
    icon: <Bell className="h-5 w-5" />,
  },
];

const bottomNavigation: NavItem[] = [
  {
    name: '설정',
    href: '/settings',
    icon: <Settings className="h-5 w-5" />,
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await adminLogout();
    window.location.href = '/login';
  };

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 flex h-screen flex-col bg-admin-sidebar transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-gray-700 px-4">
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
              H
            </div>
            <span className="text-lg font-semibold text-white">HireHub</span>
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            'rounded-lg p-1.5 text-gray-400 hover:bg-gray-700 hover:text-white transition-colors',
            collapsed && 'mx-auto'
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-5 w-5" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.name : undefined}
            >
              <span className={cn(!collapsed && 'mr-3')}>{item.icon}</span>
              {!collapsed && item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Navigation */}
      <div className="border-t border-gray-700 p-3">
        {bottomNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white',
                collapsed && 'justify-center px-2'
              )}
              title={collapsed ? item.name : undefined}
            >
              <span className={cn(!collapsed && 'mr-3')}>{item.icon}</span>
              {!collapsed && item.name}
            </Link>
          );
        })}
        <button
          onClick={handleLogout}
          className={cn(
            'group flex w-full items-center rounded-lg px-3 py-2.5 text-sm font-medium text-gray-300 transition-colors hover:bg-red-600 hover:text-white mt-1',
            collapsed && 'justify-center px-2'
          )}
          title={collapsed ? '로그아웃' : undefined}
        >
          <span className={cn(!collapsed && 'mr-3')}>
            <LogOut className="h-5 w-5" />
          </span>
          {!collapsed && '로그아웃'}
        </button>
      </div>
    </aside>
  );
}
