'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { JobType, ExperienceLevel } from '@/types';

const JOB_TYPES: { value: JobType; label: string }[] = [
  { value: 'FULL_TIME', label: '정규직' },
  { value: 'PART_TIME', label: '파트타임' },
  { value: 'CONTRACT', label: '계약직' },
  { value: 'INTERNSHIP', label: '인턴' },
  { value: 'REMOTE', label: '원격' },
];

const EXPERIENCE_LEVELS: { value: ExperienceLevel; label: string }[] = [
  { value: 'ENTRY', label: '신입' },
  { value: 'MID', label: '경력 3-5년' },
  { value: 'SENIOR', label: '경력 5-10년' },
  { value: 'LEAD', label: '리드/매니저' },
  { value: 'EXECUTIVE', label: '임원' },
];

interface JobFormData {
  title: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  location: string;
  salaryMin: string;
  salaryMax: string;
  description: string;
  requirements: string;
  benefits: string;
  skills: string;
  deadline: string;
}

export default function NewJobPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<JobFormData>({
    title: '',
    type: 'FULL_TIME',
    experienceLevel: 'MID',
    location: '',
    salaryMin: '',
    salaryMax: '',
    description: '',
    requirements: '',
    benefits: '',
    skills: '',
    deadline: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // API call would go here
      await new Promise((resolve) => setTimeout(resolve, 1000));
      router.push('/employer/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container-wrapper max-w-3xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/employer" className="mb-4 inline-flex items-center text-sm text-secondary-600 hover:text-secondary-900">
            <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            대시보드로 돌아가기
          </Link>
          <h1 className="text-3xl font-bold text-secondary-900">새 채용공고 등록</h1>
          <p className="mt-2 text-secondary-600">AI가 최적의 인재를 매칭해드립니다</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-secondary-900">기본 정보</h2>
            <div className="space-y-4">
              <Input
                label="채용 포지션"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="예: 프론트엔드 개발자"
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-secondary-700">
                    고용 형태 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-secondary-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  >
                    {JOB_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-secondary-700">
                    경력 요건 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="experienceLevel"
                    value={formData.experienceLevel}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-secondary-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                    required
                  >
                    {EXPERIENCE_LEVELS.map((level) => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <Input
                label="근무 지역"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="예: 서울 강남구"
                required
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="최소 연봉 (만원)"
                  name="salaryMin"
                  type="number"
                  value={formData.salaryMin}
                  onChange={handleChange}
                  placeholder="4000"
                />
                <Input
                  label="최대 연봉 (만원)"
                  name="salaryMax"
                  type="number"
                  value={formData.salaryMax}
                  onChange={handleChange}
                  placeholder="6000"
                />
              </div>

              <Input
                label="마감일"
                name="deadline"
                type="date"
                value={formData.deadline}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Job Details */}
          <div className="rounded-lg bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-secondary-900">상세 내용</h2>
            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  직무 설명 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={6}
                  className="w-full rounded-lg border border-secondary-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="담당할 업무, 팀 소개, 프로젝트 설명 등을 작성해주세요"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  자격 요건 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="requirements"
                  value={formData.requirements}
                  onChange={handleChange}
                  rows={4}
                  className="w-full rounded-lg border border-secondary-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="필수 자격 요건을 줄바꿈으로 구분하여 작성해주세요"
                  required
                />
                <p className="mt-1 text-xs text-secondary-500">줄바꿈으로 각 요건을 구분합니다</p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  복리후생
                </label>
                <textarea
                  name="benefits"
                  value={formData.benefits}
                  onChange={handleChange}
                  rows={3}
                  className="w-full rounded-lg border border-secondary-300 px-4 py-2.5 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  placeholder="회사의 복리후생 혜택을 작성해주세요"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-secondary-700">
                  필요 기술 <span className="text-red-500">*</span>
                </label>
                <Input
                  name="skills"
                  value={formData.skills}
                  onChange={handleChange}
                  placeholder="React, TypeScript, Node.js"
                  required
                />
                <p className="mt-1 text-xs text-secondary-500">쉼표로 구분하여 입력하세요</p>
              </div>
            </div>
          </div>

          {/* AI Matching Info */}
          <div className="rounded-lg bg-primary-50 p-4">
            <div className="flex gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div className="text-sm text-primary-800">
                <p className="font-medium">AI 매칭 안내</p>
                <p className="mt-1">채용공고가 등록되면 AI가 자동으로 적합한 지원자를 매칭합니다. 필요 기술과 자격 요건을 상세히 작성할수록 더 정확한 매칭이 가능합니다.</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()} className="flex-1">
              취소
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? '등록 중...' : '채용공고 등록'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
