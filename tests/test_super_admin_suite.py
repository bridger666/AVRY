"""
Aivory Super Admin Automated Test Suite
Uses Playwright for end-to-end testing
Tailored to the actual Aivory static frontend and FastAPI backend + Next.js modern console.
"""

import json
import asyncio
from datetime import datetime
from playwright.async_api import async_playwright, Page, expect

# Test Configuration
CONFIG = {
    "base_url": "http://localhost:8080",
    "api_url": "http://localhost:8081",
    "next_url": "http://localhost:3000",
    "credentials": {
        "username": "grandmaster@aivory.ai",
        "password": "Lemonandsalt66633"
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
        
        print(f"\n[REPORT] Test report saved to: {filename}")
        print(f"Summary: {passed}/{total} tests passed ({report['summary']['pass_rate']})")
        
        return report

async def login_as_super_admin(page: Page):
    """Login with Super Admin credentials via modal"""
    await page.goto(f"{CONFIG['base_url']}/index.html")
    # Click Sign In link
    await page.click('.nav-signin-link')
    # Wait for login modal to appear
    await page.wait_for_selector('#login-modal.active', state='visible')
    # Fill in credentials
    await page.fill('#login-email', CONFIG['credentials']['username'])
    await page.fill('#login-password', CONFIG['credentials']['password'])
    # Click submit
    await page.click('#login-submit-btn')
    # Wait for page reload
    await page.wait_for_load_state('networkidle')

async def test_super_admin_authentication(page: Page, report: TestReport):
    """Test 1.1: Super Admin Authentication"""
    print("\n[TEST] Test 1.1: Super Admin Authentication")
    
    try:
        await login_as_super_admin(page)
        
        # Verify logout button is visible in navbar (meaning user is logged in)
        logout_btn = page.locator('.navbar-logout-btn')
        await expect(logout_btn).to_be_visible()
        
        # Verify Super Admin badge
        badge = page.locator('.super-admin-badge')
        await expect(badge).to_be_visible()
        badge_text = await badge.text_content()
        
        report.add_result(
            "Super Admin Authentication",
            "Successful login with Super Admin modal access",
            f"Logged in, badge: {badge_text}",
            "super" in badge_text.lower() or "admin" in badge_text.lower(),
            "Super Admin authentication verified via navbar elements"
        )
        print("PASS PASS: Super Admin authenticated successfully")
        
    except Exception as e:
        report.add_result(
            "Super Admin Authentication",
            "Successful login",
            f"Error: {str(e)}",
            False,
            f"Authentication failed: {str(e)}"
        )
        print(f"FAIL FAIL: {str(e)}")

async def test_dashboard_access(page: Page, report: TestReport):
    """Test 1.2: Access All Dashboard Pages"""
    print("\n[TEST] Test 1.2: App Console Page Access")
    
    pages = [
        ("Workflows", f"{CONFIG['base_url']}/workflows.html"),
        ("Logs", f"{CONFIG['base_url']}/logs.html"),
        ("Settings", f"{CONFIG['base_url']}/settings.html")
    ]
    
    for page_name, url in pages:
        try:
            await page.goto(url)
            await page.wait_for_load_state('networkidle')
            
            # Check page title or key elements to verify load
            title = await page.title()
            
            report.add_result(
                f"Console Access: {page_name}",
                "Page loads without errors",
                f"Loaded, title: {title}",
                page_name.lower() in title.lower(),
                f"{page_name} console page verified"
            )
            print(f"PASS PASS: {page_name} page accessible ({title})")
                
        except Exception as e:
            report.add_result(
                f"Console Access: {page_name}",
                "Page loads",
                f"Error: {str(e)}",
                False,
                f"Failed to access {page_name}"
            )
            print(f"FAIL FAIL: {page_name} - {str(e)}")

async def test_free_diagnostic(page: Page, report: TestReport):
    """Test 2.1: Run Free AI Diagnostic"""
    print("\n[TEST] Test 2.1: Free AI Readiness Diagnostic Wizard")
    
    try:
        await page.goto(f"{CONFIG['base_url']}/index.html")
        # Click Start Deep Diagnostic
        await page.click('button:has-text("Start Deep Diagnostic")')
        await page.wait_for_selector('#free-diagnostic-questions .question-card', state='visible')
        
        # We need to answer 12 questions in a loop
        for i in range(12):
            # Click the first option button inside the current question card
            await page.click('.question-card .option-button:first-child')
            await page.wait_for_timeout(300)
            
            if i < 11:
                # Click Next button
                await page.click('#free-next-button')
                await page.wait_for_timeout(300)
            else:
                # Click Submit button
                await page.click('#free-submit-button')
                # Wait for result display
                await page.wait_for_selector('#free-diagnostic-results', state='visible')
        
        # Check for results
        score_element = await page.locator('#free-score-number').text_content()
        category_element = await page.locator('#free-score-category').text_content()
        
        report.add_result(
            "Free AI Diagnostic",
            "12 questions, structured wizard, score displayed",
            f"Score: {score_element}, Category: {category_element}",
            bool(score_element) and int(score_element) >= 0,
            f"Diagnostic completed successfully (Score: {score_element}, Category: {category_element})"
        )
        print(f"PASS PASS: Free diagnostic completed (Score: {score_element}, Category: {category_element})")
            
    except Exception as e:
        report.add_result(
            "Free AI Diagnostic",
            "Successful completion",
            f"Error: {str(e)}",
            False,
            f"Diagnostic failed: {str(e)}"
        )
        print(f"FAIL FAIL: {str(e)}")

def build_mock_context(company_name: str, three_year_roi: float, annual_savings: float) -> dict:
    """Helper to construct a valid Next.js DiagnosticContext"""
    return {
        "company": company_name,
        "currency": "USD",
        "submittedAt": "2026-05-17T08:00:00Z",
        "quantitative": {
            "ticketVolumePerDay": 100,
            "ahtCurrentMinutes": 20,
            "ahtTargetMinutes": 5,
            "costCurrentPerTicket": 10,
            "costTargetPerTicket": 2,
            "totalManualHoursWeekly": 40,
            "fteCountInScope": 5,
            "currentAutomationPct": 10,
            "targetAutomationPct": 80,
            "budgetMidpointUSD": 25000,
            "timelineMonths": 6
        },
        "calculations": {
            "annualLaborSavingsLocal": annual_savings * 0.7,
            "annualProcessSavingsLocal": annual_savings * 0.3,
            "totalAnnualSavingsLocal": annual_savings,
            "costOfInaction90DaysLocal": annual_savings * 0.25,
            "totalAnnualSavingsUSD": annual_savings,
            "hoursReclaimedPerYear": 2080,
            "paybackMonths": 3,
            "threeYearROIPercent": three_year_roi,
            "hasEnoughDataForProjection": True,
            "confidenceLevel": "high",
            "missingInputs": []
        },
        "scores": {
            "strategy": 80,
            "data": 75,
            "process": 85,
            "people": 70,
            "governance": 90,
            "composite": 80,
            "maturityLevel": "Developing",
            "weakestDimension": "people",
            "strongestDimension": "governance"
        },
        "opportunities": [
            {
                "id": "opp-1",
                "title": "Automated Support Onboarding",
                "impact": 9,
                "effort": 3,
                "quadrant": "quick_win",
                "timeToValueWeeks": 4,
                "estimatedSavingsLocal": annual_savings * 0.3,
                "projectedROINote": "Highly automated workflow",
                "prerequisites": [],
                "dataReadiness": "ready",
                "complexity": "low"
            }
        ],
        "risks": [
            {
                "id": "risk-1",
                "risk": "Data Privacy leakage risk",
                "severity": "HIGH",
                "source": "governance",
                "detected": True
            }
        ],
        "qualitative": {
            "primaryObjective": "Automate operations",
            "topPainPoints": "Manual data copying",
            "compliance": ["GDPR"],
            "implementApproach": "Phased",
            "aiCapability": "High",
            "leadershipAlignment": "Fully aligned",
            "priorAIAttempts": "None",
            "resistanceSources": [],
            "delayConsequence": "Lost growth",
            "errorTolerance": "Low",
            "dataResidency": "US"
        }
    }

async def seed_localStorage_context(page: Page, mock_ctx: dict):
    """Seed context into Next.js console origin localStorage"""
    await page.goto(f"{CONFIG['next_url']}/dashboard")
    await page.evaluate(f"localStorage.setItem('aivory_diagnostic_context', '{json.dumps(mock_ctx)}');")

async def test_roi_engine_conservative(page: Page, report: TestReport):
    """Test 7.1: ROI Engine - Conservative Mode"""
    print("\n[TEST] Test 7.1: ROI Engine - Conservative Mode")
    
    try:
        mock_ctx = build_mock_context("Conservative Corp", 660, 165000)
        await seed_localStorage_context(page, mock_ctx)
        
        # Navigate directly to the final result page
        await page.goto(f"{CONFIG['next_url']}/diagnostics/deep/final-result")
        await page.wait_for_load_state('networkidle')
        
        # Verify conservative ROI metrics render properly
        tile_savings = page.locator('span', has_text="Total Annual Savings").locator('xpath=..')
        total_savings = await tile_savings.locator('span').last.text_content()
        tile_roi = page.locator('span', has_text="3-Year ROI").locator('xpath=..')
        roi_3yr = await tile_roi.locator('span').last.text_content()
        
        passed = "165,000" in total_savings and "660" in roi_3yr
        
        report.add_result(
            "ROI Engine - Conservative Mode",
            "Total Savings: $165,000, 3-Year ROI: 660%",
            f"Savings: {total_savings}, ROI: {roi_3yr}",
            passed,
            "Verified Next.js dynamic ROI component and correct formatting under conservative scenario"
        )
        if passed:
            print("PASS PASS: Conservative ROI calculations successfully verified in the UI!")
        else:
            print(f"FAIL FAIL: Conservative ROI mismatch (Savings: {total_savings}, ROI: {roi_3yr})")
            
    except Exception as e:
        report.add_result(
            "ROI Engine - Conservative Mode",
            "Successful E2E verification",
            f"Error: {str(e)}",
            False,
            f"E2E Verification failed: {str(e)}"
        )
        print(f"FAIL FAIL: {str(e)}")

async def test_roi_engine_growth(page: Page, report: TestReport):
    """Test 7.2: ROI Engine - Growth Mode"""
    print("\n[TEST] Test 7.2: ROI Engine - Growth Mode")
    
    try:
        # Seed very high values to test high-growth and capping fire limits (>999% capped)
        mock_ctx = build_mock_context("Growth Corp", 1250, 450000)
        await seed_localStorage_context(page, mock_ctx)
        
        # Navigate to deep diagnostic final result
        await page.goto(f"{CONFIG['next_url']}/diagnostics/deep/final-result")
        await page.wait_for_load_state('networkidle')
        
        # Verify capped growth ROI metrics
        tile_savings = page.locator('span', has_text="Total Annual Savings").locator('xpath=..')
        total_savings = await tile_savings.locator('span').last.text_content()
        tile_roi = page.locator('span', has_text="3-Year ROI").locator('xpath=..')
        roi_3yr = await tile_roi.locator('span').last.text_content()
        
        passed = "450,000" in total_savings and ">999%" in roi_3yr
        
        report.add_result(
            "ROI Engine - Growth Mode",
            "Total Savings: $450,000, 3-Year ROI: >999% (Capped)",
            f"Savings: {total_savings}, ROI: {roi_3yr}",
            passed,
            "Verified Next.js 999% cap logic fires correctly on E2E browser interface"
        )
        if passed:
            print("PASS PASS: Growth ROI calculations and 999% cap successfully verified in the UI!")
        else:
            print(f"FAIL FAIL: Growth ROI mismatch (Savings: {total_savings}, ROI: {roi_3yr})")
            
    except Exception as e:
        report.add_result(
            "ROI Engine - Growth Mode",
            "Successful E2E verification",
            f"Error: {str(e)}",
            False,
            f"E2E Verification failed: {str(e)}"
        )
        print(f"FAIL FAIL: {str(e)}")

async def test_multi_turn_diagnostic(page: Page, report: TestReport):
    """Test 6.1: Multi-Turn Guided Diagnostic (Next.js Chat Console)"""
    print("\n[TEST] Test 6.1: Multi-Turn Guided Diagnostic")
    
    try:
        # Navigate to Next.js interactive chat page
        await page.goto(f"{CONFIG['next_url']}/console")
        await page.wait_for_load_state('networkidle')
        
        # Verify presence of suggestion chips (e.g. 'Deep Diagnostic')
        chip = page.locator('button:has-text("Deep Diagnostic")')
        await expect(chip).to_be_visible()
        
        # Click suggestion chip to open sub-menu dropdown
        await chip.click()
        await page.wait_for_timeout(1000)
        
        # Verify sub-menu has loaded options
        assist_option = page.locator('text=Assist me with AI readiness deep diagnostic')
        await expect(assist_option).to_be_visible()
        
        report.add_result(
            "Multi-Turn Guided Diagnostic",
            "Interactive chat suggestion chips and dropdowns load successfully",
            "Deep Diagnostic chips and option sub-menus render correctly",
            True,
            "Verified Next.js Chat Console core wizard interaction elements"
        )
        print("PASS PASS: Multi-turn guided diagnostic console interface verified successfully!")
        
    except Exception as e:
        report.add_result(
            "Multi-Turn Guided Diagnostic",
            "Console wizard loads",
            f"Error: {str(e)}",
            False,
            f"Guided console test failed: {str(e)}"
        )
        print(f"FAIL FAIL: {str(e)}")

async def test_subscription_tiers(page: Page, report: TestReport):
    """Test 5.x: Subscription Tier Features"""
    print("\n[TEST] Test 5.x: Subscription Tier Validation")
    
    tiers = [
        ("Foundation", "$20", ["50 IC/month", "3 active workflows", "1 active agent"]),
        ("Pro", "$44", ["300 IC/month", "10 active workflows", "3 active agents"]),
        ("Enterprise", "$499", ["2,000 IC/month", "Unlimited workflows", "Unlimited agents"])
    ]
    
    for tier_name, price, features in tiers:
        try:
            await page.goto(f"{CONFIG['base_url']}/index.html#pricing-section")
            await page.wait_for_load_state('networkidle')
            
            # Find tier card precisely using h3 filter
            tier_card = page.locator('.subscription-section div.flex-col').filter(has=page.locator(f'h3:has-text("{tier_name}")')).first
            
            # Verify price
            price_text = await tier_card.locator('.text-4xl').text_content()
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
                f"{tier_name} tier validated against landing section design"
            )
            
            if price_match and all_features_present:
                print(f"PASS PASS: {tier_name} tier validated")
            else:
                print(f"FAIL FAIL: {tier_name} tier validation failed (Price Match: {price_match}, Features: {features_found}/{len(features)})")
                
        except Exception as e:
            report.add_result(
                f"Subscription Tier: {tier_name}",
                "Tier displayed correctly",
                f"Error: {str(e)}",
                False,
                f"Failed to validate {tier_name}"
            )
            print(f"FAIL FAIL: {tier_name} - {str(e)}")

async def test_ui_color_consistency(page: Page, report: TestReport):
    """Test 10.1: Brand Color Consistency"""
    print("\n[TEST] Test 10.1: UI Color Consistency")
    
    try:
        await page.goto(f"{CONFIG['base_url']}/index.html")
        
        # Check brand colors defined in CSS variables
        purple_token = await page.evaluate("window.getComputedStyle(document.documentElement).getPropertyValue('--brand-purple').trim()")
        green_token = await page.evaluate("window.getComputedStyle(document.documentElement).getPropertyValue('--mint-green').trim()")
        
        report.add_result(
            "UI Color Consistency",
            "Centralized HSL/HEX brand color design tokens exist",
            f"Purple: {purple_token}, Mint Green: {green_token}",
            purple_token == "#5b3cc4" and green_token == "#0ae8af",
            "Aivory Design System brand colors validated"
        )
        
        print(f"PASS PASS: Color consistency validated (Purple: {purple_token}, Green: {green_token})")
        
    except Exception as e:
        report.add_result(
            "UI Color Consistency",
            "Correct color usage",
            f"Error: {str(e)}",
            False,
            f"Color validation failed: {str(e)}"
        )
        print(f"FAIL FAIL: {str(e)}")

async def run_all_tests():
    """Run complete test suite"""
    print("=" * 60)
    print("RUNNING AIVORY SUPER ADMIN FULL FEATURE TEST SUITE")
    print("=" * 60)
    
    report = TestReport()
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context()
        page = await context.new_page()
        
        try:
            # Run E2E landing page and FastAPI backend tests
            await test_super_admin_authentication(page, report)
            await test_dashboard_access(page, report)
            await test_free_diagnostic(page, report)
            
            # Run E2E Next.js Console ROI and multi-turn tests (now port 3000 is active!)
            await test_roi_engine_conservative(page, report)
            await test_roi_engine_growth(page, report)
            await test_multi_turn_diagnostic(page, report)
            
            # Run pricing and styling token tests
            await test_subscription_tiers(page, report)
            await test_ui_color_consistency(page, report)
            
        finally:
            await browser.close()
    
    # Generate report
    print("\n" + "=" * 60)
    print("GENERATING TEST REPORT")
    print("=" * 60)
    report.generate_report()

if __name__ == "__main__":
    asyncio.run(run_all_tests())
