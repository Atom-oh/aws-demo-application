#!/usr/bin/env python3
"""
HireHub Mock Data Generator

Generates realistic mock data for the HireHub recruitment platform demo.

Usage:
    python seed.py --all              # Generate all data with default counts
    python seed.py --users 500        # Generate only users
    python seed.py --jobs 200         # Generate only jobs
    python seed.py --reset            # Clear output and regenerate all
    python seed.py --output ./custom  # Custom output directory
"""
import argparse
import json
import os
import shutil
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from config import DEFAULT_COUNTS, OUTPUT_DIR
from generators import (
    ApplicationGenerator,
    CompanyGenerator,
    JobGenerator,
    ResumeGenerator,
    UserGenerator,
)


def ensure_output_dir(output_dir: Path, reset: bool = False) -> None:
    """Ensure output directory exists, optionally clearing it first."""
    if reset and output_dir.exists():
        shutil.rmtree(output_dir)
        print(f"Cleared existing output directory: {output_dir}")

    output_dir.mkdir(parents=True, exist_ok=True)


def save_json(data: Union[List, Dict], filepath: Path) -> None:
    """Save data to JSON file with proper formatting."""
    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Saved {filepath.name}: {len(data) if isinstance(data, list) else 'object'} items")


def generate_all(
    output_dir: Path,
    user_count: int = None,
    company_count: int = None,
    job_count: int = None,
    resume_count: int = None,
    application_count: int = None,
) -> dict:
    """Generate all mock data."""
    counts = {
        "users": user_count or DEFAULT_COUNTS["users"],
        "companies": company_count or DEFAULT_COUNTS["companies"],
        "jobs": job_count or DEFAULT_COUNTS["jobs"],
        "resumes": resume_count or DEFAULT_COUNTS["resumes"],
        "applications": application_count or DEFAULT_COUNTS["applications"],
    }

    print(f"\nGenerating mock data with counts:")
    for key, value in counts.items():
        print(f"  - {key}: {value}")
    print()

    # Step 1: Generate companies
    print("Step 1/5: Generating companies...")
    company_gen = CompanyGenerator()
    companies = company_gen.generate(counts["companies"])
    save_json(companies, output_dir / "companies.json")

    # Step 2: Generate users
    print("Step 2/5: Generating users...")
    user_gen = UserGenerator()
    company_ids = [c["id"] for c in companies]
    users = user_gen.generate(counts["users"], company_ids)
    save_json(users, output_dir / "users.json")

    # Step 3: Generate jobs
    print("Step 3/5: Generating jobs...")
    job_gen = JobGenerator()
    jobs = job_gen.generate(counts["jobs"], companies)
    save_json(jobs, output_dir / "jobs.json")

    # Step 4: Generate resumes
    print("Step 4/5: Generating resumes...")
    resume_gen = ResumeGenerator()
    resumes = resume_gen.generate(users)
    # Limit to configured count
    resumes = resumes[:counts["resumes"]]
    save_json(resumes, output_dir / "resumes.json")

    # Step 5: Generate applications
    print("Step 5/5: Generating applications...")
    app_gen = ApplicationGenerator()
    applications = app_gen.generate(counts["applications"], jobs, resumes, users)
    save_json(applications, output_dir / "applications.json")

    # Update jobs with application counts
    save_json(jobs, output_dir / "jobs.json")

    # Generate summary
    summary = {
        "generated_at": datetime.now().isoformat(),
        "counts": {
            "companies": len(companies),
            "users": len(users),
            "job_seekers": len([u for u in users if u["user_type"] == "job_seeker"]),
            "company_users": len([u for u in users if u["user_type"] == "company_user"]),
            "jobs": len(jobs),
            "jobs_open": len([j for j in jobs if j["status"] == "open"]),
            "jobs_closed": len([j for j in jobs if j["status"] == "closed"]),
            "jobs_draft": len([j for j in jobs if j["status"] == "draft"]),
            "resumes": len(resumes),
            "applications": len(applications),
            "applications_by_status": {
                status: len([a for a in applications if a["status"] == status])
                for status in ["pending", "reviewing", "interview", "offered", "rejected"]
            },
        },
    }
    save_json(summary, output_dir / "summary.json")

    return summary


def generate_single(generator_type: str, count: int, output_dir: Path, **kwargs) -> None:
    """Generate a single type of data."""
    ensure_output_dir(output_dir)

    if generator_type == "companies":
        gen = CompanyGenerator()
        data = gen.generate(count)
        save_json(data, output_dir / "companies.json")

    elif generator_type == "users":
        gen = UserGenerator()
        # Need company IDs for company users
        company_file = output_dir / "companies.json"
        company_ids = []
        if company_file.exists():
            with open(company_file, "r", encoding="utf-8") as f:
                companies = json.load(f)
                company_ids = [c["id"] for c in companies]
        data = gen.generate(count, company_ids)
        save_json(data, output_dir / "users.json")

    elif generator_type == "jobs":
        gen = JobGenerator()
        company_file = output_dir / "companies.json"
        if not company_file.exists():
            print("Error: companies.json required. Generate companies first.")
            return
        with open(company_file, "r", encoding="utf-8") as f:
            companies = json.load(f)
        data = gen.generate(count, companies)
        save_json(data, output_dir / "jobs.json")

    elif generator_type == "resumes":
        gen = ResumeGenerator()
        user_file = output_dir / "users.json"
        if not user_file.exists():
            print("Error: users.json required. Generate users first.")
            return
        with open(user_file, "r", encoding="utf-8") as f:
            users = json.load(f)
        data = gen.generate(users)[:count]
        save_json(data, output_dir / "resumes.json")

    elif generator_type == "applications":
        gen = ApplicationGenerator()
        required_files = ["jobs.json", "resumes.json", "users.json"]
        for fname in required_files:
            if not (output_dir / fname).exists():
                print(f"Error: {fname} required. Generate {fname.replace('.json', '')} first.")
                return

        with open(output_dir / "jobs.json", "r", encoding="utf-8") as f:
            jobs = json.load(f)
        with open(output_dir / "resumes.json", "r", encoding="utf-8") as f:
            resumes = json.load(f)
        with open(output_dir / "users.json", "r", encoding="utf-8") as f:
            users = json.load(f)

        data = gen.generate(count, jobs, resumes, users)
        save_json(data, output_dir / "applications.json")
        save_json(jobs, output_dir / "jobs.json")  # Update with counts


def main():
    parser = argparse.ArgumentParser(
        description="HireHub Mock Data Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
    python seed.py --all                 Generate all data with defaults
    python seed.py --all --users 1000    Generate all with 1000 users
    python seed.py --users 500           Generate only 500 users
    python seed.py --reset --all         Clear and regenerate everything
        """,
    )

    parser.add_argument(
        "--all",
        action="store_true",
        help="Generate all data types",
    )
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Clear existing output before generating",
    )
    parser.add_argument(
        "--output",
        type=str,
        default=str(OUTPUT_DIR),
        help=f"Output directory (default: {OUTPUT_DIR})",
    )
    parser.add_argument(
        "--users",
        type=int,
        help=f"Number of users to generate (default: {DEFAULT_COUNTS['users']})",
    )
    parser.add_argument(
        "--companies",
        type=int,
        help=f"Number of companies to generate (default: {DEFAULT_COUNTS['companies']})",
    )
    parser.add_argument(
        "--jobs",
        type=int,
        help=f"Number of jobs to generate (default: {DEFAULT_COUNTS['jobs']})",
    )
    parser.add_argument(
        "--resumes",
        type=int,
        help=f"Number of resumes to generate (default: {DEFAULT_COUNTS['resumes']})",
    )
    parser.add_argument(
        "--applications",
        type=int,
        help=f"Number of applications to generate (default: {DEFAULT_COUNTS['applications']})",
    )

    args = parser.parse_args()
    output_dir = Path(args.output)

    # Determine what to generate
    single_generators = {
        "users": args.users,
        "companies": args.companies,
        "jobs": args.jobs,
        "resumes": args.resumes,
        "applications": args.applications,
    }

    # Check if any single generator is specified without --all
    specified_singles = {k: v for k, v in single_generators.items() if v is not None}

    if args.all or not specified_singles:
        # Generate all data
        if not args.all and not specified_singles:
            print("No options specified. Use --all to generate all data or specify individual counts.")
            parser.print_help()
            return

        ensure_output_dir(output_dir, args.reset)
        summary = generate_all(
            output_dir,
            user_count=args.users,
            company_count=args.companies,
            job_count=args.jobs,
            resume_count=args.resumes,
            application_count=args.applications,
        )

        print("\n" + "=" * 50)
        print("Generation Complete!")
        print("=" * 50)
        print(f"\nOutput directory: {output_dir.absolute()}")
        print("\nGenerated counts:")
        for key, value in summary["counts"].items():
            if isinstance(value, dict):
                print(f"  {key}:")
                for k, v in value.items():
                    print(f"    - {k}: {v}")
            else:
                print(f"  - {key}: {value}")

    else:
        # Generate single type
        ensure_output_dir(output_dir, args.reset)
        for gen_type, count in specified_singles.items():
            print(f"\nGenerating {count} {gen_type}...")
            generate_single(gen_type, count, output_dir)

    print("\nDone!")


if __name__ == "__main__":
    main()
