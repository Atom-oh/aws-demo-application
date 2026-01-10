// User Types
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  profileImageUrl?: string;
  phoneNumber?: string;
  provider?: AuthProvider;
}

export type UserRole = 'job_seeker' | 'employer' | 'admin';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending_verification';
export type AuthProvider = 'email' | 'google' | 'kakao' | 'naver';

// Company Types
export interface Company {
  id: string;
  name: string;
  description?: string;
  industry: string;
  size: CompanySize;
  status: CompanyStatus;
  logoUrl?: string;
  websiteUrl?: string;
  location: string;
  employerId: string;
  createdAt: string;
  updatedAt: string;
  verifiedAt?: string;
}

export type CompanySize = 'startup' | 'small' | 'medium' | 'large' | 'enterprise';
export type CompanyStatus = 'pending' | 'verified' | 'rejected' | 'suspended';

// Job Types
export interface Job {
  id: string;
  title: string;
  description: string;
  companyId: string;
  company?: Company;
  location: string;
  employmentType: EmploymentType;
  experienceLevel: ExperienceLevel;
  salaryMin?: number;
  salaryMax?: number;
  currency: string;
  skills: string[];
  status: JobStatus;
  viewCount: number;
  applicationCount: number;
  createdAt: string;
  updatedAt: string;
  expiresAt: string;
}

export type EmploymentType = 'full_time' | 'part_time' | 'contract' | 'internship' | 'freelance';
export type ExperienceLevel = 'entry' | 'junior' | 'mid' | 'senior' | 'lead' | 'executive';
export type JobStatus = 'draft' | 'active' | 'paused' | 'closed' | 'expired';

// Application Types
export interface Application {
  id: string;
  userId: string;
  jobId: string;
  resumeId: string;
  status: ApplicationStatus;
  matchScore?: number;
  coverLetter?: string;
  createdAt: string;
  updatedAt: string;
}

export type ApplicationStatus = 'submitted' | 'reviewing' | 'shortlisted' | 'interviewed' | 'offered' | 'rejected' | 'withdrawn';

// Analytics Types
export interface DashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalCompanies: number;
  verifiedCompanies: number;
  totalJobs: number;
  activeJobs: number;
  totalApplications: number;
  conversionRate: number;
}

export interface TimeSeriesData {
  date: string;
  value: number;
}

export interface AnalyticsData {
  userGrowth: TimeSeriesData[];
  jobPostings: TimeSeriesData[];
  applications: TimeSeriesData[];
  matchSuccessRate: TimeSeriesData[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

// Pagination Types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Filter Types
export interface UserFilters {
  role?: UserRole;
  status?: UserStatus;
  search?: string;
  provider?: AuthProvider;
}

export interface CompanyFilters {
  status?: CompanyStatus;
  size?: CompanySize;
  industry?: string;
  search?: string;
}

export interface JobFilters {
  status?: JobStatus;
  employmentType?: EmploymentType;
  experienceLevel?: ExperienceLevel;
  companyId?: string;
  search?: string;
}

// Auth Types
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'super_admin';
  mfaEnabled: boolean;
  lastLoginAt?: string;
}

export interface AuthState {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  mfaRequired: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface MFAChallenge {
  challengeName: string;
  session: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
