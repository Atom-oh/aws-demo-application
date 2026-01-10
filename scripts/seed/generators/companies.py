"""Company generator for HireHub mock data."""
import json
import random
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List

from config import DATA_DIR, RANDOM_SEED


class CompanyGenerator:
    """Generate realistic company data for HireHub."""

    def __init__(self, seed: int = RANDOM_SEED):
        random.seed(seed)
        self._load_data()

    def _load_data(self) -> None:
        """Load reference data from JSON files."""
        with open(DATA_DIR / "companies_expanded.json", "r", encoding="utf-8") as f:
            self.companies_data = json.load(f)

    def _generate_business_number(self) -> str:
        """Generate a Korean business registration number."""
        return f"{random.randint(100, 999)}-{random.randint(10, 99)}-{random.randint(10000, 99999)}"

    def _generate_website(self, company_name: str) -> str:
        """Generate a company website URL."""
        # Simple URL-safe conversion
        safe_name = company_name.replace(" ", "").replace("/", "").lower()
        domains = [".co.kr", ".com", ".io", ".kr"]
        return f"https://www.{safe_name[:10]}{random.choice(domains)}"

    def generate(self, count: int = 50) -> List[Dict[str, Any]]:
        """Generate companies from expanded data or generate additional ones."""
        companies = []
        base_companies = self.companies_data["companies"]

        for i, company in enumerate(base_companies[:count]):
            company_data = {
                "id": str(uuid.uuid4()),
                "name": company["name"],
                "business_number": company.get("business_number", self._generate_business_number()),
                "industry": company["industry"],
                "company_size": company["company_size"],
                "location": company["location"],
                "description": company.get("description", f"{company['name']}은 혁신적인 기술 솔루션을 제공하는 기업입니다."),
                "website": self._generate_website(company["name"]),
                "founded_year": random.randint(2000, 2023),
                "employee_count": self._size_to_count(company["company_size"]),
                "is_verified": random.random() < 0.8,  # 80% verified
                "created_at": (datetime.now() - timedelta(days=random.randint(30, 730))).isoformat(),
                "updated_at": datetime.now().isoformat(),
            }
            companies.append(company_data)

        return companies

    def _size_to_count(self, size: str) -> int:
        """Convert company size string to approximate employee count."""
        size_map = {
            "1-10": random.randint(1, 10),
            "11-50": random.randint(11, 50),
            "51-200": random.randint(51, 200),
            "201-500": random.randint(201, 500),
            "501-1000": random.randint(501, 1000),
            "1000+": random.randint(1000, 5000),
        }
        return size_map.get(size, random.randint(50, 200))
