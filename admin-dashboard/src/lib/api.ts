import {
  User,
  Company,
  Job,
  DashboardStats,
  AnalyticsData,
  PaginatedResponse,
  PaginationParams,
  UserFilters,
  CompanyFilters,
  JobFilters,
  ApiResponse,
} from '@/types';
import { getAccessToken } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await getAccessToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  private buildQueryString(params: Record<string, unknown>): string {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.append(key, String(value));
      }
    });
    return searchParams.toString();
  }

  // Dashboard
  async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return this.request<DashboardStats>('/admin/dashboard/stats');
  }

  async getAnalyticsData(period: string = '30d'): Promise<ApiResponse<AnalyticsData>> {
    return this.request<AnalyticsData>(`/admin/analytics?period=${period}`);
  }

  // Users
  async getUsers(
    pagination: PaginationParams,
    filters?: UserFilters
  ): Promise<ApiResponse<PaginatedResponse<User>>> {
    const query = this.buildQueryString({ ...pagination, ...filters });
    return this.request<PaginatedResponse<User>>(`/admin/users?${query}`);
  }

  async getUserById(id: string): Promise<ApiResponse<User>> {
    return this.request<User>(`/admin/users/${id}`);
  }

  async updateUserStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<User>> {
    return this.request<User>(`/admin/users/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async deleteUser(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  }

  // Companies
  async getCompanies(
    pagination: PaginationParams,
    filters?: CompanyFilters
  ): Promise<ApiResponse<PaginatedResponse<Company>>> {
    const query = this.buildQueryString({ ...pagination, ...filters });
    return this.request<PaginatedResponse<Company>>(`/admin/companies?${query}`);
  }

  async getCompanyById(id: string): Promise<ApiResponse<Company>> {
    return this.request<Company>(`/admin/companies/${id}`);
  }

  async updateCompanyStatus(
    id: string,
    status: string
  ): Promise<ApiResponse<Company>> {
    return this.request<Company>(`/admin/companies/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async verifyCompany(id: string): Promise<ApiResponse<Company>> {
    return this.request<Company>(`/admin/companies/${id}/verify`, {
      method: 'POST',
    });
  }

  // Jobs
  async getJobs(
    pagination: PaginationParams,
    filters?: JobFilters
  ): Promise<ApiResponse<PaginatedResponse<Job>>> {
    const query = this.buildQueryString({ ...pagination, ...filters });
    return this.request<PaginatedResponse<Job>>(`/admin/jobs?${query}`);
  }

  async getJobById(id: string): Promise<ApiResponse<Job>> {
    return this.request<Job>(`/admin/jobs/${id}`);
  }

  async updateJobStatus(id: string, status: string): Promise<ApiResponse<Job>> {
    return this.request<Job>(`/admin/jobs/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export default apiClient;
