"""Resume generator for HireHub mock data."""
import json
import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List

from config import DATA_DIR, RANDOM_SEED


class ResumeGenerator:
    """Generate realistic resume data for HireHub."""

    def __init__(self, seed: int = RANDOM_SEED):
        random.seed(seed)
        self._load_data()

    def _load_data(self) -> None:
        """Load reference data from JSON files."""
        with open(DATA_DIR / "universities.json", "r", encoding="utf-8") as f:
            self.uni_data = json.load(f)
        with open(DATA_DIR / "skills.json", "r", encoding="utf-8") as f:
            self.skills_data = json.load(f)
        with open(DATA_DIR / "companies_expanded.json", "r", encoding="utf-8") as f:
            self.companies_data = json.load(f)
        with open(DATA_DIR / "job_titles.json", "r", encoding="utf-8") as f:
            self.job_data = json.load(f)

    def _generate_education(self, graduation_year: int) -> List[dict]:
        """Generate education history."""
        education = []
        uni = random.choice(self.uni_data["universities"])

        # Pick a major category and specific major
        major_category = random.choice(list(self.uni_data["majors"].keys()))
        major = random.choice(self.uni_data["majors"][major_category])

        # Degree based on weights
        degrees = self.uni_data["degrees"]
        degree = random.choices(
            [d["name"] for d in degrees],
            weights=[d["weight"] for d in degrees],
            k=1
        )[0]

        entry_year = graduation_year - (4 if degree == "학사" else 6 if degree == "석사" else 10)

        education.append({
            "school": uni["name"],
            "degree": degree,
            "major": major,
            "location": uni["location"],
            "start_date": f"{entry_year}-03",
            "end_date": f"{graduation_year}-02",
            "gpa": round(random.uniform(3.0, 4.5), 2) if random.random() < 0.7 else None,
            "max_gpa": 4.5,
        })

        return education

    def _generate_work_experience(self, years: int, current_year: int) -> List[dict]:
        """Generate work experience history."""
        if years == 0:
            return []

        experiences = []
        companies = self.companies_data["companies"]
        categories = list(self.job_data["categories"].keys())

        remaining_years = years
        current_end_year = current_year

        while remaining_years > 0 and len(experiences) < 5:
            duration = min(random.randint(1, 4), remaining_years)
            company = random.choice(companies)
            category = random.choice(categories)
            title = random.choice(self.job_data["categories"][category]["titles"])

            start_year = current_end_year - duration

            experiences.append({
                "company": company["name"],
                "title": title,
                "location": company["location"],
                "start_date": f"{start_year}-{random.randint(1, 12):02d}",
                "end_date": f"{current_end_year}-{random.randint(1, 12):02d}" if len(experiences) > 0 else None,
                "is_current": len(experiences) == 0,
                "description": f"{title}로서 {category} 관련 업무 수행",
                "achievements": [
                    "프로젝트 성공적 완료",
                    "팀 협업 및 코드 리뷰",
                    "서비스 성능 개선",
                ][:random.randint(1, 3)],
            })

            current_end_year = start_year - 1
            remaining_years -= duration

        return experiences

    def _generate_projects(self, skills: List[str]) -> List[dict]:
        """Generate project history."""
        project_templates = [
            ("개인 포트폴리오 웹사이트", "개인 프로젝트로 포트폴리오 웹사이트 개발"),
            ("사내 업무 자동화 도구", "반복 업무 자동화를 위한 도구 개발"),
            ("오픈소스 기여", "오픈소스 프로젝트에 기능 추가 및 버그 수정"),
            ("모바일 앱 개발", "크로스 플랫폼 모바일 앱 개발"),
            ("데이터 분석 프로젝트", "비즈니스 인사이트 도출을 위한 데이터 분석"),
            ("API 서버 개발", "RESTful API 서버 설계 및 개발"),
            ("CI/CD 파이프라인 구축", "자동화된 배포 파이프라인 구축"),
        ]

        num_projects = random.randint(0, 3)
        projects = []

        for _ in range(num_projects):
            template = random.choice(project_templates)
            project_skills = random.sample(skills, min(3, len(skills)))

            projects.append({
                "name": template[0],
                "description": template[1],
                "skills_used": project_skills,
                "url": f"https://github.com/user/project-{random.randint(1, 100)}" if random.random() < 0.5 else None,
                "start_date": f"{random.randint(2020, 2024)}-{random.randint(1, 12):02d}",
                "end_date": f"{random.randint(2021, 2024)}-{random.randint(1, 12):02d}",
            })

        return projects

    def _generate_certifications(self) -> List[dict]:
        """Generate certifications."""
        cert_options = [
            ("정보처리기사", "한국산업인력공단"),
            ("SQLD", "한국데이터산업진흥원"),
            ("AWS Solutions Architect", "Amazon Web Services"),
            ("AWS Developer Associate", "Amazon Web Services"),
            ("CKA (Certified Kubernetes Administrator)", "CNCF"),
            ("CKAD (Certified Kubernetes Application Developer)", "CNCF"),
            ("Google Cloud Professional", "Google"),
            ("Azure Administrator", "Microsoft"),
            ("TOEIC 900+", "ETS"),
            ("OPIC IH", "ACTFL"),
        ]

        num_certs = random.choices([0, 1, 2, 3], weights=[0.3, 0.4, 0.2, 0.1], k=1)[0]
        selected = random.sample(cert_options, min(num_certs, len(cert_options)))

        return [
            {
                "name": cert[0],
                "issuer": cert[1],
                "date": f"{random.randint(2019, 2024)}-{random.randint(1, 12):02d}",
            }
            for cert in selected
        ]

    def generate_resume(self, user: dict) -> Dict[str, Any]:
        """Generate a resume for a user."""
        current_year = datetime.now().year
        exp_years = user.get("experience_years", 0)

        # Calculate graduation year based on experience
        graduation_year = current_year - exp_years - random.randint(0, 2)

        return {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "user_name": user["name"],
            "email": user["email"],
            "phone": user["phone"],
            "title": f"{user['name']}의 이력서",
            "summary": f"{exp_years}년차 개발자로서 다양한 프로젝트 경험을 보유하고 있습니다." if exp_years > 0 else "열정 넘치는 신입 개발자입니다.",
            "skills": user.get("skills", []),
            "education": self._generate_education(graduation_year),
            "work_experience": self._generate_work_experience(exp_years, current_year),
            "projects": self._generate_projects(user.get("skills", [])),
            "certifications": self._generate_certifications(),
            "desired_salary_min": 4000 + (exp_years * 500),
            "desired_salary_max": 5000 + (exp_years * 800),
            "desired_locations": random.sample(["서울", "경기", "인천", "부산", "대전", "대구"], random.randint(1, 3)),
            "is_public": random.random() < 0.7,  # 70% public
            "view_count": random.randint(0, 100),
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 180))).isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

    def generate(self, users: List[dict]) -> list[Dict[str, Any]]:
        """Generate resumes for job seeker users."""
        job_seekers = [u for u in users if u.get("user_type") == "job_seeker"]
        return [self.generate_resume(user) for user in job_seekers]
