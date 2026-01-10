"""Application generator for HireHub mock data."""
import random
import uuid
from datetime import datetime, timedelta
from typing import Any, Dict, List

from config import APPLICATION_STATUS_DISTRIBUTION, RANDOM_SEED


class ApplicationGenerator:
    """Generate realistic job application data for HireHub."""

    def __init__(self, seed: int = RANDOM_SEED):
        random.seed(seed)

    def _weighted_choice(self, distribution: dict) -> str:
        """Make a weighted random choice from a distribution."""
        items = list(distribution.keys())
        weights = list(distribution.values())
        return random.choices(items, weights=weights, k=1)[0]

    def _generate_cover_letter(self, job_title: str, user_name: str) -> str:
        """Generate a cover letter."""
        templates = [
            f"안녕하세요, {job_title} 포지션에 지원하는 {user_name}입니다. 저의 경험과 역량이 귀사에 기여할 수 있다고 확신합니다.",
            f"귀사의 {job_title} 채용 공고를 보고 지원하게 되었습니다. 저는 관련 분야에서의 경험을 바탕으로 팀에 가치를 더할 수 있습니다.",
            f"{job_title} 포지션에 큰 관심을 가지고 지원합니다. 제 기술과 열정이 귀사의 성장에 도움이 되길 바랍니다.",
        ]
        return random.choice(templates)

    def _generate_status_history(self, current_status: str, applied_at: datetime) -> List[dict]:
        """Generate status change history."""
        history = [
            {
                "status": "pending",
                "timestamp": applied_at.isoformat(),
                "note": "지원서 접수 완료",
            }
        ]

        status_order = ["pending", "reviewing", "interview", "offered", "rejected"]
        current_index = status_order.index(current_status) if current_status in status_order else 0

        current_time = applied_at
        for i in range(1, current_index + 1):
            current_time += timedelta(days=random.randint(1, 7))
            status = status_order[i]

            notes = {
                "reviewing": "서류 검토 중",
                "interview": "면접 일정 확정",
                "offered": "최종 합격",
                "rejected": "불합격 통보",
            }

            history.append({
                "status": status,
                "timestamp": current_time.isoformat(),
                "note": notes.get(status, ""),
            })

        return history

    def generate_application(
        self,
        job: dict,
        resume: dict,
        user: dict,
    ) -> Dict[str, Any]:
        """Generate a single job application."""
        status = self._weighted_choice(APPLICATION_STATUS_DISTRIBUTION)

        # Application date should be after job posting
        job_posted = datetime.fromisoformat(job["posted_at"].replace("Z", "+00:00").replace("+00:00", ""))
        days_since_posting = (datetime.now() - job_posted).days
        applied_days_ago = random.randint(0, max(1, days_since_posting - 1))
        applied_at = datetime.now() - timedelta(days=applied_days_ago)

        # Calculate match score based on skills overlap
        job_skills = set(job.get("required_skills", []))
        resume_skills = set(resume.get("skills", []))
        skill_overlap = len(job_skills & resume_skills)
        match_score = min(100, int((skill_overlap / max(len(job_skills), 1)) * 100) + random.randint(10, 30))

        return {
            "id": str(uuid.uuid4()),
            "job_id": job["id"],
            "job_title": job["title"],
            "company_id": job["company_id"],
            "company_name": job["company_name"],
            "user_id": user["id"],
            "user_name": user["name"],
            "resume_id": resume["id"],
            "cover_letter": self._generate_cover_letter(job["title"], user["name"]),
            "status": status,
            "status_history": self._generate_status_history(status, applied_at),
            "match_score": match_score,
            "ai_evaluation": {
                "overall_score": match_score,
                "skill_match": min(100, skill_overlap * 20),
                "experience_match": random.randint(50, 100),
                "education_match": random.randint(60, 100),
                "recommendation": "추천" if match_score >= 70 else "검토 필요",
            },
            "recruiter_notes": None,
            "interview_date": (
                (applied_at + timedelta(days=random.randint(7, 21))).strftime("%Y-%m-%d %H:%M")
                if status == "interview" else None
            ),
            "applied_at": applied_at.isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

    def generate(
        self,
        count: int,
        jobs: List[dict],
        resumes: List[dict],
        users: List[dict],
    ) -> list[Dict[str, Any]]:
        """Generate multiple job applications."""
        applications = []
        user_resume_map = {r["user_id"]: r for r in resumes}

        # Filter to only open jobs
        open_jobs = [j for j in jobs if j.get("status") == "open"]
        if not open_jobs:
            open_jobs = jobs

        # Create a set to track unique (user_id, job_id) pairs
        applied_pairs = set()

        attempts = 0
        max_attempts = count * 3

        while len(applications) < count and attempts < max_attempts:
            attempts += 1

            # Select random job and user
            job = random.choice(open_jobs)
            job_seekers = [u for u in users if u.get("user_type") == "job_seeker" and u["id"] in user_resume_map]

            if not job_seekers:
                continue

            user = random.choice(job_seekers)
            pair = (user["id"], job["id"])

            # Skip if already applied
            if pair in applied_pairs:
                continue

            applied_pairs.add(pair)
            resume = user_resume_map[user["id"]]

            application = self.generate_application(job, resume, user)
            applications.append(application)

        # Update job application counts
        job_app_counts = {}
        for app in applications:
            job_id = app["job_id"]
            job_app_counts[job_id] = job_app_counts.get(job_id, 0) + 1

        for job in jobs:
            job["application_count"] = job_app_counts.get(job["id"], 0)

        return applications
