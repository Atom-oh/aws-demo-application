'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Mail, Shield } from 'lucide-react';
import { adminLogin, confirmMFA } from '@/lib/auth';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showMFA, setShowMFA] = useState(false);

  const handleLogin = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await adminLogin({ email, password });

      if (result.success) {
        router.push('/dashboard');
      } else if (result.mfaChallenge) {
        setShowMFA(true);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMFAVerify = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await confirmMFA(mfaCode);

      if (result.success) {
        router.push('/dashboard');
      } else {
        setError(result.error || 'MFA verification failed');
      }
    } catch {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-900 to-gray-800 px-4">
      <Card className="w-full max-w-md" padding="lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-600 text-white">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">HireHub 관리자</h1>
          <p className="mt-2 text-sm text-gray-500">
            {showMFA
              ? 'MFA 코드를 입력하세요'
              : '관리자 대시보드에 로그인하세요'}
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm text-red-600">
            {error}
          </div>
        )}

        {/* MFA Form */}
        {showMFA ? (
          <form onSubmit={handleMFAVerify} className="space-y-6">
            <Input
              label="MFA 코드"
              type="text"
              placeholder="6자리 코드 입력"
              value={mfaCode}
              onChange={(e) => setMfaCode(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              확인
            </Button>
            <button
              type="button"
              onClick={() => {
                setShowMFA(false);
                setMfaCode('');
                setError('');
              }}
              className="w-full text-sm text-gray-500 hover:text-gray-700"
            >
              로그인으로 돌아가기
            </button>
          </form>
        ) : (
          /* Login Form */
          <form onSubmit={handleLogin} className="space-y-6">
            <Input
              label="이메일"
              type="email"
              placeholder="admin@hirehub.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="email"
              required
            />
            <Input
              label="비밀번호"
              type="password"
              placeholder="비밀번호를 입력하세요"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
              required
            />
            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full"
              size="lg"
            >
              로그인
            </Button>
          </form>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-xs text-gray-400">
          <p>모든 관리자 계정은 MFA가 필수입니다.</p>
          <p className="mt-1">도움이 필요하시면 IT 지원팀에 문의하세요.</p>
        </div>
      </Card>
    </div>
  );
}
