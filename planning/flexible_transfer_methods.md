# Gift4Event — Flexible Transfer Methods Plan (Recommended Bank Account + Bit + PayBox)

## 1. Objective & Product Context
Currently, the event creation form (`index.html`) strictly requires hosts to enter bank account details (Beneficiary Name, Bank Name, Branch Number, Account Number) while treating Bit and PayBox as optional additions.

The goal of this feature is to introduce flexibility so hosts (e.g., for smaller events or users who prefer not to share bank details) can create a gift page using **at least one transfer method** (Bank Account **or** Bit **or** PayBox), while **preserving Gift4Event's core zero-fee value proposition (`"עמלות? לא בשמחות!"`)** and keeping Bank Transfer as the recommended default.

---

## 2. Host Creation Form UX (`index.html` & `frontend/app.js`)

### 2.1 "Transfer Details" (`פרטי העברה`) Selection Card
Directly below the **"Event Details"** (`פרטי האירוע`) card, a visually prominent **"Transfer Details"** (`פרטי העברה`) control-panel card will present 3 styled checkbox options allowing the host to choose which transfer methods to include on their gift page:

1. **`[✓] חשבון בנק (מומלץ)` (Bank Account — Recommended)** — **Checked (`V`) by default**, with a green bank icon.
2. **`[ ] Bit` (Receive Gift via Bit)** — Unchecked by default, with a rose mobile/Bit icon.
3. **`[ ] PayBox` (Receive Gift via PayBox)** — Unchecked by default, with a cyan PayBox icon.

**Visual Prominence (Control Panel Styling):**
- Because `Bit` and `PayBox` are collapsed by default and only appear when checked here, `#transfer-methods-card` is styled as a distinct **control panel** (`transfer-methods-panel`):
  - Soft lavender-tinted gradient surface (`#F7F3FF` to `#EFE8FF`) with a defined border (`#C9B5F9`) and subtle purple elevation shadow, visually distinguishing it from standard white input cards.
  - Emphasized instruction line (`text-base font-semibold text-[#252336]`): `"סמנו את דרכי ההעברה שתרצו להציג לאורחים בדף המתנה"` accompanied by a highlighted pill/bold note: **`"חובה לבחור לפחות דרך אחת"`**.
  - Prominent option tiles with dedicated colored icons, larger bold labels (`text-base sm:text-[17px]`), and clear active/checked borders and backgrounds.

**Dynamic Section Visibility:**
- Only the sections whose checkboxes are checked (`V`) are expanded and displayed below the selector.
- **Initial Form State:** Only the **Bank Account** fields are open and visible by default (keeping the initial form clean and compact).
- Checking **`Bit`** expands the Bit QR upload section (Host 1 / Host 2).
- Checking **`PayBox`** expands the PayBox link input section (Host 1 / Host 2).

### 2.2 Explanation Popup When Unchecking Bank Transfer
When the user attempts to uncheck (`V`) **"העברה לחשבון בנק"**:
- The checkbox is **not** unchecked immediately. Instead, a dedicated confirmation modal (`#bank-uncheck-modal`) opens.
- **Modal Content:**
  - **Title:** `"רגע לפני שמורידים את ההעברה הבנקאית"`
  - **Body Text:** `"העברה בנקאית היא ללא עמלות כלל, והורדה שלה מדף המתנה עלולה להגדיל את העמלות באפליקציות התשלום השונות (Bit ו־PayBox) עקב תקרות הקבלה השנתיות שלהן."`
  - **Inline Link at the End of the Sentence:** **`להסבר החיסכון`** — Clicking this link closes the confirmation modal (keeping the Bank Transfer checkbox checked `V`), opens the **"למה Gift4Event?"** modal (`openAboutModal()`), and scrolls directly to the fee savings comparison section (`"כמה עמלות אפשר לחסוך?"`).
- **Modal Action Buttons:**
  1. **`"השאר העברה בנקאית (מומלץ)"`** (Primary purple button) — Closes the modal and keeps Bank Transfer checked (`V`) and its fields open.
  2. **`"המשך ללא חשבון בנק"`** (Secondary button) — Unchecks Bank Transfer, closes the modal, and collapses the bank account fields.

---

## 3. Validation Rules on Form Submission (`"יצירת דף המתנה שלנו"`)

### 3.1 Client-Side Validation (`frontend/app.js`)
1. **At Least One Active Transfer Method Required:**
   - At least one of the three transfer method checkboxes (`Bank`, `Bit`, `PayBox`) must be checked (`V`). If none are checked, a clear inline error message is displayed in the Transfer Details card and scrolled into view.
2. **Every Checked (`V`) Transfer Method Must Be Populated:**
   - **If `Bank` is checked (`V`):** All 4 bank fields (`שם המוטב(ים)`, `שם הבנק`, `מספר סניף`, `מספר חשבון`) are required and must not be whitespace-only.
   - **If `Bit` is checked (`V`):** At least 1 valid Bit QR code (Host 1 or Host 2) must be uploaded and decoded. Otherwise, an inline error prompts the user to upload a QR code or uncheck `Bit`.
   - **If `PayBox` is checked (`V`):** At least 1 valid PayBox link (Host 1 or Host 2) must be entered. Otherwise, an inline error prompts the user to enter a link or uncheck `PayBox`.
3. **Payload Sanitization for Unchecked Methods:**
   - If `Bank` is unchecked, the payload sends `bankDetails: null` (ignoring any text typed prior to unchecking).
   - If `Bit` is unchecked, the payload sends `bitLinks: []`.
   - If `PayBox` is unchecked, the payload sends `payboxLinks: []`.

### 3.2 Server-Side Validation (`terraform/lambda/index.js` & `local_server.py`)
In `POST /api/create`:
- **Bank Details Completeness:** Verify whether `bankDetails` is fully provided (`beneficiaryName`, `bankName`, `branchNumber`, `accountNumber` all non-empty) or completely empty/null. If partially filled, return `400 Bad Request` (`"יש למלא את כל פרטי חשבון הבנק."`).
- **At Least One Valid Transfer Method:** Verify that the request includes a complete `bankDetails` object **OR** at least one link in `bitLinks` **OR** at least one link in `payboxLinks`. If all three are empty, return `400 Bad Request` (`"יש להזין לפחות דרך העברה אחת (חשבון בנק, Bit או PayBox)."`).
- **Encryption & Masking:** AES-256-GCM encryption and account number masking (`••••123`) run only when `bankDetails` is present.

---

## 4. Guest Payment Page Behavior (`payment.html` & `frontend/payment.js`)

### 4.1 When the Event Includes a Bank Account
- The **"העברה לחשבון הבנק"** button (`#toggle-bank-btn`) is displayed at the top of the payment options.
- **Conditional `"מועדף ❤️"` Badge (`#bank-preferred-badge`):**
  - Displayed on `#toggle-bank-btn` **only when at least one additional transfer method (`Bit` or `PayBox`) is configured** for the event.
  - If the event has **only** a bank account (no Bit and no PayBox), the `"מועדף ❤️"` badge is hidden (`hidden`), and the button displays only `"העברה לחשבון הבנק"`.
- Clicking the **Bit** or **PayBox** button opens the bank preference confirmation modal (`#bit-modal` / `#paybox-modal`): *"רגע לפני שממשיכים — אנחנו מעדיפים שתבחרו בהעברה לחשבון הבנק 🙏🏼"*.

### 4.2 When the Event Was Created Without a Bank Account (Bit and/or PayBox Only)
- Both `#toggle-bank-btn` and `#bank-details` are completely hidden (`hidden`).
- Only the configured **Bit** and/or **PayBox** buttons are displayed.
- When a guest clicks **Bit** or **PayBox**, the bank preference modal (`#bit-modal` / `#paybox-modal`) is **skipped**, the analytics event (`bit_click` / `paybox_click`) is fired immediately, and the payment link opens directly in a new tab.

---

## 5. Technical File-by-File Breakdown

1. **`index.html`:**
   - Add the **"פרטי העברה"** selector card with the 3 checkbox controls (`#enable-bank` checked by default, `#enable-bit`, `#enable-paybox`).
   - Wrap the Bank (`#bank-section-wrapper` — visible by default), Bit (`#bit-section-wrapper` — hidden by default), and PayBox (`#paybox-section-wrapper` — hidden by default) sections.
   - Add validation error containers (`#transfer-methods-error`, `#bit-required-error`, `#paybox-required-error`).
   - Add the `#bank-uncheck-modal` confirmation popup containing the explanation and the **`להסבר החיסכון`** link.
2. **`frontend/info-modals.js`:**
   - Add `id="about-savings-section"` to the `"כמה עמלות אפשר לחסוך?"` comparison block inside `#about-modal`.
   - Add helper `openAboutSavingsSection()` to open `#about-modal` and smoothly scroll to `#about-savings-section`.
3. **`frontend/app.js`:**
   - Manage checkbox state and toggle visibility of `#bank-section-wrapper`, `#bit-section-wrapper`, and `#paybox-section-wrapper`.
   - Intercept unchecking `#enable-bank` to display `#bank-uncheck-modal`.
   - Enforce submit validation (at least one method checked, every checked method populated) and send `bankDetails: null` when bank is unchecked.
4. **`terraform/lambda/index.js` & `local_server.py`:**
   - Add 1:1 server-side validation in `POST /api/create` ensuring at least one complete transfer method is provided and handling `bankDetails: null` cleanly.
5. **`payment.html` & `frontend/payment.js`:**
   - Add `id="bank-preferred-badge"` to the `"מועדף ❤️"` badge inside `#toggle-bank-btn`.
   - Show `#bank-preferred-badge` only when `hasBankDetails && (validBitLinks.length > 0 || validPayboxLinks.length > 0)`.
   - Hide `#toggle-bank-btn` and `#bank-details` when `!hasBankDetails`, and open Bit/PayBox links directly without showing `#bit-modal` or `#paybox-modal`.

---

## 6. Acceptance Criteria
- [ ] On opening the creation form, `העברה לחשבון בנק` is checked (`V`) and expanded, while `Bit` and `PayBox` are unchecked and collapsed.
- [ ] Attempting to uncheck `העברה לחשבון בנק` opens the confirmation modal with the fee explanation and the **`להסבר החיסכון`** link.
- [ ] Clicking **`להסבר החיסכון`** closes the confirmation modal (keeping Bank checked `V`), opens the **"למה Gift4Event?"** modal, and scrolls to the fee savings comparison section.
- [ ] Clicking **"השאר העברה בנקאית (מומלץ)"** keeps `V` checked and the bank fields open; clicking **"המשך ללא חשבון בנק"** unchecks `V` and collapses the bank fields.
- [ ] Submitting the form fails with a clear inline error if no transfer method is checked, or if any checked (`V`) transfer method has empty fields.
- [ ] On the guest page (`payment.html`): if **only** a bank account is configured (no Bit, no PayBox), the bank button is shown **without** the `"מועדף ❤️"` badge.
- [ ] On the guest page (`payment.html`): if **both** a bank account and Bit/PayBox are configured, the bank button shows the `"מועדף ❤️"` badge and clicking Bit/PayBox opens the bank preference modal.
- [ ] On the guest page (`payment.html`): if the event was created **without** a bank account, the bank button is hidden and clicking Bit/PayBox opens the link directly without the bank preference modal.
