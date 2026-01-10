'use client';

import { useState } from 'react';
import {
  Bell,
  Shield,
  Globe,
  Database,
  Mail,
  Key,
  Save,
  RefreshCw,
} from 'lucide-react';
import AdminHeader from '@/components/layout/AdminHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

interface SettingSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const settingSections: SettingSection[] = [
  {
    id: 'general',
    title: '일반 설정',
    description: '플랫폼 기본 설정',
    icon: <Globe className="h-5 w-5" />,
  },
  {
    id: 'notifications',
    title: '알림 설정',
    description: '이메일 및 푸시 알림',
    icon: <Bell className="h-5 w-5" />,
  },
  {
    id: 'security',
    title: '보안 설정',
    description: '인증 및 접근 제어',
    icon: <Shield className="h-5 w-5" />,
  },
  {
    id: 'integrations',
    title: '외부 연동',
    description: 'API 및 서드파티 연동',
    icon: <Database className="h-5 w-5" />,
  },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('general');
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    siteName: 'HireHub',
    siteDescription: 'AI 기반 채용 플랫폼',
    supportEmail: 'support@hirehub.com',
    maxJobsPerCompany: '50',
    maxApplicationsPerUser: '100',
    emailNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    newUserNotification: true,
    newCompanyNotification: true,
    mfaRequired: true,
    sessionTimeout: '30',
    maxLoginAttempts: '5',
    passwordMinLength: '8',
  });

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const handleInputChange = (key: string, value: string | boolean) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="min-h-screen">
      <AdminHeader title="설정" subtitle="플랫폼 설정 관리" />

      <div className="p-6">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card padding="sm">
              <nav className="space-y-1">
                {settingSections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                      activeSection === section.id
                        ? 'bg-primary-50 text-primary-700'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <span
                      className={
                        activeSection === section.id
                          ? 'text-primary-600'
                          : 'text-gray-400'
                      }
                    >
                      {section.icon}
                    </span>
                    <div>
                      <p className="font-medium">{section.title}</p>
                      <p className="text-xs text-gray-500">{section.description}</p>
                    </div>
                  </button>
                ))}
              </nav>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {activeSection === 'general' && (
              <Card>
                <CardHeader
                  title="일반 설정"
                  description="플랫폼의 기본 설정을 관리합니다"
                />
                <div className="mt-6 space-y-6">
                  <Input
                    label="사이트 이름"
                    value={settings.siteName}
                    onChange={(e) => handleInputChange('siteName', e.target.value)}
                  />
                  <Input
                    label="사이트 설명"
                    value={settings.siteDescription}
                    onChange={(e) =>
                      handleInputChange('siteDescription', e.target.value)
                    }
                  />
                  <Input
                    label="고객지원 이메일"
                    type="email"
                    value={settings.supportEmail}
                    onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                    leftIcon={<Mail className="h-4 w-4" />}
                  />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="기업당 최대 채용공고 수"
                      type="number"
                      value={settings.maxJobsPerCompany}
                      onChange={(e) =>
                        handleInputChange('maxJobsPerCompany', e.target.value)
                      }
                    />
                    <Input
                      label="사용자당 최대 지원 수"
                      type="number"
                      value={settings.maxApplicationsPerUser}
                      onChange={(e) =>
                        handleInputChange('maxApplicationsPerUser', e.target.value)
                      }
                    />
                  </div>
                </div>
              </Card>
            )}

            {activeSection === 'notifications' && (
              <Card>
                <CardHeader
                  title="알림 설정"
                  description="알림 방식과 수신 여부를 설정합니다"
                />
                <div className="mt-6 space-y-4">
                  {[
                    {
                      key: 'emailNotifications',
                      label: '이메일 알림',
                      description: '중요 이벤트에 대한 이메일 수신',
                    },
                    {
                      key: 'pushNotifications',
                      label: '푸시 알림',
                      description: '브라우저 푸시 알림 활성화',
                    },
                    {
                      key: 'marketingEmails',
                      label: '마케팅 이메일',
                      description: '프로모션 및 뉴스레터 수신',
                    },
                    {
                      key: 'newUserNotification',
                      label: '신규 회원가입 알림',
                      description: '새로운 사용자 가입 시 알림',
                    },
                    {
                      key: 'newCompanyNotification',
                      label: '신규 기업등록 알림',
                      description: '새로운 기업 등록 시 알림',
                    },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between rounded-lg border border-gray-200 p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {item.label}
                        </p>
                        <p className="text-sm text-gray-500">{item.description}</p>
                      </div>
                      <label className="relative inline-flex cursor-pointer items-center">
                        <input
                          type="checkbox"
                          checked={settings[item.key as keyof typeof settings] as boolean}
                          onChange={(e) =>
                            handleInputChange(item.key, e.target.checked)
                          }
                          className="peer sr-only"
                        />
                        <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300" />
                      </label>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {activeSection === 'security' && (
              <Card>
                <CardHeader
                  title="보안 설정"
                  description="인증 및 보안 관련 설정을 관리합니다"
                />
                <div className="mt-6 space-y-6">
                  <div className="flex items-center justify-between rounded-lg border border-gray-200 p-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">MFA 필수화</p>
                      <p className="text-sm text-gray-500">
                        모든 관리자 계정에 다중 인증 요구
                      </p>
                    </div>
                    <label className="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        checked={settings.mfaRequired}
                        onChange={(e) =>
                          handleInputChange('mfaRequired', e.target.checked)
                        }
                        className="peer sr-only"
                      />
                      <div className="peer h-6 w-11 rounded-full bg-gray-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-primary-600 peer-checked:after:translate-x-full peer-checked:after:border-white peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300" />
                    </label>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="세션 타임아웃 (분)"
                      type="number"
                      value={settings.sessionTimeout}
                      onChange={(e) =>
                        handleInputChange('sessionTimeout', e.target.value)
                      }
                      leftIcon={<RefreshCw className="h-4 w-4" />}
                    />
                    <Input
                      label="최대 로그인 시도"
                      type="number"
                      value={settings.maxLoginAttempts}
                      onChange={(e) =>
                        handleInputChange('maxLoginAttempts', e.target.value)
                      }
                      leftIcon={<Key className="h-4 w-4" />}
                    />
                  </div>
                  <Input
                    label="최소 비밀번호 길이"
                    type="number"
                    value={settings.passwordMinLength}
                    onChange={(e) =>
                      handleInputChange('passwordMinLength', e.target.value)
                    }
                  />
                </div>
              </Card>
            )}

            {activeSection === 'integrations' && (
              <Card>
                <CardHeader
                  title="외부 연동"
                  description="API 키 및 외부 서비스 연동을 관리합니다"
                />
                <div className="mt-6 space-y-6">
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">AWS Cognito</p>
                        <p className="text-sm text-gray-500">인증 서비스 연동</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        연결됨
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Amazon Bedrock</p>
                        <p className="text-sm text-gray-500">AI 매칭 서비스</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        연결됨
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">Kafka (MSK)</p>
                        <p className="text-sm text-gray-500">메시지 큐 서비스</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        연결됨
                      </span>
                    </div>
                  </div>
                  <div className="rounded-lg border border-gray-200 p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">OpenSearch</p>
                        <p className="text-sm text-gray-500">검색 엔진</p>
                      </div>
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        연결됨
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                isLoading={isSaving}
                leftIcon={<Save className="h-4 w-4" />}
              >
                설정 저장
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
