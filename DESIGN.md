# ExamBuilder.net - Design System Documentation

## 🎨 Design Overview

This document outlines the **Typeform-inspired** design system implemented for ExamBuilder.net. The redesign focuses on creating a **clean, modern, and mobile-friendly** exam builder experience.

---

## 📐 Design Principles

### 1. **Simplicity & Focus**
- Single-task focus per screen
- Minimal cognitive load
- Clear visual hierarchy
- Generous whitespace

### 2. **Progressive Disclosure**
- Step-by-step workflow (Sidebar navigation)
- Hide complexity until needed
- Contextual help and tips

### 3. **Responsive First**
- Mobile-first approach
- Fluid layouts across all breakpoints
- Touch-friendly interactions (48px minimum tap targets)
- Adaptive navigation (drawer on mobile, sidebar on desktop)

### 4. **Delightful Interactions**
- Smooth transitions and animations
- Instant feedback (toasts, loading states)
- Hover states and micro-interactions
- Auto-focus for faster workflows

---

## 🎨 Visual Design System

### Color Palette

**Primary Colors:**
- **Indigo** (`indigo-500`, `indigo-600`): Primary brand color, CTAs, active states
- **Sky** (`sky-400`, `sky-500`): Accent color, highlights, secondary actions

**Neutral Colors:**
- **Neutral** (`neutral-50` to `neutral-900`): Backgrounds, text, borders
- Neutral-50: Page background
- Neutral-200: Borders and dividers
- Neutral-800: Primary text

**Semantic Colors:**
- **Green**: Success states, correct answers
- **Red**: Errors, warnings, delete actions
- **Yellow**: Caution, important notices
- **Blue**: Information, neutral actions

### Typography

**Font Family:**
- **Sans**: Geist (system default via Next.js)
- **Mono**: Geist Mono (code and technical content)

**Font Sizes:**
- Display: `text-4xl` (36px) - Page headers
- Heading 1: `text-3xl` (30px) - Section titles
- Heading 2: `text-2xl` (24px) - Card headers
- Body: `text-base` (16px) - Standard text
- Small: `text-sm` (14px) - Supporting text
- Tiny: `text-xs` (12px) - Labels, badges

**Font Weights:**
- Bold: `font-bold` (700) - Headers, emphasis
- Semibold: `font-semibold` (600) - Subheadings
- Medium: `font-medium` (500) - Buttons, labels
- Normal: `font-normal` (400) - Body text

### Spacing

**Consistent spacing scale:**
- xs: 0.5rem (8px)
- sm: 1rem (16px)
- md: 1.5rem (24px)
- lg: 2rem (32px)
- xl: 3rem (48px)
- 2xl: 4rem (64px)

### Border Radius

- **Small**: `rounded-lg` (8px) - Inputs, small cards
- **Medium**: `rounded-xl` (12px) - Cards, panels
- **Large**: `rounded-2xl` (16px) - Buttons, major components
- **Full**: `rounded-full` - Avatars, badges, FAB

### Shadows

- **sm**: `shadow-sm` - Subtle elevation
- **md**: `shadow-md` - Card hover states
- **lg**: `shadow-lg` - Modals, dropdowns
- **xl**: `shadow-xl` - Floating elements

---

## 🧩 Component Architecture

### Layout Components

#### 1. **Topbar** (`components/builder/Topbar.tsx`)
**Purpose:** Global navigation, branding, and user actions

**Features:**
- Responsive logo (compact on mobile)
- Save button with loading state and last-saved timestamp
- User menu with dropdown
- Mobile menu toggle
- Sticky positioning

**Mobile Behavior:**
- Logo shows compact version
- Save button icon-only on small screens
- User email hidden on mobile

---

#### 2. **Sidebar** (`components/builder/Sidebar.tsx`)
**Purpose:** Step-by-step navigation through exam builder workflow

**Features:**
- 4 main steps: Info → Questions → Scoring → Publish
- Visual progress indicator
- Active step highlighting
- Contextual help section
- Smooth transitions

**Mobile Behavior:**
- Slides out as overlay drawer
- Closes automatically on step change
- Full-screen on mobile for easier interaction

**Steps:**
1. **Exam Info**: Basic details (name, description)
2. **Add Questions**: Build and manage questions
3. **Scoring**: Configure grading rules
4. **Publish**: Share and deploy exam

---

#### 3. **PreviewPanel** (`components/builder/PreviewPanel.tsx`)
**Purpose:** Live preview of questions with device switching

**Features:**
- Real-time preview updates
- Device switcher (Mobile, Tablet, Desktop)
- Uses existing QuestionCard component
- Preview tips and guidance

**Mobile Behavior:**
- Hidden on mobile and tablets (< 1024px)
- Shows as toggle button on desktop
- Can be collapsed to maximize editing space

---

### Content Components

#### 4. **QuestionBuilderCard** (`components/builder/QuestionBuilderCard.tsx`)
**Purpose:** Editable question card with drag-and-drop reordering

**Features:**
- Drag handle for reordering
- Edit, delete, preview actions
- Markdown preview toggle
- Visual correct answer highlighting
- Multiple choice badge
- Community vote display

**Layout:**
- Compact preview by default
- Expandable markdown preview
- Color-coded correct answers (green background)
- Hover states for interactivity

---

#### 5. **EmptyState** (`components/builder/EmptyState.tsx`)
**Purpose:** Friendly placeholder when no content exists

**Features:**
- Contextual illustrations
- Clear call-to-action
- Helper tips and guidance
- Different variants (questions, exams, generic)

**Variants:**
- `questions`: For empty question list
- `exams`: For empty exam library
- `generic`: Default fallback

---

#### 6. **Toast** (`components/builder/Toast.tsx`)
**Purpose:** Non-intrusive notifications and feedback

**Features:**
- 4 types: success, error, info, warning
- Auto-dismiss with configurable duration
- Manual close button
- Slide-in animation
- Toast queue management via `useToast` hook

**Usage:**
```tsx
const { showToast } = useToast();
showToast('Saved successfully!', 'success');
```

---

#### 7. **FloatingActionButton** (`components/builder/FloatingActionButton.tsx`)
**Purpose:** Quick action button for mobile (optional enhancement)

**Features:**
- Fixed bottom-right position
- Touch-friendly size (56px minimum)
- Icon with optional label
- Smooth hover and press states

---

### Utility Components

#### 8. **Theme Configuration** (`lib/theme.ts`)
**Purpose:** Centralized design tokens and helper functions

**Contents:**
- Color palette definitions
- Typography scales
- Component style presets
- Helper functions (`getButtonClass`, `getCardClass`)

**Usage:**
```tsx
import { theme, getButtonClass } from '@/lib/theme';

<button className={getButtonClass('primary', 'lg')}>
  Click me
</button>
```

---

## 📱 Responsive Breakpoints

All components follow mobile-first responsive design:

```css
/* Tailwind Breakpoints */
sm:  640px  // Small tablets
md:  768px  // Tablets
lg:  1024px // Laptops
xl:  1280px // Desktops
2xl: 1536px // Large screens
```

### Key Responsive Behaviors

**Mobile (< 640px):**
- Sidebar becomes full-screen drawer
- Preview panel hidden
- Compact topbar (icon-only buttons)
- Floating Action Button for primary actions
- Single column layout

**Tablet (640px - 1023px):**
- Sidebar remains drawer
- Preview panel still hidden
- Two-column layouts where appropriate
- More comfortable spacing

**Desktop (≥ 1024px):**
- Sidebar persistent and visible
- Preview panel visible by default
- Three-column layout (Sidebar | Content | Preview)
- Maximum information density

---

## ✨ Animations & Transitions

### Custom Animations (in `globals.css`)

**slideIn:**
```css
@keyframes slideIn {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
```
Used for: Toast notifications

**fadeIn:**
```css
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
```
Used for: Step content transitions

### Transition Guidelines

- **Duration**: 200ms for micro-interactions, 300ms for page transitions
- **Easing**: `ease-in-out` for most animations
- **Properties**: Transform, opacity, colors
- **Performance**: Use `transform` and `opacity` for GPU acceleration

---

## 🎯 User Experience Patterns

### 1. **Step-by-Step Workflow**
Guides users through exam creation in logical steps:
1. Define exam info
2. Add questions
3. Configure scoring
4. Publish and share

### 2. **Progressive Disclosure**
- Show essential options first
- Hide advanced features in dropdowns/modals
- Contextual help only when needed

### 3. **Instant Feedback**
- Toast notifications for all actions
- Loading states for async operations
- Disabled states for invalid actions
- Auto-save indicators

### 4. **Error Prevention**
- Form validation before proceeding
- Confirmation dialogs for destructive actions
- Clear required field indicators

---

## 🔧 Integration Points

### Zustand State Management
**To be implemented:**

```tsx
// Example Zustand store structure
interface ExamBuilderStore {
  // Exam data
  examId: string | null;
  examName: string;
  examDescription: string;
  questions: Question[];

  // UI state
  currentStep: BuilderStep;
  selectedQuestion: Question | null;

  // Actions
  setExamInfo: (name: string, description: string) => void;
  addQuestion: (question: Question) => void;
  updateQuestion: (id: string, updates: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  reorderQuestions: (startIndex: number, endIndex: number) => void;
}
```

### Supabase Integration Points

**API Endpoints to implement:**
- `POST /api/exams` - Create new exam
- `PUT /api/exams/:id` - Update exam info
- `POST /api/questions` - Add question
- `PUT /api/questions/:id` - Update question
- `DELETE /api/questions/:id` - Delete question
- `POST /api/questions/reorder` - Reorder questions

---

## 🚀 Recommended Enhancements

### Phase 1 (MVP Complete)
✅ Core layout structure
✅ Responsive design
✅ Component library
✅ Toast notifications

### Phase 2 (Recommended Next Steps)
- [ ] **Drag & Drop**: Implement with `@dnd-kit/core`
- [ ] **Question Editor Modal**: Rich text editor for questions
- [ ] **Markdown Import**: Bulk import from files
- [ ] **Zustand Store**: Centralized state management
- [ ] **Auto-save**: Debounced automatic saving

### Phase 3 (Polish)
- [ ] **Framer Motion**: Smooth page transitions
- [ ] **Radix UI**: Accessible modals and dropdowns
- [ ] **Keyboard Shortcuts**: Power user features (Cmd+S, Cmd+N, etc.)
- [ ] **Undo/Redo**: Action history
- [ ] **Collaborative Editing**: Real-time with Supabase subscriptions

### Phase 4 (Advanced)
- [ ] **AI Question Generation**: Smart content creation
- [ ] **Analytics Dashboard**: Question performance insights
- [ ] **A/B Testing**: Test different question formats
- [ ] **Accessibility Audit**: WCAG 2.1 AA compliance

---

## 📚 Recommended Libraries

### Already Included
- ✅ **Next.js 15** - React framework
- ✅ **Tailwind CSS** - Utility-first styling
- ✅ **Lucide React** - Icon library
- ✅ **ReactMarkdown + remark-gfm** - Markdown rendering

### Recommended Additions

**Animations:**
```bash
npm install framer-motion
```
- Smooth page transitions
- Advanced animations
- Gesture support

**Drag & Drop:**
```bash
npm install @dnd-kit/core @dnd-kit/sortable
```
- Question reordering
- Accessible keyboard support
- Touch-friendly

**UI Primitives:**
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-toast
```
- Accessible components
- Unstyled primitives
- ARIA-compliant

**Form Management:**
```bash
npm install react-hook-form zod
```
- Form validation
- Type-safe schemas
- Better UX

---

## 🎓 Design Rationale

### Why Typeform-Inspired?

**1. Single Focus:**
Typeform's one-question-at-a-time approach reduces cognitive load. We adapted this to a step-by-step builder workflow.

**2. Conversational Feel:**
Large typography and generous spacing makes the interface feel friendly and approachable—perfect for educators.

**3. Progress Clarity:**
Clear visual indicators show users where they are in the process, reducing anxiety and confusion.

**4. Mobile Excellence:**
Typeform excels on mobile. Our design ensures the builder works beautifully on all devices.

### Design Decisions

**Decision 1: Sidebar over Wizard**
- **Why:** Allows jumping between steps, not forced linear flow
- **Trade-off:** Slightly more complex UI, but more flexible

**Decision 2: Preview Panel Desktop-Only**
- **Why:** Limited mobile screen space needs to prioritize editing
- **Trade-off:** No mobile preview, but optimizes for primary use case

**Decision 3: Inline Question Editing**
- **Why:** Faster than modal dialogs for quick edits
- **Trade-off:** Cards can be large, but provides context

**Decision 4: Markdown Support**
- **Why:** Teachers often have existing content in markdown
- **Trade-off:** Steeper learning curve, but powerful and flexible

---

## 🏗️ File Structure

```
exam-simulator/
├── app/
│   ├── builder/
│   │   └── page.tsx              # Main exam builder page
│   └── globals.css               # Global styles + animations
├── components/
│   └── builder/
│       ├── Topbar.tsx            # Global navigation bar
│       ├── Sidebar.tsx           # Step navigation sidebar
│       ├── PreviewPanel.tsx      # Live question preview
│       ├── QuestionBuilderCard.tsx  # Editable question card
│       ├── EmptyState.tsx        # Empty state placeholder
│       ├── Toast.tsx             # Notification component
│       └── FloatingActionButton.tsx # Mobile FAB
└── lib/
    └── theme.ts                  # Design tokens & utilities
```

---

## 🎉 Summary

This design system provides:
- ✅ **Modern, Typeform-inspired aesthetics**
- ✅ **Fully responsive mobile-first design**
- ✅ **Accessible and touch-friendly components**
- ✅ **Extensible component library**
- ✅ **Clear integration points for state management**
- ✅ **Professional, educator-friendly UX**

**Next Steps:**
1. Test on real devices (mobile, tablet, desktop)
2. Implement drag-and-drop for question reordering
3. Build question editor modal
4. Integrate Zustand for state management
5. Connect to Supabase API endpoints

---

**Built with ❤️ for educators by ExamBuilder.net**
