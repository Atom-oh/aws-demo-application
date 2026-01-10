'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated, getAdminUser } from '@/lib/auth';
import Sidebar from '@/components/layout/Sidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const authenticated = await isAuthenticated();
      if (!authenticated) {
        router.replace('/login');
        return;
      }

      const user = await getAdminUser();
      if (!user || !['admin', 'super_admin'].includes(user.role)) {
        router.replace('/login');
        return;
      }

      setIsLoading(false);
    };
    checkAuth();

    // Listen for sidebar state changes
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-admin-background">
      <Sidebar />
      <main
        className={`transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        {children}
      </main>
    </div>
  );
}
