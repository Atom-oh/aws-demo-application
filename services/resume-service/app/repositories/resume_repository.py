"""Repository for resume database operations."""

from typing import Optional
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.resume import Resume, ResumeEducation, ResumeExperience, ResumeSkill
from app.models.schemas import ResumeCreate, ResumeUpdate


class ResumeRepository:
    """Repository for resume CRUD operations."""

    def __init__(self, session: AsyncSession) -> None:
        """Initialize repository with database session."""
        self.session = session

    async def create(self, resume_data: ResumeCreate) -> Resume:
        """Create a new resume with related entities."""
        # Create resume instance
        resume = Resume(
            user_id=resume_data.user_id,
            title=resume_data.title,
            original_file_url=resume_data.original_file_url,
            original_file_name=resume_data.original_file_name,
            file_type=resume_data.file_type,
            is_primary=resume_data.is_primary,
            status="processing",
        )

        # Add experiences
        for exp_data in resume_data.experiences:
            experience = ResumeExperience(
                company_name=exp_data.company_name,
                position=exp_data.position,
                start_date=exp_data.start_date,
                end_date=exp_data.end_date,
                is_current=exp_data.is_current,
                description=exp_data.description,
            )
            resume.experiences.append(experience)

        # Add skills
        for skill_data in resume_data.skills:
            skill = ResumeSkill(
                skill_name=skill_data.skill_name,
                proficiency=skill_data.proficiency,
                years=skill_data.years,
            )
            resume.skills.append(skill)

        # Add educations
        for edu_data in resume_data.educations:
            education = ResumeEducation(
                school_name=edu_data.school_name,
                degree=edu_data.degree,
                major=edu_data.major,
                start_date=edu_data.start_date,
                end_date=edu_data.end_date,
                is_current=edu_data.is_current,
            )
            resume.educations.append(education)

        self.session.add(resume)
        await self.session.flush()
        await self.session.refresh(resume)
        return resume

    async def get_by_id(self, resume_id: UUID) -> Optional[Resume]:
        """Get resume by ID with all relationships."""
        query = (
            select(Resume)
            .options(
                selectinload(Resume.experiences),
                selectinload(Resume.skills),
                selectinload(Resume.educations),
            )
            .where(Resume.id == resume_id)
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()

    async def get_by_user_id(
        self,
        user_id: UUID,
        page: int = 1,
        size: int = 10,
    ) -> tuple[list[Resume], int]:
        """Get paginated resumes by user ID."""
        # Count total
        count_query = select(func.count(Resume.id)).where(Resume.user_id == user_id)
        total_result = await self.session.execute(count_query)
        total = total_result.scalar_one()

        # Get paginated results
        offset = (page - 1) * size
        query = (
            select(Resume)
            .options(
                selectinload(Resume.experiences),
                selectinload(Resume.skills),
                selectinload(Resume.educations),
            )
            .where(Resume.user_id == user_id)
            .order_by(Resume.created_at.desc())
            .offset(offset)
            .limit(size)
        )
        result = await self.session.execute(query)
        resumes = list(result.scalars().all())

        return resumes, total

    async def update(self, resume_id: UUID, update_data: ResumeUpdate) -> Optional[Resume]:
        """Update resume by ID."""
        resume = await self.get_by_id(resume_id)
        if not resume:
            return None

        update_dict = update_data.model_dump(exclude_unset=True)
        for field, value in update_dict.items():
            setattr(resume, field, value)

        await self.session.flush()
        await self.session.refresh(resume)
        return resume

    async def delete(self, resume_id: UUID) -> bool:
        """Delete resume by ID."""
        resume = await self.get_by_id(resume_id)
        if not resume:
            return False

        await self.session.delete(resume)
        await self.session.flush()
        return True

    async def set_primary(self, user_id: UUID, resume_id: UUID) -> Optional[Resume]:
        """Set resume as primary for user, unsetting others."""
        # Unset all primary resumes for user
        query = select(Resume).where(Resume.user_id == user_id, Resume.is_primary == True)  # noqa: E712
        result = await self.session.execute(query)
        for resume in result.scalars().all():
            resume.is_primary = False

        # Set the specified resume as primary
        resume = await self.get_by_id(resume_id)
        if resume and resume.user_id == user_id:
            resume.is_primary = True
            await self.session.flush()
            await self.session.refresh(resume)
            return resume

        return None

    async def get_primary_by_user_id(self, user_id: UUID) -> Optional[Resume]:
        """Get primary resume for user."""
        query = (
            select(Resume)
            .options(
                selectinload(Resume.experiences),
                selectinload(Resume.skills),
                selectinload(Resume.educations),
            )
            .where(Resume.user_id == user_id, Resume.is_primary == True)  # noqa: E712
        )
        result = await self.session.execute(query)
        return result.scalar_one_or_none()
