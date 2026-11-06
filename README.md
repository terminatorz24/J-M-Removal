# J&M Removal website

Static public website source for **https://jandmremoval.com**. Original logo, approved red/white visual identity and public business facts are preserved. The site uses the existing production Tally form **QoMoPA** and business Gmail; it does not create customer accounts, accept payments or confirm bookings.

## Develop and check

Use the Node version recorded in `.node-version` and the pinned package manager/dependencies in `package.json` and `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm run build
node --test tests/site.test.mjs
```

The build itself uses only Node built-ins and also works with `node build.mjs`. Serve `dist/` through a local HTTP server to review absolute asset paths; opening the generated HTML directly as a `file:` URL is not the supported preview route. The tests validate generated links/assets/metadata, original image hashes, Tally fallback and campaign filtering. Browser/mobile/form-layout checks are additional checks, not implied by the Node test result.

## Edit

- `src/site-data.json`: shared public contact details, production origin, form destination, service/area records and FAQs.
- `src/pages/`: readable page content. Home retains the approved design; the separate service pages explain the actual scope.
- `src/templates/`: shared header, footer and phone action bar.
- `public/assets/site.css`: original visual system and responsive page styles.
- `public/assets/site.mjs`: mobile navigation and bounded campaign-label forwarding only.
- `public/assets/`: original logo, service illustrations and the cleared-room hero illustration. These are illustrations, not completed-job photos.
- `build.mjs`: deterministic page generation and crawler metadata into `dist/`. Only `public/` assets and rendered templates enter the website output.

Keep operational documents, customer records, inbox content, credentials and private upload URLs outside this repository. Genuine reviews/job photos need separate verification and marketing permission before publication. Do not invent prices, availability, insurance/licensing, university endorsement or donation outcomes.

## Estimate integration

The Estimate page embeds `https://tally.so/embed/QoMoPA` and always shows a direct link to `https://tally.so/r/QoMoPA`. It keeps the existing form/schema intact. The plain iframe is rendered directly in HTML and works without JavaScript. JavaScript updates its URL only when allowed campaign labels are present. Tally's `embed.js` is omitted because that widget forwards all page query parameters. Cross-site referrers contain only the website origin, not its path or query. The usable fixed height is 2300px on larger screens and 2900px on phones; normal iframe scrolling remains available when form content is longer. The direct link is the fallback for blocked embeds or inconvenient nested scrolling. No custom resize messages are trusted.

Only `utm_source`, `utm_medium` and `utm_campaign` are carried through internal links and into the form. A label must appear once, be 1–100 characters, start with an ASCII letter/number, and contain only ASCII letters/numbers, spaces, `.`, `_`, `~` or `-`. Unknown parameters, duplicate labels, email/URL-like values and controls are not forwarded. Do not put personal data in campaign labels. No cookies or browser storage are used to persist attribution; it follows the current navigation chain. JavaScript-disabled navigation does not preserve these optional labels.

The official Tally documentation supports a standard iframe and URL-based hidden fields: [Embedding](https://tally.so/help/embed-your-form), [Hidden fields](https://tally.so/help/hidden-fields). The existing downstream intake captures returned hidden values in restricted source detail. Local URL tests do not prove a new submitted lead or an end-to-end attribution result; avoid extra test submissions or owner notifications without the coordinated test procedure.

The estimate page omits the fixed mobile action bar so it cannot cover the form or on-screen keyboard. Calls, texts and social DMs remain manual. Photos are optional, with the existing 10 MB per-file limit and Gmail/phone fallback. A request is not a booking.

## Publish and rollback

The production host is **Cloudflare Pages**, project `j-m-removal`, connected to this repository's `main` branch through the existing Cloudflare GitHub app. Cloudflare runs `pnpm run build` and publishes only `dist/`. New approved commits on `main` trigger automatic builds; other branches can provide previews. The Pages integration does not require a custom build API token. Do not publish an unreviewed production branch. Preserve unrelated DNS and email records. Verify the real domain, HTTPS, links and form after publication.

Use `pnpm run preview` for a local Pages preview. Normal releases use the GitHub integration. `pnpm run deploy` is an optional manual Pages deployment command and requires separately configured Pages-authorized credentials; it is not part of routine maintenance. The Wrangler configuration contains no database, storage or server-function bindings. Do not use `wrangler deploy`, which targets a different Cloudflare hosting product.

For rollback, restore the known-good Cloudflare deployment **and** revert/fix the corresponding Git commit so the next build cannot restore the bad version. Record the release commit/version and actual live checks in the coordinator's release evidence. The source files alone do not prove deployment.

No advertising pixel, GA4, Tag Manager or analytics beacon is bundled here. If the coordinator enables Cloudflare Web Analytics, record that separately and review the privacy text against the actual configuration.
