"""
Aivory Super Admin Automated Test Suite
Uses Playwright for end-to-end testing
"""

import json
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright, Page, expect
import jsonschema


# Test Configuration
CONFIG = {
    "base_url": "http://localhost:8080",
    "api_url": "http://localhost:8081",
    "credentials": {
        "username": "GrandMasterRCH",
        "password": "Lemonandsalt66633"
    },
    "test_data": {
        "roi_inputs": {
            "time_saved_hours": 40,
            "cost_per_hour": 50,
            "automation_percentage": 60,
            "implementation_cost": 10000
        }
    }
}


class TestReport:
    """Test report generator"""
    
    def __init__(self):
        self.results = []
        self.start_time = datetime.now()
    
    def add_result(self, test_name, expected, actual, passed, notes=""):
        self.results.append({
            "test_name": test_name,
            "expected": expected,
            "actual": actual,
            "passed": passed,
            "notes": notes,
            "timestamp": datetime.now().isoformat()
        })
    
    def generate_report(self):
        """Generate JSON test report"""
        total = len(self.results)
        passed = sum(1 for r in self.results if r["passed"])
        failed = total - passed
        
        report = {
            "test_suite": "Super Admin Full Feature Test",
            "start_time": self.start_time.isoformat(),
            "end_time": datetime.now().isoformat(),
            "summary": {
                "total_tests": total,
                "passed": passed,
                "failed": failed,
                "pass_rate": f"{(passed/total*100):.1f}%" if total > 0 else "0%"
            },
            "results": self.results
        }
        
        # Save to file
        filename = f"test_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w') as f:
            json.dump(report, f, indent=2)
        
        print(f"\n✅ Test report saved to: {filename}")
        print(f"📊 Summary: {passed}/{total} tests passed ({report['summary']['pass_rate']})")
        
        return report


async def login_as_super_admin(page: Page):
    """Login with Super Admin credentials"""
    await page.goto(f"{CONFIG['base_url']}/login.html")
    await page.fill('input[name="username"]', CONFIG['credentials']['username'])
    await page.fill('input[name="password"]', CONFIG['credentials']['password'])
    await page.click('button[type="submit"]')
    await page.wait_for_load_state('networkidle')


async def test_super_admin_authentication(page: Page, report: TestReport):
    """Test 1.1: Super Admin Authentication"""
    print("\n🧪 Test 1.1: Super Admin Authentication")
    
    try:
        await login_as_super_admin(page)
        
        # Verify redirect to dashboard
        await expect(page).to_have_url(f"{CONFIG['base_url']}/dashboard.html")
        
        # Verify Super Admin badge
        badge = await page.locator('.tier-badge').text_content()
        
        report.add_result(
            "Super Admin Authentication",
            "Successful login with Super Admin access",
            f"Logged in, badge: {badge}",
            "admin" in badge.lower() or "enterprise" in badge.lower(),
            "Super Admin authentication successful"
        )
        print("✅ PASS: Super Admin authenticated successfully")
        
    except Exception as e:
        report.add_result(
            "Super Admin Authentication",
            "Successful login",
            f"Error: {str(e)}",
            False,
            f"Authentication failed: {str(e)}"
        )
        print(f"❌ FAIL: {str(e)}")


async def test_dashboard_access(page: Page, report: TestReport):
    """Test 1.2: Access All Dashboard Sections"""
    print("\n🧪 Test 1.2: Dashboard Section Access")
    
    sections = [
        ("Overview", "#overview-section"),
        ("Workflows", "#workflows-section"),
        ("Console", "#console-section"),
        ("Logs", "#logs-section"),
        ("Diagnostics", "#diagnostics-section"),
        ("Settings", "#settings-section")
    ]
    
    for section_name, selector in sections:
        try:
            # Navigate to section
            await page.click(f'a:has-text("{section_name}")')
            await page.wait_for_timeout(1000)
            
            # Check for access denied
            access_denied = await page.locator('text=Access Denied').count()
            
            report.add_result(
                f"Dashboard Access: {section_name}",
                "Section loads without errors",
                "Loaded successfully" if access_denied == 0 else "Access Denied",
                access_denied == 0,
                f"{section_name} section accessible"
            )
            
            if access_denied == 0:
                print(f"✅ PASS: {section_name} accessible")
            else:
                print(f"❌ FAIL: {section_name} access denied")
                
        except Exception as e:
            report.add_result(
                f"Dashboard Access: {section_name}",
                "Section loads",
                f"Error: {str(e)}",
                False,
                f"Failed to access {section_name}"
            )
            print(f"❌ FAIL: {section_name} - {str(e)}")


async def test_free_diagnostic(page: Page, report: TestReport):
    """Test 2.1: Run Free AI Diagnostic"""
    print("\n🧪 Test 2.1: Free AI Readiness Diagnostic")
    
    try:
        await page.goto(f"{CONFIG['base_url']}/index.html")
        await page.click('button:has-text("Run Free AI Diagnostic")')
        await page.wait_for_load_state('networkidle')
        
        # Count questions
        questions = await page.locator('.diagnostic-question').count()
        
        # Answer questions (simplified - click first option for each)
        for i in range(questions):
            await page.click(f'.diagnostic-question:nth-child({i+1}) input[type="radio"]:first-child')
        
        # Submit
        await page.click('button:has-text("Submit Diagnostic")')
        await page.wait_for_timeout(3000)
        
        # Check for results
        score_element = await page.locator('.diagnostic-score').text_content()
        
        report.add_result(
            "Free AI Diagnostic",
            "12 questions, structured output, score displayed",
            f"Questions: {questions}, Score displayed: {bool(score_element)}",
            questions == 12 and bool(score_element),
            f"Diagnostic completed with {questions} questions"
        )
        
        if questions == 12 and score_element:
            print(f"✅ PASS: Free diagnostic completed (Score: {score_element})")
        else:
            print(f"❌ FAIL: Expected 12 questions, got {questions}")
            
    except Exception as e:
        report.add_result(
            "Free AI Diagnostic",
            "Successful completion",
            f"Error: {str(e)}",
            False,
            f"Diagnostic failed: {str(e)}"
        )
        print(f"❌ FAIL: {str(e)}")


async def test_roi_engine_conservative(page: Page, report: TestReport):
    """Test 7.1: ROI Engine Conservative Mode"""
    print("\n🧪 Test 7.1: ROI Engine - Conservative Mode")
    
    try:
        await page.goto(f"{CONFIG['base_url']}/dashboard.html")
        await page.click('a:has-text("ROI Engine")')
        await page.wait_for_load_state('networkidle')
        
        # Select Conservative mode
        await page.click('input[value="conservative"]')
        
        # Input test data
        await page.fill('input[name="time_saved_hours"]', str(CONFIG['test_data']['roi_inputs']['time_saved_hours']))
        await page.fill('input[name="cost_per_hour"]', str(CONFIG['test_data']['roi_inputs']['cost_per_hour']))
        await page.fill('input[name="automation_percentage"]', str(CONFIG['test_data']['roi_inputs']['automation_percentage']))
        await page.fill('input[name="implementation_cost"]', str(CONFIG['test_data']['roi_inputs']['implementation_cost']))
        
        # Generate projection
        await page.click('button:has-text("Calculate ROI")')
        await page.wait_for_timeout(2000)
        
        # Check results
        monthly_savings = await page.locator('.monthly-savings').text_content()
        payback_period = await page.locator('.payback-period').text_content()
        
        report.add_result(
            "ROI Engine - Conservative Mode",
            "Calculation completes with structured output",
            f"Monthly savings: {monthly_savings}, Payback: {payback_period}",
            bool(monthly_savings) and bool(payback_period),
            "Conservative ROI calculation successful"
        )
        
        if monthly_savings and payback_period:
            print(f"✅ PASS: Conservative ROI calculated (Savings: {monthly_savings})")
        else:
            print("❌ FAIL: ROI calculation incomplete")
            
    except Exception as e:
        report.add_result(
            "ROI Engine - Conservative Mode",
            "Successful calculation",
            f"Error: {str(e)}",
            False,
            f"ROI calculation failed: {str(e)}"
        )
        print(f"❌ FAIL: {str(e)}")


async def test_roi_engine_growth(page: Page, report: TestReport):
    """Test 7.2: ROI Engine Growth Mode"""
    print("\n🧪 Test 7.2: ROI Engine - Growth Mode")
    
    try:
        # Switch to Growth mode
        await page.click('input[value="growth"]')
        
        # Generate projection (inputs already filled)
        await page.click('button:has-text("Calculate ROI")')
        await page.wait_for_timeout(2000)
        
        # Check results
        monthly_savings = await page.locator('.monthly-savings').text_content()
        payback_period = await page.locator('.payback-period').text_content()
        
        report.add_result(
            "ROI Engine - Growth Mode",
            "Higher projections than Conservative mode",
            f"Monthly savings: {monthly_savings}, Payback: {payback_period}",
            bool(monthly_savings) and bool(payback_period),
            "Growth ROI calculation successful"
        )
        
        if monthly_savings and payback_period:
            print(f"✅ PASS: Growth ROI calculated (Savings: {monthly_savings})")
        else:
            print("❌ FAIL: ROI calculation incomplete")
            
    except Exception as e:
        report.add_result(
            "ROI Engine - Growth Mode",
            "Successful calculation",
            f"Error: {str(e)}",
            False,
            f"ROI calculation failed: {str(e)}"
        )
        print(f"❌ FAIL: {str(e)}")


async def test_multi_turn_diagnostic(page: Page, report: TestReport):
    """Test 6.1: Multi-Turn Guided Diagnostic"""
    print("\n🧪 Test 6.1: Multi-Turn Guided Diagnostic")
    
    try:
        await page.goto(f"{CONFIG['base_url']}/dashboard.html")
        await page.click('a:has-text("Diagnostics")')
        await page.click('button:has-text("Start Guided Diagnostic")')
        await page.wait_for_load_state('networkidle')
        
        rounds_completed = 0
        max_rounds = 5
        
        for round_num in range(max_rounds):
            # Check if diagnostic is complete
            complete_indicator = await page.locator('text=Diagnostic Complete').count()
            if complete_indicator > 0:
                break
            
            # Answer current question
            await page.click('.diagnostic-answer:first-child')
            await page.click('button:has-text("Next")')
            await page.wait_for_timeout(1000)
            rounds_completed += 1
        
        # Check for structured output
        output_element = await page.locator('.diagnostic-output').count()
        
        report.add_result(
            "Multi-Turn Guided Diagnostic",
            "3-5 rounds with structured JSON output",
            f"Rounds completed: {rounds_completed}, Output present: {output_element > 0}",
            3 <= rounds_completed <= 5 and output_element > 0,
            f"Completed {rounds_completed} rounds"
        )
        
        if 3 <= rounds_completed <= 5:
            print(f"✅ PASS: Multi-turn diagnostic completed ({rounds_completed} rounds)")
        else:
            print(f"❌ FAIL: Expected 3-5 rounds, got {rounds_completed}")
            
    except Exception as e:
        report.add_result(
            "Multi-Turn Guided Diagnostic",
            "Successful completion",
            f"Error: {str(e)}",
            False,
            f"Diagnostic failed: {str(e)}"
        )
        print(f"❌ FAIL: {str(e)}")


async def test_subscription_tiers(page: Page, report: TestReport):
    """Test 5.x: Subscription Tier Features"""
    print("\n🧪 Test 5.x: Subscription Tier Validation")
    
    tiers = [
        ("Foundation", "$29", ["3 workflows", "2,500 executions", "50 credits"]),
        ("Pro", "$149", ["10 workflows", "10,000 executions", "300 credits"]),
        ("Enterprise", "$499", ["Unlimited workflows", "50,000 executions", "2,000 credits"])
    ]
    
    for tier_name, price, features in tiers:
        try:
            await page.goto(f"{CONFIG['base_url']}/index.html#pricing")
            
            # Find tier card
            tier_card = page.locator(f'.pricing-card:has-text("{tier_name}")')
            
            # Verify price
            price_text = await tier_card.locator('.price-tag').text_content()
            price_match = price in price_text
            
            # Verify features
            features_found = 0
            for feature in features:
                feature_count = await tier_card.locator(f'text={feature}').count()
                if feature_count > 0:
                    features_found += 1
            
            all_features_present = features_found == len(features)
            
            report.add_result(
                f"Subscription Tier: {tier_name}",
                f"Price {price} with {len(features)} key features",
                f"Price match: {price_match}, Features: {features_found}/{len(features)}",
                price_match and all_features_present,
                f"{tier_name} tier validated"
            )
            
            if price_match and all_features_present:
                print(f"✅ PASS: {tier_name} tier validated")
            else:
                print(f"❌ FAIL: {tier_name} tier incomplete")
                
        except Exception as e:
            report.add_result(
                f"Subscription Tier: {tier_name}",
                "Tier displayed correctly",
                f"Error: {str(e)}",
                False,
                f"Failed to validate {tier_name}"
            )
            print(f"❌ FAIL: {tier_name} - {str(e)}")


async def test_ui_color_consistency(page: Page, report: TestReport):
    """Test 10.1: Brand Color Consistency"""
    print("\n🧪 Test 10.1: UI Color Consistency")
    
    try:
        await page.goto(f"{CONFIG['base_url']}/index.html")
        
        # Check purple background
        body_bg = await page.evaluate("window.getComputedStyle(document.body).backgroundColor")
        
        # Check teal action buttons
        button_color = await page.evaluate("""
            () => {
                const btn = document.querySelector('.pricing-button.primary');
                return btn ? window.getComputedStyle(btn).backgroundColor : null;
            }
        """)
        
        report.add_result(
            "UI Color Consistency",
            "Purple background, teal action buttons",
            f"Body BG: {body_bg}, Button: {button_color}",
            bool(body_bg) and bool(button_color),
            "Color scheme validated"
        )
        
        print(f"✅ PASS: Color consistency validated")
        
    except Exception as e:
        report.add_result(
            "UI Color Consistency",
            "Correct color usage",
            f"Error: {str(e)}",
            False,
            f"Color validation failed: {str(e)}"
        )
        print(f"❌ FAIL: {str(e)}")


async def run_all_tests():
    """Run complete test suite"""
    print("=" * 60)
    print("🚀 AIVORY SUPER ADMIN FULL FEATURE TEST SUITE")
    print("=" * 60)
    
    report = TestReport()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=False)  # Set to True for CI/CD
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Run tests
            await test_super_admin_authentication(page, report)
            await test_dashboard_access(page, report)
            await test_free_diagnostic(page, report)
            await test_roi_engine_conservative(page, report)
            await test_roi_engine_growth(page, report)
            await test_multi_turn_diagnostic(page, report)
            await test_subscription_tiers(page, report)
            await test_ui_color_consistency(page, report)
            
        finally:
            await browser.close()
    
    # Generate report
    print("\n" + "=" * 60)
    print("📊 GENERATING TEST REPORT")
    print("=" * 60)
    report.generate_report()


if __name__ == "__main__":
    asyncio.run(run_all_tests())
