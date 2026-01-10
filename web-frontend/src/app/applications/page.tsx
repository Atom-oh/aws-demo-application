'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { applicationApi } from '@/lib/api';
import type { Application, ApplicationStatus } from '@/types';

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string }> = {
  SUBMITTED: { label: '지원완료', color: 'badge-secondary' },
  REVIEWING: { label: '검토중', color: 'badge-primary' },
  SHORTLISTED: { label: '서류통과', color: 'badge-success' },
  INTERVIEW_SCHEDULED: { label: '면접예정', color: 'badge-warning' },
  INTERVIEWED: { label: '면접완료', color: 'badge-primary' },
  OFFERED: { label: '오퍼', color: 'badge-success' },
  ACCEPTED: { label: '합격', color: 'badge-success' },
  REJECTED: { label: '불합격', color: 'badge-error' },
  WITHDRAWN: { label: '지원취소', color: 'badge-secondary' },
};

export default function ApplicationsPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus | 'ALL'>('ALL');

  const { data, isLoading, error } = useQuery({
    queryKey: ['applications', page],
    queryFn: () => applicationApi.getMyApplications(page, 10),
  });

  const withdrawMutation = useMutation({
    mutationFn: (applicationId: string) => applicationApi.withdraw(applicationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
    },
  });

  const filteredApplications = data?.data?.filter((app: Application) =>
    statusFilter === 'ALL' ? true : app.status === statusFilter
  );

  const getStatusBadge = (status: ApplicationStatus) => {
    const config = STATUS_CONFIG[status];
    return (
      <span className={`badge ${config.color}`}>
        {config.label}
      </span>
    );
  };

  const canWithdraw = (status: ApplicationStatus) => {
    return ['SUBMITTED', 'REVIEWING'].includes(status);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 py-8">
        <div className="container-wrapper">
          <div className="mb-8 h-8 w-1/4 animate-pulse rounded bg-secondary-200" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-32 animate-pulse rounded-lg bg-secondary-200"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-secondary-50 py-8">
        <div className="container-wrapper">
          <div className="rounded-lg bg-red-50 p-8 text-center">
            <p className="text-red-600">지원 내역을 불러오는 중 오류가 발생했습니다.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container-wrapper">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-secondary-900">지원 내역</h1>
          <p className="mt-2 text-secondary-600">
            총 {data?.total || 0}건의 지원 내역이 있습니다
          </p>
        </div>

        {/* Status Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setStatusFilter('ALL')}
            className={`rounded-full px-4 py-2 text-sm transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-primary-100 text-primary-700'
                : 'bg-white text-secondary-600 hover:bg-secondary-50'
            }`}
          >
            전체
          </button>
          {Object.entries(STATUS_CONFIG).map(([status, config]) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as ApplicationStatus)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                statusFilter === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-white text-secondary-600 hover:bg-secondary-50'
              }`}
            >
              {config.label}
            </button>
          ))}
        </div>

        {/* Applications List */}
        {filteredApplications && filteredApplications.length > 0 ? (
          <div className="space-y-4">
            {filteredApplications.map((application: Application) => (
              <div
                key={application.id}
                className="rounded-lg bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      {getStatusBadge(application.status)}
                      {application.matchScore && (
                        <span className="badge badge-primary">
                          매칭률 {application.matchScore}%
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/jobs/${application.jobId}`}
                      className="text-lg font-semibold text-secondary-900 hover:text-primary-600"
                    >
                      {application.job.title}
                    </Link>
                    <p className="text-secondary-600">{application.job.companyName}</p>
                    <div className="mt-2 flex flex-wrap gap-4 text-sm text-secondary-500">
                      <span>{application.job.location}</span>
                      <span>
                        지원일: {new Date(application.appliedAt).toLocaleDateString('ko-KR')}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/jobs/${application.jobId}`}>
                      <Button variant="outline" size="sm">
                        공고 보기
                      </Button>
                    </Link>
                    {canWithdraw(application.status) && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('지원을 취소하시겠습니까?')) {
                            withdrawMutation.mutate(application.id);
                          }
                        }}
                        disabled={withdrawMutation.isPending}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                      >
                        취소
                      </Button>
                    )}
                  </div>
                </div>

                {/* Progress Timeline */}
                <div className="mt-4 border-t border-secondary-100 pt-4">
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {['SUBMITTED', 'REVIEWING', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'OFFERED'].map(
                      (step, index, arr) => {
                        const statusIndex = Object.keys(STATUS_CONFIG).indexOf(
                          application.status
                        );
                        const stepIndex = Object.keys(STATUS_CONFIG).indexOf(step);
                        const isCompleted = stepIndex <= statusIndex;
                        const isCurrent = step === application.status;

                        return (
                          <div key={step} className="flex items-center">
                            <div
                              className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs ${
                                isCompleted
                                  ? 'bg-primary-500 text-white'
                                  : 'bg-secondary-200 text-secondary-500'
                              } ${isCurrent ? 'ring-2 ring-primary-300' : ''}`}
                            >
                              {isCompleted ? (
                                <svg
                                  className="h-3 w-3"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              ) : (
                                index + 1
                              )}
                            </div>
                            <span
                              className={`ml-1 whitespace-nowrap text-xs ${
                                isCompleted ? 'text-primary-600' : 'text-secondary-400'
                              }`}
                            >
                              {STATUS_CONFIG[step as ApplicationStatus].label}
                            </span>
                            {index < arr.length - 1 && (
                              <div
                                className={`mx-2 h-0.5 w-8 ${
                                  stepIndex < statusIndex
                                    ? 'bg-primary-500'
                                    : 'bg-secondary-200'
                                }`}
                              />
                            )}
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <div className="mb-4 text-5xl">&#128196;</div>
            <h3 className="mb-2 text-lg font-semibold text-secondary-900">
              지원 내역이 없습니다
            </h3>
            <p className="mb-6 text-secondary-600">
              관심있는 채용공고에 지원해보세요!
            </p>
            <Link href="/jobs">
              <Button>채용공고 둘러보기</Button>
            </Link>
          </div>
        )}

        {/* Pagination */}
        {data && data.totalPages > 1 && (
          <div className="mt-8 flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              이전
            </Button>
            <span className="flex items-center px-4 text-sm text-secondary-600">
              {page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(data.totalPages, p + 1))}
              disabled={page === data.totalPages}
            >
              다음
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
