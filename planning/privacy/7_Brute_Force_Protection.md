# Brute Force Protection (URL Error Rate Limiting) Specification

## 1. Section Reference & Alignment

This architectural design document maps directly to **Section 7 ("Rate Limiting for URL Errors / Brute Force Protection")** of the `1_privacy_high_level.md` guide. Its primary objective is to detect and block automated brute-force / enumeration attacks that systematically guess event slugs (e.g., `/avi-and-avia-A1B2` or `/event-mp9hnfd0`), while maintaining **$0.00 operational cost**, **zero new database tables**, and **zero impact on legitimate wedding guests**.

The specification applies identically to the production **AWS Serverless Architecture** (CloudFront, API Gateway, Lambda, DynamoDB) and the local development simulation (`local_server.py` + `local_db.json`).

---

## 2. Core Requirements & Detection Thresholds

### Enumeration Threat Model
Although event slugs include a randomized suffix, automated bots can attempt hundreds of slug guesses per minute against `/api/config/{slug}` or `/api/payment-details/{slug}`.
A legitimate guest clicking an invitation link gets `200 OK` (0 errors), or at most 1–2 `404` errors if they manually mistype a URL. A scanning bot generates a rapid burst of `404 Not Found` responses.

### Threshold & Quarantine Parameters
- **Detection Window (`BF_WINDOW_SECONDS`):** **60 seconds (1 minute)**.
- **Error Threshold (`BF_MAX_404_ERRORS`):** **15 failed requests (`404 Not Found`)** per IP within the 60-second window.
- **Quarantine Duration (`BF_QUARANTINE_SECONDS`):** **15 minutes (900 seconds)**.
- **Configurable Constants:** Defined at the top of `lambda/index.js` and `local_server.py`.

---

## 3. Lean Cloud & Local Storage Strategy ($0 Cost, Single-Table, Fail-Open)

### 3.1 Production Cloud Architecture (Existing DynamoDB Table + TTL)
To avoid paid AWS WAF fees and avoid creating extra DynamoDB tables:
- **Single-Table Reuse (`Gift4Event-Configurations`):**
  - Brute-force tracking records are stored in the **existing** `Gift4Event-Configurations` table using the reserved Partition Key format:
    - `slug = "bruteforce#<clientIp>"`
    *(Guaranteed never to collide with real event slugs, which only allow `[a-z0-9-]`).*
  - **Attributes:**
    - `slug` (String): `"bruteforce#<clientIp>"`
    - `count` (Number): Number of `404` errors from this IP during the active 60-second detection window.
    - `windowEnd` (Number): Unix epoch timestamp (`now + 60`) marking the end of the current 60-second counting window.
    - `blockedUntil` (Number, optional): Unix epoch timestamp (`now + 900`) set when `count >= 15`.
    - `ttl` (Number): Unix epoch timestamp used by DynamoDB native TTL to automatically delete expired records at **$0.00 cost**.
- **Zero Writes on Valid Requests:**
  - When a guest visits a valid event link (`200 OK`), **no write** is made to the brute-force record. Writes only happen when a request actually results in a `404 Not Found`.
- **Accurate Client IP Behind CloudFront:**
  - Reuses `getClientIp(event)` (reading the first IP from `X-Forwarded-For` before falling back to `sourceIp`).
- **Fail-Open Safety Guarantee:**
  - Both the quarantine check and the 404 counter increment are wrapped in `try / catch` blocks. Any unexpected database error logs a warning and **Fails Open** so legitimate traffic is never disrupted.

### 3.2 Local Cloud Simulation (`local_server.py` + `local_db.json`)
To mirror production DynamoDB behavior 1:1 during local testing:
- `local_server.py` stores `"bruteforce#<clientIp>"` records in `local_db.json` with the exact same fields (`slug`, `count`, `windowEnd`, `blockedUntil`, `ttl`).

---

## 4. Request Lifecycle & Execution Flow

1. **Incoming Lookup Request (`GET /api/config/{slug}` or `GET /api/payment-details/{slug}`):**
   - Extract `clientIp`.
2. **Step 1 — Quarantine Pre-Check (`isIpQuarantined(clientIp)`):**
   - Fetch `"bruteforce#<clientIp>"`.
   - If `blockedUntil` is present and `now < blockedUntil`, immediately reject the request with **HTTP `403 Forbidden`** (without querying the event or decrypting data):
     ```http
     HTTP/1.1 403 Forbidden
     Content-Type: application/json

     {"error": "הגישה נחסמה זמנית עקב ניסיונות סריקה מרובים. אנא נסו שוב מאוחר יותר."}
     ```
3. **Step 2 — Event Lookup:**
   - Query the event `slug` as usual.
   - **If found (`200 OK`)**: Proceed normally. No brute-force counter is incremented.
   - **If missing (`404 Not Found`)**: Call `record404Error(clientIp)`:
     - If no active window exists (`now >= windowEnd`), start a new window: `count = 1`, `windowEnd = now + 60`, `ttl = now + 60`.
     - If within the active 60-second window, increment `count`.
     - If `count >= 15`, quarantine the IP: set `blockedUntil = now + 900` and `ttl = now + 900`.
     - Return the `404 Not Found` response. (Any subsequent request from this IP during the next 15 minutes will be stopped at Step 1 with `403 Forbidden`).

---

## 5. Summary of Resolved Decisions
1. **15 Errors in 60s → 15m Quarantine:** Impossible for a normal guest to trigger accidentally, while immediately stopping automated slug scanners.
2. **Zero Cost & Zero New Tables:** Uses the existing `Gift4Event-Configurations` table (`slug = "bruteforce#<ip>"`) with native DynamoDB `TTL`.
3. **Zero Overhead for Valid Guests:** Only `404` misses write to the counter; valid wedding links (`200 OK`) incur no extra writes.
4. **Fail-Open Resilience:** Any unexpected error in the brute-force check logs a warning and allows normal operation.
5. **1:1 Local Parity:** Identical `bruteforce#<ip>` record structure and logic in `local_server.py` + `local_db.json`.
