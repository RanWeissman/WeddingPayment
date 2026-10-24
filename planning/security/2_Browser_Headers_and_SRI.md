# Browser Security Headers & Subresource Integrity (SRI) Specification

## 1. Section Reference & Alignment
This specification aligns with **Sections 1 & 2** of [`1_security_high_level.md`](./1_security_high_level.md):
1. **CloudFront HTTP Security Headers (`Response Headers Policy`)**
2. **Subresource Integrity (`SRI`) for External Scripts**

Its objective is to harden client-side browser security and resolve the key findings from the Mozilla HTTP Observatory scan (`HSTS`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, and `SRI`) with zero cost (`$0.00`) and zero breaking changes to the Vanilla HTML/JS + Tailwind CDN frontend.

---

## 2. CloudFront HTTP Security Headers (`terraform/main.tf`)

### Architectural Design
Instead of writing a custom CloudFront Function or maintaining manual header blocks, we attach the official **AWS Managed `SecurityHeadersPolicy`** (`67f7725c-6f97-4210-82d7-5512b31e9d03`) to the `default_cache_behavior` of `aws_cloudfront_distribution.cdn`.

### Headers Applied Automatically by AWS Managed Policy
| HTTP Header | Value Set by Policy | Security Purpose |
| :--- | :--- | :--- |
| `Strict-Transport-Security` | `max-age=31536000` | Enforces HTTPS connections (`HSTS`) and prevents SSL stripping / downgrade attacks. |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents external malicious domains from framing the site in an `<iframe>` (`Clickjacking` protection). |
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from MIME-sniffing responses away from the declared `Content-Type`. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Strips URL paths and query parameters from the `Referer` header when navigating to external origins (e.g., Bit / PayBox). |
| `X-XSS-Protection` | `1; mode=block` | Legacy browser XSS filter protection. |

### Terraform Implementation (`terraform/main.tf`)
Inside `resource "aws_cloudfront_distribution" "cdn"`, update `default_cache_behavior`:
```hcl
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = aws_s3_bucket.website.id

    viewer_protocol_policy     = "redirect-to-https"
    compress                   = true
    cache_policy_id            = aws_cloudfront_cache_policy.query_strings.id
    response_headers_policy_id = "67f7725c-6f97-4210-82d7-5512b31e9d03" # Managed-SecurityHeadersPolicy

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.router.arn
    }
  }
```

---

## 3. Subresource Integrity (`SRI`) for External Scripts (`index.html`)

### Architectural Design
`index.html` loads four pinned third-party libraries from `cdnjs.cloudflare.com` and `cdn.jsdelivr.net`. Adding `integrity="sha384-..."` and `crossorigin="anonymous"` ensures the browser cryptographically verifies each script before execution.

*(Note: `https://cdn.tailwindcss.com` is a dynamic JIT script and is intentionally excluded from SRI).*

### Target Libraries in `index.html`
1. `https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js`
2. `https://cdn.jsdelivr.net/npm/jsqr@1.4.0/dist/jsQR.min.js`
3. `https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js`
4. `https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js`

### Implementation Guidelines
Generate the exact SHA-384 base64 digest for each of the 4 URLs above and update lines 10–13 in `index.html` with `integrity="sha384-..." crossorigin="anonymous"`.
