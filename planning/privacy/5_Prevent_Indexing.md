# Prevent Indexing Specification

## 1. Objective

This document maps to **Section 5 ("Prevent Indexing / Noindex")** of the `1_privacy_high_level.md` guide.
Its goal is to ensure that private couple event pages (`payment.html` / `/<slug>`) are never indexed by search engines (Google, Bing, etc.) and that private event URLs do not leak to external websites via HTTP referrer headers, while keeping the main public landing page (`index.html`) open for SEO.

## 2. Lean Architectural Design

### Scope Boundary
- **`index.html` (Public Landing Page)**: Remains **indexable** so couples can find `gift4event.com` via search engines.
- **`payment.html` (Private Event Pages)**: Excluded from search engine indexing and referrer leakage.

### Implementation (Frontend Only)
Add two standard `<meta>` tags directly inside the `<head>` of `payment.html`:

```html
<meta name="robots" content="noindex, nofollow">
<meta name="referrer" content="no-referrer">
```

1. **`<meta name="robots" content="noindex, nofollow">`**:
   - Instructs all search engine crawlers not to index the event page and not to follow outgoing links on the page.
   - Because it is hardcoded in the static HTML `<head>`, crawlers see it immediately without needing to execute JavaScript.
2. **`<meta name="referrer" content="no-referrer">`**:
   - Ensures that when a guest clicks an external link on the payment page (Bit, PayBox, or Waze), the browser does not send the private event URL (`gift4event.com/<slug>`) in the `Referer` header to the external service.

## 3. Why No Backend / CDN Changes Are Needed
- **No API Headers Needed**: Backend endpoints (`/api/config/*`, `/api/payment-details/*`) are internal JSON `fetch` calls with no HTML links pointing to them, and the page invoking them is already marked `noindex, nofollow`.
- **No CloudFront Cache Changes Needed**: Keeping CloudFront caching intact preserves performance and minimizes Lambda/DynamoDB invocations.
- **No `410 Gone` Needed**: Expired events continue to display the polite expiration card from Section 3 (`3_time_window.md`) while remaining excluded from search engines via the `<meta name="robots">` tag.
