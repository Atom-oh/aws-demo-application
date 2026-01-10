import axios, { AxiosInstance, AxiosError } from 'axios';
import { fetchAuthSession } from 'aws-amplify/auth';
import type {
  Job,
  JobSearchParams,
  Application,
  Resume,
  User,
  UserProfile,
  PaginatedResponse,
  ApiError,
} from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Create axios instance with default config
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_URL,
    headers: {
      'Content-Type': 'application/json',
    },
    timeout: 30000,
  });

  // Request interceptor to add auth token
  client.interceptors.request.use(
    async (config) => {
      try {
        const session = await fetchAuthSession();
        const token = session.tokens?.accessToken?.toString();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch {
        // User not authenticated, continue without token
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError<ApiError>) => {
      const apiError: ApiError = {
        message: error.response?.data?.message || error.message || 'An error occurred',
        code: error.response?.data?.code || 'UNKNOWN_ERROR',
        details: error.response?.data?.details,
      };
      return Promise.reject(apiError);
    }
  );

  return client;
};

const api = createApiClient();

// Job API
export const jobApi = {
  search: async (params: JobSearchParams): Promise<PaginatedResponse<Job>> => {
    const { data } = await api.get('/api/v1/jobs', { params });
    return data;
  },

  getById: async (id: string): Promise<Job> => {
    const { data } = await api.get(`/api/v1/jobs/${id}`);
    return data;
  },

  getRecommended: async (limit = 10): Promise<Job[]> => {
    const { data } = await api.get('/api/v1/jobs/recommended', { params: { limit } });
    return data;
  },
};

// Application API
export const applicationApi = {
  getMyApplications: async (page = 1, limit = 10): Promise<PaginatedResponse<Application>> => {
    const { data } = await api.get('/api/v1/applications/me', { params: { page, limit } });
    return data;
  },

  apply: async (jobId: string, resumeId: string, coverLetter?: string): Promise<Application> => {
    const { data } = await api.post('/api/v1/applications', {
      jobId,
      resumeId,
      coverLetter,
    });
    return data;
  },

  withdraw: async (applicationId: string): Promise<void> => {
    await api.delete(`/api/v1/applications/${applicationId}`);
  },

  getStatus: async (applicationId: string): Promise<Application> => {
    const { data } = await api.get(`/api/v1/applications/${applicationId}`);
    return data;
  },
};

// Resume API
export const resumeApi = {
  getMyResumes: async (): Promise<Resume[]> => {
    const { data } = await api.get('/api/v1/resumes/me');
    return data;
  },

  upload: async (file: File, title: string): Promise<Resume> => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);

    const { data } = await api.post('/api/v1/resumes', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },

  delete: async (resumeId: string): Promise<void> => {
    await api.delete(`/api/v1/resumes/${resumeId}`);
  },

  setPrimary: async (resumeId: string): Promise<Resume> => {
    const { data } = await api.patch(`/api/v1/resumes/${resumeId}/primary`);
    return data;
  },
};

// User API
export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const { data } = await api.get('/api/v1/users/me');
    return data;
  },

  updateProfile: async (profile: Partial<UserProfile>): Promise<UserProfile> => {
    const { data } = await api.patch('/api/v1/users/me', profile);
    return data;
  },

  uploadProfileImage: async (file: File): Promise<{ url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const { data } = await api.post('/api/v1/users/me/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return data;
  },
};

// Match API
export const matchApi = {
  getJobMatch: async (jobId: string, resumeId: string): Promise<{ score: number; analysis: string }> => {
    const { data } = await api.post('/api/v1/match/job', { jobId, resumeId });
    return data;
  },

  getRecommendedJobs: async (resumeId: string, limit = 10): Promise<Job[]> => {
    const { data } = await api.get('/api/v1/match/recommended', {
      params: { resumeId, limit },
    });
    return data;
  },
};

export default api;
