"""Test script for n8n integration"""
import asyncio
import sys
from app.integrations.n8n_client import N8nClient


async def test_n8n_connection():
    """Test n8n connection and webhook triggering"""
    
    print("=" * 60)
    print("n8n Integration Test")
    print("=" * 60)
    
    # Initialize client
    client = N8nClient(
        base_url="http://43.156.108.96:5678",
        timeout=10.0,
        max_retries=3
    )
    
    # Test 1: Health Check
    print("\n[TEST 1] Health Check")
    print("-" * 60)
    health = await client.health_check()
    print(f"Status: {health['status']}")
    print(f"Latency: {health['latency_ms']}ms")
    print(f"Timestamp: {health['timestamp']}")
    
    if health['status'] != 'connected':
        print(f"❌ Health check failed: {health.get('error', 'Unknown error')}")
        sys.exit(1)
    else:
        print("✅ Health check passed")
    
    # Test 2: Webhook Trigger (example)
    print("\n[TEST 2] Webhook Trigger (Example)")
    print("-" * 60)
    print("Note: This will fail if webhook doesn't exist yet")
    
    try:
        response = await client.trigger_webhook(
            webhook_path="/webhook/test",
            payload={
                "source": "aivory",
                "test": True,
                "message": "Test from Aivory integration"
            }
        )
        print(f"✅ Webhook triggered successfully")
        print(f"Response: {response}")
    except Exception as e:
        print(f"⚠️  Webhook trigger failed (expected if webhook not configured): {e}")
    
    print("\n" + "=" * 60)
    print("Test completed")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(test_n8n_connection())
