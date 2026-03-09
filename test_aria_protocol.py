"""
Test script to verify ARIA protocol is being used correctly
"""
import asyncio
from app.prompts.console_prompts import get_console_system_prompt

async def test_aria_prompt():
    """Test that ARIA protocol is correctly configured"""
    
    # Get the system prompt
    prompt = get_console_system_prompt(tier="builder", has_snapshot=False, has_blueprint=False)
    
    print("=" * 80)
    print("ARIA PROTOCOL TEST")
    print("=" * 80)
    print("\nSystem Prompt Length:", len(prompt))
    print("\n" + "=" * 80)
    print("FIRST 500 CHARACTERS:")
    print("=" * 80)
    print(prompt[:500])
    print("\n" + "=" * 80)
    print("CHECKING FOR KEY ARIA ELEMENTS:")
    print("=" * 80)
    
    checks = {
        "Contains 'ARIA'": "ARIA" in prompt,
        "Contains 'Aivory Reasoning & Intelligence Assistant'": "Aivory Reasoning & Intelligence Assistant" in prompt,
        "Contains multilingual support": "multilingual" in prompt.lower(),
        "Contains Bahasa Indonesia": "Bahasa Indonesia" in prompt,
        "Contains Arabic": "Arabic" in prompt or "العربية" in prompt,
        "Contains language detection rules": "language detection" in prompt.lower(),
        "Contains 'siapa kamu' example": "siapa kamu" in prompt.lower() or "Halo, saya ARIA" in prompt,
        "Contains introduction requirement": "introduce yourself" in prompt.lower() or "first reply" in prompt.lower(),
        "Contains Aivory-centric solutions": "Aivory-centric" in prompt or "Aivory / Zenclaw" in prompt,
    }
    
    for check, result in checks.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {check}")
    
    print("\n" + "=" * 80)
    print("INTRODUCTION EXAMPLES:")
    print("=" * 80)
    
    # Extract introduction examples
    if "Examples:" in prompt:
        intro_section = prompt.split("Examples:")[1].split("**Identity rules:**")[0]
        print(intro_section[:800])
    
    print("\n" + "=" * 80)
    
    # Check if all critical elements are present
    all_passed = all(checks.values())
    
    if all_passed:
        print("✅ ALL CHECKS PASSED - ARIA Protocol is correctly configured!")
    else:
        print("❌ SOME CHECKS FAILED - ARIA Protocol may have issues")
    
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(test_aria_prompt())
