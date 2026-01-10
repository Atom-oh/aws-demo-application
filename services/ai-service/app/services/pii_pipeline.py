"""LangGraph-based PII detection and masking pipeline."""

import json
import logging
from typing import TypedDict, Optional, List, Any

import httpx
from langgraph.graph import StateGraph, END

from app.core.config import settings
from app.models.schemas import PIIEntity, PIIMaskType

logger = logging.getLogger(__name__)


class PIIState(TypedDict):
    """State for the PII processing pipeline."""

    text: str
    detect_types: Optional[List[str]]
    mask_types: Optional[List[str]]
    entities: List[dict]
    masked_text: str
    error: Optional[str]
    retry_count: int
    tokens_used: int
    model_used: str
    operation: str  # "detect" or "mask"


class PIIPipeline:
    """LangGraph-based pipeline for PII detection and masking."""

    SYSTEM_PROMPT = """You are a PII (Personally Identifiable Information) detection and masking assistant.
Your task is to identify and mask sensitive personal information in text.

PII types to detect:
- NAME: Personal names (first name, last name, full name)
- EMAIL: Email addresses
- PHONE: Phone numbers
- SSN: Social Security Numbers
- ADDRESS: Physical addresses
- DOB: Date of birth
- CREDIT_CARD: Credit card numbers
- PASSPORT: Passport numbers
- ID_NUMBER: National ID numbers

When masking, replace the PII with appropriate placeholders like [NAME], [EMAIL], etc.
"""

    DETECT_PROMPT = """Analyze the following text and identify all PII entities.
Return a JSON object with a list of detected entities, each containing:
- type: The type of PII (NAME, EMAIL, PHONE, etc.)
- value: The actual PII value found
- start: Starting character position
- end: Ending character position

Text to analyze:
{text}

Return only valid JSON in this format:
{{"entities": [{{"type": "...", "value": "...", "start": 0, "end": 10}}]}}
"""

    MASK_PROMPT = """Mask all PII in the following text by replacing sensitive information with placeholders.
Replace:
- Names with [NAME]
- Email addresses with [EMAIL]
- Phone numbers with [PHONE]
- SSN with [SSN]
- Addresses with [ADDRESS]
- Dates of birth with [DOB]
- Credit card numbers with [CREDIT_CARD]
- Passport numbers with [PASSPORT]
- ID numbers with [ID_NUMBER]

Text to mask:
{text}

Return only the masked text without any explanation.
"""

    MAX_RETRIES = 3

    def __init__(self):
        self.vllm_url = settings.VLLM_URL
        self.model_name = settings.QWEN3_MODEL
        self._graph = self._build_graph()

    async def _call_vllm(
        self,
        prompt: str,
        max_tokens: int = 2048,
        temperature: float = 0.1,
    ) -> tuple[str, int]:
        """Call vLLM API with QWEN3 model."""
        async with httpx.AsyncClient(timeout=60.0) as client:
            response = await client.post(
                f"{self.vllm_url}/v1/completions",
                json={
                    "model": self.model_name,
                    "prompt": f"{self.SYSTEM_PROMPT}\n\n{prompt}",
                    "max_tokens": max_tokens,
                    "temperature": temperature,
                    "stop": ["</s>"],
                },
            )
            response.raise_for_status()
            result = response.json()

            text = result["choices"][0]["text"].strip()
            tokens_used = result.get("usage", {}).get("total_tokens", 0)

            return text, tokens_used

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph state machine."""
        graph = StateGraph(PIIState)

        # Add nodes
        graph.add_node("detect_pii", self._detect_node)
        graph.add_node("mask_pii", self._mask_node)
        graph.add_node("validate_output", self._validate_node)

        # Set entry point based on operation
        graph.set_conditional_entry_point(
            self._route_entry,
            {
                "detect": "detect_pii",
                "mask": "mask_pii",
            }
        )

        # Add edges
        graph.add_edge("detect_pii", "validate_output")
        graph.add_edge("mask_pii", "validate_output")

        # Add conditional edges for retry logic
        graph.add_conditional_edges(
            "validate_output",
            self._should_retry,
            {
                "retry_detect": "detect_pii",
                "retry_mask": "mask_pii",
                "end": END,
            }
        )

        return graph.compile()

    def _route_entry(self, state: PIIState) -> str:
        """Route to the appropriate entry node based on operation."""
        return state.get("operation", "detect")

    async def _detect_node(self, state: PIIState) -> dict:
        """Node for detecting PII entities in text."""
        logger.info(f"Detect node - retry count: {state.get('retry_count', 0)}")

        try:
            prompt = self.DETECT_PROMPT.format(text=state["text"])
            response_text, tokens_used = await self._call_vllm(prompt)

            # Parse JSON response
            try:
                result = json.loads(response_text)
                entities = result.get("entities", [])

                # Filter by requested types if specified
                detect_types = state.get("detect_types")
                if detect_types:
                    entities = [e for e in entities if e.get("type") in detect_types]

                return {
                    "entities": entities,
                    "error": None,
                    "tokens_used": state.get("tokens_used", 0) + tokens_used,
                    "model_used": self.model_name,
                }
            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(f"Failed to parse detect response: {e}")
                return {
                    "entities": [],
                    "error": f"JSON parse error: {str(e)}",
                    "tokens_used": state.get("tokens_used", 0) + tokens_used,
                    "model_used": self.model_name,
                }

        except httpx.HTTPError as e:
            logger.error(f"HTTP error in detect node: {e}")
            return {
                "error": f"HTTP error: {str(e)}",
                "retry_count": state.get("retry_count", 0) + 1,
            }
        except Exception as e:
            logger.error(f"Unexpected error in detect node: {e}")
            return {
                "error": f"Unexpected error: {str(e)}",
                "retry_count": state.get("retry_count", 0) + 1,
            }

    async def _mask_node(self, state: PIIState) -> dict:
        """Node for masking PII in text."""
        logger.info(f"Mask node - retry count: {state.get('retry_count', 0)}")

        try:
            prompt = self.MASK_PROMPT.format(text=state["text"])
            masked_text, tokens_used = await self._call_vllm(prompt)

            # Basic validation - masked text should not be empty
            if not masked_text or masked_text.isspace():
                return {
                    "error": "Empty masked text returned",
                    "retry_count": state.get("retry_count", 0) + 1,
                }

            return {
                "masked_text": masked_text,
                "error": None,
                "tokens_used": state.get("tokens_used", 0) + tokens_used,
                "model_used": self.model_name,
            }

        except httpx.HTTPError as e:
            logger.error(f"HTTP error in mask node: {e}")
            return {
                "error": f"HTTP error: {str(e)}",
                "retry_count": state.get("retry_count", 0) + 1,
            }
        except Exception as e:
            logger.error(f"Unexpected error in mask node: {e}")
            return {
                "error": f"Unexpected error: {str(e)}",
                "retry_count": state.get("retry_count", 0) + 1,
            }

    async def _validate_node(self, state: PIIState) -> dict:
        """Node for validating the output."""
        logger.info("Validate node")

        operation = state.get("operation", "detect")

        if operation == "detect":
            # For detection, we accept empty results (no PII found)
            if state.get("error") and "JSON parse" in state.get("error", ""):
                # JSON parse errors might be recoverable with retry
                return {"error": state.get("error")}
            return {"error": None}

        elif operation == "mask":
            masked_text = state.get("masked_text", "")
            if not masked_text:
                return {"error": "No masked text produced"}

            # Validation: Check if masked text is reasonable
            original_text = state.get("text", "")
            if len(masked_text) < len(original_text) * 0.1:
                return {"error": "Masked text suspiciously short"}

            return {"error": None}

        return {"error": None}

    def _should_retry(self, state: PIIState) -> str:
        """Determine if we should retry the operation."""
        error = state.get("error")
        retry_count = state.get("retry_count", 0)
        operation = state.get("operation", "detect")

        if error and retry_count < self.MAX_RETRIES:
            logger.info(f"Retrying {operation} - attempt {retry_count + 1}")
            return f"retry_{operation}"

        return "end"

    async def run_detect(
        self,
        text: str,
        detect_types: Optional[List[PIIMaskType]] = None,
    ) -> dict:
        """Run the detection pipeline."""
        initial_state: PIIState = {
            "text": text,
            "detect_types": [t.value for t in detect_types] if detect_types else None,
            "mask_types": None,
            "entities": [],
            "masked_text": "",
            "error": None,
            "retry_count": 0,
            "tokens_used": 0,
            "model_used": self.model_name,
            "operation": "detect",
        }

        result = await self._graph.ainvoke(initial_state)

        # Convert entities to PIIEntity objects
        entities = []
        for e in result.get("entities", []):
            try:
                entities.append(PIIEntity(
                    type=PIIMaskType(e["type"]),
                    value=e["value"],
                    start=e.get("start"),
                    end=e.get("end"),
                ))
            except (KeyError, ValueError) as ex:
                logger.warning(f"Skipping invalid entity: {e}, error: {ex}")

        return {
            "entities": entities,
            "tokens_used": result.get("tokens_used", 0),
            "model_used": result.get("model_used", self.model_name),
            "error": result.get("error"),
        }

    async def run_mask(
        self,
        text: str,
        mask_types: Optional[List[PIIMaskType]] = None,
    ) -> dict:
        """Run the masking pipeline."""
        initial_state: PIIState = {
            "text": text,
            "detect_types": None,
            "mask_types": [t.value for t in mask_types] if mask_types else None,
            "entities": [],
            "masked_text": "",
            "error": None,
            "retry_count": 0,
            "tokens_used": 0,
            "model_used": self.model_name,
            "operation": "mask",
        }

        result = await self._graph.ainvoke(initial_state)

        return {
            "masked_text": result.get("masked_text", ""),
            "tokens_used": result.get("tokens_used", 0),
            "model_used": result.get("model_used", self.model_name),
            "error": result.get("error"),
        }


# Singleton instance
_pipeline_instance: Optional[PIIPipeline] = None


def get_pii_pipeline() -> PIIPipeline:
    """Get or create the PII pipeline singleton."""
    global _pipeline_instance
    if _pipeline_instance is None:
        _pipeline_instance = PIIPipeline()
    return _pipeline_instance
