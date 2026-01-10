import Link from 'next/link';
import type { Job } from '@/types';

interface JobCardProps {
  job: Job;
}

const JOB_TYPE_LABELS: Record<string, string> = {
  FULL_TIME: '정규직',
  PART_TIME: '파트타임',
  CONTRACT: '계약직',
  INTERNSHIP: '인턴',
  REMOTE: '원격',
};

const EXPERIENCE_LABELS: Record<string, string> = {
  ENTRY: '신입',
  MID: '경력 3-5년',
  SENIOR: '경력 5-10년',
  LEAD: '리드/매니저',
  EXECUTIVE: '임원',
};

export default function JobCard({ job }: JobCardProps) {
  const formatSalary = (salary: typeof job.salary) => {
    if (!salary) return null;
    const { min, max, currency } = salary;
    if (min === max) {
      return `${currency} ${min.toLocaleString()}`;
    }
    return `${currency} ${min.toLocaleString()} - ${max.toLocaleString()}`;
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return '오늘';
    if (diffDays === 1) return '어제';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}주 전`;
    return `${Math.floor(diffDays / 30)}개월 전`;
  };

  return (
    <Link href={`/jobs/${job.id}`}>
      <div className="group h-full rounded-lg border border-secondary-200 bg-white p-6 transition-all hover:border-primary-300 hover:shadow-md">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between">
          <div className="flex items-center gap-3">
            {job.companyLogo ? (
              <img
                src={job.companyLogo}
                alt={job.companyName}
                className="h-12 w-12 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary-100 text-lg font-bold text-secondary-400">
                {job.companyName.charAt(0)}
              </div>
            )}
            <div>
              <p className="text-sm text-secondary-500">{job.companyName}</p>
              <h3 className="font-semibold text-secondary-900 group-hover:text-primary-600">
                {job.title}
              </h3>
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="badge badge-primary">
            {JOB_TYPE_LABELS[job.type] || job.type}
          </span>
          <span className="badge badge-secondary">
            {EXPERIENCE_LABELS[job.experienceLevel] || job.experienceLevel}
          </span>
        </div>

        {/* Location & Salary */}
        <div className="mb-4 space-y-1">
          <div className="flex items-center gap-2 text-sm text-secondary-600">
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
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
            <span>{job.location}</span>
          </div>
          {job.salary && (
            <div className="flex items-center gap-2 text-sm text-secondary-600">
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>{formatSalary(job.salary)}</span>
            </div>
          )}
        </div>

        {/* Skills */}
        <div className="mb-4">
          <div className="flex flex-wrap gap-1">
            {job.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 4 && (
              <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-600">
                +{job.skills.length - 4}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-secondary-100 pt-4 text-sm text-secondary-500">
          <span>{formatTimeAgo(job.postedAt)}</span>
          <span>지원자 {job.applicationCount}명</span>
        </div>
      </div>
    </Link>
  );
}
