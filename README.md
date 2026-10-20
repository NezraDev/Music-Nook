# The Music Nook

A responsive, inquiry-based React website built from `MusicNook_instructions`. All work and prepared assets live in this project. The original `images/` folder is preserved; video is outside the requested PNG gallery scope. The Facebook page could not be retrieved, so no history, location, instructor identity, or other facts were inferred from it.

## Run

Use Node 22.12+ (Node 24 also works).

```powershell
npm ci
npm run dev
npm run build
npm run preview
npm test
```

`npm run dev` runs the interface only. For **real local form requests**, copy `.env.example` to `.env`, configure the values below, and run `npx netlify-cli dev`. Use the Netlify Dev address (normally `http://localhost:8888`) as `CONTACT_ALLOWED_ORIGIN`. Vite preview is not a substitute for Netlify Functions. Cloudflare Turnstile is not required.

## Edit content

`src/data.js` is the single source for editable public text, page titles, descriptions, navigation, actions, accessible labels, media, services, FAQs, testimonials, contact details, map settings, and form messages. Sections are documented by their object keys. Keep IDs stable (`piano`, `voice`, `guitar`, `lesson-inquiry`, `general`); query prefilling and server validation share these IDs automatically. Unknown factual fields are empty, with clearly marked display placeholders. Empty contact details never create fake email or phone links.

Components contain layout and behavior. Design tokens live in `src/styles.css`. Server email routing, credentials, and origin restrictions live in environment variables, never in the content file. The form is a message inquiry, without registration, booking, payment, or automatic reservation.

Optional gallery previews, testimonials, stories, and client logos appear only when their arrays contain appropriate entries. Testimonial/logo entries need `publicationPermission: true`. Student photos need that confirmation **and** a real `alt` description replacing the placeholder. Permission is the owner's record of publication authorization, not a consent collection system. The curated gallery currently contains 25 photos from nine named student folders, with `publicationPermission: true`. Captions use the matching folder names. Each gallery card represents one client, and clicking it opens only that client's photos in a slideshow. Other photos are unpublished. Production packaging strips unapproved student PNG files from `dist/images/`, including directly reachable derivatives. Local development contains those source derivatives for owner review; do not expose the development server publicly.

## PNG image preparation

The supplied logo is used without pretending to reproduce it. All 48 supplied photographs (including HEIC sources) have already been converted into losslessly optimized PNG variants, with orientation corrected, metadata removed, maximum dimensions 1600×1600 for larger views and 600×600 for thumbnails. Source aspect ratios are retained without enlargement or face alteration; gallery cards use a consistent centered 3:4 portrait crop, while the zoom view centers the full photo without cropping. The gallery shows one card per client. Clicking a card opens that client's photos in a centered slideshow with left/right arrow controls and a thin progress line; it advances every 6.5 seconds and respects reduced-motion settings. Originals remain under `images/`, outside the published directory. The MOV source is preserved and not published.

For new or changed media, use the isolated Python environment:

```powershell
python -m venv .venv
.venv/Scripts/python -m pip install -r requirements-images.txt
npm run prepare:images
```

On macOS/Linux use `.venv/bin/python` for the installation command. The Node utility selects the appropriate interpreter automatically. `scripts/prepare-images.mjs` handles logo/favicon/share PNGs; `scripts/prepare-photos.py` handles photos, including HEIC. The script writes proposed entries to `scripts/gallery-manifest.json` and leaves data.js, the selected gallery entries, and their permissions untouched. Review the proposed manifest and copy only authorized photos into data.js with an accurate alt description, folder-name caption, category, and permission. The scripts are not browser code. Add generated files only as PNGs under `public/images/`; browser paths start `/images/`. Newly named files use stable sorted source order: adding a source earlier in that order renumbers derived IDs, so review the complete manifest and all associated captions after regeneration.

For an entry, replace `alt` and `caption`, select a category ID from `pages.studentGallery.categories`, confirm `publicationPermission: true`, and set `focalPoint` (for example `50% 35%`) as needed. Keep `width`, `height`, `thumbnailWidth`, and `thumbnailHeight` accurate. Do not publish a folder of unapproved originals. `src/data.js` has no image conversion code.

## At-home lessons and service area

Run `npm run optimize:images` after preparing approved gallery photos. It creates WebP versions of the approved photos, their thumbnails, and the homepage hero, and updates their paths in `src/data.js`. PNG originals and logo artwork stay unchanged. The production image allowlist keeps the referenced optimized files.

Lessons take place in the learner’s home. The learner or family provides the instrument and sheet music used during the lesson. Set `contact.serviceArea` only after the owner confirms where home visits are offered. The Contact page displays that service area as text; it does not publish a private home address or show a fixed-location map.

## Email and abuse protection

The browser posts only to `/.netlify/functions/inquiry`. Configure Netlify environment variables:

- `RESEND_API_KEY`: Resend server key.
- `CONTACT_FROM_EMAIL`: sender on a domain you verified in Resend, with the required DNS records.
- `CONTACT_TO_EMAIL=the.musicnook12@gmail.com`: the lesson inquiry inbox. The handler defaults to this address if the variable is blank. Sender and recipient addresses are server configuration, not browser inputs.
- `CONTACT_ALLOWED_ORIGIN`: exact permitted origin, including protocol and local port when needed; no trailing slash.

The function checks origin, content type, honeypot, streamed request size (16 KB), lengths, allowlisted values, and privacy requirements. Emails include a branded HTML template with escaped visitor content and a plain-text alternative, a fixed recipient/sender, validated visitor `replyTo`, and a generated Resend idempotency key. No full submissions are logged by application code. Resend SDK logs provider errors in local development; use `NODE_ENV=production` for Functions to disable SDK development logging. There is no CAPTCHA or server-side rate limiter; origin checking and the honeypot do not prevent all automated submissions.

Use the Gmail address as the recipient, not as `CONTACT_FROM_EMAIL`. For production, configure the sender using a domain you own and have verified in Resend. Set the server variables in Netlify with Functions scope, then redeploy. Copying `.env.example` alone does not configure the deployed function. Replies to inquiry notifications go to the visitor's email address. Delivery must be checked with a real form submission after deployment; mocked tests do not send mail.

Missing configuration fails with 503 and the editable unavailable message. Provider errors stay out of browser responses. Success means Resend accepted the request; it is not inbox delivery or a lesson booking. The client prevents duplicate pending submissions, retains content after errors, and clears content only on success.

Add the owner-approved privacy notice before launch. Set `forms.inquiry.privacy.approved`, `noticeText` and `noticeUrl`, then set `required` if acknowledgment is required. The draft notice is visible for editing; acknowledgment defaults off because no approved notice was supplied. A required but unapproved notice causes the server to fail closed.

References: [Resend send-email API](https://resend.com/docs/api-reference/emails/send-email), [Turnstile server verification](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/), [Netlify Functions](https://docs.netlify.com/build/functions/overview/).

## Build, search and Netlify deployment

The build configuration sets `NPM_FLAGS=--include=dev` so Netlify installs Vite, Tailwind, and the other build tools even when `NODE_ENV=production` is configured. Keep this flag enabled. If an older deployment failed with `vite: not found`, retry after deploying this configuration and clear the dependency cache if necessary.

`npm run build` bundles with Vite then prerenders meaningful React HTML, headings, links, and metadata for all six routes plus a friendly 404. It uses React Router's StaticRouter with React server rendering; hydration adds interactions. Do not upload only the Vite output before the prerender step completes.

Deploy the repository with `netlify.toml`: build `npm run build`, publish `dist`, functions `netlify/functions`. Configure variables in Netlify and rebuild after changing build-time values. Set `NODE_ENV=production` for Functions. Secrets must never use a `VITE_` prefix. The function route is handled by Netlify before static redirects. Known routes have explicit 200 rewrites to their prerendered files, so refreshes and inquiry query parameters work. Every other path uses `/404.html` with **HTTP 404**, rather than a catch-all successful SPA page. Check actual deployed status codes once a Netlify site exists.

Until launch, leave `SITE_READY=false` and `seo.ready=false`. No placeholder domain is emitted. To prepare production, set `SITE_URL` to the real HTTPS origin (or `seo.siteUrl`), complete the launch checklist, then explicitly set `SITE_READY=true`. Netlify production context is required on Netlify; deploy previews and branch deploys remain noindex regardless. Each page also needs `seo.pages.<id>.indexable=true`. Pages containing visible `[Add…]` or `[Instructor…]` placeholders stay noindex automatically even when global readiness is enabled. Never use a placeholder hostname in SITE_URL.

Build output includes unique page metadata, canonical URLs without query parameters only when a real origin is configured, safe Organization JSON-LD with verified fields only, and approved PNG social metadata. Organization is used because a verified local-business location has not been supplied. `sitemap.xml` is created only with a configured origin and includes only ready indexable routes; an empty sitemap is possible while pages remain drafts. `robots.txt`, page robots tags, and preview response headers keep unfinished content out of search. A preview has a global `X-Robots-Tag: noindex, nofollow`. Canonicals do not make previews indexable. Set optional `SEARCH_CONSOLE_VERIFICATION` (or the content field), then verify the real domain and submit its sitemap in Google Search Console. Google Business Profile creation, verification, and accurate name/address/phone updates are owner tasks and have not been performed. Do not promise search positions or rich results.

## Verification

```powershell
npm test
npm run build
node scripts/verify-build.mjs
node scripts/seo-config-check.mjs
# With npm run dev running on port 5173:
node scripts/browser-check.mjs
node scripts/interaction-check.mjs
# With npm run preview running on port 4173:
node scripts/production-check.mjs
node scripts/performance-check.mjs
```

Browser checks use installed Microsoft Edge via Playwright. Other systems can change `channel: 'msedge'` to their installed Chromium channel. Interaction tests inject temporary in-memory fixtures, never change owner content, and make no real email delivery. They verify service query prefilling and invalid query rejection, menu Escape, required-field errors/focus, gallery filters and distinct client albums, uniform 3:4 portrait cards, centered full-photo slideshows, clickable left/right arrows, progress line, no pause control, keyboard arrows, Escape, focus trapping/return, reduced-motion behavior, home-lesson FAQs, service-area text without a fixed-location map, and mocked submission acceptance/failure. Unit tests verify server rejection paths, provider failures and acceptance, safe text and routing. Audit reports and representative desktop/mobile screenshots are under `.impeccable/review/`.

Actual Resend inbox receipt, live Turnstile authorization, confirmed service-area coverage, Netlify HTTP response headers/statuses, production canonical/domain ownership and Search Console cannot be verified without credentials, deployment access, and verified business information. Scores are local lab measurements, not field Core Web Vitals or ranking guarantees.

## Before launch

- [ ] Replace the home-service introduction/history, founder background, teaching philosophy and community placeholders with owner-approved facts.
- [ ] Supply instructor name, biography, portrait, verified qualifications and experience.
- [ ] Confirm eligible ages/levels, lesson format, duration, schedules, prices or inquiry instructions, benefits and FAQs.
- [ ] Supply contact email/phone, business hours and confirmed service area. Do not publish a private home address.
- [x] Curate the selected student photos and captions. The 25 selected photos across nine client albums use the supplied folder names. No extra names or claims were added. Supply real testimonials/client logos only with permission.
- [ ] Approve a privacy notice, retention arrangements, Turnstile disclosure, and acknowledgment requirements.
- [ ] Verify Resend sender/DNS, configure receiving inbox and Turnstile hostname/origin, then test real successful and failed inquiries.
- [ ] Configure real domain and readiness, inspect every prerendered route, canonical, sitemap, robots and JSON-LD; check production is indexable and previews stay noindex.
- [ ] Deploy to Netlify; verify direct page refreshes, 404 status, function routes and security headers.
- [ ] Set up/update Google Business Profile and Search Console using consistent verified details; submit sitemap.
