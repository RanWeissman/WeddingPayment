# Gift4Event — Privacy & Security Implementation & Explanation

This document provides a complete summary of all privacy and security layers implemented across the **Gift4Event** platform (covering Specifications `2` through `7`), detailing **what** was built, **how** it works technically in both AWS production and local simulation, and **what protection** each layer provides.

---

## Architecture & Core Design Principles

1. **Zero Fixed Monthly Cost ($0.00):** All security and privacy protections run entirely on existing serverless resources (`AWS Lambda`, a single `DynamoDB` on-demand table with native `TTL`, `SSM Parameter Store`, and static HTML/JS) without requiring paid services like AWS WAF or Redis.
2. **Zero Infrastructure Bloat (Single-Table Design):** Rate limiting and brute-force tracking reuse the existing `Gift4Event-Configurations` DynamoDB table via reserved key prefixes (`ratelimit#<ip>` and `bruteforce#<ip>`) and automatic DynamoDB TTL cleanup.
3. **Fail-Open Reliability:** Every security counter check is wrapped in a `Fail-Open` `try/catch` block so that any unexpected database hiccup never blocks a legitimate wedding guest from sending a gift.
4. **1:1 Cloud & Local Parity:** Every cloud behavior in `terraform/lambda/index.js` + `DynamoDB` is mirrored identically in `local_server.py` + `local_db.json` for local verification.

---

## Feature 1: Account Number Masking & On-Demand Reveal (`2_Masking_Reveal.md`)

### What We Implemented
- When an event page loads (`GET /api/config/{slug}`), the couple's full bank account number is **never** sent in the initial payload. Instead, the server returns only a masked representation showing the last 3 digits (e.g., `••••321`) with `isMasked: true`.
- The full account number is fetched only when the guest explicitly clicks the "Reveal Account Number" (eye icon) button, triggering a dedicated request to `GET /api/payment-details/{slug}`. Once revealed, the button switches to a one-click "Copy Account Number" button.

### How We Implemented It
- **Backend (`terraform/lambda/index.js` & `local_server.py`):**
  - `GET /api/config/{slug}` decrypts the stored account number in memory, masks all but the last 3 digits (`'••••' + rawAcc.slice(-3)`), and sets `isMasked: true`.
  - `GET /api/payment-details/{slug}` returns `{ accountNumber: rawAccount }` with strict `Cache-Control: no-store, no-cache, must-revalidate, private` headers.
- **Frontend (`payment.html`):**
  - Implements a two-state button (`isAccountRevealed`): initially displays an eye icon that fetches `/api/payment-details/{slug}` with a 5-second timeout and loading spinner, then transitions to a clipboard copy button.

### What Protection It Provides
- **Prevents Passive PII Exposure:** Casual page loads, link previews (WhatsApp/Telegram/iMessage bots), and cached config responses never receive the couple's full bank account number.
- **Creates a Dedicated Security Chokepoint:** Separating the reveal action into `/api/payment-details/{slug}` allows strict time-windowing and rate limiting to be applied specifically to sensitive data access without slowing down page loads.

---

## Feature 2: 7-Day Post-Event Time Window (`3_time_window.md`)

### What We Implemented
- Event creation requires a mandatory `eventDate` (`YYYY-MM-DD`) and blocks past dates on both the client (`index.html`) and server (`POST /api/create`).
- Payment details remain accessible during the wedding and for **7 days after `eventDate`** (`eventDate + 7 days` in UTC).
- Once 7 days have passed:
  - `GET /api/config/{slug}` strips all payment links (`bankDetails: null`, `bitLinks: []`, `payboxLinks: []`, `wazeLink: ''`) and returns `isExpired: true` along with `coupleNames`.
  - `payment.html` hides the payment portal and renders a polite Hebrew thank-you card (`"תקופת העברת המתנות הסתיימה 💝..."`) signed with the couple's names.
  - Direct API calls to `GET /api/payment-details/{slug}` are rejected with **`403 Forbidden`**.

### How We Implemented It
- **Frontend Creation (`index.html`):** Added a required date picker with helper text explaining that transfers close one week after the event date, plus client-side validation preventing past dates.
- **Backend Validation & Enforcement (`terraform/lambda/index.js` & `local_server.py`):**
  - `isEventExpired(eventDateStr)` compares `Date.now()` against `eventDate + 7 days (UTC)`.
  - Enforced on both `/api/config/{slug}` (returning the stripped expired state) and `/api/payment-details/{slug}` (returning HTTP `403`).
- **Frontend Expiration UI (`payment.html`):** Checks `if (config.isExpired)` and replaces the card content with the custom thank-you message.

### What Protection It Provides
- **Data Minimization Over Time:** Ensures couples' bank details, Bit links, and PayBox links do not remain indefinitely exposed on the internet months or years after the wedding has ended.
- **Server-Side Enforcement:** Even if an attacker bypasses the UI and queries `/api/payment-details/{slug}` directly after expiration, the backend blocks access with `403 Forbidden`.

---

## Feature 3: Application-Level Database Encryption (`4_Database_Encryption.md`)

### What We Implemented
- Couples' bank account numbers (`bankDetails.accountNumber`) are encrypted at the application layer using **AES-256-GCM** before being written to DynamoDB (or `local_db.json`).
- Each encryption operation uses a fresh, cryptographically random 96-bit Initialization Vector (`IV`) and produces a 128-bit authentication tag (`AuthTag`), stored in the format:
  ```
  v1:<ivHex>:<tagHex>:<ciphertextHex>
  ```
- A one-time idempotent migration script (`scripts/migrate_encrypt_db.py`) converts any legacy plain-text account numbers into `v1:...` ciphertext.

### How We Implemented It
- **Key Management (`terraform/api.tf`, `terraform/variables.tf`, `.env`):**
  - **Production:** A 256-bit (64-hex-char) master key is stored in AWS SSM Parameter Store (`/gift4event/encryption_key` as a `SecureString`) and injected into the Lambda environment as `ENCRYPTION_KEY`.
  - **Local:** Loaded from a gitignored `.env` file.
- **Encryption / Decryption (`terraform/lambda/index.js` & `local_server.py`):**
  - Uses Node's built-in `crypto` module (`aes-256-gcm`) in Lambda and Python's `cryptography` (`AESGCM`) library locally.
  - Encrypts on `POST /api/create`; decrypts on-the-fly in memory during `GET /api/config/{slug}` (prior to masking) and `GET /api/payment-details/{slug}`.

### What Protection It Provides
- **Protection Against Database Leaks:** Even if the database file or a DynamoDB backup/snapshot is exposed, bank account numbers are unreadable ciphertext without the SSM master key.
- **Tamper Detection (Authenticated Encryption):** AES-GCM's authentication tag guarantees integrity — if any byte of the stored ciphertext is altered, decryption immediately throws an authentication error rather than returning corrupted account numbers.

---

## Feature 4: Search Engine & Referrer Privacy (`5_Prevent_Indexing.md`)

### What We Implemented
- Private event pages (`payment.html` / `/<slug>`) include strict `<meta>` directives instructing search engines not to index or follow links on the page, and instructing browsers not to send the private event URL in `Referer` headers when guests click external links.
- The main public landing page (`index.html`) remains open for search engine indexing (SEO).

### How We Implemented It
- Added two static `<meta>` tags inside the `<head>` of `payment.html`:
  ```html
  <meta name="robots" content="noindex, nofollow">
  <meta name="referrer" content="no-referrer">
  ```

### What Protection It Provides
- **Prevents Search Engine Discovery:** Guarantees that searching a couple's names on Google, Bing, or other search engines will never surface their private wedding payment page.
- **Prevents URL Leakage to Third Parties:** When a guest clicks out to Bit, PayBox, or Waze, the external service does not receive `gift4event.com/<couple-slug>` in its HTTP `Referer` logs.

---

## Feature 5: Targeted Rate Limiting on Account Reveal (`6_Rate_Limiting.md`)

### What We Implemented
- Enforces a per-IP limit of **30 requests per hour (3,600 seconds)** exclusively on `GET /api/payment-details/{slug}` (revealing the full bank account number).
- Static pages (`index.html`, `payment.html`) and masked event loads (`/api/config/{slug}`) are never throttled.
- When an IP exceeds 30 reveals within an hour, the server aborts **before** reading or decrypting the event's bank details, returning **`429 Too Many Requests`** (`Retry-After: 3600`), and `payment.html` displays a friendly Hebrew cooldown message while disabling the reveal button.

### How We Implemented It
- **CloudFront-Safe IP Detection (`getClientIp`):** Extracts the real viewer IP from the first entry in `X-Forwarded-For` (forwarded by CloudFront via `Managed-AllViewerExceptHostHeader` in `terraform/main.tf`), ensuring CloudFront edge IPs are never grouped together.
- **Single-Table DynamoDB Storage with Native TTL (`terraform/api.tf`, `terraform/lambda/index.js`, `local_server.py`):**
  - Stores counters under `slug = "ratelimit#<clientIp>"` with `{ count, ttl }` in `Gift4Event-Configurations` (and `local_db.json` locally).
  - DynamoDB native `TTL` (`attribute_name = "ttl"`) automatically deletes expired records after 1 hour at **$0.00 cost**.
- **Frontend UX (`payment.html`):** Intercepts HTTP `429`, displays `"נרשמו יותר מדי ניסיונות צפייה מכתובת זו. אנא נסו שוב מאוחר יותר."`, and disables the button.

### What Protection It Provides
- **Stops Automated PII Scraping:** Prevents bots from harvesting bank account numbers in bulk.
- **Safe for Wedding Hall Wi-Fi & Cellular CGNAT:** Setting the threshold at 30 requests/hour per IP ensures that multiple legitimate guests sharing the same wedding venue Wi-Fi or mobile carrier NAT are never accidentally blocked.

---

## Feature 6: Zero-Overhead Brute Force Protection (`7_Brute_Force_Protection.md`)

### What We Implemented
- Detects automated bots attempting to guess or enumerate event slugs by tracking **`404 Not Found`** responses per IP.
- If a single IP triggers **15 `404` errors within 60 seconds**, that IP is quarantined (blocked with **`403 Forbidden`**) for **15 minutes (900 seconds)**.
- Uses a **Two-Tier Architecture** (In-Memory Fast Path + On-`404` DB Tracking) so that legitimate guests visiting valid links (`200 OK`) incur **zero extra database reads or writes**, and already-blocked bots flooding a warm server are rejected in **0ms with zero database reads**.

### How We Implemented It
- **Tier 1 — In-Memory Quarantine Cache (`blockedIpsCache` in `lambda/index.js` & `local_server.py`):**
  - Checked at the start of `/api/config/{slug}` and `/api/payment-details/{slug}`. If the IP is in an active quarantine window (`now < blockedUntil`), returns `403 Forbidden` immediately from memory without touching DynamoDB.
- **Tier 2 — Normal Event Lookup:**
  - Queries the event `slug`. If found (`200 OK`), returns normally with **0 brute-force DB operations**.
- **Tier 3 — On-`404` Counter (`record404AndCheckQuarantine`):**
  - Triggered **only** when a slug does not exist (`404`). Updates `slug = "bruteforce#<clientIp>"` (`{ count, windowEnd, blockedUntil, ttl }`).
  - On the 15th miss within 60 seconds, sets `blockedUntil = now + 900` in both the DB (with `ttl`) and the in-memory cache, returning `403 Forbidden`.

### What Protection It Provides
- **Neutralizes URL Enumeration Attacks:** Stops dictionary/brute-force scanners after just 15 misses in a minute.
- **Protects Cloud Wallet (Zero Cost Under Attack):** Legitimate guests add 0 DB reads/writes, and quarantined bots hitting warm Lambda instances are dropped in memory before making any DynamoDB calls.

---

## Summary Table of All Implemented Protections

| Spec | Layer | Trigger / Scope | Mechanism | Cost & Guest Impact |
|---|---|---|---|---|
| **2. Masking & Reveal** | API + UI | `GET /api/config/{slug}` vs `/api/payment-details/{slug}` | Masks account as `••••123`; reveals full number only on explicit click | $0 / Zero friction |
| **3. Time Window** | UI + API | `eventDate + 7 days (UTC)` | Strips payment data after 7 days, shows Hebrew thank-you card, blocks reveal API with `403` | $0 / Polite UX |
| **4. DB Encryption** | Backend + DB | `POST /api/create` & `GET` routes | `AES-256-GCM` (`v1:iv:tag:cipher`) with key in AWS SSM / `.env` | $0 / Transparent |
| **5. Prevent Indexing** | Frontend HTML | `payment.html` `<head>` | `<meta name="robots" content="noindex, nofollow">` + `no-referrer` (`index.html` stays SEO-open) | $0 / Zero latency |
| **6. Rate Limiting** | Backend + UI | `GET /api/payment-details/{slug}` | Max **30 reveals / hour / IP** (`ratelimit#<ip>` + DynamoDB TTL, Fail-Open) | $0 / Wi-Fi & CGNAT safe |
| **7. Brute Force** | Memory + DB | `404` misses on event lookup | **15 `404`s in 60s → 15m `403` quarantine** (`bruteforce#<ip>` + in-memory cache, Fail-Open) | $0 / 0 extra DB ops on `200 OK` |
