# AWS Access Configuration Guide

To run the automated Athena queries locally on your machine, your computer needs to securely authenticate with your AWS account. This is done by creating an **Access Key** for your `github-deployer` user.

Follow this step-by-step guide to generate and configure your secret keys.

---

## Step 1: Generate the Keys in AWS

1. Log into your **AWS Management Console**.
2. Search for **IAM** in the top search bar and open it.
3. On the left menu, click on **Users**.
4. Click on your existing user named **`github-deployer`**.
5. Click on the **Security credentials** tab.
6. Scroll down to the **Access keys** section and click the **Create access key** button.
7. Select **Command Line Interface (CLI)** as the use case, check the confirmation box, and click **Next**.
8. (Optional) Add a description tag like "Local Laptop Access" and click **Create access key**.

> [!WARNING]
> You will now see your **Access key ID** and **Secret access key**. 
> **Do not close this page yet!** The Secret Access Key is only shown to you *once*. If you close the page, you will not be able to see it again and will have to generate a new one.

---

## Step 2: Configure Your Local Computer

Now that you have the keys on your screen, you need to save them securely on your local computer using the AWS CLI.

1. Open your terminal (PowerShell or Command Prompt).
2. Type the following command and press Enter:
   ```bash
   aws configure
   ```
3. The terminal will ask you for 4 pieces of information. Copy and paste them directly from the AWS webpage you left open:
   - **AWS Access Key ID:** `(paste your Access Key ID here)`
   - **AWS Secret Access Key:** `(paste your Secret Access Key here)`
   - **Default region name:** Type `il-central-1`
   - **Default output format:** Type `json`

---

## Step 3: Verify Your Access

Once you complete the setup, your computer will save these credentials securely in a hidden file. 

To verify that your computer is successfully connected to AWS, run this simple command in your terminal:
```bash
aws sts get-caller-identity
```

If it prints out a JSON block showing your `Arn` ending in `/github-deployer`, you are fully authenticated! You can now run your Node.js analytics queries locally using:
```bash
node query.js real_events_on_month 06
```

---

## Running the Node.js Script Locally

To run the script and see the results, follow these steps:

* **Create a folder:** Open your terminal and create a working directory.
* **Install the SDK:** Run `npm init -y` and `npm install @aws-sdk/client-athena`.
* **Save the code:** Create a `query.js` file and paste the code from the main guide.
* **Verify AWS permissions:** Never paste your Secret Key directly into the code. Use the `aws configure` command to securely set the keys in an encrypted configuration file on your computer.
* **Execution:** To get the results in JSON format directly in your terminal, use one of the following three commands (depending on the data you are looking for):
  * **Query 1 (Events with more than 15 clicks in a specific month):** 
    `node query.js real_events_on_month <month>` (Example: `node query.js real_events_on_month 06` for June).
  * **Query 2 (Click distribution on buttons for a specific event):** 
    `node query.js clicks_in_event <event_id>` (Example: `node query.js clicks_in_event "my-event-id"`).
  * **Query 3 (All unique events that occurred in a specific month):** 
    `node query.js all_event_on_month <month>` (Example: `node query.js all_event_on_month 06`).
