# Quick Start Testing Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Visual Test Page (Fastest)

```bash
# Open the test page in your browser
open frontend/test-phase4.html
```

**What you'll see:**
- Typography samples (score, category, description)
- Badge generation with different scores
- Upsell section with different contexts
- Interactive test buttons

**Quick checks:**
1. ✅ Fonts look clean and elegant (Inter Tight)
2. ✅ Badge has purple background with logo at bottom
3. ✅ Upsell cards are side-by-side (desktop)
4. ✅ "BEST VALUE" badge on Blueprint card
5. ✅ Hover effects work smoothly

---

### Option 2: Full Diagnostic Flow (Complete)

```bash
# Open the main page
open frontend/index.html
```

**Steps:**
1. Click "Start free diagnostic"
2. Answer all 12 questions
3. Submit diagnostic
4. View results page

**Check these elements:**
- Score number (large, light weight)
- Category label (medium, extra light)
- Badge (purple background, logo at bottom)
- Upsell section (two cards side-by-side)
- Buttons work (hover effects, clickable)

---

### Option 3: Mobile Testing

```bash
# Open test page and resize browser
open frontend/test-phase4.html
```

**Steps:**
1. Resize browser to < 768px width
2. Or use browser DevTools mobile view
3. Check upsell section

**Expected:**
- Cards stack vertically
- Blueprint card appears FIRST
- Snapshot card appears second
- Everything remains readable

---

## 📋 Quick Checklist

### Typography ✅
- [ ] Score number is 5rem, weight 300
- [ ] Category is 1.75rem, weight 200
- [ ] Description is weight 200
- [ ] All use Inter Tight font

### Badge ✅
- [ ] Background is brand purple (#4F2D9E)
- [ ] Logo appears at bottom center
- [ ] Score uses Inter Tight 300
- [ ] Category uses Inter Tight 200
- [ ] "Diagnostic Score" subtitle visible

### Upsell Section ✅
- [ ] Two cards side-by-side (desktop)
- [ ] "BEST VALUE" badge on Blueprint
- [ ] Cards match pricing section style
- [ ] Hover effects work
- [ ] Buttons are full-width teal
- [ ] Text is left-aligned

### Mobile ✅
- [ ] Cards stack vertically
- [ ] Blueprint appears first
- [ ] Everything readable
- [ ] No horizontal scroll

---

## 🐛 Common Issues & Fixes

### Issue: Old styles showing
**Fix**: Hard refresh browser
- Windows/Linux: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

### Issue: Fonts look wrong
**Fix**: Check browser console for font loading errors
- Should see Inter Tight loading
- Check network tab for font files

### Issue: Badge has no logo
**Fix**: Check if `frontend/Aivory_logo.png` exists
- Logo should be in frontend folder
- Backend will fallback to text if missing

### Issue: Upsell cards not side-by-side
**Fix**: Check browser width
- Must be > 768px for side-by-side
- Below 768px they stack (expected)

---

## 📱 Browser Testing

### Desktop Browsers
```bash
# Test in multiple browsers
- Chrome/Edge: open frontend/test-phase4.html
- Firefox: open frontend/test-phase4.html  
- Safari: open frontend/test-phase4.html
```

### Mobile Browsers
```bash
# Test on actual devices or use DevTools
- iOS Safari
- Chrome Mobile
- Firefox Mobile
```

---

## 🎯 What to Look For

### Good Signs ✅
- Clean, elegant typography
- Smooth hover effects
- Professional appearance
- Everything aligned properly
- No console errors
- Fast loading

### Bad Signs ❌
- Bold/heavy fonts (should be light)
- Italic text in upsell (should be normal)
- Colorful badge backgrounds (should be purple)
- Text "Aivory AI Readiness" in badge (should be logo)
- Centered text in cards (should be left-aligned)
- Console errors

---

## 📞 Need Help?

### Check Documentation
1. [TESTING_GUIDE_PHASE4.md](./TESTING_GUIDE_PHASE4.md) - Full testing procedures
2. [ALL_PHASES_SUMMARY.md](./ALL_PHASES_SUMMARY.md) - Complete project overview
3. [DEPLOYMENT_CHECKLIST_PHASE4.md](./DEPLOYMENT_CHECKLIST_PHASE4.md) - Deployment guide

### Debug Tools
- Browser DevTools (F12)
- Console tab for errors
- Network tab for loading issues
- Elements tab for style inspection

---

## ✅ Success Criteria

You're ready to deploy when:
1. Test page displays correctly
2. Full diagnostic flow works
3. All elements match design specs
4. Mobile layout works
5. No console errors
6. Performance is good

---

## 🚀 Ready to Deploy?

See [DEPLOYMENT_CHECKLIST_PHASE4.md](./DEPLOYMENT_CHECKLIST_PHASE4.md) for complete deployment procedures.

---

**Estimated Testing Time**: 5-30 minutes depending on depth

**Difficulty**: Easy

**Prerequisites**: Modern web browser

**Support**: See documentation files for detailed help
