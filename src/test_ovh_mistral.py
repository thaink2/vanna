"""
🧪 Test OVH Mistral integration with Vanna!

Run this to make sure everything works before using in production.
"""
'''
import asyncio
import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

from vanna.integrations.ovh_mistral import OvhMistralLlmService
from vanna.core.llm import LlmRequest, LlmMessage
from vanna.core.user.models import User
async def main():
    print(" Testing OVH Mistral integration...")
    
    # Create the LLM service
    llm = OvhMistralLlmService(
        model="Mistral-Small-3.2-24B-Instruct-2506",  # Your working model
        api_key=os.getenv("MISTRAL_API_KEY"),
        base_url=os.getenv("MISTRAL_API_URL")
    )
    
    # Create a simple request
    request = LlmRequest(
        user=User(id="test_user"),
        messages=[
            LlmMessage(role="user", content="consider a student table in a database with columns id, name, age. Write a SQL query to select all students older than 20.")
        ],
        max_tokens=100,
        temperature=0.7
    )
    
    # Send it!
    print("Sending request to OVH Mistral...")
    response = await llm.send_request(request)
    
    print("\n Response from OVH Mistral:")
    print(response.content)
    print(f"\nTokens used: {response.usage}")

if __name__ == "__main__":
    asyncio.run(main())

'''
'''
print("1. Script started...")
import asyncio
import os
print("2. Imports starting...")
from vanna.integrations.ovh_mistral import OvhMistralLlmService
print("3. Imports finished...")

async def main():
    llm = OvhMistralLlmService(
        model="Mistral-Small-3.2-24B-Instruct-2506",
        api_key="eyJhbGciOiJFZERTQSIsImtpZCI6IjgzMkFGNUE5ODg3MzFCMDNGM0EzMTRFMDJFRUJFRjBGNDE5MUY0Q0YiLCJraW5kIjoicGF0IiwidHlwIjoiSldUIn0", 
        base_url="https://mistral-small-3-2-24b-instruct-2506.endpoints.kepler.ai.cloud.ovh.net/api/openai_compat/v1"
    )
if __name__ == "__main__":
    try:
        print("🚀 Starting Async Loop...")
        asyncio.run(main())
        print("✅ Script finished normally.")
    except Exception as e:
        print(f"❌ SILENT CRASH CAUGHT: {e}")


'''
import asyncio
import os
import sys
from dotenv import load_dotenv

# 1. Load environment variables
load_dotenv()

print("--- DEBUG INITIALIZATION ---")
print(f"Python Version: {sys.version}")

try:
    from vanna.integrations.ovh_mistral import OvhMistralLlmService
    from vanna.core.llm import LlmRequest, LlmMessage
    from vanna.core.user.models import User
    print("✅ Integration modules found")
except Exception as e:
    print(f"❌ Module Import Error: {e}")
    sys.exit(1)

async def main():
    print("🏃 Entering main()...")
    
    # 2. Check for keys
    api_key = os.getenv("MISTRAL_API_KEY")
    api_url = os.getenv("MISTRAL_API_URL")
    
    if not api_key:
        print("⚠️ WARNING: MISTRAL_API_KEY is not set in your environment!")
        return
    llm = OvhMistralLlmService(
        model="Mistral-Small-3.2-24B-Instruct-2506",
        api_key=api_key,
        base_url=api_url
    )
    
    # 4. Create the request
    request = LlmRequest(
        user=User(id="test_user"),
        messages=[
            LlmMessage(role="user", content="Write a SQL query to select all students older than 20 from a table named 'students'.")
        ],
        max_tokens=100
    )
    
    # 5. Send the request
    try:
        print("📤 Sending request to OVH Mistral API...")
        response = await llm.send_request(request)
        
        print("\n✨ Response received:")
        print("--------------------")
        print(response.content)
        print("--------------------")
        print(f"📊 Usage: {response.usage}")
        
    except Exception as e:
        print(f"\n❌ API CALL FAILED: {type(e).__name__}")
        print(f"Detail: {e}")

    print("🏁 Exiting main()...")

if __name__ == "__main__":
    try:
        print("🚀 Starting Async Event Loop...")
        asyncio.run(main())
        
        print("✅ Script execution finished.")

    except Exception as e:
        print(f"🔥 UNEXPECTED SYSTEM CRASH: {e}")