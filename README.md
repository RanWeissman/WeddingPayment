# 💍 Gift4Event (Wedding Payment System)

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg)](#) *(Placeholder for Live Demo)*

A Serverless Static web application designed for couples to seamlessly and elegantly receive wedding gifts from their guests. It eliminates the high commission fees of third-party platforms by utilizing smart routing to distribute payments across Bank Transfers, Bit, and PayBox, ensuring 100% of the funds go directly to the couple without hitting transaction limits.

---

## 🌟 User Experience (UX)

The user flow is split into two main experiences:

1. **The Couple (Management Page - `index.html`)**:
   - The couple accesses the main generation page and enters their event details (names, Waze navigation link).
   - They input their preferred Bank Account details.
   - *(Optional)* They upload QR codes for **Bit** and/or links for **PayBox**. If two codes/links are provided, the system creates a "Smart Load-balancing" link.
   - The platform instantly generates a secure, personalized URL containing all this data (encoded as query parameters), which the couple can share via WhatsApp or embed as a QR code on the physical invitation.

2. **The Guest (Payment Page - `payment.html`)**:
   - The guest clicks the shared link and lands on a beautiful, personalized, and mobile-friendly payment portal.
   - They are presented with the preferred option to transfer directly to the bank account (which has no receiving limits).
   - Alternatively, they can select Bit or PayBox. If the couple provided two accounts for Bit/PayBox, the system randomly assigns one of the links to the guest (a 50/50 split) to prevent hitting the app's annual receiving limits.

---

## 🛠️ Tech Stack & Integration

| Component | Technology | Description |
| :--- | :--- | :--- |
| 🎨 **Frontend** | **Vanilla HTML/JS**, **Tailwind CSS** | Fast, lightweight, and styling is handled entirely via Tailwind CDN. |
| 🧠 **Logic** | **Vanilla JavaScript** | URL parameter parsing, QR code generation (`qrcodejs`), QR scanning (`jsQR`), and 50/50 smart routing. |
| ☁️ **Infrastructure**| **AWS S3 & CloudFront** | Serverless Static Architecture ensuring global low-latency delivery and zero-cost scaling. |
| ⚙️ **CI/CD & IaC** | **GitHub Actions**, **Terraform**| Automated deployments triggered on `main` branch pushes. Terraform manages the AWS state. |
| 🗄️ **Database/Auth** | **None (Client-Side Only)**| No backend database. Data is stateless and securely passed via URL Query Parameters. |

---

## ✨ Key Features

- **📱 Responsive & RTL Design**: Fully optimized for mobile devices and beautifully aligned for Hebrew (RTL) reading.
- **⚖️ Smart Link Load-Balancing**: Distributes guest traffic evenly (50/50) between two Bit or PayBox accounts to circumvent the apps' receiving ceilings.
- **📸 QR Code Integration**: Built-in QR scanner to extract Bit links from uploaded screenshots and a generator to create physical invitation QR codes.
- **🗺️ Waze Navigation**: One-click navigation button embedded seamlessly into the guest payment page.
- **💸 Zero Fees (0%)**: Encourages direct bank transfers over third-party applications, bypassing intermediary commission fees.
- **🔒 Privacy First**: Since the application is entirely client-side, no sensitive bank information is stored on any server.

---

## 🔐 Environment Configuration

Given the **Serverless Static Architecture** and stateless nature of the application, there are **no application-level `.env` variables required** for local development.

However, for deploying the infrastructure via **Terraform** and GitHub Actions, the AWS environment relies on OpenID Connect (OIDC) or standard AWS credentials. 

---

## 🚀 Installation & Local Development

Because this is a vanilla HTML/JS project without a build step or backend, local development is incredibly simple:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/RanWeissman/WeddingPayment.git
   cd WeddingPayment
   ```

2. **Run a local development server**:
   You do not need `npm install` or `npm run dev` since there are no Node.js dependencies. You can simply use a lightweight local server like `npx serve`, Python's `http.server`, or the Live Server extension in VSCode.
   
   Using Node.js (`npx`):
   ```bash
   npx serve .
   ```
   Or using Python:
   ```bash
   python -m http.server 8000
   ```

3. **Open your browser**:
   Navigate to `http://localhost:3000` (or the port specified by your local server) to view `index.html`.

---

## 📁 Project Structure

```text
/
├── index.html               # The Link Generator (Couple's Management Dashboard)
├── payment.html             # The Payment Interface (Guest View)
├── cloud_architecture.md    # Documentation detailing the AWS setup
├── .github/
│   └── workflows/           # CI/CD pipelines (GitHub Actions)
└── terraform/               # Infrastructure as Code (AWS setup)
    ├── main.tf              # Main AWS resources (S3, CloudFront)
    ├── providers.tf         # Terraform provider configs
    ├── variables.tf         # Configurable infrastructure variables
    └── outputs.tf           # Terraform outputs
```

---

## ☁️ Deployment

This project is configured for automated deployment to **AWS** via GitHub Actions and Terraform.

**To deploy to your own AWS Account:**

1. Update the `terraform/variables.tf` with your specific AWS region, bucket name, and GitHub repository (for OIDC).
2. Configure GitHub Actions by setting up the necessary OIDC Role in AWS.
3. Push changes to the `main` branch. GitHub Actions will automatically:
   - Run `terraform apply` to provision/update S3 and CloudFront.
   - Run `aws s3 sync` to upload `index.html` and `payment.html`.
   - Run `aws cloudfront create-invalidation` to clear the CDN cache.

*Alternatively, because these are static files, you can deploy this project instantly on platforms like **Vercel**, **Netlify**, or **GitHub Pages** by simply dragging and dropping the folder or linking the repository.*
