'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleSignUp } from '@/lib/auth';

type UserRole = 'CANDIDATE' | 'EMPLOYER';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    name: '',
    role: 'CANDIDATE' as UserRole,
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role: UserRole) => {
    setFormData((prev) => ({ ...prev, role }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 8) {
      setError('비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await handleSignUp({
        email: formData.email,
        password: formData.password,
        name: formData.name,
        role: formData.role,
      });

      if (result.success) {
        // Redirect to verification page or login
        router.push(`/verify?email=${encodeURIComponent(formData.email)}`);
      } else {
        setError(result.error || '회원가입에 실패했습니다.');
      }
    } catch (err) {
      setError('회원가입 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="card">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-secondary-900">회원가입</h1>
            <p className="mt-2 text-secondary-600">
              HireHub와 함께 새로운 기회를 찾아보세요
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {/* Role Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-secondary-700">
                가입 유형
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoleChange('CANDIDATE')}
                  className={`rounded-lg border-2 p-4 text-center transition-colors ${
                    formData.role === 'CANDIDATE'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <div className="mb-1 text-2xl">&#128188;</div>
                  <div className="font-medium">구직자</div>
                  <div className="text-xs text-secondary-500">일자리를 찾고 있어요</div>
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleChange('EMPLOYER')}
                  className={`rounded-lg border-2 p-4 text-center transition-colors ${
                    formData.role === 'EMPLOYER'
                      ? 'border-primary-500 bg-primary-50 text-primary-700'
                      : 'border-secondary-200 hover:border-secondary-300'
                  }`}
                >
                  <div className="mb-1 text-2xl">&#127970;</div>
                  <div className="font-medium">기업</div>
                  <div className="text-xs text-secondary-500">인재를 찾고 있어요</div>
                </button>
              </div>
            </div>

            <Input
              label="이름"
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="이름을 입력하세요"
              required
              autoComplete="name"
            />

            <Input
              label="이메일"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="email@example.com"
              required
              autoComplete="email"
            />

            <Input
              label="비밀번호"
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="8자 이상 입력하세요"
              required
              autoComplete="new-password"
            />

            <Input
              label="비밀번호 확인"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="비밀번호를 다시 입력하세요"
              required
              autoComplete="new-password"
            />

            <div className="flex items-start">
              <input
                type="checkbox"
                id="terms"
                required
                className="mt-1 h-4 w-4 rounded border-secondary-300 text-primary-600 focus:ring-primary-500"
              />
              <label htmlFor="terms" className="ml-2 text-sm text-secondary-600">
                <Link href="/terms" className="text-primary-600 hover:text-primary-500">
                  이용약관
                </Link>
                {' '}및{' '}
                <Link href="/privacy" className="text-primary-600 hover:text-primary-500">
                  개인정보처리방침
                </Link>
                에 동의합니다.
              </label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? '가입 중...' : '회원가입'}
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-secondary-600">
            이미 계정이 있으신가요?{' '}
            <Link
              href="/login"
              className="font-medium text-primary-600 hover:text-primary-500"
            >
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
