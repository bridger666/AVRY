"""
Test blueprint generation with real snapshot data.

Verifies that blueprint generation service retrieves and uses
real data from the database instead of mock data.
"""

import asyncio
import sys
from pathlib import Path

# Add app to path
sys.path.insert(0, str(Path(__file__).parent))

from app.services.blueprint_generation import BlueprintGenerationService


async def test_blueprint_with_real_data():
    """Test blueprint generation retrieves real snapshot data"""
    print("\n" + "="*80)
    print("BLUEPRINT GENERATION - REAL DATA TEST")
    print("="*80)
    
    # Use the snapshot_id from our end-to-end test
    snapshot_id = "snap_uk5fttxhm23k"
    user_id = "GrandMasterRCH"  # Super admin bypass
    
    print(f"\nTesting blueprint generation with snapshot: {snapshot_id}")
    print(f"User: {user_id} (super admin)")
    
    # Initialize blueprint service
    service = BlueprintGenerationService()
    
    # Retrieve snapshot data (this is what blueprint generation does internally)
    print("\n📥 Retrieving snapshot data...")
    snapshot_data = await service._retrieve_snapshot_data(snapshot_id, user_id)
    
    if not snapshot_data:
        print("✗ Failed to retrieve snapshot data")
        return False
    
    print("✓ Snapshot data retrieved successfully")
    
    # Verify it's REAL data, not mock data
    print("\n📊 SNAPSHOT DATA VERIFICATION:")
    print(f"  - Snapshot ID: {snapshot_data.snapshot_id}")
    print(f"  - Company Name: {snapshot_data.company_name}")
    print(f"  - User Email: {snapshot_data.user_email}")
    print(f"  - Industry: {snapshot_data.industry}")
    print(f"  - Readiness Score: {snapshot_data.readiness_score}")
    print(f"  - Primary Objective: {snapshot_data.primary_objective}")
    print(f"  - Automation Level: {snapshot_data.automation_level}")
    print(f"  - Data Quality Score: {snapshot_data.data_quality_score}")
    
    print(f"\n  Pain Points ({len(snapshot_data.pain_points)}):")
    for i, pain_point in enumerate(snapshot_data.pain_points, 1):
        print(f"    {i}. {pain_point}")
    
    print(f"\n  Workflows ({len(snapshot_data.workflows)}):")
    for i, workflow in enumerate(snapshot_data.workflows, 1):
        print(f"    {i}. {workflow}")
    
    print(f"\n  Key Processes ({len(snapshot_data.key_processes)}):")
    for i, process in enumerate(snapshot_data.key_processes, 1):
        print(f"    {i}. {process}")
    
    # Check for mock data strings
    mock_strings = ["Example Corp", "user@example.com", "Example", "Mock"]
    fields_to_check = [
        ("company_name", snapshot_data.company_name),
        ("user_email", snapshot_data.user_email),
        ("pain_points", str(snapshot_data.pain_points)),
        ("workflows", str(snapshot_data.workflows)),
        ("key_processes", str(snapshot_data.key_processes))
    ]
    
    print("\n🔍 MOCK DATA CHECK:")
    has_mock_data = False
    for field_name, field_value in fields_to_check:
        for mock_str in mock_strings:
            if mock_str in str(field_value):
                print(f"  ✗ Mock data found in {field_name}: '{mock_str}'")
                has_mock_data = True
    
    if not has_mock_data:
        print("  ✓ No mock data detected - all data is REAL")
    
    # Verify expected real data
    print("\n✅ REAL DATA VERIFICATION:")
    expected_company = "Aivory Test Corp"
    expected_email = "test@aivory.id"
    expected_industry = "Technology"
    
    checks = [
        (snapshot_data.company_name == expected_company, 
         f"Company name matches: {expected_company}"),
        (snapshot_data.user_email == expected_email,
         f"Email matches: {expected_email}"),
        (snapshot_data.industry == expected_industry,
         f"Industry matches: {expected_industry}"),
        (len(snapshot_data.pain_points) > 0,
         f"Pain points extracted: {len(snapshot_data.pain_points)} items"),
        (len(snapshot_data.workflows) > 0,
         f"Workflows extracted: {len(snapshot_data.workflows)} items"),
        (len(snapshot_data.key_processes) > 0,
         f"Key processes extracted: {len(snapshot_data.key_processes)} items"),
        (snapshot_data.readiness_score > 0,
         f"Readiness score: {snapshot_data.readiness_score}"),
        (snapshot_data.data_quality_score > 0,
         f"Data quality score: {snapshot_data.data_quality_score}")
    ]
    
    all_passed = True
    for check_passed, message in checks:
        if check_passed:
            print(f"  ✓ {message}")
        else:
            print(f"  ✗ {message}")
            all_passed = False
    
    if not all_passed or has_mock_data:
        print("\n✗ TEST FAILED: Blueprint is not using real data")
        return False
    
    print("\n" + "="*80)
    print("✓ TEST PASSED: Blueprint generation uses REAL snapshot data")
    print("="*80)
    print("\n🎉 Blueprint will contain personalized data:")
    print(f"  - Company: {snapshot_data.company_name}")
    print(f"  - Pain points: {', '.join(snapshot_data.pain_points[:2])}...")
    print(f"  - Workflows: {', '.join(snapshot_data.workflows[:2])}...")
    print(f"  - Zero mock data")
    
    return True


async def main():
    """Run blueprint real data test"""
    try:
        success = await test_blueprint_with_real_data()
        if not success:
            sys.exit(1)
    except Exception as e:
        print(f"\n✗ TEST FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
