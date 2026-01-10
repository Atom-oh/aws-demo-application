'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Building2,
  MapPin,
  Globe,
  Users,
  Calendar,
  CheckCircle,
  XCircle,
  Ban,
  Briefcase,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card, CardHeader, StatusBadge } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { apiClient } from '@/lib/api';
import { Company, CompanyStatus, CompanySize } from '@/types';

// Mock company for demonstration
const mockCompany: Company = {
  id: '1',
  name: 'TechCorp Inc.',
  description:
    'TechCorp is a leading technology company specializing in enterprise software solutions and cloud services. We are committed to innovation and digital transformation.',
  industry: 'Technology',
  size: 'large',
  status: 'verified',
  logoUrl: undefined,
  websiteUrl: 'https://techcorp.example.com',
  location: 'Seoul, Korea',
  employerId: 'user-1',
  createdAt: '2024-01-10T09:00:00Z',
  updatedAt: '2024-01-15T10:30:00Z',
  verifiedAt: '2024-01-12T14:00:00Z',
};

const statusVariants: Record<CompanyStatus, 'success' | 'warning' | 'error' | 'info' | 'default'> = {
  verified: 'success',
  pending: 'warning',
  rejected: 'error',
  suspended: 'default',
};

const sizeLabels: Record<CompanySize, string> = {
  startup: '1-10 employees',
  small: '11-50 employees',
  medium: '51-200 employees',
  large: '201-1000 employees',
  enterprise: '1000+ employees',
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.id as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchCompany = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.getCompanyById(companyId);
        if (response.success && response.data) {
          setCompany(response.data);
        } else {
          // Use mock data for demo
          setCompany({ ...mockCompany, id: companyId });
        }
      } catch (error) {
        console.error('Failed to fetch company:', error);
        setCompany({ ...mockCompany, id: companyId });
      } finally {
        setIsLoading(false);
      }
    };
    fetchCompany();
  }, [companyId]);

  const handleStatusChange = async (newStatus: CompanyStatus) => {
    if (!company) return;
    setActionLoading(newStatus);
    try {
      const response = await apiClient.updateCompanyStatus(company.id, newStatus);
      if (response.success && response.data) {
        setCompany(response.data);
      } else {
        // Demo: update locally
        setCompany({ ...company, status: newStatus });
      }
    } catch (error) {
      console.error('Failed to update company status:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleVerify = async () => {
    if (!company) return;
    setActionLoading('verify');
    try {
      const response = await apiClient.verifyCompany(company.id);
      if (response.success && response.data) {
        setCompany(response.data);
      } else {
        // Demo: update locally
        setCompany({
          ...company,
          status: 'verified',
          verifiedAt: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Failed to verify company:', error);
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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center">
        <p className="text-gray-500">Company not found</p>
        <Button variant="outline" onClick={() => router.push('/companies')} className="mt-4">
          Back to Companies
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminHeader
        title="Company Details"
        subtitle={`Viewing company: ${company.name}`}
      />

      <div className="p-6">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-6 flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Companies
        </button>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex items-start gap-4">
                <div className="flex h-20 w-20 items-center justify-center rounded-xl bg-gray-100">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={company.name}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  ) : (
                    <Building2 className="h-10 w-10 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        {company.name}
                      </h2>
                      <p className="text-sm text-gray-500">{company.industry}</p>
                    </div>
                    <StatusBadge
                      status={company.status}
                      variant={statusVariants[company.status]}
                    />
                  </div>
                  <p className="mt-4 text-sm text-gray-600">{company.description}</p>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <MapPin className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Location</p>
                    <p className="text-sm font-medium text-gray-900">
                      {company.location}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Users className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Company Size</p>
                    <p className="text-sm font-medium text-gray-900">
                      {sizeLabels[company.size]}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Globe className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Website</p>
                    {company.websiteUrl ? (
                      <a
                        href={company.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm font-medium text-primary-600 hover:underline"
                      >
                        {company.websiteUrl}
                      </a>
                    ) : (
                      <p className="text-sm font-medium text-gray-900">-</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="rounded-lg bg-gray-100 p-2">
                    <Calendar className="h-5 w-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Registered</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(company.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Job Postings */}
            <Card>
              <CardHeader
                title="Job Postings"
                description="Active job listings from this company"
                action={
                  <Button variant="outline" size="sm">
                    View All Jobs
                  </Button>
                }
              />
              <div className="mt-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-primary-100 p-2 text-primary-600">
                        <Briefcase className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {['Senior Developer', 'Product Manager', 'UX Designer'][i - 1]}
                        </p>
                        <p className="text-xs text-gray-500">
                          {['12 applications', '8 applications', '15 applications'][i - 1]}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status="active" variant="success" />
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader title="Actions" description="Manage company status" />
              <div className="mt-4 space-y-3">
                {company.status === 'pending' && (
                  <>
                    <Button
                      variant="primary"
                      className="w-full justify-start"
                      leftIcon={<CheckCircle className="h-4 w-4" />}
                      onClick={handleVerify}
                      isLoading={actionLoading === 'verify'}
                    >
                      Verify Company
                    </Button>
                    <Button
                      variant="danger"
                      className="w-full justify-start"
                      leftIcon={<XCircle className="h-4 w-4" />}
                      onClick={() => handleStatusChange('rejected')}
                      isLoading={actionLoading === 'rejected'}
                    >
                      Reject Company
                    </Button>
                  </>
                )}
                {company.status === 'verified' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<Ban className="h-4 w-4" />}
                    onClick={() => handleStatusChange('suspended')}
                    isLoading={actionLoading === 'suspended'}
                  >
                    Suspend Company
                  </Button>
                )}
                {company.status === 'suspended' && (
                  <Button
                    variant="primary"
                    className="w-full justify-start"
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    onClick={() => handleStatusChange('verified')}
                    isLoading={actionLoading === 'verified'}
                  >
                    Reactivate Company
                  </Button>
                )}
                {company.status === 'rejected' && (
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    leftIcon={<CheckCircle className="h-4 w-4" />}
                    onClick={handleVerify}
                    isLoading={actionLoading === 'verify'}
                  >
                    Approve & Verify
                  </Button>
                )}
              </div>
            </Card>

            <Card>
              <CardHeader title="Statistics" description="Company activity overview" />
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total Jobs Posted</span>
                  <span className="font-medium text-gray-900">24</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Active Jobs</span>
                  <span className="font-medium text-gray-900">8</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Total Applications</span>
                  <span className="font-medium text-gray-900">342</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-500">Hired</span>
                  <span className="font-medium text-gray-900">12</span>
                </div>
              </div>
            </Card>

            {company.verifiedAt && (
              <Card>
                <CardHeader title="Verification" description="Verification details" />
                <div className="mt-4 text-sm">
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="h-4 w-4" />
                    <span>Verified on {formatDate(company.verifiedAt)}</span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
