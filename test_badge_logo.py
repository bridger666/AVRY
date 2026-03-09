#!/usr/bin/env python3
"""
Quick test to verify badge generation uses Aivory logo (not text)

Run: python test_badge_logo.py
"""

from app.services.badge_service import generate_badge, get_logo_base64

def test_logo_loads():
    """Test that logo file loads successfully"""
    print("Testing logo file loading...")
    logo_data = get_logo_base64()
    
    if not logo_data:
        print("❌ CRITICAL ERROR: Logo file not found!")
        print("   Expected location: frontend/Aivory_logo.png")
        return False
    
    if not logo_data.startswith("data:image/png;base64,"):
        print("❌ ERROR: Logo data URL format incorrect")
        return False
    
    print(f"✅ Logo loaded successfully ({len(logo_data)} bytes)")
    return True


def test_badge_contains_logo():
    """Test that badge SVG contains logo image (not text)"""
    print("\nTesting badge generation...")
    badge_svg = generate_badge(58, "AI Ready")
    
    # Check for logo image element
    if '<image href="data:image/png;base64,' not in badge_svg:
        print("❌ CRITICAL ERROR: Badge does not contain logo image!")
        print("   Badge is using text fallback instead of logo")
        return False
    
    # Check that text fallback is NOT being used
    if 'Aivory [LOGO MISSING]' in badge_svg:
        print("❌ CRITICAL ERROR: Badge is using text fallback!")
        return False
    
    # Verify logo positioning
    if 'x="150" y="195" width="100" height="23"' not in badge_svg:
        print("⚠️  WARNING: Logo positioning may be incorrect")
    
    print("✅ Badge contains logo image (not text)")
    print(f"   Badge SVG length: {len(badge_svg)} bytes")
    return True


def test_badge_visual_output():
    """Generate sample badge for visual inspection"""
    print("\nGenerating sample badge...")
    badge_svg = generate_badge(58, "AI Ready")
    
    output_file = "test_badge_output.svg"
    with open(output_file, 'w') as f:
        f.write(badge_svg)
    
    print(f"✅ Sample badge saved to: {output_file}")
    print("   Open this file in a browser to visually verify logo appears correctly")
    return True


if __name__ == "__main__":
    print("=" * 60)
    print("AIVORY LOGO BADGE TEST")
    print("=" * 60)
    
    all_passed = True
    
    # Run tests
    all_passed &= test_logo_loads()
    all_passed &= test_badge_contains_logo()
    all_passed &= test_badge_visual_output()
    
    print("\n" + "=" * 60)
    if all_passed:
        print("✅ ALL TESTS PASSED - Logo is correctly embedded in badge")
    else:
        print("❌ TESTS FAILED - Logo is NOT being used correctly")
        print("   See AIVORY_LOGO_PROTOCOL.md for troubleshooting")
    print("=" * 60)
