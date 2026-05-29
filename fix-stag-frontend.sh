#!/bin/bash
# Fix stag-frontend dashboard URL
# Run on VPS: bash fix-stag-frontend.sh

set -e

echo "============================================================"
echo "  Fixing stag-frontend Dashboard URL"
echo "============================================================"

cd /home/ubuntu/stag-frontend/frontend

# Backup the original files
cp index.html index.html.backup
cp index_embedded.html index_embedded.html.backup
cp workflows.html workflows.html.backup
cp settings.html settings.html.backup
cp logs.html logs.html.backup

echo "✓ Backed up original files"

# Replace app.aivory.id with dashboard.aivory.id in the DASHBOARD_URL configuration
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' index.html
sed -i 's|window.location.protocol}//app.aivory.id|window.location.protocol}//dashboard.aivory.id|g' index_embedded.html

echo "✓ Fixed DASHBOARD_URL to use dashboard.aivory.id"

# Verify the fix
echo ""
echo "Verifying fix..."
grep 'dashboard.aivory.id' index.html | head -3 || echo "⚠ No dashboard.aivory.id found in index.html"
grep 'app.aivory.id' index.html | head -3 || echo "✓ No app.aivory.id found in index.html (good!)"

echo ""
echo "============================================================"
echo "  ✅  Fix complete!"
echo "============================================================"
echo ""
echo "To verify, run: curl -s https://stag.aivory.id/ | grep -o 'dashboard.aivory.id'"
