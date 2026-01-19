export interface Job {
  id: number;
  title: string;
  company: string;
  logo: string;
  team: string;
  location: string;
  type: string;
  experience: string;
  salary: string;
  tags: string[];
  category: string;
  description: string;
  requirements: string[];
  preferred: string[];
  deadline: string;
}

export const JOBS: Job[] = [
  {
    id: 1,
    title: 'Senior Backend Engineer',
    company: '토스',
    logo: 'T',
    team: 'Core Banking',
    location: '서울 강남',
    type: '정규직',
    experience: '5년 이상',
    salary: '1억 ~ 1.5억',
    tags: ['Kotlin', 'Spring', 'Kafka', 'MSA'],
    category: 'Engineering',
    description: '토스 핵심 금융 서비스의 백엔드 시스템을 설계하고 개발합니다.',
    requirements: ['5년 이상 백엔드 개발 경험', 'Kotlin/Java 능숙', '대용량 트래픽 처리 경험'],
    preferred: ['금융 도메인 경험', 'MSA 설계 경험'],
    deadline: '상시채용'
  },
  {
    id: 2,
    title: 'Frontend Developer',
    company: '카카오',
    logo: 'K',
    team: '카카오톡 FE',
    location: '판교',
    type: '정규직',
    experience: '3년 이상',
    salary: '7,000만원 ~ 1억',
    tags: ['React', 'TypeScript', 'Next.js'],
    category: 'Engineering',
    description: '카카오톡 웹 서비스 프론트엔드 개발을 담당합니다.',
    requirements: ['React/Vue 3년 이상 경험', 'TypeScript 필수', '웹 성능 최적화 경험'],
    preferred: ['대규모 서비스 경험', 'Next.js 경험'],
    deadline: '2026-02-28'
  },
  {
    id: 3,
    title: 'AI/ML Engineer',
    company: '네이버',
    logo: 'N',
    team: 'AI Lab',
    location: '판교',
    type: '정규직',
    experience: '3년 이상',
    salary: '8,000만원 ~ 1.2억',
    tags: ['Python', 'PyTorch', 'LLM', 'RAG'],
    category: 'Engineering',
    description: '네이버 검색 AI 모델 개발 및 서빙 시스템을 구축합니다.',
    requirements: ['ML/DL 3년 이상 경험', 'PyTorch 능숙', 'NLP 또는 CV 전문성'],
    preferred: ['LLM 파인튜닝 경험', '논문 게재 경력'],
    deadline: '2026-03-15'
  },
  {
    id: 4,
    title: 'DevOps Engineer',
    company: '쿠팡',
    logo: 'C',
    team: 'Platform',
    location: '서울',
    type: '정규직',
    experience: '5년 이상',
    salary: '9,000만원 ~ 1.3억',
    tags: ['AWS', 'Kubernetes', 'Terraform', 'CI/CD'],
    category: 'Engineering',
    description: '쿠팡 이커머스 플랫폼의 인프라를 설계하고 운영합니다.',
    requirements: ['5년 이상 DevOps 경험', 'AWS 전문가 수준', 'K8s 운영 경험'],
    preferred: ['대규모 트래픽 운영 경험', 'IaC 경험'],
    deadline: '상시채용'
  },
  {
    id: 5,
    title: 'Product Designer',
    company: '당근',
    logo: '당',
    team: 'Product',
    location: '서울 서초',
    type: '정규직',
    experience: '3년 이상',
    salary: '6,000만원 ~ 9,000만원',
    tags: ['Figma', 'UX', 'UI', 'Design System'],
    category: 'Design',
    description: '당근 앱의 사용자 경험을 디자인합니다.',
    requirements: ['프로덕트 디자인 3년 이상', 'Figma 능숙', '포트폴리오 필수'],
    preferred: ['모바일 앱 디자인 경험', '사용자 리서치 경험'],
    deadline: '2026-02-15'
  },
  {
    id: 6,
    title: 'Data Analyst',
    company: '두나무',
    logo: 'D',
    team: 'Data',
    location: '서울 강남',
    type: '정규직',
    experience: '2년 이상',
    salary: '5,500만원 ~ 8,000만원',
    tags: ['SQL', 'Python', 'Tableau', 'BigQuery'],
    category: 'Data',
    description: '업비트 서비스의 데이터 분석 및 인사이트 도출을 담당합니다.',
    requirements: ['SQL 고급 수준', 'Python 분석 능력', '통계 지식'],
    preferred: ['금융/핀테크 도메인 경험', 'AB 테스트 경험'],
    deadline: '2026-03-01'
  },
  {
    id: 7,
    title: 'iOS Developer',
    company: '라인',
    logo: 'L',
    team: 'LINE App',
    location: '판교',
    type: '정규직',
    experience: '3년 이상',
    salary: '7,000만원 ~ 1억',
    tags: ['Swift', 'SwiftUI', 'iOS', 'RxSwift'],
    category: 'Engineering',
    description: '라인 메신저 iOS 앱 개발을 담당합니다.',
    requirements: ['iOS 개발 3년 이상', 'Swift 능숙', 'UIKit/SwiftUI 경험'],
    preferred: ['메신저 앱 개발 경험', '대규모 앱 개발 경험'],
    deadline: '상시채용'
  },
  {
    id: 8,
    title: 'Security Engineer',
    company: '삼성SDS',
    logo: 'S',
    team: 'Security',
    location: '서울 송파',
    type: '정규직',
    experience: '5년 이상',
    salary: '8,000만원 ~ 1.2억',
    tags: ['보안', 'Penetration Testing', 'SIEM', 'SOC'],
    category: 'Security',
    description: '기업 보안 시스템 설계 및 침투 테스트를 수행합니다.',
    requirements: ['보안 5년 이상 경험', '보안 자격증 보유', '침투 테스트 경험'],
    preferred: ['금융권 보안 경험', 'CISSP/CISA 자격'],
    deadline: '2026-02-20'
  }
];

export const CATEGORIES = ['전체', 'Engineering', 'Design', 'Data', 'Security', 'Product', 'Marketing'];
export const EXPERIENCE_LEVELS = ['전체', '신입', '1~3년', '3~5년', '5년 이상', '10년 이상'];
export const LOCATIONS = ['전체', '서울', '판교', '부산', '대전', '원격근무'];
