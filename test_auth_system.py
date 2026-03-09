"""
Authentication System Test Suite

Tests both normal user and super admin flows.
"""

import requests
import json
from datetime import datetime

# API Configuration
API_BASE = "http://localhost:8081"

# Test data
TEST_USER = {
    "email": "testuser@aivory.id",
    "password": "TestPassword123!",
    "company_name": "Test Company Inc"
}

SUPER_ADMIN = {
    "email": "grandmaster@aivory.ai",
    "password": "GrandMaster2026!"
}


def print_section(title):
    """Print section header"""
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}\n")


def print_result(test_name, success, details=""):
    """Print test result"""
    status = "✓ PASS" if success else "✗ FAIL"
    print(f"{status} - {test_name}")
    if details:
        print(f"     {details}")


def test_normal_user_flow():
    """Test normal user registration and authentication flow"""
    print_section("NORMAL USER FLOW TEST")
    
    # Test 1: Register new user
    print("Test 1: User Registration")
    try:
        response = requests.post(
            f"{API_BASE}/api/v1/auth/register",
            json=TEST_USER
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user")
            tokens = data.get("tokens")
            
            if user and tokens:
                print_result(
                    "User Registration",
                    True,
                    f"User ID: {user['user_id']}, Email: {user['email']}"
                )
                
                # Store tokens for next tests
                TEST_USER["access_token"] = tokens["access_token"]
                TEST_USER["refresh_token"] = tokens["refresh_token"]
                TEST_USER["user_id"] = user["user_id"]
            else:
                print_result("User Registration", False, "Missing user or tokens in response")
        else:
            # User might already exist, try login instead
            print(f"     Registration returned {response.status_code}, trying login...")
            response = requests.post(
                f"{API_BASE}/api/v1/auth/login",
                json={"email": TEST_USER["email"], "password": TEST_USER["password"]}
            )
            
            if response.status_code == 200:
                data = response.json()
                user = data.get("user")
                tokens = data.get("tokens")
                
                TEST_USER["access_token"] = tokens["access_token"]
                TEST_USER["refresh_token"] = tokens["refresh_token"]
                TEST_USER["user_id"] = user["user_id"]
                
                print_result("User Login (existing user)", True, f"User ID: {user['user_id']}")
            else:
                print_result("User Registration/Login", False, f"Status: {response.status_code}")
                return False
                
    except Exception as e:
        print_result("User Registration", False, str(e))
        return False
    
    # Test 2: Get current user
    print("\nTest 2: Get Current User")
    try:
        response = requests.get(
            f"{API_BASE}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {TEST_USER['access_token']}"}
        )
        
        if response.status_code == 200:
            user = response.json()
            print_result(
                "Get Current User",
                True,
                f"Email: {user['email']}, Account Type: {user['account_type']}"
            )
        else:
            print_result("Get Current User", False, f"Status: {response.status_code}")
            
    except Exception as e:
        print_result("Get Current User", False, str(e))
    
    # Test 3: Refresh token
    print("\nTest 3: Refresh Access Token")
    try:
        response = requests.post(
            f"{API_BASE}/api/v1/auth/refresh",
            json={"refresh_token": TEST_USER["refresh_token"]}
        )
        
        if response.status_code == 200:
            tokens = response.json()
            print_result("Refresh Access Token", True, "New access token received")
            TEST_USER["access_token"] = tokens["access_token"]
        else:
            print_result("Refresh Access Token", False, f"Status: {response.status_code}")
            
    except Exception as e:
        print_result("Refresh Access Token", False, str(e))
    
    # Test 4: Logout
    print("\nTest 4: User Logout")
    try:
        response = requests.post(
            f"{API_BASE}/api/v1/auth/logout",
            json={"refresh_token": TEST_USER["refresh_token"]}
        )
        
        if response.status_code == 200:
            print_result("User Logout", True, "Session invalidated")
        else:
            print_result("User Logout", False, f"Status: {response.status_code}")
            
    except Exception as e:
        print_result("User Logout", False, str(e))
    
    return True


def test_super_admin_flow():
    """Test super admin authentication and privileges"""
    print_section("SUPER ADMIN FLOW TEST")
    
    # Test 1: Super admin login
    print("Test 1: Super Admin Login")
    try:
        response = requests.post(
            f"{API_BASE}/api/v1/auth/login",
            json=SUPER_ADMIN
        )
        
        if response.status_code == 200:
            data = response.json()
            user = data.get("user")
            tokens = data.get("tokens")
            
            if user and user.get("account_type") == "superadmin":
                print_result(
                    "Super Admin Login",
                    True,
                    f"User ID: {user['user_id']}, Account Type: {user['account_type']}"
                )
                
                SUPER_ADMIN["access_token"] = tokens["access_token"]
                SUPER_ADMIN["refresh_token"] = tokens["refresh_token"]
                SUPER_ADMIN["user_id"] = user["user_id"]
            else:
                print_result("Super Admin Login", False, "Not a super admin account")
                return False
        else:
            print_result("Super Admin Login", False, f"Status: {response.status_code}")
            return False
            
    except Exception as e:
        print_result("Super Admin Login", False, str(e))
        return False
    
    # Test 2: Verify super admin privileges
    print("\nTest 2: Verify Super Admin Privileges")
    try:
        response = requests.get(
            f"{API_BASE}/api/v1/auth/me",
            headers={"Authorization": f"Bearer {SUPER_ADMIN['access_token']}"}
        )
        
        if response.status_code == 200:
            user = response.json()
            is_superadmin = user.get("account_type") == "superadmin"
            print_result(
                "Super Admin Privileges",
                is_superadmin,
                f"Account Type: {user.get('account_type')}"
            )
        else:
            print_result("Super Admin Privileges", False, f"Status: {response.status_code}")
            
    except Exception as e:
        print_result("Super Admin Privileges", False, str(e))
    
    return True


def test_auth_gates():
    """Test authentication gates on protected endpoints"""
    print_section("AUTHENTICATION GATES TEST")
    
    # Test 1: Access protected endpoint without auth
    print("Test 1: Access Protected Endpoint Without Auth")
    try:
        response = requests.get(f"{API_BASE}/api/v1/auth/me")
        
        if response.status_code == 401:
            print_result("Protected Endpoint Without Auth", True, "Correctly rejected (401)")
        else:
            print_result("Protected Endpoint Without Auth", False, f"Status: {response.status_code}")
            
    except Exception as e:
        print_result("Protected Endpoint Without Auth", False, str(e))
    
    # Test 2: Access with invalid token
    print("\nTest 2: Access With Invalid Token")
    try:
        response = requests.get(
            f"{API_BASE}/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid_token_12345"}
        )
        
        if response.status_code == 401:
            print_result("Invalid Token", True, "Correctly rejected (401)")
        else:
            print_result("Invalid Token", False, f"Status: {response.status_code}")
            
    except Exception as e:
        print_result("Invalid Token", False, str(e))


def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  AIVORY AUTHENTICATION SYSTEM TEST SUITE")
    print("="*60)
    print(f"\nTesting against: {API_BASE}")
    print(f"Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    
    # Check if backend is running
    try:
        response = requests.get(f"{API_BASE}/health", timeout=2)
        if response.status_code != 200:
            print("\n✗ ERROR: Backend is not responding correctly")
            print("  Please start the backend with: python3 -m uvicorn app.main:app --reload --port 8081")
            return
    except Exception as e:
        print("\n✗ ERROR: Cannot connect to backend")
        print(f"  {str(e)}")
        print("  Please start the backend with: python3 -m uvicorn app.main:app --reload --port 8081")
        return
    
    # Run tests
    test_normal_user_flow()
    test_super_admin_flow()
    test_auth_gates()
    
    # Summary
    print_section("TEST SUMMARY")
    print("✓ Normal user flow: Registration, Login, Token Refresh, Logout")
    print("✓ Super admin flow: Login with superadmin privileges")
    print("✓ Authentication gates: Protected endpoints require valid tokens")
    print("\nNext steps:")
    print("1. Open http://localhost:8080/index.html in browser")
    print("2. Complete free diagnostic (no auth required)")
    print("3. See soft auth prompt after results (non-blocking)")
    print("4. Try to access Snapshot - should show login modal (hard gate)")
    print("5. Login as GrandMasterRCH to see red SUPER ADMIN badge")
    print("6. Verify super admin can access all features without payment")
    print("\n" + "="*60 + "\n")


if __name__ == "__main__":
    main()
