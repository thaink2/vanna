"""
OVH Mistral integration tests.

Basic unit tests for the OVH Mistral LLM service integration.
These tests verify that your wrapper correctly talks to the OVH endpoint.

Note: Tests requiring API calls need MISTRAL_API_KEY and MISTRAL_API_URL environment variables.
"""

import os
import pytest
from vanna.core.llm import LlmRequest, LlmMessage
from vanna.core.tool import ToolSchema
from vanna.core.user import User

# Define the model we are testing
TEST_MODEL = "Mistral-Small-3.2-24B-Instruct-2506"

@pytest.fixture
def test_user():
    """Test user for LLM requests."""
    return User(
        id="test_user",
        username="test",
        email="test@example.com",
        group_memberships=["user"],
    )

@pytest.mark.asyncio
async def test_ovh_import():
    """Test that OVH Mistral integration can be imported."""
    # This verifies your __init__.py is working correctly
    from vanna.integrations.ovh_mistral import OvhMistralLlmService

    print("✓ OvhMistralLlmService imported successfully")
    assert OvhMistralLlmService is not None

@pytest.mark.asyncio
async def test_ovh_initialization_without_key():
    """Test that service raises error without API key."""
    from vanna.integrations.ovh_mistral import OvhMistralLlmService

    # Temporarily remove key to verify error handling
    old_key = os.environ.pop("MISTRAL_API_KEY", None)

    try:
        with pytest.raises(ValueError, match="API key required"):
            llm = OvhMistralLlmService(model=TEST_MODEL)
    finally:
        # Restore the key so other tests don't fail!
        if old_key:
            os.environ["MISTRAL_API_KEY"] = old_key

@pytest.mark.asyncio
async def test_ovh_initialization():
    """Test that service initializes correctly with env vars."""
    from vanna.integrations.ovh_mistral import OvhMistralLlmService

    # Ensure we have keys (skip if running in CI without keys)
    if not os.getenv("MISTRAL_API_KEY"):
        pytest.skip("Skipping OVH tests: MISTRAL_API_KEY not found")

    llm = OvhMistralLlmService(
        model=TEST_MODEL,
        temperature=0.5,
    )

    print(f"✓ Service initialized")
    print(f"  Model: {llm.model}")
    
    assert llm.model == TEST_MODEL
    # We check internal client existence to ensure setup passed
    assert llm._client is not None

@pytest.mark.asyncio
async def test_ovh_basic_request(test_user):
    """Test a basic request (Ping Pong)."""
    from vanna.integrations.ovh_mistral import OvhMistralLlmService

    if not os.getenv("MISTRAL_API_KEY"):
        pytest.skip("Skipping OVH tests: MISTRAL_API_KEY not found")

    llm = OvhMistralLlmService(model=TEST_MODEL)

    request = LlmRequest(
        user=test_user,
        messages=[
            LlmMessage(role="user", content="Who is the president of France?")
        ],
        temperature=0.1
    )

    print(f"\n=== Basic Request Test ===")
    print(f"Sending request to OVH...")

    response = await llm.send_request(request)

    print(f"✓ Response received")
    print(f"  Content: {response.content}")
    print(f"  Usage: {response.usage}")

    assert response is not None
    assert response.content is not None
    assert "Emmanuel Macron" in response.content

@pytest.mark.asyncio
async def test_ovh_streaming_request(test_user):
    """Test streaming request (The one we just fixed!)."""
    from vanna.integrations.ovh_mistral import OvhMistralLlmService

    if not os.getenv("MISTRAL_API_KEY"):
        pytest.skip("Skipping OVH tests: MISTRAL_API_KEY not found")

    llm = OvhMistralLlmService(model=TEST_MODEL)

    request = LlmRequest(
        user=test_user,
        messages=[
            LlmMessage(role="user", content="Count 1 to 3.")
        ],
        stream=True,
    )

    print(f"\n=== Streaming Request Test ===")
    
    chunks = []
    async for chunk in llm.stream_request(request):
        if chunk.content:
            print(f"  Chunk: {chunk.content}")
            chunks.append(chunk.content)

    print(f"✓ Streaming completed")
    
    # If chunks are empty, the streaming fix didn't work
    assert len(chunks) > 0
    full_text = "".join(chunks)
    assert "1" in full_text
    assert "2" in full_text

@pytest.mark.asyncio
async def test_ovh_validate_tools():
    """Test tool validation (Offline test)."""
    from vanna.integrations.ovh_mistral import OvhMistralLlmService

    # Mock init since we don't need real API for this
    llm = OvhMistralLlmService(api_key="mock_key", base_url="https://mock.url")

    # Valid tool
    valid_tool = ToolSchema(
        name="run_sql",
        description="Runs SQL queries",
        parameters={"type": "object", "properties": {}},
    )

    # Invalid tool (missing name)
    invalid_tool = ToolSchema(
        name="",
        description="Invalid tool",
        parameters={"type": "object", "properties": {}},
    )

    errors = await llm.validate_tools([valid_tool])
    assert len(errors) == 0, "Valid tool should pass validation"

    errors = await llm.validate_tools([invalid_tool])
    assert len(errors) > 0, "Invalid tool should return errors"
    assert "name" in errors[0]

    print("✓ Tool validation logic works")