# Brute Force Protection (URL Error Rate Limiting) Specification

## 1. Section Reference & Alignment

This architectural design document maps directly to **Section 7 ("Rate Limiting for URL Errors / Brute Force Protection")** of the `privacy_high_level.md` guide. Its primary objective is to detect, monitor, and neutralize automated brute-force attacks aimed at systematically guessing valid event slugs (e.g., `paz-and-lior-A1B2` or `event-mp9hnfd0`) through high-frequency enumeration attempts.

By monitoring the accumulation of failed URL requests (`404 Not Found`), the system detects adversarial reconnaissance and temporarily isolates the offending IP address before any valid link can be compromised.

---

## 2. Core Requirements & Architectural Design

### The Enumeration Threat Model
Although event slugs feature high entropy and randomized alphanumeric identifiers, automated bot nets can iterate through thousands of permutations per minute. If left unmonitored, an attacker could discover active event pages and map couples to payment portals. 

### Detection Threshold & Sliding Window
A legitimate user will rarely generate more than 1 or 2 `404` errors (typically caused by an accidental typo in a shared URL). Conversely, a bot systematically scanning URLs generates a rapid flurry of misses:
* **Detection Window ($\Delta t$):** 60 seconds.
* **Error Threshold ($E_{max}$):** 15 failed requests (`404 Not Found`).
* **Quarantine Duration ($T_{quarantine}$):** 15 minutes (900 seconds).
* **Mathematical Condition:**
  $$\sum_{t \in \text{Errors}(IP)} \mathbb{I}(t \ge T_{now} - 60\text{s}) > 15 \implies \text{Quarantine}(IP, T_{now} + 900\text{s})$$

### Distributed Architecture & State Enforcement

#### 1. Production Architecture (AWS Edge & Serverless)
* **AWS WAF Rate-Based & Custom Rules:**
  * WAF inspects response status codes from the CloudFront distribution and API Gateway.
  * When an IP address exceeds the 404 error threshold within a rolling evaluation window, AWS WAF automatically adds the IP to a temporary IP Set Blocklist for 15 minutes.
  * Any subsequent request from that IP is terminated directly at the CloudFront Edge with an immediate `403 Forbidden` response, consuming zero Lambda executions and zero database reads.
* **Fallback Serverless Quarantine Table (DynamoDB with TTL):**
  * In the absence of an active WAF rule, a lightweight table (`Gift4Event-IPQuarantine`) records quarantined IPs:
    * **Partition Key:** `ClientIP` (string).
    * **Attributes:** `BlockedUntil` (epoch timestamp), `TTL` (epoch timestamp matching expiration).
    * Fast single-key lookup during the edge routing phase.

#### 2. Local Environment (`local_server.py`)
* A rolling error counter dictionary (`ip_404_history = {ip: [timestamps]}`) and an active quarantine map (`ip_blocked = {ip: unblock_timestamp}`).
* When a 404 occurs on `/api/config/*` or route rewriting, the timestamp is logged.
* Once the count exceeds 15 within 60 seconds, the IP is added to `ip_blocked` for 15 minutes, rejecting all subsequent requests with HTTP `403 Forbidden`.

---

## 3. Integration & Flow Guidelines

### Request Lifecycle & Enforcement Pipeline

1. **Incoming Request:** Client sends a request to an event URL (e.g., `/event-unknown123`).
2. **Quarantine Check:** 
   * If the IP is currently on the active quarantine list ($T_{now} < \text{BlockedUntil}$), the request is rejected immediately with **HTTP `403 Forbidden`**:
     ```http
     HTTP/1.1 403 Forbidden
     Content-Type: application/json

     {"error": "Access temporarily restricted due to suspicious activity. Try again later."}
     ```
3. **Route Lookup & Execution:**
   * If the event exists, the request proceeds normally.
   * If the event does not exist, the server records a `404 Not Found` event against the IP.
4. **Threshold Evaluation:**
   * The server calculates the number of 404s recorded for that IP over the past 60 seconds.
   * If $\text{Errors} > 15$, the IP is immediately transitioned into the `QUARANTINED` state for 15 minutes.
   * A security warning is logged for monitoring.

### Handling False Positives
* **High Threshold Safety Margin:** Setting the trigger at 15 errors in 60 seconds provides complete protection against false positives. No legitimate wedding guest ever encounters 15 broken links in under a minute.
* **Automatic Expiration:** Quarantines automatically expire after 15 minutes, ensuring that dynamic IP pools (e.g., cellular network NAT gateways) are not permanently penalized.

---

## 4. Why This Solution is Ideal

### Security Vulnerabilities Mitigated
* **Systematic URL Enumeration & Dictionary Attacks:** Prevents attackers from brute-forcing random or custom slugs.
* **OSINT & Reconnaissance:** Shuts down scrapers before they can catalog valid wedding links.
* **Serverless Cost Amplification (Denial of Wallet):** Drops malicious crawler traffic at the edge before it invokes backend compute or DynamoDB reads.

### Defense-in-Depth Advantage
1. **Zero Impact on Valid Links:** Guests following valid links or scanning invitation QR codes hit `200 OK` responses and never touch the 404 counting logic.
2. **Edge-Level Termination:** By dropping blocked requests early (via WAF or edge middleware), the backend is completely shielded from high-volume scanning storms.

### Trade-off Justification
This solution provides robust brute-force protection with virtually zero overhead. Legitimate wedding attendees will never trigger 15 consecutive missing page errors, while attackers running automated discovery scripts will be swiftly blocked. By utilizing TTL-based automatic expiration, the system requires no manual administration or complex unblock portals.
