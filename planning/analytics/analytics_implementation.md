# Analytics Implementation Specification: AWS Serverless Data Lake

This document translates the theoretical requirements defined in `analytics_architecture.md` into concrete, highly detailed implementation steps. The chosen architecture is the **AWS Serverless Data Lake (S3 + Athena)**. This approach optimizes for maximum analytical query power (native SQL grouping and sorting) while maintaining a near-$0.00 operational cost.

---

## 1. AWS Service Mapping & Network Flow

*   **Ingress & Compute Layer:** AWS Lambda featuring **Lambda Function URLs**. 
    *   *Detail:* This exposes the Lambda validation engine directly to the web via a unique HTTPS endpoint (e.g., `https://<id>.lambda-url.<region>.on.aws/`). This entirely bypasses API Gateway, stripping away complex routing rules, reducing latency, and drastically lowering invocation costs.
*   **Persistence Layer (Data Lake):** Amazon S3. 
    *   *Detail:* S3 acts as an immutable, infinitely scalable ledger for raw telemetry events. Data is never updated or deleted; it is strictly append-only.
*   **Query Engine:** Amazon Athena (backed by AWS Glue Data Catalog). 
    *   *Detail:* Athena provides the serverless environment to execute complex SQL queries directly against the S3 flat files without requiring any data pipeline to load it into a relational database.

---

## 2. Detailed Data Schema & Event Actions

To ensure the architecture perfectly supports the required sorting and aggregation via Athena, the data schema remains strictly flat. The Lambda function will save each payload as a discrete JSON string.

### Schema Fields
1.  **Primary Identifier (`event_id`)**
    *   **Type:** String
    *   **Implementation Detail:** This is derived directly from the URL path or query parameter of the payment page (e.g., `ron-and-maya-lvyz6b`). It is strictly used to group a single user's journey across the page.
2.  **Sorting Metric (`timestamp`)**
    *   **Type:** String (ISO-8601 Format)
    *   **Implementation Detail:** Generated *exclusively* on the server (Lambda) at the exact moment of ingestion (e.g., `2026-05-24T12:00:00.123Z`). Client-side timestamps are explicitly rejected to prevent manipulation and clock skew.
3.  **Dimension (`action_type`)**
    *   **Type:** String (Enum)
    *   **Implementation Detail:** This represents the specific user interaction. The Lambda function must strictly reject any payload where the `action_type` is not exactly one of the following six values (as defined in the architecture specification):
        *   **Action A (`bank_copy`):** Triggered precisely when the user interacts with the “Copy Account Number” button/icon.
        *   **Action B (`bit_click`):** Triggered when the user clicks the explicit link to open the “Bit” application (nested inside the popup modal of Bit).
        *   **Action C (`paybox_click`):** Triggered when the user clicks the explicit link to open the “PayBox” application (nested inside the popup modal of PayBox).
        *   **Action D (`bit_bank_click`):** Triggered when the user clicks the explicit button to open the “חשבון בנק” (bank account) section (nested inside the popup modal of Bit).
        *   **Action E (`paybox_bank_click`):** Triggered when the user clicks the explicit button to open the “חשבון בנק” (bank account) section (nested inside the popup modal of PayBox).
        *   **Action F (`waze_click`):** Triggered when the user clicks the explicit button to open the Waze navigation link.

**Storage Format & Partitioning Strategy:** 
The Lambda function writes objects to S3 using a time-based prefix: `s3://gift4event-analytics/year=2026/month=05/day=24/<event_id>_<unix_timestamp>.json`. This partition structure (`year/month/day`) makes Athena queries significantly faster and cheaper by restricting the amount of data scanned.

---

## 3. Component Implementation Details (Order of Execution)

Infrastructure must be provisioned in the following sequence:

### Step 1: Persistence (Amazon S3 Data Lake)
*   **Action:** Provision an S3 bucket (e.g., `gift4event-analytics-logs`).
*   **Configuration:** Block all public access. The bucket is strictly private and only writable by the ingestion Lambda function role and readable by the Athena execution role.

### Step 2: Query Catalog (AWS Glue & Athena)
*   **Action:** Define an AWS Glue Data Catalog database and table pointing to the S3 bucket.
*   **Configuration:** Map the JSON keys (`event_id`, `timestamp`, `action_type`) to SQL column types (`string`, `timestamp`, `string`). Configure the partition keys (`year`, `month`, `day`).

### Step 3: Processing & Ingestion (AWS Lambda Validation Engine)
*   **Action:** Deploy the telemetry validation engine as an AWS Lambda function (Node.js or Python).
*   **IAM Permissions:** The Lambda Execution Role MUST be granted explicit `s3:PutObject` rights scoped strictly to the S3 bucket created in Step 1.
*   **Network Ingress:** Enable a **Lambda Function URL** with `AuthType: NONE` (publicly accessible over HTTPS).
*   **Security (CORS):** Configure the Function URL's CORS headers to restrict `AllowOrigins` strictly to the production domains (e.g., `https://www.gift4event.com`).
*   **Strict Code Logic Requirements:**
    1.  Parse the incoming JSON payload from `event.body`.
    2.  Validate the presence and format of `event_id`.
    3.  Validate `action_type` strictly against the 6 allowed values list. If it doesn't match, return an `HTTP 400 Bad Request` immediately.
    4.  Generate the trusted server-side ISO-8601 `timestamp`.
    5.  Format the data into a JSON string: `{"event_id": "...", "timestamp": "...", "action_type": "..."}`.
    6.  Execute an asynchronous `s3.putObject()` operation to the S3 bucket, using a unique filename combining the `event_id` and timestamp.
    7.  **Error Handling (CloudWatch Fallback):** If the S3 write operation fails for any reason (e.g., timeout, permissions), the Lambda must catch the error and explicitly log the entire JSON payload (`event_id`, `action_type`, `timestamp`) along with the raw error message to **Amazon CloudWatch Logs**. This ensures the event data isn't permanently lost even if storage is temporarily unavailable.
    8.  Return a rapid, "fire-and-forget" `HTTP 200 OK` response to the client on success (or an `HTTP 500` if the S3 write failed).

---

## 4. Analytical Queries & Extraction Strategy

By utilizing Athena, the system can fulfill the exact query requirements without complex data extraction scripts. Metrics are retrieved by running standard SQL directly in the AWS Athena Console.

**1. Aggregation (Total Actions by Type):**
To see how many users clicked PayBox vs Bit overall.
```sql
SELECT action_type, COUNT(*) as total_clicks
FROM gift4event_analytics
GROUP BY action_type
ORDER BY total_clicks DESC;
```

**2. Sorting by Event ID (Chronological User Journey):**
To trace the exact steps a specific user took on the payment page.
```sql
SELECT timestamp, action_type
FROM gift4event_analytics
WHERE event_id = 'ron-and-maya-lvyz6b'
ORDER BY timestamp ASC;
```

**3. Advanced Funnel Analysis (Event Grouping):**
To see which events successfully led to a payment app redirect.
```sql
SELECT event_id, 
       SUM(CASE WHEN action_type = 'bit_click' THEN 1 ELSE 0 END) as bit_redirects,
       SUM(CASE WHEN action_type = 'bank_copy' THEN 1 ELSE 0 END) as bank_copies
FROM gift4event_analytics
GROUP BY event_id;
```

---

## 5. Client-Side Integration & DOM Binding

### Frontend Telemetry Script
The frontend presentation layer will emit telemetry using non-blocking `fetch()` calls. To ensure it captures the exact actions, event listeners must be bound specifically to the modal interaction buttons.

```javascript
const ANALYTICS_URL = 'https://<lambda-id>.lambda-url.<region>.on.aws/';
const currentEventId = "ron-and-maya-lvyz6b"; // Dynamically extracted from URL

// Reusable asynchronous telemetry function
function trackEvent(actionType) {
    // Fire and forget - no await, no blocking the user
    // `keepalive: true` ensures the request fires even if the user is redirected to the Bit/PayBox app!
    fetch(ANALYTICS_URL, {
        method: 'POST',
        mode: 'cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            event_id: currentEventId, 
            action_type: actionType
        }),
        keepalive: true 
    }).catch(e => console.error("Telemetry failed silently", e));
}

// Example DOM Bindings for Specific Actions
document.getElementById('copy-bank-btn').addEventListener('click', () => {
    trackEvent('bank_copy');
});

document.getElementById('bit-modal-redirect-btn').addEventListener('click', () => {
    trackEvent('bit_click');
});

document.getElementById('paybox-modal-bank-redirect-btn').addEventListener('click', () => {
    trackEvent('paybox_bank_click');
});
```

### Terraform Codification
To maintain infrastructure-as-code parity, the pipeline explicitly provisions:
1.  `aws_s3_bucket` (Analytics Data Lake)
2.  `aws_glue_catalog_database` and `aws_glue_catalog_table` (Schema Definition)
3.  `aws_athena_workgroup` (Query Execution Environment)
4.  `aws_iam_role` & `aws_iam_role_policy` (S3 write access for Lambda)
5.  `aws_lambda_function` (The Validation Engine)
6.  `aws_lambda_function_url` (Managing the ingress and CORS configuration)
