# Masking & Reveal Component Design: `MaskedBankAccount`

## 1. Component Requirements & Deep Design

The `MaskedBankAccount` component is responsible for safely displaying sensitive bank account information to the user. Its primary directive is to assume the client is potentially a scraper, thereby masking data by default and requiring explicit, rate-limited human action to retrieve the sensitive payload.

### State Architecture
The component's internal state machine must handle the asynchronous nature of fetching secure data:
- **`IDLE`**: The baseline state. Displays the statically provided masked account number.
- **`LOADING`**: The state entered immediately upon user interaction. Represents the network request in flight.
- **`REVEALED`**: The terminal success state. Holds the unmasked bank account details in volatile memory.
- **`ERROR`**: The recovery state. Handles network timeouts, rate limiting rejections, or expired time windows.

### Data Flow & Props
- **`eventId` (String)**: The unique identifier required by the secure API endpoint to fetch the specific unmasked details.
- **`initialMaskedValue` (String)**: The masked string provided by the server during initial page hydration (e.g., `****5678`). This ensures no sensitive data is in the initial DOM or JSON payload.
- **Callbacks**: Hooks like `onRevealSuccess` or `onRevealError` to allow the parent application to trigger analytics events or global toast notifications.

## 2. User Experience (UX) & Mitigating API Friction

Fetching data client-side introduces network latency and the possibility of request failure. The UX design must proactively manage these drawbacks so the user feels in control.

### Interaction Flow
1. **Initial State (Idle):** The user sees the masked bank account number alongside a clear, actionable "Click to Reveal" button.
2. **Action & Latency Mitigation (Loading):** 
   - Upon clicking, the button instantly transforms into a "Loading..." state, ideally with a visual CSS spinner.
   - The button becomes disabled to prevent duplicate network requests.
   - The UI dimensions are preserved to prevent layout shift (Cumulative Layout Shift - CLS) while waiting for the API.
3. **Resolved State (Revealed):** 
   - Upon a successful 200 OK response, the unmasked bank account number replaces the masked value smoothly.
   - The "Reveal" button transitions into a "Copy to Clipboard" utility for added user convenience.
4. **Handling Failures (Error State):**
   - If the API fails (e.g., 500 Server Error, 429 Too Many Requests, or a network timeout), the component must gracefully catch the exception.
   - A clear, non-technical error message is displayed inline (e.g., "Unable to load details. Please try again.").
   - Crucially, the "Reveal" button is reinstated as a "Retry" button, providing an immediate and obvious recovery path for the user.

### Accessibility Considerations
- Dynamic state changes must be announced to screen readers via `aria-live` regions.
- The button (whether "Reveal", "Loading", or "Retry") must remain fully accessible via keyboard navigation (`Tab`, `Enter`, `Space`).

## 3. Integration & Security Guidelines

- **Memory Volatility**: The unmasked string must exist only in the component's internal state (e.g., React `useState`). It must never be written to `localStorage`, `sessionStorage`, or persistent state management stores (like Redux/Zustand with persistence middlewares) to ensure it is cleared upon page reload or tab closure.
- **Container Level Checks**: Before rendering this component, the parent container should verify if the event's "Time-Window" has expired. If the wedding passed a week ago, the parent should render a "Payment window closed" message instead of mounting the component, saving unnecessary API calls.

---

## 4. Why This Solution is Ideal

### What it prevents or reduces
This solution is specifically designed to neutralize **Passive Web Scraping** and **Bulk PII Harvesting**. It prevents automated bots, search engine crawlers, and malicious actors from easily compiling lists of real names tied to active bank account numbers by simply scanning public HTML or intercepting standard hydration payloads.

### How it does it
1. **Data Segregation**: By ensuring the initial page load only contains a masked string (e.g., `****5678`), passive scrapers capture useless data. The real data is fundamentally not present on the initial load.
2. **The "Human Action" Barrier**: To get the real data, a secondary HTTP request must be made to a dedicated, isolated API endpoint (`/api/events/[id]/payment-details`). This request is only fired in response to a distinct DOM event (a button click).
3. **Targeted Defense**: Because the unmasked data is behind a specific, isolated API endpoint, we can apply aggressive defense mechanisms to *just* that endpoint without affecting the performance or SEO of the rest of the website. We can easily attach strict IP Rate Limiting (e.g., max 5 requests per hour), require specific custom headers, and implement Time-Window blocking directly on the retrieval of the sensitive data.

### The Trade-off Justification
While this approach introduces a minor UX friction point—specifically the network latency of a secondary API call and the theoretical risk of that call failing—this is an acceptable and highly favorable trade-off. An exposed bank account poses a severe, permanent security and privacy risk to the couple. Conversely, an API failure is a temporary inconvenience that is easily mitigated by providing clear feedback, loading spinners, and an immediate "Retry" button for the user.
