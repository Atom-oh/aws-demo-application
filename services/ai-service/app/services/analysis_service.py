"""AI analysis service using AgentCore."""

import json
import time
from typing import List, Optional, Dict, Any
from uuid import UUID

from app.core.config import settings
from app.core.bedrock import BedrockClient
from app.models.schemas import (
    ResumeAnalysisResponse,
    JobMatchResponse,
    SkillExtractionResponse,
    SkillCategory,
    ExtractedSkill,
    EducationInfo,
    ExperienceInfo,
    MatchResult,
    AnalysisType,
    AgentMatchResponse,
)
from app.repositories.ai_task_repository import AITaskRepository
from app.services.matching_agent import MatchingAgentService


class AnalysisService:
    """Service for AI-powered analysis using AgentCore."""

    RESUME_ANALYSIS_PROMPT = """Analyze the following resume and extract structured information.

Resume:
{resume_text}

Provide a comprehensive analysis in JSON format including:
1. summary: A brief professional summary (2-3 sentences)
2. skills: List of skills categorized by type (technical, soft, language, certification)
3. experience: List of work experiences with company, role, duration, and key achievements
4. education: List of education entries with institution, degree, field, and year
5. strengths: Key strengths identified
6. areas_for_improvement: Areas that could be improved
7. overall_score: A score from 0-100 based on resume quality

Return valid JSON only.
"""

    JOB_MATCH_PROMPT = """Analyze how well the following resume matches the job description.

Resume:
{resume_text}

Job Description:
{job_description}

Provide a detailed matching analysis in JSON format:
1. overall_match_score: Score from 0-100
2. skill_match: Object with matched_skills, missing_skills, and match_percentage
3. experience_match: Object with relevant_experience, gaps, and match_percentage
4. education_match: Object with meets_requirements, details, and match_percentage
5. recommendations: List of recommendations for the candidate
6. hiring_recommendation: STRONG_MATCH, GOOD_MATCH, PARTIAL_MATCH, or NOT_RECOMMENDED
7. summary: Brief summary of the match analysis

Return valid JSON only.
"""

    SKILL_EXTRACTION_PROMPT = """Extract skills from the following text.

Text:
{text}

Categorize skills into:
- technical: Programming languages, frameworks, tools, technologies
- soft: Communication, leadership, teamwork, etc.
- language: Spoken/written languages
- certification: Professional certifications

Return JSON with a "skills" array, each skill having:
- name: Skill name
- category: One of technical, soft, language, certification
- proficiency: beginner, intermediate, advanced, expert (if determinable)
- confidence: Confidence score 0-1

Return valid JSON only.
"""

    def __init__(self, repository: AITaskRepository):
        self.repository = repository
        self.bedrock = BedrockClient()
        self.model_id = settings.BEDROCK_ANALYSIS_MODEL
        self.matching_agent = MatchingAgentService(repository)
        self.use_agentcore = settings.USE_AGENTCORE

    async def _invoke_model(
        self,
        prompt: str,
        max_tokens: int = 4096,
        temperature: float = 0.3,
    ) -> tuple[str, int]:
        """Invoke Bedrock model for analysis."""
        response, tokens = await self.bedrock.invoke_model(
            prompt=prompt,
            model_id=self.model_id,
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response, tokens

    async def analyze_resume(
        self,
        resume_id: UUID,
        resume_text: str,
        analysis_type: AnalysisType = AnalysisType.FULL,
    ) -> ResumeAnalysisResponse:
        """Analyze a resume using AgentCore."""
        start_time = time.time()

        task = await self.repository.create(
            task_type="resume_analysis",
            source_type="resume",
            source_id=resume_id,
            input_data={
                "resume_id": str(resume_id),
                "analysis_type": analysis_type.value,
            },
        )

        try:
            prompt = self.RESUME_ANALYSIS_PROMPT.format(resume_text=resume_text)
            response_text, tokens_used = await self._invoke_model(prompt)

            # Parse JSON response
            try:
                analysis = json.loads(response_text)
            except json.JSONDecodeError:
                # Try to extract JSON from response
                import re
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    analysis = json.loads(json_match.group())
                else:
                    analysis = {"error": "Failed to parse response"}

            # Extract structured data
            skills = []
            for skill_data in analysis.get("skills", []):
                if isinstance(skill_data, dict):
                    skills.append(
                        ExtractedSkill(
                            name=skill_data.get("name", ""),
                            category=SkillCategory(
                                skill_data.get("category", "technical")
                            ),
                            proficiency=skill_data.get("proficiency"),
                            confidence=skill_data.get("confidence", 0.8),
                        )
                    )

            experience = []
            for exp_data in analysis.get("experience", []):
                if isinstance(exp_data, dict):
                    experience.append(
                        ExperienceInfo(
                            company=exp_data.get("company", ""),
                            role=exp_data.get("role", ""),
                            duration=exp_data.get("duration", ""),
                            achievements=exp_data.get("achievements", []),
                        )
                    )

            education = []
            for edu_data in analysis.get("education", []):
                if isinstance(edu_data, dict):
                    education.append(
                        EducationInfo(
                            institution=edu_data.get("institution", ""),
                            degree=edu_data.get("degree", ""),
                            field=edu_data.get("field", ""),
                            year=edu_data.get("year"),
                        )
                    )

            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data=analysis,
                model_used=self.model_id,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

            return ResumeAnalysisResponse(
                task_id=task.id,
                resume_id=resume_id,
                summary=analysis.get("summary", ""),
                skills=skills,
                experience=experience,
                education=education,
                strengths=analysis.get("strengths", []),
                areas_for_improvement=analysis.get("areas_for_improvement", []),
                overall_score=analysis.get("overall_score", 0),
                model_used=self.model_id,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise

    async def match_resume_to_job(
        self,
        resume_id: UUID,
        job_id: UUID,
        resume_text: str,
        job_description: str,
    ) -> JobMatchResponse:
        """Match a resume against a job description."""
        start_time = time.time()

        task = await self.repository.create(
            task_type="job_match",
            source_type="resume",
            source_id=resume_id,
            input_data={
                "resume_id": str(resume_id),
                "job_id": str(job_id),
            },
        )

        try:
            prompt = self.JOB_MATCH_PROMPT.format(
                resume_text=resume_text,
                job_description=job_description,
            )
            response_text, tokens_used = await self._invoke_model(prompt)

            # Parse JSON response
            try:
                match_data = json.loads(response_text)
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    match_data = json.loads(json_match.group())
                else:
                    match_data = {"error": "Failed to parse response"}

            processing_time_ms = int((time.time() - start_time) * 1000)

            skill_match = match_data.get("skill_match", {})
            experience_match = match_data.get("experience_match", {})
            education_match = match_data.get("education_match", {})

            match_result = MatchResult(
                overall_score=match_data.get("overall_match_score", 0),
                skill_match_percentage=skill_match.get("match_percentage", 0),
                experience_match_percentage=experience_match.get("match_percentage", 0),
                education_match_percentage=education_match.get("match_percentage", 0),
                matched_skills=skill_match.get("matched_skills", []),
                missing_skills=skill_match.get("missing_skills", []),
                hiring_recommendation=match_data.get(
                    "hiring_recommendation", "NOT_RECOMMENDED"
                ),
            )

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data=match_data,
                model_used=self.model_id,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

            return JobMatchResponse(
                task_id=task.id,
                resume_id=resume_id,
                job_id=job_id,
                match_result=match_result,
                recommendations=match_data.get("recommendations", []),
                summary=match_data.get("summary", ""),
                model_used=self.model_id,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise

    async def match_with_agent(
        self,
        resume_id: UUID,
        job_id: UUID,
        resume_text: str,
        job_description: str,
        session_id: Optional[str] = None,
    ) -> AgentMatchResponse:
        """
        Match a resume against a job description using AgentCore.

        Uses the AgentCore-based matching service for intelligent analysis.
        Falls back to standard model invocation if AgentCore is not configured
        or USE_AGENTCORE is False.

        Args:
            resume_id: UUID of the resume
            job_id: UUID of the job
            resume_text: Full text of the resume
            job_description: Full job description
            session_id: Optional session ID for multi-turn conversations

        Returns:
            AgentMatchResponse with detailed matching analysis
        """
        result = await self.matching_agent.match_with_agent(
            resume_text=resume_text,
            job_description=job_description,
            session_id=session_id,
            resume_id=resume_id,
            job_id=job_id,
        )

        return AgentMatchResponse(
            task_id=result["task_id"],
            session_id=result["session_id"],
            resume_id=result["resume_id"],
            job_id=result["job_id"],
            overall_score=result["overall_score"],
            skill_match=result["skill_match"],
            experience_match=result["experience_match"],
            education_match=result["education_match"],
            recommendation=result["recommendation"],
            detailed_analysis=result["detailed_analysis"],
            model_used=result["model_used"],
            tokens_used=result["tokens_used"],
            processing_time_ms=result["processing_time_ms"],
        )

    async def followup_match_question(
        self,
        session_id: str,
        question: str,
    ) -> Dict[str, Any]:
        """
        Ask a follow-up question about a previous match analysis.

        Args:
            session_id: Session ID from previous match_with_agent call
            question: Follow-up question to ask

        Returns:
            Dictionary containing the response and metadata
        """
        return await self.matching_agent.followup_question(
            session_id=session_id,
            question=question,
        )

    async def extract_skills(
        self,
        text: str,
        skill_categories: Optional[List[SkillCategory]] = None,
    ) -> SkillExtractionResponse:
        """Extract skills from text."""
        start_time = time.time()

        task = await self.repository.create(
            task_type="skill_extraction",
            input_data={
                "text_length": len(text),
                "categories": (
                    [c.value for c in skill_categories] if skill_categories else None
                ),
            },
        )

        try:
            prompt = self.SKILL_EXTRACTION_PROMPT.format(text=text)
            response_text, tokens_used = await self._invoke_model(prompt)

            # Parse JSON response
            try:
                result = json.loads(response_text)
            except json.JSONDecodeError:
                import re
                json_match = re.search(r'\{[\s\S]*\}', response_text)
                if json_match:
                    result = json.loads(json_match.group())
                else:
                    result = {"skills": []}

            skills = []
            for skill_data in result.get("skills", []):
                if isinstance(skill_data, dict):
                    skill = ExtractedSkill(
                        name=skill_data.get("name", ""),
                        category=SkillCategory(
                            skill_data.get("category", "technical")
                        ),
                        proficiency=skill_data.get("proficiency"),
                        confidence=skill_data.get("confidence", 0.8),
                    )

                    # Filter by requested categories
                    if skill_categories is None or skill.category in skill_categories:
                        skills.append(skill)

            processing_time_ms = int((time.time() - start_time) * 1000)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={"skill_count": len(skills)},
                model_used=self.model_id,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

            return SkillExtractionResponse(
                task_id=task.id,
                skills=skills,
                skill_count=len(skills),
                model_used=self.model_id,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise
