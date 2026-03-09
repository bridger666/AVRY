# Phase 4 Testing Guide

## Quick Start

### 1. Open Test Page
```bash
# Open in browser
open frontend/test-phase4.html
# or
http://localhost:8000/frontend/test-phase4.html
```

### 2. Run Full Diagnostic Flow
```bash
# Open main page
open frontend/index.html
# or
http://localhost:8000/frontend/index.html
```

## Detailed Testing Procedures

### Typography Testing

#### Test 1: Score Number Display
**Location**: Results page after completing diagnostic

**Expected**:
- Font: Inter Tight
- Weight: 300
- Size: 5rem
- Color: White
- Clean, readable appearance

**Steps**:
1. Complete free diagnostic
2. View results page
3. Check score number (e.g., "58")
4. Verify font weight is light (300)
5. Verify size is large (5rem)

**Pass Criteria**: ✅ Score displays with Inter Tight 300, 5rem

#### Test 2: Category Label
**Location**: Results page below score number

**Expected**:
- Font: Inter Tight
- Weight: 200 (extra light)
- Size: 1.75rem
- Color: White

**Steps**:
1. View results page
2. Check category label (e.g., "AI Ready")
3. Verify font weight is extra light (200)
4. Verify size is 1.75rem

**Pass Criteria**: ✅ Category displays with Inter Tight 200, 1.75rem

#### Test 3: Description Text
**Location**: Results page below category

**Expected**:
- Font: Inter Tight
- Weight: 200
- Opacity: 95%

**Steps**:
1. View results page
2. Check category explanation text
3. Verify font weight is 200
4. Verify text is slightly transparent

**Pass Criteria**: ✅ Description uses Inter Tight 200

### Badge Testing

#### Test 4: Badge Background Color
**Location**: Results page badge section

**Expected**:
- Background: Brand purple (#4F2D9E)
- No light blue color
- Consistent across all scores

**Steps**:
1. Complete diagnostic with different scores
2. Check badge background color
3. Verify it's always brand purple
4. No color variation by category

**Pass Criteria**: ✅ Badge always uses #4F2D9E background

#### Test 5: Badge Logo
**Location**: Bottom center of badge

**Expected**:
- Aivory logo image (not text)
- Centered at bottom
- Width: ~80px
- Visible and clear

**Steps**:
1. View badge on results page
2. Check bottom center for logo
3. Verify it's an image, not text
4. Check size and positioning

**Pass Criteria**: ✅ Logo appears at bottom center, ~80px wide

#### Test 6: Badge Typography
**Location**: Badge text elements

**Expected**:
- Score: Inter Tight 300, 72px
- Category: Inter Tight 200, 24px
- Subtitle: Inter Tight 200, 14px, 70% opacity

**Steps**:
1. Inspect badge SVG
2. Check score number font
3. Check category label font
4. Check "Diagnostic Score" subtitle

**Pass Criteria**: ✅ All text uses Inter Tight with correct weights

#### Test 7: Badge Download
**Location**: Download badge button

**Expected**:
- Button works
- Downloads PNG file
- Badge renders correctly in PNG
- Logo included in download

**Steps**:
1. Click "Download Badge" button
2. Check downloaded file
3. Open PNG in image viewer
4. Verify all elements present

**Pass Criteria**: ✅ Badge downloads as PNG with all elements

### Upsell Section Testing

#### Test 8: Desktop Layout
**Location**: Results page upsell section

**Expected**:
- Two cards side-by-side
- Grid layout: 1fr 1fr
- Gap: 24px
- Max-width: 900px
- Centered

**Steps**:
1. View results page on desktop (>768px)
2. Scroll to upsell section
3. Verify two cards side-by-side
4. Check spacing between cards
5. Verify container width

**Pass Criteria**: ✅ Cards display side-by-side with proper spacing

#### Test 9: Card Styling
**Location**: Upsell cards

**Expected**:
- Background: rgba(255, 255, 255, 0.06)
- Border: 1px solid rgba(255, 255, 255, 0.12)
- Border radius: 16px
- Padding: 40px 32px
- Text align: left

**Steps**:
1. Inspect upsell cards
2. Check background color
3. Check border styling
4. Check padding
5. Verify text alignment

**Pass Criteria**: ✅ Cards match pricing section styling

#### Test 10: Featured Card Badge
**Location**: Blueprint card (right side)

**Expected**:
- "BEST VALUE" badge at top
- Teal background (#00ffc0)
- Purple text (#4020a5)
- Centered above card
- Matches "MOST POPULAR" style

**Steps**:
1. View Blueprint card
2. Check for badge at top
3. Verify badge styling
4. Compare to pricing page badges

**Pass Criteria**: ✅ Badge displays correctly on Blueprint card

#### Test 11: Card Content Structure
**Location**: Inside each card

**Expected Order** (top to bottom):
1. Product name (Inter Tight 300, 1.1rem, 80% opacity)
2. Price (Inter Tight 300, 3rem)
3. Context text (Inter Tight 200, 0.9rem, 70% opacity, NOT italic)
4. Description (Inter Tight 200, 0.85rem, 60% opacity)
5. Button (full width, teal)

**Steps**:
1. Check card content order
2. Verify typography for each element
3. Check that context is NOT italic
4. Verify button is full width

**Pass Criteria**: ✅ Content follows correct structure and typography

#### Test 12: Hover Effects
**Location**: Upsell cards

**Expected**:
- Card lifts on hover (translateY(-2px))
- Background brightens
- Border brightens
- Smooth transition (0.25s)

**Steps**:
1. Hover over Snapshot card
2. Hover over Blueprint card
3. Check lift effect
4. Check color changes
5. Verify smooth animation

**Pass Criteria**: ✅ Cards have proper hover effects

#### Test 13: Button Functionality
**Location**: Card buttons

**Expected**:
- Snapshot button calls startSnapshot()
- Blueprint button calls startBlueprint()
- Buttons are clickable
- Hover effect (brighter teal, lift, shadow)

**Steps**:
1. Click "Run AI Snapshot — $15"
2. Verify function is called
3. Click "Generate Blueprint — $79"
4. Verify function is called
5. Check hover effects

**Pass Criteria**: ✅ Buttons work and have proper effects

#### Test 14: Personalized Context
**Location**: Context text in cards

**Expected** (changes by score):
- Score ≤40: Foundation messaging
- Score 41-60: Momentum messaging
- Score 61-80: Optimization messaging
- Score >80: Competitive advantage messaging

**Steps**:
1. Complete diagnostic with score 40
2. Check context text
3. Repeat with scores 60, 80, 95
4. Verify text changes appropriately

**Pass Criteria**: ✅ Context text adapts to score

### Mobile Testing

#### Test 15: Mobile Layout
**Location**: Results page on mobile (<768px)

**Expected**:
- Cards stack vertically
- Blueprint card appears FIRST
- Snapshot card appears second
- Padding: 32px 24px
- Price: 2.5rem

**Steps**:
1. Resize browser to <768px
2. View upsell section
3. Verify cards stack
4. Check card order
5. Check padding and font sizes

**Pass Criteria**: ✅ Mobile layout works correctly

#### Test 16: Mobile Typography
**Location**: Mobile view

**Expected**:
- All text remains readable
- No overflow issues
- Proper line breaks
- Buttons remain full width

**Steps**:
1. View on mobile device
2. Check all text elements
3. Verify no horizontal scroll
4. Check button sizing

**Pass Criteria**: ✅ Typography works on mobile

### Browser Compatibility

#### Test 17: Chrome/Edge
**Steps**:
1. Open in Chrome or Edge
2. Run all tests above
3. Check for any issues

**Pass Criteria**: ✅ Works in Chrome/Edge

#### Test 18: Firefox
**Steps**:
1. Open in Firefox
2. Run all tests above
3. Check for any issues

**Pass Criteria**: ✅ Works in Firefox

#### Test 19: Safari
**Steps**:
1. Open in Safari
2. Run all tests above
3. Check for any issues
4. Check font rendering

**Pass Criteria**: ✅ Works in Safari

### Integration Testing

#### Test 20: Full Diagnostic Flow
**Steps**:
1. Start from homepage
2. Click "Start free diagnostic"
3. Answer all 12 questions
4. Submit diagnostic
5. View results page
6. Check all elements:
   - Score display
   - Category label
   - Badge
   - Upsell section
7. Test email save
8. Test badge download
9. Click upsell buttons

**Pass Criteria**: ✅ Complete flow works end-to-end

## Test Results Template

```
Date: ___________
Tester: ___________
Browser: ___________
Device: ___________

Typography Tests:
[ ] Test 1: Score Number - PASS/FAIL
[ ] Test 2: Category Label - PASS/FAIL
[ ] Test 3: Description Text - PASS/FAIL

Badge Tests:
[ ] Test 4: Background Color - PASS/FAIL
[ ] Test 5: Logo - PASS/FAIL
[ ] Test 6: Typography - PASS/FAIL
[ ] Test 7: Download - PASS/FAIL

Upsell Tests:
[ ] Test 8: Desktop Layout - PASS/FAIL
[ ] Test 9: Card Styling - PASS/FAIL
[ ] Test 10: Featured Badge - PASS/FAIL
[ ] Test 11: Content Structure - PASS/FAIL
[ ] Test 12: Hover Effects - PASS/FAIL
[ ] Test 13: Button Functionality - PASS/FAIL
[ ] Test 14: Personalized Context - PASS/FAIL

Mobile Tests:
[ ] Test 15: Mobile Layout - PASS/FAIL
[ ] Test 16: Mobile Typography - PASS/FAIL

Browser Tests:
[ ] Test 17: Chrome/Edge - PASS/FAIL
[ ] Test 18: Firefox - PASS/FAIL
[ ] Test 19: Safari - PASS/FAIL

Integration:
[ ] Test 20: Full Flow - PASS/FAIL

Issues Found:
_________________________________
_________________________________
_________________________________
```

## Known Issues

None currently identified.

## Next Steps After Testing

1. Fix any issues found
2. Update documentation
3. Create deployment checklist
4. Prepare for production deployment
