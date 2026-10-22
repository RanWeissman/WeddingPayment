# Rate Limiting Specification

## 1. Section Reference & Alignment

This architectural design document aligns directly with **Section 6 ("Rate Limiting")** of the `1_privacy_high_level.md` guide. Its primary objective is to implement targeted request throttling on the payment details retrieval endpoint (`/api/payment-details/{slug}`), preventing automated scrapers and bots from harvesting couples' sensitive bank account numbers while keeping operational costs at **$0.00** and adding **zero new cloud tables**.

The specification is tailored to both the production **AWS Serverless Architecture** (CloudFront, API Gateway, Lambda, DynamoDB) and the local development simulation (`local_server.py` + `local_db.json`).

---

## 2. Core Requirements & Architectural Design

### Throttling Boundary & Scope
Rate limiting is decoupled from public static assets (`index.html`, `payment.html`) and the masked event configuration endpoint (`/api/config/{slug}`) so guests never experience friction when opening an invitation link. Throttling is enforced **exclusively** on the unmasked bank account reveal endpoint:
- `GET /api/payment-details/{slug}`

### Threshold & Window (Shared Wi-Fi / CGNAT Safe)
To prevent false-positive blocks when multiple wedding guests share the same IP address (e.g., wedding hall Wi-Fi, workplace network, or mobile Carrier-Grade NAT) while still stopping automated scrapers:
- **Threshold Limit (`RATE_LIMIT_MAX`):** **30 requests** per IP address.
- **Time Window (`RATE_LIMIT_WINDOW_SECONDS`):** **1 hour (3,600 seconds)**.
- **Configurable Constant:** Defined at the top of `lambda/index.js` and `local_server.py` so it can be easily adjusted or tested.

---

## 3. Lean Cloud & Local Storage Strategy ($0 Cost, Single-Table, Fail-Open)

### 3.1 Production Cloud Architecture (Existing DynamoDB Table + TTL)
To avoid both paid services (like AWS WAF) and unnecessary infrastructure bloat (no second DynamoDB table):
- **Single-Table Reuse (`Gift4Event-Configurations`):**
  - Rate-limit counters are stored in the **existing** `Gift4Event-Configurations` table using the reserved Partition Key format:
    - `slug = "ratelimit#<clientIp>"`
    *(Safe from collision because real event slugs only allow `[a-z0-9-]`, never `#`).*
  - **Attributes:**
    - `slug` (String): `"ratelimit#<clientIp>"`
    - `count` (Number): Number of reveal requests in the current 1-hour window.
    - `ttl` (Number): Unix epoch timestamp in seconds (`Math.floor(Date.now() / 1000) + 3600`).
  - **Automatic Cleanup:** DynamoDB native TTL is enabled on the `ttl` attribute in `terraform/api.tf` so expired rate-limit records are automatically evicted by AWS at **$0.00 cost** without touching event records (which do not have a `ttl` attribute).
- **Accurate Client IP Behind CloudFront (`X-Forwarded-For` First):**
  - Because requests flow through CloudFront to API Gateway, `event.requestContext.identity.sourceIp` contains the CloudFront edge IP rather than the guest's IP.
  - Lambda extracts the **first IP** from `event.headers['x-forwarded-for']` (or `event.headers['X-Forwarded-For']`), falling back to `sourceIp` only for direct requests.
- **CloudFront Routing (`terraform/main.tf`):**
  - Ensure `/api/payment-details/*` has an `ordered_cache_behavior` routing to `api_gateway` with `Managed-CachingDisabled` and `Managed-AllViewerExceptHostHeader` so `X-Forwarded-For` reaches API Gateway/Lambda.
- **Fail-Open Safety Guarantee:**
  - The rate-limit check in Lambda is wrapped in its own `try / catch` block. If reading/writing the rate-limit record fails for any unexpected reason, the error is logged and the request **proceeds normally (Fail-Open)** so a technical hiccup never blocks a legitimate guest from viewing payment details.

### 3.2 Local Cloud Simulation (`local_server.py` + `local_db.json`)
To mirror the single-table DynamoDB structure 1:1 during local development:
- `local_server.py` stores per-IP rate-limit records in `local_db.json` under the exact same key pattern `ratelimit#<clientIp>`:
  ```json
  "ratelimit#127.0.0.1": {
    "slug": "ratelimit#127.0.0.1",
    "count": 4,
    "ttl": 1761136800
  }
  ```
- On each request to `/api/payment-details/{slug}`:
  - If no record exists or `now >= ttl`, it sets `count = 1` and `ttl = now + 3600`.
  - If `now < ttl` and `count >= 30`, it immediately returns `429 Too Many Requests` without decrypting the account number.
  - Otherwise, it increments `count` and saves to `local_db.json`.

---

## 4. Integration & User Experience Flow

### 4.1 Backend HTTP Response on Limit Exceeded
When `count >= 30` within the active 1-hour window, the server aborts before reading/decrypting the event's bank details and responds with:
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 3600
Content-Type: application/json

{"error": "נרשמו יותר מדי ניסיונות צפייה מכתובת זו. אנא נסו שוב מאוחר יותר."}
```

### 4.2 Frontend Handling (`payment.html`)
- When the guest clicks the reveal button (`revealAccountNumber()`), the `fetch('/api/payment-details/' + slug)` handler checks specifically for `response.status === 429`.
- On `429`:
  - Displays the clear Hebrew message:
    > "נרשמו יותר מדי ניסיונות צפייה מכתובת זו. אנא נסו שוב מאוחר יותר."
  - Disables the reveal button during the error state to prevent repeated failed clicks.

---

## 5. Summary of Resolved Decisions
1. **30 Requests / Hour per IP:** Prevents false-positive blocks on shared wedding hall Wi-Fi or mobile CGNAT while stopping automated scraping.
2. **Zero Cost & Zero New Tables:** Reuses the existing `Gift4Event-Configurations` table with `slug = "ratelimit#<ip>"` and native DynamoDB `TTL`.
3. **CloudFront-Safe IP Detection:** Reads the client IP from `X-Forwarded-For` first so CloudFront edge IPs are never grouped together.
4. **Fail-Open Resilience:** Any unexpected DB error during rate-limit accounting logs a warning and lets the guest proceed rather than breaking the site.
5. **1:1 Local Parity:** Uses the exact same `ratelimit#<ip>` record structure in `local_db.json`.
