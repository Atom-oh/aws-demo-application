'use client';

import { useState } from 'react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card, StatCard } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import {
  AnalyticsLineChart,
  AnalyticsAreaChart,
  AnalyticsBarChart,
  AnalyticsPieChart,
  MultiLineChart,
} from '@/components/charts/AnalyticsChart';
import { Users, Briefcase, FileText, TrendingUp } from 'lucide-react';

const userGrowthData = [
  { date: 'Jan', value: 4200 },
  { date: 'Feb', value: 4800 },
  { date: 'Mar', value: 5600 },
  { date: 'Apr', value: 6200 },
  { date: 'May', value: 7100 },
  { date: 'Jun', value: 8200 },
  { date: 'Jul', value: 9500 },
  { date: 'Aug', value: 10800 },
  { date: 'Sep', value: 11200 },
  { date: 'Oct', value: 11800 },
  { date: 'Nov', value: 12100 },
  { date: 'Dec', value: 12584 },
];

const applicationData = [
  { date: 'Jan', value: 2100 },
  { date: 'Feb', value: 2400 },
  { date: 'Mar', value: 3200 },
  { date: 'Apr', value: 2800 },
  { date: 'May', value: 3600 },
  { date: 'Jun', value: 4200 },
  { date: 'Jul', value: 4800 },
  { date: 'Aug', value: 5200 },
  { date: 'Sep', value: 4600 },
  { date: 'Oct', value: 5100 },
  { date: 'Nov', value: 5400 },
  { date: 'Dec', value: 5800 },
];

const jobsByCategoryData = [
  { name: 'Technology', value: 1245 },
  { name: 'Finance', value: 856 },
  { name: 'Marketing', value: 623 },
  { name: 'Design', value: 412 },
  { name: 'Sales', value: 285 },
];

const usersByRoleData = [
  { name: 'Job Seekers', value: 9823 },
  { name: 'Employers', value: 2456 },
  { name: 'Admins', value: 45 },
];

const conversionData = [
  { date: 'Jan', applications: 2100, interviews: 420, hires: 84 },
  { date: 'Feb', applications: 2400, interviews: 480, hires: 96 },
  { date: 'Mar', applications: 3200, interviews: 640, hires: 128 },
  { date: 'Apr', applications: 2800, interviews: 560, hires: 112 },
  { date: 'May', applications: 3600, interviews: 720, hires: 144 },
  { date: 'Jun', applications: 4200, interviews: 840, hires: 168 },
];

export default function AnalyticsPage() {
  const [period, setPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="분석"
        subtitle="플랫폼 성과 및 인사이트"
      />

      <div className="p-6">
        {/* Period Selector */}
        <div className="mb-6 flex items-center gap-2">
          {(['7d', '30d', '90d', '1y'] as const).map((p) => (
            <Button
              key={p}
              variant={period === p ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPeriod(p)}
            >
              {p === '7d' && '최근 7일'}
              {p === '30d' && '최근 30일'}
              {p === '90d' && '최근 90일'}
              {p === '1y' && '최근 1년'}
            </Button>
          ))}
        </div>

        {/* Stats Grid */}
        <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="전체 사용자"
            value={12584}
            change={{ value: 12.5, type: 'increase' }}
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="진행중 채용공고"
            value={1856}
            change={{ value: 8.2, type: 'increase' }}
            icon={<Briefcase className="h-6 w-6" />}
          />
          <StatCard
            title="총 지원"
            value={45632}
            change={{ value: 15.3, type: 'increase' }}
            icon={<FileText className="h-6 w-6" />}
          />
          <StatCard
            title="채용 전환율"
            value="4.2%"
            change={{ value: 0.8, type: 'increase' }}
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AnalyticsAreaChart
            title="사용자 증가 추이"
            description="전체 등록 사용자 변화"
            data={userGrowthData}
            color="#3b82f6"
            height={320}
          />
          <AnalyticsLineChart
            title="지원 현황"
            description="채용공고 지원 수"
            data={applicationData}
            color="#10b981"
            height={320}
          />
          <AnalyticsBarChart
            title="산업별 채용공고"
            description="진행중인 채용공고 분포"
            data={jobsByCategoryData}
            color="#8b5cf6"
            height={320}
          />
          <AnalyticsPieChart
            title="역할별 사용자"
            description="사용자 유형 분포"
            data={usersByRoleData}
            height={320}
          />
        </div>

        {/* Conversion Funnel */}
        <div className="mt-6">
          <MultiLineChart
            title="채용 퍼널"
            description="지원부터 채용까지 전환 현황"
            data={conversionData}
            lines={[
              { dataKey: 'applications', color: '#3b82f6', name: '지원' },
              { dataKey: 'interviews', color: '#f59e0b', name: '면접' },
              { dataKey: 'hires', color: '#10b981', name: '채용' },
            ]}
            height={400}
          />
        </div>
      </div>
    </div>
  );
}
