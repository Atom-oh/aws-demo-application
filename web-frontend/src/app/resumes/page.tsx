'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { resumeApi } from '@/lib/api';
import type { Resume } from '@/types';

export default function ResumesPage() {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadTitle, setUploadTitle] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const { data: resumes, isLoading } = useQuery({
    queryKey: ['resumes'],
    queryFn: resumeApi.getMyResumes,
  });

  const uploadMutation = useMutation({
    mutationFn: ({ file, title }: { file: File; title: string }) =>
      resumeApi.upload(file, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resumes'] });
      setShowUploadModal(false);
      setSelectedFile(null);
      setUploadTitle('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => resumeApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const setPrimaryMutation = useMutation({
    mutationFn: (id: string) => resumeApi.setPrimary(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resumes'] }),
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadTitle(file.name.replace(/\.[^/.]+$/, ''));
      setShowUploadModal(true);
    }
  };

  const handleUpload = () => {
    if (selectedFile && uploadTitle) {
      uploadMutation.mutate({ file: selectedFile, title: uploadTitle });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-secondary-50 py-8">
        <div className="container-wrapper">
          <div className="animate-pulse space-y-4">
            <div className="h-8 w-1/4 rounded bg-secondary-200" />
            <div className="h-32 rounded-lg bg-secondary-200" />
            <div className="h-32 rounded-lg bg-secondary-200" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary-50 py-8">
      <div className="container-wrapper">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-secondary-900">이력서 관리</h1>
            <p className="mt-2 text-secondary-600">
              총 {resumes?.length || 0}개의 이력서가 등록되어 있습니다
            </p>
          </div>
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button onClick={() => fileInputRef.current?.click()}>
              이력서 업로드
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mb-6 rounded-lg bg-primary-50 p-4">
          <div className="flex gap-3">
            <svg className="h-5 w-5 flex-shrink-0 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-primary-800">
              <p className="font-medium">이력서 업로드 안내</p>
              <p className="mt-1">PDF, DOC, DOCX 파일을 업로드할 수 있으며, 최대 10MB까지 지원합니다. AI가 이력서를 분석하여 개인정보를 자동으로 마스킹합니다.</p>
            </div>
          </div>
        </div>

        {/* Resume List */}
        {resumes && resumes.length > 0 ? (
          <div className="space-y-4">
            {resumes.map((resume: Resume) => (
              <div key={resume.id} className="rounded-lg border border-secondary-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100">
                      <svg className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-secondary-900">{resume.title}</h3>
                        {resume.isPrimary && (
                          <span className="badge badge-primary">기본 이력서</span>
                        )}
                      </div>
                      <p className="text-sm text-secondary-500">{resume.fileName}</p>
                      <p className="mt-1 text-sm text-secondary-400">
                        업로드: {new Date(resume.createdAt).toLocaleDateString('ko-KR')}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {!resume.isPrimary && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPrimaryMutation.mutate(resume.id)}
                        disabled={setPrimaryMutation.isPending}
                      >
                        기본으로 설정
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(resume.fileUrl, '_blank')}
                    >
                      보기
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (confirm('이력서를 삭제하시겠습니까?')) {
                          deleteMutation.mutate(resume.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-600 hover:bg-red-50"
                    >
                      삭제
                    </Button>
                  </div>
                </div>

                {/* Parsed Skills Preview */}
                {resume.parsedData?.skills && resume.parsedData.skills.length > 0 && (
                  <div className="mt-4 border-t border-secondary-100 pt-4">
                    <p className="mb-2 text-sm font-medium text-secondary-700">분석된 기술 스택</p>
                    <div className="flex flex-wrap gap-2">
                      {resume.parsedData.skills.slice(0, 8).map((skill, idx) => (
                        <span key={idx} className="rounded-full bg-secondary-100 px-3 py-1 text-sm text-secondary-600">
                          {skill}
                        </span>
                      ))}
                      {resume.parsedData.skills.length > 8 && (
                        <span className="rounded-full bg-secondary-100 px-3 py-1 text-sm text-secondary-500">
                          +{resume.parsedData.skills.length - 8}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-white p-12 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary-100">
              <svg className="h-8 w-8 text-secondary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-secondary-900">
              등록된 이력서가 없습니다
            </h3>
            <p className="mb-6 text-secondary-600">
              이력서를 업로드하고 AI 매칭 서비스를 이용해보세요
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>
              첫 이력서 업로드하기
            </Button>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6">
            <h2 className="mb-4 text-xl font-semibold text-secondary-900">이력서 업로드</h2>

            {selectedFile && (
              <div className="mb-4 rounded-lg bg-secondary-50 p-4">
                <div className="flex items-center gap-3">
                  <svg className="h-8 w-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-secondary-900">{selectedFile.name}</p>
                    <p className="text-sm text-secondary-500">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6">
              <Input
                label="이력서 제목"
                value={uploadTitle}
                onChange={(e) => setUploadTitle(e.target.value)}
                placeholder="예: 2024년 경력 이력서"
              />
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowUploadModal(false);
                  setSelectedFile(null);
                  setUploadTitle('');
                }}
              >
                취소
              </Button>
              <Button
                className="flex-1"
                onClick={handleUpload}
                disabled={!uploadTitle || uploadMutation.isPending}
              >
                {uploadMutation.isPending ? '업로드 중...' : '업로드'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
