# Analytics Automation Scripts

This folder contains a Node.js script (`query.js`) designed to automate data extraction from the AWS Athena database.

## Prerequisites
- Make sure you have the AWS CLI configured with `aws configure` on your local machine using the `github-deployer` user keys.
- Run `npm install` in this directory if you haven't already.

## Execution Options

To run the commands, ensure your terminal is inside the `analytics_automation` folder.

### 1. Update Table Partitions (Run this first!)
```bash
node query.js update_table
```
**What it does:** Scans the S3 bucket for newly added data and updates the Athena partitions. You must run this command before running data queries if new data was recently added to S3, otherwise Athena will not recognize the new data.

### 2. Query: High Engagement Events
```bash
node query.js real_events_on_month <month>
# Example: node query.js real_events_on_month 06
```
**What it does:** Fetches the IDs of all events in the specified month of the current year where users clicked the "Bit" application link more than 15 times.

### 3. Query: Button Click Breakdown
```bash
node query.js clicks_in_event <event_id>
# Example: node query.js clicks_in_event rani-and-shir-wedding
```
**What it does:** Displays the distribution of clicks across all tracked buttons (such as bank_copy, bit_click, waze_click, etc.) for a specific event.

### 4. Query: All Unique Events in a Month
```bash
node query.js all_event_on_month <month>
# Example: node query.js all_event_on_month 06
```
**What it does:** Retrieves a distinct list of all event IDs that had any activity during the specified month of the current year.
