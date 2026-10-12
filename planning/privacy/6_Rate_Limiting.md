# Rate Limiting Specification

## 1. Section Reference & Alignment

This architectural design document aligns directly with **Section 6 ("Rate Limiting")** of the `privacy_high_level.md` guide. Its primary objective is to implement strict, targeted request throttling on the dedicated payment details retrieval endpoint (`/api/events/[id]/payment-details`), preventing automated scrapers, rogue bots, and malicious actors from harvesting the couple's sensitive bank account information.

The architecture is tailored to the project's lightweight **Static Serverless Architecture** (AWS CloudFront, API Gateway, Lambda, DynamoDB) and aligns seamlessly with local development (`local_server.py`) using pure Vanilla JavaScript on the frontend.

---

## 2. Core Requirements & Architectural Design

### Throttling Boundary & Scope
Rate limiting is strictly decoupled from public static assets (such as HTML shells, CSS, images, and wedding invitations) so legitimate guests never experience friction when loading the site. Instead, throttling is enforced **exclusively** at the boundary of the unmasked payment details retrieval pipeline.

### Algorithmic Mechanics & Thresholds
The system enforces a **Sliding Window Counter** per client IP address:
* **Threshold Limit ($N_{max}$):** 5 requests per IP address.
* **Time Window ($T_{window}$):** 1 hour (3600 seconds).
* **Mathematical Boundary:** For any given client IP, the number of successful retrieval requests within $[T_{now} - 3600\text{s}, T_{now}]$ must not exceed 5:
  $$\sum_{t \in \text{Requests}(IP)} \mathbb{I}(t \ge T_{now} - 3600) \le 5$$
* **Legitimate User Profile:** A genuine wedding guest requires only 1 to 2 interactions (one to view, possibly one if reloaded). A threshold of 5 requests per hour provides ample leeway for real users while presenting an insurmountable barrier to bulk scrapers.

### Distributed State & Implementation Strategy

#### 1. Production Architecture (AWS Serverless)
To avoid server management and keep operational costs within the AWS Free Tier:
* **Primary Defense (API Gateway / AWS WAF):** A rate-based rule or API Gateway Usage Plan configured on the `/api/events/*/payment-details` resource.
* **Application-Level Token Table (DynamoDB with TTL):** A dedicated, lightweight rate-limiting table (`Gift4Event-RateLimits`).
  * **Partition Key:** `ClientIP` (string).
  * **Attributes:** `RequestCount` (number), `WindowStart` (timestamp), `TTL` (epoch timestamp for automatic eviction after 1 hour).
  * **Efficiency:** Utilizing DynamoDB's atomic `ADD` operation and native TTL ensures zero maintenance and automatic cleanup without background workers.

#### 2. Local Environment (`local_server.py`)
* An in-memory sliding window map (`ip_request_history = {ip: [timestamps]}`) tracking request timestamps per client IP. Timestamps older than 3600 seconds are purged on each check.

### Client IP Determination & Anti-Spoofing
* The client IP must be extracted strictly from trusted ingress headers (`X-Forwarded-For` first untrusted entry or CloudFront's `True-Client-IP`), preventing attackers from bypassing limits via spoofed client headers.

---

## 3. Integration & Flow Guidelines

### Request Pipeline & Status Codes
1. **Trigger:** The guest clicks "Click to Reveal" on `payment.html`.
2. **Validation:** The incoming request hits the payment details route. Before querying DynamoDB or decrypting financial PII, the rate limiter evaluates the IP's quota.
3. **Quota Available ($N \le 5$):** The counter increments, and the decrypted payment details are returned with HTTP `200 OK` alongside rate-limit metadata headers:
   ```http
   X-RateLimit-Limit: 5
   X-RateLimit-Remaining: 3
   X-RateLimit-Reset: 1716984000
   ```
4. **Quota Exceeded ($N > 5$):** The backend immediately aborts execution without decrypting data and responds with **HTTP `429 Too Many Requests`**:
   ```http
   HTTP/1.1 429 Too Many Requests
   Retry-After: 3600
   Content-Type: application/json

   {"error": "Too many requests. Please try again later."}
   ```

### Frontend User Experience & Error Recovery (`payment.html`)
To maintain an elegant, premium guest experience:
* **Interception:** Vanilla JavaScript intercepts HTTP `429` status codes in the `fetch()` error handler.
* **Friendly Hebrew Messaging:** Instead of a generic error, the UI dynamically replaces the button state with an informative message:
  > "נרשמו יותר מדי ניסיונות צפייה מכתובת זו. אנא נסו שוב מאוחר יותר."
* **Cooldown State:** The "Reveal" button is disabled during the cooldown period and visually styled with a countdown or muted tone, preventing continuous failed retries.

---

## 4. Why This Solution is Ideal

### Security Vulnerabilities Mitigated
* **Automated Scraping & Script Extraction:** Completely shuts down headless scripts or bots attempting to query endpoints repeatedly.
* **Denial of Wallet / Resource Exhaustion:** Protects downstream compute (Lambda invocations and DynamoDB read capacity units) from financial drain caused by distributed request loops.
* **PII Harvesting at Scale:** Ensures that even if an attacker discovers valid event URLs, they cannot programmatically drain multiple bank details without burning unique IP addresses.

### Dual-Layer Defense Mechanics
1. **Targeted Application Isolation:** Static pages remain fast and fully cached on CloudFront; only sensitive data access triggers rate accounting.
2. **Atomic Quota Validation:** Quota is checked *before* cryptographic decryption or database reads, guaranteeing minimal CPU cycles are spent on throttled clients.

### Trade-off Justification
This rate-limiting model strikes the optimal balance between security and user convenience. For a typical wedding guest, clicking "Reveal" is done once or twice, meaning legitimate traffic never encounters HTTP 429. Simultaneously, relying on native DynamoDB TTL or in-memory tracking maintains the project's zero-cost, serverless posture without requiring third-party SaaS subscriptions (such as paid Redis instances).
