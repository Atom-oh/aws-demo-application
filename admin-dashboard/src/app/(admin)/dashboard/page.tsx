'use client';

import { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Briefcase,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card, StatCard } from '@/components/ui/Card';
import {
  AnalyticsLineChart,
  AnalyticsBarChart,
} from '@/components/charts/AnalyticsChart';
import { apiClient } from '@/lib/api';
import { DashboardStats, TimeSeriesData, ChartDataPoint } from '@/types';

// Mock data for demonstration
const mockStats: DashboardStats = {
  totalUsers: 12584,
  activeUsers: 8423,
  totalCompanies: 856,
  verifiedCompanies: 724,
  totalJobs: 3421,
  activeJobs: 1856,
  totalApplications: 45632,
  conversionRate: 12.4,
};

const mockUserGrowth: TimeSeriesData[] = [
  { date: 'Jan', value: 8200 },
  { date: 'Feb', value: 8800 },
  { date: 'Mar', value: 9500 },
  { date: 'Apr', value: 10200 },
  { date: 'May', value: 11100 },
  { date: 'Jun', value: 12584 },
];

const mockJobsByCategory: ChartDataPoint[] = [
  { name: 'Tech', value: 1245 },
  { name: 'Finance', value: 856 },
  { name: 'Marketing', value: 623 },
  { name: 'Design', value: 412 },
  { name: 'Sales', value: 285 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await apiClient.getDashboardStats();
        if (response.success && response.data) {
          setStats(response.data);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="대시보드"
        subtitle="HireHub 플랫폼 현황"
      />

      <div className="p-6">
        {/* Stats Grid */}
        <div className="mb-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="전체 사용자"
            value={stats.totalUsers}
            change={{ value: 12.5, type: 'increase' }}
            icon={<Users className="h-6 w-6" />}
          />
          <StatCard
            title="등록 기업"
            value={stats.totalCompanies}
            change={{ value: 8.2, type: 'increase' }}
            icon={<Building2 className="h-6 w-6" />}
          />
          <StatCard
            title="진행중 채용공고"
            value={stats.activeJobs}
            change={{ value: 3.1, type: 'decrease' }}
            icon={<Briefcase className="h-6 w-6" />}
          />
          <StatCard
            title="전환율"
            value={`${stats.conversionRate}%`}
            change={{ value: 2.4, type: 'increase' }}
            icon={<TrendingUp className="h-6 w-6" />}
          />
        </div>

        {/* Charts */}
        <div className="grid gap-6 lg:grid-cols-2">
          <AnalyticsLineChart
            title="사용자 증가 추이"
            description="월별 신규 가입자 현황"
            data={mockUserGrowth}
            color="#3b82f6"
            height={320}
          />
          <AnalyticsBarChart
            title="산업별 채용공고"
            description="활성 채용공고 분포"
            data={mockJobsByCategory}
            color="#10b981"
            height={320}
          />
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">
              최근 활동
            </h3>
            <button className="text-sm font-medium text-primary-600 hover:text-primary-700">
              전체보기
            </button>
          </div>
          <div className="space-y-4">
            {[
              {
                title: '신규 기업 등록',
                description: 'TechCorp Inc.가 기업 등록을 완료했습니다',
                time: '5분 전',
                type: 'company',
              },
              {
                title: '채용공고 승인',
                description: 'StartupXYZ의 시니어 개발자 포지션',
                time: '12분 전',
                type: 'job',
              },
              {
                title: '사용자 신고',
                description: '스팸 계정 검토 요청',
                time: '1시간 전',
                type: 'alert',
              },
              {
                title: '신규 지원',
                description: '오늘 45건의 새로운 지원서가 접수되었습니다',
                time: '2시간 전',
                type: 'application',
              },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-start gap-4 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
              >
                <div
                  className={`rounded-lg p-2 ${
                    activity.type === 'alert'
                      ? 'bg-red-100 text-red-600'
                      : 'bg-primary-100 text-primary-600'
                  }`}
                >
                  {activity.type === 'company' && (
                    <Building2 className="h-5 w-5" />
                  )}
                  {activity.type === 'job' && (
                    <Briefcase className="h-5 w-5" />
                  )}
                  {activity.type === 'alert' && (
                    <ArrowDownRight className="h-5 w-5" />
                  )}
                  {activity.type === 'application' && (
                    <ArrowUpRight className="h-5 w-5" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">
                    {activity.title}
                  </p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
