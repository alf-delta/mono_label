# Monoblend Label Studio

The complete label workflow researches a coffee, creates an evidence-based color identity, renders the calibrated label, and generates an imposed vector PDF for production cutting.

The repository is deployment-ready as a single stateless Node.js service. Persistence and authentication remain intentionally out of scope. CMYK and PDF/X remain prepress extensions.

## Run locally

```bash
npm install
cp .env.example .env.local
npm run dev
```

The example environment uses the fixture provider. Open `http://127.0.0.1:5173`.

For live research, put the following in `.env.local` (never prefix the key with `VITE_`):

```dotenv
OPENAI_API_KEY=sk-...
OPENAI_RESEARCH_MODEL=gpt-5.6-sol
OPENAI_CREATIVE_MODEL=gpt-5.6-terra
```

Remove `RESEARCH_PROVIDER=fixture` from that file, then restart `npm run dev`. The key is loaded only by the API process; the browser always calls the same-origin `/api/research` endpoint.

Production-like local run:

```bash
npm run build
npm start
```

Run the complete release gate with:

```bash
npm run check
```

Production environment variables, Docker usage, rollout checks, and operational boundaries are documented in [`DEPLOYMENT.md`](./DEPLOYMENT.md).

Developer calibration mode is available only in a development build:

```text
http://127.0.0.1:5173/?calibrate=1
```

Calibration mode exposes region boxes, a 5 mm grid, numeric geometry controls, font information, live SVG measurements, baseline estimates, and overflow state. Runtime adjustments are intentionally session-only; approved values should be committed to `src/label/templates/coffee-label-v1.ts`.

Development builds also include data fixtures for the calibrated reference, the espresso asset, bounded shrinking, intentionally long copy, and invalid color validation. Select them in the left panel or open them directly:

```text
http://127.0.0.1:5173/?fixture=espresso
http://127.0.0.1:5173/?fixture=shrink
http://127.0.0.1:5173/?fixture=long-copy
http://127.0.0.1:5173/?fixture=invalid-color
```

## Architecture

- `src/types` — renderer-facing domain contracts
- `src/workflow` — identify, researching, source review, error, and label-review states
- `src/research` — shared request/response contracts, strict schemas, prompts, normalization, and browser client
- `src/concept` — coffee-specific color stories, structured palette contracts, print-safe normalization, and reveal UI
- `src/export` — frozen snapshots, outlined SVG conversion, sheet formats, imposition, UI preview, and export client
- `server/research` — swappable OpenAI and deterministic fixture providers
- `server/export` — validated vector SVG-to-PDF compositor and print-mark renderer
- `server/api.ts` — validated, independently rate-limited, no-store HTTP boundary
- `server/api-runtime.ts` — proxy-aware client identity, endpoint budgets, and privacy-preserving OpenAI safety identifiers
- `server/index.ts` — production static and API server
- `src/label/fixtures` — reference, espresso, bounded-shrink, long-copy, and invalid-color developer scenarios
- `src/label/data` — pure input-to-renderer normalization and fixed defaults
- `src/label/state` — current normalized label state boundary
- `src/label/templates` — versioned physical geometry and all layout rules
- `src/label/typography` — replaceable font roles
- `src/label/renderer` — canonical deterministic SVG output
- `src/label/validation` — bounded text fitting, resource checks, and structured validation
- `src/label/editor` — contextual HTML editing controls kept outside the print SVG
- `src/label/calibration` — development-only measurement and geometry tooling
- `src/color` — centralized color rules, metrics, deterministic resolution, and named candidates
- `public/assets/brew` — vector brew method assets
- `public/assets/fonts` — bundled local production fonts

The preview scales with CSS, but the SVG viewBox and template geometry use millimetres. Rendering decisions never depend on the preview size.

## Research safety contract

- Every generated field carries `value`, `confidence`, and source URLs.
- Source URLs not present in the provider's consulted-source metadata are removed.
- A field without a verified source becomes `unknown`; missing values remain `null` through research review.
- Structured model output is treated as a proposal. Strict schemas, verified anchors, and the deterministic color engine remain authoritative.
- Research and color requests have separate eight-call budgets per client per ten minutes; PDF export has a separate twelve-call budget.
- Provider errors return a safe request ID; provider details and keys stay server-side.
- Public OpenAI deployments can send stable HMAC safety identifiers without exposing raw client addresses.

## Bespoke color creation

Research remains factual and does not choose a color. After source review, `Create label` starts a separate structured creative request that produces one recommended direction and three alternatives. Every direction must cite the exact researched variety and at least one additional verified coffee fact. The server rejects unsupported anchors, corrects proposed colors through the deterministic ivory-contrast rules, and requires the final directions to remain visually distinct.

The reveal screen deliberately holds for a short minimum choreography so fast fixture or API responses still produce a clear creation moment. The selected dynamic palette remains available inside Label Review and the chosen print-safe hex is frozen into the export snapshot.

Health check: `GET /api/health`. Research contract: `POST /api/research` with `coffeeName`, `producer`, and optional `additionalInformation`.

## Print export

The export setup supports ISO A4/A3 and US Letter/Tabloid, automatic or manual page orientation, maximum or custom quantities, printer margins, crop marks, guillotine edge guides, and registration targets.

Default maximums with a 5 mm printer margin and all trim/cutter marks enabled:

| Sheet | Maximum | Grid / label rotation |
| --- | ---: | --- |
| A4 | 2 | 1 × 2 / 0° |
| A3 | 8 | 2 × 4 / 0° |
| US Letter | 4 | 2 × 2 / 90° |
| US Tabloid | 8 | 2 × 4 / 0° |

A4 can fit four labels when the printer margin is reduced to the minimum marked clearance of 3.1 mm. Disabling marks allows a borderless four-up layout as well.

The repeated copies use common-cut geometry. This is safe for `coffee-label-v1` because every label is identical, its edge is a uniform background color, and all content remains inside the configured safe area. The PDF contains no editable text or complete-label raster images: font glyphs and brew assets are paths, while backgrounds, dividers, and print marks remain vector shapes. Snapshot metadata records the exact data, template version, export settings, and generation time inside the PDF.

## Reference calibration

The Milestone 1 template is calibrated against the supplied Adobe reference screenshot:

- 107 × 99 mm finished label size
- 2 mm bleed metadata
- `#7A4C5A` background and `#F9F7DE` foreground sampled from the reference
- bundled Montserrat variable font for metadata, title, and net weight
- bundled PP Editorial New Italic for tasting notes
- physical region coordinates recovered from the screenshot's point rulers

The supplied pourover and espresso SVG assets use tight normalized view boxes, so their original square export frames do not affect label sizing. The shared icon region is wide enough for espresso while the taller pourover remains height-constrained through `preserveAspectRatio`.
