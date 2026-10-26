# Gift4Event — Homepage UI Refinement

## Objective

Update the existing Gift4Event homepage to match the visual reference design.

**This is a focused UI refinement, NOT a complete redesign.**

The goal is to create a cleaner, more compact, modern, and professional homepage while preserving the existing purple brand identity and keeping all website text in Hebrew (`RTL`).

## 1. Preserve Existing Branding

- Keep the original `Gift4Event` logo (`assets/logo.png`) and brand name at the top of the page.
- Purple must remain the dominant brand color.
- Preserve the current purple gradient and light background.
- Keep Hebrew `RTL` support across the entire page.
- Keep the existing typography (`Assistant`).
- Do not introduce additional dominant colors.

## 2. Header and Navigation

Keep the horizontal navigation bar:

- `למה Gift4Event?`
- `איך זה עובד?`
- `דף לדוגמה`
- `מי אנחנו?`

Maintain the clean horizontal pill navigation bar with a thin light-purple border (`#DED3FA`) and subtle separators.
Reduce vertical spacing between the logo, navigation, and main heading.

## 3. Main Hero Section

Main heading:

**`מתנות לחתונה, בלי עמלות.`**

Directly underneath, display only:

**`דף מתנות אישי בחינם`**

Two CTA buttons:

- **`יצירת דף בחינם`** — primary solid-purple button (opens and scrolls to the registration form).
- **`צפייה בדוגמה`** — secondary white button with purple border (opens the live example modal).

## 4. Compact Benefits Bar

Replace the large benefit cards and lengthy descriptions with one compact horizontal bar containing three items:

**`0% עמלות מצד האתר` | `100% חינם` | `פרטיות ושליטה`**

Design requirements:

- One horizontal row on desktop, responsive on mobile.
- Very light purple background (`#F2ECFF`).
- Small purple outline icons (coins, shield-check, padlock).
- Thin vertical separators.
- Subtle rounded corners (`rounded-2xl`).
- No large cards or additional explanatory paragraphs.

## 5. Registration Accordion (`44px` Tall)

The registration accordion trigger (`#toggle-form-btn`) is a **thin `44px` purple horizontal bar**:

- Full width of the content container.
- Height: `44px` (`h-[44px]`).
- Purple gradient matching the brand.
- Rounded pill corners (`rounded-full`) and subtle shadow.
- **No visible text inside the purple bar.**
- Only two small circular icon buttons:
  - Plus (`+`) on the right.
  - Down chevron (`v`) on the left.
- Entire bar is clickable and toggles `#form-fields-wrapper`, with `aria-label="פתיחת טופס יצירת דף מתנה"` and `aria-expanded` state management.

## 6. Reduce Page Clutter

- Removed the large three-card benefits section in favor of the compact benefits bar.
- Removed the redundant bottom CTA section (`"מוכנים ליצור דף מתנות לאירוע שלכם?"`) and duplicate fee explanations.
- Added lightweight, non-distracting SVG decorative elements on desktop (delicate heart outline loop on the right, illustrated lavender/white gift box & floating hearts on the left, and a subtle plus-grid background).

## 7. Acceptance Criteria

- [x] The original purple `Gift4Event` branding and top logo are preserved.
- [x] The hero heading is `"מתנות לחתונה, בלי עמלות."`
- [x] The subtitle is `"דף מתנות אישי בחינם"`.
- [x] Both CTA buttons (`יצירת דף בחינם` and `צפייה בדוגמה`) work as expected.
- [x] Three benefit cards are replaced with one compact benefit bar (`0% עמלות מצד האתר | 100% חינם | פרטיות ושליטה`).
- [x] The purple registration bar contains no visible text and is `44px` tall.
- [x] The entire registration bar opens and closes the existing form.
- [x] The primary CTA opens the same existing form.
- [x] Duplicate marketing sections are removed.
- [x] The design is responsive and RTL-compatible.
- [x] No existing functionality is broken.
