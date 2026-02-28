# QuoQuizizz - Modular Refactoring Documentation

## Overview

QuoQuizizz has been successfully refactored from a monolithic 4,582-line single HTML file into a clean, modular architecture with separated concerns. This document outlines the new structure, file organization, and how each module functions.

## Project Structure

```
quiz-app/
├── index.html                 (Main entry point)
├── css/                       (Styling modules)
│   ├── variables.css         (Design tokens & theme variables)
│   ├── base.css              (Global styles & animations)
│   ├── layout.css            (Page structure & positioning)
│   ├── components.css        (Reusable UI components)
│   ├── themes.css            (Theme-specific styling)
│   ├── quiz.css              (Quiz-specific styles)
│   └── responsive.css        (Mobile/responsive breakpoints)
├── js/                        (Application logic modules)
│   ├── utils.js              (Shared utility functions)
│   ├── storage.js            (localStorage operations & progress management)
│   ├── theme.js              (Theme switching & modal management)
│   ├── creator.js            (Quiz creation interface)
│   ├── student.js            (Quiz playing/answering logic)
│   ├── history.js            (History management & statistics)
│   └── main.js               (Application initialization & view switching)
└── sound/                     (Audio assets)
    ├── correct.mp3           (Correct answer feedback)
    └── incorrect.mp3         (Incorrect answer feedback)
```

## Module Descriptions

### CSS Modules (7 files, ~2,000+ lines total)

#### 1. **variables.css** (~45 lines)
**Purpose:** Centralized design tokens for the entire application.

**Contains:**
- CSS custom properties (--primary-color, --secondary-color, etc.)
- Color definitions for themes (Default, Tet, Christmas, Dark mode)
- Spacing variables (padding, margin sizes)
- Typography settings
- Border and shadow properties

**Key Variables:**
```css
--primary-color       (Main brand color)
--secondary-color     (Accent color)
--accent-color        (Highlight color)
--text-color          (Text color)
--bg-color            (Background color)
--border-color        (Border color)
```

#### 2. **base.css** (~180 lines)
**Purpose:** Global styles, typography, animations, and HTML resets.

**Contains:**
- HTML and body element resets
- Font family and sizing
- 18 keyframe animations:
  - `spin` - Rotation animation
  - `galaxyShimmer`, `galaxyFloat`, `galaxyPulse` - Galaxy-themed animations
  - `correctPulse`, `incorrectShake` - Answer feedback animations
  - `snowmanSway`, `snowfall` - Christmas theme animations
  - `scaleIn`, `floatUp`, `rotate`, `fadeIn` - Transition effects
- Link styling
- Scrollbar customization

**Key Animations: 18 keyframe definitions** for various UI effects

#### 3. **layout.css** (~190 lines)
**Purpose:** Overall page structure, sidebar, header, and main content area layout.

**Contains:**
- Flexbox layout for app-layout container
- Sidebar fixed positioning and styling
- Header sticky positioning
- Main content area scrolling
- Navigation styling
- Container sizing and alignment
- Responsive spacing

**Key Classes:**
- `.app-layout` - Main flex container
- `.sidebar`, `.header`, `.main-content` - Layout sections
- `.nav-link` - Navigation buttons

#### 4. **components.css** (~450 lines)
**Purpose:** Reusable UI components styling (buttons, forms, modals, cards).

**Contains:**
- Button variants:
  - `.btn-primary` - Primary blue button
  - `.btn-info` - Info blue button
  - `.btn-success` - Green success button
  - `.btn-danger` - Red danger button
  - `.btn-secondary` - Gray secondary button
- Form elements:
  - Input, textarea styling
  - Focus states
  - Placeholder styling
- Modal structure
  - `.modal-overlay` - Dark overlay
  - `.modal-content` - Modal box
- Cards (.card, .feature-card, .history-card)
- Loading spinners
- Drag-drop zones

**Key Features:**
- Hover and focus states for accessibility
- 3D button effects
- Shadow and border treatments
- Transition effects

#### 5. **themes.css** (~520 lines)
**Purpose:** Theme-specific color overrides and theme switching interface.

**Contains:**
- Tet theme styling (Red/Gold with Vietnamese New Year colors)
- Christmas theme styling (Blue/White with festive elements)
- Dark mode styling
- Theme modal interface
- Theme selection buttons
- Holiday-specific decorative elements

**Theme Classes:**
- `.tet-theme` - Apply Tet theme colors
- `.christmas-theme` - Apply Christmas theme
- `.dark-mode` - Apply dark mode

#### 6. **quiz.css** (~480 lines)
**Purpose:** Quiz-specific styling for questions, options, results, and history display.

**Contains:**
- Quiz play area structure
- Question display styling with gradient and glow effects
- Option button styling with 3D depth effect
- Progress bar styling
- Score display section
- Results/final score section
- History grid and cards
- Review section styling
- Scoring indicator colors (correct = green, incorrect = red)

**Key Classes:**
- `.quiz-play-area` - Quiz container
- `.question-display` - Question wrapper
- `.option-btn` - Answer option button
- `.history-card` - History item card
- `.progress-bar` - Progress indicator

#### 7. **responsive.css** (~420 lines)
**Purpose:** Mobile and tablet responsive design adjustments.

**Contains:**
- Mobile portrait breakpoint (≤768px):
  - Sidebar collapse/expand
  - Full-width quiz mode
  - Touch-optimized button sizing
  - Stacked layout
- Tablet breakpoint (769-1024px):
  - Grid adjustments
  - Sidebar sidebar width
  - Button sizing
- Small phone breakpoint (≤480px):
  - Minimal sidebar width
  - Compact button sizing
  - Adjusted spacing
- Landscape orientation (≤500px height):
  - Horizontal layout adjustments
  - Side-by-side question/answers
  - Reduced vertical spacing

**Breakpoints:**
```css
@media (max-width: 768px)     /* Mobile portrait */
@media (min-width: 769px)     /* Tablet and above */
@media (max-width: 480px)     /* Small phones */
@media (max-height: 500px)    /* Landscape devices */
```

---

### JavaScript Modules (7 files, ~1,500+ lines total)

#### 1. **utils.js** (~250 lines)
**Purpose:** Shared utility functions used across all modules.

**Key Functions:**
- `get(id)` - DOM element selector shorthand
- `sanitizeInput(input)` - Remove potentially harmful characters
- `escapeHTML(text)` - Entity encode HTML to prevent XSS
- `shuffleArray(array)` - Fisher-Yates array shuffling
- `cloneSafe(obj)` - Deep clone via JSON serialization
- `normalizeQuestion(question)` - Validate and normalize question objects
- `validateQuizPayload(payload)` - Full quiz structure validation
- `buildQuizPayload()` - Construct quiz from form with sanitization
- `safeBase64Encode(str)`, `safeBase64Decode(str)` - UTF-8 safe encoding for URL sharing
- `playSound(soundName)` - Audio feedback (respects sound toggle)
- `showFeedbackWithAnimation(text, type)` - Floating feedback message
- `formatDate(date)` - Format to Vietnamese locale DD/MM/YYYY - HH:MM
- `toggleQuizMenu()` - Mobile menu with unsaved progress warning

**Dependencies:** Standalone; foundation for other modules

---

#### 2. **storage.js** (~280 lines)
**Purpose:** All localStorage operations for progress, history, and preferences.

**Global State:**
```javascript
window.quizAppState = {
    questions: [],                    // Creator's questions
    tfAnswers: [null, null, null, null],
    studentQuiz: {},                  // Loaded quiz data
    currentQuestionIndex: 0,          // Current question number
    studentScore: 0,                  // Points earned
    studentTfAnswers: [],             // Student's T/F answers
    quizReviewData: [],               // Review info per question
    originalQuestions: [],            // Unshuffled questions
    isRedemptionMode: false,          // Redo failed questions mode
    studentAutoAdvancePref: '5000',   // Auto-advance milliseconds
    soundEnabled: true                // Audio feedback toggle
}
```

**Key Functions:**
- `saveProgress()` - Save in-progress quiz to localStorage
- `loadProgress()` - Restore saved quiz state
- `clearProgress()` - Delete saved progress
- `checkForSavedProgress()` - Show resume button if progress exists
- `saveToHistory(isCompleted)` - Record completed quiz in history
- `resumeFromHistory(id)` - Load and resume a quiz from history
- `restartFromHistory(id)` - Restart a historical quiz from beginning
- `reviewFromHistory(id)` - Show review of completed quiz
- `deleteHistoryItem(id)` - Remove history entry
- `buildReviewHTML(item)` - Generate review display HTML

**Storage Keys:**
- `quizMasterProgress` - Current in-progress quiz
- `quizHistory` - Array of completed quizzes (max 50)

---

#### 3. **theme.js** (~200 lines)
**Purpose:** Theme switching, dark mode toggle, and modal management.

**Key Functions:**
- `applyTheme(themeName)` - Switch active theme (tet/christmas/dark/default)
- `applyColorTheme(colors)` - Apply custom color palette
- `toggleDarkMode()` - Switch dark mode on/off
- `loadThemePreferences()` - Load saved theme from localStorage
- `updateThemeOptions()` - Sync UI buttons with current theme
- `showThemeSettings()` - Display settings modal
- `closeThemeSettings()` - Hide settings modal
- `showPreviewModal()` - Display preview modal
- `closePreviewModal()` - Hide preview modal
- `closeModalOnOutsideClick(event, modalId)` - Click outside to close
- `setTheme(themeName)` - Theme selection handler
- `initThemeSystem()` - Initialize theme UI listeners
- `applyPresetColors(presetName)` - Apply color presets

**Theme Presets:**
- `default` - Blue/cyan primary colors
- `tet` - Red/gold festive colors
- `christmas` - Red/blue holiday colors
- `dark` - Dark background with light text

**Storage Keys:**
- `selectedTheme` - Current theme name
- `darkMode` - Dark mode enabled flag
- `colorPreset` - Color scheme preset

---

#### 4. **creator.js** (~330 lines)
**Purpose:** Quiz creation interface and export/sharing functionality.

**Key Functions:**
- `generateCreatorInputs()` - Create quiz form HTML
- `setupCreatorEventListeners()` - Attach form event handlers
- `addMcqQuestion()` - Add multiple-choice question
- `addTfQuestion()` - Add true/false question
- `displayQuestions()` - Render all questions in creator
- `setupQuestionEventListeners()` - Question input handlers
- `setCorrectAnswer(qId, ansIndex)` - Mark MCQ correct answer
- `deleteQuestion(qId)` - Remove question from quiz
- `setupTrueFalseDropZones()` - T/F zone click handlers
- `exportQuizToJSON()` - Download quiz as JSON file
- `buildQuizPayload()` - Build validated quiz object
- `generateShareLink()` - Create URL-shareable link
- `copyShareLink()` - Copy link to clipboard
- `saveCurrentCreatorState()` - Auto-save creator progress
- `loadCreatorState()` - Restore creator state from localStorage
- `clearCreatorState()` - Reset creator to blank

**Question Types:**
- **Multiple Choice (MCQ)**
  - 4 answer options
  - 1 correct answer designation
  - Radio button selection
- **True/False (T/F)**
  - 2 fixed options: "Đúng" and "Sai"
  - Answer state array

**Quiz Settings:**
- Shuffle questions toggle
- Show score toggle
- Allow review toggle
- Auto-advance time (0 = disabled)

**Storage Keys:**
- `quizMasterCreator` - In-progress quiz creation

---

#### 5. **student.js** (~280 lines)
**Purpose:** Quiz loading, rendering, answering, and scoring logic.

**Key Functions:**
- `loadQuizFromFile(file)` - Parse uploaded JSON quiz file
- `loadQuizFromURL(encodedQuiz)` - Decode URL parameter quiz
- `handleLoadedQuiz(quizData)` - Process and validate loaded quiz
- `renderStudentQuestion()` - Display current question and options
- `selectMcqAnswer(answerIndex)` - Handle MCQ selection
- `selectTfAnswer(answerIndex)` - Handle T/F selection
- `nextQuestion()` - Advance to next question
- `previousQuestion()` - Go to previous question
- `finishQuiz()` - Complete quiz and show results
- `enterRedemptionMode()` - Redo only failed questions
- `backToHome()` - Return to home from results
- `checkURLForQuiz()` - Load quiz from URL on page load

**Question Flow:**
1. Load quiz (file upload or URL)
2. Shuffle questions if enabled in settings
3. Render each question with options
4. Record answer and check correctness
5. Update score and review data
6. Auto-advance if enabled
7. Show results when complete

**Answer Validation:**
- MCQ: Compare selected index with correct answer index
- T/F: Compare selected boolean with answer state
- Provides instant feedback (correct/incorrect)
- Records all responses for review

**Scoring:**
- Points awarded: 1 point per correct answer
- Percentage = (score / total questions) × 100
- Evaluation messages based on percentage:
  - 100% = Hoàn hảo (Perfect)
  - 80-99% = Xuất sắc (Excellent)
  - 50-79% = Khá tốt (Good)
  - <50% = Cần cố gắng (Needs improvement)

---

#### 6. **history.js** (~350 lines)
**Purpose:** Quiz history management, statistics, and analytics.

**Key Functions:**
- `displayHistory(filter)` - Show history with optional filtering
- `calculateHistoryStats(history)` - Compute statistics from history
- `queryHistory(criteria)` - Search/filter history by criteria
- `clearAllHistory()` - Delete all history
- `exportHistoryAsCSV()` - Download history as CSV file
- `getQuizStatistics(quizTitle)` - Stats for specific quiz
- `visualizeHistoryProgress()` - Text-based progress graph
- `getTrendingQuizzes()` - Most attempted quizzes
- `buildReviewHTML(item)` - Generate review display

**History Item Structure:**
```javascript
{
    id: timestamp,                    // Unique identifier
    title: "Quiz Name",               // Quiz title
    date: Date,                       // When attempted
    totalQuestions: 10,               // Question count
    score: 8,                         // Points earned
    percentage: 80,                   // Score percentage
    status: "completed",              // "completed" or "unfinished"
    currentQuestion: 8,               // Position in quiz
    quizData: {},                     // Full quiz data
    originalQuestions: [],            // Unshuffled questions
    quizReviewData: []                // Answer review details
}
```

**Statistics Computed:**
- Total attempts
- Average score percentage
- Highest score
- Number of unique quizzes
- Per-quiz attempt count
- Trending quizzes by frequency

**Filters:**
- `all` - Show all history
- `completed` - Only finished quizzes
- `unfinished` - Only in-progress quizzes

**Storage Keys:**
- `quizHistory` - Array of quiz attempts (max 50)

---

#### 7. **main.js** (~250 lines)
**Purpose:** Application initialization, view management, and global event listeners.

**Key Functions:**
- `initializeApp()` - Initialize all modules and UI
- `switchView(viewName)` - Change between views
- `displayHomeView()` - Render home page
- `updateNavigationActiveState(viewName)` - Highlight active nav
- `setupGlobalEventListeners()` - Attach all event handlers
- `toggleSidebar()` - Mobile sidebar toggle

**Views:**
- **home** - Main landing page with feature cards
- **creator** - Quiz creation interface
- **student** - Quiz playing interface
- **history** - Quiz history and analytics

**Initialization Sequence:**
1. Initialize theme system
2. Load theme preferences
3. Check for saved progress
4. Check URL for quiz parameter
5. Setup global event listeners
6. Load saved user preferences
7. Display home view

**Event Listeners:**
- Navigation link clicks
- File upload button
- Resume/clear progress buttons
- Modal close buttons
- Modal outside-click close
- Sidebar toggle (mobile)
- Sound toggle
- Auto-advance preference
- Tab visibility changes (save progress)
- Keyboard shortcuts:
  - `Ctrl+S` - Save/export quiz
  - `Esc` - Close modals

**Home Statistics:**
- Total unique quizzes attempted
- Average score across all attempts

**Preferences Loaded:**
- Selected theme
- Dark mode setting
- Sound enabled flag
- Auto-advance time preference

---

## Key Features

### Features Included

#### Quiz Creation ✍️
- Multiple-choice questions (4 options, 1 correct)
- True/False questions
- Add/delete questions dynamically
- Quiz title and category
- Optional shuffle questions
- Optional show score toggle
- Optional allow review toggle
- Optional auto-advance timer
- Export to JSON
- Generate shareable links
- Auto-save progress

#### Quiz Playing 📖
- Load from JSON file upload
- Load from URL share link
- Progress tracking per question
- Real-time scoring
- Instant feedback (correct/incorrect)
- Sound effects (toggleable)
- Navigate between questions
- Auto-advance (optional)
- Redemption mode (redo failed questions)
- Review answers after completion

#### History & Analytics 📊
- Track all quiz attempts
- Display attempt date/score/status
- Calculate statistics (average, best, total)
- Filter by completion status
- Resume incomplete quizzes
- Review completed quizzes
- Restart quizzes from history
- Export history as CSV
- Trending quizzes
- Per-quiz statistics

#### Themes & Customization 🎨
- Default blue theme
- Tet Festival theme (red/gold)
- Christmas theme (blue/white)
- Dark mode
- Color customization
- Theme persistence across sessions

#### Accessibility & Responsiveness
- Mobile-first responsive design
- Mobile breakpoints (480px, 768px)
- Tablet optimizations
- Landscape mode support
- Touch-friendly buttons
- Keyboard shortcuts
- Escape key modal close
- Screen reader compatible HTML

---

## Developer Guide

### Adding a New Feature

1. **Identify Responsibility** - Which module should handle this?
2. **Create Function** - Write function in appropriate module
3. **Add Event Listener** - Attach listener in `main.js` or relevant module
4. **Update HTML** - Add elements to `index.html` if needed
5. **Add Styling** - Create CSS in appropriate `css/` module
6. **Test** - Verify in all browsers and device sizes

### Modifying Existing Features

1. **Locate Function** - Find in appropriate `js/` module
2. **Edit Logic** - Modify behavior as needed
3. **Update Related Files** - Check if CSS or HTML needs changes
4. **Test** - Verify no regressions in other features

### Common Tasks

#### Adding a New Question Type
1. Add validation in `utils.js:normalizeQuestion()`
2. Add UI generation in `creator.js:displayQuestions()`
3. Add render logic in `student.js:renderStudentQuestion()`
4. Add scoring in `student.js:selectAnswer()`
5. Add CSS in `quiz.css`

#### Adding a New Theme Color
1. Define colors in `css/variables.css`
2. Add theme rules in `css/themes.css`
3. Add preset in `js/theme.js:themePresets`
4. Add button in `index.html` theme settings

#### Adding a New Setting
1. Add HTML input in relevant view
2. Add event listener in `main.js:setupGlobalEventListeners()`
3. Save to localStorage
4. Load in `main.js:initializeApp()`

---

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Performance Considerations

- CSS split into 7 modules (~100-500 lines each) for maintainability
- JavaScript modules load after DOM ready
- Lazy loading of views (only render when needed)
- Event delegation for dynamic elements
- CSS custom properties for theme switching (no JS needed)
- LocalStorage for persistence (browser native)

## Migration Notes

### From Monolithic to Modular

**Original File Size:** 4,582 lines
- CSS: ~2,500 lines (embedded)
- HTML: ~500 lines (structure)
- JavaScript: ~1,500 lines (embedded)

**New Structure:**
- CSS: 7 files, ~2,000 lines (organized by concern)
- HTML: 1 file, ~250 lines (clean structure)
- JavaScript: 7 files, ~1,500 lines (organized by feature)

**Benefits:**
- ✅ Easier to navigate (max 350 lines per file)
- ✅ Easier to test (isolated concerns)
- ✅ Easier to maintain (clear responsibility)
- ✅ Easier to extend (add features without touching old code)
- ✅ Better code reuse (shared utilities)
- ✅ Faster development (find code quickly)

---

## Future Improvements

- [ ] Add unit tests for each module
- [ ] Implement module bundler (Webpack/Vite)
- [ ] Add TypeScript for type safety
- [ ] Implement service workers for offline support
- [ ] Add database backend for multi-user support
- [ ] Create quiz templates library
- [ ] Add image/video support in questions
- [ ] Implement collaborative quiz creation
- [ ] Add quiz analytics dashboard
- [ ] Mobile app version (React Native/Flutter)

---

## Support & Questions

For issues or questions about the modular structure:
1. Check the module description in this document
2. Review the inline comments in the specific file
3. Look at function signatures and JSDoc comments
4. Check how functions are called in `main.js`

---

**Last Updated:** 2024
**Refactoring Status:** ✅ Complete - Fully Modular
**Original Lines:** 4,582
**Current Lines:** ~3,750 (organized into modules)
**Files Created:** 14 (1 HTML + 7 CSS + 7 JS)
