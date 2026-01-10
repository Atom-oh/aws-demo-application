"""User generator for HireHub mock data."""
import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

from config import (
    DATA_DIR,
    USER_DISTRIBUTION,
    EXPERIENCE_DISTRIBUTION,
    GENDER_DISTRIBUTION,
    RANDOM_SEED,
)


class UserGenerator:
    """Generate realistic user data for HireHub."""

    def __init__(self, seed: int = RANDOM_SEED):
        random.seed(seed)
        self._load_data()

    def _load_data(self) -> None:
        """Load reference data from JSON files."""
        with open(DATA_DIR / "names.json", "r", encoding="utf-8") as f:
            self.names_data = json.load(f)
        with open(DATA_DIR / "skills.json", "r", encoding="utf-8") as f:
            self.skills_data = json.load(f)

    def _generate_korean_name(self, gender: str) -> Tuple[str, str]:
        """Generate a Korean name (surname, given_name)."""
        surname = random.choice(self.names_data["surnames"])
        if gender == "male":
            given_name = random.choice(self.names_data["given_names_male"])
        else:
            given_name = random.choice(self.names_data["given_names_female"])
        return surname, given_name

    def _generate_email(self, surname: str, given_name: str, index: int) -> str:
        """Generate a realistic email address."""
        domain = random.choice(self.names_data["email_domains"])
        patterns = [
            f"{self._romanize(surname)}{self._romanize(given_name)}",
            f"{self._romanize(given_name)}.{self._romanize(surname)}",
            f"{self._romanize(surname)}{random.randint(1, 99)}",
            f"{self._romanize(given_name)}{random.randint(100, 999)}",
        ]
        username = random.choice(patterns).lower()
        # Add index to ensure uniqueness
        if index > 0:
            username = f"{username}{index}"
        return f"{username}@{domain}"

    def _romanize(self, korean: str) -> str:
        """Simple romanization of Korean names."""
        romanization = {
            "김": "kim", "이": "lee", "박": "park", "최": "choi", "정": "jung",
            "강": "kang", "조": "cho", "윤": "yoon", "장": "jang", "임": "lim",
            "한": "han", "오": "oh", "서": "seo", "신": "shin", "권": "kwon",
            "황": "hwang", "안": "ahn", "송": "song", "류": "ryu", "전": "jeon",
            "홍": "hong", "고": "ko", "문": "moon", "양": "yang", "손": "son",
            "배": "bae", "백": "baek", "허": "heo", "유": "yoo", "남": "nam",
            "심": "shim", "노": "noh", "하": "ha", "곽": "kwak", "성": "sung",
            "차": "cha", "주": "joo", "우": "woo", "구": "koo", "민": "min",
            "진": "jin", "나": "na", "엄": "um", "원": "won", "천": "chun",
            "방": "bang", "공": "kong", "현": "hyun", "함": "ham", "변": "byun",
            # Common given name syllables
            "준": "jun", "민": "min", "서": "seo", "현": "hyun", "지": "ji",
            "우": "woo", "윤": "yoon", "연": "yeon", "수": "su", "하": "ha",
            "도": "do", "예": "ye", "시": "si", "주": "ju", "은": "eun",
            "재": "jae", "성": "sung", "태": "tae", "동": "dong", "상": "sang",
            "호": "ho", "찬": "chan", "빈": "bin", "환": "hwan", "혁": "hyuk",
            "영": "young", "원": "won", "결": "kyul", "안": "an", "린": "rin",
            "율": "yul", "아": "a", "나": "na", "채": "chae", "소": "so",
        }
        result = ""
        for char in korean:
            result += romanization.get(char, char)
        return result

    def _weighted_choice(self, distribution: dict) -> str:
        """Make a weighted random choice from a distribution."""
        items = list(distribution.keys())
        weights = list(distribution.values())
        return random.choices(items, weights=weights, k=1)[0]

    def _generate_experience_years(self) -> int:
        """Generate experience years based on distribution."""
        exp_range = self._weighted_choice(EXPERIENCE_DISTRIBUTION)
        if exp_range == "0":
            return 0
        elif exp_range == "1-2":
            return random.randint(1, 2)
        elif exp_range == "3-5":
            return random.randint(3, 5)
        elif exp_range == "5-10":
            return random.randint(5, 10)
        else:  # 10+
            return random.randint(10, 20)

    def _generate_skills(self, count: int = None) -> List[str]:
        """Generate a random set of skills."""
        if count is None:
            count = random.randint(3, 10)
        all_skills = [s["name"] for s in self.skills_data["skills"]]
        return random.sample(all_skills, min(count, len(all_skills)))

    def _generate_phone(self) -> str:
        """Generate a Korean phone number."""
        return f"010-{random.randint(1000, 9999)}-{random.randint(1000, 9999)}"

    def generate_job_seeker(self, index: int) -> Dict[str, Any]:
        """Generate a single job seeker user."""
        gender = self._weighted_choice(GENDER_DISTRIBUTION)
        surname, given_name = self._generate_korean_name(gender)
        full_name = surname + given_name
        experience_years = self._generate_experience_years()

        # Generate birth date based on experience (assume start working at 23-25)
        current_year = datetime.now().year
        birth_year = current_year - experience_years - random.randint(23, 30)
        birth_date = datetime(birth_year, random.randint(1, 12), random.randint(1, 28))

        return {
            "id": str(uuid.uuid4()),
            "email": self._generate_email(surname, given_name, index),
            "name": full_name,
            "surname": surname,
            "given_name": given_name,
            "phone": self._generate_phone(),
            "user_type": "job_seeker",
            "gender": gender,
            "birth_date": birth_date.strftime("%Y-%m-%d"),
            "experience_years": experience_years,
            "skills": self._generate_skills(),
            "is_active": True,
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

    def generate_company_user(self, index: int, company_id: str) -> Dict[str, Any]:
        """Generate a single company user (recruiter)."""
        gender = self._weighted_choice(GENDER_DISTRIBUTION)
        surname, given_name = self._generate_korean_name(gender)
        full_name = surname + given_name

        return {
            "id": str(uuid.uuid4()),
            "email": self._generate_email(surname, given_name, index + 1000),
            "name": full_name,
            "surname": surname,
            "given_name": given_name,
            "phone": self._generate_phone(),
            "user_type": "company_user",
            "gender": gender,
            "company_id": company_id,
            "role": random.choice(["recruiter", "hr_manager", "hiring_manager"]),
            "is_active": True,
            "created_at": (datetime.now() - timedelta(days=random.randint(1, 365))).isoformat(),
            "updated_at": datetime.now().isoformat(),
        }

    def generate(self, count: int, company_ids: List[str] = None) -> List[Dict[str, Any]]:
        """Generate multiple users."""
        users = []
        job_seeker_count = int(count * USER_DISTRIBUTION["job_seeker"])
        company_user_count = count - job_seeker_count

        # Generate job seekers
        for i in range(job_seeker_count):
            users.append(self.generate_job_seeker(i))

        # Generate company users
        if company_ids:
            for i in range(company_user_count):
                company_id = random.choice(company_ids)
                users.append(self.generate_company_user(i, company_id))

        random.shuffle(users)
        return users
