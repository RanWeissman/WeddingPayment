# Event Creation Rate Limiting Specification (`POST /api/create`)

## 1. Section Reference & Alignment
This specification aligns with **Section 3 ("Rate Limiting on Event Creation")** of [`1_security_high_level.md`](./1_security_high_level.md).

Its objective is to protect the `POST /api/create` endpoint from automated spam and database exhaustion attacks, reusing the existing single-table DynamoDB rate-limiting design (`Gift4Event-Configurations`) at `$0.00` additional cost.

---

## 2. Threat Model & Current State
* **What is already protected:**
  * `GET /api/payment-details/{slug}` is protected by a per-IP rate limiter (`30 requests / hour` via `ratelimit#<ip>`).
  * Missing slugs (`404`) are protected by a 3-tier Brute-Force Quarantine (`15 misses in 60s -> 15m block` via `bruteforce#<ip>`).
  * Existing events cannot be overwritten due to random 4-char suffixes and `ConditionExpression: 'attribute_not_exists(slug)'`.
* **What is vulnerable:**
  * `POST /api/create` currently performs no IP rate-limit check. A malicious script could send thousands of `POST /api/create` requests per minute, polluting DynamoDB with fake wedding records.

---

## 3. Architectural Design

### Quota & Window Parameters
* **Key Prefix:** `ratelimit_create#<clientIp>` (stored in the same `Gift4Event-Configurations` table using `slug` as the partition key, separated from read quotas).
* **Max Creations per Window (`CREATE_RATE_LIMIT_MAX`):** `10` event creations per IP address.
* **Window Duration (`CREATE_RATE_LIMIT_WINDOW_SECONDS`):** `3600` seconds (1 hour).
* **TTL Cleanup:** Uses the existing DynamoDB `ttl` attribute so counter records expire automatically.
* **Fail-Open Behavior:** If DynamoDB throws an unexpected error during the rate-limit check, log a warning and allow the couple to create their page (ensuring legitimate users are never blocked by transient internal errors).

### Request Flow (`POST /api/create`)
1. Extract viewer IP via `getClientIp(event)`.
2. Check Tier-1 in-memory quarantine (`isIpQuarantinedInMemory(clientIp)`). If quarantined, return `403 Forbidden`.
3. Validate payload fields (`coupleNames`, `eventDate`) first so accidental form validation errors by a legitimate user do not consume their creation quota.
4. Check `isCreateRateLimited(clientIp)` in DynamoDB (`ratelimit_create#<clientIp>`).
5. If quota is exceeded (`>= 10` creations in the active 1-hour window):
   * Return `429 Too Many Requests` with header `Retry-After: 3600` and a clear Hebrew error message:
     `{ "error": "נרשמו יותר מדי ניסיונות יצירת דפים מכתובת זו. אנא נסו שוב מאוחר יותר." }`
6. Otherwise, increment the counter and proceed with encrypting `bankDetails.accountNumber` and saving the new event item.

---

## 4. Files to Update During Implementation
1. **`terraform/lambda/index.js`**:
   * Add `CREATE_RATE_LIMIT_MAX = 10`, `CREATE_RATE_LIMIT_WINDOW_SECONDS = 3600`, and `CREATE_RATE_LIMIT_PREFIX = 'ratelimit_create#'`.
   * Update `isInternalKey(slug)` to also block `slug.startsWith(CREATE_RATE_LIMIT_PREFIX)`.
   * Call the rate-limit check in the `POST /api/create` handler after input validation and before `PutCommand`.
2. **`local_server.py`**:
   * Mirror the per-IP creation rate limit in local development parity if applicable.
