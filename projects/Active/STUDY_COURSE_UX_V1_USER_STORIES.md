# Study Course Generation UX - V1 User Stories

**Epic**: Improve Study Course Generation Wait Experience
**Version**: V1 - Simple Progress Indicators
**Target Release**: Week of 2025-10-21
**Priority**: HIGH

---

## Epic Overview

**Problem Statement**: Users experience poor UX during 20-60 second study course generation with only a spinner and no feedback, causing confusion, abandonment, and reduced trust.

**Solution**: Implement multi-stage progress indicators with time estimates and educational content to set expectations, build trust, and reduce perceived wait time.

**Success Metrics**:
- Generation completion rate: >85%
- User satisfaction: NPS +15 points
- Support tickets: -50% "frozen app" complaints
- Abandonment rate: <15%

---

## User Stories

### US-V1-001: Display Time Estimate

**Priority**: CRITICAL | **Story Points**: 2 | **Effort**: 2 hours

**As a** user generating a study course
**I want** to see how long generation will take
**So that** I can decide whether to wait or return later

#### Acceptance Criteria

- [ ] Time estimate displayed prominently in modal (e.g., "Usually takes about 60 seconds")
- [ ] Estimate appears immediately when generation starts (no delay)
- [ ] Time estimate is based on current average (60 seconds)
- [ ] Estimate is visible throughout entire generation process
- [ ] Font size is readable on mobile (min 14px)

#### Technical Notes

- Hard-code estimate to 60 seconds for V1
- Position estimate above spinner, center-aligned
- Use gray text color to reduce anxiety (not red/urgent)
- Consider: "This usually takes 60-90 seconds depending on exam size"

#### UI Mockup Text

```
[Spinner Icon]

Usually takes about 60 seconds

Analyzing exam questions...

AI is reading through your exam questions to understand the content
```

#### Definition of Done

- [ ] Time estimate visible in GenerationProgressModal component
- [ ] Works on mobile and desktop
- [ ] Text is clear and non-technical
- [ ] Reviewed and approved by PM

---

### US-V1-002: Show Generation Stages

**Priority**: CRITICAL | **Story Points**: 3 | **Effort**: 4 hours

**As a** user waiting for course generation
**I want** to see what stage of generation is happening
**So that** I know the app is working and not frozen

#### Acceptance Criteria

- [ ] At least 4 distinct stages shown with clear names
- [ ] Stage transitions happen automatically based on elapsed time
- [ ] Each stage has a descriptive message (present tense, active voice)
- [ ] Stage name is prominent (larger font, bold)
- [ ] Stage transitions are smooth (fade animation)
- [ ] Visual indicator shows which stage is active (dots or progress pills)

#### Stages Definition

| Stage | Duration | Message | Timing |
|-------|----------|---------|--------|
| 1 | 20s | Analyzing exam questions... | 0-20s |
| 2 | 5s | Detecting study topics... | 20-25s |
| 3 | 30s | Generating lessons... | 25-55s |
| 4 | 5s+ | Finalizing your study course... | 55s-end |

#### Technical Notes

- Use `useState` and `useEffect` with timers for transitions
- Store stage durations in constants array
- Add fade-in/fade-out transitions (200ms)
- Stage indicator: horizontal dots (filled = active/past, outline = future)

#### UI Components

```typescript
interface GenerationStage {
  name: string;
  message: string;
  duration: number; // milliseconds
}

const STAGES: GenerationStage[] = [
  {
    name: "Analysis",
    message: "Analyzing exam questions...",
    duration: 20000
  },
  {
    name: "Topic Detection",
    message: "Detecting study topics...",
    duration: 5000
  },
  {
    name: "Lesson Generation",
    message: "Generating lessons...",
    duration: 30000
  },
  {
    name: "Finalization",
    message: "Finalizing your study course...",
    duration: 5000
  }
];
```

#### Definition of Done

- [ ] 4 stages implemented with auto-transitions
- [ ] Stage indicator dots implemented
- [ ] Smooth animations between stages
- [ ] Works correctly on slow connections
- [ ] No stage skipping or UI glitches
- [ ] Mobile responsive

---

### US-V1-003: Display Educational Tips

**Priority**: HIGH | **Story Points**: 2 | **Effort**: 3 hours

**As a** user learning about the study course feature
**I want** to understand what AI is doing during generation
**So that** I appreciate the feature value and wait feels shorter

#### Acceptance Criteria

- [ ] Educational tips rotate every 8 seconds
- [ ] At least 6 unique tips available
- [ ] Tips explain AI process or feature benefits
- [ ] Tips are concise (max 100 characters)
- [ ] Tips use conversational, non-technical language
- [ ] Tip transitions are smooth (fade)
- [ ] Tips are contextually relevant to current stage (nice to have)

#### Tips Content

**General Tips (show in any stage)**:
1. "AI is reading through your exam questions to understand the content"
2. "Study courses are personalized to your exam content"
3. "Each topic includes comprehensive lessons with examples"
4. "Topics are automatically organized by relevance and difficulty"

**Stage-Specific Tips** (optional for V1):
- Stage 1 (Analysis): "Analyzing question patterns and identifying key concepts"
- Stage 2 (Detection): "Grouping similar questions into study topics"
- Stage 3 (Generation): "Creating detailed lessons for each topic"
- Stage 4 (Finalization): "Almost ready! Organizing topics and validating content"

#### Technical Notes

- Use `setInterval` for tip rotation (8000ms)
- Store tips in constants array
- Implement fade transition (300ms) between tips
- Consider: pause rotation if user hovers (not MVP)

#### UI Positioning

```
[Stage Message - 20px font, bold]

[Educational Tip - 14px font, gray, center-aligned]
```

#### Definition of Done

- [ ] Tip rotation implemented (8 seconds)
- [ ] Minimum 6 tips created and reviewed
- [ ] Fade transitions working smoothly
- [ ] Tips are clear and non-technical
- [ ] Copywriting approved by PM
- [ ] No tip repetition within single generation session

---

### US-V1-004: Animated Progress Indicator

**Priority**: MEDIUM | **Story Points**: 1 | **Effort**: 1 hour

**As a** user waiting for course generation
**I want** to see a visual indicator that work is in progress
**So that** I'm reassured the app hasn't frozen

#### Acceptance Criteria

- [ ] Animated spinner or progress indicator visible throughout
- [ ] Animation is smooth (60fps)
- [ ] Spinner is appropriately sized (48-64px)
- [ ] Spinner color matches brand (blue-600)
- [ ] Spinner works in light and dark mode
- [ ] Alternative to spinner: pulsing dots or animated progress bar

#### Technical Notes

- Use Lucide React `Loader2` component with `animate-spin`
- Size: `w-16 h-16` (64px)
- Color: `text-blue-600 dark:text-blue-400`
- Position: centered above stage message

#### UI Specifications

```jsx
<div className="flex justify-center mb-6">
  <Loader2 className="w-16 h-16 animate-spin text-blue-600 dark:text-blue-400" />
</div>
```

#### Definition of Done

- [ ] Spinner implemented and centered
- [ ] Smooth animation (no stutter)
- [ ] Works in light and dark mode
- [ ] Appropriate size on mobile and desktop

---

### US-V1-005: Stage Progress Indicators (Visual Dots)

**Priority**: MEDIUM | **Story Points**: 2 | **Effort**: 2 hours

**As a** user waiting for course generation
**I want** to see visual indicators of which stage I'm on
**So that** I understand overall progress and how much remains

#### Acceptance Criteria

- [ ] Horizontal row of 4 dots (one per stage)
- [ ] Current stage dot is filled and expanded
- [ ] Past stages are filled
- [ ] Future stages are outlined/empty
- [ ] Dots are center-aligned below educational tip
- [ ] Smooth transition animations when stage changes
- [ ] Works on mobile (minimum touch target 8px)

#### Technical Notes

- Use flexbox for horizontal alignment
- Active dot: `w-8 h-2 bg-blue-600 rounded-full`
- Inactive dot: `w-2 h-2 bg-gray-300 rounded-full`
- Transition: `transition-all duration-300`
- Gap between dots: `gap-2`

#### UI Implementation

```jsx
<div className="flex justify-center items-center gap-2 mb-6">
  {STAGES.map((stage, index) => (
    <div
      key={index}
      className={cn(
        "h-2 rounded-full transition-all duration-300",
        index <= currentStage
          ? "bg-blue-600 w-8"  // Active or completed
          : "bg-gray-300 dark:bg-gray-600 w-2"  // Future
      )}
    />
  ))}
</div>
```

#### Definition of Done

- [ ] 4 dots displayed horizontally
- [ ] Active dot expands correctly
- [ ] Smooth transitions between stages
- [ ] Works in light and dark mode
- [ ] Accessible (aria labels if needed)
- [ ] Mobile responsive

---

### US-V1-006: Elapsed Time Counter (Optional)

**Priority**: LOW | **Story Points**: 1 | **Effort**: 1 hour

**As a** user waiting for course generation
**I want** to see how long I've been waiting
**So that** I can gauge whether the process is taking longer than expected

#### Acceptance Criteria

- [ ] Elapsed time counter displays in seconds (e.g., "Elapsed: 42s")
- [ ] Counter updates every second
- [ ] Counter is small and unobtrusive (bottom of modal)
- [ ] Counter resets on new generation
- [ ] Counter stops when generation completes

#### Technical Notes

- Use `setInterval` to increment counter every 1000ms
- Display format: "Elapsed: XXs"
- Font size: `text-xs` (12px)
- Color: `text-gray-500`
- Position: bottom-center of modal

#### UI Positioning

```
[Stage Indicators]

[Educational Tip]

[Elapsed: 42s]  <-- Bottom of modal, small gray text
```

#### Decision: Include in V1?

**Pros**:
- Provides additional transparency
- Low implementation effort
- Useful for debugging and user feedback

**Cons**:
- Might increase anxiety if generation is slow
- Could draw attention to long wait time
- Not essential for MVP

**Recommendation**: INCLUDE - but make it subtle (small, gray, bottom)

#### Definition of Done

- [ ] Counter implemented and updates every second
- [ ] Counter resets on component remount
- [ ] Counter stops on completion
- [ ] Subtle styling (doesn't draw attention)

---

### US-V1-007: Cancel Button (Basic)

**Priority**: MEDIUM | **Story Points**: 2 | **Effort**: 3 hours

**As a** user waiting for course generation
**I want** to cancel the generation if I change my mind
**So that** I'm not forced to wait and can exit the process

#### Acceptance Criteria

- [ ] Cancel button appears after 10 seconds of generation
- [ ] Cancel button is clearly labeled (e.g., "Cancel")
- [ ] Clicking cancel closes the modal immediately
- [ ] Cancel does NOT trigger backend cleanup in V1 (defer to V2)
- [ ] User can restart generation after canceling
- [ ] Cancel button is accessible (keyboard navigation)

#### Technical Notes

- Show cancel button only when `elapsedTime > 10`
- Use conditional rendering: `{elapsedTime > 10 && <button>...</button>}`
- Button style: text-only, gray color, small
- onClick: call `onCancel()` prop to close modal
- V1: No backend cleanup (generation continues server-side but user sees nothing)

#### UI Positioning

```
[Stage Indicators]

[Educational Tip]

[Elapsed: 15s]

[Cancel]  <-- Appears after 10s, text button, gray
```

#### Backend Behavior (V1)

- V1: Cancel is **frontend only** - generation continues on server
- User can re-trigger generation, which will find existing course or regenerate
- V2: Implement proper backend cancellation with cleanup

#### Definition of Done

- [ ] Cancel button appears after 10 seconds
- [ ] Cancel closes modal immediately
- [ ] User can restart generation after cancel
- [ ] Button is keyboard accessible
- [ ] No errors in console after cancel

---

### US-V1-008: Error Handling in Modal

**Priority**: HIGH | **Story Points**: 2 | **Effort**: 2 hours

**As a** user experiencing a generation error
**I want** to see a clear error message in the modal
**So that** I understand what went wrong and what to do next

#### Acceptance Criteria

- [ ] Error message replaces progress UI when error occurs
- [ ] Error message is user-friendly (no technical jargon)
- [ ] "Retry" button is prominent and clearly labeled
- [ ] "Cancel" button allows user to exit
- [ ] Error state persists until user takes action (retry or cancel)
- [ ] Error icon is displayed (red AlertTriangle or XCircle)

#### Error Message Examples

**Timeout Error**:
```
Something went wrong
Generation took longer than expected. This can happen with very large exams.
[Retry] [Cancel]
```

**API Error**:
```
Unable to generate course
There was a problem connecting to our AI service. Please try again.
[Retry] [Cancel]
```

**Generic Error**:
```
Generation failed
We couldn't complete your study course. Please try again or contact support if this persists.
[Retry] [Cancel]
```

#### Technical Notes

- Add `error` state to GenerationProgressModal component
- Pass error from parent via props: `error: string | null`
- Conditional render: show error UI if `error !== null`
- Error UI replaces all progress indicators
- Retry button calls `onRetry()` prop
- Cancel button calls `onCancel()` prop

#### UI Implementation

```jsx
{error ? (
  <div className="text-center">
    <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
    <h3 className="text-xl font-semibold mb-2">Generation Failed</h3>
    <p className="text-gray-600 mb-6">{error}</p>
    <div className="flex gap-3">
      <button onClick={onCancel} className="flex-1 btn-secondary">
        Cancel
      </button>
      <button onClick={onRetry} className="flex-1 btn-primary">
        Retry
      </button>
    </div>
  </div>
) : (
  /* Normal progress UI */
)}
```

#### Definition of Done

- [ ] Error state implemented in modal
- [ ] User-friendly error messages defined
- [ ] Retry and Cancel buttons functional
- [ ] Error icon displayed correctly
- [ ] Works in light and dark mode

---

### US-V1-009: Mobile Responsive Design

**Priority**: CRITICAL | **Story Points**: 2 | **Effort**: 2 hours

**As a** mobile user generating a study course
**I want** the progress modal to work well on my device
**So that** I have a good experience regardless of screen size

#### Acceptance Criteria

- [ ] Modal is readable and usable on screens down to 320px width
- [ ] Text is legible (minimum 14px body text)
- [ ] Buttons are tappable (minimum 44x44px touch targets)
- [ ] Modal doesn't overflow screen
- [ ] Stage indicators scale appropriately
- [ ] Spinner is appropriately sized for mobile
- [ ] No horizontal scrolling required

#### Technical Notes

- Use responsive padding: `p-6 sm:p-8`
- Use responsive font sizes: `text-base sm:text-lg`
- Use responsive max-width: `max-w-sm sm:max-w-md`
- Test on devices: iPhone SE (375px), iPhone 14 (390px), Android (360px)

#### Breakpoints

- Mobile: 320-640px
- Tablet: 640-1024px
- Desktop: 1024px+

#### Definition of Done

- [ ] Modal tested on iPhone SE (375px width)
- [ ] Modal tested on Android (360px width)
- [ ] All text is readable
- [ ] All buttons are tappable
- [ ] No layout issues or overflow
- [ ] Smooth on mobile networks (tested with throttling)

---

### US-V1-010: Dark Mode Support

**Priority**: HIGH | **Story Points**: 1 | **Effort**: 1 hour

**As a** user who prefers dark mode
**I want** the progress modal to look good in dark mode
**So that** my experience is consistent with the rest of the app

#### Acceptance Criteria

- [ ] Modal background uses dark mode colors (dark:bg-gray-800)
- [ ] Text is readable in dark mode (dark:text-white, dark:text-gray-400)
- [ ] Stage indicators work in dark mode (dark:bg-gray-600)
- [ ] Spinner color adapts to dark mode (dark:text-blue-400)
- [ ] Error states work in dark mode
- [ ] All interactive elements have dark mode styles

#### Technical Notes

- Use Tailwind dark mode classes throughout
- Test with system dark mode enabled
- Ensure sufficient contrast for accessibility (WCAG AA)

#### Dark Mode Color Palette

- Background: `bg-white dark:bg-gray-800`
- Heading text: `text-gray-900 dark:text-white`
- Body text: `text-gray-600 dark:text-gray-400`
- Muted text: `text-gray-500 dark:text-gray-500`
- Primary accent: `text-blue-600 dark:text-blue-400`
- Stage indicators: `bg-blue-600` (same), `bg-gray-300 dark:bg-gray-600`

#### Definition of Done

- [ ] All modal elements have dark mode styles
- [ ] Text contrast meets WCAG AA standards
- [ ] Modal looks polished in dark mode
- [ ] No white flashes or color issues during transitions

---

## Component Architecture

### New Components

#### `GenerationProgressModal.tsx`
**Purpose**: Main modal component for generation progress UI
**Location**: `app/components/study/GenerationProgressModal.tsx`
**Props**:
```typescript
interface GenerationProgressModalProps {
  isOpen: boolean;
  onCancel?: () => void;
  onRetry?: () => void;
  error?: string | null;
  estimatedTime?: number; // seconds, default 60
}
```

**State**:
```typescript
const [currentStage, setCurrentStage] = useState(0);
const [currentTip, setCurrentTip] = useState(0);
const [elapsedTime, setElapsedTime] = useState(0);
```

### Updated Components

#### `app/study/[exam_id]/page.tsx`
**Changes**:
- Import and use `GenerationProgressModal`
- Replace existing spinner with modal
- Pass error state to modal
- Implement onCancel and onRetry handlers

**Before**:
```jsx
{generating && (
  <>
    <Loader2 className="w-4 h-4 animate-spin" />
    <span>Generating Course...</span>
  </>
)}
```

**After**:
```jsx
<GenerationProgressModal
  isOpen={generating}
  error={error}
  onCancel={() => setGenerating(false)}
  onRetry={() => handleGenerateCourse()}
/>
```

---

## Testing Checklist

### Functional Testing

- [ ] **Happy Path**: Full generation from start to completion
- [ ] **Stage Transitions**: All 4 stages display in correct order
- [ ] **Tip Rotation**: Tips rotate every 8 seconds
- [ ] **Time Estimate**: "Usually takes 60 seconds" displays immediately
- [ ] **Elapsed Counter**: Counter increments every second
- [ ] **Cancel Button**: Appears after 10s, closes modal on click
- [ ] **Error Handling**: Error UI displays on generation failure
- [ ] **Retry**: Retry button restarts generation correctly
- [ ] **Success**: Modal closes on successful generation

### Edge Cases

- [ ] **Very Fast Generation** (<20s): Doesn't break stage transitions
- [ ] **Very Slow Generation** (>90s): Stage 4 continues without breaking
- [ ] **Network Error**: Error state displays correctly
- [ ] **Page Refresh**: Modal state resets correctly
- [ ] **Multiple Clicks**: Can't trigger multiple simultaneous generations

### Cross-Browser Testing

- [ ] Chrome (latest)
- [ ] Safari (latest)
- [ ] Firefox (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS 15+)
- [ ] Chrome Android (latest)

### Device Testing

- [ ] iPhone SE (375px width)
- [ ] iPhone 14 (390px width)
- [ ] iPad (768px width)
- [ ] Android phone (360px width)
- [ ] Desktop (1920px width)

### Accessibility Testing

- [ ] Keyboard navigation (Tab, Enter, Esc)
- [ ] Screen reader compatibility (VoiceOver, NVDA)
- [ ] Color contrast meets WCAG AA
- [ ] Focus indicators visible
- [ ] Aria labels for stage indicators

---

## Success Metrics (Post-Launch)

### Week 1 Metrics (Oct 21-27)

**Quantitative**:
- [ ] Generation completion rate: target >85%
- [ ] Abandonment rate: target <15%
- [ ] Average time to completion: measure baseline
- [ ] Cancel rate: measure (expect 5-10%)
- [ ] Error rate: measure (expect <5%)

**Qualitative**:
- [ ] User feedback survey: 20+ responses
- [ ] Support tickets: count "frozen app" complaints
- [ ] User comments: analyze sentiment

### Week 2-4 Metrics (Oct 28 - Nov 17)

**Quantitative**:
- [ ] Feature re-use rate: target 40%
- [ ] Study course engagement: measure sessions/user
- [ ] Time to first study course: measure (baseline for V2)

**Qualitative**:
- [ ] User satisfaction: NPS survey (target +15 points)
- [ ] Feature value perception: survey (1-5 scale, target 4.2+)

---

## Rollout Plan

### Day 1-2: Development (Oct 17-18)
- [ ] Create GenerationProgressModal component
- [ ] Implement stage transitions
- [ ] Implement tip rotation
- [ ] Implement stage indicators
- [ ] Add error handling
- [ ] Update page.tsx integration

### Day 3: Testing (Oct 19)
- [ ] Functional testing
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Accessibility audit
- [ ] Fix critical bugs

### Day 4: Deploy & Monitor (Oct 20)
- [ ] Deploy to production during low-traffic period (Sunday evening)
- [ ] Monitor error rates and performance
- [ ] Quick bug fixes if needed
- [ ] Announce in user communication channels

### Week 2: Measure & Iterate (Oct 21-27)
- [ ] Collect analytics data
- [ ] Send user satisfaction survey
- [ ] Analyze support tickets
- [ ] Review user feedback
- [ ] Plan V1.1 improvements if needed

---

## Definition of Ready (Before Starting)

- [x] Product Manager approval on user stories
- [x] Design mockups reviewed and approved
- [x] Copywriting finalized for all messages and tips
- [ ] Analytics events defined and ready to implement
- [ ] QA test plan created
- [ ] Development environment ready

---

## Definition of Done (V1 Complete)

- [ ] All user stories implemented and tested
- [ ] Code reviewed and approved
- [ ] QA passed (no critical bugs)
- [ ] Deployed to production
- [ ] Analytics tracking active
- [ ] User documentation updated
- [ ] Support team informed of changes
- [ ] Monitoring dashboards configured
- [ ] Post-launch metrics collection started

---

## Open Questions

1. **Copywriting**: Do we need legal/marketing review for educational tips?
   - **Answer**: PM decision - likely no for internal feature

2. **Analytics**: Which analytics tool to use for event tracking?
   - **Answer**: [Define: Google Analytics, Mixpanel, or custom]

3. **Error Messages**: Should we log errors to Sentry or similar?
   - **Answer**: [Define: Yes/No, which service]

4. **Cancel Behavior**: Should we show confirmation dialog before cancel?
   - **Answer**: [Define: Yes/No - recommend NO for V1 simplicity]

5. **Stage Timing**: Should stage durations be configurable via admin panel?
   - **Answer**: [Define: No for V1, hardcode - revisit in V2]

---

## Risk Log

| Risk | Probability | Impact | Mitigation | Owner |
|------|-------------|--------|------------|-------|
| Time estimates are inaccurate | Medium | Low | Measure actual times, adjust in V1.1 | Engineering |
| Users still abandon despite progress | Low | High | Monitor metrics, iterate messaging | PM |
| Modal breaks on specific devices | Low | Medium | Thorough device testing before launch | QA |
| Dark mode colors have contrast issues | Low | Medium | Accessibility audit during testing | Design |
| Educational tips feel annoying | Low | Low | User testing, feedback survey | PM |

---

## Notes for Implementation

### Performance Considerations
- Use React.memo for GenerationProgressModal if needed
- Avoid unnecessary re-renders during tip/stage transitions
- Debounce any expensive operations

### Code Quality
- Write unit tests for stage transition logic
- Add PropTypes or TypeScript interfaces for props
- Document component API with JSDoc comments
- Follow existing codebase conventions

### Future Extensibility
- Design modal to easily accommodate V2 real-time progress
- Keep stage definitions in separate config file for easy updates
- Abstract tip content for potential i18n in future

---

**Questions? Contact**: [PM Name/Email]
**Slack Channel**: #study-course-feature
**JIRA Epic**: [Link to JIRA epic if applicable]
