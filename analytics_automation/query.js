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
            if (!rows || rows.length === 0) return [];
            if (!rows[0].Data) return rows;

            const headers = rows[0].Data.map(col => col.VarCharValue);
            
            const formattedData = rows.slice(1).map(row => {
                const rowObj = {};
                if (row.Data) {
                    row.Data.forEach((col, index) => {
                        rowObj[headers[index]] = col.VarCharValue;
                    });
                }
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

} else if (queryType === 'update_table') {
    sql = `MSCK REPAIR TABLE gift4event_analytics_db.gift4event_analytics;`;
    console.log(`Running Repair: Updating Athena partitions to load new S3 data...`);

} else {
    console.log("Usage:");
    console.log("  node query.js update_table                      (Updates partitions from S3)");
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
