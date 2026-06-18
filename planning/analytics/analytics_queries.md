# Analytics Query Automation Guide

This document outlines the implementation plan and specific queries for automating data extraction from the Serverless Data Lake (Athena) using code.

## Automation Architecture

To automate queries without manually logging into the AWS Console, the standard architectural pattern is to use the **AWS SDK for JavaScript** (`@aws-sdk/client-athena`) within a Node.js backend environment (like an AWS Lambda function or a local reporting script).

Because Athena queries scan massive amounts of data in S3, they are asynchronous. The automation flow works as follows:
1. **Trigger Query:** The code sends a SQL string to Athena.
2. **Poll Status:** The code polls the `QueryExecutionId` until the status changes to `SUCCEEDED`.
3. **Fetch Results:** The code retrieves the JSON rows and processes them for your dashboard.

---

## Required Automated Queries

### 1. Events in Month X with > 15 "Bit" Clicks
**Goal:** Identify high-engagement events for a specific month where users heavily relied on the Bit application link.

#### How to run it:
**1. Manually (via AWS Console):** Paste the following SQL into the Athena Query Editor and click "Run".
**2. Automated (via Code):** Pass this SQL string into the `executeAthenaQuery()` function defined in the Node.js Implementation section below.
**3. Short CLI Command:** Because your Athena Workgroup is configured to enforce settings, you only need to provide the workgroup name and the query string:
```bash
aws athena start-query-execution --work-group "gift4event_analytics_wg" --query-string "SELECT event_id FROM gift4event_analytics_db.gift4event_analytics WHERE year='2026' AND month='06' AND action_type='bit_click' GROUP BY event_id HAVING COUNT(*)>15;"
```
*(Copy the `QueryExecutionId` it returns, and run `aws athena get-query-results --query-execution-id <ID>` to see the data).*

**SQL Query:**
```sql
SELECT event_id
FROM gift4event_analytics_db.gift4event_analytics
WHERE year = '2026' 
  AND month = '06' -- Replace with dynamic variable in code
  AND action_type = 'bit_click'
GROUP BY event_id
HAVING COUNT(*) > 15;
```

### 2. Breakdown of Button Clicks for Event X
**Goal:** For a specific event, show the distribution of clicks across the 6 tracked buttons (`bank_copy`, `bit_click`, `paybox_click`, `bit_bank_click`, `paybox_bank_click`, `waze_click`).

#### How to run it:
**1. Manually (via AWS Console):** Replace `'my-specific-event-id'` with a real event slug, paste it into the Athena Query Editor, and click "Run".
**2. Automated (via Code):** Wrap this SQL inside a dynamic string (like the example shown at the bottom of this file) and pass it to `executeAthenaQuery()`.
**3. Short CLI Command:** 
```bash
aws athena start-query-execution --work-group "gift4event_analytics_wg" --query-string "SELECT action_type, COUNT(*) as total_clicks FROM gift4event_analytics_db.gift4event_analytics WHERE event_id='my-specific-event-id' GROUP BY action_type ORDER BY total_clicks DESC;"
```
*(Copy the `QueryExecutionId` it returns, and run `aws athena get-query-results --query-execution-id <ID>` to see the data).*

**SQL Query:**
```sql
SELECT action_type, COUNT(*) as total_clicks
FROM gift4event_analytics_db.gift4event_analytics
WHERE event_id = 'my-specific-event-id' -- Replace with dynamic variable in code
GROUP BY action_type
ORDER BY total_clicks DESC;
```

---

### 3. All Unique Events in Month X
**Goal:** Show all the unique events that occurred in a specific month.

#### How to run it:
**1. Manually (via AWS Console):** Paste the following SQL into the Athena Query Editor and click "Run".
**2. Automated (via Code):** Pass this SQL string into the `executeAthenaQuery()` function defined in the Node.js Implementation section below.
**3. Short CLI Command:** 
```bash
aws athena start-query-execution --work-group "gift4event_analytics_wg" --query-string "SELECT DISTINCT event_id FROM gift4event_analytics_db.gift4event_analytics WHERE year='2026' AND month='06';"
```
*(Copy the `QueryExecutionId` it returns, and run `aws athena get-query-results --query-execution-id <ID>` to see the data).*

**SQL Query:**
```sql
SELECT DISTINCT event_id
FROM gift4event_analytics_db.gift4event_analytics
WHERE year = '2026' 
  AND month = '06'; -- Replace with dynamic variable in code
```

---

## Node.js Implementation Example

Here is the exact code snippet template you can use in a Node.js environment to run the queries automatically.

```javascript
const { 
    AthenaClient, 
    StartQueryExecutionCommand, 
    GetQueryExecutionCommand, 
    GetQueryResultsCommand 
} = require("@aws-sdk/client-athena");

// Initialize the Athena Client
const athena = new AthenaClient({ region: "il-central-1" });

async function executeAthenaQuery(sqlQuery) {
    try {
        // 1. Start the query execution
        const startCmd = new StartQueryExecutionCommand({
            QueryString: sqlQuery,
            QueryExecutionContext: { Database: "gift4event_analytics_db" },
            ResultConfiguration: { OutputLocation: "s3://click-analytics-logs-800762100823/athena-results/" },
            WorkGroup: "gift4event_analytics_wg"
        });

        const { QueryExecutionId } = await athena.send(startCmd);

        // 2. Poll for completion
        let state = "RUNNING";
        while (state === "RUNNING" || state === "QUEUED") {
            await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
            
            const statusCmd = new GetQueryExecutionCommand({ QueryExecutionId });
            const statusResponse = await athena.send(statusCmd);
            state = statusResponse.QueryExecution.Status.State;
        }

        // 3. Fetch and format results
        if (state === "SUCCEEDED") {
            const resultsCmd = new GetQueryResultsCommand({ QueryExecutionId });
            const response = await athena.send(resultsCmd);
            
            // Map the ugly Athena row format into a clean JSON array
            const rows = response.ResultSet.Rows;
            const headers = rows[0].Data.map(col => col.VarCharValue);
            
            const formattedData = rows.slice(1).map(row => {
                const rowObj = {};
                row.Data.forEach((col, index) => {
                    rowObj[headers[index]] = col.VarCharValue;
                });
                return rowObj;
            });

            return formattedData;
        } else {
            throw new Error(`Query failed with state: ${state}`);
        }
    } catch (error) {
        console.error("Athena Automation Error:", error);
    }
}

// Parse command line arguments for short CLI execution
const queryType = process.argv[2]; // e.g., 'real_events_on_month' or 'clicks_in_event'
const arg = process.argv[3]; // e.g., month or event_id

let sql = '';

if (queryType === 'real_events_on_month') {
    const year = new Date().getFullYear().toString();
    const month = arg ? arg.padStart(2, '0') : (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    sql = `
        SELECT event_id
        FROM gift4event_analytics_db.gift4event_analytics
        WHERE year = '${year}' AND month = '${month}' AND action_type = 'bit_click'
        GROUP BY event_id
        HAVING COUNT(*) > 15;
    `;
    console.log(`Running Query 1: Fetching IDs with >15 Bit clicks for month ${month} in ${year}...`);

} else if (queryType === 'clicks_in_event') {
    const eventId = arg || "rani-and-shir-wedding";
    sql = `
        SELECT action_type, COUNT(*) as total_clicks
        FROM gift4event_analytics_db.gift4event_analytics
        WHERE event_id = '${eventId}'
        GROUP BY action_type
        ORDER BY total_clicks DESC;
    `;
    console.log(`Running Query 2: Fetching click distribution for event '${eventId}'...`);

} else if (queryType === 'all_event_on_month') {
    const year = new Date().getFullYear().toString();
    const month = arg ? arg.padStart(2, '0') : (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    sql = `
        SELECT DISTINCT event_id
        FROM gift4event_analytics_db.gift4event_analytics
        WHERE year = '${year}' AND month = '${month}';
    `;
    console.log(`Running Query 3: Fetching all unique events for month ${month} in ${year}...`);

} else {
    console.log("Usage:");
    console.log("  node query.js real_events_on_month <month>      (Runs Query 1)");
    console.log("  node query.js clicks_in_event <event_id>        (Runs Query 2)");
    console.log("  node query.js all_event_on_month <month>        (Runs Query 3)");
    process.exit(1);
}

// Execute the requested query behind the scenes
executeAthenaQuery(sql).then(data => {
    console.log("\n--- Query Results ---");
    console.log(JSON.stringify(data, null, 2));
});
```

> **Maintenance Note:** To fully automate your pipeline, ensure you have an EventBridge cron job running `MSCK REPAIR TABLE gift4event_analytics;` daily to automatically load new date partitions into Athena.

---

## Running the Node.js Script Locally

Execute the script using Node.js to run your queries behind the scenes with a single short command!

To run **Query 1** (Events with >15 Bit clicks for a specific month):
```bash
node query.js real_events_on_month 06
```

To run **Query 2** (Click breakdown for a specific event):
```bash
node query.js clicks_in_event "my-specific-event-id"
```

To run **Query 3** (All unique events in a specific month):
```bash
node query.js all_event_on_month 06
```

The terminal will pause for a couple of seconds while it waits for Athena to process the data in S3. It will then automatically format the response and print a beautiful JSON array directly to your terminal.
