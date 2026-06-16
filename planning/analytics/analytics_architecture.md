# Analytics High-Level Design

## 1. Architectural Patterns & Goals
* **Event-Driven Architecture:** The system must capture actions asynchronously from the client side without blocking the user experience. The telemetry mechanism operates independently of the main UI thread.
* **Privacy-by-Design:** The architecture must allow for 100% data ownership, avoiding 3rd-party cookies, tracking pixels, or external ad-network scripts. No personally identifiable information (PII) of the interacting user is collected.
* **Scalability:** Designed to handle burst traffic (e.g., hundreds of concurrent users interacting during a live event) through decoupled ingress and persistent storage.
* **Deferred Analytics (Read-Time Aggregation):** The system is designed strictly for raw event ingestion. Metric calculations (e.g., counting action types per event) will be performed post-ingestion during a separate data extraction phase (batch/on demand). Real-time querying and pre-aggregation are explicitly excluded from the ingestion pipeline to maintain architectural simplicity.

## 2. High-Level Data Pipeline (The Flow)
The data journey is abstracted into four distinct tiers:
1. **Inception (Client-Side Trigger):** Asynchronous telemetry client detects specific high-intent user interactions on the payment page using non-blocking event listeners.
2. **Ingestion Layer (API Entry Point):** A lightweight, secure endpoint that accepts incoming event payloads over HTTPS and handles CORS enforcement, acting as the front door for the pipeline.
3. **Processing Layer (Validation Engine):** A compute layer that validates payload integrity, extracts routing metadata, and appends trusted server-side context (such as exact ingestion time).
4. **Persistence Layer (Storage):** A highly scalable database optimized purely for rapid, high-volume write operations. It acts as an immutable event ledger. The flat storage structure ensures that raw data can be efficiently extracted periodically to execute external aggregations (e.g., `GROUP BY` operations) without burdening the ingestion path with real-time indexing.

## 3. Telemetry Trigger Strategy (Frontend Points)
The analytics system strictly captures telemetry at the following behavioral checkpoints:
* **Action A (Bank Details Copy):** Triggered precisely when the user interacts with the “Copy Account Number” button/icon.
* **Action B (Bit Redirect):** Triggered when the user clicks the explicit link to open the “Bit” application (nested inside the popup modal of Bit).
* **Action C (PayBox Redirect):** Triggered when the user clicks the explicit link to open the “PayBox” application (nested inside the popup modal of PayBox).
* **Action D (Bit Modal - Bank Redirect):** Triggered when the user clicks the explicit button to open the “חשבון בנק” (bank account) section (nested inside the popup modal of Bit).
* **Action E (PayBox Modal - Bank Redirect):** Triggered when the user clicks the explicit button to open the “חשבון בנק” (bank account) section (nested inside the popup modal of PayBox).
* **Action F (Waze Redirect):** Triggered when the user clicks the explicit button to open the Waze navigation link.

## 4. Platform-Agnostic Data Schema
The data structure must adhere to the following normalized schema representing the interaction event:

```json
{
  "event_id": "string",
  "timestamp": "string",
  "action_type": "string"
}
```

* **Design Intent:** This flat schema is purposefully designed to allow external processes to pull the raw logs and easily execute metric aggregations (e.g., counting `action_type` frequencies grouped by `event_id`) on-demand.
* **Primary Identifier (`event_id`):** A unique string derived from the URL path (e.g., the unique string after the trailing slash `/`). This acts both as a strict data isolation boundary and as the primary grouping key for future analytics.
* **Sorting Metric (`timestamp`):** High-precision server-side generation (ISO-8601 string or Epoch) to ensure accurate chronological audit trails, preventing client-side clock skew.
* **Dimension A (`action_type`):** Categorized strictly into defined values: `bank_copy`, `bit_click`, `paybox_click`, `bit_bank_click`, `paybox_bank_click`, or `waze_click`.

## 5. Architectural Review Guidelines
This architecture ensures decoupled logic between the presentation layer and the analytical backend through the following principles:
* **Separation of Concerns:** The presentation layer handles UI rendering and simply emits “fire-and-forget” events. It holds no logic regarding data validation, persistence, or state tracking.
* **Stateless Ingestion:** The API Entry Point focuses purely on receiving events and delegating them to the processing queue, ensuring the client connection is closed as quickly as possible.
* **Server-Side Trust:** The Processing Layer acts as the single source of truth for critical metadata (like the timestamp), preventing client-side tampering or manipulation of analytical metrics.

## 6. Data Querying and Extraction

Once the analytics data is collected, the system requires a reliable mechanism to query, sort, and extract this data for reporting and insights without the overhead of maintaining dedicated, always-on database servers.

### Conceptual Architecture

To maintain a lightweight and cost-effective system, the data querying and extraction process is broken down into the following high-level layers:

1. **Scalable Storage Layer (Data Lake):**
   * All collected analytics events are deposited into a secure, highly scalable cloud storage system in raw formats (such as JSON or CSV). This layer acts as the single, cost-effective source of truth for all historical data.

2. **Data Cataloging and Schema Mapping:**
   * A metadata layer is applied on top of the raw storage. This layer defines the structure and schema of the raw files, allowing the system to conceptually treat loose log files as organized, searchable tables.

3. **Serverless Query Engine:**
   * Instead of a traditional database, an on-demand, serverless query engine is utilized to execute standard SQL-like queries directly against the raw data.
   * **Core Query Capabilities:** The most critical function of this engine is supporting deep analytical queries on the raw schema, specifically:
     * **Sort by Action (`action_type`):** Filtering and ordering data to isolate and review specific behaviors (e.g., viewing all `bit_click` events).
     * **Sort by Event ID (`event_id`):** Grouping and ordering by the unique identifier to trace the complete chronological journey of a specific payment session.
     * **Aggregation:** Executing operations like `GROUP BY` and `COUNT` to calculate high-level metrics (e.g., the total count of each action type across all users).
   * **Cost Efficiency:** Because the compute engine is serverless, resources are only provisioned—and paid for—during the exact seconds a query is actively running.

4. **Data Extraction and Export:**
   * The results of any query can be instantly extracted and compiled into standard tabular formats. This extracted data can then be securely downloaded for offline analysis, or it can be automatically fed into external visualization and dashboarding tools.
