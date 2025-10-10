# Dark Mode Testing Guide

## Quick Start

1. **Start the development server** (if not running):
   ```bash
   npm run dev
   ```
   Server runs on port 3003 by default.

2. **Navigate to any study page**:
   - Login to your account
   - Open an exam
   - Click "Study Mode" to access the study content

3. **Test the dark mode toggle**:
   - Look for the Moon/Sun icon in the navbar (between "History" and user section)
   - Click to toggle between light and dark modes

## Visual Verification Checklist

### Navbar (Dark Mode)

**Expected Appearance:**
- [ ] Background: Dark gray (#1f2937)
- [ ] Logo text: White
- [ ] "ExamBuilder" text: White
- [ ] ".net" text: Light indigo
- [ ] Navigation buttons: Light gray text
- [ ] Active navigation: Dark indigo background with light indigo text
- [ ] Dark mode toggle: Shows Sun icon when in dark mode
- [ ] User email: Light gray text
- [ ] User icon: Light indigo in dark background circle
- [ ] Sign out button: Red with dark background

### Study Content (Dark Mode)

**Expected Text Colors:**

1. **Body Paragraphs**:
   - Color: Pure white (#ffffff)
   - Background: Dark gray (#111827 or #1f2937)
   - Contrast: Maximum (21:1 ratio)
   - Status: ✓ Should be CLEARLY readable

2. **Headings (H1-H4)**:
   - Color: Light gray (#f9fafb)
   - Bold weight maintained
   - Size hierarchy preserved
   - Status: ✓ Should stand out from body text

3. **Bold/Strong Text**:
   - Color: Light gray (#f9fafb)
   - Weight: 600
   - Status: ✓ Should be emphasized

4. **Links**:
   - Color: Light blue (#60a5fa)
   - Underlined
   - Hover: Lighter blue (#93c5fd)
   - Status: ✓ Should be clearly clickable

5. **Code Inline**:
   - Color: Light gray (#f9fafb)
   - Background: Medium gray (#374151)
   - Status: ✓ Should have subtle contrast

6. **Code Blocks**:
   - Color: Light gray (#e5e7eb)
   - Background: Dark gray (#1f2937)
   - Status: ✓ Should be distinct from prose

7. **Lists (UL/OL)**:
   - Color: White (inherits from prose)
   - Bullets/numbers visible
   - Status: ✓ Should match body text

8. **Blockquotes**:
   - Color: White (#ffffff)
   - Border: Medium gray left border
   - Status: ✓ Should be distinguishable

## Browser Developer Tools Test

### Using Chrome/Edge DevTools:

1. Open DevTools (F12 or right-click → Inspect)
2. Navigate to the Elements tab
3. Find the `<html>` element
4. Verify it has `class="dark"` when dark mode is active
5. Check the `<div class="prose">` element
6. In the Computed tab, verify:
   - `color: rgb(255, 255, 255)` (white)
   - `background-color: rgb(17, 24, 39)` (gray-900)

### Using Firefox DevTools:

1. Open DevTools (F12)
2. Navigate to the Inspector tab
3. Select the prose content area
4. Check the Rules tab
5. Verify `.dark .prose` rule shows:
   ```css
   color: #ffffff !important;
   ```

## localStorage Verification

1. Open DevTools Console
2. Type: `localStorage.getItem('theme')`
3. Should return: `"dark"` or `"light"`
4. Toggle dark mode
5. Re-check localStorage - should update immediately

## System Preference Test

1. Clear localStorage:
   ```javascript
   localStorage.removeItem('theme')
   ```
2. Set system to dark mode (OS settings)
3. Refresh the page
4. App should automatically start in dark mode

## Contrast Ratio Verification

1. Install browser extension: "WCAG Color Contrast Checker"
2. Select body text in dark mode
3. Verify contrast ratio: **21:1** (maximum)
4. This meets WCAG AAA standards

## Common Issues & Solutions

### Issue: Text still appears gray

**Solution:**
1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Clear Next.js build cache: `rm -rf .next`
4. Restart dev server

### Issue: Dark mode toggle not visible

**Solution:**
1. Verify you're logged in
2. Check that Navbar component is rendered
3. Look between History button and user section
4. Icon may be small on mobile - try desktop view

### Issue: Theme doesn't persist

**Solution:**
1. Check browser allows localStorage
2. Not in incognito/private mode
3. Check browser console for errors
4. Verify ThemeProvider is wrapping the app

### Issue: Flash of wrong theme on load

**Solution:**
1. This is normal on first render
2. `suppressHydrationWarning` should minimize it
3. For production, consider adding theme detection script to `<head>`

## Screenshots Expected

### Light Mode Study Page
- White background
- Dark gray text (#1f2937)
- Blue links (#2563eb)
- Light gray code blocks (#f3f4f6)

### Dark Mode Study Page
- Dark gray background (#111827)
- Pure white text (#ffffff)
- Light blue links (#60a5fa)
- Dark code blocks (#1f2937)

### Navbar Comparison
- **Light**: White background, dark text
- **Dark**: Dark gray background, white text
- Toggle icon changes: Moon (light) → Sun (dark)

## Accessibility Test

1. **Keyboard Navigation**:
   - Tab to dark mode toggle
   - Press Enter to toggle
   - Should work without mouse

2. **Screen Reader**:
   - Toggle button has `aria-label="Toggle dark mode"`
   - Should announce properly

3. **Color Blind Users**:
   - High contrast maintained
   - Not relying solely on color for information

## Mobile Responsive Test

1. Open DevTools device toolbar (Ctrl+Shift+M)
2. Test on different screen sizes:
   - iPhone SE (375px)
   - iPad (768px)
   - Desktop (1920px)
3. Verify dark mode works on all sizes
4. Toggle icon should be visible and clickable

## Performance Test

1. Open DevTools Performance tab
2. Record while toggling dark mode
3. Should be instant (< 16ms)
4. No layout shifts
5. No unnecessary re-renders

## Final Verification

**All systems green when:**
- [x] Dark mode toggle appears in navbar
- [x] Clicking toggle switches between light and dark
- [x] All text is clearly readable in dark mode
- [x] Theme persists on page refresh
- [x] No console errors
- [x] No layout shifts when toggling
- [x] Works across all pages (not just study)
- [x] LocalStorage updates correctly
- [x] System preference is respected

## Deployment Checklist

Before deploying to production:

- [ ] Test in production build: `npm run build && npm start`
- [ ] Verify dark mode works in build
- [ ] Check all pages, not just study
- [ ] Test on real mobile devices
- [ ] Verify no console errors
- [ ] Check browser compatibility (Chrome, Firefox, Safari, Edge)
- [ ] Verify theme persistence works
- [ ] Test accessibility features

## Support

If issues persist after following this guide:
1. Check the DARK_MODE_FIX_SUMMARY.md for implementation details
2. Verify all file changes were applied correctly
3. Check git status for uncommitted changes
4. Review browser console for JavaScript errors
5. Check Network tab for failed CSS loads
