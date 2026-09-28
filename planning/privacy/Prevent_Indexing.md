# Prevent Indexing Specification

## 1. Section Reference & Alignment

This architectural design document maps directly to **Section 5 ("Prevent Indexing / Noindex")** of the `privacy_high_level.md` guide. Its primary objective is to guarantee that personal event pages—specifically payment portals containing couple names and event details—do not surface in public search engine results (e.g., Google, Bing, Yahoo). 

The specification is strictly tailored to the existing project architecture, enforcing static DOM metadata definitions within the Vanilla HTML/JS frontend and configuring robust server-side HTTP response headers via the Node.js backend. This strategy enforces search engine exclusion rules across both HTML pages and API endpoints while remaining perfectly lightweight, without relying on framework-specific plugins or heavy external SEO dependencies.

## 2. Core Requirements & Architectural Design

### Indexing Boundary
The indexing boundary encompasses all public-facing event routes, payment portals, and associated API endpoints. The explicit goal is to shield sensitive, personal event pages from public web crawlers. Search engines must be explicitly instructed to discard these URLs from their index, refrain from crawling or following any links, and avoid saving cached copies.

### Multi-Layered Directive Strategy
To guarantee universal compliance across various types of web crawlers (both modern JavaScript-executing bots and simple HTTP fetchers), the system implements an extended defense approach:
1. **DOM-Level Defense**: Hardcoded HTML `<meta name="robots" content="noindex, nofollow, noarchive, nosnippet">` tags in the base document `<head>`.
2. **HTTP Header Defense**: Server-level injection of the `X-Robots-Tag` HTTP response header applied to all relevant document and API requests.
3. **Cache & Referrer Management**: HTTP headers to prevent CDN caching (`Cache-Control`) and URL leakage to third parties (`Referrer-Policy`).

### Target Coverage Scope
The exclusion directives will be universally enforced across:
- **Public Event Views**: The main landing pages for the wedding payment portals.
- **Sensitive JSON API Endpoints**: All backend REST routes serving event data, configuration, or payment details.
- **Expired Events (Time-Windowing)**: Routes for events that have concluded.

## 3. Integration & Flow Guidelines

### Static DOM & Execution Flow (Frontend)
1. **Initial Load**: The browser or crawler requests the Vanilla HTML document for the payment portal.
2. **Hardcoded Meta Tag**: The base `index.html` file includes the strict directive permanently in its `<head>`:
   ```html
   <meta name="robots" content="noindex, nofollow, noarchive, nosnippet">
   ```
   *Why this is crucial*: By hardcoding this into the static HTML rather than injecting it via Vanilla JS, we ensure that even legacy web crawlers or simple scrapers that do not execute JavaScript immediately see the exclusion directive. This approach actually keeps the code leaner than dynamic JS injection.

### HTTP Response Header Pipeline (Backend)
1. **Request Interception**: All incoming requests to the backend API (both for static HTML serving and JSON API routes) pass through a dedicated HTTP header middleware.
2. **Header Appending**: The server automatically appends the following headers to the outgoing HTTP response:
   ```http
   X-Robots-Tag: noindex, nofollow, noarchive, nosnippet
   Cache-Control: no-store, no-cache, must-revalidate, private
   Referrer-Policy: no-referrer
   ```
3. **Defense in Depth**: 
   - **X-Robots-Tag**: Instructs direct API scrapers and non-DOM fetchers to drop the content. The addition of `noarchive` and `nosnippet` ensures Google does not store a cached copy or show text snippets.
   - **Cache-Control**: Forces CDNs (like Cloudflare) and reverse proxies to respect the headers and not serve stale, cached HTML pages that might lack the protective directives.
   - **Referrer-Policy**: Ensures that if a user clicks an external link (e.g., to a banking app), the external server does not receive the private event URL in its logs.

### Time-Windowing Expiration Signals
When an event has passed the designated time window (e.g., 7 days post-event), the backend will stop returning the payment portal or JSON payload and will explicitly return a `410 Gone` HTTP status code. 
- *SEO Impact*: A `410 Gone` acts as a definitive signal to search engines that the content is permanently deleted, prompting immediate removal from the crawl queue and search index.

### Verification & Crawl Budget Guidelines
- **Robots.txt Considerations**: The `robots.txt` file will deliberately *not* use a `Disallow` directive for these sensitive routes. If disallowed, search engines cannot crawl the page to observe the `noindex` tag. By allowing crawling but enforcing `noindex`, search engines will explicitly remove the pages from their indices.
- **Sitemap Exclusion**: Sensitive event URLs must never be generated into XML sitemaps.

## 4. Why This Solution is Ideal

### Security Vulnerabilities Mitigated
- **Public Indexing Exposure**: Prevents public search engines from indexing couple names associated with payment portals.
- **URL Leakage**: The `Referrer-Policy` completely stops the private event URL from leaking to third-party domains via user clicks.
- **OSINT Harvesting & Caching**: Mitigates long-tail Open-Source Intelligence gathering by ensuring that historical caches (`noarchive`) and text snippets (`nosnippet`) never accumulate on public web archives.
- **CDN Misconfigurations**: The strict `Cache-Control` header prevents proxy caches from exposing stale content or bypassing the security directives.

### Step-by-Step Defense Mechanics
1. **HTTP Layer Interception**: A search engine crawler initiates a request to an event URL. Before reading a single byte, it processes the `X-Robots-Tag` and `Cache-Control` headers, immediately dropping the page from its indexing pipeline and bypassing caching servers.
2. **DOM Layer**: If a crawler processes the HTML, the hardcoded `<meta name="robots">` tag reinforces the exclusion directive natively.
3. **End of Life**: Once the event is over, the `410 Gone` status acts as a definitive kill-switch for any lingering crawler attention.

### Trade-off Justification
This approach provides maximum enterprise-grade search engine exclusion without adding *any* external dependencies or heavy logic. Moving from dynamic JS injection to static HTML tags reduces client-side code complexity. Appending a few standard HTTP response headers maintains the lean, Vanilla HTML/JS + Node.js architecture while guaranteeing absolute certainty that personal event data remains strictly private.
