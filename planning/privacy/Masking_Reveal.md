# Masking & Reveal Implementation Design

## 1. Implementation Requirements & Deep Design

The Masking & Reveal logic is responsible for safely displaying sensitive bank account information to the user. Its primary directive is to assume the client is potentially a scraper, thereby masking data by default and requiring explicit, rate-limited human action to retrieve the sensitive payload.

### Tech Stack Alignment
- **Vanilla JavaScript & HTML**: The solution must be implemented elegantly using pure HTML, Vanilla JavaScript, and Tailwind CSS classes. This perfectly aligns with the project's existing lightweight architecture (e.g., `payment.html`). Heavy frontend frameworks like React are strictly unnecessary and should be avoided to maintain optimal performance and simplicity.

### State Architecture
The DOM and simple JavaScript variables will manage the asynchronous states of fetching secure data:
- **`IDLE`**: The baseline state. The HTML displays the statically provided masked account number.
- **`LOADING`**: The state entered immediately upon user interaction. Represents the network request in flight.
- **`REVEALED`**: The terminal success state. Holds the unmasked bank account details temporarily in the DOM.
- **`ERROR`**: The recovery state. Handles network timeouts, rate limiting rejections, or expired time windows.

### Data Flow
- **`eventId`**: A unique identifier embedded in the HTML (e.g., via a `data-event-id` attribute) required by the API to fetch the specific unmasked details.
- **`initialMaskedValue`**: The masked string rendered directly by the server into the initial HTML (e.g., `<span id="account">****5678</span>`). This ensures no sensitive data is in the initial page source.

## 2. User Experience (UX) & Mitigating API Friction

Fetching data client-side introduces network latency and the possibility of request failure. The UX design must proactively manage these drawbacks so the user feels in control.

### Interaction Flow
1. **Initial State (Idle):** The user sees the masked bank account number alongside a clear, actionable "Click to Reveal" `<button>`.
2. **Action & Latency Mitigation (Loading):** 
   - Upon clicking, JavaScript instantly updates the button to a "Loading..." state (e.g., toggling Tailwind classes to show a visual CSS spinner).
   - The button is disabled (`disabled=true`) to prevent duplicate network requests.
   - The UI dimensions are preserved to prevent layout shift (Cumulative Layout Shift - CLS).
3. **Resolved State (Revealed):** 
   - Upon a successful `fetch()` response, JavaScript replaces the masked text in the DOM with the unmasked bank account number.
   - The "Reveal" button transitions into a "Copy to Clipboard" utility.
4. **Handling Failures (Error State & Strict Timeouts):**
   - **Strict Timeout:** The `fetch()` request must implement a strict time limit (e.g., 3-5 seconds) using an `AbortController`. If the server does not respond within this window, the request is actively aborted to prevent the user from waiting indefinitely.
   - If the `fetch()` fails (e.g., 500 Server Error, 429 Too Many Requests, or the aforementioned timeout), JavaScript catches the error.
   - A clear, non-technical error message is injected into the DOM (e.g., "Unable to load details. Please try again.").
   - Crucially, the "Reveal" button is reinstated as a "Retry" button, providing an immediate recovery path for the user.

### Accessibility Considerations
- Dynamic DOM changes must be announced to screen readers via `aria-live` regions.
- The button (whether "Reveal", "Loading", or "Retry") must remain fully accessible via keyboard navigation (`Tab`, `Enter`, `Space`).

## 3. Integration & Security Guidelines

- **Memory Volatility**: The unmasked string must exist only in the DOM and the active JavaScript execution context. It must never be written to `localStorage` or `sessionStorage` to ensure it is completely cleared upon page reload or tab closure.
- **Container Level Checks**: Before rendering the reveal button in the HTML, the server should verify if the event's "Time-Window" has expired. If the wedding passed a week ago, the server should simply render a "Payment window closed" message and omit the reveal button entirely, saving unnecessary API calls.

---

## 4. Why This Solution is Ideal

### What it prevents or reduces
This solution is specifically designed to neutralize **Passive Web Scraping** and **Bulk PII Harvesting**. It prevents automated bots, search engine crawlers, and malicious actors from easily compiling lists of real names tied to active bank account numbers by simply scanning public HTML.

### How it does it
1. **Data Segregation**: By ensuring the initial HTML load only contains a masked string (e.g., `****5678`), passive scrapers capture useless data. The real data is fundamentally not present on the initial load.
2. **The "Human Action" Barrier**: To get the real data, a secondary JavaScript `fetch()` request must be made to a dedicated, isolated API endpoint (`/api/events/[id]/payment-details`). This request is only fired in response to a distinct DOM event (a button click).
3. **Targeted Defense**: Because the unmasked data is behind a specific, isolated API endpoint, we can apply aggressive defense mechanisms to *just* that endpoint without affecting the performance or SEO of the rest of the website. We can easily attach strict IP Rate Limiting (e.g., max 5 requests per hour), require specific custom headers, and implement Time-Window blocking directly on the retrieval of the sensitive data.

### The Trade-off Justification
While this approach introduces a minor UX friction point—specifically the network latency of a secondary API call and the theoretical risk of that call failing—this is an acceptable and highly favorable trade-off. An exposed bank account poses a severe, permanent security and privacy risk to the couple. Conversely, an API failure is a temporary inconvenience that is easily mitigated by providing clear feedback, loading spinners, and an immediate "Retry" button for the user using lightweight Vanilla JavaScript.

---

## 5. Scope Statement (Relation to privacy_high_level.md)
*Note:* This detailed implementation design fully covers and connects **both Section 1 (Masking & "Click to Reveal" Frontend)** and **Section 2 (API Separation Backend)** of the `privacy_high_level.md` document. It defines how the frontend interaction behaves (Section 1), while strictly relying on the backend architectural requirement that the initial page load is masked and the real data sits securely behind an isolated API endpoint (Section 2).
