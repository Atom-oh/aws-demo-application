'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import Button from '@/components/ui/Button';
import { getCurrentAuthUser, handleSignOut } from '@/lib/auth';
import type { User } from '@/types';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      const currentUser = await getCurrentAuthUser();
      setUser(currentUser);
    };
    loadUser();
  }, [pathname]);

  const handleLogout = async () => {
    await handleSignOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const navLinks = [
    { href: '/jobs', label: '채용공고' },
    { href: '/applications', label: '지원내역', auth: true, role: 'CANDIDATE' },
    { href: '/resumes', label: '이력서', auth: true, role: 'CANDIDATE' },
    { href: '/employer', label: '채용관리', auth: true, role: 'EMPLOYER' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-secondary-200 bg-white/95 backdrop-blur">
      <div className="container-wrapper">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
              H
            </div>
            <span className="text-xl font-bold text-secondary-900">HireHub</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {navLinks.map(
              (link) =>
                (!link.auth || user) &&
                (!link.role || user?.role === link.role) && (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`text-sm font-medium transition-colors ${
                      pathname === link.href || pathname?.startsWith(link.href + '/')
                        ? 'text-primary-600'
                        : 'text-secondary-600 hover:text-secondary-900'
                    }`}
                  >
                    {link.label}
                  </Link>
                )
            )}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden items-center gap-4 md:flex">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 rounded-lg p-2 hover:bg-secondary-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-600">
                    {user.name?.charAt(0) || 'U'}
                  </div>
                  <span className="text-sm font-medium text-secondary-700">
                    {user.name}
                  </span>
                  <svg
                    className={`h-4 w-4 text-secondary-400 transition-transform ${
                      isProfileOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-lg border border-secondary-200 bg-white py-1 shadow-lg">
                    <Link
                      href="/profile"
                      className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      프로필
                    </Link>
                    {user?.role === 'CANDIDATE' && (
                      <>
                        <Link
                          href="/applications"
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          지원 내역
                        </Link>
                        <Link
                          href="/resumes"
                          className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                          onClick={() => setIsProfileOpen(false)}
                        >
                          이력서 관리
                        </Link>
                      </>
                    )}
                    {user?.role === 'EMPLOYER' && (
                      <Link
                        href="/employer"
                        className="block px-4 py-2 text-sm text-secondary-700 hover:bg-secondary-50"
                        onClick={() => setIsProfileOpen(false)}
                      >
                        채용 관리
                      </Link>
                    )}
                    <hr className="my-1 border-secondary-200" />
                    <button
                      onClick={handleLogout}
                      className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                    >
                      로그아웃
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    로그인
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">회원가입</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="rounded-lg p-2 hover:bg-secondary-50 md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg
              className="h-6 w-6 text-secondary-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {isMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="border-t border-secondary-200 py-4 md:hidden">
            <nav className="flex flex-col gap-2">
              {navLinks.map(
                (link) =>
                  (!link.auth || user) &&
                  (!link.role || user?.role === link.role) && (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`rounded-lg px-4 py-2 text-sm font-medium ${
                        pathname === link.href || pathname?.startsWith(link.href + '/')
                          ? 'bg-primary-50 text-primary-600'
                          : 'text-secondary-600 hover:bg-secondary-50'
                      }`}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      {link.label}
                    </Link>
                  )
              )}
              <hr className="my-2 border-secondary-200" />
              {user ? (
                <>
                  <Link
                    href="/profile"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    프로필
                  </Link>
                  <button
                    onClick={() => {
                      handleLogout();
                      setIsMenuOpen(false);
                    }}
                    className="rounded-lg px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50"
                  >
                    로그아웃
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-secondary-600 hover:bg-secondary-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    로그인
                  </Link>
                  <Link
                    href="/register"
                    className="rounded-lg px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    회원가입
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
