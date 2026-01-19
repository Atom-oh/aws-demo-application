export interface Company {
  id: number;
  name: string;
  logo: string;
  industry: string;
  size: string;
  location: string;
  description: string;
  benefits: string[];
  techStack: string[];
  openPositions: number;
  avgSalary: string;
  rating: number;
  reviews: number;
}

export const COMPANIES: Company[] = [
  {
    id: 1,
    name: '토스',
    logo: 'T',
    industry: '핀테크',
    size: '1,000명 이상',
    location: '서울 강남',
    description: '금융의 모든 것을 쉽게. 토스는 대한민국 No.1 금융 슈퍼앱입니다.',
    benefits: ['스톡옵션', '자율출퇴근', '원격근무', '점심/저녁 제공', '최신 장비'],
    techStack: ['Kotlin', 'Spring', 'Kafka', 'Kubernetes', 'AWS'],
    openPositions: 23,
    avgSalary: '1억 2천만원',
    rating: 4.5,
    reviews: 342
  },
  {
    id: 2,
    name: '카카오',
    logo: 'K',
    industry: '플랫폼/IT',
    size: '5,000명 이상',
    location: '판교',
    description: '카카오는 기술로 연결하고, 사람을 향합니다.',
    benefits: ['자율출퇴근', '건강검진', '교육비 지원', '사내 카페', '휴양시설'],
    techStack: ['Java', 'Kotlin', 'React', 'Kubernetes', 'MySQL'],
    openPositions: 45,
    avgSalary: '9,500만원',
    rating: 4.2,
    reviews: 1205
  },
  {
    id: 3,
    name: '네이버',
    logo: 'N',
    industry: '플랫폼/IT',
    size: '5,000명 이상',
    location: '판교',
    description: '기술로 연결하는 일상, 네이버와 함께하세요.',
    benefits: ['스톡옵션', '자율출퇴근', '어학교육', '사내 피트니스', '경조사 지원'],
    techStack: ['Java', 'Python', 'TensorFlow', 'Kubernetes', 'OpenSearch'],
    openPositions: 67,
    avgSalary: '1억원',
    rating: 4.3,
    reviews: 2341
  },
  {
    id: 4,
    name: '쿠팡',
    logo: 'C',
    industry: '이커머스',
    size: '10,000명 이상',
    location: '서울',
    description: '로켓배송의 신화, 고객 중심의 혁신을 만들어갑니다.',
    benefits: ['RSU', '점심 제공', '건강검진', '통근버스', '자기계발비'],
    techStack: ['Java', 'AWS', 'Kubernetes', 'Kafka', 'Redis'],
    openPositions: 89,
    avgSalary: '1억 1천만원',
    rating: 3.8,
    reviews: 1876
  },
  {
    id: 5,
    name: '당근',
    logo: '당',
    industry: '플랫폼/IT',
    size: '500~1,000명',
    location: '서울 서초',
    description: '당신 근처의 따뜻한 거래, 당근마켓입니다.',
    benefits: ['스톡옵션', '자율출퇴근', '원격근무', '도서구입비', '컨퍼런스 지원'],
    techStack: ['Ruby', 'Go', 'React Native', 'Kubernetes', 'PostgreSQL'],
    openPositions: 18,
    avgSalary: '8,500만원',
    rating: 4.6,
    reviews: 234
  },
  {
    id: 6,
    name: '두나무',
    logo: 'D',
    industry: '핀테크/블록체인',
    size: '500~1,000명',
    location: '서울 강남',
    description: '업비트를 운영하는 블록체인 핀테크 기업입니다.',
    benefits: ['스톡옵션', '자율출퇴근', '점심 제공', '건강검진', '자기계발비'],
    techStack: ['Java', 'Kotlin', 'React', 'AWS', 'Kafka'],
    openPositions: 12,
    avgSalary: '9,000만원',
    rating: 4.1,
    reviews: 187
  }
];

export const INDUSTRIES = ['전체', '플랫폼/IT', '핀테크', '이커머스', '핀테크/블록체인', '게임', '헬스케어'];
export const COMPANY_SIZES = ['전체', '50명 미만', '50~100명', '100~500명', '500~1,000명', '1,000명 이상', '5,000명 이상'];
