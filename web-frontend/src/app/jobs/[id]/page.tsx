'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import { jobApi, applicationApi, resumeApi } from '@/lib/api';
import type { Resume, SalaryRange } from '@/types';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const jobId = params.id as string;

  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [coverLetter, setCoverLetter] = useState('');

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => jobApi.getById(jobId),
    enabled: !!jobId,
  });

  const { data: resumes } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeApi.getMyResumes,
    enabled: showApplyModal,
  });

  const applyMutation = useMutation({
    mutationFn: () =>
      applicationApi.apply(jobId, selectedResumeId!, coverLetter || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      setShowApplyModal(false);
      router.push('/applications');
    },
  });

  const formatSalary = (salary?: SalaryRange) => {
    if (!salary) return '회사 내규에 따름';
    const { min, max, currency, period } = salary;
    const periodLabel = period === 'YEARLY' ? '연' : period === 'MONTHLY' ? '월' : '시간';
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()} (${periodLabel})`;
  };

  const getJobTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      FULL_TIME: '정규직',
      PART_TIME: '파트타임',
      CONTRACT: '계약직',
      INTERNSHIP: '인턴',
      REMOTE: '원격',
    };
    return labels[type] || type;
  };

  const getExperienceLabel = (level: string) => {
    const labels: Record<string, string> = {
      ENTRY: '신입',
      MID: '경력 3-5년',
      SENIOR: '경력 5-10년',
      LEAD: '리드/매니저',
      EXECUTIVE: '임원',
    };
    return labels[level] || level;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 py-8">
        <div className="container-wrapper">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-1/3 rounded bg-secondary-200" />
            <div className="mb-2 h-4 w-1/4 rounded bg-secondary-200" />
            <div className="mb-8 h-4 w-1/5 rounded bg-secondary-200" />
            <div className="h-64 rounded bg-secondary-200" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="min-h-screen bg-secondary-50 py-8">
        <div className="container-wrapper">
          <div className="rounded-lg bg-white p-8 text-center shadow-sm">
            <h1 className="mb-2 text-xl font-semibold text-secondary-900">
              채용공고를 찾을 수 없습니다
            </h1>
            <p className="mb-4 text-secondary-600">
              삭제되었거나 존재하지 않는 공고입니다.
            </p>
            <Link href="/jobs">
              <Button>채용공고 목록으로</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container-wrapper">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Header */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h1 className="mb-2 text-2xl font-bold text-secondary-900">
                    {job.title}
                  </h1>
                  <p className="text-lg text-primary-600">{job.companyName}</p>
                </div>
                {job.companyLogo && (
                  <img
                    src={job.companyLogo}
                    alt={job.companyName}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="badge badge-primary">{getJobTypeLabel(job.type)}</span>
                <span className="badge badge-secondary">
                  {getExperienceLabel(job.experienceLevel)}
                </span>
                <span className="badge badge-secondary">{job.location}</span>
              </div>
            </div>

            {/* Description */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-secondary-900">
                직무 설명
              </h2>
              <div className="prose max-w-none text-secondary-700">
                <p className="whitespace-pre-wrap">{job.description}</p>
              </div>
            </div>

            {/* Requirements */}
            <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-secondary-900">
                자격 요건
              </h2>
              <ul className="list-inside list-disc space-y-2 text-secondary-700">
                {job.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </div>

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="mb-6 rounded-lg bg-white p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold text-secondary-900">
                  복리후생
                </h2>
                <ul className="list-inside list-disc space-y-2 text-secondary-700">
                  {job.benefits.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Skills */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-secondary-900">
                필요 기술
              </h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-secondary-100 px-3 py-1 text-sm text-secondary-700"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Apply Card */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <div className="mb-4">
                  <p className="text-sm text-secondary-500">연봉</p>
                  <p className="text-lg font-semibold text-secondary-900">
                    {formatSalary(job.salary)}
                  </p>
                </div>

                {job.deadline && (
                  <div className="mb-4">
                    <p className="text-sm text-secondary-500">마감일</p>
                    <p className="font-medium text-secondary-900">
                      {new Date(job.deadline).toLocaleDateString('ko-KR')}
                    </p>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm text-secondary-500">지원자 수</p>
                  <p className="font-medium text-secondary-900">
                    {job.applicationCount}명
                  </p>
                </div>

                <Button
                  className="w-full"
                  onClick={() => setShowApplyModal(true)}
                >
                  지원하기
                </Button>

                <button className="mt-3 w-full rounded-lg border border-secondary-200 py-2.5 text-sm font-medium text-secondary-700 hover:bg-secondary-50">
                  저장하기
                </button>
              </div>

              {/* Company Info */}
              <div className="rounded-lg bg-white p-6 shadow-sm">
                <h3 className="mb-4 font-semibold text-secondary-900">
                  회사 정보
                </h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-secondary-500">회사명</span>
                    <span className="font-medium text-secondary-900">
                      {job.companyName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-secondary-500">위치</span>
                    <span className="font-medium text-secondary-900">
                      {job.location}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Apply Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-secondary-900">
              지원하기
            </h2>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium text-secondary-700">
                이력서 선택
              </label>
              {resumes && resumes.length > 0 ? (
                <div className="space-y-2">
                  {resumes.map((resume: Resume) => (
                    <label
                      key={resume.id}
                      className={`flex cursor-pointer items-center rounded-lg border-2 p-3 transition-colors ${
                        selectedResumeId === resume.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-secondary-200 hover:border-secondary-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="resume"
                        value={resume.id}
                        checked={selectedResumeId === resume.id}
                        onChange={() => setSelectedResumeId(resume.id)}
                        className="mr-3"
                      />
                      <div>
                        <p className="font-medium text-secondary-900">
                          {resume.title}
                        </p>
                        <p className="text-sm text-secondary-500">
                          {resume.fileName}
                        </p>
                      </div>
                      {resume.isPrimary && (
                        <span className="ml-auto badge badge-primary">기본</span>
                      )}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-secondary-500">
                  등록된 이력서가 없습니다.{' '}
                  <Link href="/profile" className="text-primary-600">
                    이력서를 먼저 등록해주세요.
                  </Link>
                </p>
              )}
            </div>

            <div className="mb-6">
              <label className="mb-2 block text-sm font-medium text-secondary-700">
                자기소개서 (선택)
              </label>
              <textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                rows={4}
                className="w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                placeholder="자기소개서를 입력하세요"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowApplyModal(false)}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={() => applyMutation.mutate()}
                disabled={!selectedResumeId || applyMutation.isPending}
              >
                {applyMutation.isPending ? '지원 중...' : '지원하기'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
