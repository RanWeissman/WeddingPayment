# Brute Force Protection (URL Error Rate Limiting) Specification

## 1. Section Reference & Alignment

This architectural design document maps directly to **Section 7 ("Rate Limiting for URL Errors / Brute Force Protection")** of the `1_privacy_high_level.md` guide. Its primary objective is to detect and block automated brute-force / enumeration attacks that systematically guess event slugs (e.g., `/avi-and-avia-A1B2` or `/event-mp9hnfd0`), while maintaining:
- **$0.00 operational cost** (no paid AWS WAF, no extra DynamoDB reads on valid requests, no DynamoDB reads for already-blocked bots hitting warm Lambda instances).
- **Zero new database tables** (reuses `Gift4Event-Configurations` with TTL).
- **Zero impact or latency for legitimate wedding guests**.

The specification applies to both the production **AWS Serverless Architecture** (CloudFront, API Gateway, Lambda, DynamoDB) and the local development simulation (`local_server.py` + `local_db.json`).

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

## 3. Zero-Overhead Cloud & Local Architecture

### 3.1 Two-Tier Quarantine Check (In-Memory Fast Path + DynamoDB on `404` Only)
To guarantee **0 extra DynamoDB reads** for legitimate guests (`200 OK`) and **0 DynamoDB reads** when a blocked bot continues flooding a warm Lambda instance:

1. **Tier 1 — In-Memory Quarantine Cache (`blockedIpsCache` Map in Lambda / `local_server.py`):**
   - Before touching DynamoDB, the handler checks an in-memory map (`ip -> blockedUntilEpoch`).
   - If `now < blockedUntil`, the request is rejected immediately in **0ms and $0.00 DB cost** with HTTP `403 Forbidden`.
2. **Tier 2 — Normal Event Lookup (`GetCommand(slug)`):**
   - The server fetches the requested event `slug` from `Gift4Event-Configurations`.
   - **If the event exists (`200 OK`)**: The response is returned immediately. **Zero brute-force DB reads or writes occur.**
3. **Tier 3 — On `404 Not Found` Only (`handle404BruteForce(clientIp)`):**
   - Only when the requested `slug` does **not** exist (`404`) does the server read/update the brute-force record `slug = "bruteforce#<clientIp>"` in `Gift4Event-Configurations` (and `local_db.json` locally):
     - **If already quarantined in DB (`now < blockedUntil`)**: Caches `blockedUntil` in the in-memory `blockedIpsCache` and returns `403 Forbidden`.
     - **If no active 60s window (`now >= windowEnd`)**: Writes `count = 1`, `windowEnd = now + 60`, `ttl = now + 60`, and returns `404 Not Found`.
     - **If within active 60s window**: Increments `count`.
       - When `count >= 15`: Sets `blockedUntil = now + 900` and `ttl = now + 900` in DB, stores `blockedUntil` in `blockedIpsCache`, and returns `403 Forbidden`.

### 3.2 Single-Table Record Format (`Gift4Event-Configurations` & `local_db.json`)
```json
{
  "slug": "bruteforce#198.51.100.42",
  "count": 15,
  "windowEnd": 1761133260,
  "blockedUntil": 1761134100,
  "ttl": 1761134100
}
```
- **Automatic Cleanup:** DynamoDB native TTL on the `ttl` attribute automatically deletes expired records at **$0.00 cost**.

### 3.3 CloudFront Header Forwarding (`terraform/main.tf`)
- Update the `/api/config/*` ordered cache behavior in `terraform/main.tf` to forward viewer headers (`Managed-AllViewerExceptHostHeader` with `Managed-CachingDisabled`) so `X-Forwarded-For` is always available to Lambda when a `404` occurs (and so 7-day event expiration is evaluated in real time).

### 3.4 Fail-Open Safety Guarantee
- All brute-force checks and updates are wrapped in `try / catch`. If any unexpected error occurs, a warning is logged and the server **Fails Open** (never crashing the request pipeline).

---

## 4. HTTP Responses

- **Below Threshold (`count < 15` on missing slug):**
  Returns standard `404 Not Found`:
  ```json
  {"error": "Configuration not found"}
  ```
- **Threshold Reached (`count >= 15`) or Active Quarantine (`now < blockedUntil`):**
  Returns `403 Forbidden`:
  ```json
  {"error": "הגישה נחסמה זמנית עקב ניסיונות סריקה מרובים. אנא נסו שוב מאוחר יותר."}
  ```

---

## 5. Summary of Cost & Performance Guarantees

| Scenario | Extra DynamoDB Reads | Extra DynamoDB Writes | Result |
|---|---|---|---|
| **Legitimate guest opens valid event (`200 OK`)** | **0** | **0** | Zero overhead, zero extra cost |
| **Bot hits missing slug (`404`, attempt 1–14)** | 1 | 1 | Counted in `bruteforce#<ip>` (auto-deleted after 60s via TTL) |
| **Bot hits 15th missing slug (`404` → `403`)** | 1 | 1 | Quarantined for 15m in DB + in-memory cache |
| **Quarantined bot keeps flooding warm server** | **0** | **0** | Blocked instantly from in-memory cache (`403 Forbidden`) |
