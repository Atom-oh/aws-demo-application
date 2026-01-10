import Link from 'next/link';
import Button from '@/components/ui/Button';
import JobList from '@/components/jobs/JobList';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 py-20 text-white">
        <div className="container-wrapper">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-6 text-5xl font-bold tracking-tight">
              AI가 연결하는 완벽한 매칭
            </h1>
            <p className="mb-8 text-xl text-primary-100">
              HireHub의 AI 매칭 시스템이 당신의 역량에 맞는 최적의 포지션을 찾아드립니다.
              지금 바로 새로운 커리어를 시작하세요.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/jobs">
                <Button size="lg" variant="secondary">
                  채용공고 둘러보기
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary-700">
                  무료로 시작하기
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container-wrapper">
          <h2 className="mb-12 text-center text-3xl font-bold">
            왜 HireHub인가요?
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="card text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                  <svg className="h-7 w-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">AI 기반 매칭</h3>
              <p className="text-secondary-600">
                이력서와 채용공고를 분석하여 최적의 매칭을 제공합니다.
                역량, 경험, 선호도를 종합적으로 고려합니다.
              </p>
            </div>
            <div className="card text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                  <svg className="h-7 w-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">개인정보 보호</h3>
              <p className="text-secondary-600">
                최신 AI 기술로 민감한 개인정보를 자동으로 마스킹합니다.
                안전하게 지원하세요.
              </p>
            </div>
            <div className="card text-center">
              <div className="mb-4 flex justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100">
                  <svg className="h-7 w-7 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">빠른 프로세스</h3>
              <p className="text-secondary-600">
                복잡한 절차 없이 빠르게 지원하고 결과를 확인하세요.
                실시간 알림으로 진행상황을 추적합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent Jobs Section */}
      <section className="bg-secondary-50 py-16">
        <div className="container-wrapper">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="text-2xl font-bold">최신 채용공고</h2>
            <Link href="/jobs" className="text-primary-600 hover:text-primary-700">
              전체 보기 &rarr;
            </Link>
          </div>
          <JobList limit={6} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16">
        <div className="container-wrapper">
          <div className="rounded-2xl bg-gradient-to-r from-primary-600 to-primary-700 px-8 py-12 text-center text-white">
            <h2 className="mb-4 text-3xl font-bold">
              지금 바로 시작하세요
            </h2>
            <p className="mb-8 text-lg text-primary-100">
              무료로 가입하고 AI가 추천하는 최적의 포지션을 만나보세요.
            </p>
            <Link href="/register">
              <Button size="lg" variant="secondary">
                무료 회원가입
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
