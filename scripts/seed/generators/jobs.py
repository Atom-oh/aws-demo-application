"""Job posting generator for HireHub mock data."""
import json
import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List, Tuple

from config import DATA_DIR, JOB_STATUS_DISTRIBUTION, RANDOM_SEED


class JobGenerator:
    """Generate realistic job posting data for HireHub."""

    def __init__(self, seed: int = RANDOM_SEED):
        random.seed(seed)
        self._load_data()

    def _load_data(self) -> None:
        """Load reference data from JSON files."""
        with open(DATA_DIR / "job_titles.json", "r", encoding="utf-8") as f:
            self.job_data = json.load(f)
        with open(DATA_DIR / "skills.json", "r", encoding="utf-8") as f:
            self.skills_data = json.load(f)

    def _weighted_choice(self, distribution: dict) -> str:
        """Make a weighted random choice from a distribution."""
        items = list(distribution.keys())
        weights = list(distribution.values())
        return random.choices(items, weights=weights, k=1)[0]

    def _generate_job_description(self, title: str, category: str, skills: List[str]) -> str:
        """Generate a job description."""
        intro_templates = [
            f"저희 팀에서 {title} 포지션을 찾고 있습니다.",
            f"함께 성장할 {title}를 모집합니다.",
            f"혁신적인 프로젝트를 이끌어갈 {title}를 찾습니다.",
        ]
        responsibilities = [
            "서비스 개발 및 운영",
            "코드 리뷰 및 품질 관리",
            "기술 문서 작성",
            "팀원 멘토링",
            "신기술 연구 및 도입",
        ]
        return f"""{random.choice(intro_templates)}

[주요 업무]
- {random.choice(responsibilities)}
- {random.choice(responsibilities)}
- {random.choice(responsibilities)}

[자격 요건]
- {', '.join(skills[:3])} 경험자
- 관련 분야 실무 경험
- 원활한 커뮤니케이션 능력

[우대 사항]
- {', '.join(skills[3:5]) if len(skills) > 3 else '관련 자격증 보유자'}
- 오픈소스 기여 경험
- 스타트업 경험"""

    def _get_salary_range(self, exp_level: dict) -> Tuple[int, int]:
        """Get salary range based on experience level."""
        base_min = exp_level["salary_min"]
        base_max = exp_level["salary_max"]
        # Add some variance
        variance = random.uniform(0.9, 1.1)
        return int(base_min * variance), int(base_max * variance)

    def generate_job(self, company_id: str, company_name: str) -> Dict[str, Any]:
        """Generate a single job posting."""
        categories = self.job_data["categories"]
        category = random.choice(list(categories.keys()))
        category_data = categories[category]

        title = random.choice(category_data["titles"])
        exp_levels = self.job_data["experience_levels"]
        exp_level = random.choice(exp_levels)
        emp_types = self.job_data["employment_types"]
        emp_type = random.choices(
            [t["name"] for t in emp_types],
            weights=[t["weight"] for t in emp_types],
            k=1
        )[0]

        # Select skills from category-specific and general skills
        category_skills = category_data.get("skills", [])
        all_skills = [s["name"] for s in self.skills_data["skills"]]
        selected_skills = list(set(
            random.sample(category_skills, min(3, len(category_skills))) +
            random.sample(all_skills, random.randint(2, 4))
        ))

        salary_min, salary_max = self._get_salary_range(exp_level)
        status = self._weighted_choice(JOB_STATUS_DISTRIBUTION)

        # Generate dates
        posted_date = datetime.now() - timedelta(days=random.randint(1, 90))
        deadline = posted_date + timedelta(days=random.randint(14, 60))

        return {
            "id": str(uuid.uuid4()),
            "company_id": company_id,
            "company_name": company_name,
            "title": title,
            "category": category,
            "description": self._generate_job_description(title, category, selected_skills),
            "required_skills": selected_skills,
            "experience_level": exp_level["name"],
            "min_experience_years": exp_level["min_years"],
            "max_experience_years": exp_level["max_years"],
            "employment_type": emp_type,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_currency": "KRW",
            "salary_unit": "만원/연",
            "location": None,  # Will be set from company
            "remote_available": random.random() < 0.4,  # 40% remote
            "status": status,
            "view_count": random.randint(10, 500) if status == "open" else random.randint(100, 1000),
            "application_count": 0,  # Will be updated later
            "posted_at": posted_date.isoformat(),
            "deadline": deadline.strftime("%Y-%m-%d"),
            "created_at": posted_date.isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

    def generate(self, count: int, companies: List[dict]) -> List[Dict[str, Any]]:
        """Generate multiple job postings."""
        jobs = []
        for i in range(count):
            company = random.choice(companies)
            job = self.generate_job(company["id"], company["name"])
            job["location"] = company["location"]
            jobs.append(job)
        return jobs
