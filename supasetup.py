from __future__ import annotations

import os
from pathlib import Path
from uuid import uuid4

from dotenv import load_dotenv
from supabase import Client, create_client


load_dotenv(override=True)


SUPABASE_EVIDENCE_BUCKET = os.getenv("SUPABASE_EVIDENCE_BUCKET", "crime-videos")


def normalize_supabase_url(raw_url: str | None) -> str:
    """Convert REST endpoint URLs into the base project URL expected by supabase-py."""
    if not raw_url:
        raise RuntimeError("SUPABASE_URL is missing from .env.")

    normalized_url = raw_url.strip().rstrip("/")
    if normalized_url.endswith("/rest/v1"):
        normalized_url = normalized_url[: -len("/rest/v1")]

    return normalized_url


def is_placeholder_key(raw_key: str | None) -> bool:
    """Detect copied placeholder values that are not real Supabase keys."""
    if not raw_key:
        return True

    cleaned_key = raw_key.strip()
    return cleaned_key.startswith("your_") or "placeholder" in cleaned_key.lower()


def get_supabase_client() -> Client:
    """Create the shared Supabase client from environment configuration."""
    supabase_url = normalize_supabase_url(os.getenv("SUPABASE_URL"))
    service_role_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    publishable_key = os.getenv("SUPABASE_KEY")
    supabase_key = (
        service_role_key
        if not is_placeholder_key(service_role_key)
        else publishable_key
    )

    if not supabase_key:
        raise RuntimeError(
            "Missing Supabase key. Set SUPABASE_SERVICE_ROLE_KEY or SUPABASE_KEY in .env."
        )

    return create_client(supabase_url, supabase_key)


def build_evidence_path(file_name: str) -> str:
    """Generate a unique storage path for uploaded evidence videos."""
    suffix = Path(file_name).suffix.lower()
    return f"police-evidence/{uuid4().hex}{suffix}"


supabase = get_supabase_client()
