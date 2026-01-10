'use client';

import Link from 'next/link';
import Button from '@/components/ui/Button';
import type { Application, ApplicationStatus } from '@/types';

interface ApplicationCardProps {
  application: Application;
  onWithdraw?: (id: string) => void;
  isWithdrawing?: boolean;
}

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; color: string; bgColor: string }> = {
  SUBMITTED: { label: '지원완료', color: 'text-secondary-700', bgColor: 'bg-secondary-100' },
  REVIEWING: { label: '검토중', color: 'text-blue-700', bgColor: 'bg-blue-100' },
  SHORTLISTED: { label: '서류통과', color: 'text-green-700', bgColor: 'bg-green-100' },
  INTERVIEW_SCHEDULED: { label: '면접예정', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
  INTERVIEWED: { label: '면접완료', color: 'text-purple-700', bgColor: 'bg-purple-100' },
  OFFERED: { label: '오퍼', color: 'text-emerald-700', bgColor: 'bg-emerald-100' },
  ACCEPTED: { label: '합격', color: 'text-green-700', bgColor: 'bg-green-100' },
  REJECTED: { label: '불합격', color: 'text-red-700', bgColor: 'bg-red-100' },
  WITHDRAWN: { label: '지원취소', color: 'text-gray-700', bgColor: 'bg-gray-100' },
};

const TIMELINE_STEPS: ApplicationStatus[] = [
  'SUBMITTED',
  'REVIEWING',
  'SHORTLISTED',
  'INTERVIEW_SCHEDULED',
  'OFFERED',
];

export default function ApplicationCard({
  application,
  onWithdraw,
  isWithdrawing = false,
}: ApplicationCardProps) {
  const statusConfig = STATUS_CONFIG[application.status];
  const canWithdraw = ['SUBMITTED', 'REVIEWING'].includes(application.status);

  const getStepStatus = (step: ApplicationStatus) => {
    const statusOrder = Object.keys(STATUS_CONFIG);
    const currentIndex = statusOrder.indexOf(application.status);
    const stepIndex = statusOrder.indexOf(step);

    if (application.status === 'REJECTED' || application.status === 'WITHDRAWN') {
      return 'inactive';
    }

    if (stepIndex < currentIndex) return 'completed';
    if (stepIndex === currentIndex) return 'current';
    return 'pending';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleWithdraw = () => {
    if (onWithdraw && confirm('지원을 취소하시겠습니까?')) {
      onWithdraw(application.id);
    }
  };

  return (
    <div className="rounded-lg border border-secondary-200 bg-white transition-shadow hover:shadow-md">
      {/* Main Content */}
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          {/* Left Side - Job Info */}
          <div className="flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className={`badge ${statusConfig.bgColor} ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
              {application.matchScore && application.matchScore >= 80 && (
                <span className="badge bg-primary-100 text-primary-700">
                  AI 추천
                </span>
              )}
              {application.matchScore && (
                <span className="text-sm text-secondary-500">
                  매칭률 {application.matchScore}%
                </span>
              )}
            </div>

            <Link
              href={`/jobs/${application.jobId}`}
              className="group mb-1 block"
            >
              <h3 className="text-lg font-semibold text-secondary-900 group-hover:text-primary-600">
                {application.job.title}
              </h3>
            </Link>

            <div className="mb-3 flex items-center gap-3">
              {application.job.companyLogo ? (
                <img
                  src={application.job.companyLogo}
                  alt={application.job.companyName}
                  className="h-8 w-8 rounded object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded bg-secondary-100 text-sm font-bold text-secondary-400">
                  {application.job.companyName.charAt(0)}
                </div>
              )}
              <span className="text-secondary-600">{application.job.companyName}</span>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-secondary-500">
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                {application.job.location}
              </span>
              <span className="flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                지원일: {formatDate(application.appliedAt)}
              </span>
            </div>
          </div>

          {/* Right Side - Actions */}
          <div className="flex flex-shrink-0 gap-2">
            <Link href={`/jobs/${application.jobId}`}>
              <Button variant="outline" size="sm">
                공고 보기
              </Button>
            </Link>
            {canWithdraw && onWithdraw && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
                className="text-red-600 hover:bg-red-50 hover:text-red-700"
              >
                취소
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Progress Timeline */}
      {application.status !== 'WITHDRAWN' && application.status !== 'REJECTED' && (
        <div className="border-t border-secondary-100 px-6 py-4">
          <div className="flex items-center justify-between">
            {TIMELINE_STEPS.map((step, index) => {
              const stepStatus = getStepStatus(step);
              const isLast = index === TIMELINE_STEPS.length - 1;

              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors ${
                        stepStatus === 'completed'
                          ? 'bg-primary-500 text-white'
                          : stepStatus === 'current'
                          ? 'bg-primary-500 text-white ring-4 ring-primary-100'
                          : 'bg-secondary-200 text-secondary-500'
                      }`}
                    >
                      {stepStatus === 'completed' ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                      className={`mt-1 text-xs whitespace-nowrap ${
                        stepStatus === 'pending'
                          ? 'text-secondary-400'
                          : 'text-secondary-600'
                      }`}
                    >
                      {STATUS_CONFIG[step].label}
                    </span>
                  </div>

                  {!isLast && (
                    <div
                      className={`mx-1 h-0.5 flex-1 ${
                        getStepStatus(TIMELINE_STEPS[index + 1]) === 'completed' ||
                        getStepStatus(TIMELINE_STEPS[index + 1]) === 'current'
                          ? 'bg-primary-500'
                          : 'bg-secondary-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Messages */}
      {application.status === 'REJECTED' && (
        <div className="border-t border-red-100 bg-red-50 px-6 py-3">
          <p className="text-sm text-red-600">
            아쉽게도 이번 채용에서는 함께하지 못하게 되었습니다. 다른 좋은 기회를 응원합니다.
          </p>
        </div>
      )}

      {application.status === 'OFFERED' && (
        <div className="border-t border-green-100 bg-green-50 px-6 py-3">
          <p className="text-sm text-green-700">
            축하합니다! 오퍼를 받으셨습니다. 기업에서 곧 연락드릴 예정입니다.
          </p>
        </div>
      )}

      {application.status === 'INTERVIEW_SCHEDULED' && (
        <div className="border-t border-yellow-100 bg-yellow-50 px-6 py-3">
          <p className="text-sm text-yellow-700">
            면접이 예정되어 있습니다. 기업에서 보내드린 안내를 확인해주세요.
          </p>
        </div>
      )}
    </div>
  );
}
