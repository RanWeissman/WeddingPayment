# Terms of Use, Privacy Consent & Liability Disclaimer (`Clickwrap`)

## 1. Section Reference & Alignment
This specification aligns with **Section 8 ("Terms of Use, Privacy Consent & Liability Disclaimer")** of [`1_security_high_level.md`](./1_security_high_level.md).

Its objective is to protect the site owner legally and operationally by requiring explicit user consent (**Clickwrap Checkbox**) before generating an event payment page, backed by a dedicated, modular Terms of Use & Privacy Policy modal (`frontend/terms-modal.js`) tailored to Israeli law (including **Amendment 13 to the Israeli Privacy Protection Law** and **AS-IS Limitation of Liability**).

---

## 2. What We Do
1. **Dedicated Legal Modal Module (`frontend/terms-modal.js`):**
   Instead of bloating `index.html` or `frontend/info-modals.js`, we create a standalone `frontend/terms-modal.js` module that injects `#terms-modal` into `#modals-root` and provides `openTermsModal()` and `closeTermsModal()`.
2. **Mandatory Clickwrap Checkbox Row (`index.html`):**
   Above the submit button (`צור את דף המתנה שלנו`), add an explicit consent checkbox (`#terms-consent`) where the couple confirms:
   * They verified the accuracy of their bank account and payment links.
   * They agree to the **Terms of Use & Privacy Policy** (with an inline button that opens `#terms-modal` to read the full terms).
3. **Custom Validation Banner on Submit (`frontend/app.js` & `index.html`):**
   If the user clicks **"צור את דף המתנה שלנו"** without ticking the checkbox:
   * Block form submission immediately.
   * Reveal a prominent red validation alert banner (`#terms-consent-error`) directly below the checkbox explaining the exact issue (`"יש לאשר את תנאי השימוש ומדיניות הפרטיות ואת נכונות הפרטים לפני יצירת הדף."`), highlight the consent box, and smoothly scroll it into view.
   * Automatically hide the error banner as soon as the user checks the box.

---

## 3. Why We Do It (Legal & Operational Protection)
1. **Protection Against User Typos in Bank/Payment Details:**
   If a couple mistypes a digit in their bank account or branch number and distributes the QR code to wedding guests, the Terms of Use establish that verifying the accuracy of entered details and testing the generated link before distribution is the **sole responsibility of the event owners**.
2. **Non-Financial Platform & `AS-IS` Disclaimer:**
   Clarifies that Gift4Event is strictly a technical visual display tool—not a bank, payment processor, or escrow service—and bears no liability for bank rejections, Bit/PayBox annual cap blocks, third-party outages, or indirect damages (`AS-IS`).
3. **Israeli Privacy Protection Law (Amendment 13) Compliance:**
   Establishes informed consent (`Clickwrap`) for storing the couple's details in AWS (`AES-256-GCM` encrypted), displaying them to anyone holding the event link during the active window (up to 7 days post-event), and collecting anonymous click analytics and temporary IP rate-limit counters for security.

---

## 4. How We Implement It (Modular File Breakdown)

| File | Responsibility |
| :--- | :--- |
| **`frontend/terms-modal.js`** (New) | Holds the full Hebrew legal text (7 structured clauses covering Platform Nature, Accuracy Responsibility, `AS-IS` Liability Disclaimer, Privacy & Amendment 13, Prohibited Use/Anti-Fraud, Write-Once Immutability, and Governing Law) and injects `#terms-modal` into `#modals-root`. |
| **`index.html`** | Adds the compact `#terms-consent` checkbox card + `#terms-consent-error` alert container above the submit button, and loads `<script src="frontend/terms-modal.js"></script>`. |
| **`frontend/app.js`** | Validates `termsConsent.checked` on form submit (before API call), displays `#terms-consent-error` if unchecked, and clears the error on `change`. |

---

## 5. How We Test & Verify It
1. **Unchecked Submit Test:** Fill out the form fields in `index.html`, leave the Terms checkbox unchecked, and click **"צור את דף המתנה שלנו"** -> verify submission is blocked and the red error message `#terms-consent-error` appears clearly.
2. **Auto-Clear Test:** Tick the checkbox -> verify the red error message disappears immediately.
3. **Modal Inspection Test:** Click **"תנאי השימוש ומדיניות הפרטיות"** inside the checkbox row -> verify the full legal modal opens smoothly without submitting the form or losing typed form data.
