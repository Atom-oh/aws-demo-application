'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Briefcase,
  MapPin,
  Clock,
  Calendar,
  Users,
  Eye,
  DollarSign,
  Pause,
  Play,
  Trash2,
  Building2,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card, CardHeader, StatusBadge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { Job, JobStatus, EmploymentType, ExperienceLevel } from '@/types';

const mockJob: Job = {
  id: '1',
  title: 'Senior Software Engineer',
  description: `우리는 혁신적인 기술 솔루션을 개발할 열정적인 시니어 소프트웨어 엔지니어를 찾고 있습니다.

주요 업무:
- 대규모 분산 시스템 설계 및 개발
- 코드 리뷰 및 기술 멘토링
- 기술 스택 선정 및 아키텍처 설계
- 팀과 협업하여 제품 로드맵 구현

자격 요건:
- 5년 이상의 소프트웨어 개발 경험
- React, Node.js, TypeScript 능숙
- 클라우드 서비스 (AWS/GCP) 경험
- 우수한 커뮤니케이션 능력`,
  companyId: '1',
  location: '서울특별시 강남구',
  employmentType: 'full_time',
  experienceLevel: 'senior',
  salaryMin: 80000000,
  salaryMax: 120000000,
  currency: 'KRW',
  skills: ['React', 'Node.js', 'TypeScript', 'AWS', 'PostgreSQL'],
  status: 'active',
  viewCount: 1234,
  applicationCount: 45,
  createdAt: '2024-01-15T10:00:00Z',
  updatedAt: '2024-01-15T10:00:00Z',
  expiresAt: '2024-02-15T10:00:00Z',
};

const statusVariants: Record<JobStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  active: 'success',
  draft: 'default',
  paused: 'warning',
  closed: 'info',
  expired: 'error',
};

const employmentTypeLabels: Record<EmploymentType, string> = {
  full_time: '정규직',
  part_time: '파트타임',
  contract: '계약직',
  internship: '인턴십',
  freelance: '프리랜서',
};

const experienceLevelLabels: Record<ExperienceLevel, string> = {
  entry: '신입',
  junior: '주니어 (1-3년)',
  mid: '미드레벨 (3-5년)',
  senior: '시니어 (5-10년)',
  lead: '리드 (10년+)',
  executive: '임원급',
};

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.id as string;

  const [job, setJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchJob = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getJobById(jobId);
        if (response.success && response.data) {
          setJob(response.data);
        } else {
          setJob({ ...mockJob, id: jobId });
        }
      } catch (error) {
        console.error('Failed to fetch job:', error);
        setJob({ ...mockJob, id: jobId });
      } finally {
        setIsLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  const handleStatusChange = async (newStatus: JobStatus) => {
    if (!job) return;
    setActionLoading(newStatus);
    try {
      const response = await apiClient.updateJobStatus(job.id, newStatus);
      if (response.success && response.data) {
        setJob(response.data);
      } else {
        setJob({ ...job, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update job status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatSalary = (min?: number, max?: number, currency?: string) => {
    if (!min && !max) return '협의 후 결정';
    const formatter = new Intl.NumberFormat('ko-KR');
    if (min && max) {
      return `${formatter.format(min / 10000)}만원 ~ ${formatter.format(max / 10000)}만원`;
    }
    if (min) return `${formatter.format(min / 10000)}만원 이상`;
    return `${formatter.format(max! / 10000)}만원 이하`;
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-gray-500">채용공고를 찾을 수 없습니다</p>
        <Button variant="outline" onClick={() => router.push('/jobs')} className="mt-4">
          목록으로 돌아가기
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader title="채용공고 상세" subtitle={job.title} />

      <div className="p-6">
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          목록으로 돌아가기
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{job.title}</h2>
                  <div className="mt-2 flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Building2 className="h-4 w-4" />
                      TechCorp Inc.
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {job.location}
                    </span>
                  </div>
                </div>
                <StatusBadge status={job.status} variant={statusVariants[job.status]} />
              </div>

              <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Briefcase className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">고용형태</p>
                    <p className="text-sm font-medium text-gray-900">
                      {employmentTypeLabels[job.employmentType]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">경력</p>
                    <p className="text-sm font-medium text-gray-900">
                      {experienceLevelLabels[job.experienceLevel]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <DollarSign className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">연봉</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatSalary(job.salaryMin, job.salaryMax, job.currency)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">마감일</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(job.expiresAt)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">요구 스킬</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill}
                      className="rounded-full bg-primary-50 px-3 py-1 text-sm font-medium text-primary-700"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </Card>

            <Card>
              <CardHeader title="채용공고 내용" />
              <div className="mt-4 prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap font-sans text-sm text-gray-600 leading-relaxed">
                  {job.description}
                </pre>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="관리" description="채용공고 상태 관리" />
              <div className="mt-4 space-y-3">
                {job.status === 'active' ? (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Pause className="h-4 w-4" />}
                    onClick={() => handleStatusChange('paused')}
                    isLoading={actionLoading === 'paused'}
                  >
                    게시 일시정지
                  </Button>
                ) : job.status === 'paused' ? (
                  <Button
                    variant="primary"
                    className="w-full justify-start"
                    leftIcon={<Play className="h-4 w-4" />}
                    onClick={() => handleStatusChange('active')}
                    isLoading={actionLoading === 'active'}
                  >
                    게시 재개
                  </Button>
                ) : null}
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  leftIcon={<Trash2 className="h-4 w-4" />}
                  onClick={() => handleStatusChange('closed')}
                  isLoading={actionLoading === 'closed'}
                >
                  공고 마감
                </Button>
              </div>
            </Card>

            <Card>
              <CardHeader title="통계" description="채용공고 성과" />
              <div className="mt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">조회수</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {job.viewCount.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">지원자수</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {job.applicationCount}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">등록일</span>
                  </div>
                  <span className="text-sm text-gray-900">{formatDate(job.createdAt)}</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
