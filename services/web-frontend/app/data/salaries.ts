export interface SalaryData {
  position: string;
  category: string;
  experience: string;
  avgSalary: number;
  minSalary: number;
  maxSalary: number;
  samples: number;
}

export const SALARY_DATA: SalaryData[] = [
  { position: 'Frontend Developer', category: 'Engineering', experience: '신입', avgSalary: 4500, minSalary: 3800, maxSalary: 5500, samples: 234 },
  { position: 'Frontend Developer', category: 'Engineering', experience: '3~5년', avgSalary: 7000, minSalary: 5500, maxSalary: 9000, samples: 456 },
  { position: 'Frontend Developer', category: 'Engineering', experience: '5~10년', avgSalary: 9500, minSalary: 7500, maxSalary: 12000, samples: 312 },
  { position: 'Backend Developer', category: 'Engineering', experience: '신입', avgSalary: 4800, minSalary: 4000, maxSalary: 5800, samples: 289 },
  { position: 'Backend Developer', category: 'Engineering', experience: '3~5년', avgSalary: 7500, minSalary: 6000, maxSalary: 9500, samples: 523 },
  { position: 'Backend Developer', category: 'Engineering', experience: '5~10년', avgSalary: 10500, minSalary: 8000, maxSalary: 15000, samples: 387 },
  { position: 'DevOps Engineer', category: 'Engineering', experience: '신입', avgSalary: 5000, minSalary: 4200, maxSalary: 6000, samples: 145 },
  { position: 'DevOps Engineer', category: 'Engineering', experience: '3~5년', avgSalary: 8000, minSalary: 6500, maxSalary: 10000, samples: 234 },
  { position: 'DevOps Engineer', category: 'Engineering', experience: '5~10년', avgSalary: 11000, minSalary: 8500, maxSalary: 15000, samples: 178 },
  { position: 'AI/ML Engineer', category: 'Engineering', experience: '신입', avgSalary: 5500, minSalary: 4500, maxSalary: 7000, samples: 123 },
  { position: 'AI/ML Engineer', category: 'Engineering', experience: '3~5년', avgSalary: 9000, minSalary: 7000, maxSalary: 12000, samples: 198 },
  { position: 'AI/ML Engineer', category: 'Engineering', experience: '5~10년', avgSalary: 13000, minSalary: 10000, maxSalary: 18000, samples: 145 },
  { position: 'Data Analyst', category: 'Data', experience: '신입', avgSalary: 4200, minSalary: 3500, maxSalary: 5200, samples: 167 },
  { position: 'Data Analyst', category: 'Data', experience: '3~5년', avgSalary: 6500, minSalary: 5000, maxSalary: 8500, samples: 234 },
  { position: 'Product Designer', category: 'Design', experience: '신입', avgSalary: 4000, minSalary: 3200, maxSalary: 5000, samples: 189 },
  { position: 'Product Designer', category: 'Design', experience: '3~5년', avgSalary: 6000, minSalary: 4800, maxSalary: 8000, samples: 267 },
  { position: 'Product Manager', category: 'Product', experience: '3~5년', avgSalary: 7000, minSalary: 5500, maxSalary: 9000, samples: 198 },
  { position: 'Product Manager', category: 'Product', experience: '5~10년', avgSalary: 10000, minSalary: 7500, maxSalary: 14000, samples: 156 },
];

export const POSITIONS = ['전체', 'Frontend Developer', 'Backend Developer', 'DevOps Engineer', 'AI/ML Engineer', 'Data Analyst', 'Product Designer', 'Product Manager'];
export const EXPERIENCE_LEVELS = ['전체', '신입', '3~5년', '5~10년', '10년 이상'];
