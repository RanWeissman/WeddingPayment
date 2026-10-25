# Browser Security Headers & Subresource Integrity (SRI) Specification

## 1. Section Reference & Alignment
This specification aligns directly with **Sections 1 & 2** of [`1_security_high_level.md`](./1_security_high_level.md):
1. **CloudFront HTTP Security Headers (`Response Headers Policy`)**
2. **Subresource Integrity (`SRI`) for External Scripts**

Its objective is to harden client-side browser security and resolve the key findings from the Mozilla HTTP Observatory scan (`HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `SRI`) with zero cost (`$0.00`) and zero breaking changes to the Vanilla HTML/JS + Tailwind CDN frontend.

---

## 2. Part A: CloudFront HTTP Security Headers (`terraform/main.tf`)

### What We Do
Attach the official **AWS Managed `SecurityHeadersPolicy`** (`67f7725c-6f97-4210-82d7-5512b31e9d03`) to the `default_cache_behavior` of the CloudFront distribution (`aws_cloudfront_distribution.cdn`).

### Why We Do It
Currently, CloudFront serves `index.html` and `payment.html` without browser-level security instruction headers. Adding this policy instructs every visitor's browser to enforce four critical protections:
1. **`Strict-Transport-Security (HSTS)` (`max-age=31536000`):** Forces the browser to communicate with `gift4event.com` strictly over encrypted `HTTPS` for one full year, blocking SSL-stripping and Man-in-the-Middle attacks on public Wi-Fi networks (e.g., at wedding venues).
2. **`X-Frame-Options` (`SAMEORIGIN`):** Prevents external malicious websites from embedding Gift4Event inside a transparent `<iframe>` (`Clickjacking` attack) to trick users into clicking hidden buttons.
3. **`X-Content-Type-Options` (`nosniff`):** Prevents the browser from guessing ("MIME-sniffing") the content type of a response and executing non-script files as JavaScript.
4. **`Referrer-Policy` (`strict-origin-when-cross-origin`):** Prevents full URL paths and query parameters from leaking in the HTTP `Referer` header when guests click external payment links (Bit, PayBox, or Waze).

### How We Implement It (`terraform/main.tf`)
Inside `resource "aws_cloudfront_distribution" "cdn"`, add `response_headers_policy_id` under `default_cache_behavior`:
```hcl
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.website.id

    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.query_strings.id
    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03" # AWS Managed-SecurityHeadersPolicy

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.router.arn
    }
  }
```

### How We Test & Verify It
1. After deploying via Terraform, open Chrome DevTools (`F12` -> `Network` tab), refresh `https://www.gift4event.com`, and inspect the **Response Headers** of the main document to confirm `strict-transport-security`, `x-frame-options`, `x-content-type-options`, and `referrer-policy` are present.
2. Re-run the **Mozilla HTTP Observatory** scan and verify that `HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, and `Referrer-Policy` all show **Passed** (raising the score by +45 points).

---

## 3. Part B: Subresource Integrity (`SRI`) for External Scripts (`index.html`)

### What We Do
Add cryptographic hash attributes (`integrity="sha384-..."` and `crossorigin="anonymous"`) to all four pinned third-party JavaScript libraries loaded in `index.html`:
1. `qrcode.min.js` (`1.0.0`)
2. `jsQR.min.js` (`1.4.0`)
3. `jspdf.umd.min.js` (`2.5.1`)
4. `html2canvas.min.js` (`1.4.1`)

*(Note: `payment.html` does not load any of these 4 libraries, and `https://cdn.tailwindcss.com` is intentionally excluded because it is a dynamically generated JIT script).*

### Why We Do It (Supply-Chain Attack Protection)
Because these 4 libraries are hosted on external public CDNs (`cdnjs.cloudflare.com` and `cdn.jsdelivr.net`), if an attacker were to compromise the CDN and inject malicious code into one of those files (for example, swapping the couple's bank account number during form submission), visitors' browsers would normally download and execute the tampered script blindly. SRI guarantees that any modification to the external file is immediately detected and blocked by the browser.

### How It Works Under the Hood
1. **One-Way Cryptographic Fingerprint (`SHA-384`):**
   We run the `SHA-384` cryptographic hash algorithm once over the official, clean version of each library file. This produces a fixed, unique 64-character base64 fingerprint (`sha384-...`). Even a single changed character, space, or comma in the file produces a completely different hash.
2. **Browser Verification Flow on Every Page Load:**
   * **Step 1 (Download to Memory):** When a user opens `index.html`, the browser downloads the `.js` file from the external CDN into memory **without executing it yet**.
   * **Step 2 (Independent Hash Calculation):** The browser runs the `SHA-384` mathematical function locally on the downloaded bytes.
   * **Step 3 (Comparison):** The browser compares its calculated hash against the `integrity="sha384-..."` string embedded in our `index.html` (which was served securely from our own AWS S3/CloudFront origin).
   * **Step 4 (Allow or Block):**
     * If the hashes **match 100%**, the browser proves the file is authentic and executes it normally.
     * If there is **any mismatch**, the browser **blocks execution immediately** and logs a security error in the Console.

### How We Implement It (`index.html`)
Replace lines 10–13 in `index.html` with the verified `SHA-384` integrity attributes:
```html
    <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"
        integrity="sha384-3zSEDfvllQohrq0PHL1fOXJuC/jSOO34H46t6UQfobFOmxE5BpjjaIJY5F2/bMnU"
        crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js"
        integrity="sha384-hStSInNIZ8ljtOVrmrgf7zdHMapaLBWoSnPTtF0nzsybp4+LuhDz6sHuEVpWIX8o"
        crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"
        integrity="sha384-JcnsjUPPylna1s1fvi1u12X5qjY5OL56iySh75FdtrwhO/SWXgMjoVqcKyIIWOLk"
        crossorigin="anonymous"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js"
        integrity="sha384-ZZ1pncU3bQe8y31yfZdMFdSpttDoPmOZg2wguVK9almUodir1PghgT0eY7Mrty8H"
        crossorigin="anonymous"></script>
```

### How We Test & Verify It
1. **Normal Operation Test:**
   Open `index.html` in Chrome, open DevTools (`F12` -> `Network` & `Console`), verify all 4 scripts load with HTTP `200 OK` and `0` console errors, and test generating a QR code and downloading the PDF wedding sign.
2. **Tamper Simulation Test (Proof of Protection):**
   Temporarily change a single character in one of the `integrity="sha384-..."` strings in `index.html` and refresh the browser. Verify that Chrome immediately blocks the script and prints:
   `Failed to find a valid digest in the 'integrity' attribute for resource ... The resource has been blocked.`
