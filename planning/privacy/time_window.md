# Time-Windowing: Architectural Design and Planning Specification

## 1. Section Reference & Alignment

This specification is directly aligned with **Section 3 ("Time-Windowing")** of `privacy_high_level.md`. 

* **Goal:** Automatically block access to bank details after the event has concluded to reduce long-term PII exposure.
* **Alignment with Existing Architecture:** The implementation is strictly tailored to the existing project architecture. By utilizing Vanilla HTML/JS and lightweight components, we leverage the **Config-Driven UI / State Hydration** pattern. The solution enforces strict expiration rules via backend API validation and executes conditional rendering exclusively during the client-side hydration phase, avoiding heavy framework dependencies.

## 2. Core Requirements & Architectural Design

The architecture enforces a strict temporal boundary on data accessibility using passive, stateless validation rules.

* **User Input Logic:** During the event page creation flow, it is a **mandatory requirement** that the user inputs the exact date of their wedding or event ($T_{event}$). This timestamp serves as the immutable anchor for the expiration calculation.
* **Grace Period Calculation:** The expiration threshold is explicitly defined as a 7-day grace period following the event date. The boundary is calculated as: $T_{event} + 7 \text{ days}$.
* **Access Boundary Enforcement:** Once the 7-day grace period elapses, the system guarantees that bank account details, IBANs, or direct financial credentials can no longer be accessed under any circumstances. Post-expiration, the data is logically sealed from both the client interface and the data delivery layer through strict date comparisons ($T_{current} \le T_{event} + 7 \text{ days}$). 

*(Note: No raw implementation code snippets are used here; the architecture relies entirely on mathematical timestamp boundary checks.)*

## 3. Integration & Flow Guidelines

### Frontend Routing & Component Hydration
Within our Vanilla HTML/JS architecture, the application relies on a Config-Driven UI and state hydration upon page load.
* **Dynamic State Evaluation:** During the initial client-side hydration phase, the JavaScript payload evaluates the configuration data (which includes the event date, but *never* the sensitive payment details).
* **Conditional Rendering:** The client calculates the time-window state locally. If the current date exceeds the expiration threshold ($T_{event} + 7 \text{ days}$), the frontend logic actively **omits and strips** the bank details "Click to Reveal" element from the DOM entirely.
* **Result:** The UI completely removes the affordance to request sensitive data if the window has closed, preventing user confusion and eliminating unnecessary network requests from the browser.

### Backend Data Flow & API Security
The backend acts as the ultimate source of truth and enforces the access boundary regardless of the frontend state.
* **Request/Response Pipeline:** When a client attempts to fetch the sensitive payment payload (e.g., via the dedicated payment details API endpoint), the request is intercepted by the backend validation layer.
* **Timestamp Validation Check:** Before querying the database or decrypting any sensitive PII, the backend executes a strict timestamp comparison. It retrieves the event date associated with the requested resource and compares it to the current server time.
* **Enforcement:** If $T_{current} > T_{event} + 7 \text{ days}$, the backend immediately aborts the pipeline and returns a strong HTTP rejection (e.g., `403 Forbidden` or `410 Gone`). The sensitive payment payload is fundamentally unreachable, holding the access boundary intact.
* **Strict Server-Side UTC Enforcement:** The expiration check ($T_{current} \le T_{event} + 7 \text{ days}$) must use the backend server's UTC clock exclusively. The system must never trust or evaluate timestamps provided by the client's browser, as a malicious actor could easily alter their local machine time to bypass the boundary. Additionally, the event date ($T_{event}$) saved in the database and all calculation boundaries must be strictly standardized to UTC to eliminate vulnerabilities related to time zone differences.

## 4. Why This Solution is Ideal

### Security Vulnerabilities Mitigated
* **Long-Term PII Exposure:** By enforcing an expiration date, sensitive financial data does not linger perpetually accessible on the internet, effectively eliminating the risk of historical data breaches.
* **Post-Event Automated Scraping:** Automated scrapers that discover the event link months or years later will encounter a hard backend rejection, making delayed data harvesting impossible.
* **Blast Radius Reduction:** In the event of a compromised frontend or a hijacked API session, an attacker cannot retroactively extract bank details from past events, drastically reducing the blast radius of a potential breach.

### Step-by-Step Defense Mechanics
1. **Creation:** The user inputs the mandatory event date during setup.
2. **Pre-Expiration (Valid Window):** The frontend correctly hydrates and renders the reveal component. The backend validates requests against the 7-day window and serves the data securely.
3. **Expiration Boundary Reached:** The exact millisecond the $T_{event} + 7 \text{ days}$ threshold is crossed, the mathematical boundary becomes false.
4. **Post-Expiration Client:** The frontend hydration cycle calculates the expiration and strips the reveal component from the DOM entirely.
5. **Post-Expiration Backend:** Any direct API request (attempting to bypass the UI) hits the backend timestamp validation check and is immediately rejected.

### Dual-Layer Defense Architecture
This solution operates on two distinct circles of defense:
* **First Circle (UX/Frontend):** Removing the button from the DOM completely prevents user confusion and eliminates unnecessary network calls.
* **Second Circle (Security/Backend):** Opaque and strict time validation on the server exclusively prevents data access at the API level, even if the frontend is bypassed.

### Summary & Trade-off Justification
Ultimately, this is a **Lean, Stateless** solution that does not require heavy background processes or cron jobs. It successfully combines a good user experience (allowing a 7-day grace period for latecomers) with an exceptionally high standard of security and privacy.
