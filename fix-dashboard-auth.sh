#!/bin/bash
# Fix Dashboard Authentication Issues
# 1. Auth state not shared between domains
# 2. Login button dead in dashboard

set -e

echo "============================================================"
echo "  Fixing Dashboard Authentication"
echo "============================================================"

# ── 1. Fix auth-manager.js to use cookies ─────────────────────────────────────
echo ""
echo "▶ [1/3] Updating auth-manager.js to use cookies..."
cd /home/ubuntu/stag-frontend/frontend

# Backup
cp auth-manager.js auth-manager.js.backup

# Create new auth-manager.js with cookie support
cat > auth-manager.js << 'ENDAUTH'
/**
 * Authentication Manager - Cookie-based
 */

const aivoryCookie = {
  set: function(name, value, days = 7) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + ';expires=' + expires.toUTCString() + ';path=/;domain=.aivory.id;SameSite=None;Secure';
  },
  get: function(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i].trim();
      if (c.indexOf(nameEQ) === 0) {
        try {
          return JSON.parse(decodeURIComponent(c.substring(nameEQ.length)));
        } catch (e) { return null; }
      }
    }
    return null;
  },
  remove: function(name) {
    document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;domain=.aivory.id;';
  }
};

const AUTH_KEYS = {
  SESSION_TOKEN: "aivory_session_token",
  REFRESH_TOKEN: "aivory_refresh_token",
  USER: "aivory_user",
};

let currentUser = null;
let authStateListeners = [];

function initAuthState() {
  console.log("AuthManager: Initializing...");
  const token = getAccessToken();
  const user = aivoryCookie.get(AUTH_KEYS.USER);
  
  if (token && user) {
    currentUser = user;
    console.log("✓ Auth state restored from cookie:", currentUser.email);
    notifyAuthStateChange();
  } else {
    console.log("ℹ️ No stored auth state found");
  }
  window.AuthManagerReady = true;
  console.log("✓ AuthManager ready");
}

function clearAuthState() {
  currentUser = null;
  aivoryCookie.remove(AUTH_KEYS.SESSION_TOKEN);
  aivoryCookie.remove(AUTH_KEYS.REFRESH_TOKEN);
  aivoryCookie.remove(AUTH_KEYS.USER);
  console.log("✓ Auth data cleared");
  notifyAuthStateChange();
}

function onAuthStateChange(callback) {
  authStateListeners.push(callback);
  callback(currentUser);
}

function notifyAuthStateChange() {
  authStateListeners.forEach((callback) => callback(currentUser));
}

function getAccessToken() {
  return aivoryCookie.get(AUTH_KEYS.SESSION_TOKEN);
}

function getRefreshToken() {
  return aivoryCookie.get(AUTH_KEYS.REFRESH_TOKEN);
}

function storeTokens(accessToken, refreshToken) {
  if (!accessToken || typeof accessToken !== "string" || accessToken.trim() === "") {
    console.error("❌ Invalid access token");
    return false;
  }
  aivoryCookie.set(AUTH_KEYS.SESSION_TOKEN, accessToken);
  if (refreshToken) aivoryCookie.set(AUTH_KEYS.REFRESH_TOKEN, refreshToken);
  console.log("✓ Session token stored in cookie");
  return true;
}

function setTokens(accessToken, refreshToken) {
  return storeTokens(accessToken, refreshToken);
}

function storeUser(user) {
  currentUser = user;
  aivoryCookie.set(AUTH_KEYS.USER, user);
  console.log("✓ User data stored in cookie:", user.email);
  notifyAuthStateChange();
}

function setUser(user) {
  storeUser(user);
}

async function refreshAccessToken() {
  const refreshToken = getRefreshToken();
  if (!refreshToken) throw new Error("No refresh token available");
  
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    
    if (!response.ok) throw new Error("Token refresh failed");
    const data = await response.json();
    storeTokens(data.access_token, data.refresh_token);
    console.log("✓ Access token refreshed");
    return data.access_token;
  } catch (error) {
    console.error("Token refresh failed:", error);
    clearAuthState();
    throw error;
  }
}

async function authenticatedFetch(url, options = {}) {
  let accessToken = getAccessToken();
  if (!accessToken) {
    console.error("❌ Cannot make authenticated request: No token");
    throw new Error("Not authenticated");
  }
  
  options.headers = { ...options.headers, Authorization: `Bearer ${accessToken}` };
  console.log(`→ Making authenticated request to ${url}`);
  
  let response = await fetch(url, options);
  
  if (response.status === 401) {
    console.error("❌ 401 Unauthorized - Token invalid or expired");
    try {
      accessToken = await refreshAccessToken();
      options.headers["Authorization"] = `Bearer ${accessToken}`;
      response = await fetch(url, options);
      console.log("✓ Request retried with refreshed token");
    } catch (error) {
      clearAuthState();
      throw new Error("Authentication failed");
    }
  }
  
  if (!response.ok) {
    console.error(`❌ Request failed with status ${response.status}`);
  } else {
    console.log(`✓ Request successful (${response.status})`);
  }
  
  return response;
}

async function register(email, password, companyName = null) {
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, company_name: companyName }),
    });
    
    if (!response.ok) {
      let errorMsg = "Registration failed";
      try { const error = await response.json(); errorMsg = error.detail || errorMsg; }
      catch (e) { try { const text = await response.text(); if (text) errorMsg = text; } catch (e2) {} }
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    storeTokens(data.tokens.access_token, data.tokens.refresh_token);
    storeUser(data.user);
    await migrateLocalStorageIds();
    console.log("✓ User registered:", data.user.email);
    return data.user;
  } catch (error) {
    console.error("Registration failed:", error);
    throw error;
  }
}

async function login(email, password) {
  try {
    const response = await fetch(`${window.API_BASE_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (!response.ok) {
      let errorMsg = "Login failed";
      try { const error = await response.json(); errorMsg = error.detail || errorMsg; }
      catch (e) { try { const text = await response.text(); if (text) errorMsg = text; } catch (e2) {} }
      throw new Error(errorMsg);
    }
    
    const data = await response.json();
    storeTokens(data.tokens.access_token, data.tokens.refresh_token);
    storeUser(data.user);
    await migrateLocalStorageIds();
    console.log("✓ User logged in:", data.user.email);
    return data.user;
  } catch (error) {
    console.error("Login failed:", error);
    throw error;
  }
}

async function logout() {
  const refreshToken = getRefreshToken();
  if (refreshToken) {
    try {
      await fetch(`${window.API_BASE_URL}/api/v1/auth/logout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
    } catch (error) { console.error("Logout request failed:", error); }
  }
  clearAuthState();
  console.log("✓ User logged out");
}

async function getCurrentUser() {
  try {
    const response = await authenticatedFetch(`${window.API_BASE_URL}/api/v1/auth/me`);
    if (!response.ok) throw new Error("Failed to get user info");
    const user = await response.json();
    storeUser(user);
    return user;
  } catch (error) {
    console.error("Failed to get current user:", error);
    clearAuthState();
    return null;
  }
}

function isAuthenticated() {
  return !!currentUser && !!getAccessToken();
}

function getUser() { return currentUser; }
function getUserId() { return currentUser ? currentUser.user_id : null; }
function isSuperAdmin() { return currentUser && currentUser.account_type === "superadmin"; }

function isAdmin() {
  if (!currentUser) return false;
  const adminTypes = ["superadmin", "admin", "employee"];
  return adminTypes.includes(currentUser.account_type) || adminTypes.includes(currentUser.role);
}

function getRedirectUrl() {
  if (isAdmin()) return "https://admin.aivory.id";
  return "https://dashboard.aivory.id";
}

async function migrateLocalStorageIds() {
  if (!isAuthenticated()) return;
  let diagnosticId = null, snapshotId = null, blueprintId = null;
  
  if (typeof IDChainManager !== "undefined") {
    diagnosticId = IDChainManager.getDiagnosticId();
    snapshotId = IDChainManager.getSnapshotId();
    blueprintId = IDChainManager.getBlueprintId();
  } else {
    diagnosticId = localStorage.getItem("aivory_diagnostic_id");
    snapshotId = localStorage.getItem("aivory_snapshot_id");
    blueprintId = localStorage.getItem("aivory_blueprint_id");
  }
  
  if (!diagnosticId && !snapshotId && !blueprintId) return;
  
  try {
    const response = await authenticatedFetch(
      `${window.API_BASE_URL}/api/v1/auth/migrate-ids?` +
        (diagnosticId ? `diagnostic_id=${diagnosticId}&` : "") +
        (snapshotId ? `snapshot_id=${snapshotId}&` : "") +
        (blueprintId ? `blueprint_id=${blueprintId}` : ""),
      { method: "POST" }
    );
    if (response.ok) {
      const result = await response.json();
      console.log("✓ IDs migrated to user account:", result.migrated);
    }
  } catch (error) { console.error("ID migration failed:", error); }
}

function requireAuth(redirectUrl = null) {
  if (!isAuthenticated()) {
    if (typeof showLoginModal === "function") showLoginModal();
    else alert("Please log in to continue");
    return false;
  }
  return true;
}

function canAccessPaidFeature() {
  if (!isAuthenticated()) return false;
  if (isSuperAdmin()) return true;
  return currentUser.account_type === "paid";
}

const AuthManager = {
  init: initAuthState,
  register, login, logout, getCurrentUser,
  isAuthenticated, getUser, getUserId, isSuperAdmin, isAdmin, getRedirectUrl, onAuthStateChange,
  getAccessToken, getRefreshToken, setTokens, setUser, refreshAccessToken, authenticatedFetch,
  migrateLocalStorageIds, requireAuth, canAccessPaidFeature,
};

window.AuthManager = AuthManager;

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initAuthState);
} else { initAuthState(); }

if (typeof module !== "undefined" && module.exports) { module.exports = AuthManager; }
ENDAUTH

echo "✓ Updated auth-manager.js with cookie support"

# ── 2. Update handleDashboardClick to pass auth token ─────────────────────────
echo ""
echo "▶ [2/3] Updating handleDashboardClick function..."
sed -i 's|window.location.href = `${DASHBOARD_URL}/dashboard`;|const token = AuthManager.getAccessToken();\n          const redirectUrl = AuthManager.getRedirectUrl();\n          window.location.href = `${redirectUrl}/dashboard?auth_token=${encodeURIComponent(token)};|g' index.html

echo "✓ Updated handleDashboardClick function"

# ── 3. Restart stag-frontend container ────────────────────────────────────────
echo ""
echo "▶ [3/3] Restarting stag-frontend container..."
cd /home/ubuntu/stag-frontend
docker compose down --remove-orphans
docker compose up -d
echo "✓ Restarted stag-frontend container"

echo ""
echo "============================================================"
echo "  ✅  Fix complete!"
echo "============================================================"
