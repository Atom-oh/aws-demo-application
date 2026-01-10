'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import Button from '@/components/ui/Button';

// Mock data for demonstration
const mockStats = {
  activeJobs: 5,
  totalApplications: 128,
  newApplications: 23,
  interviewScheduled: 8,
};

const mockRecentApplications = [
  { id: '1', candidateName: '김철수', jobTitle: '프론트엔드 개발자', appliedAt: '2024-01-09', matchScore: 92 },
  { id: '2', candidateName: '이영희', jobTitle: '백엔드 개발자', appliedAt: '2024-01-09', matchScore: 88 },
  { id: '3', candidateName: '박지민', jobTitle: '프론트엔드 개발자', appliedAt: '2024-01-08', matchScore: 85 },
];

export default function EmployerDashboard() {
  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container-wrapper">
        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">기업 대시보드</h1>
            <p className="mt-2 text-secondary-600">채용 현황을 한눈에 확인하세요</p>
          </div>
          <Link href="/employer/jobs/new">
            <Button>새 채용공고 등록</Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">진행중인 공고</p>
                <p className="mt-1 text-3xl font-bold text-secondary-900">{mockStats.activeJobs}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-100">
                <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <Link href="/employer/jobs" className="mt-3 inline-block text-sm text-primary-600 hover:text-primary-700">
              전체 공고 보기
            </Link>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">총 지원자</p>
                <p className="mt-1 text-3xl font-bold text-secondary-900">{mockStats.totalApplications}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">신규 지원</p>
                <p className="mt-1 text-3xl font-bold text-green-600">{mockStats.newApplications}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <span className="mt-3 inline-block rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
              오늘 +5
            </span>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-secondary-500">면접 예정</p>
                <p className="mt-1 text-3xl font-bold text-secondary-900">{mockStats.interviewScheduled}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100">
                <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Recent Applications */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-secondary-900">최근 지원자</h2>
              <Link href="/employer/applications" className="text-sm text-primary-600 hover:text-primary-700">
                전체 보기
              </Link>
            </div>
            <div className="space-y-4">
              {mockRecentApplications.map((app) => (
                <div key={app.id} className="flex items-center justify-between rounded-lg border border-secondary-100 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary-100 font-medium text-secondary-600">
                      {app.candidateName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-secondary-900">{app.candidateName}</p>
                      <p className="text-sm text-secondary-500">{app.jobTitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-primary">매칭 {app.matchScore}%</span>
                    <p className="mt-1 text-xs text-secondary-400">{app.appliedAt}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-secondary-900">빠른 작업</h2>
            <div className="space-y-3">
              <Link href="/employer/jobs/new" className="flex items-center gap-4 rounded-lg border border-secondary-200 p-4 transition-colors hover:bg-secondary-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                  <svg className="h-5 w-5 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-secondary-900">새 채용공고 등록</p>
                  <p className="text-sm text-secondary-500">AI가 지원자를 매칭해드립니다</p>
                </div>
              </Link>
              <Link href="/employer/applications" className="flex items-center gap-4 rounded-lg border border-secondary-200 p-4 transition-colors hover:bg-secondary-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                  <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-secondary-900">지원서 검토</p>
                  <p className="text-sm text-secondary-500">신규 지원서 {mockStats.newApplications}건</p>
                </div>
              </Link>
              <Link href="/employer/company" className="flex items-center gap-4 rounded-lg border border-secondary-200 p-4 transition-colors hover:bg-secondary-50">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary-100">
                  <svg className="h-5 w-5 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-secondary-900">회사 정보 관리</p>
                  <p className="text-sm text-secondary-500">기업 프로필 및 브랜딩</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
