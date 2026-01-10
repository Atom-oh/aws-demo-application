"""Amazon Bedrock client for embeddings and model invocation."""

import json
from typing import List, Optional, Tuple

import boto3
from botocore.config import Config

from app.core.config import settings


class BedrockClient:
    """Client for Amazon Bedrock services."""

    def __init__(self):
        """Initialize Bedrock client."""
        config = Config(
            region_name=settings.AWS_REGION,
            retries={"max_attempts": 3, "mode": "standard"},
        )

        self.bedrock_runtime = boto3.client(
            "bedrock-runtime",
            config=config,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

        self.bedrock_agent_runtime = boto3.client(
            "bedrock-agent-runtime",
            config=config,
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
        )

    async def generate_embedding(
        self,
        text: str,
        model_id: Optional[str] = None,
    ) -> List[float]:
        """
        Generate embedding vector for text using Bedrock Titan.

        Args:
            text: Text to embed
            model_id: Model ID (defaults to settings.BEDROCK_EMBEDDING_MODEL)

        Returns:
            List of floats representing the embedding vector
        """
        model_id = model_id or settings.BEDROCK_EMBEDDING_MODEL

        body = json.dumps({"inputText": text})

        response = self.bedrock_runtime.invoke_model(
            modelId=model_id,
            body=body,
            contentType="application/json",
            accept="application/json",
        )

        response_body = json.loads(response["body"].read())
        return response_body["embedding"]

    async def invoke_model(
        self,
        prompt: str,
        model_id: Optional[str] = None,
        max_tokens: int = 4096,
        temperature: float = 0.3,
        top_p: float = 0.9,
    ) -> Tuple[str, int]:
        """
        Invoke a Bedrock model for text generation.

        Args:
            prompt: Prompt text
            model_id: Model ID (defaults to settings.BEDROCK_ANALYSIS_MODEL)
            max_tokens: Maximum tokens in response
            temperature: Sampling temperature
            top_p: Top-p sampling parameter

        Returns:
            Tuple of (response_text, tokens_used)
        """
        model_id = model_id or settings.BEDROCK_ANALYSIS_MODEL

        # Format request based on model type
        if "anthropic" in model_id:
            body = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": max_tokens,
                "temperature": temperature,
                "top_p": top_p,
                "messages": [{"role": "user", "content": prompt}],
            }
        elif "amazon" in model_id:
            body = {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": max_tokens,
                    "temperature": temperature,
                    "topP": top_p,
                },
            }
        else:
            # Generic format
            body = {
                "prompt": prompt,
                "max_tokens": max_tokens,
                "temperature": temperature,
            }

        response = self.bedrock_runtime.invoke_model(
            modelId=model_id,
            body=json.dumps(body),
            contentType="application/json",
            accept="application/json",
        )

        response_body = json.loads(response["body"].read())

        # Parse response based on model type
        if "anthropic" in model_id:
            text = response_body["content"][0]["text"]
            tokens = response_body.get("usage", {})
            tokens_used = tokens.get("input_tokens", 0) + tokens.get("output_tokens", 0)
        elif "amazon" in model_id:
            text = response_body["results"][0]["outputText"]
            tokens_used = response_body.get("inputTextTokenCount", 0)
        else:
            text = response_body.get("completion", response_body.get("text", ""))
            tokens_used = 0

        return text, tokens_used

    async def invoke_agent(
        self,
        input_text: str,
        session_id: str,
        agent_id: Optional[str] = None,
        agent_alias_id: Optional[str] = None,
    ) -> str:
        """
        Invoke a Bedrock Agent (AgentCore).

        Args:
            input_text: User input text
            session_id: Session ID for conversation continuity
            agent_id: Agent ID (defaults to settings.AGENTCORE_AGENT_ID)
            agent_alias_id: Agent alias ID (defaults to settings.AGENTCORE_ALIAS_ID)

        Returns:
            Agent response text
        """
        agent_id = agent_id or settings.AGENTCORE_AGENT_ID
        agent_alias_id = agent_alias_id or settings.AGENTCORE_ALIAS_ID

        if not agent_id or not agent_alias_id:
            raise ValueError("AgentCore agent_id and agent_alias_id must be configured")

        response = self.bedrock_agent_runtime.invoke_agent(
            agentId=agent_id,
            agentAliasId=agent_alias_id,
            sessionId=session_id,
            inputText=input_text,
        )

        # Stream response
        completion = ""
        for event in response["completion"]:
            if "chunk" in event:
                chunk = event["chunk"]
                completion += chunk["bytes"].decode("utf-8")

        return completion

    async def retrieve_and_generate(
        self,
        input_text: str,
        knowledge_base_id: str,
        model_arn: Optional[str] = None,
    ) -> str:
        """
        Retrieve from knowledge base and generate response (RAG).

        Args:
            input_text: Query text
            knowledge_base_id: Knowledge base ID
            model_arn: Model ARN for generation

        Returns:
            Generated response text
        """
        model_arn = (
            model_arn
            or f"arn:aws:bedrock:{settings.AWS_REGION}::foundation-model/{settings.BEDROCK_ANALYSIS_MODEL}"
        )

        response = self.bedrock_agent_runtime.retrieve_and_generate(
            input={"text": input_text},
            retrieveAndGenerateConfiguration={
                "type": "KNOWLEDGE_BASE",
                "knowledgeBaseConfiguration": {
                    "knowledgeBaseId": knowledge_base_id,
                    "modelArn": model_arn,
                },
            },
        )

        return response["output"]["text"]
