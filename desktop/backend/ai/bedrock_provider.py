"""
AWS Bedrock AI provider.
Supports Claude 3.5, Llama 3, Mistral, and other models via AWS Bedrock.
"""
from typing import List
import time
import logging
import json
import boto3
from botocore.exceptions import ClientError

from ai.base import AIProviderBase, ChatRequest, ChatResponse, Message

logger = logging.getLogger(__name__)


class BedrockProvider(AIProviderBase):
    """
    AWS Bedrock provider.
    Supports multiple foundation models through a single API.
    """

    # Model pricing per 1M tokens (AWS Bedrock pricing)
    PRICING = {
        # Claude 3.5 Sonnet
        "anthropic.claude-3-5-sonnet-20241022-v2:0": {"input": 3.00, "output": 15.00},
        "anthropic.claude-3-5-sonnet-20240620-v1:0": {"input": 3.00, "output": 15.00},

        # Claude 3 Opus
        "anthropic.claude-3-opus-20240229-v1:0": {"input": 15.00, "output": 75.00},

        # Claude 3 Sonnet
        "anthropic.claude-3-sonnet-20240229-v1:0": {"input": 3.00, "output": 15.00},

        # Claude 3 Haiku
        "anthropic.claude-3-haiku-20240307-v1:0": {"input": 0.25, "output": 1.25},

        # Meta Llama 3
        "meta.llama3-70b-instruct-v1:0": {"input": 0.99, "output": 0.99},
        "meta.llama3-8b-instruct-v1:0": {"input": 0.30, "output": 0.30},

        # Mistral
        "mistral.mistral-large-2402-v1:0": {"input": 4.00, "output": 12.00},
        "mistral.mistral-7b-instruct-v0:2": {"input": 0.15, "output": 0.20},
    }

    def __init__(self, access_key: str = None, secret_key: str = None, region: str = "us-east-1"):
        """
        Initialize Bedrock provider.

        Args:
            access_key: AWS Access Key ID (optional - uses env/IAM if not provided)
            secret_key: AWS Secret Access Key (optional - uses env/IAM if not provided)
            region: AWS region (default: us-east-1)
        """
        super().__init__(api_key=access_key or "bedrock", provider_name="bedrock")
        self.region = region

        # Initialize boto3 client
        try:
            if access_key and secret_key:
                self.client = boto3.client(
                    service_name='bedrock-runtime',
                    region_name=region,
                    aws_access_key_id=access_key,
                    aws_secret_access_key=secret_key
                )
            else:
                # Use default credentials (env vars, IAM role, etc.)
                self.client = boto3.client(
                    service_name='bedrock-runtime',
                    region_name=region
                )

            logger.info(f"✓ Bedrock client initialized (region: {region})")
        except Exception as e:
            logger.warning(f"Bedrock client initialization failed: {e}")
            logger.warning("Provider will be created but API calls will fail until credentials are configured")
            self.client = None

        self.default_model = "anthropic.claude-3-5-sonnet-20241022-v2:0"

    def chat(self, request: ChatRequest) -> ChatResponse:
        """
        Send chat completion request to Bedrock.

        Args:
            request: ChatRequest with messages and parameters

        Returns:
            ChatResponse with AI response and usage data
        """
        if not self.client:
            raise RuntimeError(
                "Bedrock client not initialized. Please configure AWS credentials:\n"
                "1. Set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables\n"
                "2. Or provide credentials when creating BedrockProvider\n"
                "3. Or use IAM role (if running on AWS)"
            )

        start_time = time.time()
        model = request.model or self.default_model

        try:
            # Convert messages to Bedrock format
            # Different models have different formats, we'll use Anthropic format for Claude models
            if model.startswith("anthropic.claude"):
                body = self._format_anthropic_request(request, model)
            elif model.startswith("meta.llama"):
                body = self._format_llama_request(request, model)
            elif model.startswith("mistral"):
                body = self._format_mistral_request(request, model)
            else:
                raise ValueError(f"Unsupported model: {model}")

            # Make API request
            response = self.client.invoke_model(
                modelId=model,
                body=json.dumps(body)
            )

            # Parse response
            response_body = json.loads(response['body'].read())

            # Extract data based on model type
            if model.startswith("anthropic.claude"):
                content, tokens_prompt, tokens_completion = self._parse_anthropic_response(response_body)
            elif model.startswith("meta.llama"):
                content, tokens_prompt, tokens_completion = self._parse_llama_response(response_body)
            elif model.startswith("mistral"):
                content, tokens_prompt, tokens_completion = self._parse_mistral_response(response_body)

            tokens_total = tokens_prompt + tokens_completion

            # Calculate metrics
            latency_ms = self._measure_latency(start_time)
            cost_usd = self.calculate_cost(tokens_prompt, tokens_completion, model)

            return ChatResponse(
                content=content,
                model=model,
                provider=self.provider_name,
                tokens_prompt=tokens_prompt,
                tokens_completion=tokens_completion,
                tokens_total=tokens_total,
                cost_usd=cost_usd,
                latency_ms=latency_ms,
                finish_reason="stop",
                request_id=response.get('ResponseMetadata', {}).get('RequestId'),
            )

        except ClientError as e:
            error_code = e.response['Error']['Code']
            error_message = e.response['Error']['Message']
            logger.error(f"Bedrock API error: {error_code} - {error_message}")

            # Provide user-friendly error messages
            if error_code == 'AccessDeniedException':
                raise RuntimeError(
                    "AWS credentials are invalid or don't have permission to use Bedrock. "
                    "Please check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY."
                )
            elif error_code == 'ResourceNotFoundException':
                raise RuntimeError(
                    f"Model '{model}' not found or not enabled in your AWS account. "
                    "Please enable the model in AWS Bedrock console."
                )
            elif error_code == 'ThrottlingException':
                raise RuntimeError("AWS Bedrock rate limit exceeded. Please try again later.")
            elif error_code == 'ModelNotReadyException':
                raise RuntimeError(f"Model '{model}' is not ready. Please try again in a few moments.")
            else:
                raise RuntimeError(f"Bedrock API error: {error_code} - {error_message}")

        except Exception as e:
            logger.error(f"Unexpected error in Bedrock provider: {e}")
            raise RuntimeError(f"Bedrock provider error: {str(e)}")

    def _format_anthropic_request(self, request: ChatRequest, model: str) -> dict:
        """Format request for Anthropic Claude models"""
        messages = []
        system_prompt = None

        for msg in request.messages:
            if msg.role == "system":
                system_prompt = msg.content
            else:
                messages.append({
                    "role": msg.role,
                    "content": msg.content
                })

        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "messages": messages,
            "max_tokens": request.max_tokens or 4096,
            "temperature": request.temperature,
        }

        if system_prompt:
            body["system"] = system_prompt

        return body

    def _format_llama_request(self, request: ChatRequest, model: str) -> dict:
        """Format request for Meta Llama models"""
        # Llama uses a simpler format
        prompt = ""
        for msg in request.messages:
            if msg.role == "system":
                prompt += f"<<SYS>>\n{msg.content}\n<</SYS>>\n\n"
            elif msg.role == "user":
                prompt += f"[INST] {msg.content} [/INST]\n"
            elif msg.role == "assistant":
                prompt += f"{msg.content}\n"

        return {
            "prompt": prompt,
            "max_gen_len": request.max_tokens or 2048,
            "temperature": request.temperature,
        }

    def _format_mistral_request(self, request: ChatRequest, model: str) -> dict:
        """Format request for Mistral models"""
        prompt = ""
        for msg in request.messages:
            if msg.role == "user":
                prompt += f"[INST] {msg.content} [/INST]\n"
            elif msg.role == "assistant":
                prompt += f"{msg.content}\n"

        return {
            "prompt": prompt,
            "max_tokens": request.max_tokens or 2048,
            "temperature": request.temperature,
        }

    def _parse_anthropic_response(self, response_body: dict) -> tuple:
        """Parse Anthropic Claude response"""
        content = response_body['content'][0]['text']
        tokens_prompt = response_body['usage']['input_tokens']
        tokens_completion = response_body['usage']['output_tokens']
        return content, tokens_prompt, tokens_completion

    def _parse_llama_response(self, response_body: dict) -> tuple:
        """Parse Meta Llama response"""
        content = response_body['generation']
        # Llama doesn't always return token counts, estimate if needed
        tokens_prompt = response_body.get('prompt_token_count', 0)
        tokens_completion = response_body.get('generation_token_count', 0)
        return content, tokens_prompt, tokens_completion

    def _parse_mistral_response(self, response_body: dict) -> tuple:
        """Parse Mistral response"""
        content = response_body['outputs'][0]['text']
        # Mistral may not return exact token counts
        tokens_prompt = 0  # Estimate based on input if needed
        tokens_completion = len(content.split()) * 1.3  # Rough estimate
        return content, int(tokens_prompt), int(tokens_completion)

    def get_available_models(self) -> List[str]:
        """
        Get list of available Bedrock models.

        Returns:
            List of model IDs
        """
        # Return all supported models
        # In a real implementation, we could query AWS Bedrock API to get enabled models
        return [
            # Claude models (recommended)
            "anthropic.claude-3-5-sonnet-20241022-v2:0",
            "anthropic.claude-3-5-sonnet-20240620-v1:0",
            "anthropic.claude-3-sonnet-20240229-v1:0",
            "anthropic.claude-3-haiku-20240307-v1:0",
            "anthropic.claude-3-opus-20240229-v1:0",

            # Llama models
            "meta.llama3-70b-instruct-v1:0",
            "meta.llama3-8b-instruct-v1:0",

            # Mistral models
            "mistral.mistral-large-2402-v1:0",
            "mistral.mistral-7b-instruct-v0:2",
        ]

    def calculate_cost(self, input_tokens: int, output_tokens: int, model: str) -> float:
        """
        Calculate cost based on Bedrock pricing.

        Args:
            input_tokens: Number of input tokens
            output_tokens: Number of output tokens
            model: Model ID

        Returns:
            Cost in USD
        """
        # Get pricing for model (use Claude 3.5 Sonnet as default)
        pricing = self.PRICING.get(model, self.PRICING["anthropic.claude-3-5-sonnet-20241022-v2:0"])

        input_cost = (input_tokens / 1_000_000) * pricing["input"]
        output_cost = (output_tokens / 1_000_000) * pricing["output"]

        return round(input_cost + output_cost, 6)
