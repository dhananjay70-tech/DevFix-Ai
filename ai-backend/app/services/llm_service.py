import openai
from langchain_openai import ChatOpenAI

from app.config import settings
from app.utils.exceptions import AgentExecutionException

# Providers whose Chat Completions API is OpenAI-compatible, so we can reuse
# ChatOpenAI for all of them by just swapping base_url/model/key.
_PROVIDER_ENDPOINTS = {
    "gemini": "https://generativelanguage.googleapis.com/v1beta/openai/",
    "xai": "https://api.x.ai/v1",
}


class _LLMClient:
    """Wraps a ChatOpenAI client so every agent's `llm.invoke(prompt)` call gets
    the same auth/rate-limit/connection error handling, without each agent
    needing its own try/except around provider-specific exception types."""

    def __init__(self, client: ChatOpenAI, provider: str):
        self._client = client
        self._provider = provider

    def invoke(self, *args, **kwargs):
        try:
            return self._client.invoke(*args, **kwargs)
        except openai.AuthenticationError as e:
            raise AgentExecutionException(
                f"LLM provider '{self._provider}' rejected the API key (401 Unauthorized). "
                f"Check the key for {self._provider} in ai-backend/.env."
            ) from e
        except openai.RateLimitError as e:
            raise AgentExecutionException(
                f"LLM provider '{self._provider}' hit a rate limit or quota (429). "
                "Wait and retry, or switch LLM_PROVIDER in ai-backend/.env."
            ) from e
        except openai.APIConnectionError as e:
            raise AgentExecutionException(
                f"Could not reach LLM provider '{self._provider}': {e}"
            ) from e
        except openai.APIStatusError as e:
            raise AgentExecutionException(
                f"LLM provider '{self._provider}' returned an error "
                f"(status {e.status_code}): {e.message}"
            ) from e


def get_llm(temperature: float = 0.2) -> _LLMClient:
    """Return the configured real LLM client. Raises if no key is set for the
    selected provider — we never fall back to a mock client."""
    provider = settings.LLM_PROVIDER.lower()

    if provider == "gemini":
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("LLM_PROVIDER=gemini but GEMINI_API_KEY is not set in ai-backend/.env")
        model_name = "gemini-2.0-flash" if "3.6" in settings.GEMINI_MODEL else settings.GEMINI_MODEL
        client = ChatOpenAI(
            model=model_name,
            api_key=settings.GEMINI_API_KEY,
            base_url=_PROVIDER_ENDPOINTS["gemini"],
            temperature=temperature
        )
        return _LLMClient(client, provider)

    if provider == "xai":
        if not settings.XAI_API_KEY:
            raise RuntimeError("LLM_PROVIDER=xai but XAI_API_KEY is not set in ai-backend/.env")
        client = ChatOpenAI(
            model=settings.XAI_MODEL,
            api_key=settings.XAI_API_KEY,
            base_url=_PROVIDER_ENDPOINTS["xai"],
            temperature=temperature
        )
        return _LLMClient(client, provider)

    if provider == "openai":
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("LLM_PROVIDER=openai but OPENAI_API_KEY is not set in ai-backend/.env")
        client = ChatOpenAI(
            model=settings.LLM_MODEL,
            api_key=settings.OPENAI_API_KEY,
            temperature=temperature
        )
        return _LLMClient(client, provider)

    raise RuntimeError(f"Unsupported LLM_PROVIDER: {settings.LLM_PROVIDER}")
