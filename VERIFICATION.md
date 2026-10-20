# Verification — 20 October 2026

Implementation is complete for local review and Netlify deployment. Publication still requires owner content and integration configuration; no external site was deployed.

Passed:

- Production build with five prerendered routes and a 404 document.
- Unique titles/descriptions, one h1 per route, crawlable internal links, JSON-LD parsing and valid deployed asset paths.
- Configured-domain test: absolute canonicals without contact query strings, preview noindex headers, sitemap exclusion of drafts, and placeholder pages kept noindex in production. Test domain was removed from final output.
- Production hydration on every route, direct inquiry URLs, and trailing-slash variants with no runtime errors.
- Four server/form tests covering validation, request limits, permission gating, missing configuration, safe text email, fixed routing, provider acceptance and rejection, and challenge rejection. Provider requests were mocked; no real email was sent.
- Browser interaction checks: desktop/mobile menu, Escape, inquiry preselection and invalid query rejection, required errors and focus, unavailable configuration, preserved inputs after failure, mocked successful submission, gallery category filtering and client album grouping, uniform 3:4 portrait cards, centered full-photo slides, each album's auto-advancing slideshow with clickable left/right arrows and a line indicator, no pause control, reduced-motion behavior, dialog arrows/Escape/focus trap and return, valid map initialization, missing-coordinate placeholder, and map network-error recovery.
- Automated WCAG A/AA checks across all five routes: zero reported violations. Layout checks at 320, 390, 768 and 1440 pixels: no horizontal overflow. Homepage and per-client slideshow desktop/mobile screenshots were visually inspected; an independent source-and-capture review found no material UI issues.
- Local production preview returns 200 for known routes and 404 for an unknown route. Actual Netlify response behavior remains a post-deployment check.
- All 48 supplied photos were converted into PNG variants; original sources are preserved. Twenty-five selected photos across nine named client folders display with captions from their matching folder names. Remaining media is excluded from the deployment directory.

Latest mobile Lighthouse laboratory run: performance 96, accessibility 100, best practices 100, SEO 66. SEO is intentionally reduced by draft noindex. FCP 1.8 s, LCP 2.6 s, total blocking time 0 ms, CLS 0.002. Reports are in `.impeccable/review/`. Remaining lab suggestions concern framework JavaScript, PNG image transfer and the font/style request chain; the large map library is deferred and absent from unrelated routes. These are local measurements, not field metrics or ranking guarantees.

Not verified live: Resend sender/DNS and inbox receipt, production Turnstile authorization, actual studio location/directions, provider account allowances, Netlify deployment headers/statuses, real production canonical/domain ownership, Search Console and Google Business Profile. No credentials or verified business/location details were supplied. Facebook was inaccessible and was not treated as reviewed evidence.

Before launch, complete the owner checklist in README.md. Public copy stays editable in src/data.js. The 25 curated photos are enabled, with captions matching their source folders. Other photos, testimonials, and logos remain disabled pending permission. No business history, credentials, prices, student outcomes, reviews or location were invented.
