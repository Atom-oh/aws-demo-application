'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { userApi, resumeApi } from '@/lib/api';
import type { UserProfile, Resume } from '@/types';

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: userApi.getProfile,
  });

  const { data: resumes, isLoading: resumesLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeApi.getMyResumes,
  });

  const [formData, setFormData] = useState<Partial<UserProfile>>({});

  const updateProfileMutation = useMutation({
    mutationFn: (data: Partial<UserProfile>) => userApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
    },
  });

  const uploadResumeMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      resumeApi.upload(file, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setUploadingResume(false);
    },
  });

  const deleteResumeMutation = useMutation({
    mutationFn: (resumeId: string) => resumeApi.delete(resumeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });

  const setPrimaryResumeMutation = useMutation({
    mutationFn: (resumeId: string) => resumeApi.setPrimary(resumeId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
    },
  });

  const handleEditStart = () => {
    if (profile) {
      setFormData({
        name: profile.name,
        phone: profile.phone,
        bio: profile.bio,
        location: profile.location,
        linkedinUrl: profile.linkedinUrl,
        githubUrl: profile.githubUrl,
        portfolioUrl: profile.portfolioUrl,
      });
    }
    setIsEditing(true);
  };

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const handleResumeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const title = file.name.replace(/\.[^/.]+$/, '');
      uploadResumeMutation.mutate({ file, title });
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 py-8">
        <div className="container-wrapper">
          <div className="animate-pulse">
            <div className="mb-4 h-8 w-1/4 rounded bg-secondary-200" />
            <div className="mb-8 h-4 w-1/3 rounded bg-secondary-200" />
            <div className="h-64 rounded bg-secondary-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container-wrapper">
        <h1 className="mb-8 text-3xl font-bold text-secondary-900">프로필</h1>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Info Card */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-secondary-900">
                  기본 정보
                </h2>
                {!isEditing && (
                  <Button variant="outline" size="sm" onClick={handleEditStart}>
                    수정
                  </Button>
                )}
              </div>

              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="이름"
                    value={formData.name || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                  />
                  <Input
                    label="전화번호"
                    value={formData.phone || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="010-0000-0000"
                  />
                  <Input
                    label="위치"
                    value={formData.location || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, location: e.target.value }))
                    }
                    placeholder="서울특별시"
                  />
                  <div>
                    <label className="mb-1 block text-sm font-medium text-secondary-700">
                      자기소개
                    </label>
                    <textarea
                      value={formData.bio || ''}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, bio: e.target.value }))
                      }
                      rows={4}
                      className="w-full rounded-lg border border-secondary-300 px-4 py-2 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="간단한 자기소개를 작성해주세요"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button onClick={handleSaveProfile} disabled={updateProfileMutation.isPending}>
                      {updateProfileMutation.isPending ? '저장 중...' : '저장'}
                    </Button>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary-100 text-2xl font-bold text-primary-600">
                      {profile?.name?.charAt(0) || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-secondary-900">
                        {profile?.name}
                      </h3>
                      <p className="text-secondary-600">{profile?.email}</p>
                    </div>
                  </div>
                  {profile?.bio && (
                    <p className="text-secondary-700">{profile.bio}</p>
                  )}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-sm text-secondary-500">전화번호</p>
                      <p className="text-secondary-900">
                        {profile?.phone || '-'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-secondary-500">위치</p>
                      <p className="text-secondary-900">
                        {profile?.location || '-'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Links Card */}
            <div className="rounded-lg bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-secondary-900">
                링크
              </h2>
              {isEditing ? (
                <div className="space-y-4">
                  <Input
                    label="LinkedIn"
                    value={formData.linkedinUrl || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, linkedinUrl: e.target.value }))
                    }
                    placeholder="https://linkedin.com/in/username"
                  />
                  <Input
                    label="GitHub"
                    value={formData.githubUrl || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, githubUrl: e.target.value }))
                    }
                    placeholder="https://github.com/username"
                  />
                  <Input
                    label="포트폴리오"
                    value={formData.portfolioUrl || ''}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, portfolioUrl: e.target.value }))
                    }
                    placeholder="https://portfolio.com"
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  {profile?.linkedinUrl && (
                    <a
                      href={profile.linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                      <span>LinkedIn</span>
                    </a>
                  )}
                  {profile?.githubUrl && (
                    <a
                      href={profile.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                      <span>GitHub</span>
                    </a>
                  )}
                  {profile?.portfolioUrl && (
                    <a
                      href={profile.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary-600 hover:text-primary-700"
                    >
                      <span>포트폴리오</span>
                    </a>
                  )}
                  {!profile?.linkedinUrl && !profile?.githubUrl && !profile?.portfolioUrl && (
                    <p className="text-secondary-500">등록된 링크가 없습니다.</p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Resume Section */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-lg bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-secondary-900">
                  이력서
                </h2>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                    disabled={uploadResumeMutation.isPending}
                  />
                  <Button
                    as="span"
                    size="sm"
                    disabled={uploadResumeMutation.isPending}
                  >
                    {uploadResumeMutation.isPending ? '업로드 중...' : '업로드'}
                  </Button>
                </label>
              </div>

              {resumesLoading ? (
                <div className="animate-pulse space-y-3">
                  <div className="h-16 rounded bg-secondary-200" />
                  <div className="h-16 rounded bg-secondary-200" />
                </div>
              ) : resumes && resumes.length > 0 ? (
                <div className="space-y-3">
                  {resumes.map((resume: Resume) => (
                    <div
                      key={resume.id}
                      className="flex items-center justify-between rounded-lg border border-secondary-200 p-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-secondary-900">
                          {resume.title}
                        </p>
                        <p className="text-sm text-secondary-500">
                          {new Date(resume.createdAt).toLocaleDateString('ko-KR')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {resume.isPrimary ? (
                          <span className="badge badge-primary">기본</span>
                        ) : (
                          <button
                            onClick={() => setPrimaryResumeMutation.mutate(resume.id)}
                            className="text-xs text-primary-600 hover:text-primary-700"
                          >
                            기본으로
                          </button>
                        )}
                        <button
                          onClick={() => deleteResumeMutation.mutate(resume.id)}
                          className="text-secondary-400 hover:text-red-500"
                        >
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
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-secondary-500">
                  등록된 이력서가 없습니다.
                </p>
              )}

              <p className="mt-4 text-xs text-secondary-500">
                PDF, DOC, DOCX 파일을 업로드할 수 있습니다. (최대 10MB)
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
