"""Configuration for HireHub mock data generation."""
import os
from pathlib import Path

# Base paths
BASE_DIR = Path(__file__).parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "output"

# Default counts (as per README requirements)
DEFAULT_COUNTS = {
    "users": 500,
    "companies": 50,
    "jobs": 200,
    "resumes": 500,
    "applications": 1000,
}

# User distribution
USER_DISTRIBUTION = {
    "job_seeker": 0.85,  # 85% job seekers
    "company_user": 0.15,  # 15% company users (recruiters)
}

# Experience distribution for job seekers
EXPERIENCE_DISTRIBUTION = {
    "0": 0.15,   # New graduates
    "1-2": 0.25, # Junior
    "3-5": 0.30, # Mid-level
    "5-10": 0.20, # Senior
    "10+": 0.10,  # Lead/Principal
}

# Application status distribution
APPLICATION_STATUS_DISTRIBUTION = {
    "pending": 0.40,
    "reviewing": 0.30,
    "interview": 0.15,
    "offered": 0.10,
    "rejected": 0.05,
}

# Job status distribution
JOB_STATUS_DISTRIBUTION = {
    "open": 0.70,
    "closed": 0.20,
    "draft": 0.10,
}

# Gender distribution for names
GENDER_DISTRIBUTION = {
    "male": 0.55,
    "female": 0.45,
}

# Database connection (for future use - not used in JSON generation)
DATABASE_CONFIG = {
    "host": os.getenv("DB_HOST", "localhost"),
    "port": int(os.getenv("DB_PORT", "5432")),
    "database": os.getenv("DB_NAME", "hirehub"),
    "user": os.getenv("DB_USER", "hirehub"),
    "password": os.getenv("DB_PASSWORD", ""),
}

# Random seed for reproducibility
RANDOM_SEED = 42
