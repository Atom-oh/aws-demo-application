// User types
export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  profileImageUrl?: string;
  role: 'CANDIDATE' | 'EMPLOYER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends User {
  bio?: string;
  location?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
}

// Job types
export interface Job {
  id: string;
  title: string;
  companyId: string;
  companyName: string;
  companyLogo?: string;
  location: string;
  type: JobType;
  experienceLevel: ExperienceLevel;
  salary?: SalaryRange;
  description: string;
  requirements: string[];
  benefits?: string[];
  skills: string[];
  status: JobStatus;
  postedAt: string;
  deadline?: string;
  viewCount: number;
  applicationCount: number;
}

export type JobType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'REMOTE';
export type ExperienceLevel = 'ENTRY' | 'MID' | 'SENIOR' | 'LEAD' | 'EXECUTIVE';
export type JobStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'CLOSED';

export interface SalaryRange {
  min: number;
  max: number;
  currency: string;
  period: 'YEARLY' | 'MONTHLY' | 'HOURLY';
}

export interface JobSearchParams {
  keyword?: string;
  location?: string;
  type?: JobType;
  experienceLevel?: ExperienceLevel;
  skills?: string[];
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  limit?: number;
  sortBy?: 'recent' | 'salary' | 'relevance';
}

// Application types
export interface Application {
  id: string;
  jobId: string;
  job: Job;
  userId: string;
  resumeId: string;
  coverLetter?: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt: string;
  matchScore?: number;
}

export type ApplicationStatus =
  | 'SUBMITTED'
  | 'REVIEWING'
  | 'SHORTLISTED'
  | 'INTERVIEW_SCHEDULED'
  | 'INTERVIEWED'
  | 'OFFERED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'WITHDRAWN';

// Resume types
export interface Resume {
  id: string;
  userId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  parsedData?: ParsedResumeData;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ParsedResumeData {
  summary?: string;
  experience: WorkExperience[];
  education: Education[];
  skills: string[];
  certifications?: string[];
}

export interface WorkExperience {
  company: string;
  title: string;
  location?: string;
  startDate: string;
  endDate?: string;
  current: boolean;
  description?: string;
}

export interface Education {
  institution: string;
  degree: string;
  field?: string;
  startDate: string;
  endDate?: string;
  gpa?: string;
}

// Company types
export interface Company {
  id: string;
  name: string;
  logo?: string;
  description?: string;
  industry: string;
  size: CompanySize;
  website?: string;
  location: string;
  foundedYear?: number;
}

export type CompanySize = 'STARTUP' | 'SMALL' | 'MEDIUM' | 'LARGE' | 'ENTERPRISE';

// API Response types
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, string>;
}

// Auth types
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  name: string;
  role: 'CANDIDATE' | 'EMPLOYER';
}
