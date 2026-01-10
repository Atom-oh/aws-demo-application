'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { handleConfirmSignUp, handleResendCode } from '@/lib/auth';

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const result = await handleConfirmSignUp(email, code);
      if (result.success) {
        setSuccess('이메일 인증이 완료되었습니다. 로그인 페이지로 이동합니다.');
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(result.error || '인증에 실패했습니다.');
      }
    } catch {
      setError('인증 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');

    try {
      const result = await handleResendCode(email);
      if (result.success) {
        setSuccess('인증 코드가 재전송되었습니다.');
        setResendCooldown(60);
      } else {
        setError(result.error || '코드 재전송에 실패했습니다.');
      }
    } catch {
      setError('코드 재전송 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-center justify-center py-12">
      <div className="w-full max-w-md px-4">
        <div className="card">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary-100">
              <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-secondary-900">이메일 인증</h1>
            <p className="mt-2 text-secondary-600">
              {email ? (
                <>
                  <span className="font-medium text-secondary-900">{email}</span>
                  <br />으로 전송된 인증 코드를 입력해주세요
                </>
              ) : (
                '이메일로 전송된 인증 코드를 입력해주세요'
              )}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-600">
                {success}
              </div>
            )}

            <Input
              label="인증 코드"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6자리 숫자 입력"
              maxLength={6}
              required
              className="text-center text-2xl tracking-widest"
            />

            <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
              {isLoading ? '인증 중...' : '인증하기'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-secondary-600">
              코드를 받지 못하셨나요?{' '}
              <button
                onClick={handleResend}
                disabled={resendCooldown > 0}
                className={`font-medium ${
                  resendCooldown > 0
                    ? 'text-secondary-400 cursor-not-allowed'
                    : 'text-primary-600 hover:text-primary-500'
                }`}
              >
                {resendCooldown > 0 ? `재전송 (${resendCooldown}초)` : '코드 재전송'}
              </button>
            </p>
          </div>

          <div className="mt-8 border-t border-secondary-200 pt-6 text-center">
            <Link href="/login" className="text-sm text-secondary-600 hover:text-secondary-900">
              로그인 페이지로 돌아가기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-200px)] items-center justify-center">
        <div className="animate-pulse text-secondary-500">로딩 중...</div>
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}
