# Project Architecture

## System Overview

**Gift4Event** is a serverless web application designed to facilitate the secure, fee-free transfer of monetary gifts for events (like weddings). The core architectural pattern is a **Static Serverless Architecture**. 

Instead of relying on a traditional always-on web server, the application serves static frontend assets directly from edge locations via a Content Delivery Network (CDN). Dynamic functionality—such as creating event configurations, retrieving payment details, and dynamic routing—is handled entirely by managed, on-demand serverless functions and a serverless NoSQL database. This architecture ensures high availability, infinite scalability to handle traffic spikes during events, and near-zero operational costs when the platform is idle.

---

## Component-by-Component Breakdown

### Cloud Infrastructure & Managed Services (AWS)

#### S3 (Simple Storage Service)
**What it is:** A highly scalable object storage service.
**Its Purpose in THIS Project:** S3 acts as the foundational origin for our frontend application. It hosts the compiled static assets (`index.html`, `payment.html`, CSS, JS, images). It is also utilized securely behind the scenes to store the remote Terraform state file, ensuring infrastructure changes are tracked and synchronized across deployments.

#### CloudFront
**What it is:** A global Content Delivery Network (CDN) service that caches data at edge locations worldwide.
**Its Purpose in THIS Project:** CloudFront serves as the single global entry point for the application. It routes traffic, enforces HTTPS with an SSL/TLS certificate, and aggressively caches the static assets to minimize latency. Crucially, it manages routing between the static S3 bucket and the dynamic API Gateway, ensuring seamless SPA-like behavior by mapping 403/404 errors back to `index.html`.

#### CloudFront Functions
**What it is:** A lightweight, serverless edge compute capability built directly into CloudFront for fast request manipulation.
**Its Purpose in THIS Project:** It acts as an Edge Router (`cloudfront_router.js`). When a user visits a dynamic slug (e.g., `/paz-and-lior`), the function transparently rewrites the request at the edge to serve the `payment.html` shell, avoiding the need for a full backend server to handle URL rewrites.

#### API Gateway
**What it is:** A fully managed service that makes it easy to create, publish, and secure APIs at any scale.
**Its Purpose in THIS Project:** It provides the HTTP endpoints (`/api/create` and `/api/config`) that the frontend JavaScript interacts with. It acts as the secure front door to our backend logic, proxying incoming POST and GET requests directly to the Lambda function while handling CORS (OPTIONS) preflight requests.

#### Lambda
**What it is:** A serverless compute service that runs code in response to events without provisioning servers.
**Its Purpose in THIS Project:** Lambda executes the core backend business logic written in Node.js. It handles the creation of new event configurations (generating secure, collision-resistant unique slugs) and the retrieval of event details. Running on-demand, it eliminates the need for an idle server and scales automatically with the number of concurrent users creating or viewing gift pages.

#### DynamoDB
**What it is:** A fully managed, serverless, key-value NoSQL database.
**Its Purpose in THIS Project:** DynamoDB was chosen as our persistent data store because it offers single-digit millisecond latency and scales automatically. It stores the event configurations (slugs, couple names, bank details, app links) using a Pay-Per-Request billing model, meaning we only pay for the exact reads and writes performed. It is also used to maintain a state lock for Terraform to prevent concurrent infrastructure modifications.

#### IAM (Identity and Access Management)
**What it is:** A web service that helps securely control access to AWS resources.
**Its Purpose in THIS Project:** IAM strictly defines the permissions of our system components. Most notably, it utilizes an OIDC (OpenID Connect) provider to allow GitHub Actions to securely assume a deployment role without requiring long-lived, hardcoded AWS credentials. It also restricts the Lambda function to only access the specific DynamoDB table and write logs.

#### ACM (AWS Certificate Manager)
**What it is:** A service that lets you easily provision, manage, and deploy public and private Secure Sockets Layer/Transport Layer Security (SSL/TLS) certificates.
**Its Purpose in THIS Project:** It provides and automatically renews the SSL certificate for the custom domain (`gift4event.com`), ensuring all user traffic, sensitive bank details, and API communications are encrypted in transit.

---

### Frontend

#### Vanilla HTML/CSS/JavaScript
**What it is:** The foundational languages of the web.
**Its Purpose in THIS Project:** Chosen over a heavy frontend framework (like React or Angular) to keep the application footprint minimal, ultra-fast, and simple to maintain. The application relies on native browser APIs to fetch data, manipulate the DOM, and handle user interactions.

#### Tailwind CSS
**What it is:** A utility-first CSS framework.
**Its Purpose in THIS Project:** Loaded via CDN, Tailwind enables rapid, responsive UI development without writing custom CSS files. It is used to create a modern, "glassmorphism" aesthetic with complex gradients and responsive layouts directly within the HTML markup.

#### qrcodejs & jsQR
**What it is:** Client-side JavaScript libraries for generating and parsing QR codes.
**Its Purpose in THIS Project:** `qrcodejs` is used to dynamically generate a unique QR code for the event directly in the browser so hosts can print it for physical invitations. `jsQR` allows the application to read and validate QR codes uploaded by the hosts (e.g., their personal Bit application QR codes) entirely on the client side, ensuring sensitive image data never needs to be uploaded to our servers.

#### jsPDF & html2canvas
**What it is:** Client-side libraries for capturing DOM elements and generating PDF files.
**Its Purpose in THIS Project:** These libraries power the "Printable Sign" feature. They take the dynamically generated QR code and couple names, composite them into a beautifully designed template hidden in the DOM, and instantly download a high-quality PDF ready for the hosts to print and place on the reception tables.

---

### Infrastructure as Code (IaC) & DevOps

#### Terraform
**What it is:** An infrastructure as code tool that allows you to build, change, and version infrastructure safely and efficiently.
**Its Purpose in THIS Project:** Terraform defines every single AWS resource (S3, CloudFront, Lambda, API Gateway, DynamoDB, IAM) in declarative code (`main.tf`, `api.tf`, etc.). This ensures the infrastructure is reproducible, version-controlled alongside the application code, and eliminates manual "click-ops" errors in the AWS console.

#### GitHub Actions
**What it is:** A continuous integration and continuous delivery (CI/CD) platform integrated directly into GitHub.
**Its Purpose in THIS Project:** It acts as the automated deployment engine (`deploy.yml`). Whenever code is pushed to the `main` branch, it automatically assumes an AWS role, provisions any infrastructure changes via Terraform, syncs the latest static HTML/JS files to S3, and invalidates the CloudFront cache, ensuring the live site is updated seamlessly within minutes.

---

## Data & Request Flow

### 1. Generating a New Event Link (The Host Flow)
1. **User Input:** The event host visits the root URL (`/`) and fills out the form on `index.html` with their names, bank details, and optional app links.
2. **API Request:** The frontend JavaScript intercepts the form submission and makes an asynchronous `POST` request to `https://gift4event.com/api/create`.
3. **Routing:** CloudFront receives the request. Recognizing the `/api/*` path pattern, it forwards the request to the API Gateway origin.
4. **Processing:** API Gateway triggers the Node.js Lambda function.
5. **Data Storage:** The Lambda function generates a unique, collision-resistant slug (e.g., `paz-and-lior-A1B2`), validates the payload, and attempts to save the record to the DynamoDB `Gift4Event-Configurations` table.
6. **Response:** Upon successful storage, Lambda returns the generated slug and URL to the frontend, which displays the new link and generates the downloadable QR codes.

### 2. Viewing an Event Page (The Guest Flow)
1. **User Request:** An event guest clicks a shared link (e.g., `https://gift4event.com/paz-and-lior-A1B2`).
2. **Edge Routing:** The request hits the CloudFront CDN edge location nearest to the user.
3. **URL Rewrite:** The CloudFront Function (Edge Router) inspects the URI. Recognizing it is not a static file or an API call, it transparently rewrites the request internally to `/payment.html`.
4. **Serving Shell:** CloudFront serves the cached `payment.html` static shell to the user's browser.
5. **Hydration (API Call):** The JavaScript inside `payment.html` extracts the slug (`paz-and-lior-A1B2`) from the browser's address bar and makes an asynchronous `GET` request to `/api/config/paz-and-lior-A1B2`.
6. **Data Retrieval:** CloudFront forwards this to API Gateway, which triggers the Lambda function. The Lambda function queries DynamoDB for the specific slug.
7. **Rendering:** The Lambda returns the JSON configuration (couple names, bank details). The frontend JavaScript receives this data and dynamically injects it into the DOM, revealing the personalized gift page to the guest. (Note: CloudFront is instructed to aggressively cache this GET response, meaning subsequent guests hitting the same link will receive the JSON data directly from the edge cache, bypassing the Lambda and DB entirely).
