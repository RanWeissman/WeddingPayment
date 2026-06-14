# Cloud Architecture - Wedding Payment System (Gift4Event)

## Overview
The Wedding Payment System (Gift4Event) utilizes a "Serverless Static" architecture. This approach hosts the frontend (HTML, CSS, JavaScript) directly on managed infrastructure without requiring dedicated backend computing servers. 

A key architectural decision was to use **Query Parameters** for passing dynamic data (such as the couple's names, bank details, and messages) to the `payment.html` page, rather than utilizing a backend database. This choice drastically simplifies the system, significantly lowers operational costs, and minimizes the attack surface, all while effectively fulfilling the project's requirements for a lightweight, secure, and fast-loading web application.

## Architecture Diagram

```mermaid
graph TD
    User([End User]) -->|HTTPS| CF[CloudFront Distribution]
    CF -->|Origin Access Control| S3[(AWS S3 Bucket)]
    
    Dev([Developer]) -->|Push to main| Git[GitHub Repository]
    Git -->|OIDC Authentication| IAM[AWS IAM (OIDC Provider)]
    IAM -->|Assumes Role| Actions[GitHub Actions Pipeline]
    
    Actions -->|terraform apply| TF[Infrastructure/State]
    Actions -->|aws s3 sync| S3
    Actions -->|aws cloudfront create-invalidation| CF
```

## Component Breakdown

### 1. Amazon S3 (Simple Storage Service)
S3 is used for static website hosting. It stores the core application files: `index.html` (the link generator) and `payment.html` (the guest payment interface).
* **Configuration:** The bucket is configured to be strictly **private**, with "Block Public Access" fully enabled. 
* **Purpose:** Acts as the origin for the content delivery network, ensuring no direct public access to the raw files is possible.

### 2. Amazon CloudFront
CloudFront serves as the Content Delivery Network (CDN), caching the static assets at edge locations globally.
* **Performance:** Provides global low latency and fast content delivery to users regardless of their geographical location. It is configured with `PriceClass_100` (utilizing the most cost-effective edge locations).
* **Security:** Enforces HTTPS connections (`redirect-to-https`), providing SSL/TLS encryption for all user traffic, utilizing modern TLS standards (`TLSv1.2_2021`).
* **Routing & Forwarding:** Explicitly configured to **forward all query strings** to the origin so that `payment.html` can read URL parameters dynamically. 
* **Error Handling:** Employs **Custom Error Responses** to securely redirect any 404 (Not Found) and 403 (Forbidden) errors back to `/index.html` with a 200 OK status, ensuring a seamless fallback for the user.

### 3. Terraform (Infrastructure as Code)
Terraform is used to define, provision, and manage all AWS resources deterministically.
* **Resources Managed:** S3 buckets, CloudFront distributions, Origin Access Control settings, ACM certificates, and necessary IAM (Identity and Access Management) OIDC roles and policies.
* **Advantage:** Ensures the infrastructure is reproducible, version-controlled, and easily reviewable.
* **Remote State:** Implements an **S3 backend** (`wedding-tf-state-ran-2026`) coupled with a **DynamoDB table** (`terraform-lock`) for reliable state locking. This configuration is crucial to maintain state consistency and prevent concurrent deployment conflicts within the CI/CD pipeline.

### 4. Amazon Route 53 & AWS Certificate Manager (ACM)
These services operate in tandem to establish a secure, custom domain (`gift4event.com` and `www.gift4event.com`).
* **Route 53:** Manages DNS routing, seamlessly pointing the custom domain aliases to the underlying CloudFront distribution.
* **ACM:** Provisions and firmly manages the public SSL/TLS certificate required to enable the custom domain for the HTTPS-enforced CDN.

### 5. GitHub Actions & OIDC
GitHub Actions powers the Continuous Integration and Continuous Deployment (CI/CD) pipeline, fully automating the deployment process for both infrastructure and application code.

## Security Model

The system employs a defense-in-depth approach for static content:
* **Origin Access Control (OAC):** This is implemented to ensure that the S3 bucket only accepts requests originating directly from the specified CloudFront distribution. It completely prevents direct access to the S3 bucket via public S3 URLs.
* **HTTPS Enforcement:** CloudFront is configured to redirect all HTTP requests to HTTPS, ensuring that data transmitted between the user's browser and the CDN is encrypted, protecting any sensitive payment details displayed.
* **Keyless Authentication (OIDC):** The CI/CD pipeline authenticates with AWS using **OpenID Connect (OIDC)** instead of long-lived static AWS access keys. This is a major security enhancement, as temporary credentials are automatically issued and revoked per GitHub Actions run.
* **Scoped IAM Role:** The IAM Role assumed by GitHub Actions for deployment strictly defines the allowed resources, granting access only to the specific Terraform state bucket, DynamoDB lock table, and broadly allowing modifications to S3, CloudFront, and IAM resources required for deployment.

## Deployment Pipeline (CI/CD)

The GitHub Actions workflow automates the deployment process. It is triggered automatically upon any push to the `main` branch.

1. **Trigger:** A developer pushes code changes (HTML updates or Terraform state changes) to the `main` branch.
2. **Authentication:** GitHub Actions seamlessly authenticates to AWS via OIDC.
3. **Infrastructure Provisioning:** The pipeline executes `terraform apply` to ensure the AWS infrastructure is up to date and matches the defined configuration.
4. **Application Sync:** It runs `aws s3 sync` to upload the latest versions of `index.html` and `payment.html` to the S3 bucket.
5. **Cache Invalidation:** Finally, it executes an AWS CLI command to invalidate the CloudFront cache. This guarantees that users receive the most current version of the application immediately after deployment, rather than serving stale cached content.

## Cost Analysis

This serverless static architecture is highly cost-efficient and is explicitly designed to operate comfortably within the **AWS Free Tier** for typical usage patterns. 
* **S3:** The tier allows for significant free storage and GET requests matching the use-case.
* **CloudFront:** Configured with `PriceClass_100` to utilize the cheapest edge locations. It provides 1 TB of outbound data transfer and 10 million HTTP/HTTPS requests per month at no cost.
* By avoiding databases (RDS/DynamoDB) and compute instances (EC2/Lambda), the monthly operational cost is virtually zero, making it an ideal solution for a localized service like wedding payments.
