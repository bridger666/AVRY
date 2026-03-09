"""
Test script for console API endpoint
"""
import asyncio
import httpx

async def test_console():
    url = "http://localhost:8081/api/console/message"
    
    payload = {
        "message": "Hello, can you help me?",
        "files": [],
        "workflow": None,
        "context": {
            "tier": "operator",
            "user_id": "demo_user"
        }
    }
    
    print("Testing console API...")
    print(f"URL: {url}")
    print(f"Payload: {payload}")
    print()
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(url, json=payload)
            
            print(f"Status: {response.status_code}")
            print(f"Response: {response.text}")
            
            if response.is_success:
                data = response.json()
                print("\n✅ Success!")
                print(f"AI Response: {data.get('response', 'N/A')}")
                print(f"Credits Remaining: {data.get('credits_remaining', 'N/A')}")
            else:
                print(f"\n❌ Error: {response.status_code}")
                
    except Exception as e:
        print(f"\n❌ Exception: {e}")

if __name__ == "__main__":
    asyncio.run(test_console())
