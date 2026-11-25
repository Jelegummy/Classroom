"""Shared, lazily-initialised Typhoon LLM clients.

Creating the clients at import time made the whole service crash on start-up
when the API key was missing (the container restart-looped). Clients are now
created on first use, cached per temperature, and fail with a clear message.
"""
import os
import threading
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()

TYPHOON_BASE_URL = os.getenv("TYPHOON_BASE_URL", "https://api.opentyphoon.ai/v1")
TYPHOON_MODEL = os.getenv("TYPHOON_MODEL", "typhoon-v2.5-30b-a3b-instruct")
LLM_TIMEOUT_SECONDS = float(os.getenv("LLM_TIMEOUT_SECONDS", "120"))
LLM_MAX_RETRIES = int(os.getenv("LLM_MAX_RETRIES", "2"))

_lock = threading.Lock()


class LLMNotConfiguredError(RuntimeError):
    pass


def _api_key() -> str:
    # TYPHOON_KEY is the name used by the Discord bot; accept both.
    key = os.getenv("TYPHOON_API_KEY") or os.getenv("TYPHOON_KEY")
    if not key:
        raise LLMNotConfiguredError(
            "TYPHOON_API_KEY is not set. Add it to apps/assignment-bot/.env"
        )
    return key.strip()


@lru_cache(maxsize=None)
def _build(temperature: float):
    from langchain_openai import ChatOpenAI

    return ChatOpenAI(
        base_url=TYPHOON_BASE_URL,
        api_key=_api_key(),
        model=TYPHOON_MODEL,
        temperature=temperature,
        max_tokens=8192,
        timeout=LLM_TIMEOUT_SECONDS,
        max_retries=LLM_MAX_RETRIES,
    )


def get_llm(temperature: float = 0.1):
    with _lock:
        return _build(temperature)
