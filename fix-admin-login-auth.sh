#!/bin/bash

# Script to fix Aivory Admin login authentication issue on VPS
# The issue: signInWithPassword() doesn't return full user metadata
# Fix: Fetch complete user object after sign-in

VPS_HOST="aivory-vps"
VPS_PROJECT_PATH="/home/ubuntu/aivory"

echo "============================================="
echo "Fixing Aivory Admin Login on VPS"
echo "============================================="
echo ""

# Create a temporary script to run on VPS
cat > /tmp/fix-login-route.js << 'EOFSCRIPT'
const fs = require('fs');
const path = require('path');

const loginRoutePath = '/home/ubuntu/aivory/aivory-admin/src/app/api/auth/login/route.ts';

console.log('Reading login route...');
let content = fs.readFileSync(loginRoutePath, 'utf8');

// Check if already fixed
if (content.includes('Fetch full user object to get complete metadata')) {
    console.log('✅ Already fixed - no changes needed');
    process.exit(0);
}

console.log('Applying fix...');

// Replace the broken section with fixed version
const oldCode = `  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Resolve account_type — check user_metadata first, then app_metadata
  const accountType: string | undefined =
    data.user.user_metadata?.account_type ??
    data.user.app_metadata?.account_type;

  if (!accountType || !ALLOWED_ACCOUNT_TYPES.includes(accountType)) {
    // Sign out the Supabase session immediately — this user has no admin access
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "insufficient_permissions" },
      { status: 403 }
    );
  }`;

const newCode = `  // Authenticate with Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.session || !data.user) {
    return NextResponse.json(
      { error: "Invalid email or password" },
      { status: 401 }
    );
  }

  // Fetch full user object to get complete metadata
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) {
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "Failed to fetch user data" },
      { status: 500 }
    );
  }

  // Resolve account_type — check user_metadata first, then app_metadata
  const accountType: string | undefined =
    userData.user.user_metadata?.account_type ??
    userData.user.app_metadata?.account_type;

  if (!accountType || !ALLOWED_ACCOUNT_TYPES.includes(accountType)) {
    // Sign out the Supabase session immediately — this user has no admin access
    await supabase.auth.signOut();
    return NextResponse.json(
      { error: "insufficient_permissions" },
      { status: 403 }
    );
  }`;

if (!content.includes(oldCode)) {
    console.log('❌ Could not find the pattern to replace');
    console.log('File may already be modified or has different formatting');
    process.exit(1);
}

content = content.replace(oldCode, newCode);

fs.writeFileSync(loginRoutePath, content, 'utf8');
console.log('✅ Fix applied successfully');
console.log('File updated: ' + loginRoutePath);
EOFSCRIPT

echo "Uploading fix script to VPS..."
scp -o StrictHostKeyChecking=no /tmp/fix-login-route.js ${VPS_HOST}:/tmp/

echo ""
echo "Executing fix on VPS..."
ssh ${VPS_HOST} << 'EOF'
cd /home/ubuntu/aivory
node /tmp/fix-login-route.js
EOF

echo ""
echo "Restarting aivory-admin on VPS..."
ssh ${VPS_HOST} 'cd /home/ubuntu/aivory && pm2 restart aivory-admin'

echo ""
echo "============================================="
echo "Fix deployment complete!"
echo "============================================="
echo ""
echo "✅ VPS file updated"
echo "✅ aivory-admin restarted"
echo ""
echo "Test login at: https://admin.aivory.id/login"
echo "   Email: irfan.reichmann@aivory.id"
echo "   Password: (your Supabase password)"
echo ""
