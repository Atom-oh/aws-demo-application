"""AgentCore-based matching service for intelligent resume-job matching."""

import json
import re
import time
import uuid
from typing import Dict, Any, Optional
from uuid import UUID

from app.core.config import settings
from app.core.bedrock import BedrockClient
from app.repositories.ai_task_repository import AITaskRepository


class AgentMatchResult:
    """Structured result from AgentCore matching."""

    def __init__(
        self,
        overall_score: int = 0,
        skill_match: Dict[str, Any] = None,
        experience_match: Dict[str, Any] = None,
        education_match: Dict[str, Any] = None,
        recommendation: str = "",
        detailed_analysis: str = "",
        raw_response: str = "",
    ):
        self.overall_score = overall_score
        self.skill_match = skill_match or {}
        self.experience_match = experience_match or {}
        self.education_match = education_match or {}
        self.recommendation = recommendation
        self.detailed_analysis = detailed_analysis
        self.raw_response = raw_response

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "overall_score": self.overall_score,
            "skill_match": self.skill_match,
            "experience_match": self.experience_match,
            "education_match": self.education_match,
            "recommendation": self.recommendation,
            "detailed_analysis": self.detailed_analysis,
        }


class SessionManager:
    """Manages session IDs for multi-turn agent conversations."""

    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def create_session(self, context: Optional[Dict[str, Any]] = None) -> str:
        """Create a new session with optional context."""
        session_id = str(uuid.uuid4())
        self._sessions[session_id] = {
            "created_at": time.time(),
            "context": context or {},
            "turn_count": 0,
        }
        return session_id

    def get_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        """Get session data by ID."""
        return self._sessions.get(session_id)

    def update_session(self, session_id: str, **kwargs) -> None:
        """Update session data."""
        if session_id in self._sessions:
            self._sessions[session_id].update(kwargs)
            self._sessions[session_id]["turn_count"] += 1

    def delete_session(self, session_id: str) -> None:
        """Delete a session."""
        self._sessions.pop(session_id, None)

    def cleanup_old_sessions(self, max_age_seconds: int = 3600) -> int:
        """Clean up sessions older than max_age_seconds. Returns count of removed sessions."""
        current_time = time.time()
        expired = [
            sid for sid, data in self._sessions.items()
            if current_time - data["created_at"] > max_age_seconds
        ]
        for sid in expired:
            del self._sessions[sid]
        return len(expired)


class MatchingAgentService:
    """Service for AgentCore-powered resume-job matching."""

    AGENT_MATCH_PROMPT = """You are an expert HR analyst. Analyze the following resume-job match and provide a detailed assessment.

Resume:
{resume_text}

Job Description:
{job_description}

Provide your analysis in the following JSON format:
{{
    "overall_score": <0-100 integer score>,
    "skill_match": {{
        "matched_skills": ["skill1", "skill2", ...],
        "missing_skills": ["skill1", "skill2", ...],
        "match_percentage": <0-100>,
        "analysis": "<brief analysis>"
    }},
    "experience_match": {{
        "relevant_years": <number>,
        "required_years": <number>,
        "match_percentage": <0-100>,
        "gaps": ["gap1", "gap2", ...],
        "strengths": ["strength1", "strength2", ...],
        "analysis": "<brief analysis>"
    }},
    "education_match": {{
        "meets_requirements": <true/false>,
        "match_percentage": <0-100>,
        "analysis": "<brief analysis>"
    }},
    "recommendation": "<STRONG_MATCH | GOOD_MATCH | PARTIAL_MATCH | NOT_RECOMMENDED>",
    "detailed_analysis": "<comprehensive 2-3 sentence analysis>"
}}

Return valid JSON only, no additional text.
"""

    FOLLOWUP_PROMPT = """Based on the previous matching analysis, please answer the following question:

{question}

Provide a concise and helpful response.
"""

    def __init__(self, repository: AITaskRepository):
        """Initialize the matching agent service."""
        self.repository = repository
        self.bedrock = BedrockClient()
        self.session_manager = SessionManager()
        self.agent_id = settings.AGENTCORE_AGENT_ID
        self.agent_alias_id = settings.AGENTCORE_ALIAS_ID

    def _is_agent_configured(self) -> bool:
        """Check if AgentCore is properly configured."""
        return bool(self.agent_id and self.agent_alias_id)

    async def match_with_agent(
        self,
        resume_text: str,
        job_description: str,
        session_id: Optional[str] = None,
        resume_id: Optional[UUID] = None,
        job_id: Optional[UUID] = None,
    ) -> Dict[str, Any]:
        """
        Match resume to job using AgentCore for intelligent analysis.

        Args:
            resume_text: Full text of the resume
            job_description: Full job description
            session_id: Optional session ID for multi-turn conversations
            resume_id: Optional resume UUID for task tracking
            job_id: Optional job UUID for task tracking

        Returns:
            Dictionary containing match results and metadata
        """
        start_time = time.time()

        # Create or get session
        if session_id is None:
            session_id = self.session_manager.create_session({
                "resume_id": str(resume_id) if resume_id else None,
                "job_id": str(job_id) if job_id else None,
            })
        else:
            self.session_manager.update_session(session_id)

        # Create task for tracking
        task = await self.repository.create(
            task_type="agent_match",
            source_type="resume" if resume_id else None,
            source_id=resume_id,
            input_data={
                "resume_id": str(resume_id) if resume_id else None,
                "job_id": str(job_id) if job_id else None,
                "session_id": session_id,
                "use_agentcore": self._is_agent_configured(),
            },
        )

        try:
            # Build the prompt
            prompt = self.AGENT_MATCH_PROMPT.format(
                resume_text=resume_text,
                job_description=job_description,
            )

            # Invoke AgentCore if configured, otherwise fall back to model
            if self._is_agent_configured():
                response = await self.bedrock.invoke_agent(
                    input_text=prompt,
                    session_id=session_id,
                    agent_id=self.agent_id,
                    agent_alias_id=self.agent_alias_id,
                )
                model_used = f"agentcore:{self.agent_id}"
                tokens_used = 0  # AgentCore doesn't return token counts directly
            else:
                response, tokens_used = await self.bedrock.invoke_model(
                    prompt=prompt,
                    model_id=settings.BEDROCK_ANALYSIS_MODEL,
                    max_tokens=4096,
                    temperature=0.3,
                )
                model_used = settings.BEDROCK_ANALYSIS_MODEL

            # Parse the response
            parsed_result = self._parse_agent_response(response)
            processing_time_ms = int((time.time() - start_time) * 1000)

            # Update task
            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data=parsed_result.to_dict(),
                model_used=model_used,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

            return {
                "task_id": task.id,
                "session_id": session_id,
                "resume_id": resume_id,
                "job_id": job_id,
                "overall_score": parsed_result.overall_score,
                "skill_match": parsed_result.skill_match,
                "experience_match": parsed_result.experience_match,
                "education_match": parsed_result.education_match,
                "recommendation": parsed_result.recommendation,
                "detailed_analysis": parsed_result.detailed_analysis,
                "model_used": model_used,
                "tokens_used": tokens_used,
                "processing_time_ms": processing_time_ms,
            }

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise

    async def followup_question(
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
        start_time = time.time()

        session = self.session_manager.get_session(session_id)
        if session is None:
            raise ValueError(f"Session {session_id} not found or expired")

        # Create task for tracking
        task = await self.repository.create(
            task_type="agent_followup",
            input_data={
                "session_id": session_id,
                "question": question,
            },
        )

        try:
            prompt = self.FOLLOWUP_PROMPT.format(question=question)

            if self._is_agent_configured():
                response = await self.bedrock.invoke_agent(
                    input_text=prompt,
                    session_id=session_id,
                    agent_id=self.agent_id,
                    agent_alias_id=self.agent_alias_id,
                )
                model_used = f"agentcore:{self.agent_id}"
                tokens_used = 0
            else:
                response, tokens_used = await self.bedrock.invoke_model(
                    prompt=prompt,
                    model_id=settings.BEDROCK_ANALYSIS_MODEL,
                    max_tokens=2048,
                    temperature=0.3,
                )
                model_used = settings.BEDROCK_ANALYSIS_MODEL

            processing_time_ms = int((time.time() - start_time) * 1000)
            self.session_manager.update_session(session_id)

            await self.repository.update(
                task_id=task.id,
                status="completed",
                output_data={"response": response},
                model_used=model_used,
                tokens_used=tokens_used,
                processing_time_ms=processing_time_ms,
            )

            return {
                "task_id": task.id,
                "session_id": session_id,
                "response": response,
                "model_used": model_used,
                "tokens_used": tokens_used,
                "processing_time_ms": processing_time_ms,
            }

        except Exception as e:
            await self.repository.update(
                task_id=task.id,
                status="failed",
                error_message=str(e),
            )
            raise

    def _parse_agent_response(self, response: str) -> AgentMatchResult:
        """
        Parse the agent response into structured format.

        Args:
            response: Raw response string from agent

        Returns:
            AgentMatchResult with parsed data
        """
        result = AgentMatchResult(raw_response=response)

        try:
            # Try direct JSON parse
            data = json.loads(response)
        except json.JSONDecodeError:
            # Try to extract JSON from response
            json_match = re.search(r'\{[\s\S]*\}', response)
            if json_match:
                try:
                    data = json.loads(json_match.group())
                except json.JSONDecodeError:
                    # Return default result with raw response
                    result.detailed_analysis = response
                    return result
            else:
                result.detailed_analysis = response
                return result

        # Extract structured data
        result.overall_score = self._safe_int(data.get("overall_score", 0), 0, 100)
        result.skill_match = data.get("skill_match", {})
        result.experience_match = data.get("experience_match", {})
        result.education_match = data.get("education_match", {})
        result.recommendation = data.get("recommendation", "NOT_RECOMMENDED")
        result.detailed_analysis = data.get("detailed_analysis", "")

        return result

    def _safe_int(self, value: Any, min_val: int = 0, max_val: int = 100) -> int:
        """Safely convert value to int within bounds."""
        try:
            result = int(value)
            return max(min_val, min(max_val, result))
        except (TypeError, ValueError):
            return min_val

    def end_session(self, session_id: str) -> None:
        """End a matching session and clean up resources."""
        self.session_manager.delete_session(session_id)

    def cleanup_sessions(self, max_age_seconds: int = 3600) -> int:
        """Clean up old sessions. Returns count of removed sessions."""
        return self.session_manager.cleanup_old_sessions(max_age_seconds)
