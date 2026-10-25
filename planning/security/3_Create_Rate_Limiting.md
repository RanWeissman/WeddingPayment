# Event Creation Rate Limiting Specification (`POST /api/create`)

## 1. Section Reference & Alignment
This specification aligns directly with **Section 3 ("Rate Limiting on Event Creation")** of [`1_security_high_level.md`](./1_security_high_level.md).

Its objective is to protect the `POST /api/create` endpoint from automated bot spam and DynamoDB resource exhaustion, reusing the existing single-table DynamoDB rate-limiting architecture (`Gift4Event-Configurations`) at `$0.00` additional monthly cost.

---

## 2. What We Do
Enforce a per-IP creation quota on `POST /api/create` in both `terraform/lambda/index.js` (production) and `local_server.py` (local development parity), limiting each client IP address to a maximum of **10 new event creations per hour (`3600` seconds)**, while also blocking any IP currently held in the Tier-1 Brute-Force Quarantine.

---

## 3. Why We Do It
1. **Current Security Posture vs. Remaining Gap:**
   * **Reads (`GET /api/payment-details/{slug}`):** Already protected by a per-IP rate limiter (`30 reveals/hour` via `ratelimit#<ip>`).
   * **URL Guessing (`404` misses):** Already protected by a 3-tier Brute-Force Quarantine (`15 misses in 60s -> 15m block` via `bruteforce#<ip>`).
   * **Overwrites:** Already blocked via 4-character random suffixes and DynamoDB `ConditionExpression: 'attribute_not_exists(slug)'`.
   * **The Gap (`POST /api/create`):** Currently has no rate limit. An attacker or automated script could send thousands of `POST /api/create` requests per minute, flooding `Gift4Event-Configurations` with fake wedding records and consuming DynamoDB Write Request Units (`WRUs`) and Lambda invocations.
2. **Why `10 Creations / Hour` per IP:**
   A real couple creates their wedding payment page once (or at most 2–3 times if fixing a typo or testing their link). A threshold of `10 creations per hour per IP` is completely invisible to real couples (even on shared Wi-Fi / CGNAT) while immediately stopping automated spam scripts.

---

## 4. How It Works Under the Hood

### Single-Table DynamoDB Counter Design (`$0.00` Extra Infrastructure)
Instead of provisioning paid external services (such as AWS WAF or Redis), we store creation counter records in the existing `Gift4Event-Configurations` table using a dedicated partition key prefix:
* **Partition Key (`slug`):** `ratelimit_create#<clientIp>` (e.g., `ratelimit_create#203.0.113.5`)
* **Quota (`CREATE_RATE_LIMIT_MAX`):** `10` creations
* **Window (`CREATE_RATE_LIMIT_WINDOW_SECONDS`):** `3600` seconds (1 hour)
* **Automatic Cleanup (`ttl`):** Uses the existing DynamoDB `ttl` attribute so expired counter items are automatically purged by AWS at no cost.

### Step-by-Step Request Execution Flow (`POST /api/create`)
Whenever a client submits the "Create Event" form (`POST /api/create`):

1. **Step 1 — Tier-1 In-Memory Quarantine Check (`0ms`, `0` DB Reads):**
   Extract the viewer IP via `getClientIp(event)` and check `isIpQuarantinedInMemory(clientIp)`. If the IP was recently quarantined for brute-force scanning, reject immediately with `403 Forbidden` before touching DynamoDB.
2. **Step 2 — Input Validation First (User-Friendly Quota Preservation):**
   Validate `coupleNames` and `eventDate` (must be present, valid ISO date, and not in the past) **before** incrementing the rate-limit counter. This ensures that if a legitimate couple makes a typo in the date field and receives a `400 Bad Request`, it does **not** waste one of their 10 hourly creation attempts.
3. **Step 3 — Per-IP Creation Rate-Limit Check (`isCreateRateLimited(clientIp)`):**
   * Query DynamoDB `GetItem` for `slug = "ratelimit_create#<clientIp>"`.
   * **Case A (First creation in the last hour, or previous window expired):** Write `{ slug: "ratelimit_create#<clientIp>", count: 1, ttl: nowSec + 3600 }` and allow creation.
   * **Case B (Active window exists and `count < 10`):** Increment `count` by `1` (preserving the original `ttl`) and allow creation.
   * **Case C (Active window exists and `count >= 10`):** Log a warning (`Create rate limit exceeded for IP <clientIp>`), set header `Retry-After: 3600`, and block the request with HTTP `429 Too Many Requests`:
     ```json
     { "error": "נרשמו יותר מדי ניסיונות יצירת דפים מכתובת זו. אנא נסו שוב מאוחר יותר." }
     ```
4. **Step 4 — Fail-Open Resilience:**
   If DynamoDB experiences a transient error during the rate-limit check, log the warning and return `false` (not blocked) so legitimate couples are never prevented from creating their page due to an internal telemetry error.
5. **Step 5 — Internal Key Isolation (`isInternalKey`):**
   Update `isInternalKey(slug)` so that any direct `GET` request to `/api/config/ratelimit_create#...` or `/api/payment-details/ratelimit_create#...` is treated as non-existent (`404`).

---

## 5. How We Implement It (Exact Code Changes)

### A. Production Lambda (`terraform/lambda/index.js`)
1. Add the creation rate-limit constants alongside the existing rate-limit constants:
   ```javascript
   const CREATE_RATE_LIMIT_MAX = 10;               // 10 event creations per IP per hour
   const CREATE_RATE_LIMIT_WINDOW_SECONDS = 3600;  // 1 hour window
   const CREATE_RATE_LIMIT_PREFIX = 'ratelimit_create#';
   ```
2. Add `isCreateRateLimited(clientIp)` (or parameterize `isRateLimited`) to check/increment `${CREATE_RATE_LIMIT_PREFIX}${clientIp}` up to `CREATE_RATE_LIMIT_MAX`.
3. Update `isInternalKey(slug)`:
   ```javascript
   function isInternalKey(slug) {
       return (
           !slug ||
           slug.startsWith(RATE_LIMIT_PREFIX) ||
           slug.startsWith(CREATE_RATE_LIMIT_PREFIX) ||
           slug.startsWith(BF_PREFIX)
       );
   }
   ```
4. Inside `if (method === 'POST' && path.includes('/api/create'))`:
   * Check `isIpQuarantinedInMemory(clientIp)` at the start of the handler.
   * After input validation (`coupleNames` & `eventDate`), call `if (await isCreateRateLimited(clientIp))` and return HTTP `429` with `Retry-After`.

### B. Local Development Server (`local_server.py`)
Mirror the exact same constants (`CREATE_RATE_LIMIT_MAX = 10`, `CREATE_RATE_LIMIT_WINDOW_SECONDS = 3600`, `CREATE_RATE_LIMIT_PREFIX = 'ratelimit_create#'`), `is_create_rate_limited(client_ip)` function, `is_internal_key(slug)` check, and `do_POST` `/api/create` enforcement.

---

## 6. How We Test & Verify It
1. **Normal Creation Flow:** Submit the form on `index.html` with valid couple names and a future date -> verify `201 Created` is returned and the link/QR code is generated normally.
2. **Validation Does Not Burn Quota:** Submit the form with a past date -> verify `400 Bad Request` is returned without creating or incrementing `ratelimit_create#<ip>`.
3. **Quota Enforcement (`429 Too Many Requests`):** Send 10 valid `POST /api/create` requests from the same IP -> all 10 succeed (`201`). Send the 11th request within the same hour -> verify the server blocks it with HTTP `429`, `Retry-After: 3600`, and the Hebrew error message.
4. **Internal Key Isolation:** Request `GET /api/config/ratelimit_create%23127.0.0.1` -> verify `404 Not Found` is returned.
