# Upgrade Plan - Bank Account Privacy

This document outlines the core solutions we will implement to secure the couple's bank account details, keeping the architecture lean and avoiding over-engineering.

## The Lean MVP Plan:

### 1. Masking & "Click to Reveal" (Frontend)
**What it is:** Displaying only partial details by default (e.g., `Account: ****5678`) and requiring a deliberate action (a button click) to see the full information.
**Why it's needed:** Bots and web scrapers typically read the static DOM or the initial JSON payload. By masking the data, passive scraping yields useless information. The "Click to Reveal" acts as a simple but highly effective human verification step.
**Implementation Approach:** Create a reusable React component (`MaskedBankAccount`) that maintains a state (e.g., `isRevealed`). When false, it shows the masked string. When true, it displays the actual number.

### 2. API Separation (Backend)
**What it is:** Ensuring the initial page load (Data Hydration) does *not* contain the sensitive bank details in the payload. 
**Why it's needed:** If the backend sends the full number on the initial load, advanced scrapers can intercept the JSON network request even if the frontend component masks it visually. 
**Implementation Approach:** Modify the main event fetching endpoint (e.g., `GET /api/events/[id]`) to return a `null` or masked value for the bank account. Create a new, dedicated endpoint (e.g., `GET /api/events/[id]/payment-details`) that is *only* called when the "Reveal" button is clicked.

### 3. Time-Windowing
**What it is:** Automatically blocking access to bank details after the event has concluded.
**Why it's needed:** The exposure risk of data increases the longer it sits publicly accessible on the internet. Once the wedding is over and gifts have been given, there is no legitimate reason for the bank account to be public.
**Implementation Approach:** In the new dedicated endpoint, add a date check: `if (currentDate > eventDate + 7_DAYS) { return 403 Forbidden; }`. Additionally, the frontend should stop rendering the "Reveal" button entirely if the time window has passed.

### 4. Database Encryption (Encryption at Rest)
**What it is:** Encrypting the bank account numbers before saving them to the database, and decrypting them only when needed.
**Why it's needed:** If the database is compromised (e.g., an unauthorized export or SQL injection), the attacker will only retrieve scrambled text, not usable financial PII.
**Implementation Approach:** Use a robust encryption library (like Node's native `crypto` module with AES-256-GCM) to encrypt the account number before the database `INSERT`/`UPDATE` operations, and decrypt it right before the `SELECT` returns it via the secure endpoint.

### 5. Prevent Indexing (Noindex)
**What it is:** Instructing search engines (Google, Bing) not to scan or list the payment pages in their search results.
**Why it's needed:** We do not want a couple's name combined with their payment portal showing up when someone googles their names.
**Implementation Approach:** Add `<meta name="robots" content="noindex, nofollow">` to the `<head>` of the specific Next.js page rendering the payment portal, or configure the `X-Robots-Tag` HTTP header.

### 6. Rate Limiting
**What it is:** Restricting the number of times a specific user/IP can request the bank details within a given timeframe.
**Why it's needed:** Even with "Click to Reveal" and a separate API, a malicious bot could theoretically simulate clicks and spam the secure endpoint. Rate limiting prevents brute-force extraction.
**Implementation Approach:** Implement a middleware (e.g., `express-rate-limit` or Upstash/Redis on Vercel) on the dedicated payment details API endpoint. For example, limit requests to 5 per IP address per hour. If the limit is exceeded, return a `429 Too Many Requests` status.

### 7. Rate Limiting for URL Errors (Brute Force Protection)
**What it is:** Monitoring and limiting the number of failed requests (e.g., `404 Not Found`) a specific IP address can make when trying to guess event URLs.
**Why it's needed:** Malicious bots might attempt a brute-force attack by systematically trying thousands of URLs. Rate limiting on errors stops these bots in their tracks before they can successfully guess a valid link.
**Implementation Approach:** Implement a Web Application Firewall (WAF) rule or application-level middleware that tracks 404 responses per IP. If an IP triggers too many 404s within a short period (e.g., 20 errors in 1 minute), temporarily block the IP.
