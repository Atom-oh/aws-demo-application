"""Pytest configuration and fixtures for ai-service."""

import pytest


@pytest.fixture(scope="session")
def anyio_backend():
    """Use asyncio for async tests."""
    return "asyncio"
