# Queries Implementation Plan

This plan outlines the steps to implement the automated Athena queries described in `analytics_queries.md` while adhering to the local execution instructions in `analytics_aws_access.md`.

## Prerequisites & AWS Access

> [!IMPORTANT]
> To execute this code locally as requested in `analytics_aws_access.md`, your local machine must have the AWS CLI configured with the access keys for the `github-deployer` user. Please ensure you have run `aws configure` and provided the `github-deployer` credentials (with region `il-central-1` and format `json`).

## Proposed Implementation

We will create a standalone Node.js script in a dedicated directory to run the queries.

### 1. Folder Setup and Initialization
- Create a new folder named `analytics_automation` at the root of the project (or inside `analytics` folder depending on preference, for now assuming project root).
- Run `npm init -y` inside this folder to generate the `package.json`.
- Install the required AWS SDK dependency by running `npm install @aws-sdk/client-athena`.

### 2. Node.js Script (`query.js`)
- Create the `query.js` file inside the `analytics_automation` folder.
- Populate this file with the exact Node.js implementation template provided in `analytics_queries.md`.
- Ensure this script supports the three requested commands:
  - `node query.js real_events_on_month <month>`
  - `node query.js clicks_in_event <event_id>`
  - `node query.js all_event_on_month <month>`

## Verification Plan

### Manual Verification
1. Open the terminal and navigate to the `analytics_automation` directory.
2. Run `node query.js real_events_on_month 06` to verify it fetches events with >15 clicks.
3. Check that the script executes without throwing AWS credential errors, which confirms that it is properly leveraging your local `aws configure` setup as mandated by `analytics_aws_access.md`.
