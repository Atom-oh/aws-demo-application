'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleSignIn } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await handleSignIn({ email, password });

      if (result.success) {
        router.push('/');
        router.refresh();
      } else {
        setError(result.error || '로그인에 실패했습니다.');
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="card">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-secondary-900">로그인</h1>
            <p className="mt-2 text-secondary-600">
              HireHub에 오신 것을 환영합니다
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            <Input
              label="이메일"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
              required
              autoComplete="email"
            />

            <Input
              label="비밀번호"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              required
              autoComplete="current-password"
            />

            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="ml-2 text-sm text-secondary-600">로그인 유지</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary-600 hover:text-primary-500"
              >
                비밀번호 찾기
              </Link>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-secondary-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="bg-white px-2 text-secondary-500">또는</span>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {/* Social login */}}
              >
                <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google로 계속하기
              </Button>
            </div>
          </div>

          <p className="mt-8 text-center text-sm text-secondary-600">
            아직 계정이 없으신가요?{' '}
            <Link
              href="/register"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
